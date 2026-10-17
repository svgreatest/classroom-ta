# Classroom Teaching Assistant (Classroom TA)

> **Web-Based Interactive Teaching Assistant & Slidev Presentation Platform for Live In-Person Computer Science Instruction**

**Classroom TA** provides an integrated lecture and lab experience combining live C code compilation, GDB execution tracing, mathematical typesetting with KaTeX, VisuAlgo-style animated data structures, non-destructive screen annotation, instant whiteboard scratchpad, and a Slidev presentation engine with native live-editing capabilities.

---

## Key Features

1. **Integrated Slidev Presentation Engine**:
   - High-fidelity slides powered by Slidev and Shiki syntax highlighting.
   - Built-in countdown question timers and interactive multiple-choice concept checks (MCQs).
   - Seamless native Slidev editor access (`http://localhost:3030/`) with split-pane editing, slide overview, and instant Hot Module Replacement (HMR).
2. **Interactive Algorithm Visualizers (VisuAlgo Style)**:
   - **01: AVL Trees**: Step-by-step tree rebalancing, balance factors ($BF = h_L - h_R$), and minimal Fibonacci tree proofs.
   - **02: Hash Maps**: Real-time DJB2 hash computation, bucket chains, collision resolution, and load factor tracking ($\alpha \le 0.75$).
   - **03: Pointers & Stacks**: Visual pointer dereferencing, stack frame execution tracing, heap memory layout, and generic `void*` memory swaps.
3. **In-Class Presentation Tools**:
   - **Screen Drawing Pen Overlay (<kbd>D</kbd>)**: Non-destructive annotation directly over active slides, trees, and code.
   - **Whiteboard Scratchpad (<kbd>W</kbd>)**: Quick-toggle full-screen scratchpad for mathematical derivations.
4. **Automated Visual & Layout Test Suite**:
   - Automated screenshot capture of every slide and feature.
   - Zero-overflow assertion engine checking vertical and horizontal boundaries.
   - Self-contained visual HTML report generation (`test-artifacts/report.html`).

---

## Curriculum Lessons

| Lesson | Topic | Highlights |
| :--- | :--- | :--- |
| **`01-avl-trees`** | AVL Trees & Rotations | Fibonacci worst-case bounds, LL/RR/LR/RL rotations, 311 C TDD assertions |
| **`02-hashmaps`** | Hash Maps & Collisions | Pigeonhole principle, SUHA, separate chaining vs open addressing |
| **`03-pointers-and-stacks`** | Pointers to a Generic Stack | Memory diagrams, pointer arithmetic, `realloc` & dangling pointers, `void*`, IntStack → GenericStack, industry tour (stack traces, undo, `std::vector`) |
| **`04-shipping-a-feature`** | Shipping a Feature with GenericStack | Ticket → design → reuse → code → tests → code review → ship: browser Back/Forward built on lesson 03's GenericStack |

---

## Getting Started

### 1. Start the Full Application

Use the unified startup script to launch both the **Classroom TA Portal** (`http://localhost:3000`) and the **Slidev Engine** (`http://localhost:3030`):

```bash
npm start
```

*Alternatively, on Windows you can run:*
```cmd
start.bat
```
*or via PowerShell:*
```powershell
.\start.ps1
```

