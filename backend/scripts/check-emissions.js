const { EmissionsController } = require('../emissions-controller');

const CONFIG = { SEASON_DAYS: 7, TARGET_BLOCK_INTERVAL_SEC: 10, TOTAL_EMISSION: 210_000_000, HALVING_EPOCHS: 4 };
const emissions = new EmissionsController(CONFIG);

let height = 0;
let sum = 0;

while (!emissions.hasEnded(height)) {
  let r = emissions.getCurrentReward(height);
  r = emissions.clipToTotal(r);
  emissions.incrementEmitted(r);
  sum += r;
  height += 1;
}

const ok = Math.abs(sum - CONFIG.TOTAL_EMISSION) < 1e-6;
if (!ok) {
  console.error(`Emission check failed: sum=${sum}, expected=${CONFIG.TOTAL_EMISSION}`);
  process.exit(1);
}

// Check halving boundaries
const e0 = emissions.getCurrentReward(0);
const e1 = emissions.getCurrentReward(emissions.epochLen) ;
const e2 = emissions.getCurrentReward(emissions.epochLen * 2);
const halvesOk = Math.abs(e1 * 2 - e0) < 1e-6 && Math.abs(e2 * 4 - e0) < 1e-6;
if (!halvesOk) {
  console.error('Halving boundary check failed');
  process.exit(1);
}

console.log('Emissions check passed:', {
  totalBlocks: emissions.totalBlocks,
  epochLen: emissions.epochLen,
  R0: emissions.R0,
  sum
});

