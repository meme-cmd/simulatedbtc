'use client';

import { useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { useMiningData } from '@/hooks/useMiningData';

export default function InventoryTab() {
  const { userData, loading: userLoading, refetch } = useUserData();
  const { telemetry } = useMiningData();
  const [selectedRig, setSelectedRig] = useState<string | null>(null);

  const toggleRig = async (rigId: string) => {
    // TODO: Implement rig toggle API call
    console.log('Toggle rig:', rigId);
    // For now, just refetch data
    refetch();
  };

  const repairRig = async (rigId: string) => {
    try {
      const response = await fetch('/api/rigs/repair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': 'demo-user'
        },
        body: JSON.stringify({ rigId })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`Rig repaired successfully! Cost: ${result.repairCost} BTC SPL`);
        refetch();
      } else {
        alert(`Repair failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Repair error:', error);
      alert('Failed to repair rig');
    }
  };

  const calculateEstimatedDailyReward = (hashrate: number, uptime: number): number => {
    if (!telemetry || telemetry.networkHashrate === 0) return 0;
    
    const userEHR = hashrate * uptime;
    const userShare = userEHR / telemetry.networkHashrate;
    const blocksPerDay = (24 * 60 * 60) / telemetry.avgBlockTime;
    const dailyReward = blocksPerDay * telemetry.currentReward * userShare;
    
    return dailyReward;
  };

  const getRigTypeColor = (category: string) => {
    switch (category) {
      case 'basic': return 'text-gray-600 bg-gray-100';
      case 'advanced': return 'text-blue-600 bg-blue-100';
      case 'professional': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 0.95) return 'text-green-600';
    if (uptime >= 0.90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-green-600';
    if (quality >= 60) return 'text-yellow-600';
    if (quality >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">...</div>
          <p>Loading your mining data...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p>Failed to load user data</p>
          <button onClick={refetch} className="mt-4 px-4 py-2">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 balance-grid">
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">💰 In-Game Balance</div>
          </div>
          <div className="window-body text-center">
            <div className="text-xl font-bold text-orange-600">
              {userData.user.balances.BTC_SPL.toFixed(2)} $BTC
            </div>
            <div className="text-sm text-gray-500">
              Available for mining
            </div>
          </div>
        </div>

        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">⚡ Your EHR</div>
          </div>
          <div className="window-body text-center">
            <div className="text-xl font-bold text-purple-600">
              {userData.ehr.toFixed(1)} TH/s
            </div>
            <div className="text-sm text-gray-500">
              Effective Hash Rate
            </div>
          </div>
        </div>

        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">📈 Total Earned</div>
          </div>
          <div className="window-body text-center">
            <div className="text-xl font-bold text-green-600">
              {userData.user.totalEarned.toFixed(4)} $BTC
            </div>
            <div className="text-sm text-gray-500">
              Mining rewards
            </div>
          </div>
        </div>

        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">🔥 Global Burned</div>
          </div>
          <div className="window-body text-center">
            <div className="text-xl font-bold text-red-600">
              {telemetry?.globalBurned.toFixed(0) || 0} $BTC
            </div>
            <div className="text-sm text-gray-500">
              Tokens burned
            </div>
          </div>
        </div>
      </div>

      {/* Mining Stats */}
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text">📊 Mining Statistics</div>
        </div>
        <div className="window-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{userData.rigs.filter(r => r.isActive).length}</div>
              <div className="text-sm text-gray-600">Active Rigs</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {userData.ehr.toFixed(1)} TH/s
              </div>
              <div className="text-sm text-gray-600">Your EHR</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {telemetry ? (userData.ehr / telemetry.networkHashrate * 100).toFixed(2) : 0}%
              </div>
              <div className="text-sm text-gray-600">Network Share</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {userData.user.totalEarned.toFixed(4)} $BTC
              </div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mining Rigs */}
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text">⛏️ Your Mining Rigs ({userData.rigs.length})</div>
        </div>
        <div className="window-body">
          <div className="mining-grid">
            {userData.rigs.map((rig) => (
              <div
                key={rig.id}
                className={`mining-rig-card cursor-pointer transition-all ${
                  selectedRig === rig.id ? 'border-blue-500' : ''
                }`}
                onClick={() => setSelectedRig(selectedRig === rig.id ? null : rig.id)}
              >
                <div className="rig-header">
                  <div className="rig-info">
                    <span className="text-2xl">{rig.tier.icon}</span>
                    <div>
                      <h3 className="font-bold text-sm">{rig.tier.name}</h3>
                      <span className={`text-xs px-2 py-1 ${getRigTypeColor(rig.tier.category)}`} style={{borderRadius: '0'}}>
                        {rig.tier.category.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="rig-status">
                    <div className={`w-3 h-3 ${rig.isActive ? 'bg-green-500' : 'bg-red-500'}`} style={{borderRadius: '50%'}} />
                    <span className="text-xs text-gray-500">
                      {rig.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="rig-stats">
                  <div className="stat-row">
                    <span>Hash Rate:</span>
                    <span className="font-mono">{rig.tier.hashrate} TH/s</span>
                  </div>
                  <div className="stat-row">
                    <span>Uptime:</span>
                    <span className={`font-mono ${getUptimeColor(rig.uptime)}`}>
                      {(rig.uptime * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="stat-row">
                    <span>Quality:</span>
                    <span className={`font-mono ${getQualityColor(rig.quality || 100)}`}>
                      {(rig.quality || 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="stat-row">
                    <span>Est. Daily:</span>
                    <span className="font-mono text-green-600">
                      {rig.isActive ? `+${calculateEstimatedDailyReward(rig.tier.hashrate * (rig.quality || 100) / 100, rig.uptime).toFixed(4)} $BTC` : '0 $BTC'}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span>Purchased:</span>
                    <span className="font-mono text-gray-600 text-xs">
                      {new Date(rig.purchasedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="rig-controls">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRig(rig.id);
                    }}
                  >
                    {rig.isActive ? 'Stop' : 'Start'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      repairRig(rig.id);
                    }}
                    disabled={(rig.quality || 100) >= 95}
                    className={`${(rig.quality || 100) >= 95 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Repair
                  </button>
                </div>

                {selectedRig === rig.id && (
                  <div className="mt-4 pt-4 border-t border-gray-400">
                    <h4 className="font-bold text-sm mb-2">Detailed Stats</h4>
                    <div className="space-y-1 text-xs">
                      <div className="stat-row">
                        <span>Efficiency:</span>
                        <span>{rig.efficiency} W/TH</span>
                      </div>
                      <div className="stat-row">
                        <span>Uptime:</span>
                        <span>98.7%</span>
                      </div>
                      <div className="stat-row">
                        <span>Temperature:</span>
                        <span className="text-orange-600">67°C</span>
                      </div>
                      <div className="stat-row">
                        <span>Last Maintenance:</span>
                        <span>2 days ago</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {userData.rigs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⛏️</div>
              <h3 className="text-xl font-bold mb-2">No Mining Rigs</h3>
              <p className="text-gray-600 mb-4">
                You don&apos;t have any mining rigs yet. Visit the shop to buy your first rig!
              </p>
              <button className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                🛒 Go to Shop
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
