'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import SolanaWalletConnect from './SolanaWalletConnect';
import InventoryTab from './InventoryTab';
import ShopTab from './ShopTab';
import ConnectionStatus from './ConnectionStatus';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import GameClock from './GameClock';
import { useMiningData } from '@/hooks/useMiningData';
import { useUserData } from '@/hooks/useUserData';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'shop'>('inventory');
  const { telemetry, recentBlocks, isConnected } = useMiningData();
  const { userData, refetch: refetchUser } = useUserData();
  const { connected } = useWallet();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="retro-bg-xp min-h-screen">
      {/* Scanlines effect */}
      <div className="scanlines" />
      
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-b from-blue-600 to-blue-800 border-b-2 border-blue-900 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center space-x-4">
            <div className="text-white font-bold text-xl flex items-center">
              Bitcoin Mining Simulator
            </div>
            <Link 
              href="/blocks" 
              className="px-3 py-1 bg-white text-blue-800 hover:bg-blue-50 text-sm font-medium border border-gray-300 transition-colors"
              style={{borderRadius: '0'}}
            >
              Live Blocks
            </Link>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-blue-200">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Wallet Connect */}
          <SolanaWalletConnect />
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Connection Status and Clock */}
        <div className="flex justify-between items-start mb-4">
          {!isConnected && <ConnectionStatus isConnected={isConnected} />}
          {isConnected && <div></div>}
          <GameClock gameTime={telemetry?.gameTime} />
        </div>
        
        {/* Welcome Window */}
        <div className="window mb-6 window-slide-in">
          <div className="title-bar">
            <div className="title-bar-text">Mining Dashboard - Welcome to 2009!</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body">
            <div className="flex flex-col md:flex-row items-center justify-between p-4">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl font-bold mb-2">Welcome to Bitcoin Mining Simulator</h2>
                <p className="text-sm text-gray-600">
                  Experience the golden age of Bitcoin mining with authentic Windows XP styling.
                  Build your mining empire, collect rigs, and earn rewards.{' '}
                  <button
                    className="underline text-blue-600 hover:text-blue-800"
                    onClick={() => setShowTutorial(true)}
                  >
                    Tutorial
                  </button>
                </p>
              </div>
                <div className="flex gap-2">
                  {connected && (
                    <>
                      <button 
                        onClick={() => setShowDepositModal(true)}
                        className="px-4 py-2 bg-green-500 text-white hover:bg-green-600"
                      >
                        Deposit
                      </button>
                      <button 
                        onClick={() => setShowWithdrawModal(true)}
                        className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600"
                        disabled={!userData || userData.user.balances.BTC_SPL < 1}
                      >
                        Withdraw
                      </button>
                    </>
                  )}
                </div>
            </div>
          </div>
        </div>

        {/* Main Tabbed Interface */}
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">Mining Operations Control Panel</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body p-0">
            {/* Tab Navigation */}
            <div className="tabs">
              <menu role="tablist" className="border-b">
                  <button 
                    role="tab"
                    aria-selected={activeTab === 'inventory'}
                    onClick={() => setActiveTab('inventory')}
                    className={`px-6 py-3 font-medium ${
                      activeTab === 'inventory' 
                        ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Inventory
                  </button>
                  <button 
                    role="tab"
                    aria-selected={activeTab === 'shop'}
                    onClick={() => setActiveTab('shop')}
                    className={`px-6 py-3 font-medium ${
                      activeTab === 'shop' 
                        ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Shop
                  </button>
              </menu>

              {/* Tab Content */}
              <div className="p-6 min-h-[600px]">
                {activeTab === 'inventory' && <InventoryTab />}
                {activeTab === 'shop' && <ShopTab />}
              </div>
            </div>
          </div>
        </div>

        {/* Live Network Status */
        }
        <div className="mt-8">
          <div className="window">
            <div className="title-bar">
              <div className="title-bar-text">Live Network Status</div>
            </div>
            <div className="window-body">
              <div className="status-bar">
                <p className="status-bar-field">
                  Height: {telemetry?.height || 0}
                </p>
                <p className="status-bar-field">
                  Avg Block Time: {telemetry?.avgBlockTime.toFixed(1) || 0}s
                </p>
                {telemetry?.emissions && (
                  <>
                    <p className="status-bar-field">
                      Current Reward: {telemetry.currentReward.toFixed(3)} $BTC
                    </p>
                    <p className="status-bar-field">
                      Blocks Remaining: {telemetry.emissions.blocksRemaining}
                    </p>
                    <p className="status-bar-field">
                      Next Halving: {telemetry.nextHalvingHeight !== null ? (telemetry.nextHalvingHeight - telemetry.height) : '—'}
                    </p>
                    <p className="status-bar-field">
                      Emitted: {telemetry.emissions.emittedTotal.toFixed(0)} / {telemetry.emissions.totalEmission.toFixed(0)}
                    </p>
                  </>
                )}
                <p className="status-bar-field">
                  Burned: {telemetry?.globalBurned.toFixed(0) || 0} $BTC
                </p>
                <p className="status-bar-field">
                  Circulating: {telemetry?.circulatingSupply.toFixed(0) || 0} $BTC
                </p>
                <p className="status-bar-field">
                  Network: {telemetry?.networkHashrate.toFixed(1) || 0} TH/s
                </p>
                <p className="status-bar-field">
                  Your EHR: {telemetry?.yourEHR?.toFixed(1) || 0} TH/s
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Blocks */}
        <div className="mt-6">
          <div className="window">
            <div className="title-bar">
              <div className="title-bar-text">Recent Blocks</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="font-bold">Latest Mined Blocks</h3>
                <Link 
                  href="/blocks" 
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  View All Blocks →
                </Link>
              </div>
              
              {recentBlocks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Height</th>
                        <th className="text-left p-2">Time</th>
                        <th className="text-left p-2">Reward</th>
                        <th className="text-left p-2">Difficulty</th>
                        <th className="text-left p-2">Tx Count</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBlocks.slice(0, 10).map((block) => (
                        <tr key={block.height} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-mono">{block.height}</td>
                          <td className="p-2">
                            {Math.floor((Date.now() - block.timestamp) / 1000)}s ago
                          </td>
                          <td className="p-2 font-mono text-green-600">
                            {block.reward?.toFixed(4) || 0} BTC
                          </td>
                          <td className="p-2 font-mono text-xs">
                            {block.difficulty?.toExponential(1) || 'N/A'}
                          </td>
                          <td className="p-2 font-mono">{block.txCount || 0}</td>
                          <td className="p-2">
                            {block.isOrphan ? (
                              <span className="text-red-600 text-xs">🔴 Orphan</span>
                            ) : (
                              <span className="text-green-600 text-xs">✅ Valid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">...</div>
                  <p>Waiting for blocks to be mined...</p>
                  <p className="text-xs mt-2">
                    Connection status: {isConnected ? 'Connected' : 'Connecting...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={() => {
          setShowDepositModal(false);
          refetchUser();
        }}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSuccess={() => {
          setShowWithdrawModal(false);
          refetchUser();
        }}
        currentBalance={userData?.user.balances.BTC_SPL || 0}
      />

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="window" style={{ width: '720px', maxWidth: '95vw' }}>
            <div className="title-bar">
              <div className="title-bar-text">📘 How the Bitcoin Mining Simulator Works</div>
              <div className="title-bar-controls">
                <button aria-label="Close" onClick={() => setShowTutorial(false)} />
              </div>
            </div>
            <div className="window-body">
              <div className="space-y-3 text-sm">
                <p>
                  This simulator compresses Bitcoin history into a 7‑day season with halving events at fixed block heights.
                  Each block mints a subsidy that halves 4 times across the season. Your rigs contribute Effective Hash Rate (EHR),
                  and rewards are split among players proportional to EHR.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Current Reward</strong>: live block subsidy; halves at each epoch boundary.</li>
                  <li><strong>Rigs</strong>: buy rigs to increase your EHR. Higher EHR = bigger share of each block.</li>
                  <li><strong>Estimated Earnings</strong>: calculated from your EHR share × blocks per day × current reward.</li>
                  <li><strong>Prices</strong>: pegged to the current reward and auto-adjust at halvings.</li>
                  <li><strong>Season End</strong>: when the total emission is exhausted, mining stops.</li>
                </ul>
                <div className="bg-blue-50 border border-blue-200 p-3" style={{borderRadius: '0'}}>
                  <div className="font-mono text-xs">
                    Tip: Watch the “Next Halving” and “Current Reward” chips on the dashboard to time your purchases.
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowTutorial(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
