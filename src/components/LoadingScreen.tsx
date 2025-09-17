'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LoadingScreenProps {
  onComplete?: () => void;
  redirectTo?: string;
}

export default function LoadingScreen({ onComplete, redirectTo = '/mining' }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const router = useRouter();

  // Fast loading - complete in 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
      setShowCompletionDialog(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else if (redirectTo) {
      router.push(redirectTo);
    }
  };

  const CompletionDialog = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="window" style={{ width: '300px' }}>
        <div className="title-bar">
          <div className="title-bar-text">🎉 Time Travel Complete</div>
          <div className="title-bar-controls">
            <button 
              aria-label="Close" 
              onClick={() => setShowCompletionDialog(false)}
            />
          </div>
        </div>
        <div className="window-body">
          <p>🕰️ You have successfully traveled back to 2009!</p>
          <p style={{ fontSize: '11px', color: '#666' }}>
            Experience the nostalgia of simpler times with authentic Windows XP styling.
          </p>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button onClick={handleComplete}>Start Mining</button>
            <button 
              onClick={() => setShowCompletionDialog(false)}
              style={{ marginLeft: '8px' }}
            >
              Stay Here
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="retro-bg-xp">      
      <div className="min-h-screen flex items-center justify-center overflow-hidden">
        <div className="text-center relative">
          {/* Main Loading Window */}
          <div className="window mb-5" style={{ width: '400px' }}>
            <div className="title-bar">
              <div className="title-bar-text">🕰️ Time Machine - Loading...</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize" disabled />
                <button aria-label="Close" disabled />
              </div>
            </div>
            <div className="window-body">
              <div className="text-lg font-bold text-black my-5">
                Taking you back to
              </div>
              
              <div className="text-5xl font-bold text-blue-900 my-5 flex items-center justify-center">
                2009
                <div 
                  className="w-8 h-8 mx-2 rounded"
                  style={{ 
                    background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)',
                    display: 'inline-block'
                  }}
                />
              </div>
              
              <div className="flex justify-center gap-5 text-2xl my-5">
                <span>💿</span>
                <span>🖥️</span>
                <span>📼</span>
                <span>📺</span>
              </div>
              
              <div className="my-8">
                <div className="mb-2 text-xs text-left">
                  Finalizing nostalgic experience...
                </div>
                <progress 
                  className="w-full h-5" 
                  max="100" 
                  value={progress}
                />
                <div className="mt-2 text-xs text-gray-600">
                  {progress >= 100 ? '100% Complete - Ready!' : 'Loading...'}
                </div>
              </div>
              
              <div className="text-xs text-gray-600 italic mt-4">
                Finalizing nostalgic experience...
              </div>
            </div>
          </div>
          
          {/* Small notification dialog */}
          <div 
            className="window absolute -top-24 -right-36"
            style={{ 
              width: '250px'
            }}
          >
            <div className="title-bar">
              <div className="title-bar-text">⚠️ Notice</div>
              <div className="title-bar-controls">
                <button aria-label="Close" />
              </div>
            </div>
            <div className="window-body">
              <p style={{ fontSize: '11px', margin: '8px 0' }}>
                📅 Preparing to restore the golden age of computing...
              </p>
              <div style={{ textAlign: 'center' }}>
                <button disabled style={{ fontSize: '10px' }}>OK</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Dialog */}
      {showCompletionDialog && <CompletionDialog />}
    </div>
  );
}
