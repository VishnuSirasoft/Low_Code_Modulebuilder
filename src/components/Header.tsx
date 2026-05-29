import React, { useEffect, useRef } from 'react';
import { 
  Undo, 
  Redo, 
  Download, 
  Upload, 
  Play, 
  Edit2, 
  CloudLightning,
  RefreshCw
} from 'lucide-react';
import { useBuilderStore } from '../store/useBuilderStore';
import { useCanvas } from '../contexts/CanvasContext';
import { useLayoutQuery } from '../hooks/useLayoutQuery';

export const Header: React.FC = () => {
  const { nodes } = useCanvas();
  
  // Zustand State
  const mode = useBuilderStore(state => state.mode);
  const setMode = useBuilderStore(state => state.setMode);
  const setSelectedNodeId = useBuilderStore(state => state.setSelectedNodeId);
  
  const past = useBuilderStore(state => state.past);
  const future = useBuilderStore(state => state.future);
  const undo = useBuilderStore(state => state.undo);
  const redo = useBuilderStore(state => state.redo);
  const commitState = useBuilderStore(state => state.commitState);

  // TanStack Query layout remote syncing hooks
  const { saveLayout, isSaving } = useLayoutQuery();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts for Undo/Redo Engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts inside text inputs to allow natural user typing
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (past.length > 0) {
          undo(nodes);
        }
      } else if (
        (e.ctrlKey || e.metaKey) && 
        ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        if (future.length > 0) {
          redo(nodes);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, past, future, undo, redo]);

  // Export Canvas layout as JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `low_code_layout_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Canvas layout from JSON
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        
        const importedNodes = JSON.parse(result);
        
        if (Array.isArray(importedNodes)) {
          // Push current state to past stack before import
          commitState(nodes);
          
          // Re-sync local storage and external sync store which dispatches SET_CANVAS to reducer
          const STORAGE_KEY = 'low-code-builder-layout';
          localStorage.setItem(STORAGE_KEY, JSON.stringify(importedNodes));
          window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify(importedNodes)
          }));
          
          setSelectedNodeId(null);
          alert('🎉 Screen layout imported successfully!');
        } else {
          alert('❌ Invalid format: JSON must represent an array of CanvasNodes.');
        }
      } catch (err) {
        alert('❌ Error reading file: Invalid JSON layout.');
      }
    };
    reader.readAsText(file);
    // Clear input
    event.target.value = '';
  };

  // Trigger simulated remote cloud saving via TanStack Query
  const handleCloudSync = () => {
    saveLayout(nodes);
  };

  return (
    <header className="app-header">
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
            color: '#fff',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
          }}
        >
          <CloudLightning size={18} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LOWCODE.BUILDER
          </h1>
          <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--brand-secondary)', letterSpacing: '0.1em', marginTop: '-2px' }}>
            ENGINE WORKSPACE
          </span>
        </div>
      </div>

      {/* Mode Switches */}
      <div 
        style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => setMode('edit')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '7px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: mode === 'edit' ? 'var(--brand-primary)' : 'transparent',
            color: mode === 'edit' ? '#fff' : 'var(--text-secondary)',
            transition: 'var(--transition-fast)',
          }}
        >
          <Edit2 size={13} />
          Editor Layout
        </button>
        <button
          onClick={() => {
            setSelectedNodeId(null);
            setMode('preview');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '7px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: mode === 'preview' ? 'var(--brand-primary)' : 'transparent',
            color: mode === 'preview' ? '#fff' : 'var(--text-secondary)',
            transition: 'var(--transition-fast)',
          }}
        >
          <Play size={13} />
          Live Preview
        </button>
      </div>

      {/* Editor Controls Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        
        {/* Cloud saving status */}
        <button 
          onClick={handleCloudSync}
          disabled={isSaving}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: isSaving ? 'var(--brand-secondary)' : 'var(--text-secondary)',
            transition: 'color 0.2s',
          }}
          title="Sync with simulated remote db server"
        >
          <RefreshCw size={12} className={isSaving ? 'animate-spin' : ''} style={{ animation: isSaving ? 'spin 1.5s linear infinite' : 'none' }} />
          <span>{isSaving ? 'Cloud Saving...' : 'Cloud Synced'}</span>
        </button>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>

        {/* Vertical divider */}
        <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }}></div>

        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => undo(nodes)}
            disabled={past.length === 0}
            className="btn btn-secondary"
            style={{ padding: '6px 8px', borderRadius: '6px' }}
            title="Undo action (Ctrl+Z)"
          >
            <Undo size={14} />
          </button>
          <button
            onClick={() => redo(nodes)}
            disabled={future.length === 0}
            className="btn btn-secondary"
            style={{ padding: '6px 8px', borderRadius: '6px' }}
            title="Redo action (Ctrl+Y)"
          >
            <Redo size={14} />
          </button>
        </div>

        {/* Import / Export JSON */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleExportJSON}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', gap: '6px' }}
            title="Export layout as JSON file"
          >
            <Download size={13} />
            Export
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', gap: '6px' }}
            title="Import layout from JSON file"
          >
            <Upload size={13} />
            Import
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportJSON} 
            accept=".json" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>
    </header>
  );
};
