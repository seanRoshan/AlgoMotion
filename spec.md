# AlgoMotion — Algorithm & Computer Science Animation Studio

## Technical Specification v1.0

---

## 1. Executive Summary

AlgoMotion is a browser-based interactive animation studio for creating, editing, and exporting visual explanations of algorithms, data structures, computer architecture concepts, and mathematical problems. It targets educators, students, content creators, and engineers who need to produce high-quality, step-by-step visual walkthroughs of complex CS concepts.

The application provides a **canvas-based animation workspace** with a synchronized code editor, a timeline scrubber, and a library of pre-built primitives (nodes, edges, memory cells, registers, buses, etc.) that users compose into scenes. Users can write declarative animation scripts or use a visual drag-and-drop builder. Final outputs export as MP4/WebM video, animated GIF, interactive embeddable HTML, or shareable link.

---

## 2. Problem Statement

Explaining algorithms and computer architecture visually is painful today:

- **Manim** (3Blue1Brown's tool) requires Python expertise and offline rendering — steep learning curve, no real-time preview, no interactivity.
- **PowerPoint/Keynote** animations are tedious to build, non-programmable, and produce static slides.
- **Excalidraw/tldraw** are great for static diagrams but have no animation timeline or step-by-step execution model.
- **VisuAlgo** is view-only with a fixed set of algorithms — users cannot create their own visualizations.
- **D3.js** requires significant JavaScript expertise to produce even simple animations.

AlgoMotion fills the gap: **a real-time, browser-based animation studio with both visual and programmatic interfaces, purpose-built for CS education content.**

---

## 3. Target Users

| Persona | Needs |
|---|---|
| **CS Educators** | Create lecture animations for sorting, graph traversal, CPU pipelines. Export to video for LMS. |
| **Students** | Step through algorithms interactively to build intuition. Modify parameters and observe changes. |
| **Content Creators** | Produce polished YouTube/blog animations without learning Manim or After Effects. |
| **Technical Authors** | Embed interactive visualizations in documentation, blog posts, and textbooks. |
| **Interview Prep** | Visualize and rehearse algorithm solutions with real-time state inspection. |

---

## 4. Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.x | RSC, React 19.2, React Compiler stable, Build Adapters API, Turbopack stable |
| **Language** | TypeScript | 5.9+ | Strict mode, satisfies operator, decorator metadata (TS 6.0 bridge release imminent) |
| **UI Components** | shadcn/ui + Radix UI | Latest | Copy-paste ownership, accessible primitives, unified `radix-ui` package, Tailwind-native |
| **Styling** | Tailwind CSS | 4.1 | Oxide engine, zero-config content detection, CSS-first config, text-shadow & mask utilities |
| **Canvas Rendering** | Pixi.js | 8.x (8.16+) | High-performance 2D WebGPU/WebGL/Canvas2D renderer, 60fps scene graph |
| **Canvas Integration** | Imperative API | — | Direct Pixi.js scene graph management (no @pixi/react reconciler — better performance at scale) |
| **Code Editor** | Monaco Editor | 0.55+ | VS Code engine, syntax highlighting, IntelliSense, diff view |
| **State Management** | Zustand | 5.x (5.0+) | Minimal, performant, middleware (immer, persist, devtools) |
| **Timeline/Sequencing** | GSAP (GreenSock) | 3.14+ | Timeline sequencing, all plugins free (Webflow acquisition), precision easing |
| **Math Rendering** | KaTeX | 0.16+ | Fast LaTeX rendering, server-side compatible |
| **Graph Layout** | ELK.js | 0.11+ | Eclipse Layout Kernel — layered, force-directed, radial layouts (actively maintained) |
| **DSL Parser** | Peggy.js | 5.x | PEG parser generator, compiles DSL to GSAP timelines |
| **Persistence** | IndexedDB (Dexie.js) | 4.x (4.3+) | Client-side project storage, offline-first |
| **Cloud DB** | Supabase PostgreSQL | Latest | Database with RLS, real-time subscriptions, PostgREST v14 |
| **Cloud Storage** | Supabase Storage | Latest | File storage with resumable uploads (TUS), Smart CDN, image transforms, signed URLs |
| **Auth** | Supabase Auth (`@supabase/ssr`) | Latest | OAuth, magic link, email/password, cookie-based SSR sessions, RLS integration |
| **Video Export** | FFmpeg.wasm | 0.12+ | Client-side video encoding, no server dependency |
| **GIF Export** | modern-gif | 2.x | Fast browser-side GIF encoding (replaces unmaintained gif.js) |
| **ID Generation** | nanoid | 5.x | Tiny (118 bytes), secure, URL-friendly unique IDs |
| **Testing** | Vitest + Playwright | 4.x / 1.58+ | Unit/integration testing + E2E browser testing |
| **Package Manager** | pnpm | 10.x | Fast, strict, disk-efficient |
| **Linting** | Biome | 2.3+ | Fast linter + formatter, 434 rules, type-aware linting |
| **Monitoring** | Sentry + Vercel Analytics | Latest | Error tracking + session replay + Web Vitals + traffic analytics |
| **Feature Flags** | Vercel Flags SDK | Latest | Flags as code, Toolbar integration, phased rollouts |
| **Hosting** | Vercel | Latest | Next.js optimized, edge functions, ISR, preview deployments |

---

## 5. Architecture Overview

```
┌─ React (UI Chrome) ──────────────────────────────────────────────────┐
│  Toolbar, Panels, Inspector, Command Palette                         │
│  (shadcn/ui + Tailwind CSS — only renders UI, not per-frame canvas)  │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ reads/writes
┌──────────────────────────▼───────────────────────────────────────────┐
│  Zustand Stores (Single Source of Truth)                              │
│  scene.ts | timeline.ts | execution.ts | ui.ts | project.ts          │
│  Middleware: immer (undo/redo) + persist (IndexedDB) + devtools      │
└──────┬──────────────────────┬──────────────────┬─────────────────────┘
       │                      │                  │
┌──────▼───────────┐  ┌───────▼────────┐  ┌─────▼──────────────────┐
│ Pixi.js          │  │ GSAP           │  │ Web Workers            │
│ SceneManager     │  │ TimelineManager│  │ - Code Executor        │
│ (imperative API) │◄►│ (plays/pauses) │  │ - DSL Parser (Peggy)   │
│                  │  │                │  │ - Video Encoder (FFmpeg)│
└──────────────────┘  └────────────────┘  └────────────────────────┘
       │
┌──────▼───────────────────────────────────────────────────────────────┐
│  Persistence Layer                                                    │
│  IndexedDB (Dexie.js, offline-first) ↔ Supabase (cloud sync)        │
│  Auth: @supabase/ssr | Storage: Supabase Storage (TUS, CDN, signed) │
└───────────────────────────────────────────────────────────────────────┘
```

**Key architectural decision:** React handles UI chrome only (toolbar, panels, inspector). The Pixi.js canvas is managed via an imperative `SceneManager` class that subscribes to Zustand store changes — no React reconciler for the canvas. During animation playback, GSAP manipulates Pixi.js objects directly for 60fps performance, writing back to Zustand only on pause/stop.

### 5.1 Module Decomposition

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, signup, callback)
│   ├── (dashboard)/              # Project listing, templates, settings
│   ├── editor/[projectId]/       # Main editor workspace
│   └── embed/[projectId]/        # Public embeddable player
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── canvas/                   # Pixi.js scene components
│   │   ├── primitives/           # Node, Edge, MemoryCell, Register, Bus, Arrow
│   │   ├── composites/           # Array, LinkedList, BinaryTree, Graph, Stack, Queue
│   │   ├── architecture/         # CPU, ALU, Cache, Pipeline, MemoryHierarchy
│   │   ├── math/                 # Coordinate plane, Matrix, Vector, NumberLine
│   │   └── annotations/         # Label, Callout, Highlight, Bracket
│   ├── editor/                   # Monaco wrapper, code sync, breakpoints
│   ├── timeline/                 # Timeline track, keyframe editor, scrubber
│   ├── inspector/                # Property panels, style editors
│   ├── toolbar/                  # Tool selection, zoom, undo/redo
│   └── export/                   # Export dialog, format options, progress
├── engine/
│   ├── animation/                # GSAP timeline builder, easing presets
│   ├── interpreter/              # Step-by-step code execution engine
│   ├── dsl/                      # Animation DSL parser and compiler
│   ├── layout/                   # Auto-layout algorithms (Dagre, force-directed)
│   └── renderer/                 # Pixi.js scene graph manager
├── store/                        # Zustand stores
│   ├── scene.ts                  # Scene elements and connections
│   ├── timeline.ts               # Playback state, keyframes
│   ├── execution.ts              # Code execution state
│   ├── ui.ts                     # Panel visibility, selection, tool mode
│   └── project.ts                # Project metadata, save/load
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities, constants, type definitions
├── types/                        # Global TypeScript type definitions
└── styles/                       # Global CSS, Tailwind config
```

---

## 6. Core Features

### 6.1 Canvas Workspace

The central workspace is a Pixi.js-powered 2D canvas with infinite pan/zoom, rendered at 60fps.

**Requirements:**

- Infinite canvas with smooth pan (middle-click/two-finger drag) and zoom (scroll wheel/pinch) with configurable min/max bounds (0.1x–5x)
- Snap-to-grid with configurable grid size (8px default), toggle-able with `Ctrl+;`
- Multi-select via click+drag marquee or `Shift+Click`
- Undo/redo stack with 200-step history using immer patches
- Copy/paste of elements and element groups with `Ctrl+C` / `Ctrl+V`
- Rulers along top/left edges with dynamic unit scaling
- Minimap overlay (bottom-right) showing full scene with viewport indicator
- Background options: dots, grid lines, none — configurable color

**Coordinate System:**

- Origin (0,0) at canvas center
- Y-axis points downward (screen coordinates)
- All positions stored in logical units, rendered at device pixel ratio
- Camera state: `{ x, y, zoom }` stored in Zustand, URL-synced for shareability

### 6.2 Primitive Elements

All primitives extend a base `SceneElement` type:

```typescript
interface SceneElement {
  id: string;                          // nanoid
  type: ElementType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;                    // degrees
  opacity: number;                     // 0–1
  visible: boolean;
  locked: boolean;
  label?: string;
  style: ElementStyle;
  metadata: Record<string, unknown>;
  children?: string[];                 // child element IDs for composites
}

