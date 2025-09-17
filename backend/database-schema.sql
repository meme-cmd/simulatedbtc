-- SimBTC Database Schema for Supabase
-- Run these commands in the Supabase SQL editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    balances JSONB DEFAULT '{"BTC_SPL": 15000}'::jsonb,
    total_earned DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rigs table
CREATE TABLE IF NOT EXISTS rigs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier_id VARCHAR(50) NOT NULL,
    tier_data JSONB NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uptime DECIMAL(5, 4) DEFAULT 0.95,
    quality DECIMAL(5, 2) DEFAULT 100.00,
    last_maintenance_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    height INTEGER UNIQUE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    hash VARCHAR(64) UNIQUE NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    difficulty BIGINT NOT NULL,
    reward DECIMAL(20, 8) NOT NULL,
    subsidy DECIMAL(20, 8) NOT NULL,
    tx_count INTEGER NOT NULL,
    total_fees DECIMAL(20, 8) NOT NULL,
    is_orphan BOOLEAN DEFAULT FALSE,
    work_target VARCHAR(64) NOT NULL,
    transactions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table (for tracking deposits/withdrawals)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'rig_purchase', 'rig_repair'
    amount DECIMAL(20, 8) NOT NULL,
    signature VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global stats table
CREATE TABLE IF NOT EXISTS global_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    global_burned DECIMAL(20, 8) DEFAULT 0,
    circulating_supply DECIMAL(20, 8) DEFAULT 1000000,
    total_blocks INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);
CREATE INDEX IF NOT EXISTS idx_rigs_user_id ON rigs(user_id);
CREATE INDEX IF NOT EXISTS idx_rigs_is_active ON rigs(is_active);
CREATE INDEX IF NOT EXISTS idx_blocks_height ON blocks(height);
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rigs_updated_at BEFORE UPDATE ON rigs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_global_stats_updated_at BEFORE UPDATE ON global_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial global stats
INSERT INTO global_stats (id, global_burned, circulating_supply, total_blocks, total_users)
VALUES (1, 0, 1000000, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON users FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all rigs" ON rigs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all rigs" ON rigs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all rigs" ON rigs FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all blocks" ON blocks FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all blocks" ON blocks FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all transactions" ON transactions FOR UPDATE USING (true);

CREATE POLICY "Enable read access for global stats" ON global_stats FOR SELECT USING (true);
CREATE POLICY "Enable update access for global stats" ON global_stats FOR UPDATE USING (true);
