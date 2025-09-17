const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const { SolanaService } = require('./solana-service');
const { EmissionsController } = require('./emissions-controller');
const { AuthService } = require('./auth-service');
const TransactionVerifier = require('./transaction-verifier');
const { DatabaseService } = require('./supabase-client');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize services
const solanaService = new SolanaService();
const authService = new AuthService();
const transactionVerifier = new TransactionVerifier();
const db = new DatabaseService();

// Global state (will be loaded from database)
let globalBurned = 0;
let initialCirculating = 1000000;

// Emissions controller (single source of truth)
const EMISSIONS_CONFIG = Object.freeze({ SEASON_DAYS: 7, TARGET_BLOCK_INTERVAL_SEC: 10, TOTAL_EMISSION: 210_000_000, HALVING_EPOCHS: 4 });
const emissions = new EmissionsController(EMISSIONS_CONFIG);
let seasonEnded = false;

// Rig tiers - Priced so users need 100+ blocks to recover costs
// With base network hashrate 100 TH/s and 50 BTC reward per block
// A rig with 10 TH/s gets 10% share = 5 BTC per block
// To recover 500 BTC cost = 100 blocks needed
// Base rig definitions (hashrate/uptime/static metadata). Price is computed dynamically
const RIG_TIERS = [
  {
    id: 'antminer-s9',
    name: 'Antminer S9',
    hashrate: 13.5, // TH/s
    priceBTC_SPL: 675, // 13.5/100 * 50 * 100 blocks = 675 BTC
    uptime: 0.95,
    maxQuality: 100,
    description: 'Entry-level mining rig from 2016.',
    category: 'basic'
  },
  {
    id: 'antminer-s19-pro',
    name: 'Antminer S19 Pro',
    hashrate: 110, // TH/s  
    priceBTC_SPL: 5500, // 110/100 * 50 * 100 blocks = 5500 BTC
    uptime: 0.97,
    maxQuality: 100,
    description: 'High-performance mining rig.',
    category: 'advanced'
  },
  {
    id: 'whatsminer-m30s',
    name: 'WhatsMiner M30S++',
    hashrate: 112, // TH/s
    priceBTC_SPL: 5600, // 112/100 * 50 * 100 blocks = 5600 BTC
    uptime: 0.94,
    maxQuality: 100,
    description: 'Professional-grade mining rig.',
    category: 'professional'
  },
  {
    id: 'golden-dragon',
    name: 'Golden Dragon Miner',
    hashrate: 250, // TH/s
    priceBTC_SPL: 12500, // 250/100 * 50 * 100 blocks = 12500 BTC
    uptime: 0.99,
    maxQuality: 100,
    description: 'Legendary mining rig with premium components.',
    category: 'legendary'
  }
];

// Dynamic pricing: peg prices to current block reward to keep ROI consistent
const PRICE_UNITS_PER_TIER = {
  basic: 1200,
  advanced: 7000,
  professional: 15000,
  legendary: 30000
};

const getDynamicRigTiers = (currentReward) => {
  return RIG_TIERS.map((tier) => ({
    ...tier,
    priceBTC_SPL: Math.round(PRICE_UNITS_PER_TIER[tier.category] * currentReward)
  }));
};

// Mining state
let blocks = [];
let currentHeight = 0;
let difficulty = 1000000;
let avgBlockTime = 10;
let lastBlockTime = Date.now(); // Will be updated to game time after initialization

// Game clock - starts at January 1, 2009 00:00:00 UTC
const GAME_START_TIME = new Date('2009-01-01T00:00:00Z').getTime();
const REAL_START_TIME = Date.now();
const TIME_ACCELERATION = 43200; // 1 day (86400s) per 2 seconds = 43200x speed

const getGameTime = () => {
  const realElapsed = Date.now() - REAL_START_TIME;
  const gameElapsed = realElapsed * TIME_ACCELERATION;
  return GAME_START_TIME + gameElapsed;
};

// Initialize game time for lastBlockTime
lastBlockTime = getGameTime();

// Helper functions
const getSessionId = (req) => req.headers['x-session-id'] || 'demo-user';

