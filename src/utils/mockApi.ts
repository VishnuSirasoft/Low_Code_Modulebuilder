import type { CanvasNode } from '../types/canvas';

// ==========================================
// 1. MOCK DATASETS FOR PREVIEW TABLES
// ==========================================

export const mockDatasets: Record<string, Array<Record<string, any>>> = {
  'sample-users': [
    { id: 'USR001', name: 'Diana Prince', email: 'diana@justice.org', role: 'Administrator', status: 'Active' },
    { id: 'USR002', name: 'Bruce Wayne', email: 'bruce@wayne.corp', role: 'Executive', status: 'Active' },
    { id: 'USR003', name: 'Clark Kent', email: 'clark@dailyplanet.com', role: 'Editor', status: 'Inactive' },
    { id: 'USR004', name: 'Barry Allen', email: 'barry@ccpd.gov', role: 'Developer', status: 'Active' },
  ],
  'sample-products': [
    { id: 'PRD801', name: 'Quantum Core', category: 'Energy', price: '$24,500', stock: 12 },
    { id: 'PRD802', name: 'Nanotech Weave', category: 'Materials', price: '$1,200', stock: 45 },
    { id: 'PRD803', name: 'Neural Link V2', category: 'Cybernetics', price: '$8,999', stock: 3 },
    { id: 'PRD804', name: 'Vibranium Plate', category: 'Materials', price: '$150,000', stock: 2 },
  ],
  'sample-orders': [
    { id: 'ORD5001', customer: 'Tony Stark', total: '$1,250,000', date: '2026-05-28', status: 'Shipped' },
    { id: 'ORD5002', customer: 'Steve Rogers', total: '$85', date: '2026-05-27', status: 'Delivered' },
    { id: 'ORD5003', customer: 'Natasha Romanoff', total: '$14,200', date: '2026-05-29', status: 'Processing' },
  ],
};

// ==========================================
// 2. SIMULATED REMOTE SERVER LAYOUT STORAGE
// ==========================================

const DELAY = 600; // Simulated latency in ms

// Simple in-memory server database
let serverDatabaseLayout: CanvasNode[] = [];

// Helper to load initially from local storage if available, to make tests look seamless
const initServerDb = () => {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('low-code-builder-layout');
    if (local) {
      try {
        serverDatabaseLayout = JSON.parse(local);
      } catch {
        // ignore
      }
    }
  }
};
initServerDb();

export const fetchRemoteLayout = async (): Promise<CanvasNode[]> => {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return [...serverDatabaseLayout];
};

export const saveRemoteLayout = async (nodes: CanvasNode[]): Promise<CanvasNode[]> => {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  serverDatabaseLayout = [...nodes];
  return serverDatabaseLayout;
};
