const { 
  PublicKey, 
  SystemProgram, 
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID
} = require('@solana/spl-token');
const { 
  connection, 
  custodyKeypair, 
  custodyBtcSplKeypair,
  config,
  formatSolAmount,
  formatSplAmount
} = require('./solana-config');

class SolanaService {
  constructor() {
    this.pendingDeposits = new Map();
    this.pendingWithdrawals = new Map();
    this.burnJobs = [];
  }

  /**
   * Returns the token program id for a given mint (TOKEN_PROGRAM_ID or TOKEN_2022_PROGRAM_ID)
   */
  async getMintProgramId(mintPubkey) {
    const info = await connection.getAccountInfo(mintPubkey);
    if (!info) return TOKEN_PROGRAM_ID;
    const owner = info.owner?.toString?.() || '';
    if (owner === TOKEN_2022_PROGRAM_ID.toString()) return TOKEN_2022_PROGRAM_ID;
    return TOKEN_PROGRAM_ID;
  }

  // Create deposit order
  async createDepositOrder(currency, amount, userId) {
    const orderId = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const memo = `deposit_${orderId}`;
    
    let payToAddress;
    if (currency === 'SOL') {
      payToAddress = custodyKeypair.publicKey.toString();
    } else if (currency === 'BTC_SPL') {
      // Get or create associated token account for custody wallet
      const mint = new PublicKey(config.BTC_SPL_MINT);
      const programId = await this.getMintProgramId(mint);
      const custodyATA = await getAssociatedTokenAddress(
        mint,
        custodyBtcSplKeypair.publicKey,
        false,
        programId
      );

      // Ensure the ATA exists; create it if missing so wallets can transfer
      try {
        await getAccount(connection, custodyATA);
      } catch (e) {
        const tx = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            custodyBtcSplKeypair.publicKey, // payer
            custodyATA, // ata
            custodyBtcSplKeypair.publicKey, // owner
            mint, // mint
            programId
          )
        );
        await sendAndConfirmTransaction(connection, tx, [custodyBtcSplKeypair]);
      }

