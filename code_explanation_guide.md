# 📘 Low-Code Module Builder — File-Wise Code Explanation Guide

This guide provides a comprehensive, file-by-file explanation of the codebase. Each section maps the file back to its specific core architectural or feature requirements, details the key API hooks utilized, and provides a clear description of the code logic.

---

## 🏗️ 1. Core State & Schema Models

### 📁 1.1 `src/types/canvas.ts`
*   **Requirement Mapping:** Part 1 (Component Schema & TypeScript Union).
*   **Purpose:** Strong type safety of layout schemas and node hierarchies.
*   **Key Concepts & Code Logic:**
    *   Defines component types (`text`, `input`, `button`, `table`, `form`) and widths (`100%`, `50%`, `33%`).
    *   Models the tree as a **flat array with parent references** (`parentId?: string | null`) rather than a recursive tree. This ensures $O(N)$ high-performance updates instead of expensive recursive updates.
    *   Uses discriminated union type narrowing for individual widgets (`TextNode`, `InputNode`, etc.).
    *   Provides runtime type guards like `isInputNode` and factory builders like `createDefaultNode` to initialize new elements with pre-configured default values.

---

### 📁 1.2 `src/store/canvasReducer.ts`
*   **Requirement Mapping:** Part 2 (Pure Canvas State mutations).
*   **Purpose:** pure layout actions processor.
*   **Key Concepts & Code Logic:**
    *   Manages core actions: `ADD_NODE`, `DELETE_NODE`, `MOVE_NODE`, `UPDATE_PROPS`, and `SET_CANVAS`.
    *   **Recursive Children Deletion:** When a node is deleted, the private helper `deleteNodeAndChildren` scans child IDs pointing to that parent ID and recursively wipes out all nested nodes, preventing memory leaks and orphaned database fields.
    *   **Indices Re-ordering:** Splices and inserts elements cleanly at exact canvas target indices during re-orders or drag moves.

---

### 📁 1.3 `src/hooks/usePersistentLayout.ts`
*   **Requirement Mapping:** Part 2 (Cross-Tab Synchronized Persistence).
*   **Purpose:** Coordinates localStorage updates across multiple open browser tabs in lockstep.
*   **Key Concepts & Code Logic:**
    *   Uses React 18's **`useSyncExternalStore`** API to safely subscribe to external storage state.
    *   **Referential Loop Protection:** Solves the common React `Maximum update depth exceeded` loops. Re-parsing a JSON string from localStorage returns a different array identity every frame. This hook maintains an in-memory `cachedValue` and `cachedString` and only updates React if the raw string representation actually changes.
    *   Binds a static `EMPTY_ARRAY` to prevent recursive empty array re-renders.

---

### 📁 1.4 `src/contexts/CanvasContext.tsx`
*   **Requirement Mapping:** Part 2 (State Coordination Context Provider).
*   **Purpose:** Links the pure reducer mutations with the external sync hook.
*   **Key Concepts & Code Logic:**
    *   Wraps the reducer state and the persistent layout hook.
    *   **Mutual Exclusion Latch:** Uses a stable `lastSavedStrRef` ref tracker. If the local reducer state changes, it synchronizes it to storage. If the storage updates externally (e.g. from another tab), it dispatches `SET_CANVAS` back to the reducer. This mutual latch breaks infinite synchronization loops.
    *   Injects a history hook (`commitState`) into `dispatchWithHistory` so that Zustand automatically records a snapshot before any node is created, moved, or edited.

---

### 📁 1.5 `src/store/useBuilderStore.ts`
*   **Requirement Mapping:** Part 7 (UI States & Bounded Undo/Redo Engine).
*   **Purpose:** Lightweight Zustand store managing current selections, drag states, layout mode, and transaction histories.
*   **Key Concepts & Code Logic:**
    *   Maintains double-ended bounded stacks (`past`, `future`) capped at **50 snapshots** for memory safety.
    *   **Undo Actions:** Moves the current canvas state into the `future` stack, pops the top of the `past` stack, and updates the canvas store snapshot via `syncStore.setSnapshot`.
    *   **Redo Actions:** Moves the current canvas state into the `past` stack, pops the top of the `future` stack, and updates the canvas store.

---

## 🎨 2. Component Layout & Drag & Drop Interfaces

### 📁 2.1 `src/components/Palette.tsx`
*   **Requirement Mapping:** Part 3 (Component Drag Source Palette).
*   **Purpose:** Draggable left sidebar toolbar tiles.
*   **Key Concepts & Code Logic:**
    *   Maps each component type (Text, Input, etc.) to a draggable tile.
    *   Integrates `@dnd-kit/core`'s **`useDraggable`** hook, mapping `isPaletteItem: true` and the corresponding `type` into the payload.
    *   Styled with sleek HSL variables, frosted glass background, and smooth hover translations.

---

