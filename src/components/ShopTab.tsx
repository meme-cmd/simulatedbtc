'use client';

import { useState } from 'react';
import { useRigTiers, useBuyRig, useUserData } from '@/hooks/useUserData';
import { useMiningData } from '@/hooks/useMiningData';

interface ShopRig {
  id: string;
  name: string;
  type: 'basic' | 'advanced' | 'professional' | 'legendary';
  hashRate: number;
  powerConsumption: number;
  efficiency: number;
  price: {
    sol: number;
    usd: number;
  };
  dailyEarnings: number;
  roiDays: number;
  description: string;
  icon: string;
  inStock: number;
  isPopular?: boolean;
  isNew?: boolean;
}

const SHOP_RIGS: ShopRig[] = [
  {
    id: 'shop-1',
    name: 'Antminer S9',
    type: 'basic',
    hashRate: 13.5,
    powerConsumption: 1323,
    efficiency: 98,
    price: { sol: 12.5, usd: 1225 },
    dailyEarnings: 0.0012,
    roiDays: 245,
    description: 'Perfect starter rig for beginners. Reliable and energy-efficient.',
    icon: '🖥️',
    inStock: 15
  },
  {
    id: 'shop-2',
    name: 'Antminer S19 Pro',
    type: 'advanced',
    hashRate: 110,
    powerConsumption: 3250,
    efficiency: 34,
    price: { sol: 89.5, usd: 8765 },
    dailyEarnings: 0.0089,
    roiDays: 189,
    description: 'High-performance mining with excellent efficiency ratio.',
    icon: '⚡',
    inStock: 8,
    isPopular: true
  },
  {
    id: 'shop-3',
    name: 'WhatsMiner M30S++',
    type: 'professional',
    hashRate: 112,
    powerConsumption: 3472,
    efficiency: 31,
    price: { sol: 95.2, usd: 9320 },
    dailyEarnings: 0.0095,
    roiDays: 176,
    description: 'Professional-grade mining rig with superior hash rates.',
    icon: '🔥',
    inStock: 5
  },
  {
    id: 'shop-4',
    name: 'Golden Dragon Miner',
    type: 'legendary',
    hashRate: 250,
    powerConsumption: 4500,
    efficiency: 18,
    price: { sol: 245.8, usd: 24080 },
    dailyEarnings: 0.0234,
    roiDays: 142,
    description: 'Legendary mining rig with unmatched performance and golden aesthetics.',
    icon: '🐲',
    inStock: 2,
    isNew: true
  },
  {
    id: 'shop-5',
    name: 'Eco Miner Green',
    type: 'advanced',
    hashRate: 85,
    powerConsumption: 2100,
    efficiency: 25,
    price: { sol: 67.3, usd: 6595 },
    dailyEarnings: 0.0067,
    roiDays: 198,
    description: 'Environmentally friendly mining with solar panel compatibility.',
    icon: '🌱',
    inStock: 12
  },
  {
    id: 'shop-6',
    name: 'Quantum Hash Pro',
    type: 'legendary',
    hashRate: 300,
    powerConsumption: 5200,
    efficiency: 17,
    price: { sol: 312.5, usd: 30625 },
    dailyEarnings: 0.0289,
    roiDays: 128,
    description: 'Next-generation quantum-enhanced mining technology.',
    icon: '⚛️',
    inStock: 1,
    isNew: true
  }
];

