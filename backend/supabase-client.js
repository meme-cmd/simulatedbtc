const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://jomkiwprfelfcgcwjjec.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbWtpd3ByZmVsZmNnY3dqamVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMTEwMTcsImV4cCI6MjA3MzY4NzAxN30.gh4V_xvdyv0HJfcTg7S5ClRifXarqqxfKF73wvw4BmE';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Database service class
class DatabaseService {
  constructor() {
    this.supabase = supabase;
  }

  // User operations
  async createUser(sessionId, initialBalance = 15000) {
    const userData = {
      session_id: sessionId,
      balances: { BTC_SPL: initialBalance },
      total_earned: 0,
      created_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return data;
  }

  async getUserBySessionId(sessionId) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user:', error);
      throw error;
    }

    return data;
  }

  async updateUserBalance(userId, balances, totalEarned = null) {
    const updateData = { balances };
    if (totalEarned !== null) {
      updateData.total_earned = totalEarned;
    }

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }

    return data;
  }

  // Rig operations
  async createRig(userId, rigData) {
    const { data, error } = await this.supabase
      .from('rigs')
      .insert([{
        user_id: userId,
        tier_id: rigData.tierId,
        tier_data: rigData.tier,
        purchased_at: rigData.purchasedAt,
        uptime: rigData.uptime,
        quality: rigData.quality,
        last_maintenance_at: rigData.lastMaintenanceAt,
        is_active: rigData.isActive
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating rig:', error);
      throw error;
    }

    return data;
  }

  async getUserRigs(userId) {
    const { data, error } = await this.supabase
      .from('rigs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching user rigs:', error);
      throw error;
    }

    return data || [];
  }

  async updateRigQuality(rigId, quality, lastMaintenanceAt) {
    const { data, error } = await this.supabase
      .from('rigs')
      .update({
        quality,
        last_maintenance_at: lastMaintenanceAt
      })
      .eq('id', rigId)
      .select()
      .single();

    if (error) {
      console.error('Error updating rig quality:', error);
      throw error;
    }

    return data;
  }

  // Block operations
  async saveBlock(blockData) {
    const { data, error } = await this.supabase
      .from('blocks')
      .insert([{
        height: blockData.height,
        timestamp: new Date(blockData.timestamp).toISOString(),
        hash: blockData.hash,
        previous_hash: blockData.previousHash,
        difficulty: blockData.difficulty,
        reward: blockData.reward,
        subsidy: blockData.subsidy,
        tx_count: blockData.txCount,
        total_fees: blockData.totalFees,
        is_orphan: blockData.isOrphan,
        work_target: blockData.workTarget,
        transactions: blockData.transactions
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving block:', error);
      throw error;
    }

    return data;
  }

  async getRecentBlocks(limit = 50) {
    const { data, error } = await this.supabase
      .from('blocks')
      .select('*')
      .order('height', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent blocks:', error);
      throw error;
    }

    return data || [];
  }

  async getBlockByHeight(height) {
    const { data, error } = await this.supabase
      .from('blocks')
      .select('*')
      .eq('height', height)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching block:', error);
      throw error;
    }

    return data;
  }

  async getBlocksPaginated(cursor = 0, limit = 20) {
    let query = this.supabase
      .from('blocks')
      .select('*')
      .order('height', { ascending: false })
      .limit(limit);

    if (cursor > 0) {
      query = query.lt('height', cursor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching paginated blocks:', error);
      throw error;
    }

    return data || [];
  }

  // Transaction operations
  async saveTransaction(txData) {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert([{
        user_id: txData.userId,
        type: txData.type,
        amount: txData.amount,
        signature: txData.signature,
        status: txData.status,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }

    return data;
  }

  // Leaderboard
  async getLeaderboard(limit = 10) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, session_id, total_earned')
      .order('total_earned', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }

    return data || [];
  }

  // Global stats
  async getGlobalStats() {
    const { data, error } = await this.supabase
      .from('global_stats')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching global stats:', error);
      throw error;
    }

    return data || { global_burned: 0, circulating_supply: 1000000 };
  }

  async updateGlobalStats(globalBurned, circulatingSupply) {
    const { data, error } = await this.supabase
      .from('global_stats')
      .upsert({
        id: 1,
        global_burned: globalBurned,
        circulating_supply: circulatingSupply,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating global stats:', error);
      throw error;
    }

    return data;
  }
}

module.exports = { DatabaseService, supabase };
