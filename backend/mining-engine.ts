import { Block, Transaction, NetworkTelemetry, MiningState } from './types';
import { config, getCurrentReward, getHalvingHeights } from './config';
import { UserManager } from './models';
import crypto from 'crypto';

export class MiningEngine {
  private state: MiningState;
  private tickInterval: NodeJS.Timeout | null = null;
  private subscribers: ((data: any) => void)[] = [];
  private userManager: UserManager;

  constructor(userManager: UserManager) {
    this.userManager = userManager;
    this.state = {
      blocks: [],
      currentHeight: 0,
      difficulty: config.initialDifficulty,
      networkHashrate: this.userManager.calculateNetworkHashrate() * 1000000000000, // Convert TH/s to H/s
      avgBlockTime: config.targetBlockInterval,
      lastBlockTime: Date.now(),
      totalWork: 0
    };

    // Create genesis block
    this.createGenesisBlock();
  }

  private createGenesisBlock(): void {
    const genesisBlock: Block = {
      height: 0,
      timestamp: Date.now(),
      hash: this.generateHash('genesis'),
      previousHash: '0'.repeat(64),
      difficulty: config.initialDifficulty,
      reward: config.initialReward,
      txCount: 1,
      totalFees: 0,
      isOrphan: false,
      workTarget: this.calculateWorkTarget(config.initialDifficulty),
      transactions: [{
        id: this.generateHash('genesis-tx'),
        amount: config.initialReward,
        fee: 0,
        from: 'coinbase',
        to: 'miner-address-1'
      }]
    };

    this.state.blocks.push(genesisBlock);
    this.state.currentHeight = 0;
  }

  private generateHash(input: string): string {
    return crypto.createHash('sha256').update(input + Math.random()).digest('hex');
  }

  private calculateWorkTarget(difficulty: number): string {
    // Simplified work target calculation
    const maxTarget = BigInt('0x00000000FFFF0000000000000000000000000000000000000000000000000000');
    const target = maxTarget / BigInt(Math.floor(difficulty));
    return target.toString(16).padStart(64, '0');
  }

  private generateTransactions(): Transaction[] {
    const txCount = Math.floor(Math.random() * 2000) + 100; // 100-2100 transactions
    const transactions: Transaction[] = [];

    for (let i = 0; i < Math.min(txCount, 10); i++) { // Limit to 10 for demo
      transactions.push({
        id: this.generateHash(`tx-${i}-${Date.now()}`),
        amount: Math.random() * 10,
        fee: Math.random() * 0.001,
        from: this.generateHash(`from-${i}`).substring(0, 8),
        to: this.generateHash(`to-${i}`).substring(0, 8)
      });
    }

    return transactions;
  }

  private shouldMineBlock(): boolean {
    const timeSinceLastBlock = (Date.now() - this.state.lastBlockTime) / 1000;
    const expectedTime = config.targetBlockInterval;
    
    // Poisson process: probability increases over time
    const lambda = 1 / expectedTime;
    const probability = 1 - Math.exp(-lambda * timeSinceLastBlock);
    
    return Math.random() < probability;
  }

  private updateDifficulty(): void {
    if (this.state.currentHeight % config.difficultyRetargetBlocks === 0 && this.state.currentHeight > 0) {
      const retargetBlocks = Math.min(config.difficultyRetargetBlocks, this.state.blocks.length);
      const oldestBlock = this.state.blocks[this.state.blocks.length - retargetBlocks];
      const newestBlock = this.state.blocks[this.state.blocks.length - 1];
      
      const actualTime = (newestBlock.timestamp - oldestBlock.timestamp) / 1000;
      const expectedTime = config.targetBlockInterval * retargetBlocks;
      
      const ratio = expectedTime / actualTime;
      const clampedRatio = Math.max(1 / config.maxDifficultyAdjustment, 
                                   Math.min(config.maxDifficultyAdjustment, ratio));
      
      this.state.difficulty *= clampedRatio;
      
      console.log(`Difficulty retarget at height ${this.state.currentHeight}: ${clampedRatio.toFixed(2)}x`);
    }
  }