const getUser = async (sessionId) => {
  try {
    let user = await db.getUserBySessionId(sessionId);
    
    if (!user) {
      // Create new user
      user = await db.createUser(sessionId, 15000);
    }
    
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

const calculateUserEHR = async (userId) => {
  try {
    const rigs = await db.getUserRigs(userId);
    return rigs
      .filter(rig => rig.is_active && rig.quality > 0)
      .reduce((total, rig) => {
        const qualityMultiplier = rig.quality / 100;
        const tierData = rig.tier_data;
        return total + (tierData.hashrate * rig.uptime * qualityMultiplier);
      }, 0);
  } catch (error) {
    console.error('Error calculating user EHR:', error);
    return 0;
  }
};

const calculateNetworkHashrate = async () => {
  try {
    // For now, return a base hashrate. In the future, we could cache this or calculate from all users
    return Math.max(100, 100); // Base network hashrate
  } catch (error) {
    console.error('Error calculating network hashrate:', error);
    return 100;
  }
};

// Initialize global state from database
const initializeGlobalState = async () => {
  try {
    const stats = await db.getGlobalStats();
    globalBurned = stats.global_burned || 0;
    initialCirculating = stats.circulating_supply || 1000000;
    console.log(`Loaded global state: burned=${globalBurned}, circulating=${initialCirculating}`);
  } catch (error) {
    console.error('Error initializing global state:', error);
  }
};

// Quality degradation system
const degradeRigQuality = (rig) => {
  const now = getGameTime();
  const hoursSinceLastMaintenance = (now - rig.lastMaintenanceAt) / (1000 * 60 * 60);
  
  // Degrade quality by 0.5% per hour of operation
  const degradationRate = 0.5; // % per hour
  const qualityLoss = hoursSinceLastMaintenance * degradationRate;
  
  rig.quality = Math.max(0, rig.quality - qualityLoss);
  
  // Update last check time
  rig.lastMaintenanceAt = now;
  
  return rig.quality;
};

// Update all rig qualities
const updateAllRigQualities = () => {
  for (const [userId, rigs] of userRigs.entries()) {
    rigs.forEach(rig => {
      if (rig.isActive) {
        degradeRigQuality(rig);
      }
    });
  }
};

const generateHash = (input) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(input + Math.random()).digest('hex');
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/], methods: ['GET','POST'], allowedHeaders: ['Content-Type','x-session-id'] }));
app.use(express.json({ limit: '256kb' }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 180 }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: getGameTime() });
});

// Treasury balance endpoint
app.get('/api/treasury/balance', async (req, res) => {
  try {
    const balance = await transactionVerifier.getTreasuryBalance();
    res.json({ 
      balance,
      address: 'BDdRt5y7nS6iMfgHqNwU6zqVMWZ9KBuDDt17YCYkDMiN',
      timestamp: getGameTime()
    });
  } catch (error) {
    console.error('Error fetching treasury balance:', error);
    res.status(500).json({ error: 'Failed to fetch treasury balance' });
  }
});

// Transaction verification endpoint
app.post('/api/verify/transaction', async (req, res) => {
  try {
    const { signature, type, amount, userWallet } = req.body;
    
    if (!signature || !type || !amount || !userWallet) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let verification;
    if (type === 'deposit') {
      verification = await transactionVerifier.verifyDeposit(signature, amount, userWallet);
    } else if (type === 'withdrawal') {
      verification = await transactionVerifier.verifyWithdrawal(signature, amount, userWallet);
    } else {
      return res.status(400).json({ error: 'Invalid transaction type. Must be "deposit" or "withdrawal"' });
    }

    res.json(verification);
  } catch (error) {
    console.error('Error verifying transaction:', error);
    res.status(500).json({ error: 'Transaction verification failed', details: error.message });
  }
});