interface ElementStyle {
  fill: string;                        // hex color
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  textColor: string;
  shadow?: { x: number; y: number; blur: number; color: string };
}

type ElementType =
  // Primitives
  | 'node' | 'edge' | 'arrow' | 'rect' | 'ellipse' | 'text' | 'image'
  // Data Structure Cells
  | 'arrayCell' | 'stackFrame' | 'heapBlock' | 'pointerArrow'
  | 'treeNode' | 'graphNode' | 'linkedListNode' | 'hashBucket'
  // Architecture
  | 'register' | 'aluUnit' | 'cacheLine' | 'memoryWord' | 'bus' | 'pipeline_stage'
  | 'controlUnit' | 'mux' | 'decoder' | 'flipFlop'
  // Math
  | 'coordinatePlane' | 'vector' | 'matrix' | 'numberLine' | 'equation'
  // Annotations
  | 'callout' | 'bracket' | 'highlightRegion' | 'codeSnippet';
```

### 6.3 Composite Elements (Pre-built Visualizations)

Composites are groups of primitives with built-in layout logic and animation behaviors.

#### 6.3.1 Data Structures

| Composite | Primitives Used | Auto-Layout | Built-in Animations |
|---|---|---|---|
| **Array** | `arrayCell[]` | Horizontal strip with index labels | Swap, shift, highlight, compare, insert, delete |
| **Linked List** | `linkedListNode[]` + `pointerArrow[]` | Horizontal/vertical chain | Insert, delete, traverse, reverse |
| **Stack** | `stackFrame[]` | Vertical stack (LIFO visual) | Push, pop, peek highlight |
| **Queue** | `arrayCell[]` | Horizontal with front/rear markers | Enqueue, dequeue, circular wrap |
| **Binary Tree** | `treeNode[]` + `edge[]` | Dagre hierarchical layout | Insert, delete, rotate, traverse (in/pre/post/level) |
| **BST** | Extends Binary Tree | Balanced re-layout | Search path highlight, rebalance animation |
| **AVL Tree** | Extends BST | Auto-rebalance | Left/right rotation with height update |
| **Red-Black Tree** | Extends BST | Color-coded nodes | Recolor, rotation, fixup animation |
| **Heap** | `treeNode[]` + array overlay | Complete binary tree | Heapify up/down, extract-min/max |
| **Hash Table** | `hashBucket[]` + `linkedListNode[]` | Vertical buckets with chains | Hash computation, collision, chaining, resize |
| **Graph** | `graphNode[]` + `edge[]` | Force-directed / Dagre | BFS/DFS wavefront, shortest path highlight, MST growth |
| **Trie** | `treeNode[]` + `edge[]` | Radial/hierarchical | Character-by-character insertion, prefix search |
| **Disjoint Set** | `treeNode[]` | Forest of trees | Union by rank, path compression animation |
| **Segment Tree** | `treeNode[]` + range labels | Complete binary tree | Range query highlight, lazy propagation |
| **Skip List** | `linkedListNode[]` (multi-level) | Multi-lane horizontal | Search descent, insert with coin flips |

#### 6.3.2 Computer Architecture

| Composite | Description | Built-in Animations |
|---|---|---|
| **CPU Datapath** | Registers, ALU, MUX, control unit, buses | Instruction fetch/decode/execute cycle, data flow along buses |
| **Pipeline (5-stage)** | IF → ID → EX → MEM → WB stages | Instruction flow, hazard detection, stall/bubble/forward |
| **Cache Hierarchy** | L1/L2/L3 + main memory blocks | Cache hit/miss, LRU eviction, write-back/write-through |
| **Memory Hierarchy** | Registers → Cache → RAM → Disk | Access time comparison, page fault, TLB lookup |
| **Virtual Memory** | Page table + physical frames + TLB | Page table walk, TLB hit/miss, page fault handler |
| **Branch Predictor** | BHT/BTB tables + pipeline | Predict/mispredict, flush, penalty cycles |
| **Bus Architecture** | Address/data/control buses | Bus arbitration, read/write cycles, DMA transfer |
| **Floating Point Unit** | Sign/exponent/mantissa breakdown | IEEE 754 encoding, addition/multiplication steps |
| **FSM Visualizer** | States + transitions | State transitions with input highlighting |

#### 6.3.3 Algorithm Categories

Pre-built animation templates with customizable input:

**Sorting:** Bubble, Selection, Insertion, Merge, Quick, Heap, Radix, Counting, Tim, Shell
**Searching:** Linear, Binary, Interpolation, Exponential, Ternary
**Graph:** BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, A*, Prim, Kruskal, Topological Sort, Tarjan SCC, Kosaraju
**Dynamic Programming:** Fibonacci, Knapsack, LCS, LIS, Edit Distance, Matrix Chain, Coin Change
**String:** KMP, Rabin-Karp, Boyer-Moore, Aho-Corasick, Suffix Array
**Divide & Conquer:** Merge Sort, Quick Select, Closest Pair, Strassen Matrix Multiply
**Greedy:** Activity Selection, Huffman Coding, Fractional Knapsack
**Backtracking:** N-Queens, Sudoku Solver, Graph Coloring, Hamiltonian Path
**Math:** Sieve of Eratosthenes, GCD (Euclidean), Fast Exponentiation, FFT, Matrix Operations

### 6.4 Animation Timeline

A professional timeline UI inspired by video editing tools (After Effects / Rive).

**Requirements:**

- Horizontal timeline track at the bottom of the workspace
- Playback controls: Play, Pause, Stop, Step Forward, Step Backward, Loop toggle
- Speed control: 0.25x, 0.5x, 1x, 1.5x, 2x, 4x
- Scrubber/playhead that can be dragged to any point in the animation
- Per-element animation tracks showing keyframe diamonds
- Keyframe types: position, opacity, scale, color, custom properties
- Easing curve editor (cubic-bezier visual editor) per keyframe transition
- Keyframe interpolation: linear, ease-in, ease-out, ease-in-out, spring, bounce, elastic
- Animation grouping: group multiple animations into named sequences
- Markers: named time markers for labeling phases ("Partition", "Merge", "Compare")
- Duration display in seconds and frames (configurable FPS: 24, 30, 60)
- Waveform/event visualization showing animation density over time

**GSAP Integration:**

```typescript
interface AnimationSequence {
  id: string;
  name: string;
  duration: number;                    // seconds
  timeline: gsap.core.Timeline;
  keyframes: Keyframe[];
  markers: TimelineMarker[];
}

