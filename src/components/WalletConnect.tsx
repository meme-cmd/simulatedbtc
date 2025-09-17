'use client';

import { useState } from 'react';

// Mock wallet data - in a real app, you'd use @solana/wallet-adapter
const SUPPORTED_WALLETS = [
  {
    name: 'Phantom',
    icon: '👻',
    url: 'https://phantom.app/',
    installed: typeof window !== 'undefined' && 'phantom' in window
  },
  {
    name: 'Solflare',
    icon: '🔥',
    url: 'https://solflare.com/',
    installed: typeof window !== 'undefined' && 'solflare' in window
  },
  {
    name: 'Backpack',
    icon: '🎒',
    url: 'https://backpack.app/',
    installed: typeof window !== 'undefined' && 'backpack' in window
  }
];

export default function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [balance, setBalance] = useState(0);

  const handleConnect = async (walletName: string) => {
    try {
      // Mock connection logic - replace with actual wallet adapter
      setIsConnected(true);
      setConnectedWallet(walletName);
      setBalance(Math.random() * 10); // Mock balance
      setShowWalletModal(false);
      
      // In a real app, you'd do:
      // const wallet = wallets.find(w => w.adapter.name === walletName);
      // await wallet.adapter.connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectedWallet(null);
    setBalance(0);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Mock address for demo
  const mockAddress = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

  if (isConnected && connectedWallet) {
    return (
      <div className="flex items-center space-x-4">
        {/* Balance Display */}
        <div className="window" style={{ padding: '4px 8px', margin: 0 }}>
          <div className="flex items-center space-x-2 text-sm">
            <span>💰</span>
            <span className="font-mono">{balance.toFixed(3)} SOL</span>
          </div>
        </div>

        {/* Connected Wallet Info */}
        <div className="window" style={{ padding: '4px 8px', margin: 0 }}>
          <div className="flex items-center space-x-2 text-sm">
            <span>{SUPPORTED_WALLETS.find(w => w.name === connectedWallet)?.icon}</span>
            <span className="font-mono">{formatAddress(mockAddress)}</span>
          </div>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={handleDisconnect}
          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowWalletModal(true)}
        className="px-4 py-2 bg-green-500 text-white font-medium rounded hover:bg-green-600 flex items-center space-x-2"
      >
        <span>🔗</span>
        <span>Connect Wallet</span>
      </button>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="window" style={{ width: '400px' }}>
            <div className="title-bar">
              <div className="title-bar-text">🔗 Connect Your Wallet</div>
              <div className="title-bar-controls">
                <button 
                  aria-label="Close" 
                  onClick={() => setShowWalletModal(false)}
                />
              </div>
            </div>
            <div className="window-body">
              <p className="mb-4 text-sm">
                Choose your preferred Solana wallet to connect:
              </p>
              
              <div className="space-y-3">
                {SUPPORTED_WALLETS.map((wallet) => (
                  <div key={wallet.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div>
                        <div className="font-medium">{wallet.name}</div>
                        <div className="text-xs text-gray-500">
                          {wallet.installed ? 'Installed' : 'Not installed'}
                        </div>
                      </div>
                    </div>
                    
                    {wallet.installed ? (
                      <button
                        onClick={() => handleConnect(wallet.name)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Connect
                      </button>
                    ) : (
                      <a
                        href={wallet.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                      >
                        Install
                      </a>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t">
                <p className="text-xs text-gray-500">
                  💡 New to Solana wallets? We recommend starting with Phantom - 
                  it&apos;s beginner-friendly and secure.
                </p>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
