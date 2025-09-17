'use client';

import { useState, useEffect } from 'react';

interface GameClockProps {
  gameTime?: number;
}

export default function GameClock({ gameTime }: GameClockProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    if (gameTime) {
      setCurrentTime(new Date(gameTime));
    }
  }, [gameTime]);

  useEffect(() => {
    if (!currentTime) return;

    const interval = setInterval(() => {
      // Update local time based on acceleration (1 day per 2 seconds)
      setCurrentTime(prev => {
        if (!prev) return null;
        return new Date(prev.getTime() + (43200 * 1000)); // Add 43200 seconds (1 day per second)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTime]);

  if (!currentTime) {
    return (
      <div className="window" style={{ width: '220px' }}>
        <div className="title-bar">
          <div className="title-bar-text">Clock</div>
        </div>
        <div className="window-body">
          <div className="text-center py-2">
            <div className="font-mono text-sm">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="window" style={{ width: '220px' }}>
      <div className="title-bar">
        <div className="title-bar-text">Clock</div>
      </div>
      <div className="window-body">
        <div className="text-center py-2">
          <div className="font-mono text-xs text-gray-600 mb-1">
            {formatDate(currentTime)}
          </div>
          <div className="font-mono text-lg font-bold">
            {formatTime(currentTime)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Bitcoin Network Time
          </div>
        </div>
      </div>
    </div>
  );
}
