'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { BACKEND_HTTP_URL } from '@/lib/config';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance: number;
}

export default function WithdrawModal({ isOpen, onClose, onSuccess, currentBalance }: WithdrawModalProps) {
  const { publicKey, connected } = useWallet();
  const [amount, setAmount] = useState('');
  const [toPubkey, setToPubkey] = useState('');
  const [status, setStatus] = useState<'input' | 'processing' | 'success' | 'error'>('input');
  const [result, setResult] = useState<any>(null);

  const handleWithdraw = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount <= 0 || withdrawAmount > currentBalance) {
      alert('Invalid amount');
      return;
    }

    setStatus('processing');

    try {
      // Create on-chain withdrawal from custody wallet
      const confirmResponse = await fetch(`${BACKEND_HTTP_URL}/api/payments/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': 'demo-user'
        },
        body: JSON.stringify({
          amount: withdrawAmount,
          toPubkey: toPubkey || publicKey.toString()
        })
      });

      const raw = await confirmResponse.text();
      if (!confirmResponse.ok) {
        throw new Error(raw.slice(0, 200) || 'Withdrawal failed');
      }
      const confirmData = JSON.parse(raw);

      if (confirmData.queued) {
        setResult({
          amount: withdrawAmount,
          toPubkey: toPubkey || publicKey.toString(),
          queued: true,
          message: 'Withdrawal queued. Custody liquidity is low; please try again shortly.'
        });
        setStatus('success');
        onSuccess();
        return;
      }

      setResult({
        amount: withdrawAmount,
        toPubkey: toPubkey || publicKey.toString(),
        txSignature: confirmData.signature,
        explorerUrl: `https://explorer.solana.com/tx/${confirmData.signature}`
      });
      setStatus('success');
      onSuccess();
    } catch (error) {
      console.error('Withdrawal failed:', error);
      setResult({ error: error instanceof Error ? error.message : 'Withdrawal failed' });
      setStatus('error');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const presetAmounts = [50, 100, 250, 500];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="window" style={{ width: '450px', maxWidth: '90vw' }}>
        <div className="title-bar">
          <div className="title-bar-text">💸 Withdraw Funds</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="window-body">
          {status === 'input' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Withdraw $BTC SPL to Wallet</h3>
                <p className="text-sm text-gray-600">
                  Transfer your earned $BTC SPL tokens back to your Solana wallet.
                </p>
              </div>

              {/* Current Balance */}
              <div className="bg-blue-50 border border-blue-200 p-3" style={{borderRadius: '0'}}>
                <div className="text-sm">
                  <strong>Available Balance:</strong> {currentBalance.toFixed(4)} $BTC SPL
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label htmlFor="withdraw-amount" className="block text-sm font-medium mb-2">
                  Withdrawal Amount ($BTC SPL)
                </label>
                <input
                  id="withdraw-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  className="w-full px-3 py-2 border"
                  step="0.01"
                  min="0"
                  max={currentBalance}
                />
              </div>

              {/* Preset Amounts */}
              <div>
                <label className="block text-sm font-medium mb-2">Quick Amounts:</label>
                <div className="flex gap-2 flex-wrap">
                  {presetAmounts
                    .filter(preset => preset <= currentBalance)
                    .map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset.toString())}
                      className="px-3 py-1 text-sm"
                    >
                      {preset} $BTC
                    </button>
                  ))}
                  <button
                    onClick={() => setAmount(currentBalance.toString())}
                    className="px-3 py-1 text-sm bg-gray-100"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Destination Address */}
              <div>
                <label htmlFor="to-address" className="block text-sm font-medium mb-2">
                  Destination Address (Optional)
                </label>
                <input
                  id="to-address"
                  type="text"
                  value={toPubkey}
                  onChange={(e) => setToPubkey(e.target.value)}
                  placeholder={`Default: ${publicKey?.toString().slice(0, 20)}...`}
                  className="w-full px-3 py-2 border font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to withdraw to your connected wallet
                </p>
              </div>

              {/* Transaction Notice */}
              <div className="bg-blue-50 border border-blue-200 p-3" style={{borderRadius: '0'}}>
                <div className="text-sm text-blue-700">
                  <strong>🔐 Wallet Transaction:</strong> Your wallet will create and sign the withdrawal transaction. 
                  Network fees (~0.001 SOL) will be paid from your wallet.
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={!amount || !connected || parseFloat(amount) <= 0 || parseFloat(amount) > currentBalance}
                  className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                >
                  🔐 Sign & Withdraw
                </button>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="space-y-4 text-center">
              <div className="text-4xl mb-2">⏳</div>
              <h3 className="font-bold">Processing Withdrawal...</h3>
              <p className="text-sm text-gray-600">
                Creating on-chain transaction. This may take a few moments.
              </p>
            </div>
          )}

          {status === 'success' && result && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="font-bold text-green-600">Withdrawal Successful!</h3>
                <p className="text-sm">
                  {amount} $BTC SPL has been sent to your wallet.
                </p>
              </div>

              {/* Transaction Details */}
              <div className="bg-green-50 border border-green-200 p-3" style={{borderRadius: '0'}}>
                <div className="text-sm">
                  <div className="font-medium mb-2">Transaction Details:</div>
                  <div className="space-y-1 font-mono text-xs">
                    <div>Amount: {amount} $BTC SPL</div>
                    <div>To: {(toPubkey || publicKey?.toString() || '').slice(0, 20)}...</div>
                    <div>Tx: {result.txSignature?.slice(0, 20)}...</div>
                  </div>
                </div>
              </div>

              {/* Explorer Link */}
              <div className="text-center">
                <a
                  href={`https://explorer.solana.com/tx/${result.txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  View on Solana Explorer →
                </a>
              </div>

              <button onClick={onClose} className="w-full bg-green-500 text-white hover:bg-green-600">
                Close
              </button>
            </div>
          )}

          {status === 'error' && result && (
            <div className="space-y-4 text-center">
              <div className="text-4xl mb-2">❌</div>
              <h3 className="font-bold text-red-600">Withdrawal Failed</h3>
              <p className="text-sm text-red-600">
                {result.error}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setStatus('input')} className="flex-1">
                  Try Again
                </button>
                <button onClick={onClose} className="flex-1">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
