'use client';

import { useState, useRef } from 'react';

export default function TextEditor() {
  const [content, setContent] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const formatText = (command: string) => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const selectedText = content.substring(start, end);

    if (selectedText) {
      let formatted;
      switch (command) {
        case 'bold':
          formatted = `**${selectedText}**`;
          break;
        case 'italic':
          formatted = `*${selectedText}*`;
          break;
        case 'underline':
          formatted = `_${selectedText}_`;
          break;
        default:
          formatted = selectedText;
      }

      const newContent = content.substring(0, start) + formatted + content.substring(end);
      setContent(newContent);
    }
  };

  const clearText = () => {
    setContent('');
  };

  const saveText = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: '400px', padding: '8px' }}>
      <menu role="menubar" className="mb-2">
        <li role="menuitem" tabIndex={0}>File</li>
        <li role="menuitem" tabIndex={0}>Edit</li>
        <li role="menuitem" tabIndex={0}>Format</li>
        <li role="menuitem" tabIndex={0}>Help</li>
      </menu>
      
      <div className="separator mb-2"></div>
      
      <div className="field-row mb-2">
        <button onClick={() => formatText('bold')}>
          <strong>B</strong>
        </button>
        <button onClick={() => formatText('italic')} className="ml-1">
          <em>I</em>
        </button>
        <button onClick={() => formatText('underline')} className="ml-1">
          <u>U</u>
        </button>
        <div className="separator mx-2" style={{ display: 'inline-block', width: '1px', height: '20px' }}></div>
        <button onClick={clearText} className="ml-1">Clear</button>
        <button onClick={saveText} className="ml-1">Save</button>
      </div>
      
      <textarea
        ref={textAreaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing..."
        style={{
          width: '100%',
          height: '200px',
          resize: 'none',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}
      />
    </div>
  );
}
