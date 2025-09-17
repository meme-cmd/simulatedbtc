'use client';

import { useState, useEffect } from 'react';
import { BACKEND_HTTP_URL } from '@/lib/config';

export interface UserRig {
  id: string;
  userId: string;
  tierId: string;
  tier: RigTier;
  purchasedAt: number;
  uptime: number;
  isActive: boolean;
}

export interface RigTier {
  id: string;
  name: string;
  hashrate: number;
  priceBTC_SPL: number;
  uptime: number;
  description: string;
  icon: string;
  category: 'basic' | 'advanced' | 'professional' | 'legendary';
}

export interface UserData {
  user: {
    id: string;
    balances: {
      BTC_SPL: number;
    };
    totalEarned: number;
  };
  rigs: UserRig[];
  ehr: number;
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${BACKEND_HTTP_URL}/api/user`, {
        headers: {
          'x-session-id': 'demo-user'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      setUserData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    
    // Refresh user data every 5 seconds
    const interval = setInterval(fetchUserData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return { userData, loading, error, refetch: fetchUserData };
}

export function useRigTiers(refreshKey?: number) {
  const [rigTiers, setRigTiers] = useState<RigTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_HTTP_URL}/api/rigs/tiers`)
      .then(response => response.json())
      .then(setRigTiers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return { rigTiers, loading };
}

export function useBuyRig() {
  const [buying, setBuying] = useState(false);

  const buyRig = async (tierId: string): Promise<{ success: boolean; error?: string; data?: any }> => {
    setBuying(true);
    
    try {
      const response = await fetch(`${BACKEND_HTTP_URL}/api/rigs/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': 'demo-user'
        },
        body: JSON.stringify({
          tierId,
          idempotencyKey: `${tierId}-${Date.now()}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Purchase failed' };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    } finally {
      setBuying(false);
    }
  };

  return { buyRig, buying };
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${BACKEND_HTTP_URL}/api/leaderboard?limit=10`);
        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return { leaderboard, loading };
}