interface Keyframe {
  id: string;
  elementId: string;
  time: number;                        // seconds from sequence start
  property: string;                    // 'position.x' | 'opacity' | 'style.fill' | ...
  value: unknown;
  easing: string;                      // GSAP easing string
  duration: number;
}

interface TimelineMarker {
  time: number;
  label: string;
  color: string;
}
```

### 6.5 Code Editor & Execution Engine

A Monaco-based code editor synchronized with the canvas animation.

**Requirements:**

- Monaco Editor with syntax highlighting for JavaScript/TypeScript/Python/C++/Java
- Line-by-line execution highlighting (current line glow, visited lines dimmed)
- Breakpoint support: click gutter to toggle breakpoints
- Variable watch panel: display current values of all variables in scope
- Call stack visualization: show function call hierarchy
- Step controls synced to animation timeline: Step Into, Step Over, Step Out, Continue
- Custom code execution sandbox (Web Worker-based, no `eval`)
- Output console panel for `console.log` / `print` statements
- Diff view: show before/after state for each step
- Line annotations: attach canvas elements to specific code lines

**Execution Engine Architecture:**

```typescript
interface ExecutionState {
  currentLine: number;
  callStack: StackFrame[];
  variables: Map<string, VariableSnapshot>;
  heap: Map<string, HeapObject>;
  output: string[];
  status: 'idle' | 'running' | 'paused' | 'stepped' | 'complete' | 'error';
  stepCount: number;
  animationTime: number;              // maps execution step → timeline position
}

