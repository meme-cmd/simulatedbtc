'use client';

import { useState, useEffect } from 'react';
import { BACKEND_HTTP_URL } from '@/lib/config';

interface ConnectionStatusProps {
  isConnected: boolean;
  onRetry?: () => void;
}

export default function ConnectionStatus({ isConnected, onRetry }: ConnectionStatusProps) {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${BACKEND_HTTP_URL}/api/health`);
        if (response.ok) {
          setBackendStatus('available');
        } else {
          setBackendStatus('unavailable');
        }
      } catch (error) {
        setBackendStatus('unavailable');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>Live Connection Active</span>
      </div>
    );
  }

  return (
    <div className="window mb-4">
      <div className="title-bar">
        <div className="title-bar-text">Connection Status</div>
      </div>
      <div className="window-body">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <div>
              <div className="font-medium text-red-600">
                {backendStatus === 'checking' && 'Checking backend...'}
                {backendStatus === 'unavailable' && 'Backend server not running'}
                {backendStatus === 'available' && 'WebSocket connection failed'}
              </div>
              <div className="text-xs text-gray-600">
                {backendStatus === 'unavailable' && 'Please start the backend server on port 3001'}
                {backendStatus === 'available' && 'Attempting to reconnect...'}
                {backendStatus === 'checking' && 'Verifying backend availability...'}
              </div>
            </div>
          </div>
          
          {backendStatus === 'unavailable' && (
            <div className="text-xs text-gray-500">
              <div>Run in terminal:</div>
              <code className="bg-gray-100 px-2 py-1 rounded">
                cd backend && npm run dev
              </code>
            </div>
          )}
          
          {onRetry && (
            <button onClick={onRetry} className="px-3 py-1 text-sm">
              🔄 Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
