import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { MiningEngine } from './mining-engine';
import { UserManager, RIG_TIERS } from './models';
import { WebSocketMessage } from './types';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize user manager and mining engine
const userManager = new UserManager();
const miningEngine = new MiningEngine(userManager);

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to get session ID
const getSessionId = (req: any): string => {
  return (req.headers['x-session-id'] as string) || 'demo-user';
};

// REST API Routes
app.get('/api/telemetry', (req, res) => {
  const sessionId = getSessionId(req);
  res.json(miningEngine.getTelemetry(sessionId));
});

// User endpoints
app.get('/api/user', (req, res) => {
  const sessionId = getSessionId(req);
  const user = userManager.getUser(sessionId);
  const userRigs = userManager.getUserRigs(user.id);
  const userEHR = userManager.calculateUserEHR(user.id);
  
  res.json({
    user: {
      id: user.id,
      balances: user.balances,
      totalEarned: user.totalEarned
    },
    rigs: userRigs,
    ehr: userEHR
  });
});

// Rig endpoints
app.get('/api/rigs/tiers', (req, res) => {
  res.json(RIG_TIERS);
});

app.post('/api/rigs/buy', (req, res) => {
  const { tierId, idempotencyKey = uuidv4() } = req.body;
  const sessionId = getSessionId(req);
  
  if (!tierId) {
    return res.status(400).json({ error: 'tierId is required' });
  }

  const result = userManager.buyRig(sessionId, tierId, idempotencyKey);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result.data);
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const leaderboard = userManager.getLeaderboard(limit);
  res.json(leaderboard);
});

app.get('/api/blocks', (req, res) => {
  const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  
  const blocks = miningEngine.getBlocks(cursor, limit);
  res.json({
    blocks,
    hasMore: blocks.length === limit
  });
});

app.get('/api/block/:height', (req, res) => {
  const height = parseInt(req.params.height);
  const block = miningEngine.getBlock(height);
  
  if (!block) {
    return res.status(404).json({ error: 'Block not found' });
  }
  
  res.json(block);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial telemetry
  ws.send(JSON.stringify({
    type: 'telemetry',
    data: miningEngine.getTelemetry()
  }));

  // Subscribe to mining engine updates
  const unsubscribe = miningEngine.subscribe((data: WebSocketMessage) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    unsubscribe();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    unsubscribe();
  });
});

// Start mining engine
miningEngine.start();

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Mining simulator backend running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  miningEngine.stop();
  server.close(() => {
    process.exit(0);
  });
});