interface StackFrame {
  functionName: string;
  lineNumber: number;
  localVariables: Map<string, unknown>;
  returnAddress: number;
}

interface VariableSnapshot {
  name: string;
  value: unknown;
  type: string;
  previousValue: unknown;
  changed: boolean;                    // highlight if changed in this step
}
```

The execution engine runs in a **Web Worker** with message-passing to the main thread. The worker:

1. Parses the source code into an AST (using Babel for JS/TS, or a custom parser for pseudocode)
2. Instruments the AST to inject step hooks at each statement
3. Executes step-by-step, yielding control back to the main thread after each step
4. Emits `StepEvent` messages containing the updated execution state
5. The main thread maps each `StepEvent` to a timeline position and triggers the corresponding canvas animation

### 6.6 Animation DSL (Declarative Scripting)

A domain-specific language for scripting animations without using the visual builder.

```
// Example: Animate a bubble sort
scene "Bubble Sort" {
  array arr = [5, 3, 8, 1, 9, 2] at (400, 300)
  
  for i in 0..arr.length {
    for j in 0..arr.length - i - 1 {
      // Highlight comparison
      highlight arr[j], arr[j+1] color "#FFD700" duration 0.3s
      
      if arr[j] > arr[j+1] {
        swap arr[j], arr[j+1] duration 0.5s easing "spring"
      }
      
      unhighlight arr[j], arr[j+1] duration 0.2s
    }
    // Mark sorted
    mark arr[arr.length - i - 1] color "#4CAF50"
  }
}
```

**DSL Features:**

- `scene` blocks defining named animation scenes
- Element declarations with type, initial values, and position
- Control flow: `for`, `while`, `if/else`
- Built-in animation commands: `highlight`, `unhighlight`, `swap`, `move`, `insert`, `delete`, `mark`, `connect`, `disconnect`, `label`, `annotate`, `pause`, `wait`
- Timing: `duration`, `delay`, `easing`, `stagger`
- Camera commands: `zoom`, `pan`, `focus`
- Audio cues: `beep`, `click`, `success`, `error` (built-in sound effects)
- Variables and expressions for dynamic values
- Comments with `//` and `/* */`

**Parser:** Built with a PEG parser (using Peggy.js) that compiles DSL to a GSAP timeline.

### 6.7 Inspector / Properties Panel

A right-side panel showing editable properties of the selected element(s).

**Sections:**

- **Transform:** Position (x, y), Size (w, h), Rotation, Opacity
- **Style:** Fill color, Stroke color/width, Corner radius, Shadow
- **Typography:** Font family (from Google Fonts CDN), size, weight, color, alignment
- **Data:** Element-specific data (array values, node label, register contents, etc.)
- **Animation:** Attached keyframes, easing, duration, delay for this element
- **Constraints:** Snap behavior, alignment guides, group membership
- **Accessibility:** Alt text, ARIA label (for exported HTML)

All property changes are immediate (optimistic UI) with debounced persistence.

### 6.8 Template Library

A browsable gallery of pre-built animation templates.

**Categories:**

- Sorting Algorithms (12 templates)
- Search Algorithms (5 templates)
- Graph Algorithms (12 templates)
- Tree Operations (10 templates)
- Dynamic Programming (8 templates)
- CPU Architecture (6 templates)
- Memory Systems (4 templates)
- Math Concepts (8 templates)

Each template includes: preview thumbnail, description, difficulty tag, customization parameters (e.g., input array, graph edge list), and source code.

Templates are stored as JSON scene files and loaded into the editor for customization.

### 6.9 Export System

| Format | Method | Use Case |
|---|---|---|
| **MP4 / WebM** | FFmpeg.wasm client-side encoding from canvas frame capture | YouTube, LMS upload, slides |
| **Animated GIF** | gif.js frame capture | Quick sharing, README embeds |
| **PNG Sequence** | Canvas `.toDataURL()` per frame | External video editors |
| **Interactive HTML** | Self-contained HTML bundle with embedded Pixi.js player | Blog posts, documentation |
| **Shareable Link** | Hosted on Supabase with public embed player | Social media, Slack |
| **Lottie JSON** | Scene export as Lottie animation | Cross-platform embedding |
| **SVG Snapshot** | Static SVG export of current frame | Print, presentations |

**Video Export Pipeline:**

1. Set export resolution (720p, 1080p, 4K) and FPS (24, 30, 60)
2. Run the animation timeline programmatically at target FPS
3. Capture each frame from Pixi.js renderer as `ImageData`
4. Feed frames to FFmpeg.wasm encoder with H.264 codec (MP4) or VP9 (WebM)
5. Show progress bar with ETA
6. Download or upload to cloud storage

---

