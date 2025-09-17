'use client';

import { useState } from 'react';

interface FileItem {
  name: string;
  type: 'folder' | 'file';
  icon: string;
  children?: FileItem[];
  expanded?: boolean;
}

export default function FileManager() {
  const [fileSystem, setFileSystem] = useState<FileItem[]>([
    {
      name: 'Documents',
      type: 'folder',
      icon: '📁',
      expanded: false,
      children: [
        { name: 'Resume.doc', type: 'file', icon: '📄' },
        { name: 'Cover Letter.pdf', type: 'file', icon: '📄' },
        {
          name: 'Projects',
          type: 'folder',
          icon: '📁',
          expanded: false,
          children: [
            { name: 'Website.html', type: 'file', icon: '📄' },
            { name: 'App.js', type: 'file', icon: '📄' },
            { name: 'Style.css', type: 'file', icon: '📄' }
          ]
        }
      ]
    },
    {
      name: 'Downloads',
      type: 'folder',
      icon: '📁',
      expanded: false,
      children: [
        { name: 'Setup.exe', type: 'file', icon: '📄' },
        { name: 'Manual.pdf', type: 'file', icon: '📄' },
        { name: 'Song.mp3', type: 'file', icon: '📄' }
      ]
    },
    {
      name: 'Pictures',
      type: 'folder',
      icon: '📁',
      expanded: false,
      children: [
        { name: 'Vacation.jpg', type: 'file', icon: '📄' },
        { name: 'Family.png', type: 'file', icon: '📄' }
      ]
    }
  ]);

  const toggleFolder = (path: number[]) => {
    setFileSystem(prev => {
      const newFileSystem = [...prev];
      let current: FileItem[] = newFileSystem;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children!;
      }
      
      const folder = current[path[path.length - 1]];
      if (folder.type === 'folder') {
        folder.expanded = !folder.expanded;
        folder.icon = folder.expanded ? '📂' : '📁';
      }
      
      return newFileSystem;
    });
  };

  const createFile = () => {
    alert('New file created!');
  };

  const deleteFile = () => {
    alert('File deleted!');
  };

  const refreshFiles = () => {
    alert('Files refreshed!');
  };

  const renderFileTree = (items: FileItem[], path: number[] = []): React.ReactNode => {
    return (
      <ul className="tree-view">
        {items.map((item, index) => (
          <li key={`${path.join('-')}-${index}`}>
            <span
              onClick={() => item.type === 'folder' && toggleFolder([...path, index])}
              style={{ cursor: item.type === 'folder' ? 'pointer' : 'default' }}
            >
              {item.icon} {item.name}
            </span>
            {item.type === 'folder' && item.expanded && item.children && (
              renderFileTree(item.children, [...path, index])
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ width: '350px', padding: '8px' }}>
      <div className="field-row mb-2">
        <label>Location:</label>
        <input 
          type="text" 
          value="C:\\Documents" 
          readOnly 
          style={{ flex: 1, marginLeft: '8px' }}
        />
      </div>
      
      <div className="separator mb-2"></div>
      
      <div style={{ height: '150px', overflowY: 'auto', marginBottom: '8px' }}>
        {renderFileTree(fileSystem)}
      </div>
      
      <div className="field-row">
        <button onClick={createFile}>New File</button>
        <button onClick={deleteFile} className="ml-1">Delete</button>
        <button onClick={refreshFiles} className="ml-1">Refresh</button>
      </div>
    </div>
  );
}
