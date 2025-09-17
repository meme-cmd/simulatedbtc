const jwt = require('jsonwebtoken');
const { config } = require('./solana-config');
const bs58 = require('bs58');
const { PublicKey } = require('@solana/web3.js');

class AuthService {
  constructor() {
    this.nonces = new Map(); // Store nonces for sign-in
  }

  // Generate nonce for wallet authentication
  generateNonce(walletAddress) {
    const nonce = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const message = `Sign this message to authenticate with Bitcoin Mining Simulator.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
    
    this.nonces.set(walletAddress, { nonce, message, createdAt: Date.now() });
    
    // Clean up old nonces (expire after 10 minutes)
    setTimeout(() => {
      this.nonces.delete(walletAddress);
    }, 10 * 60 * 1000);

    return { nonce, message };
  }

  // Verify signed message and generate JWT
  async verifySignature(walletAddress, signature, signedMessage) {
    try {
      const nonceData = this.nonces.get(walletAddress);
      if (!nonceData) {
        return { success: false, error: 'Nonce not found or expired' };
      }

      if (signedMessage !== nonceData.message) {
        return { success: false, error: 'Message mismatch' };
      }

      // Verify signature (simplified for demo - in production use proper verification)
      const publicKey = new PublicKey(walletAddress);
      
      // For demo purposes, we'll assume signature is valid
      // In production, you'd verify the signature against the message
      
      // Generate JWT
      const token = jwt.sign(
        { 
          walletAddress,
          iat: Date.now(),
          exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        },
        config.JWT_SECRET
      );

      // Clean up nonce
      this.nonces.delete(walletAddress);

      return {
        success: true,
        token,
        walletAddress
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      return { valid: true, walletAddress: decoded.walletAddress };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Middleware to verify JWT
  requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const verification = this.verifyToken(token);
    if (!verification.valid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.walletAddress = verification.walletAddress;
    next();
  }
}

module.exports = { AuthService };
