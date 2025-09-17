export interface MiningConfig {
  targetBlockInterval: number; // seconds
  halvingCount: number;
  seasonLength: number; // days
  difficultyRetargetBlocks: number;
  maxDifficultyAdjustment: number;
  initialDifficulty: number;
  initialReward: number;
  maxBlocksInMemory: number;
}

export const config: MiningConfig = {
  targetBlockInterval: 10, // 10 seconds for faster simulation
  halvingCount: 4,
  seasonLength: 7, // 7 days
  difficultyRetargetBlocks: 2016,
  maxDifficultyAdjustment: 4, // Max 4x difficulty change
  initialDifficulty: 1000000,
  initialReward: 50, // Starting reward in BTC
  maxBlocksInMemory: 500
};

// Calculate halving heights based on season length
export const getHalvingHeights = (): number[] => {
  const totalBlocks = (config.seasonLength * 24 * 60 * 60) / config.targetBlockInterval;
  const blocksPerHalving = Math.floor(totalBlocks / config.halvingCount);
  
  return Array.from({ length: config.halvingCount }, (_, i) => 
    blocksPerHalving * (i + 1)
  );
};

export const getCurrentReward = (height: number): number => {
  const halvingHeights = getHalvingHeights();
  let reward = config.initialReward;
  
  for (const halvingHeight of halvingHeights) {
    if (height >= halvingHeight) {
      reward /= 2;
    } else {
      break;
    }
  }
  
  return reward;
};
