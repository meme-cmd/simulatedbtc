require('dotenv').config();
const { Connection, PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const { config, custodyBtcSplKeypair } = require('./solana-config');

class TransactionVerifier {
  constructor() {
    // Construct the full URL with API key
    const rpcUrlWithKey = `${config.RPC_URL}?api-key=${config.HELIUS_API_KEY}`;
    console.log('🔗 Connecting to Helius RPC:', rpcUrlWithKey);
    this.connection = new Connection(rpcUrlWithKey, 'confirmed');
    this.btcMint = new PublicKey(config.BTC_SPL_MINT);
    // Use the same custody wallet that the rest of the backend uses
    this.treasuryWallet = custodyBtcSplKeypair.publicKey;
  }

  /**
   * Verify a deposit transaction on-chain
   * @param {string} signature - Transaction signature
   * @param {string} expectedAmount - Expected amount in smallest units
   * @param {string} userWallet - User's wallet address
   * @returns {Promise<{verified: boolean, amount?: number, error?: string}>}
   */
  async verifyDeposit(signature, expectedAmount, userWallet) {
    try {
      console.log(`🔍 Verifying deposit transaction: ${signature}`);
      
      // Get transaction details
      const transaction = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!transaction) {
        return { verified: false, error: 'Transaction not found' };
      }

      if (!transaction.meta || transaction.meta.err) {
        return { verified: false, error: 'Transaction failed or has errors' };
      }

      // Check if transaction is confirmed
      if (!transaction.blockTime) {
        return { verified: false, error: 'Transaction not yet confirmed' };
      }

      // Get user's associated token account
      const userATA = await getAssociatedTokenAddress(
        this.btcMint,
        new PublicKey(userWallet)
      );

      // Get treasury's associated token account
      const treasuryATA = await getAssociatedTokenAddress(
        this.btcMint,
        this.treasuryWallet
      );

      // Check token balance changes
      const preBalances = transaction.meta.preTokenBalances || [];
      const postBalances = transaction.meta.postTokenBalances || [];

      // Determine token decimals dynamically (fallback to 6)
      let decimals = 6;
      try {
        const mintInfo = await this.connection.getParsedAccountInfo(this.btcMint);
        const parsed = mintInfo.value?.data?.parsed;
        const mintDecimals = parsed?.info?.decimals;
        if (typeof mintDecimals === 'number') decimals = mintDecimals;
      } catch (_) {}

      // Find balance changes for treasury account
      let treasuryBalanceChange = 0;
      
      for (const preBalance of preBalances) {
        if (preBalance.owner === this.treasuryWallet.toString() && 
            preBalance.mint === this.btcMint.toString()) {
          const postBalance = postBalances.find(pb => 
            pb.owner === this.treasuryWallet.toString() && 
            pb.mint === this.btcMint.toString()
          );
          
          if (postBalance) {
            treasuryBalanceChange = Number(postBalance.uiTokenAmount.amount) - Number(preBalance.uiTokenAmount.amount);
          }
          break;
        }
      }

      // Verify the deposit amount matches expected
      if (treasuryBalanceChange <= 0) {
        return { verified: false, error: 'No positive balance change detected for treasury' };
      }

      // Convert to human readable amount (assuming 6 decimals for SPL tokens)
      const actualAmount = treasuryBalanceChange / Math.pow(10, decimals);
      const expectedAmountHuman = Number(expectedAmount);

      // Allow for small rounding differences
      const tolerance = 0.000001;
      if (Math.abs(actualAmount - expectedAmountHuman) > tolerance) {
        return { 
          verified: false, 
          error: `Amount mismatch: expected ${expectedAmountHuman}, got ${actualAmount}` 
        };
      }

      console.log(`✅ Deposit verified: ${actualAmount} $BTC SPL from ${userWallet}`);
      return { 
        verified: true, 
        amount: actualAmount,
        blockTime: transaction.blockTime,
        signature: signature
      };

    } catch (error) {
      console.error('Error verifying deposit:', error);
      return { verified: false, error: error.message };
    }
  }

  /**
   * Verify a withdrawal transaction on-chain
   * @param {string} signature - Transaction signature  
   * @param {string} expectedAmount - Expected amount in human readable format
   * @param {string} userWallet - User's wallet address
   * @returns {Promise<{verified: boolean, amount?: number, error?: string}>}
   */
  async verifyWithdrawal(signature, expectedAmount, userWallet) {
    try {
      console.log(`🔍 Verifying withdrawal transaction: ${signature}`);
      
      // Get transaction details
      const transaction = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!transaction) {
        return { verified: false, error: 'Transaction not found' };
      }

      if (!transaction.meta || transaction.meta.err) {
        return { verified: false, error: 'Transaction failed or has errors' };
      }

      // Check if transaction is confirmed
      if (!transaction.blockTime) {
        return { verified: false, error: 'Transaction not yet confirmed' };
      }

      // Check token balance changes
      const preBalances = transaction.meta.preTokenBalances || [];
      const postBalances = transaction.meta.postTokenBalances || [];

      // Determine token decimals dynamically (fallback to 6)
      let decimals = 6;
      try {
        const mintInfo = await this.connection.getParsedAccountInfo(this.btcMint);
        const parsed = mintInfo.value?.data?.parsed;
        const mintDecimals = parsed?.info?.decimals;
        if (typeof mintDecimals === 'number') decimals = mintDecimals;
      } catch (_) {}

      // Find balance changes for treasury account (should decrease)
      let treasuryBalanceChange = 0;
      
      for (const preBalance of preBalances) {
        if (preBalance.owner === this.treasuryWallet.toString() && 
            preBalance.mint === this.btcMint.toString()) {
          const postBalance = postBalances.find(pb => 
            pb.owner === this.treasuryWallet.toString() && 
            pb.mint === this.btcMint.toString()
          );
          
          if (postBalance) {
            treasuryBalanceChange = Number(postBalance.uiTokenAmount.amount) - Number(preBalance.uiTokenAmount.amount);
          }
          break;
        }
      }

      // For withdrawal, treasury balance should decrease
      if (treasuryBalanceChange >= 0) {
        return { verified: false, error: 'No negative balance change detected for treasury' };
      }

      // Convert to human readable amount
      const actualAmount = Math.abs(treasuryBalanceChange) / Math.pow(10, decimals);
      const expectedAmountHuman = Number(expectedAmount);

      // Allow for small rounding differences
      const tolerance = 0.000001;
      if (Math.abs(actualAmount - expectedAmountHuman) > tolerance) {
        return { 
          verified: false, 
          error: `Amount mismatch: expected ${expectedAmountHuman}, got ${actualAmount}` 
        };
      }

      console.log(`✅ Withdrawal verified: ${actualAmount} $BTC SPL to ${userWallet}`);
      return { 
        verified: true, 
        amount: actualAmount,
        blockTime: transaction.blockTime,
        signature: signature
      };

    } catch (error) {
      console.error('Error verifying withdrawal:', error);
      return { verified: false, error: error.message };
    }
  }

  /**
   * Get the current balance of treasury wallet
   * @returns {Promise<number>} Balance in human readable format
   */
  async getTreasuryBalance() {
    try {
      // Determine token program for mint
      const info = await this.connection.getAccountInfo(this.btcMint);
      const ownerStr = info?.owner?.toString?.() || '';
      const programId = ownerStr === TOKEN_2022_PROGRAM_ID.toString() ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

      const treasuryATA = await getAssociatedTokenAddress(
        this.btcMint,
        this.treasuryWallet,
        false,
        programId
      );

      const account = await getAccount(this.connection, treasuryATA, undefined, programId);
      return Number(account.amount) / Math.pow(10, 6);
    } catch (error) {
      console.error('Error getting treasury balance:', error);
      return 0;
    }
  }

  /**
   * Check if a transaction signature exists and is confirmed
   * @param {string} signature - Transaction signature
   * @returns {Promise<boolean>}
   */
  async isTransactionConfirmed(signature) {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return status.value && status.value.confirmationStatus === 'confirmed';
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return false;
    }
  }
}

module.exports = TransactionVerifier;
