'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface WindowComponentProps {
  id: string;
  title: string;
  children: ReactNode;
  position: { x: number; y: number };
  isActive: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  onMove: (position: { x: number; y: number }) => void;
  width?: number;
  height?: number;
  resizable?: boolean;
}

export default function WindowComponent({
  title,
  children,
  position,
  isActive,
  onClose,
  onMinimize,
  onFocus,
  onMove,
  width = 400,
  height = 300
}: WindowComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [previousPosition, setPreviousPosition] = useState(position);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        const newPosition = {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        };
        onMove(newPosition);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onMove, isMaximized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onFocus();
      setIsDragging(true);
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMaximize = () => {
    if (isMaximized) {
      // Restore
      setIsMaximized(false);
      onMove(previousPosition);
    } else {
      // Maximize
      setPreviousPosition(position);
      setIsMaximized(true);
      onMove({ x: 0, y: 0 });
    }
  };

  const windowStyle = isMaximized
    ? {
        position: 'fixed' as const,
        left: 0,
        top: 0,
        width: '100vw',
        height: 'calc(100vh - 48px)', // Account for taskbar
        zIndex: isActive ? 10 : 1
      }
    : {
        position: 'absolute' as const,
        left: position.x,
        top: position.y,
        width: width,
        height: height,
        zIndex: isActive ? 10 : 1
      };

  return (
    <div
      ref={windowRef}
      className={`window ${isActive ? 'active' : ''}`}
      style={windowStyle}
      onClick={onFocus}
    >
      <div
        className="title-bar"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="title-bar-text">{title}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize" onClick={onMinimize} />
          <button aria-label="Maximize" onClick={handleMaximize} />
          <button aria-label="Close" onClick={onClose} />
        </div>
      </div>
      <div className="window-body" style={{ height: 'calc(100% - 32px)', overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
