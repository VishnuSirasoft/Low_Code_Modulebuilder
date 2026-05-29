import { useSyncExternalStore } from 'react';
import type { CanvasNode } from '../types/canvas';

const STORAGE_KEY = 'low-code-builder-layout';

// Stable empty array reference to prevent useSyncExternalStore infinite render loops
const EMPTY_ARRAY: CanvasNode[] = [];
let cachedValue: CanvasNode[] = EMPTY_ARRAY;
let cachedString: string = '';

const getParsedValue = (): CanvasNode[] => {
  if (typeof window === 'undefined') return EMPTY_ARRAY;
  
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    cachedValue = EMPTY_ARRAY;
    cachedString = '';
    return EMPTY_ARRAY;
  }
  
  if (raw === cachedString) {
    return cachedValue;
  }
  
  try {
    cachedValue = JSON.parse(raw);
    cachedString = raw;
  } catch (err) {
    console.error('Failed parsing canvas layout from localStorage', err);
    cachedValue = EMPTY_ARRAY;
    cachedString = '';
  }
  return cachedValue;
};

const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach(listener => listener());
};

export const syncStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  
  getSnapshot() {
    return getParsedValue();
  },
  
  setSnapshot(newNodes: CanvasNode[]) {
    const raw = JSON.stringify(newNodes);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedValue = newNodes;
    cachedString = raw;
    emitChange();
  }
};

// Handle cross-tab storage changes
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      emitChange();
    }
  });
}

export function usePersistentLayout() {
  const layout = useSyncExternalStore(
    syncStore.subscribe,
    syncStore.getSnapshot,
    () => [] // Server snapshot default for SSR safety
  );
  
  const saveLayout = (newLayout: CanvasNode[]) => {
    syncStore.setSnapshot(newLayout);
  };
  
  return [layout, saveLayout] as const;
}
