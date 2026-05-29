# Low-Code Screen & Module Builder ⚡

A high-fidelity, high-performance **Low-Code Screen Builder** featuring smooth nested drag-and-drop mechanics, a dynamic runtime compiled validation engine, multi-tab synchronized state, automatic cloud persistent syncing with optimistic updates, individual component crash resiliencies, and keybound undo/redo histories. 

Styled with a bespoke, sleek **glassmorphic dark-theme design system** utilizing modern typography and fine micro-animations.

---

## 🚀 Setup & Execution

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v16+ recommended) and `npm` installed.

### 2. Installation
Clone the repository and install dependencies:
```bash
# Install package dependencies
npm install
```

### 3. Start Development Server
Spin up the local high-speed Vite server:
```bash
npm run dev
```
Open the provided local URL (typically `http://localhost:5173`) in your browser.
To experience the **cross-tab real-time synchronization**, open the same URL in *two separate windows or tabs side-by-side* and drag components in one tab—the other tab will automatically sync instantly!

### 4. Build for Production
To package the project as an optimized production-grade static build:
```bash
npm run build
```

---

## 🧠 State Management Justification & Design Patterns

An architectural separation of concerns is utilized, leveraging three complimentary state models to achieve maximum performance, maintainability, and clean reactive workflows:

### A. Tree Mutations & Canvas Nodes (`useReducer`)
The canvas layout is modeled as a **flat list with `parentId` pointer references** (rather than a deeply recursive tree). Flat arrays keep insertions (`ADD_NODE`), re-ordering/reparenting (`MOVE_NODE`), and property updates (`UPDATE_PROPS`) running in **$O(1)$ or $O(N)$ time complexity** rather than expensive recursive traversals.
- A pure React `useReducer` manages these discrete operations.
- Deep recursive deletes are supported (deleting a Form Container recursively wipes all child inputs).

### B. Multi-Tab Realtime Synchronization (`useSyncExternalStore`)
Rather than keeping layout snapshots in simple ad-hoc local storages, we implement the modern **React 18 `useSyncExternalStore`** API.
- We set up a custom pub-sub listener on `window.storage` events.
- **Referential Integrity Optimization:** To avoid infinite re-render loops caused by re-parsing JSON strings from `localStorage` on every render, we maintain an in-memory cache reference. We only re-parse and trigger React updates if the string representation in `localStorage` actually updates.
- This creates an industry-grade experience where editing layouts synchronizes across all browser windows instantly!

### C. Global UI & Transaction History Engine (`Zustand`)
For high-frequency editor states (selected node ID, active drag overlays, editor vs preview mode, and transaction histories), we use a lightweight **Zustand** store.
- **Undo / Redo Middleware:** State mutations are recorded into bounded `past` and `future` stacks (capped at 50 snapshot states for memory-safe constraints).
- System-driven mutations (such as loading remote state or syncing across tabs) are correctly bypassed so they do not fill up the user's Undo/Redo timeline.

---

## 🌟 Advanced & Bonus Implementations (Completed)

1. **Transaction Undo/Redo Engine**:
   - Undo last actions by clicking toolbar buttons or pressing `Ctrl+Z`.
   - Redo actions by clicking toolbar buttons or pressing `Ctrl+Y` / `Ctrl+Shift+Z`.
   - Bypasses text fields so normal typing does not conflict with undo hotkeys.
2. **Runtime Zod Schema Compiler**:
   - Inside the **Live Preview**, any Form Container scans its child input components and compiles a strict **Zod validation schema** at runtime.
   - Wired directly with React Hook Form to show immediate error labels underneath custom inputs on invalid entries.
   - Prevents form submissions and details values in high-fidelity alert windows if successfully validated.
3. **Optimistic Cloud Syncing (`TanStack Query`)**:
   - Wired layout state with simulated remote servers via TanStack Query.
   - Mutations utilize **optimistic UI updates**—cache endpoints are updated instantly, and context snapshots are preserved. If remote saves fail, layout states automatically roll back to previous stable baselines.
4. **Custom Drag Collision Prioritization**:
   - dnd-kit pointer collisions are customized to prioritize nested slots inside **Form Containers** over outer Canvas layers. This enables dropping elements *into* forms or re-sorting them internally.
   - Forms are prevented from being nested inside forms for strict layout safety.
5. **JSON Configuration Import / Export**:
   - Layout blueprints can be exported instantly to local files via `low_code_layout_[timestamp].json`.
   - Layouts can be loaded by uploading layout files through a hidden file portal.
6. **Resilience Boundaries (`ErrorBoundary`)**:
   - Wrapped individual canvas widgets inside modular React `ErrorBoundary` wrappers.
   - If one element fails to compile due to bad props, the crash is isolated locally—rendering a diagnostic tile with a **"Reset Component"** button, preventing the entire editor from crashing.
7. **Performance & Memoizations**:
   - Canvas nodes are wrapped in `React.memo` preventing redundant renders of un-modified items.
   - Trees are filtered and compiled using React `useMemo` hooks.
   - High-fidelity Preview viewport is **lazy-loaded** using React `Suspense` and bundle split loaders.