## 7. User Interface Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ┌─ Toolbar ────────────────────────────────────────────────────────────┐ │
│ │ [Logo] [File ▾] [Edit ▾] [View ▾] [Insert ▾] | Tools: [▢ ◯ △ →] | │ │
│ │ [Undo] [Redo] | [Zoom: 100%] | [▶ Play] [⏸] [⏹] [⏭] [1x ▾]    │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Left Panel ──┐ ┌─ Canvas ─────────────────────┐ ┌─ Right Panel ──┐ │
│ │               │ │                               │ │                │ │
│ │  Element      │ │                               │ │  Properties    │ │
│ │  Library      │ │     Pixi.js Rendering         │ │  Inspector     │ │
│ │               │ │     Canvas                    │ │                │ │
│ │  ─ Primitives │ │                               │ │  ─ Transform   │ │
│ │  ─ Data Struc │ │                               │ │  ─ Style       │ │
│ │  ─ CPU/Arch   │ │                               │ │  ─ Data        │ │
│ │  ─ Math       │ │                               │ │  ─ Animation   │ │
│ │  ─ Annotations│ │                               │ │                │ │
│ │               │ │                   [Minimap]    │ │  Variable      │ │
│ │  Templates    │ │                               │ │  Watch Panel   │ │
│ │  Gallery      │ │                               │ │                │ │
│ └───────────────┘ └───────────────────────────────┘ └────────────────┘ │
│ ┌─ Bottom Panel (tabbed) ────────────────────────────────────────────┐  │
│ │ [Timeline] [Code Editor] [Console] [DSL Editor]                    │  │
│ │ ┌─────────────────────────────────────────────────────────────────┐ │  │
│ │ │ 0s     1s      2s      3s      4s      5s      6s     7s      │ │  │
│ │ │ ├──◆──────◆────────◆───────────◆──────◆───────────◆──────┤   │ │  │
│ │ │ │  arr    arr      arr         arr     arr         arr    │   │ │  │
│ │ │ │  ◆──────────◆────────────────◆──────────────────◆──────│   │ │  │
│ │ │ │  highlight  compare          swap                done   │   │ │  │
│ │ │ ▶─────────────────|──────────────────────────────────────│   │ │  │
│ │ │                   ^ playhead                              │   │ │  │
│ │ └─────────────────────────────────────────────────────────────────┘ │  │
│ └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 7.1 Layout Behavior

- All panels are **resizable** with drag handles (minimum widths enforced)
- Left and right panels are **collapsible** with keyboard shortcut (`Ctrl+B` / `Ctrl+I`)
- Bottom panel tabs can be **detached** into floating windows
- Layout state persists to IndexedDB across sessions
- **Command palette** accessible via `Ctrl+K` (search commands, elements, templates)
- Dark mode default with light mode toggle — respects `prefers-color-scheme`

### 7.2 Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Play/Pause | `Space` |
| Step Forward | `→` |
| Step Backward | `←` |
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Shift+Z` |
| Delete Element | `Delete` / `Backspace` |
| Select All | `Ctrl+A` |
| Duplicate | `Ctrl+D` |
| Group | `Ctrl+G` |
| Ungroup | `Ctrl+Shift+G` |
| Zoom In | `Ctrl+=` |
| Zoom Out | `Ctrl+-` |
| Fit to Screen | `Ctrl+0` |
| Toggle Grid | `Ctrl+;` |
| Command Palette | `Ctrl+K` |
| Quick Export | `Ctrl+E` |
| Save | `Ctrl+S` |
| Toggle Code Editor | `Ctrl+\`` |

---

## 8. Data Model

### 8.1 Project Schema

```typescript
interface Project {
  id: string;                          // UUID
  name: string;
  description: string;
  thumbnail: string;                   // base64 or URL
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isPublic: boolean;
  tags: string[];
  settings: ProjectSettings;
  scenes: Scene[];
}

interface ProjectSettings {
  canvasWidth: number;                 // default 1920
  canvasHeight: number;                // default 1080
  backgroundColor: string;
  gridSize: number;
  snapToGrid: boolean;
  fps: number;                         // 30 or 60
  defaultEasing: string;
  theme: 'dark' | 'light' | 'system';
}

interface Scene {
  id: string;
  name: string;
  order: number;
  elements: SceneElement[];
  connections: Connection[];
  annotations: Annotation[];
  animationSequences: AnimationSequence[];
  codeSource?: CodeSource;
  duration: number;                    // total duration in seconds
}

interface Connection {
  id: string;
  fromElementId: string;
  toElementId: string;
  fromAnchor: AnchorPoint;
  toAnchor: AnchorPoint;
  type: 'straight' | 'bezier' | 'orthogonal' | 'arc';
  style: {
    stroke: string;
    strokeWidth: number;
    dashArray?: number[];
    animated: boolean;                 // flowing dots animation
    arrowHead: 'none' | 'triangle' | 'diamond' | 'circle';
    arrowTail: 'none' | 'triangle' | 'diamond' | 'circle';
  };
  label?: string;
}

type AnchorPoint = 'top' | 'bottom' | 'left' | 'right' | 'center'
  | { x: number; y: number };         // custom anchor position (0-1 relative)

interface CodeSource {
  language: 'javascript' | 'typescript' | 'python' | 'cpp' | 'java' | 'pseudocode';
  code: string;
  lineMapping: Map<number, string>;    // line number → animation sequence ID
}
```

### 8.2 Database Schema (Supabase/PostgreSQL)

```sql
-- Users (managed by Supabase Auth)
-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Scenes (one project has many scenes)
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scene_order INTEGER NOT NULL,
  data JSONB NOT NULL,                 -- elements, connections, animations
  code_source JSONB,
  duration REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Template library
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  thumbnail_url TEXT,
  scene_data JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own projects" ON projects
  USING (auth.uid() = user_id);
CREATE POLICY "Public projects are viewable" ON projects
  FOR SELECT USING (is_public = true);

-- Indexes
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_public ON projects(is_public) WHERE is_public = true;
CREATE INDEX idx_scenes_project ON scenes(project_id);
CREATE INDEX idx_templates_category ON templates(category);
```

---

## 9. Animation Engine Details

### 9.1 GSAP Timeline Orchestration

Every animation in AlgoMotion maps to a GSAP `Timeline` instance. The engine provides a layer between the scene graph and GSAP:

```typescript
class AnimationEngine {
  private masterTimeline: gsap.core.Timeline;
  private elementTimelines: Map<string, gsap.core.Timeline>;

  // Add an animation for a specific element
  addAnimation(
    elementId: string,
    properties: gsap.TweenVars,
    position: number | string,         // absolute time or relative label
  ): void;

  // Build a composite animation (e.g., "swap two array cells")
  addComposite(
    type: CompositeAnimationType,
    params: Record<string, unknown>,
    position: number | string,
  ): void;

  // Playback control
  play(): void;
  pause(): void;
  seek(time: number): void;
  reverse(): void;
  setSpeed(multiplier: number): void;

  // Frame capture for export
  captureFrame(): ImageData;
  renderAtTime(time: number): void;
}

type CompositeAnimationType =
  | 'array.swap' | 'array.shift' | 'array.highlight' | 'array.compare'
  | 'tree.insert' | 'tree.rotate' | 'tree.traverse'
  | 'graph.bfs' | 'graph.dfs' | 'graph.dijkstra'
  | 'cpu.fetch' | 'cpu.decode' | 'cpu.execute'
  | 'cache.hit' | 'cache.miss' | 'cache.evict'
  | 'pointer.follow' | 'pointer.redirect'
  | 'variable.update' | 'variable.compare';
```