### 📁 2.2 `src/components/Canvas.tsx`
*   **Requirement Mapping:** Part 3, 6 & 7 (Nestable Droppable Workspace & Side-by-Side placement).
*   **Purpose:** Interactive editor grid viewport.
*   **Key Concepts & Code Logic:**
    *   Combines **`useDroppable`** for dropping elements from the Palette, and `@dnd-kit/sortable`'s **`SortableContext`** to enable visual reordering.
    *   **Nesting Drops support:** Detects if a component is being dragged inside a Form Container, dropping elements into container boundaries.
    *   **Side-by-Side Flex Wrap:** Arranges canvas blocks in wrapping flex grids (`flex-wrap`). Adjusting component widths (Full, Half, One-Third) aligns elements perfectly next to each other in rows.
    *   **Crash Protection:** Surrounds each component individually with a class `ErrorBoundary`. If configuration errors arise, the error is isolated inside that element block, keeping the rest of the workspace completely responsive.

---

### 📁 2.3 `src/components/PropertyPanel.tsx`
*   **Requirement Mapping:** Part 4 (Dynamic properties Editor Sidebar).
*   **Purpose:** Type-narrowed details editing forms.
*   **Key Concepts & Code Logic:**
    *   Dynamically selects configuration forms based on the active component type (e.g. align/variant for Text, options for Select dropdowns, columns for Table).
    *   Integrates **React Hook Form** + Zod resolver to validate values.
    *   **Dynamic Field Arrays:** Integrates RHF `useFieldArray` to allow developers to build columns lists dynamically for Tables or choices lists for Select inputs.
    *   **Keypress Transition:** Wraps real-time property synchronization updates inside a React **`useTransition`** hook, keeping properties typing completely fluid even if the canvas is performing heavy renders.

---

### 📁 2.4 `src/components/Preview.tsx`
*   **Requirement Mapping:** Part 5 (Interactive Preview & Dynamic Zod Form Compiler).
*   **Purpose:** Interactive production preview workspace.
*   **Key Concepts & Code Logic:**
    *   **The Zod Validation Compiler:** Scans the active canvas list, extracts input fields nested inside each Form Container, and dynamically compiles a strict validation schema based on configurations (e.g., coercing inputType='number' into `z.coerce.number()`, enforcing `min(1)` for required fields).
    *   Binds validation resolvers directly with RHF, rendering error labels underneath input fields.
    *   **Data Tables binding:** Hooks Table components up to live simulated server datasets, rendering actual rows dynamically.

---

### 📁 2.5 `src/components/ErrorBoundary.tsx`
*   **Requirement Mapping:** Part 6 (Isolated Canvas elements Resilience).
*   **Purpose:** Class component handling runtime catches.
*   **Key Concepts & Code Logic:**
    *   Leverages `getDerivedStateFromError` and `componentDidCatch` to intercept render crashes.
    *   Isolates failures to a beautiful dark fallback block with a "Reset Component" action button, keeping the parent editor secure.

---

## 💾 3. Persistence & Main Orchestrators

### 📁 3.1 `src/utils/mockApi.ts`
*   **Requirement Mapping:** Part 6 (Simulated Backend database queries).
*   **Purpose:** Simulated latency API data endpoints.
*   **Key Concepts & Code Logic:**
    *   Provides mock data collections (`sample-users`, `sample-products`, `sample-orders`).
    *   Exposes async `fetchRemoteLayout` and `saveRemoteLayout` functions with a simulated network delay to test real-world loading lifecycles.

---

### 📁 3.2 `src/hooks/useLayoutQuery.ts`
*   **Requirement Mapping:** Part 6 (Optimistic Server Cloud Persistence).
*   **Purpose:** Synchs canvas edits to simulated remote DB using TanStack Query.
*   **Key Concepts & Code Logic:**
    *   Integrates `useMutation` to handle layout backup syncs in the background.
    *   **Optimistic UI updates:** Modifies query cache endpoints instantly so saves execute smoothly without blocking the UI, preserving snapshots to allow robust rollback recoveries if network saving fails.

---

### 📁 3.3 `src/App.tsx`
*   **Requirement Mapping:** Root Entry point coordinating drag-and-drop contexts.
*   **Purpose:** Integrates workspaces, providers, overlays, and custom detectors.
*   **Key Concepts & Code Logic:**
    *   Binds `<QueryClientProvider>`, `<CanvasProvider>`, and the workspace wrapper together.
    *   **Custom Collision Detection prioritizer:** Overrides `@dnd-kit/core`'s default bounding boxes by writing `customCollisionDetection`. It scans active pointer positions inside nested **Form Containers** droppable slots first before falling back to outer Canvas rect boundaries, enabling flawless nested drops.

---

### 📁 3.4 `tests/e2e/low_code_builder.spec.ts`
*   **Requirement Mapping:** Part 8 (E2E Playwright verification suite).
*   **Purpose:** Standard automated user-behavior test suite.
*   **Key Concepts & Code Logic:**
    *   Spins up local browser viewports to validate element drag creations, property editor synchronizations, compiled validation errors, and cross-tab lockstep syncs.
