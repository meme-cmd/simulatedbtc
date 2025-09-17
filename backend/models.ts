import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  sessionId: string;
  balances: {
    BTC_SPL: number;
  };
  totalEarned: number;
  createdAt: number;
}

export interface RigTier {
  id: string;
  name: string;
  hashrate: number; // TH/s
  priceBTC_SPL: number;
  uptime: number; // 0.9-0.99
  description: string;
  icon: string;
  category: 'basic' | 'advanced' | 'professional' | 'legendary';
}

export interface UserRig {
  id: string;
  userId: string;
  tierId: string;
  tier: RigTier;
  purchasedAt: number;
  uptime: number;
  isActive: boolean;
}

export interface BurnRecord {
  id: string;
  userId: string;
  amount: number;
  reason: string; // 'rig_purchase'
  timestamp: number;
  metadata?: any;
}

export interface EHRSnapshot {
  userId: string;
  ehr: number; // Effective Hash Rate
  timestamp: number;
}

// Seed rig tiers
export const RIG_TIERS: RigTier[] = [
  {
    id: 'antminer-s9',
    name: 'Antminer S9',
    hashrate: 13.5,
    priceBTC_SPL: 125,
    uptime: 0.95,
    description: 'Perfect starter rig for beginners. Reliable and energy-efficient.',
    icon: '🖥️',
    category: 'basic'
  },
  {
    id: 'antminer-s19-pro',
    name: 'Antminer S19 Pro',
    hashrate: 110,
    priceBTC_SPL: 875,
    uptime: 0.97,
    description: 'High-performance mining with excellent efficiency ratio.',
    icon: '⚡',
    category: 'advanced'
  },
  {
    id: 'whatsminer-m30s',
    name: 'WhatsMiner M30S++',
    hashrate: 112,
    priceBTC_SPL: 932,
    uptime: 0.94,
    description: 'Professional-grade mining rig with superior hash rates.',
    icon: '🔥',
    category: 'professional'
  },
  {
    id: 'golden-dragon',
    name: 'Golden Dragon Miner',
    hashrate: 250,
    priceBTC_SPL: 2408,
    uptime: 0.99,
    description: 'Legendary mining rig with unmatched performance.',
    icon: '🐲',
    category: 'legendary'
  }
];

export class UserManager {
  private users = new Map<string, User>();
  private userRigs = new Map<string, UserRig[]>();
  private burnLedger: BurnRecord[] = [];
  private globalBurned = 0;
  private initialCirculating = 1000000; // 1M initial supply

  constructor() {
    // Create default user for demo
    this.createUser('demo-user');
  }

  createUser(sessionId: string): User {
    const user: User = {
      id: uuidv4(),
      sessionId,
      balances: {
        BTC_SPL: 1000 // Starting balance
      },
      totalEarned: 0,
      createdAt: Date.now()
    };

    this.users.set(sessionId, user);
    this.userRigs.set(user.id, []);
    return user;
  }

  getUser(sessionId: string): User {
    let user = this.users.get(sessionId);
    if (!user) {
      user = this.createUser(sessionId);
    }
    return user;
  }

  getUserRigs(userId: string): UserRig[] {
    return this.userRigs.get(userId) || [];
  }

  buyRig(sessionId: string, tierId: string, idempotencyKey: string): { success: boolean; error?: string; data?: any } {
    const user = this.getUser(sessionId);
    const rigTier = RIG_TIERS.find(tier => tier.id === tierId);

    if (!rigTier) {
      return { success: false, error: 'Rig tier not found' };
    }

    if (user.balances.BTC_SPL < rigTier.priceBTC_SPL) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Check idempotency
    const existingBurn = this.burnLedger.find(record => 
      record.metadata?.idempotencyKey === idempotencyKey
    );
    if (existingBurn) {
      return { success: false, error: 'Transaction already processed' };
    }

    // Deduct balance
    user.balances.BTC_SPL -= rigTier.priceBTC_SPL;

    // Record burn
    const burnRecord: BurnRecord = {
      id: uuidv4(),
      userId: user.id,
      amount: rigTier.priceBTC_SPL,
      reason: 'rig_purchase',
      timestamp: Date.now(),
      metadata: { idempotencyKey, tierId }
    };
    this.burnLedger.push(burnRecord);
    this.globalBurned += rigTier.priceBTC_SPL;

    // Create rig
    const userRig: UserRig = {
      id: uuidv4(),
      userId: user.id,
      tierId: rigTier.id,
      tier: rigTier,
      purchasedAt: Date.now(),
      uptime: rigTier.uptime,
      isActive: true
    };

    const userRigs = this.userRigs.get(user.id) || [];
    userRigs.push(userRig);
    this.userRigs.set(user.id, userRigs);

    return {
      success: true,
      data: {
        rig: userRig,
        newBalance: user.balances.BTC_SPL,
        globalBurned: this.globalBurned,
        circulatingSupply: this.getCirculatingSupply()
      }
    };
  }

  calculateUserEHR(userId: string): number {
    const rigs = this.getUserRigs(userId);
    return rigs
      .filter(rig => rig.isActive)
      .reduce((total, rig) => total + (rig.tier.hashrate * rig.uptime), 0);
  }

  calculateNetworkHashrate(): number {
    let totalEHR = 0;
    for (const [userId] of this.users) {
      const user = this.users.get(userId);
      if (user) {
        totalEHR += this.calculateUserEHR(user.id);
      }
    }
    return Math.max(totalEHR, 100); // Minimum 100 TH/s base hashrate
  }

  distributeBlockReward(blockReward: number): void {
    const networkHashrate = this.calculateNetworkHashrate();
    
    for (const [sessionId, user] of this.users) {
      const userEHR = this.calculateUserEHR(user.id);
      if (userEHR > 0) {
        const userShare = userEHR / networkHashrate;
        const userReward = blockReward * userShare;
        
        user.balances.BTC_SPL += userReward;
        user.totalEarned += userReward;
      }
    }
  }

  getLeaderboard(limit: number = 10): Array<{userId: string; sessionId: string; totalEarned: number; ehr: number}> {
    return Array.from(this.users.values())
      .map(user => ({
        userId: user.id,
        sessionId: user.sessionId,
        totalEarned: user.totalEarned,
        ehr: this.calculateUserEHR(user.id)
      }))
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .slice(0, limit);
  }

  getGlobalBurned(): number {
    return this.globalBurned;
  }

  getCirculatingSupply(): number {
    return this.initialCirculating - this.globalBurned;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}
