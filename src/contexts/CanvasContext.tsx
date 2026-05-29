import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { CanvasNode, ComponentType } from '../types/canvas';
import { canvasReducer } from '../store/canvasReducer';
import type { CanvasAction } from '../store/canvasReducer';
import { usePersistentLayout } from '../hooks/usePersistentLayout';
import { useBuilderStore } from '../store/useBuilderStore';

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'node_' + Math.random().toString(36).substring(2, 11);
};

interface CanvasContextType {
  nodes: CanvasNode[];
  addNode: (type: ComponentType, parentId?: string | null, index?: number) => string;
  deleteNode: (nodeId: string) => void;
  moveNode: (nodeId: string, overId: string | null, parentId?: string | null, targetIndex?: number) => void;
  updateProps: (nodeId: string, props: any) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persistentNodes, savePersistentNodes] = usePersistentLayout();
  const commitState = useBuilderStore((state) => state.commitState);
  
  // Initialize reducer with stored layout snapshot
  const [state, dispatch] = useReducer(canvasReducer, persistentNodes);

  // Ref to track the last parsed string value to break synchronization circular loops
  const lastSavedStrRef = React.useRef<string>(JSON.stringify(persistentNodes));

  // Unified, mutually-exclusive sync effect between reducer state and tab storage snapshot
  useEffect(() => {
    const stateStr = JSON.stringify(state);
    const persStr = JSON.stringify(persistentNodes);
    
    // Case A: Local Reducer state changed -> Write to persistent storage
    if (stateStr !== persStr && stateStr !== lastSavedStrRef.current) {
      lastSavedStrRef.current = stateStr;
      savePersistentNodes(state);
    }
    // Case B: Persistent Storage changed externally -> Dispatch back to local reducer
    else if (persStr !== stateStr && persStr !== lastSavedStrRef.current) {
      lastSavedStrRef.current = persStr;
      dispatch({ type: 'SET_CANVAS', payload: persistentNodes });
    }
  }, [state, persistentNodes, savePersistentNodes]);
  
  // Custom dispatcher wrapper that pushes current state to history before user modifications
  const dispatchWithHistory = (action: CanvasAction) => {
    if (action.type !== 'SET_CANVAS') {
      commitState(state);
    }
    dispatch(action);
  };
  
  const addNode = (nodeType: ComponentType, parentId: string | null = null, targetIndex?: number) => {
    const id = generateId();
    dispatchWithHistory({
      type: 'ADD_NODE',
      payload: { id, nodeType, parentId, targetIndex }
    });
    return id;
  };
  
  const deleteNode = (nodeId: string) => {
    dispatchWithHistory({
      type: 'DELETE_NODE',
      payload: { nodeId }
    });
  };
  
  const moveNode = (nodeId: string, overId: string | null, parentId: string | null = null, targetIndex?: number) => {
    dispatchWithHistory({
      type: 'MOVE_NODE',
      payload: { nodeId, overId, parentId, targetIndex }
    });
  };
  
  const updateProps = (nodeId: string, props: any) => {
    dispatchWithHistory({
      type: 'UPDATE_PROPS',
      payload: { nodeId, props }
    });
  };
  
  return (
    <CanvasContext.Provider value={{ nodes: state, addNode, deleteNode, moveNode, updateProps }}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};