Once running:
- **Classroom Portal**: [http://localhost:3000](http://localhost:3000)
- **Slidev Native Editor**: [http://localhost:3030/](http://localhost:3030/)

---

## Testing & Quality Assurance

Classroom TA includes a multi-layered verification system: unit tests, TypeScript type checks, and an automated visual screenshot & overflow test suite.

### Run All Tests

To execute the complete test pipeline (Unit Tests + TypeScript Type Check + Automated Visual & Overflow Suite):

```bash
npm run test:all
```

### Visual & Overflow Test Suite

Run the automated Playwright-based screenshot test suite:

```bash
npm run test:overflow
# or
npm run test:visual
```

#### What the Visual Test Suite Does:
1. **Verifies Server Availability**: Automatically connects to running instances or spins up the engine in headless test mode.
2. **Discovers All Lessons**: Dynamically scans `lessons/` (`01-avl-trees`, `02-hashmaps`, `03-pointers-and-stacks`).
3. **Automated Slide-by-Slide Verification**:
   - Iterates through every slide across all decks (29+ slides total).
   - Measures slide layout bounding boxes.
   - Detects any **vertical overflow** (`bottom > slide.bottom`) or **horizontal overflow** (`right > slide.right`).
   - Captures high-resolution PNG screenshots of every slide to `test-artifacts/screenshots/{lessonId}/slide-{num}.png`.
4. **Verifies Portal Features**:
   - BrandHeader and slide navigation.
   - VisuAlgo Lab tab switching.
   - Monaco code editor and C runner tab.
   - Drawing HUD overlay (<kbd>D</kbd>).
   - Whiteboard modal (<kbd>W</kbd>).
5. **Generates Visual HTML Report**:
   - Builds `test-artifacts/report.html` containing an interactive visual gallery with pass/fail badges and clearance metrics for every slide.

### Unit Tests (Vitest)

To run only the unit tests:

```bash
npm test
```

### TypeScript Type Check

To check TypeScript types:

```bash
npx tsc --noEmit
```

---

## In-Class Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>1</kbd> | Switch to **Slide Deck View** |
| <kbd>2</kbd> | Switch to **VisuAlgo Lab View** |
| <kbd>3</kbd> | Switch to **C Source & Runner View** |
| <kbd>→</kbd> / <kbd>PageDown</kbd> | Next slide |
| <kbd>←</kbd> / <kbd>PageUp</kbd> | Previous slide |
| <kbd>D</kbd> | **Toggle Screen Pen / Drawing Overlay** |
| <kbd>W</kbd> | **Toggle Classroom Whiteboard** |
| <kbd>Esc</kbd> | Close active drawing canvas or whiteboard |

---

## Slidev Native Editor

Clicking **"Slidev Editor"** in the top navigation bar opens Slidev's native editor directly at `http://localhost:3030/` in a new tab.

Features:
- **Built-in Shiki Editor**: Edit Markdown directly with live preview and syntax coloring.
- **Presenter Mode**: Access speaker notes, timer, and upcoming slide previews at `http://localhost:3030/presenter/`.
- **Slide Overview**: View a grid overview of all slides at `http://localhost:3030/overview/`.
- **Instant HMR**: Any slide changes are immediately hot-reloaded into both Slidev and the Classroom TA iframe.

---

## Authoring Lessons

Every deck loads the shared component library and theme from `slidev/` as a local Slidev addon. Do not copy components into lesson folders:

```yaml
---
addons:
  - "@/../../slidev"
---
```

### Slide rules (learn by showing)
- One idea per slide, with **≤ 25 words of prose**. Put the details in presenter notes (`<!-- ... -->`).
- Every slide has a visual: a diagram component, a code reveal, a Tutor demo or an image.
- Close each concept with where it shows up in industry (`<InIndustry>`).

### Components (`slidev/components/`)
| Component | Use |
| :--- | :--- |
| `<MCQ>` | Large full-width question with 2×2 options. **Reveal answer** swaps the options for the explanation. Use the `label` prop for the header (e.g. `"Check 1 · LIFO"`). |
| `<StackViz :ops="['push 1','pop']" :step="$clicks" />` | Animated stack, one op per click. Grows (realloc) automatically when full. Set `clicks: N` in the slide frontmatter. |
| `<MemoryRow :cells="[...]" :step="$clicks" />` | Byte cells with addresses, variable names and pointer arrows (`pointsTo`), with `showAt`, `highlightAt` and `freed` per click. |
| `<BigIdea kicker="...">` | One-sentence takeaway in very large type. |
| `<InIndustry where="..." icon="...">` | A "where this is used at work" callout. |
| `<TutorLink example="id">` | Opens a C Memory Tutor demo. |

### Tutor demos without code changes
Put `.c` files in `lessons/<id>/tutor/`. The file stem becomes the example id (`<TutorLink example="int_stack">`). An optional first line `// Title: ...` names the demo, and files named `quiz_*` are listed under Understanding Checks. A lesson demo replaces a built-in preset with the same id.

---

## Project Structure

```text
├── lessons/                             # Curriculum lesson modules
│   ├── 01-avl-trees/                    # AVL trees, proofs, and rotations
│   │   ├── slides.md                    # Slidev slide deck
│   │   └── code/                        # C implementation & test suites
│   ├── 02-hashmaps/                     # Hash maps and collision resolution
│   │   ├── slides.md
│   │   └── code/
│   └── 03-pointers-and-stacks/          # Pointers, stack frames, and memory
│       ├── slides.md
│       └── code/
├── slidev/                              # Slidev presentation configuration
│   ├── components/                      # Custom Vue components (MCQ, Card, Timer)
│   ├── style.css                        # Slidev theme styles & typography
│   └── vite.config.ts                   # Slidev Vite bundler config
├── src/                                 # Classroom TA Portal React frontend
│   ├── App.tsx                          # Root application & keyboard navigation
│   ├── branding/                        # BrandHeader, lesson switcher
│   ├── components/                      # Embeds, Monaco runner, drawing canvas
│   └── engine/                          # Visualizer state machines & algorithms
├── server/                              # Node/Express API middleware & C runner
├── scripts/                             # Startup and utility scripts
│   └── start-app.mjs                    # Unified portal + Slidev launcher
├── tests/                               # Automated end-to-end test suite
│   └── visual-overflow.mjs              # Screenshot & zero-overflow test runner
└── test-artifacts/                      # Generated test screenshots & HTML report
```
