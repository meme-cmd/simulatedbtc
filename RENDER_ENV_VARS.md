# Render Environment Variables Configuration

## Backend Service Environment Variables

Add these to your `bitcoin-mining-backend` service in Render:

### Database Configuration (Already configured in render.yaml)
```
SUPABASE_URL=https://jomkiwprfelfcgcwjjec.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbWtpd3ByZmVsZmNnY3dqamVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMTEwMTcsImV4cCI6MjA3MzY4NzAxN30.gh4V_xvdyv0HJfcTg7S5ClRifXarqqxfKF73wvw4BmE
```

### Solana Configuration (REQUIRED - Add these manually)
```
HELIUS_API_KEY=your_actual_helius_api_key_here
SOLANA_PRIVATE_KEY=your_actual_private_key_here_DO_NOT_COMMIT
```

### SPL Token Configuration (Update when you have your mint address)
```
SPL_MINT_ADDRESS=your_actual_spl_mint_address_here
```

## How to Add Environment Variables in Render

1. Go to your backend service dashboard
2. Click "Environment" tab
3. Click "Add Environment Variable"
4. Add each variable with its value
5. Mark sensitive variables (like private keys) as "Secret"

## Variables Already Set (from render.yaml)
- NODE_ENV=production
- PORT=10000
- All mining simulation parameters
- TREASURY_WALLET_ADDRESS
- SUPABASE_URL and SUPABASE_ANON_KEY

## Variables You Need to Add Manually
- HELIUS_API_KEY (get from Helius.dev)
- SOLANA_PRIVATE_KEY (your custody wallet private key)
- SPL_MINT_ADDRESS (your token mint address)
