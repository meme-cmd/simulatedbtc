require('dotenv').config();
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const bs58Module = require('bs58');
const bs58 = typeof bs58Module.decode === 'function' ? bs58Module : bs58Module.default;

// Configuration from environment variables
const config = {
  SOLANA_CLUSTER: process.env.SOLANA_CLUSTER || 'mainnet-beta',
  RPC_URL: process.env.RPC_URL || 'https://mainnet.helius-rpc.com',
  HELIUS_API_KEY: process.env.HELIUS_API_KEY || '357426ea-a7d4-4e26-9c9a-adf3844fccee',
  BTC_SPL_MINT: process.env.BTC_SPL_MINT || '3zY6EXputsabfL3kQeXNycoejbaNU7AkLokrmy53pump', // $BTC SPL Token
  CUSTODY_SOL: process.env.CUSTODY_SOL || '', // Will be generated if not provided
  CUSTODY_BTC_SPL: process.env.CUSTODY_BTC_SPL || '', // Will be generated if not provided
  BURN_ADDRESS: process.env.BURN_ADDRESS || '11111111111111111111111111111112', // System program (burn)
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'dev-webhook-secret-change-in-production',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production'
};

// Initialize Solana connection with API key
const rpcUrlWithKey = `${config.RPC_URL}?api-key=${config.HELIUS_API_KEY}`;
const connection = new Connection(rpcUrlWithKey, 'confirmed');

// Single fixed custody wallet (same for SOL and SPL). Never generate.
const DEFAULT_CUSTODY_SECRET_BASE58 = '5c1jf24BPCAtHF2XS1tfzaqvBQ1FMXjw9AJRqHHM934R9Jazx6jRviTdcPDzVgiGU3TMvez1jsYZ9s77QDdCUbZz';
const EXPECTED_CUSTODY_PUBLIC = '5TaAxg9W4VwGRRp4Y8K5ETdFDg7fmUuxqsTvpTF857Vi';

const decodeSecret = (val) => {
  if (!val) return null;
  // Prefer base58 (Phantom-style) first
  try {
    const u8 = bs58.decode(val);
    // Accept either 64-byte (ed25519 secret key) or 32-byte (seed) buffers
    if (u8 && (u8.length === 64 || u8.length === 32)) return Buffer.from(u8);
  } catch (_) {}
  // Fallback to base64
  try {
    const buf = Buffer.from(val, 'base64');
    if (buf.length === 64 || buf.length === 32) return buf;
  } catch (_) {}
  return null;
};

const providedSecret = decodeSecret(process.env.CUSTODY_SOL || process.env.CUSTODY_BTC_SPL || DEFAULT_CUSTODY_SECRET_BASE58);
if (!providedSecret) {
  console.error('Invalid custody secret provided. Aborting.');
  process.exit(1);
}

// If 32-byte seed provided, expand to 64-byte secret key
const secretForKeypair = providedSecret.length === 32 ? Keypair.fromSeed(providedSecret).secretKey : providedSecret;
const custodyKeypair = Keypair.fromSecretKey(secretForKeypair);
const custodyBtcSplKeypair = custodyKeypair; // use same wallet

// Validate public key matches expected
try {
  const actual = custodyKeypair.publicKey.toString();
  if (EXPECTED_CUSTODY_PUBLIC && actual !== EXPECTED_CUSTODY_PUBLIC) {
    console.warn(`Warning: Custody public key ${actual} does not match expected ${EXPECTED_CUSTODY_PUBLIC}. Using ${actual}.`);
  }
} catch (_e) {}

// Helper functions
const generateMemo = () => {
  return Math.random().toString(36).substring(2, 15);
};

const validateSolanaAddress = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

const formatSolAmount = (lamports) => {
  return lamports / 1e9; // Convert lamports to SOL
};

const formatSplAmount = (amount, decimals = 6) => {
  return amount / Math.pow(10, decimals);
};

module.exports = {
  config,
  connection,
  custodyKeypair,
  custodyBtcSplKeypair,
  generateMemo,
  validateSolanaAddress,
  formatSolAmount,
  formatSplAmount,
  TOKEN_PROGRAM_ID
};
