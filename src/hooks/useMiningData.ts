'use client';

import { useState, useEffect, useRef } from 'react';
import { BACKEND_HTTP_URL, BACKEND_WS_URL } from '@/lib/config';

export interface Block {
  height: number;
  timestamp: number;
  hash: string;
  previousHash: string;
  difficulty: number;
  reward: number;
  subsidy?: number;
  txCount: number;
  totalFees: number;
  isOrphan: boolean;
  workTarget: string;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  amount: number;
  fee: number;
  from: string;
  to: string;
}

export interface NetworkTelemetry {
  height: number;
  timestamp: number;
  difficulty: number;
  networkHashrate: number;
  avgBlockTime: number;
  currentReward: number;
  nextHalvingHeight: number | null;
  blocksUntilRetarget: number;
  totalBlocksRecentBuffered: number;
  emissions?: {
    totalEmission: number;
    emittedTotal: number;
    remaining: number;
    totalBlocks: number;
    blocksRemaining: number;
    halvingEpochs: number;
    epochIndex: number;
    epochLenBase: number;
    epochLenLast: number;
    halvingHeights: number[];
  };
  seasonEnded?: boolean;
}

interface WebSocketMessage {
  type: 'block' | 'telemetry';
  data: Block | NetworkTelemetry;
}

export function useMiningData() {
  const [telemetry, setTelemetry] = useState<NetworkTelemetry | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<Block[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    // Check if we're in the browser environment
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // First check if backend is available
      fetch(`${BACKEND_HTTP_URL}/api/health`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Backend not available');
          }
          return response.json();
        })
        .then(() => {
          // Backend is available, establish WebSocket connection
          const ws = new WebSocket(BACKEND_WS_URL);
          
          ws.onopen = () => {
            console.log('Connected to mining backend');
            setIsConnected(true);
            
            // Clear any pending reconnect
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
          };

          ws.onmessage = (event) => {
            try {
              const message: WebSocketMessage = JSON.parse(event.data);
              
              if (message.type === 'telemetry') {
                setTelemetry(message.data as NetworkTelemetry);
              } else if (message.type === 'block') {
                const newBlock = message.data as Block;
                setRecentBlocks(prev => [newBlock, ...prev.slice(0, 49)]); // Keep 50 recent blocks
              }
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          };

          ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            setIsConnected(false);
            wsRef.current = null;
            
            // Attempt to reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Attempting to reconnect...');
              connect();
            }, 3000);
          };

          ws.onerror = (error) => {
            console.log('WebSocket connection failed - backend may not be running');
            setIsConnected(false);
            
            // Close the connection to trigger onclose
            if (ws.readyState !== WebSocket.CLOSED) {
              ws.close();
            }
          };

          wsRef.current = ws;
        })
        .catch((error) => {
          console.log('Backend not available, will retry in 5 seconds');
          setIsConnected(false);
          
          // Retry connection after 5 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        });
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
      
      // Retry connection after 5 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    }
  };

  // Fallback to REST API if WebSocket fails
  const loadInitialData = async () => {
    try {
      // Load telemetry
      const telemetryResponse = await fetch(`${BACKEND_HTTP_URL}/api/telemetry`);
      if (telemetryResponse.ok) {
        const telemetryData = await telemetryResponse.json();
        setTelemetry(telemetryData);
      }

      // Load recent blocks
      const blocksResponse = await fetch(`${BACKEND_HTTP_URL}/api/blocks?limit=10`);
      if (blocksResponse.ok) {
        const blocksData = await blocksResponse.json();
        setRecentBlocks(blocksData.blocks);
      }
    } catch (error) {
      console.log('REST API also unavailable');
    }
  };

  useEffect(() => {
    // Load initial data first
    loadInitialData();
    
    // Then establish WebSocket connection
    const timer = setTimeout(connect, 1000);

    return () => {
      clearTimeout(timer);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    telemetry,
    recentBlocks,
    isConnected
  };
}

// Hook for fetching block details
export function useBlockDetails(height: number | null) {
  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (height === null) {
      setBlock(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${BACKEND_HTTP_URL}/api/block/${height}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Block ${height} not found`);
        }
        return response.json();
      })
      .then(setBlock)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [height]);

  return { block, loading, error };
}

// Hook for paginated blocks
export function useBlocksPaginated() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async (cursor?: number) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_HTTP_URL}/api/blocks?cursor=${cursor || 0}&limit=20`);
      const data = await response.json();
      
      if (cursor) {
        setBlocks(prev => [...prev, ...data.blocks]);
      } else {
        setBlocks(data.blocks);
      }
      
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error loading blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMore();
  }, []);

  return { blocks, loading, hasMore, loadMore };
}
