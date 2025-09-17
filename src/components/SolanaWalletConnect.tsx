'use client';

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

export default function SolanaWalletConnect() {
  const { publicKey, disconnect, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [showCopied, setShowCopied] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [btcSplBalance, setBtcSplBalance] = useState<number | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);

  const BTC_SPL_MINT = useState(() => new PublicKey('3zY6EXputsabfL3kQeXNycoejbaNU7AkLokrmy53pump'))[0];

  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const copyAddress = async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toString());
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    let cancelled = false;
    const fetchBalances = async () => {
      if (!connected || !publicKey) {
        setSolBalance(null);
        setBtcSplBalance(null);
        return;
      }
      try {
        setLoadingBalances(true);
        // SOL balance
        const lamports = await connection.getBalance(publicKey);
        const sol = lamports / LAMPORTS_PER_SOL;
        // BTC SPL token balance
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: BTC_SPL_MINT });
        let btc = 0;
        const first = tokenAccounts.value[0];
        if (first) {
          const tokenAmount = (first.account.data as any)?.parsed?.info?.tokenAmount;
          if (tokenAmount) {
            // Prefer uiAmount if available
            btc = typeof tokenAmount.uiAmount === 'number'
              ? tokenAmount.uiAmount
              : Number(tokenAmount.amount || 0) / Math.pow(10, tokenAmount.decimals ?? 6);
          }
        }
        if (!cancelled) {
          setSolBalance(sol);
          setBtcSplBalance(btc);
        }
      } catch (err) {
        console.error('Failed to fetch balances:', err);
        if (!cancelled) {
          setSolBalance(0);
          setBtcSplBalance(0);
        }
      } finally {
        if (!cancelled) setLoadingBalances(false);
      }
    };
    fetchBalances();
    return () => { cancelled = true; };
  }, [connected, publicKey, connection, BTC_SPL_MINT]);

  if (connected && publicKey) {
    return (
      <div className="flex items-center space-x-3">
        {/* Balance Info */}
        <div className="window" style={{ padding: '4px 8px', margin: 0 }}>
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-1">
              <span>◎</span>
              <span className="font-mono">{loadingBalances || solBalance === null ? '—' : solBalance.toFixed(3)} SOL</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>₿</span>
              <span className="font-mono">{loadingBalances || btcSplBalance === null ? '—' : btcSplBalance.toFixed(3)} $BTC</span>
            </div>
          </div>
        </div>
        {/* Wallet Info */}
        <div className="window" style={{ padding: '4px 8px', margin: 0 }}>
          <div className="flex items-center space-x-2 text-sm">
            <span>🟢</span>
            <span className="font-mono">{formatAddress(publicKey.toString())}</span>
            <button
              onClick={copyAddress}
              className="text-xs px-1"
              title="Copy wallet address"
            >
              {showCopied ? '✓' : '📋'}
            </button>
          </div>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={handleDisconnect}
          className="px-3 py-1 bg-red-500 text-white text-sm hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 bg-green-500 text-white font-medium hover:bg-green-600 flex items-center space-x-2"
    >
      <span>Connect Wallet</span>
    </button>
  );
}
