# Deployment Guide for Bitcoin Mining Simulator

This guide will help you deploy your Bitcoin Mining Simulator to Render.com.

## Prerequisites

1. A [Render.com](https://render.com) account
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Solana wallet and Helius API key (for payment functionality)

## Project Structure

This project consists of two services:
- **Backend**: Node.js API server with WebSocket support (`/backend`)
- **Frontend**: Next.js static site (`/`)

## Deployment Steps

### 1. Prepare Your Repository

Ensure your code is pushed to a Git repository that Render can access.

### 2. Configure Environment Variables

#### Backend Environment Variables
Copy `backend/env.production.example` and set up these required variables in Render:

```
NODE_ENV=production
PORT=10000
TARGET_BLOCK_INTERVAL=10
HALVING_COUNT=4
SEASON_LENGTH=7
DIFFICULTY_RETARGET_BLOCKS=2016
MAX_DIFFICULTY_ADJUSTMENT=4
INITIAL_DIFFICULTY=1000000
INITIAL_REWARD=50
MAX_BLOCKS_IN_MEMORY=500

# Required for Solana payments
HELIUS_API_KEY=your_actual_helius_api_key
SOLANA_PRIVATE_KEY=your_actual_solana_private_key
TREASURY_WALLET_ADDRESS=5TaAxg9W4VwGRRp4Y8K5ETdFDg7fmUuxqsTvpTF857Vi
```

#### Frontend Environment Variables
The frontend will need these variables (automatically set in render.yaml):

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_WS_URL=wss://your-backend-service.onrender.com
```

### 3. Deploy to Render

#### Option A: Using render.yaml (Recommended)

1. Push the `render.yaml` file to your repository root
2. Go to your Render dashboard
3. Click "New" → "Blueprint"
4. Connect your repository
5. Render will automatically detect the `render.yaml` and create both services

#### Option B: Manual Setup

##### Deploy Backend Service
1. Go to Render dashboard → "New" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name**: `bitcoin-mining-backend`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Health Check Path**: `/api/health`
4. Add all environment variables from the backend section above
5. Deploy

##### Deploy Frontend Service
1. Go to Render dashboard → "New" → "Static Site"
2. Connect your repository
3. Configure:
   - **Name**: `bitcoin-mining-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `out`
4. Add frontend environment variables
5. Deploy

### 4. Update API URLs

After deployment, update the frontend environment variables with your actual backend URL:

1. Go to your frontend service settings
2. Update `NEXT_PUBLIC_API_URL` to your backend service URL
3. Update `NEXT_PUBLIC_WS_URL` to your backend service WebSocket URL
4. Redeploy the frontend

### 5. Configure Custom Domains (Optional)

1. In Render dashboard, go to your service settings
2. Add your custom domain
3. Update DNS records as instructed by Render
4. Update environment variables if needed

## Service URLs

After deployment, your services will be available at:
- Backend: `https://bitcoin-mining-backend.onrender.com`
- Frontend: `https://bitcoin-mining-frontend.onrender.com`

## Environment-Specific Configuration

### Development
```bash
# Backend
cd backend && npm run dev

# Frontend
npm run dev
```

### Production
The production build uses:
- Backend: `server-simple.js` (JavaScript version for stability)
- Frontend: Static export optimized for CDN delivery

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Verify build commands in `render.yaml`
   - Check build logs for specific errors

2. **Environment Variable Issues**
   - Ensure all required variables are set
   - Check variable names match exactly
   - Verify sensitive variables are marked as "secret"

3. **WebSocket Connection Issues**
   - Ensure WebSocket URL uses `wss://` (not `ws://`)
   - Check CORS settings in backend
   - Verify WebSocket endpoint is accessible

4. **API Connection Issues**
   - Verify backend health check endpoint `/api/health`
   - Check frontend API URL configuration
   - Ensure backend service is running

### Logs and Monitoring

- Access logs through Render dashboard
- Monitor service health through `/api/health` endpoint
- Use browser dev tools to debug frontend issues

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **CORS**: Backend is configured for specific origins
3. **Rate Limiting**: Backend includes rate limiting middleware
4. **Security Headers**: Helmet.js is configured for security headers

## Scaling

For high traffic, consider:
1. Upgrading to higher Render plans
2. Implementing Redis for session storage
3. Adding database persistence
4. Using CDN for static assets

## Support

- [Render Documentation](https://render.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- Check service logs in Render dashboard for debugging
