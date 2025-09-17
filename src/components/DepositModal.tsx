'use client';

import { useState, useEffect } from 'react';
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
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID
} from '@solana/spl-token';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [currency, setCurrency] = useState<'BTC_SPL' | 'SOL'>('BTC_SPL');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'input' | 'processing' | 'success' | 'error'>('input');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setStatus('input');
      setResult(null);
      setAmount('');
    }
  }, [isOpen]);

  const handleDeposit = async () => {
    if (!connected || !publicKey || !sendTransaction) {
      alert('Please connect your wallet first');
      return;
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setStatus('processing');

    try {
      // Get custody address from backend
      const response = await fetch(`${BACKEND_HTTP_URL}/api/payments/custody-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': 'demo-user'
        },
        body: JSON.stringify({ currency })
      });
      if (!response.ok) {
        const raw = await response.text();
        throw new Error(`Custody address failed (${response.status}): ${raw.slice(0, 200)}`);
      }
      const { custodyAddress, memo } = await response.json();
      
      let transaction: Transaction;

      if (currency === 'SOL') {
        // Create SOL transfer transaction
        transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(custodyAddress),
            lamports: depositAmount * LAMPORTS_PER_SOL
          })
        );
      } else {
        // Create SPL token transfer transaction
        const BTC_SPL_MINT = new PublicKey('3zY6EXputsabfL3kQeXNycoejbaNU7AkLokrmy53pump');

        // Detect token program and decimals
        const mintParsed = await connection.getParsedAccountInfo(BTC_SPL_MINT);
        const ownerStr = mintParsed.value?.owner?.toString?.() || '';
        const programId = ownerStr === TOKEN_2022_PROGRAM_ID.toString() ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
        const decimals = (mintParsed.value as any)?.data?.parsed?.info?.decimals ?? 6;

        const fromATA = await getAssociatedTokenAddress(BTC_SPL_MINT, publicKey, false, programId);
        const toOwner = new PublicKey(custodyAddress);
        const toATA = await getAssociatedTokenAddress(BTC_SPL_MINT, toOwner, false, programId);

        const amountUnits = Math.round(depositAmount * Math.pow(10, decimals));
        transaction = new Transaction();

        // Ensure destination ATA exists; create if missing
        const toAtaInfo = await connection.getAccountInfo(toATA);
        if (!toAtaInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey, // payer
              toATA, // ata
              toOwner, // owner
              BTC_SPL_MINT, // mint
              programId
            )
          );
        }

        transaction.add(
          createTransferInstruction(
            fromATA,
            toATA,
            publicKey,
            amountUnits,
            [],
            programId
          )
        );
      }

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation (finalized)
      const latest = await connection.getLatestBlockhash('finalized');
      await connection.confirmTransaction({ signature, ...latest }, 'finalized');

      // Notify backend of successful deposit
      const confirmRes = await fetch(`${BACKEND_HTTP_URL}/api/payments/deposit/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': 'demo-user'
        },
        body: JSON.stringify({
          signature,
          amount: depositAmount,
          currency,
          memo,
          userWallet: publicKey.toString()
        })
      });
      if (!confirmRes.ok) {
        const raw = await confirmRes.text();
        throw new Error(`Deposit confirm failed (${confirmRes.status}): ${raw.slice(0, 200)}`);
      }

      setResult({
        signature,
        amount: depositAmount,
        currency,
        explorerUrl: `https://explorer.solana.com/tx/${signature}`
      });
      setStatus('success');
      onSuccess();

    } catch (error) {
      console.error('Deposit failed:', error);
      setResult({ error: error instanceof Error ? error.message : 'Deposit failed' });
      setStatus('error');
    }
  };


  const presetAmounts = currency === 'BTC_SPL' ? [100, 500, 1000, 2500] : [0.1, 0.5, 1, 2];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="window" style={{ width: '500px', maxWidth: '90vw' }}>
        <div className="title-bar">
          <div className="title-bar-text">💰 Deposit Funds</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="window-body">
          {status === 'input' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Deposit to Your Mining Account</h3>
                <p className="text-sm text-gray-600">
                  Transfer funds from your Solana wallet to start mining.
                </p>
              </div>

              {/* Currency Selection */}
              <fieldset>
                <legend>Currency</legend>
                <div className="space-y-2">
                  <div className="field-row">
                    <input
                      type="radio"
                      id="btc-spl"
                      name="currency"
                      value="BTC_SPL"
                      checked={currency === 'BTC_SPL'}
                      onChange={(e) => setCurrency(e.target.value as 'BTC_SPL')}
                    />
                    <label htmlFor="btc-spl">$BTC SPL (Primary currency for mining)</label>
                  </div>
                  <div className="field-row">
                    <input
                      type="radio"
                      id="sol"
                      name="currency"
                      value="SOL"
                      checked={currency === 'SOL'}
                      onChange={(e) => setCurrency(e.target.value as 'SOL')}
                    />
                    <label htmlFor="sol">SOL (For fees and alternative payments)</label>
                  </div>
                </div>
              </fieldset>

              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium mb-2">
                  Amount ({currency})
                </label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Enter ${currency} amount`}
                  className="w-full px-3 py-2 border"
                  step={currency === 'SOL' ? '0.1' : '1'}
                  min="0"
                />
              </div>

              {/* Preset Amounts */}
              <div>
                <label className="block text-sm font-medium mb-2">Quick Amounts:</label>
                <div className="flex gap-2 flex-wrap">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset.toString())}
                      className="px-3 py-1 text-sm"
                    >
                      {preset} {currency}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3" style={{borderRadius: '0'}}>
                <div className="text-sm text-blue-700">
                  <strong>💡 How it works:</strong> Click "Sign & Deposit" to create a transaction in your wallet. 
                  Your wallet will prompt you to approve the transfer to our custody address.
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={!amount || !connected || parseFloat(amount) <= 0}
                  className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                >
                  🔐 Sign & Deposit
                </button>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="space-y-4 text-center">
              <div className="text-4xl mb-2">🔐</div>
              <h3 className="font-bold">Sign Transaction in Wallet</h3>
              <p className="text-sm text-gray-600">
                Please approve the transaction in your Solana wallet to complete the deposit.
              </p>
              <div className="bg-blue-50 border border-blue-200 p-3" style={{borderRadius: '0'}}>
                <div className="text-sm text-blue-700">
                  Depositing: <strong>{amount} {currency}</strong>
                </div>
              </div>
            </div>
          )}

          {status === 'success' && result && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="font-bold text-green-600">Deposit Successful!</h3>
                <p className="text-sm">
                  {result.amount} {result.currency} has been deposited to your mining account.
                </p>
              </div>

              {/* Transaction Details */}
              <div className="bg-green-50 border border-green-200 p-3" style={{borderRadius: '0'}}>
                <div className="text-sm">
                  <div className="font-medium mb-2">Transaction Details:</div>
                  <div className="space-y-1 font-mono text-xs">
                    <div>Amount: {result.amount} {result.currency}</div>
                    <div>Tx: {result.signature?.slice(0, 20)}...</div>
                  </div>
                </div>
              </div>

              {/* Explorer Link */}
              <div className="text-center">
                <a
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  View on Solana Explorer →
                </a>
              </div>

              <button onClick={onClose} className="w-full bg-green-500 text-white hover:bg-green-600">
                Continue Mining
              </button>
            </div>
          )}

          {status === 'error' && result && (
            <div className="space-y-4 text-center">
              <div className="text-4xl mb-2">❌</div>
              <h3 className="font-bold text-red-600">Deposit Failed</h3>
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