export default function ShopTab() {
  const { telemetry } = useMiningData();
  const rewardKey = telemetry?.currentReward ?? 0;
  const { rigTiers, loading: tiersLoading } = useRigTiers(rewardKey);
  const { userData, refetch: refetchUser } = useUserData();
  const { buyRig, buying } = useBuyRig();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'basic' | 'advanced' | 'professional' | 'legendary'>('all');
  const [sortBy, setSortBy] = useState<'price' | 'hashrate' | 'efficiency' | 'roi'>('price');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedRig, setSelectedRig] = useState<any>(null);
  const [purchaseResult, setPurchaseResult] = useState<{ success: boolean; message: string } | null>(null);

  const filteredRigs = rigTiers.filter(rig => 
    selectedCategory === 'all' || rig.category === selectedCategory
  );

  const sortedRigs = [...filteredRigs].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.priceBTC_SPL - b.priceBTC_SPL;
      case 'hashrate':
        return b.hashrate - a.hashrate;
      case 'efficiency':
        return b.uptime - a.uptime;
      case 'roi':
        return a.priceBTC_SPL / a.hashrate - b.priceBTC_SPL / b.hashrate;
      default:
        return 0;
    }
  });

  const getRigTypeColor = (category: string) => {
    switch (category) {
      case 'basic': return 'text-gray-600 bg-gray-100';
      case 'advanced': return 'text-blue-600 bg-blue-100';
      case 'professional': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handlePurchase = (rig: any) => {
    setSelectedRig(rig);
    setShowPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    if (!selectedRig || !userData) return;

    if (userData.user.balances.BTC_SPL < selectedRig.priceBTC_SPL) {
      setPurchaseResult({
        success: false,
        message: `Insufficient balance. Need ${selectedRig.priceBTC_SPL} $BTC SPL`
      });
      return;
    }

    const result = await buyRig(selectedRig.id);
    
    if (result.success) {
      setPurchaseResult({
        success: true,
        message: `Successfully purchased ${selectedRig.name}! Burned ${selectedRig.priceBTC_SPL} $BTC SPL`
      });
      refetchUser(); // Refresh user data
    } else {
      setPurchaseResult({
        success: false,
        message: result.error || 'Purchase failed'
      });
    }

    setShowPurchaseModal(false);
    setSelectedRig(null);
    
    // Clear result after 5 seconds
    setTimeout(() => setPurchaseResult(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Shop Header */}
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text">🛒 Mining Rig Marketplace</div>
        </div>
        <div className="window-body">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Welcome to the Mining Shop! ⛏️</h2>
              <p className="text-sm text-gray-600">
                Upgrade your mining operation with professional-grade equipment.
                All purchases are made with SOL on the Solana blockchain.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-green-600">Instant Delivery</span>
              <span className="text-blue-600">Secure Payments</span>
              <span className="text-purple-600">Solana Network</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text">🔍 Filters & Sorting</div>
        </div>
        <div className="window-body">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as 'all' | 'basic' | 'advanced' | 'professional' | 'legendary')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="all">All Categories</option>
                <option value="basic">Basic (Starter)</option>
                <option value="advanced">Advanced (Performance)</option>
                <option value="professional">Professional (High-end)</option>
                <option value="legendary">Legendary (Ultimate)</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'hashrate' | 'efficiency' | 'roi')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="price">Price (Low to High)</option>
                <option value="hashrate">Hash Rate (High to Low)</option>
                <option value="efficiency">Efficiency (Best First)</option>
                <option value="roi">ROI (Fastest First)</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {sortedRigs.length} of {SHOP_RIGS.length} rigs
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Result Toast */}
      {purchaseResult && (
        <div className={`window mb-4 ${purchaseResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="window-body">
            <div className={`text-sm ${purchaseResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {purchaseResult.success ? '✅' : '❌'} {purchaseResult.message}
            </div>
          </div>
        </div>
      )}

      {/* User Balance Display */}
      {userData && (
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">💰 Your Balance</div>
          </div>
          <div className="window-body text-center">
            <div className="text-xl font-bold text-orange-600">
              {userData.user.balances.BTC_SPL.toFixed(2)} $BTC SPL
            </div>
            <div className="text-sm text-gray-500">
              Available for purchases
            </div>
          </div>
        </div>
      )}

      {/* Shop Grid */}
      <div className="mining-grid shop-grid">
        {tiersLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="text-4xl mb-2">⏳</div>
            <p>Loading rig tiers...</p>
          </div>
        ) : (
          sortedRigs.map((rig) => (
            <div key={rig.id} className="window relative">
              <div className="title-bar">
                <div className="title-bar-text">{rig.name}</div>
              </div>
              <div className="window-body">
                <div className="space-y-4">
                  {/* Rig Type Badge */}
                  <div className="flex justify-between items-start">
                    <span className={`text-xs px-2 py-1 font-medium ${getRigTypeColor(rig.category)}`} style={{borderRadius: '0'}}>
                      {rig.category.toUpperCase()}
                    </span>
                    <div className="text-right">
                      <div className="text-sm text-green-600">
                        In Stock
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600">{rig.description}</p>

                  {/* Specifications */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Hash Rate:</span>
                      <span className="font-mono font-bold">{rig.hashrate} TH/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className="font-mono">{(rig.uptime * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effective Rate:</span>
                      <span className="font-mono text-blue-600">{(rig.hashrate * rig.uptime).toFixed(1)} TH/s</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {rig.priceBTC_SPL} $BTC
                        </div>
                        <div className="text-sm text-gray-500">
                          SPL Token · Price auto-adjusts with halving
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-600">ROI:</div>
                        <div className="font-bold text-blue-600">
                          {(rig.priceBTC_SPL / rig.hashrate).toFixed(1)} $BTC/TH
                        </div>
                      </div>
                    </div>

                    {/* Buy Button */}
                    <button
                      onClick={() => handlePurchase(rig)}
                      disabled={buying || (telemetry?.seasonEnded ?? false) || (userData && userData.user.balances.BTC_SPL < rig.priceBTC_SPL)}
                      className={`w-full py-3 px-4 font-medium transition-colors ${
                        !telemetry?.seasonEnded && userData && userData.user.balances.BTC_SPL >= rig.priceBTC_SPL && !buying
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {telemetry?.seasonEnded ? 'Season Ended' : buying ? 'Purchasing...' : 
                       userData && userData.user.balances.BTC_SPL < rig.priceBTC_SPL ? 'Insufficient Balance' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedRig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="window" style={{ width: '500px', maxWidth: '90vw' }}>
            <div className="title-bar">
              <div className="title-bar-text">Confirm Purchase</div>
              <div className="title-bar-controls">
                <button 
                  aria-label="Close" 
                  onClick={() => setShowPurchaseModal(false)}
                />
              </div>
            </div>
            <div className="window-body">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-gray-600">[{selectedRig.category.toUpperCase()}]</span>
                  <div>
                    <h3 className="text-xl font-bold">{selectedRig.name}</h3>
                    <span className={`text-sm px-2 py-1 ${getRigTypeColor(selectedRig.category)}`} style={{borderRadius: '0'}}>
                      {selectedRig.category.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="border p-4 bg-gray-50" style={{borderRadius: '0'}}>
                  <h4 className="font-bold mb-2">Purchase Summary:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Item Price:</span>
                      <span className="font-mono">{selectedRig.priceBTC_SPL} $BTC SPL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Balance:</span>
                      <span className="font-mono">{userData?.user.balances.BTC_SPL.toFixed(2) || 0} $BTC SPL</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>After Purchase:</span>
                      <span className="font-mono">
                        {userData ? (userData.user.balances.BTC_SPL - selectedRig.priceBTC_SPL).toFixed(2) : 0} $BTC SPL
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4" style={{borderRadius: '0'}}>
                  <h4 className="font-bold text-blue-800 mb-2">💡 Mining Analysis:</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div>• Hash Rate: {selectedRig.hashrate} TH/s</div>
                    <div>• Uptime: {(selectedRig.uptime * 100).toFixed(1)}%</div>
                    <div>• Effective Rate: {(selectedRig.hashrate * selectedRig.uptime).toFixed(1)} TH/s</div>
                    <div>• Cost per TH/s: {(selectedRig.priceBTC_SPL / selectedRig.hashrate).toFixed(1)} $BTC</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPurchase}
                    disabled={buying || (userData && userData.user.balances.BTC_SPL < selectedRig.priceBTC_SPL)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600"
                  >
                    {buying ? 'Processing...' : 'Buy Rig'}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Purchasing will burn $BTC SPL tokens and add the rig to your inventory.
                  Your effective hash rate will increase immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
