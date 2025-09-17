# Supabase Database Setup Guide

## 🎯 Overview

Your SimBTC Bitcoin Mining Simulator now uses Supabase as its database backend for persistent storage of users, mining rigs, blocks, and transactions.

## 📋 Setup Steps

### 1. **Database Schema Setup**

1. Go to your Supabase project: https://jomkiwprfelfcgcwjjec.supabase.co
2. Navigate to the **SQL Editor**
3. Copy and paste the contents of `backend/database-schema.sql`
4. Run the SQL commands to create all tables and indexes

### 2. **Tables Created**

The schema creates these tables:

#### **users**
- `id` (UUID, Primary Key)
- `session_id` (VARCHAR, Unique) - User session identifier
- `balances` (JSONB) - User's token balances
- `total_earned` (DECIMAL) - Total BTC earned from mining
- `created_at`, `updated_at` (TIMESTAMP)

#### **rigs**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `tier_id` (VARCHAR) - Rig type identifier
- `tier_data` (JSONB) - Complete rig specification
- `uptime`, `quality` (DECIMAL) - Rig performance metrics
- `is_active` (BOOLEAN) - Whether rig is operational
- `purchased_at`, `last_maintenance_at` (TIMESTAMP)

#### **blocks**
- `id` (UUID, Primary Key)
- `height` (INTEGER, Unique) - Block number
- `hash`, `previous_hash` (VARCHAR) - Block hashes
- `difficulty`, `reward`, `subsidy` (BIGINT/DECIMAL) - Mining metrics
- `transactions` (JSONB) - Block transaction data
- `timestamp` (TIMESTAMP)

#### **transactions**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `type` (VARCHAR) - deposit, withdrawal, rig_purchase, etc.
- `amount` (DECIMAL) - Transaction amount
- `signature` (VARCHAR) - Solana transaction signature
- `status` (VARCHAR) - pending, confirmed, failed

#### **global_stats**
- `id` (INTEGER, Primary Key = 1) - Single row table
- `global_burned` (DECIMAL) - Total tokens burned
- `circulating_supply` (DECIMAL) - Current circulating supply
- `total_blocks`, `total_users` (INTEGER) - Global counters

### 3. **Environment Variables**

The following environment variables are now configured:

```env
# Supabase Database Configuration
SUPABASE_URL=https://jomkiwprfelfcgcwjjec.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbWtpd3ByZmVsZmNnY3dqamVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMTEwMTcsImV4cCI6MjA3MzY4NzAxN30.gh4V_xvdyv0HJfcTg7S5ClRifXarqqxfKF73wvw4BmE
```

### 4. **Security Configuration**

- **Row Level Security (RLS)**: Enabled on all tables
- **Public Policies**: Created for read/write access (adjust as needed)
- **Anon Key**: Used for public access to database

## 🔄 **Database Integration Features**

### **Persistent User Data**
- User accounts persist across sessions
- Balances and earnings are saved
- Mining rigs are permanently stored

### **Block History**
- All mined blocks saved to database
- Complete transaction history
- Searchable block explorer data

### **Real-time Updates**
- Database changes reflect immediately
- WebSocket updates work with persistent data
- No data loss on server restart

### **Transaction Tracking**
- All deposits/withdrawals logged
- Solana transaction signatures stored
- Complete audit trail

## 🚀 **Benefits**

1. **Data Persistence**: No data loss on server restarts
2. **Scalability**: Database handles multiple users efficiently
3. **Analytics**: Query historical data and statistics
4. **Backup**: Automatic Supabase backups
5. **Performance**: Optimized indexes for fast queries

## 🔧 **Database Service Methods**

The `DatabaseService` class provides these methods:

### User Operations
- `createUser(sessionId, initialBalance)`
- `getUserBySessionId(sessionId)`
- `updateUserBalance(userId, balances, totalEarned)`

### Rig Operations
- `createRig(userId, rigData)`
- `getUserRigs(userId)`
- `updateRigQuality(rigId, quality, lastMaintenanceAt)`

### Block Operations
- `saveBlock(blockData)`
- `getRecentBlocks(limit)`
- `getBlockByHeight(height)`
- `getBlocksPaginated(cursor, limit)`

### Global Operations
- `getGlobalStats()`
- `updateGlobalStats(globalBurned, circulatingSupply)`
- `getLeaderboard(limit)`

## 📊 **Monitoring**

Monitor your database through:
1. **Supabase Dashboard**: Real-time metrics and logs
2. **Application Logs**: Database operation results
3. **API Responses**: Error handling and success indicators

## 🛠️ **Troubleshooting**

### Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check network connectivity
- Review Supabase project status

### Query Errors
- Check table schema matches expectations
- Verify Row Level Security policies
- Review application logs for specific errors

### Performance Issues
- Monitor query performance in Supabase dashboard
- Check if indexes are being used effectively
- Consider query optimization if needed

## 🎉 **Ready to Deploy!**

Your SimBTC application now has:
- ✅ Complete database integration
- ✅ Persistent user accounts and mining rigs
- ✅ Block history and transaction logging
- ✅ Real-time updates with database persistence
- ✅ Production-ready Supabase configuration

The database will automatically initialize when the server starts, and all user data will persist across deployments!