      payToAddress = custodyATA.toString();
    } else {
      throw new Error('Unsupported currency');
    }

    const depositOrder = {
      orderId,
      userId,
      currency,
      amount,
      payToAddress,
      memo,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes
    };

    this.pendingDeposits.set(orderId, depositOrder);
    
    return {
      orderId,
      payToAddress,
      memo,
      amount,
      currency,
      expiresAt: depositOrder.expiresAt
    };
  }

  // Process deposit confirmation (called from webhook)
  async confirmDeposit(orderId, txSignature, amount) {
    const deposit = this.pendingDeposits.get(orderId);
    if (!deposit) {
      throw new Error('Deposit order not found');
    }

    if (deposit.status !== 'pending') {
      throw new Error('Deposit already processed');
    }

    // Verify the transaction amount matches
    if (Math.abs(deposit.amount - amount) > 0.001) {
      deposit.status = 'amount_mismatch';
      deposit.actualAmount = amount;
      deposit.txSignature = txSignature;
      return { success: false, error: 'Amount mismatch' };
    }

    deposit.status = 'confirmed';
    deposit.txSignature = txSignature;
    deposit.confirmedAt = Date.now();

    return { success: true, deposit };
  }

  // Get deposit status
  getDepositStatus(orderId) {
    return this.pendingDeposits.get(orderId) || null;
  }

  // Create withdrawal
  async createWithdrawal(userId, currency, amount, toPubkey) {
    const withdrawalId = `with_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const withdrawal = {
      withdrawalId,
      userId,
      currency,
      amount,
      toPubkey,
      status: 'pending',
      createdAt: Date.now()
    };

    this.pendingWithdrawals.set(withdrawalId, withdrawal);

    // Preflight: ensure custody has sufficient funds for immediate fulfillment (SPL only)
    if (currency === 'BTC_SPL') {
      try {
        const mint = new PublicKey(config.BTC_SPL_MINT);
        const programId = await this.getMintProgramId(mint);
        const fromATA = await getAssociatedTokenAddress(mint, custodyBtcSplKeypair.publicKey, false, programId);
        const toATA = await getAssociatedTokenAddress(mint, new PublicKey(toPubkey), false, programId);
        let decimals = 6;
        try {
          const mintInfo = await connection.getParsedAccountInfo(mint);
          const parsed = mintInfo.value?.data?.parsed;
          const mintDecimals = parsed?.info?.decimals;
          if (typeof mintDecimals === 'number') decimals = mintDecimals;
        } catch (_) {}
        const required = Math.round(amount * Math.pow(10, decimals));
        let current = 0;
        try {
          const acct = await getAccount(connection, fromATA, undefined, programId);
          current = Number(acct.amount);
        } catch (_) {
          current = 0;
        }
        if (current < required) {
          withdrawal.status = 'queued';
          return { success: true, queued: true, withdrawalId, reason: 'insufficient_custody_funds' };
        }

        // Also ensure custody wallet has enough SOL to pay fees and possibly
        // create the destination ATA if it doesn't exist yet.
        let needsCreateToAta = false;
        try {
          await getAccount(connection, toATA, undefined, programId);
        } catch (_) {
          needsCreateToAta = true;
        }

        const baseFeeLamports = 50_000; // generous fee buffer
        const rentForAta = needsCreateToAta
          ? await connection.getMinimumBalanceForRentExemption(165)
          : 0;
        const requiredLamports = baseFeeLamports + rentForAta;

        const solBalance = await connection.getBalance(custodyBtcSplKeypair.publicKey);
        if (solBalance < requiredLamports) {
          withdrawal.status = 'queued';
          return { success: true, queued: true, withdrawalId, reason: 'insufficient_custody_sol' };
        }
      } catch (e) {
        // If we cannot determine balance, conservatively queue
        withdrawal.status = 'queued';
        return { success: true, queued: true, withdrawalId, reason: 'preflight_failed' };
      }
    }

    // Process immediately
    try {
      const txSignature = await this.processWithdrawal(withdrawal);
      withdrawal.status = 'completed';
      withdrawal.txSignature = txSignature;
      withdrawal.completedAt = Date.now();
      
      return { success: true, withdrawalId, txSignature };
    } catch (error) {
      withdrawal.status = 'failed';
      withdrawal.error = error.message;
      
      return { success: false, error: error.message };
    }
  }

  // Process withdrawal transaction
  async processWithdrawal(withdrawal) {
    const { currency, amount, toPubkey } = withdrawal;
    
    if (currency === 'SOL') {
      // Transfer SOL
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: custodyKeypair.publicKey,
          toPubkey: new PublicKey(toPubkey),
          lamports: amount * LAMPORTS_PER_SOL
        })
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [custodyKeypair]
      );

      return signature;
    } else if (currency === 'BTC_SPL') {
      // Transfer SPL token
      const mint = new PublicKey(config.BTC_SPL_MINT);
      const programId = await this.getMintProgramId(mint);
      const fromATA = await getAssociatedTokenAddress(mint, custodyBtcSplKeypair.publicKey, false, programId);
      const toATA = await getAssociatedTokenAddress(mint, new PublicKey(toPubkey), false, programId);

      const transaction = new Transaction();

      // Ensure custody has sufficient funds and that the source ATA exists
      let decimals = 6;
      try {
        const mintInfo = await connection.getParsedAccountInfo(mint);
        const parsed = mintInfo.value?.data?.parsed;
        const mintDecimals = parsed?.info?.decimals;
        if (typeof mintDecimals === 'number') decimals = mintDecimals;
      } catch (_) {}

      let fromBalance = 0;
      try {
        const fromAccount = await getAccount(connection, fromATA, undefined, programId);
        fromBalance = Number(fromAccount.amount);
      } catch (e) {
        // If the custody ATA doesn't exist, there is definitely no balance
        throw new Error('Custody wallet ATA not found for $BTC SPL. Deposit required before withdrawing.');
      }

      const amountUnits = Math.round(amount * Math.pow(10, decimals));
      if (fromBalance < amountUnits) {
        throw new Error('Custody wallet has insufficient $BTC SPL to fulfill this withdrawal.');
      }

      // Check if destination ATA exists, create if not
      try {
        await getAccount(connection, toATA);
      } catch (error) {
        // ATA doesn't exist, create it
        transaction.add(
          createAssociatedTokenAccountInstruction(
            custodyBtcSplKeypair.publicKey, // payer
            toATA, // ata
            new PublicKey(toPubkey), // owner
            mint, // mint
            programId
          )
        );
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          fromATA,
          toATA,
          custodyBtcSplKeypair.publicKey,
          amountUnits,
          [],
          programId
        )
      );

      try {
        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [custodyBtcSplKeypair]
        );
        return signature;
      } catch (err) {
        const message = (err && err.message) || '';
        if (message.includes('found no record of a prior credit') || message.includes('insufficient funds for')) {
          throw new Error('Custody wallet lacks SOL to pay fees or create the destination token account. Please fund custody or try again later.');
        }
        throw err;
      }
    }

    throw new Error('Unsupported currency');
  }

  // Burn tokens (for rig purchases)
  async burnTokens(amount, userId, reason = 'rig_purchase') {
    const burnJobId = `burn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const burnJob = {
      burnJobId,
      userId,
      amount,
      reason,
      status: 'pending',
      createdAt: Date.now()
    };

    this.burnJobs.push(burnJob);

    try {
      const mint = new PublicKey(config.BTC_SPL_MINT);
      const fromATA = await getAssociatedTokenAddress(mint, custodyBtcSplKeypair.publicKey);
      const burnAddress = new PublicKey(config.BURN_ADDRESS);

      // For demo purposes, we'll transfer to burn address
      // In production, you might use a dedicated burn instruction
      const transaction = new Transaction().add(
        createTransferInstruction(
          fromATA,
          burnAddress,
          custodyBtcSplKeypair.publicKey,
          amount * Math.pow(10, 6) // Convert to token units
        )
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [custodyBtcSplKeypair]
      );

      burnJob.status = 'completed';
      burnJob.txSignature = signature;
      burnJob.completedAt = Date.now();

      return { success: true, txSignature: signature, burnJobId };
    } catch (error) {
      burnJob.status = 'failed';
      burnJob.error = error.message;
      
      console.error('Burn failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get custody balances
  async getCustodyBalances() {
    try {
      // SOL balance
      const solBalance = await connection.getBalance(custodyKeypair.publicKey);
      
      // SPL token balance
      let splBalance = 0;
      try {
        const mint = new PublicKey(config.BTC_SPL_MINT);
        const custodyATA = await getAssociatedTokenAddress(mint, custodyBtcSplKeypair.publicKey);
        const account = await getAccount(connection, custodyATA);
        splBalance = Number(account.amount);
      } catch (error) {
        // ATA might not exist yet
        console.log('SPL token account not found, balance: 0');
      }

      return {
        SOL: formatSolAmount(solBalance),
        BTC_SPL: formatSplAmount(splBalance, 6)
      };
    } catch (error) {
      console.error('Error fetching custody balances:', error);
      return { SOL: 0, BTC_SPL: 0 };
    }
  }

  // Verify Solana transaction
  async verifyTransaction(signature, expectedAmount, expectedMemo) {
    try {
      const transaction = await connection.getTransaction(signature, {
        commitment: 'confirmed'
      });

      if (!transaction) {
        return { valid: false, error: 'Transaction not found' };
      }

      // Basic verification - in production, you'd do more thorough checks
      return { valid: true, transaction };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Get all pending deposits
  getPendingDeposits() {
    return Array.from(this.pendingDeposits.values());
  }

  // Get all pending withdrawals  
  getPendingWithdrawals() {
    return Array.from(this.pendingWithdrawals.values());
  }

  // Get burn jobs
  getBurnJobs() {
    return this.burnJobs;
  }
}

module.exports = { SolanaService, config };
