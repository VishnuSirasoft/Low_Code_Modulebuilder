import { createDefaultNode } from '../types/canvas';
import type { CanvasNode, ComponentType } from '../types/canvas';


export type CanvasAction =
  | { type: 'ADD_NODE'; payload: { id: string; nodeType: ComponentType; parentId?: string | null; targetIndex?: number } }
  | { type: 'DELETE_NODE'; payload: { nodeId: string } }
  | { type: 'MOVE_NODE'; payload: { nodeId: string; overId: string | null; parentId?: string | null; targetIndex?: number } }
  | { type: 'UPDATE_PROPS'; payload: { nodeId: string; props: any } }
  | { type: 'SET_CANVAS'; payload: CanvasNode[] };

// Helper to remove a node and all its recursive children
const deleteNodeAndChildren = (nodes: CanvasNode[], nodeIdToDelete: string): CanvasNode[] => {
  // Find all children of this node
  const childIds = nodes.filter(node => node.parentId === nodeIdToDelete).map(node => node.id);
  
  // Filter out the node itself
  let updatedNodes = nodes.filter(node => node.id !== nodeIdToDelete);
  
  // Recursively delete children
  for (const childId of childIds) {
    updatedNodes = deleteNodeAndChildren(updatedNodes, childId);
  }
  
  return updatedNodes;
};

export const canvasReducer = (state: CanvasNode[], action: CanvasAction): CanvasNode[] => {
  switch (action.type) {
    case 'ADD_NODE': {
      const { id, nodeType, parentId = null, targetIndex } = action.payload;
      const newNode = createDefaultNode(nodeType, id, parentId);
      
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= state.length) {
        const nextState = [...state];
        nextState.splice(targetIndex, 0, newNode);
        return nextState;
      }
      
      return [...state, newNode];
    }

    case 'DELETE_NODE': {
      const { nodeId } = action.payload;
      return deleteNodeAndChildren(state, nodeId);
    }

    case 'MOVE_NODE': {
      const { nodeId, overId, parentId = null, targetIndex } = action.payload;
      
      const nodeIndex = state.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) return state;
      
      const updatedNode = { ...state[nodeIndex], parentId };
      const nextState = state.filter(n => n.id !== nodeId);
      
      let finalIndex = nextState.length;
      
      if (typeof targetIndex === 'number') {
        finalIndex = targetIndex;
      } else if (overId) {
        const overIndex = nextState.findIndex(n => n.id === overId);
        if (overIndex !== -1) {
          finalIndex = overIndex;
        }
      }
      
      // Safety bounds
      finalIndex = Math.max(0, Math.min(finalIndex, nextState.length));
      
      nextState.splice(finalIndex, 0, updatedNode);
      return nextState;
    }

    case 'UPDATE_PROPS': {
      const { nodeId, props } = action.payload;
      return state.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            props: {
              ...node.props,
              ...props,
            },
          } as CanvasNode;
        }
        return node;
      });
    }

    case 'SET_CANVAS': {
      return action.payload;
    }

    default:
      return state;
  }
};