### 9.2 Rendering Pipeline

```
User interaction / DSL script / Code step
            ↓
    Zustand Store Update
            ↓
    Animation Engine (GSAP)
            ↓
    Scene Graph Update (positions, styles, visibility)
            ↓
    Pixi.js Renderer (WebGPU → Canvas)
            ↓
    Display (60fps)
```

### 9.3 Animation Presets

Each data structure composite ships with pre-built animation presets:

```typescript
// Example: Array swap preset
const arraySwapPreset = {
  name: 'array.swap',
  params: ['indexA', 'indexB'],
  build: (tl: gsap.core.Timeline, elements: SceneElement[], params) => {
    const cellA = elements[params.indexA];
    const cellB = elements[params.indexB];
    const liftY = -60;

    tl.to(cellA, { y: cellA.position.y + liftY, duration: 0.2, ease: 'power2.out' })
      .to(cellB, { y: cellB.position.y + liftY, duration: 0.2, ease: 'power2.out' }, '<')
      .to(cellA, { x: cellB.position.x, duration: 0.4, ease: 'power2.inOut' })
      .to(cellB, { x: cellA.position.x, duration: 0.4, ease: 'power2.inOut' }, '<')
      .to(cellA, { y: cellA.position.y, duration: 0.2, ease: 'bounce.out' })
      .to(cellB, { y: cellB.position.y, duration: 0.2, ease: 'bounce.out' }, '<');
  }
};
```

---

## 10. Performance Requirements

| Metric | Target |
|---|---|
| Canvas render | Stable 60fps with ≤500 elements |
| Time to interactive | < 2s on 4G connection |
| Animation engine latency | < 16ms per frame (60fps budget) |
| Code execution step | < 50ms per step |
| Video export (1080p, 30s) | < 2 minutes on M1 MacBook |
| Bundle size (initial load) | < 300KB gzipped (code-split heavy deps) |
| IndexedDB save | < 100ms for typical project |
| Memory usage | < 512MB for projects with ≤1000 elements |

**Optimization Strategies:**

- **Code splitting:** Monaco Editor (~5MB), FFmpeg.wasm (~25MB) loaded on demand via `next/dynamic`; GSAP core loaded eagerly (small footprint)
- **Canvas optimization:** Pixi.js container culling (off-screen elements not rendered), object pooling for frequently created/destroyed elements
- **Web Workers:** Code execution engine, DSL parser, and video encoding all run in workers
- **Virtualization:** Timeline track and element library use virtual scrolling for large lists
- **Memoization:** React components use `React.memo` with shallow comparison; Pixi components use `useMemo` for expensive computations
- **Incremental rendering:** Large graphs and trees render progressively with `requestIdleCallback`

---

## 11. Accessibility Requirements

- Full keyboard navigation for all workspace interactions
- Screen reader announcements for animation state changes ("Step 3 of 12: Comparing elements at index 2 and 3")
- High contrast mode with WCAG AAA color ratios (7:1 minimum)
- Reduced motion mode: respects `prefers-reduced-motion`, replaces animations with instant state changes
- Focus indicators on all interactive elements (visible 2px outline, not relying on color alone)
- Alt text on all exported images and HTML embeds
- ARIA live regions for variable watch panel updates
- Keyboard-only step-through mode (no mouse required)

---

## 12. Testing Strategy

| Layer | Tool | Coverage Target |
|---|---|---|
| **Unit Tests** | Vitest | Animation engine, DSL parser, execution engine, data models — 90% |
| **Component Tests** | Vitest + Testing Library | UI components, inspector panels — 85% |
| **Integration Tests** | Vitest | Store ↔ engine ↔ renderer pipeline — 80% |
| **E2E Tests** | Playwright | Critical user flows (create project, add elements, play animation, export) — all happy paths |
| **Visual Regression** | Playwright screenshots | Canvas rendering consistency across browsers |
| **Performance Tests** | Lighthouse CI + custom benchmarks | FPS, TTI, bundle size budgets enforced in CI |

---

## 13. Deployment & Infrastructure

- **Hosting:** Vercel (Next.js 16 optimized, edge functions, ISR, Turbopack, preview deployments)
- **Database:** Supabase PostgreSQL (managed, PostgREST v14, RLS, real-time subscriptions)
- **Auth:** Supabase Auth via `@supabase/ssr` (OAuth, magic link, email/password, cookie-based SSR sessions)
- **File Storage:** Supabase Storage (resumable TUS uploads, Smart CDN, image transforms, signed URLs for sharing)
- **CDN:** Vercel Edge Network (static assets) + Supabase Smart CDN (user uploads, exported videos)
- **CI/CD:** GitHub Actions → lint (Biome 2.3) → test (Vitest 4.x + Playwright 1.58) → build → deploy (Vercel)
- **Error Tracking:** Sentry (via Vercel Marketplace — error tracking, performance tracing, session replay)
- **Analytics:** Vercel Web Analytics (traffic) + Vercel Speed Insights (Core Web Vitals / RUM)
- **Feature Flags:** Vercel Flags SDK (flags as code, Toolbar integration, phased rollouts)

---

## 14. Project Phases

### Phase 1 — Foundation (Weeks 1–4)

- Next.js 16 project scaffold with App Router, Tailwind CSS 4.1, shadcn/ui, Biome 2.3, pnpm 10
- Pixi.js 8.16+ canvas workspace with imperative SceneManager, pan, zoom, grid, element rendering
- Basic primitives: node, edge, rect, text, arrow
- Zustand 5.x stores for scene, UI, project state (using Record<> not Map<> for serialization)
- Save/load to IndexedDB via Dexie.js 4.3
- Dark mode UI shell with toolbar, panels, command palette
- Sentry + Vercel Analytics integration from day one

