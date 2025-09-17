export interface Block {
  height: number;
  timestamp: number;
  hash: string;
  previousHash: string;
  difficulty: number;
  reward: number;
  txCount: number;
  totalFees: number;
  isOrphan: boolean;
  workTarget: string;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  amount: number;
  fee: number;
  from: string;
  to: string;
}

export interface NetworkTelemetry {
  height: number;
  timestamp: number;
  difficulty: number;
  networkHashrate: number;
  avgBlockTime: number; // EMA
  currentReward: number;
  nextHalvingHeight: number;
  blocksUntilRetarget: number;
  totalBlocks: number;
  globalBurned: number;
  circulatingSupply: number;
  yourEHR?: number; // User-specific
}

export interface WebSocketMessage {
  type: 'block' | 'telemetry';
  data: Block | NetworkTelemetry;
}

export interface MiningState {
  blocks: Block[];
  currentHeight: number;
  difficulty: number;
  networkHashrate: number;
  avgBlockTime: number;
  lastBlockTime: number;
  totalWork: number;
}
