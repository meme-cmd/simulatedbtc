class EmissionsController {
  constructor(config) {
    this.config = Object.freeze({
      SEASON_DAYS: config.SEASON_DAYS,
      TARGET_BLOCK_INTERVAL_SEC: config.TARGET_BLOCK_INTERVAL_SEC,
      TOTAL_EMISSION: config.TOTAL_EMISSION,
      HALVING_EPOCHS: config.HALVING_EPOCHS
    });

    this.totalBlocks = Math.round((this.config.SEASON_DAYS * 86400) / this.config.TARGET_BLOCK_INTERVAL_SEC);
    this.epochLen = Math.floor(this.totalBlocks / this.config.HALVING_EPOCHS);
    this.halvingHeights = Array.from({ length: this.config.HALVING_EPOCHS - 1 }, (_, i) => (i + 1) * this.epochLen);

    // Geometric series sum S = sum_{k=0..H-1} 1/2^k
    this.seriesSum = Array.from({ length: this.config.HALVING_EPOCHS }, (_, k) => 1 / Math.pow(2, k))
      .reduce((a, b) => a + b, 0);

    // Initial reward assuming equal epoch lengths; remainder handled by clip at the end
    this.R0 = this.config.TOTAL_EMISSION / (this.epochLen * this.seriesSum);

    this.emittedTotal = 0; // Subsidy emitted so far
  }

  getEpochIndex(height) {
    // Height is current chain height BEFORE the next block is mined
    // Epoch 0 for height < epochLen, 1 for < 2*epochLen, etc.
    if (height < this.halvingHeights[0]) return 0;
    if (height < this.halvingHeights[1]) return 1;
    if (height < this.halvingHeights[2]) return 2;
    return this.config.HALVING_EPOCHS - 1;
  }

  getCurrentReward(height) {
    const e = this.getEpochIndex(height);
    return this.R0 / Math.pow(2, e);
  }

  clipToTotal(reward) {
    if (this.emittedTotal + reward > this.config.TOTAL_EMISSION) {
      return Math.max(0, this.config.TOTAL_EMISSION - this.emittedTotal);
    }
    return reward;
  }

  incrementEmitted(amount) {
    this.emittedTotal += amount;
  }

  hasEnded(height) {
    return this.emittedTotal >= this.config.TOTAL_EMISSION || height >= this.totalBlocks;
  }

  getTelemetry(height) {
    const e = this.getEpochIndex(height);
    const currentReward = this.getCurrentReward(height);
    const nextHalvingHeight = e < this.config.HALVING_EPOCHS - 1 ? this.halvingHeights[e] : null;
    const blocksRemaining = Math.max(0, this.totalBlocks - height);
    const nextHalvingIn = nextHalvingHeight !== null ? Math.max(0, nextHalvingHeight - height) : null;

    return {
      currentReward,
      emittedTotal: this.emittedTotal,
      remaining: Math.max(0, this.config.TOTAL_EMISSION - this.emittedTotal),
      blocksRemaining,
      nextHalvingIn,
      epochIndex: e,
      epochLen: this.epochLen,
      totalBlocks: this.totalBlocks,
      halvingHeights: this.halvingHeights,
      R0: this.R0
    };
  }

  getPreview() {
    return {
      totalBlocks: this.totalBlocks,
      epochLen: this.epochLen,
      R0: this.R0,
      halvingHeights: this.halvingHeights,
      TOTAL_EMISSION: this.config.TOTAL_EMISSION
    };
  }
}

module.exports = { EmissionsController };