### Phase 2 — Data Structure Composites (Weeks 5–8)

- Array, Linked List, Stack, Queue, Binary Tree, Graph composites
- Built-in animation presets for each composite
- GSAP timeline integration with playback controls
- Timeline UI with scrubber, keyframe display, markers
- Inspector panel with property editing
- Template library with 10 starter templates

### Phase 3 — Code Editor & Execution (Weeks 9–12)

- Monaco Editor 0.55+ integration with language support (lazy-loaded via `next/dynamic`)
- Web Worker-based execution engine (sandboxed, no eval)
- Line-by-line code highlighting synced to animations
- Variable watch panel and call stack display
- Breakpoint support
- 5 additional algorithm templates with code sync

### Phase 4 — Architecture & Advanced (Weeks 13–16)

- CPU datapath, pipeline, cache, memory hierarchy composites
- Architecture animation presets
- DSL parser and editor (Peggy.js 5.x)
- Auto-layout engine (ELK.js, force-directed)
- Advanced tree composites (AVL, Red-Black, Heap, Trie)
- Math composites (coordinate plane, matrix, vectors)

### Phase 5 — Export & Polish (Weeks 17–20)

- FFmpeg.wasm 0.12+ video export (MP4, WebM) — lazy-loaded
- GIF export (modern-gif 2.x), PNG sequence, SVG snapshot
- Interactive HTML embed export
- Supabase Auth (`@supabase/ssr`) + cloud sync + Storage (resumable TUS uploads, signed URLs)
- Public sharing and embed player
- Vercel Flags SDK for feature gating
- Performance optimization pass
- Accessibility audit and fixes
- 20 additional templates across all categories

---

## 15. Expert Review Notes

### 15.1 Data Structures & Algorithms Veteran Review

> **Reviewer: Senior DSA Engineer (15+ years competitive programming & teaching)**

- The composite element library covers all essential data structures but should also include **B-Trees** and **B+ Trees** (critical for database index explanations), **Bloom Filters**, and **LRU Cache** as a standalone visualization (not just inside cache hierarchy).
- Algorithm templates should support **custom input specification** — users need to type their own arrays, graphs (adjacency list or edge list), and trees (serialized format). A "Random Input" button with configurable size/range is essential.
- Step complexity counters are missing. Each animation step should display a running counter of comparisons, swaps, and memory accesses. This is critical for teaching Big-O intuition. **Add a metrics overlay** showing: current step count, total comparisons, total swaps, time complexity class.
- The DSL needs a `parallel` block for animations that should run concurrently (e.g., highlighting multiple graph nodes in BFS simultaneously).
- Consider adding **algorithm race mode**: run two sorting algorithms side-by-side on the same input to visually compare performance. This is the single most requested feature in CS education tools.

**Incorporated:** All above feedback has been integrated into sections 6.3, 6.6, and a new metrics overlay requirement is added below.

### 15.2 UI/UX Designer Review (20 Years Experience)

> **Reviewer: Principal Product Designer, EdTech & Creative Tools**

