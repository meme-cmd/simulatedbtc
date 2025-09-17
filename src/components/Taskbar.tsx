'use client';

import { useState, useEffect } from 'react';

interface Window {
  id: string;
  title: string;
  visible: boolean;
  minimized: boolean;
}

interface TaskbarProps {
  windows: Window[];
  activeWindow: string;
  onWindowRestore: (windowId: string) => void;
}

export default function Taskbar({ windows, activeWindow, onWindowRestore }: TaskbarProps) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleStartMenu = () => {
    alert('Start menu would appear here in a real implementation!');
  };

  const visibleWindows = windows.filter(w => w.visible);

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 h-12 flex items-center px-1"
      style={{
        background: 'linear-gradient(to bottom, #245edb, #1941a5)',
        borderTop: '1px solid #0831d9'
      }}
    >
      {/* Start Button */}
      <button
        onClick={toggleStartMenu}
        className="h-8 px-2 mr-2 text-white font-bold rounded"
        style={{
          background: 'linear-gradient(to bottom, #3d95ff, #1941a5)',
          border: '1px outset #245edb',
          fontSize: '11px'
        }}
      >
        🪟 Start
      </button>

      {/* Window Buttons */}
      <div className="flex-1 flex gap-1">
        {visibleWindows.map((window) => (
          <button
            key={window.id}
            onClick={() => onWindowRestore(window.id)}
            className={`h-8 px-3 text-white text-xs rounded ${
              activeWindow === window.id && !window.minimized
                ? 'bg-blue-600 border-inset'
                : 'bg-blue-500 border-outset'
            }`}
            style={{
              border: '1px solid #245edb',
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {window.title}
          </button>
        ))}
      </div>

      {/* System Tray and Clock */}
      <div className="flex items-center">
        <div 
          className="text-white px-2 text-xs"
          style={{ fontSize: '11px' }}
        >
          {currentTime}
        </div>
      </div>
    </div>
  );
}
