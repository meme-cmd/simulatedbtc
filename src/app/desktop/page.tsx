'use client';

import { useState } from 'react';
import WindowComponent from '@/components/WindowComponent';
import Calculator from '@/components/Calculator';
import TextEditor from '@/components/TextEditor';
import FileManager from '@/components/FileManager';
import Taskbar from '@/components/Taskbar';

export default function DesktopPage() {
  const [windows, setWindows] = useState([
    { id: 'calculator', component: 'calculator', title: 'Calculator', visible: true, minimized: false, position: { x: 50, y: 50 } },
    { id: 'texteditor', component: 'texteditor', title: 'Text Editor', visible: true, minimized: false, position: { x: 300, y: 100 } },
    { id: 'filemanager', component: 'filemanager', title: 'File Manager', visible: true, minimized: false, position: { x: 100, y: 300 } }
  ]);

  const [activeWindow, setActiveWindow] = useState('calculator');

  const closeWindow = (windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, visible: false } : w
    ));
  };

  const minimizeWindow = (windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, minimized: true } : w
    ));
  };

  const restoreWindow = (windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, minimized: false } : w
    ));
    setActiveWindow(windowId);
  };

  const bringToFront = (windowId: string) => {
    setActiveWindow(windowId);
  };

  const updateWindowPosition = (windowId: string, position: { x: number; y: number }) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, position } : w
    ));
  };

  const renderWindowContent = (component: string) => {
    switch (component) {
      case 'calculator':
        return <Calculator />;
      case 'texteditor':
        return <TextEditor />;
      case 'filemanager':
        return <FileManager />;
      default:
        return <div>Unknown component</div>;
    }
  };

  return (
    <div className="retro-bg-xp relative">
      {/* Desktop */}
      <div className="min-h-screen relative overflow-hidden pb-12">
        {windows.map((window) => (
          window.visible && !window.minimized && (
            <WindowComponent
              key={window.id}
              id={window.id}
              title={window.title}
              position={window.position}
              isActive={activeWindow === window.id}
              onClose={() => closeWindow(window.id)}
              onMinimize={() => minimizeWindow(window.id)}
              onFocus={() => bringToFront(window.id)}
              onMove={(position) => updateWindowPosition(window.id, position)}
            >
              {renderWindowContent(window.component)}
            </WindowComponent>
          )
        ))}
      </div>

      {/* Taskbar */}
      <Taskbar
        windows={windows}
        activeWindow={activeWindow}
        onWindowRestore={restoreWindow}
      />
    </div>
  );
}