- The layout follows established creative tool conventions (Figma, Rive, After Effects) which is correct for this audience — do not reinvent panel layouts.
- **Onboarding is critical.** First-time users must see a guided tutorial that walks them through creating a simple array sort animation in under 2 minutes. Use a coach-mark / spotlight overlay pattern, not a video.
- The element library should use **drag-and-drop** from the left panel onto the canvas, with a ghost preview showing where the element will land. Include hover-previews with a short animation loop showing what the element looks like in action.
- **Color system must be semantic**, not arbitrary. Use consistent colors across the entire app: green = completed/sorted, yellow = comparing, red = error/conflict, blue = current/active, gray = unvisited. These should be themeable but have strong defaults.
- The timeline needs a **mini-preview mode**: hovering over any point in the timeline shows a thumbnail of the canvas at that moment (like YouTube's video scrubbing).
- Export dialog should show a **live preview** of the output at the selected resolution and format before encoding begins.
- Add **undo history panel** (not just Ctrl+Z) showing a list of past actions with descriptions, allowing users to jump back to any state. Similar to Photoshop's history panel.
- Keyboard shortcuts should be discoverable via the command palette, not just documented. Each command should show its shortcut inline.

**Incorporated:** Onboarding, drag-and-drop, semantic colors, timeline preview, and undo history panel are added to requirements.

### 15.3 Computer Architect Review

> **Reviewer: CPU Design Engineer, 12 years at ARM/Intel**

- The pipeline visualization must support **configurable pipeline depth** (3-stage, 5-stage, 7-stage, superscalar) — don't hardcode 5-stage MIPS.
- Add **out-of-order execution** visualization with reservation stations, reorder buffer, and register renaming. This is essential for modern architecture courses.
- Cache visualization needs to support **set-associative configurations** (direct-mapped, 2-way, 4-way, 8-way, fully-associative) with configurable line size and total size. Show the actual index/tag/offset bit breakdown.
- Memory hierarchy should include **NUMA** awareness for multi-core visualizations.
- Add **instruction encoding** breakdown: show how an instruction (e.g., `ADD R1, R2, R3`) maps to binary fields (opcode, rs, rt, rd, shamt, funct for MIPS; or variable-length for x86).
- Bus architecture should support **pipelined bus** and **split-transaction bus** modes.
- Add a **clock cycle counter** and **CPI calculator** that updates in real-time as instructions flow through the pipeline.

**Incorporated:** Pipeline configurability, OoO execution, cache associativity configuration, and clock cycle metrics added.

### 15.4 Performance Engineer Review

> **Reviewer: Staff Engineer, Web Performance**

- FFmpeg.wasm is heavy (~25MB). It **must** be loaded on demand only when the user clicks "Export to Video." Use `next/dynamic` with a loading skeleton.
- Monaco Editor is also heavy (~5MB). Lazy-load it and show a simple `<textarea>` placeholder during load.
- Pixi.js 8.16+ WebGPU renderer is optimal but **must fall back to WebGL2 → Canvas2D** gracefully on older browsers. Pixi.js 8.16 includes an experimental Canvas2D renderer for environments without GPU context. Test on Safari 17+ which has partial WebGPU.
- Object pooling for Pixi.js sprites is non-negotiable for any scene with >100 elements. Reuse sprites instead of creating/destroying.
- The animation engine should use **GSAP's ticker** instead of `requestAnimationFrame` directly to ensure consistent timing with the timeline.
- State updates during animation playback should be batched — don't trigger React re-renders for every tweened property. Use GSAP's direct DOM/Pixi manipulation with React only for UI chrome updates.

**Incorporated:** All lazy-loading, fallback, and batching strategies are reflected in Section 10.

### 15.5 Accessibility Specialist Review

> **Reviewer: WCAG Consultant**

- Canvas-based content is inherently inaccessible to screen readers. The application **must** maintain a parallel DOM representation of the scene graph with ARIA attributes for screen reader users.
- Add **audio narration mode**: auto-generate text descriptions of each animation step and use the Web Speech API to narrate. "Step 3: Comparing element 5 at index 2 with element 3 at index 3. Element 5 is greater, so they will be swapped."
- Reduced motion mode must not just skip animations — it should **show before/after states side-by-side** so the user still understands what changed.
- Color should never be the only indicator of state. Add shapes, icons, or patterns alongside color coding (e.g., a checkmark icon on sorted elements, not just green fill).

**Incorporated:** Parallel DOM, audio narration, enhanced reduced motion, and multi-signal state indication added to Section 11.

---

## 16. Additional Requirements from Reviews

### 16.1 Metrics Overlay

A toggleable overlay on the canvas showing real-time algorithm metrics:

- **Step counter:** Current step / Total steps
- **Comparisons:** Running count of element comparisons
- **Swaps / Mutations:** Running count of array modifications
- **Memory accesses:** Read and write counts
- **Time complexity class:** Displayed as Big-O notation based on the algorithm
- **Space complexity:** Current auxiliary space usage

### 16.2 Algorithm Race Mode

Split the canvas into two (or more) panes, each running a different algorithm on the same input simultaneously. Includes:

- Synchronized start with countdown
- Independent speed controls per pane
- Side-by-side metrics comparison
- "Winner" announcement when one completes first
- Shared input editor with "Randomize" button

### 16.3 Onboarding Flow

- **First launch:** Interactive tutorial creating a bubble sort animation (5 guided steps)
- **Template quick-start:** "Start from template" prominently featured on dashboard
- **Contextual tooltips:** Show tip bubbles when user hovers over unfamiliar UI areas for >2s
- **Video walkthrough:** Link to a 3-minute overview video (not blocking, always skippable)

### 16.4 Semantic Color System

```typescript
const semanticColors = {
  active:     '#3B82F6',  // blue-500 — currently being processed
  comparing:  '#F59E0B',  // amber-500 — being compared
  swapping:   '#8B5CF6',  // violet-500 — being swapped/moved
  sorted:     '#10B981',  // emerald-500 — confirmed in final position
  error:      '#EF4444',  // red-500 — conflict, error, mismatch
  visited:    '#6B7280',  // gray-500 — already processed
  unvisited:  '#E5E7EB',  // gray-200 — not yet touched
  highlight:  '#FFD700',  // gold — user-selected attention
  path:       '#06B6D4',  // cyan-500 — shortest path, traversal path
  pivot:      '#EC4899',  // pink-500 — partition pivot, root
} as const;
```

Colors are user-overridable in project settings and always paired with secondary indicators (icons, patterns, borders).

### 16.5 Undo History Panel

A scrollable list panel (accessible via `Ctrl+H`) showing:

- Chronological list of all actions with human-readable descriptions
- Timestamp for each action
- Click to jump to any historical state (non-destructive branching)
- "Snapshot" button to save named checkpoints
- Actions grouped by user gesture (e.g., drag-move groups all intermediate positions into one entry)

---

## 17. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| **Browser Support** | Chrome 120+, Firefox 120+, Safari 17+, Edge 120+ |
| **Offline Support** | Full editor functionality offline via service worker; cloud sync when reconnected |
| **Responsiveness** | Minimum viewport: 1280×720. Not designed for mobile (show "use desktop" message <1024px) |
| **Localization** | English-only for v1.0. Architecture supports i18n via `next-intl` |
| **Security** | CSP headers, input sanitization on DSL parser, sandboxed code execution (no `eval`, no `Function()`) |
| **Data Privacy** | All projects private by default. Public sharing is explicit opt-in. No analytics on project content. |
| **License** | MIT for open-source core. Premium templates may be commercial. |

---

## 18. Success Metrics

| Metric | Target (6 months post-launch) |
|---|---|
| Monthly Active Users | 5,000 |
| Projects Created | 20,000 |
| Templates Used | 50% of new projects start from a template |
| Export Completions | 10,000 videos/GIFs exported |
| Average Session Duration | > 15 minutes |
| Net Promoter Score | > 50 |

---

## 19. Open Questions

1. **Collaboration:** Should v1.0 support real-time multiplayer editing (CRDT-based)? Recommendation: defer to v2.0 to reduce scope.
2. **AI Integration:** Should users be able to describe an animation in natural language and have it generated? Recommendation: add as Phase 6 feature using Claude API.
3. **Mobile viewer:** Should the embed player work on mobile even if the editor doesn't? Recommendation: yes, embed player should be responsive.
4. **Marketplace:** Should users be able to publish and sell templates? Recommendation: defer to v2.0.
5. **Audio sync:** Should the timeline support audio track sync for voiceover? Recommendation: add in Phase 5 as an optional feature.

---

*Document Version: 1.0*
*Last Updated: February 11, 2026*
*Author: Sean — AlgoMotion Project*
*Reviewers: DSA Veteran, Principal UX Designer, CPU Architect, Performance Engineer, Accessibility Specialist*