  private updateAvgBlockTime(): void {
    if (this.state.blocks.length > 1) {
      const lastBlock = this.state.blocks[this.state.blocks.length - 1];
      const prevBlock = this.state.blocks[this.state.blocks.length - 2];
      const blockTime = (lastBlock.timestamp - prevBlock.timestamp) / 1000;
      
      // Exponential moving average with alpha = 0.1
      this.state.avgBlockTime = 0.9 * this.state.avgBlockTime + 0.1 * blockTime;
    }
  }

  private mineBlock(): Block {
    const now = Date.now();
    const height = this.state.currentHeight + 1;
    const previousBlock = this.state.blocks[this.state.blocks.length - 1];
    const transactions = this.generateTransactions();
    const totalFees = transactions.reduce((sum, tx) => sum + tx.fee, 0);
    const reward = getCurrentReward(height);
    
    // Small chance of orphan block
    const isOrphan = Math.random() < 0.02; // 2% chance

    const block: Block = {
      height,
      timestamp: now,
      hash: this.generateHash(`block-${height}-${now}`),
      previousHash: previousBlock.hash,
      difficulty: this.state.difficulty,
      reward: reward + totalFees,
      txCount: transactions.length,
      totalFees,
      isOrphan,
      workTarget: this.calculateWorkTarget(this.state.difficulty),
      transactions
    };

    this.state.blocks.push(block);
    this.state.currentHeight = height;
    this.state.lastBlockTime = now;

    // Update network hashrate based on user rigs
    this.state.networkHashrate = this.userManager.calculateNetworkHashrate() * 1000000000000;

    // Distribute block rewards to users
    this.userManager.distributeBlockReward(block.reward);

    // Keep only recent blocks in memory
    if (this.state.blocks.length > config.maxBlocksInMemory) {
      this.state.blocks = this.state.blocks.slice(-config.maxBlocksInMemory);
    }

    this.updateAvgBlockTime();
    this.updateDifficulty();

    return block;
  }

  public getTelemetry(sessionId?: string): NetworkTelemetry {
    const halvingHeights = getHalvingHeights();
    const nextHalvingHeight = halvingHeights.find(h => h > this.state.currentHeight) || halvingHeights[halvingHeights.length - 1];
    
    const baseTelemetry = {
      height: this.state.currentHeight,
      timestamp: Date.now(),
      difficulty: this.state.difficulty,
      networkHashrate: this.state.networkHashrate / 1000000000000, // Convert back to TH/s for display
      avgBlockTime: this.state.avgBlockTime,
      currentReward: getCurrentReward(this.state.currentHeight),
      nextHalvingHeight,
      blocksUntilRetarget: config.difficultyRetargetBlocks - (this.state.currentHeight % config.difficultyRetargetBlocks),
      totalBlocks: this.state.blocks.length,
      globalBurned: this.userManager.getGlobalBurned(),
      circulatingSupply: this.userManager.getCirculatingSupply()
    };

    if (sessionId) {
      const user = this.userManager.getUser(sessionId);
      return {
        ...baseTelemetry,
        yourEHR: this.userManager.calculateUserEHR(user.id)
      };
    }

    return baseTelemetry;
  }

  public getBlocks(cursor?: number, limit: number = 20): Block[] {
    const startIndex = cursor ? Math.max(0, this.state.blocks.length - cursor) : 0;
    return this.state.blocks
      .slice(startIndex, startIndex + limit)
      .reverse(); // Most recent first
  }

  public getBlock(height: number): Block | null {
    return this.state.blocks.find(block => block.height === height) || null;
  }

  public subscribe(callback: (data: any) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private broadcast(data: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error broadcasting to subscriber:', error);
      }
    });
  }

  public start(): void {
    if (this.tickInterval) return;

    console.log('Mining engine started');
    
    this.tickInterval = setInterval(() => {
      // Send telemetry every tick
      this.broadcast({
        type: 'telemetry',
        data: this.getTelemetry()
      });

      // Check if we should mine a block
      if (this.shouldMineBlock()) {
        const newBlock = this.mineBlock();
        console.log(`Mined block ${newBlock.height} at ${new Date(newBlock.timestamp).toISOString()}`);
        
        this.broadcast({
          type: 'block',
          data: newBlock
        });
      }
    }, 1000); // 1 second tick
  }

  public stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
      console.log('Mining engine stopped');
    }
  }
}