app.get('/api/telemetry', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const user = await getUser(sessionId);
    const userEHR = await calculateUserEHR(user.id);
    const et = emissions.getTelemetry(currentHeight);
    const nextHalvingHeight = seasonEnded ? null : (typeof et.nextHalvingIn === 'number' ? currentHeight + et.nextHalvingIn : null);
    const blocksRemaining = et.blocksRemaining;
    const currentReward = seasonEnded ? 0 : et.currentReward;
    const networkHashrate = await calculateNetworkHashrate();

    res.json({
      height: currentHeight,
      timestamp: getGameTime(),
      gameTime: getGameTime(),
      difficulty,
      networkHashrate,
      avgBlockTime,
      currentReward,
      nextHalvingHeight,
      blocksUntilRetarget: 2016 - (currentHeight % 2016),
      totalBlocksRecentBuffered: blocks.length,
      globalBurned,
      circulatingSupply: initialCirculating - globalBurned,
      yourEHR: userEHR,
      emissions: {
        totalEmission: EMISSIONS_CONFIG.TOTAL_EMISSION,
        emittedTotal: et.emittedTotal,
        remaining: et.remaining,
        totalBlocks: et.totalBlocks,
        blocksRemaining: et.blocksRemaining,
        halvingEpochs: EMISSIONS_CONFIG.HALVING_EPOCHS,
        epochIndex: et.epochIndex,
        epochLenBase: et.epochLen,
        epochLenLast: et.epochLen,
        halvingHeights: et.halvingHeights
      },
      seasonEnded
    });
  } catch (error) {
    console.error('Error in telemetry endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const user = await getUser(sessionId);
    const rigs = await db.getUserRigs(user.id);
    const ehr = await calculateUserEHR(user.id);
    
    res.json({
      user: {
        id: user.id,
        balances: user.balances,
        totalEarned: user.total_earned
      },
      rigs,
      ehr
    });
  } catch (error) {
    console.error('Error in user endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/rigs/tiers', (req, res) => {
  const et = emissions.getTelemetry(currentHeight);
  const tiers = getDynamicRigTiers(et.currentReward);
  res.json(tiers);
});

app.post('/api/rigs/buy', async (req, res) => {
  try {
    const { tierId, idempotencyKey = uuidv4() } = req.body;
    const sessionId = getSessionId(req);
    const user = await getUser(sessionId);
    
    if (!tierId) {
      return res.status(400).json({ error: 'tierId is required' });
    }

    const et = emissions.getTelemetry(currentHeight);
    const dynamicTiers = getDynamicRigTiers(et.currentReward);
    const rigTier = dynamicTiers.find(tier => tier.id === tierId);
    if (!rigTier) {
      return res.status(400).json({ error: 'Rig tier not found' });
    }

    if (user.balances.BTC_SPL < rigTier.priceBTC_SPL) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct balance and update user
    const newBalances = { ...user.balances };
    newBalances.BTC_SPL -= rigTier.priceBTC_SPL;
    await db.updateUserBalance(user.id, newBalances);

    // Update global stats
    globalBurned += rigTier.priceBTC_SPL;
    await db.updateGlobalStats(globalBurned, initialCirculating - globalBurned);

    // Create rig in database
    const rigData = {
      tierId: rigTier.id,
      tier: rigTier,
      purchasedAt: getGameTime(),
      uptime: rigTier.uptime,
      quality: rigTier.maxQuality,
      lastMaintenanceAt: getGameTime(),
      isActive: true
    };

    const userRig = await db.createRig(user.id, rigData);

    // Queue on-chain burn (async)
    solanaService.burnTokens(rigTier.priceBTC_SPL, user.id, 'rig_purchase')
      .then(burnResult => {
        if (burnResult.success) {
          console.log(`🔥 Burned ${rigTier.priceBTC_SPL} $BTC SPL on-chain: ${burnResult.txSignature}`);
        } else {
          console.error('Burn failed:', burnResult.error);
        }
      })
      .catch(console.error);

    res.json({
      rig: userRig,
      newBalance: newBalances.BTC_SPL,
      globalBurned,
      circulatingSupply: initialCirculating - globalBurned,
      burnQueued: true
    });
  } catch (error) {
    console.error('Error buying rig:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await db.getLeaderboard(limit);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Repair rig endpoint
app.post('/api/rigs/repair', (req, res) => {
  const { rigId } = req.body;
  const sessionId = getSessionId(req);
  const user = getUser(sessionId);
  
  if (!rigId) {
    return res.status(400).json({ error: 'rigId is required' });
  }

  const rigs = userRigs.get(user.id) || [];
  const rig = rigs.find(r => r.id === rigId);
  
  if (!rig) {
    return res.status(404).json({ error: 'Rig not found' });
  }

  // Calculate repair cost based on quality loss
  const qualityLoss = 100 - rig.quality;
  const repairCost = Math.ceil(qualityLoss * rig.tier.priceBTC_SPL * 0.005); // 0.5% of original price per quality point
  
  if (user.balances.BTC_SPL < repairCost) {
    return res.status(400).json({ 
      error: 'Insufficient balance', 
      required: repairCost,
      current: user.balances.BTC_SPL 
    });
  }

  // Deduct repair cost
  user.balances.BTC_SPL -= repairCost;
  globalBurned += repairCost;
  
  // Restore quality to 100%
  rig.quality = 100;
  rig.lastMaintenanceAt = getGameTime();
  
  // Queue on-chain burn for repair cost
  solanaService.burnTokens(repairCost, user.id, 'rig_repair')
    .then(burnResult => {
      if (burnResult.success) {
        console.log(`🔧 Repaired rig ${rigId}, burned ${repairCost} $BTC SPL: ${burnResult.txSignature}`);
      }
    })
    .catch(err => {
      console.error('Repair burn failed:', err.message);
    });

  res.json({
    rig: {
      ...rig,
      quality: rig.quality
    },
    repairCost,
    newBalance: user.balances.BTC_SPL,
    globalBurned,
    circulatingSupply: initialCirculating - globalBurned
  });
});

// Authentication endpoints
app.post('/auth/nonce', (req, res) => {
  const { walletAddress } = req.body;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  try {
    const { nonce, message } = authService.generateNonce(walletAddress);
    res.json({ nonce, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/auth/verify', (req, res) => {
  const { walletAddress, signature, message } = req.body;
  
  if (!walletAddress || !signature || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = authService.verifySignature(walletAddress, signature, message);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

// Payment endpoints
app.post('/api/payments/custody-address', (req, res) => {
  const { currency } = req.body;
  
  if (currency === 'SOL') {
    res.json({
      custodyAddress: 'BDdRt5y7nS6iMfgHqNwU6zqVMWZ9KBuDDt17YCYkDMiN', // Treasury wallet
      memo: `deposit_${getGameTime()}`
    });
  } else if (currency === 'BTC_SPL') {
    res.json({
      custodyAddress: 'BDdRt5y7nS6iMfgHqNwU6zqVMWZ9KBuDDt17YCYkDMiN', // Treasury wallet
      memo: `deposit_${getGameTime()}`
    });
  } else {
    res.status(400).json({ error: 'Unsupported currency' });
  }
});

app.post('/api/payments/deposit/confirm', async (req, res) => {
  try {
    const { signature, amount, currency, memo, userWallet } = req.body || {};
    if (typeof signature !== 'string' || !signature) return res.status(400).json({ error: 'signature required' });
    if (typeof userWallet !== 'string' || !userWallet) return res.status(400).json({ error: 'userWallet required' });
    const depositAmount = Number(amount);
    if (!Number.isFinite(depositAmount) || depositAmount <= 0) return res.status(400).json({ error: 'amount must be > 0' });
    const sessionId = getSessionId(req);
    const user = getUser(sessionId);
    
    if (!signature || !amount || !currency || !userWallet) {
      return res.status(400).json({ error: 'Missing required fields: signature, amount, currency, userWallet' });
    }

    if (currency !== 'BTC_SPL') {
      return res.status(400).json({ error: 'Only BTC_SPL deposits supported' });
    }

    // Verify the transaction on-chain using Helius
    console.log(`🔍 Verifying deposit: ${signature} for ${amount} $BTC SPL from ${userWallet}`);
    const verification = await transactionVerifier.verifyDeposit(signature, amount, userWallet);
    
    if (!verification.verified) {
      console.log(`❌ Deposit verification failed: ${verification.error}`);
      return res.status(400).json({ 
        error: 'Transaction verification failed', 
        details: verification.error 
      });
    }

    // Credit user balance with verified amount
    user.balances.BTC_SPL += verification.amount;
    
    console.log(`✅ Verified deposit: ${verification.amount} $BTC SPL for user ${sessionId} - Tx: ${signature}`);
    
    res.json({ 
      success: true, 
      verifiedAmount: verification.amount,
      newBalance: user.balances.BTC_SPL,
      blockTime: verification.blockTime,
      signature: verification.signature
    });

  } catch (error) {
    console.error('Error confirming deposit:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/api/payments/deposit/status', (req, res) => {
  const { orderId } = req.query;
  
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID required' });
  }

  const deposit = solanaService.getDepositStatus(orderId);
  
  if (!deposit) {
    return res.status(404).json({ error: 'Deposit not found' });
  }

  res.json(deposit);
});

app.post('/api/payments/withdraw/prepare', (req, res) => {
  const { currency, amount, toPubkey } = req.body;
  const sessionId = getSessionId(req);
  const user = getUser(sessionId);
  
  if (!currency || !amount) {
    return res.status(400).json({ error: 'Currency and amount required' });
  }

  if (user.balances.BTC_SPL < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // Return withdrawal details for frontend to create transaction
  res.json({
    custodyAddress: 'BDdRt5y7nS6iMfgHqNwU6zqVMWZ9KBuDDt17YCYkDMiN', // Treasury wallet for all currencies
    amount,
    currency,
    userBalance: user.balances.BTC_SPL
  });
});

app.post('/api/payments/withdraw/confirm', async (req, res) => {
  try {
    const { signature, amount, toPubkey, userWallet } = req.body;
    const sessionId = getSessionId(req);
    const user = getUser(sessionId);
    
    if (!signature || !amount || !toPubkey || !userWallet) {
      return res.status(400).json({ error: 'Missing required fields: signature, amount, toPubkey, userWallet' });
    }

    // Verify the transaction on-chain using Helius
    console.log(`🔍 Verifying withdrawal: ${signature} for ${amount} $BTC SPL to ${toPubkey}`);
    const verification = await transactionVerifier.verifyWithdrawal(signature, amount, userWallet);
    
    if (!verification.verified) {
      console.log(`❌ Withdrawal verification failed: ${verification.error}`);
      return res.status(400).json({ 
        error: 'Transaction verification failed', 
        details: verification.error 
      });
    }

    // Check user has sufficient balance before deducting
    if (user.balances.BTC_SPL < verification.amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct verified amount from user balance
    user.balances.BTC_SPL -= verification.amount;
    
    console.log(`✅ Verified withdrawal: ${verification.amount} $BTC SPL for user ${sessionId} to ${toPubkey} - Tx: ${signature}`);
    
    res.json({ 
      success: true, 
      verifiedAmount: verification.amount,
      newBalance: user.balances.BTC_SPL,
      blockTime: verification.blockTime,
      signature: verification.signature
    });

  } catch (error) {
    console.error('Error confirming withdrawal:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// New: Direct withdrawal processed by custody wallet
// Deducts user balance, then sends $BTC SPL from custody to requested address
app.post('/api/payments/withdraw', async (req, res) => {
  try {
    const { amount, toPubkey } = req.body || {};
    const sessionId = getSessionId(req);
    const user = getUser(sessionId);

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!toPubkey) {
      return res.status(400).json({ error: 'Destination address (toPubkey) required' });
    }

    if (user.balances.BTC_SPL < withdrawAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Try immediate on-chain transfer from custody to user
    const result = await solanaService.createWithdrawal(
      user.id,
      'BTC_SPL',
      withdrawAmount,
      toPubkey
    );

    if (result.success && result.txSignature) {
      // Immediate success: deduct balance and return signature
      user.balances.BTC_SPL -= withdrawAmount;
      return res.json({ success: true, signature: result.txSignature, amount: withdrawAmount, toPubkey });
    }

    if (result.success && result.queued) {
      // Custody lacks liquidity now; queue withdrawal and confirm to user
      // Balance is NOT deducted until processed, so user can retry later
      return res.json({ success: true, queued: true, withdrawalId: result.withdrawalId, reason: result.reason });
    }

    return res.status(500).json({ error: result.error || 'Withdrawal failed' });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Webhook for Solana transaction confirmations
app.post('/webhooks/solana', (req, res) => {
  // TODO: Implement webhook signature verification
  const { signature, memo, amount, currency } = req.body;
  
  try {
    // Extract order ID from memo
    const orderId = memo.replace('deposit_', '');
    
    const result = solanaService.confirmDeposit(orderId, signature, amount);
    
    if (result.success) {
      // Credit user balance
      const deposit = result.deposit;
      const user = getUser(deposit.userId);
      
      if (currency === 'BTC_SPL') {
        user.balances.BTC_SPL += amount;
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoints
app.get('/api/admin/custody-balances', async (req, res) => {
  try {
    const balances = await solanaService.getCustodyBalances();
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple block mining simulation
const mineBlock = () => {
  // Determine subsidy for the upcoming block using height-based schedule
  let subsidy = seasonEnded ? 0 : emissions.getCurrentReward(currentHeight);
  subsidy = emissions.clipToTotal(subsidy);
  if (seasonEnded || emissions.hasEnded(currentHeight) || subsidy <= 0) {
    seasonEnded = true;
    return; // Stop producing blocks when season ends
  }

  currentHeight++;
  const now = getGameTime();
  const totalFees = Math.random() * 0.01;
  const txCount = Math.floor(Math.random() * 1000) + 100;
  
  // Update rig qualities (degradation over time)
  updateAllRigQualities();
  
  // Generate transactions
  const transactions = [];
  for (let i = 0; i < Math.min(txCount, 10); i++) {
    transactions.push({
      id: generateHash(`tx-${i}-${now}`),
      amount: Math.random() * 10,
      fee: Math.random() * 0.001,
      from: generateHash(`from-${i}`).substring(0, 8),
      to: generateHash(`to-${i}`).substring(0, 8)
    });
  }
  
  const block = {
    height: currentHeight,
    timestamp: now,
    hash: generateHash(`block-${currentHeight}`),
    previousHash: blocks.length > 0 ? blocks[blocks.length - 1].hash : '0'.repeat(64),
    difficulty: difficulty,
    reward: subsidy + totalFees,
    subsidy,
    txCount,
    totalFees,
    isOrphan: Math.random() < 0.02,
    workTarget: (BigInt('0x00000000FFFF0000000000000000000000000000000000000000000000000000') / BigInt(Math.floor(difficulty))).toString(16).padStart(64, '0'),
    transactions
  };

  blocks.push(block);
  if (blocks.length > 500) {
    blocks = blocks.slice(-500);
  }

  // Accumulate emissions and check season end
  emissions.incrementEmitted(subsidy);
  if (emissions.hasEnded(currentHeight)) seasonEnded = true;

  // Distribute rewards (subsidy + fees)
  const networkHashrate = calculateNetworkHashrate();
  for (const user of users.values()) {
    const userEHR = calculateUserEHR(user.id);
    if (userEHR > 0) {
      const userShare = userEHR / networkHashrate;
      const userReward = (subsidy + totalFees) * userShare;
      user.balances.BTC_SPL += userReward;
      user.totalEarned += userReward;
    }
  }

  // Broadcast to WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: 'block',
        data: block
      }));
    }
  });

  console.log(`Mined block ${currentHeight} | Subsidy ${subsidy.toFixed(6)} | Emitted ${emissions.emittedTotal.toFixed(2)}/${EMISSIONS_CONFIG.TOTAL_EMISSION}`);
};

app.get('/api/blocks', (req, res) => {
  const cursor = parseInt(req.query.cursor) || 0;
  const limit = parseInt(req.query.limit) || 20;
  
  const startIndex = cursor ? Math.max(0, blocks.length - cursor) : 0;
  const resultBlocks = blocks
    .slice(startIndex, startIndex + limit)
    .reverse();
    
  res.json({
    blocks: resultBlocks,
    hasMore: resultBlocks.length === limit
  });
});

app.get('/api/block/:height', (req, res) => {
  const height = parseInt(req.params.height);
  const block = blocks.find(b => b.height === height);
  
  if (!block) {
    return res.status(404).json({ error: 'Block not found' });
  }
  
  res.json(block);
});

// Emissions preview endpoint for transparency
app.get('/api/emissions/preview', (req, res) => {
  res.json(emissions.getPreview());
});

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start mining simulation
setInterval(() => {
  if (!seasonEnded && Math.random() < (1 / EMISSIONS_CONFIG.TARGET_BLOCK_INTERVAL_SEC)) {
    mineBlock();
  }
  
  // Broadcast telemetry
  const et = emissions.getTelemetry(currentHeight);
  const nextHalvingHeight = seasonEnded ? null : (typeof et.nextHalvingIn === 'number' ? currentHeight + et.nextHalvingIn : null);

  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: 'telemetry',
        data: {
          height: currentHeight,
          timestamp: getGameTime(),
          difficulty,
          networkHashrate: calculateNetworkHashrate(),
          avgBlockTime,
          currentReward: seasonEnded ? 0 : et.currentReward,
          nextHalvingHeight,
          blocksUntilRetarget: 2016 - (currentHeight % 2016),
          totalBlocksRecentBuffered: blocks.length,
          globalBurned,
          circulatingSupply: initialCirculating - globalBurned,
          emissions: {
            totalEmission: EMISSIONS_CONFIG.TOTAL_EMISSION,
            emittedTotal: et.emittedTotal,
            remaining: et.remaining,
            totalBlocks: et.totalBlocks,
            blocksRemaining: et.blocksRemaining,
            halvingEpochs: EMISSIONS_CONFIG.HALVING_EPOCHS,
            epochIndex: et.epochIndex,
            epochLenBase: et.epochLen,
            epochLenLast: et.epochLen,
            halvingHeights: et.halvingHeights
          },
          seasonEnded
        }
      }));
    }
  });
}, 1000);

const PORT = process.env.PORT || 3001;

// Initialize the server
const startServer = async () => {
  try {
    // Initialize global state from database
    await initializeGlobalState();
    
    server.listen(PORT, () => {
      console.log(`Mining simulator backend running on port ${PORT}`);
      console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
      console.log(`REST API: http://localhost:${PORT}/api`);
      console.log(`Database: Connected to Supabase`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});
