import React, { useState, Suspense } from 'react';
import { 
  DndContext, 
  DragOverlay,
  pointerWithin,
  rectIntersection
} from '@dnd-kit/core';
import type { 
  DragEndEvent, 
  DragStartEvent, 
  CollisionDetection
} from '@dnd-kit/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Header } from './components/Header';
import { Palette } from './components/Palette';
import { Canvas, getNodeIcon } from './components/Canvas';
import { PropertyPanel } from './components/PropertyPanel';
import { CanvasProvider, useCanvas } from './contexts/CanvasContext';
import { useBuilderStore } from './store/useBuilderStore';
import type { CanvasNode, ComponentType } from './types/canvas';

// Lazy load the Preview viewport for optimized production split bundle sizes
const Preview = React.lazy(() => import('./components/Preview').then(m => ({ default: m.Preview })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Inner Workspace wrapper allowing direct Context Hook accesses
const BuilderWorkspace: React.FC = () => {
  const { nodes, addNode, moveNode } = useCanvas();
  
  // Zustand State bindings
  const mode = useBuilderStore(state => state.mode);
  const setActiveDragId = useBuilderStore(state => state.setActiveDragId);

  // Local drag overlay details
  const [draggedItemData, setDraggedItemData] = useState<{ type: ComponentType; isPalette: boolean } | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    setActiveDragId(activeId);

    const activeData = active.data.current;
    if (activeData) {
      if (activeData.isPaletteItem) {
        setDraggedItemData({ type: activeData.type, isPalette: true });
      } else if (activeData.isCanvasItem) {
        setDraggedItemData({ type: activeData.node.type, isPalette: false });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setDraggedItemData(null);

    if (!over) return;

    const activeData = active.data.current;
    const overId = over.id as string;
    const overData = over.data.current;

    let parentId: string | null = null;
    let targetIndex: number | undefined = undefined;

    // 1. Identify nested Form Container Drops
    if (overId.startsWith('form-drop-')) {
      parentId = overId.replace('form-drop-', '');
    } else if (overData) {
      if (overData.isFormDrop) {
        parentId = overData.formId;
      } else if (overData.isCanvasItem) {
        const overNode = overData.node as CanvasNode;
        
        // If an input is dropped directly on a form node, set its parentId to nest it
        if (overNode.type === 'form' && activeData?.type === 'input') {
          parentId = overNode.id;
        } else {
          // Keep the sibling parent ID
          parentId = overNode.parentId || null;
          const idx = nodes.findIndex(n => n.id === overNode.id);
          if (idx !== -1) targetIndex = idx;
        }
      }
    }

    // 2. Drop from Palette tile (Creates new Node)
    if (activeData?.isPaletteItem) {
      const type = activeData.type as ComponentType;
      addNode(type, parentId, targetIndex);
    }

    // 3. Reorder/Move Canvas node
    if (activeData?.isCanvasItem) {
      const activeNode = activeData.node as CanvasNode;
      
      // Safety constraint: Prevent nesting a Form Container inside another Form
      if (activeNode.type === 'form' && parentId !== null) {
        return;
      }
      
      moveNode(activeNode.id, overId, parentId, targetIndex);
    }
  };

  // Custom collision detection: prioritize nested form slots first, then fallback to rect bounds
  const customCollisionDetection: CollisionDetection = (args) => {
    const formDropzones = args.droppableContainers.filter(d => d.id.toString().startsWith('form-drop-'));
    const formCollisions = pointerWithin({
      ...args,
      droppableContainers: formDropzones
    });
    
    if (formCollisions.length > 0) {
      return formCollisions;
    }
    
    return rectIntersection(args);
  };

  return (
    <DndContext 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      collisionDetection={customCollisionDetection}
    >
      <div className="app-container">
        <Header />
        
        {mode === 'edit' ? (
          <div className="app-workspace">
            <Palette />
            <Canvas />
            <PropertyPanel />
          </div>
        ) : (
          <div className="app-workspace preview-mode">
            <Suspense fallback={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-secondary)' }}>
                <div className="preview-spinner"></div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Compiling Dynamic Preview Workspace...</span>
              </div>
            }>
              <Preview />
            </Suspense>
          </div>
        )}
      </div>

      {/* Drag Overlay Portal */}
      <DragOverlay>
        {draggedItemData && (
          <div 
            className="glass-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(22, 28, 45, 0.95)',
              border: '1px solid var(--brand-primary)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
              color: 'var(--text-primary)',
              cursor: 'grabbing',
              width: '240px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--brand-primary)' }}>
              {getNodeIcon(draggedItemData.type, 16)}
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Dragging {draggedItemData.type.toUpperCase()}
            </span>
          </div>
        )}
      </DragOverlay>

      <style>{`
        .preview-spinner {
          width: 40px;
          height: 40px;
          border: 3.5px solid rgba(255,255,255,0.06);
          border-top-color: var(--brand-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </DndContext>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CanvasProvider>
        <BuilderWorkspace />
      </CanvasProvider>
    </QueryClientProvider>
  );
}

export default App;
