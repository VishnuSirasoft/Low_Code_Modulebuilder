import { create } from 'zustand';
import type { CanvasNode } from '../types/canvas';
import { syncStore } from '../hooks/usePersistentLayout';

interface BuilderState {
  mode: 'edit' | 'preview';
  selectedNodeId: string | null;
  activeDragId: string | null;
  
  // History stacks
  past: CanvasNode[][];
  future: CanvasNode[][];
  
  setMode: (mode: 'edit' | 'preview') => void;
  setSelectedNodeId: (id: string | null) => void;
  setActiveDragId: (id: string | null) => void;
  
  // Undo/Redo actions
  commitState: (currentState: CanvasNode[]) => void;
  undo: (currentState: CanvasNode[]) => void;
  redo: (currentState: CanvasNode[]) => void;
  clearHistory: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  mode: 'edit',
  selectedNodeId: null,
  activeDragId: null,
  past: [],
  future: [],
  
  setMode: (mode) => set({ mode }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setActiveDragId: (activeDragId) => set({ activeDragId }),
  
  commitState: (currentState) => set((state) => {
    // If the state is identical to the last item in past, do not push
    const lastPast = state.past[state.past.length - 1];
    if (lastPast && JSON.stringify(lastPast) === JSON.stringify(currentState)) {
      return state;
    }
    
    // Keep history maximum at 50 for memory safety
    const newPast = [...state.past, currentState];
    if (newPast.length > 50) {
      newPast.shift();
    }
    
    return {
      past: newPast,
      future: [], // Clear redo history on new commit
    };
  }),
  
  undo: (currentState) => set((state) => {
    if (state.past.length === 0) return state;
    
    const newPast = [...state.past];
    const previousState = newPast.pop()!;
    const newFuture = [currentState, ...state.future];
    
    // Sync external store to update the layouts across hook and components
    syncStore.setSnapshot(previousState);
    
    return {
      past: newPast,
      future: newFuture,
      selectedNodeId: null, // Clear selection on undo
    };
  }),
  
  redo: (currentState) => set((state) => {
    if (state.future.length === 0) return state;
    
    const newFuture = [...state.future];
    const nextState = newFuture.shift()!;
    const newPast = [...state.past, currentState];
    
    // Sync external store
    syncStore.setSnapshot(nextState);
    
    return {
      past: newPast,
      future: newFuture,
      selectedNodeId: null, // Clear selection on redo
    };
  }),
  
  clearHistory: () => set({ past: [], future: [] }),
}));
