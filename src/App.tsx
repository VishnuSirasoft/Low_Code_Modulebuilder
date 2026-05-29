import React from 'react';
import { CanvasProvider, useCanvas } from './contexts/CanvasContext';

function CanvasDisplay() {
  const { nodes, addNode } = useCanvas();

  const handleAddText = () => {
    addNode('text');
  };

  const handleAddInput = () => {
    addNode('input');
  };

  return (
    <div 
      style={{ 
        padding: '40px', 
        fontFamily: 'system-ui, -apple-system, sans-serif', 
        color: '#f8fafc', 
        background: '#090a10', 
        minHeight: '100vh' 
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
        Low-Code Module Builder
      </h1>
      <h3 style={{ fontSize: '1.1rem', color: '#6366f1', fontWeight: 600, marginBottom: '24px' }}>
        Part 1 & Part 2 Completed (TypeScript Schema & Synced Canvas State)
      </h3>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={handleAddText}
          style={{ 
            padding: '10px 16px', 
            background: '#6366f1', 
            border: 'none', 
            borderRadius: '8px', 
            color: '#fff', 
            fontWeight: 600, 
            cursor: 'pointer' 
          }}
        >
          + Add Text Node
        </button>
        <button 
          onClick={handleAddInput}
          style={{ 
            padding: '10px 16px', 
            background: '#06b6d4', 
            border: 'none', 
            borderRadius: '8px', 
            color: '#fff', 
            fontWeight: 600, 
            cursor: 'pointer' 
          }}
        >
          + Add Input Node
        </button>
      </div>

      <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '12px' }}>
        Active Synced Canvas Nodes Count: <strong>{nodes.length}</strong>
      </p>
      
      <div 
        style={{ 
          padding: '20px', 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.08)', 
          borderRadius: '12px' 
        }}
      >
        <h4 style={{ marginBottom: '12px', fontSize: '0.95rem' }}>Current JSON State Schema:</h4>
        <pre 
          style={{ 
            background: 'rgba(0,0,0,0.3)', 
            padding: '16px', 
            borderRadius: '8px', 
            overflowX: 'auto', 
            fontSize: '0.85rem', 
            fontFamily: 'monospace' 
          }}
        >
          {JSON.stringify(nodes, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function App() {
  return (
    <CanvasProvider>
      <CanvasDisplay />
    </CanvasProvider>
  );
}

export default App;
