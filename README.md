# Classroom Teaching Assistant (Classroom TA)

> **Generic, Web-Based Interactive Teaching Assistant for Live In-Person Computer Science Instruction**

**Classroom TA** provides an integrated lecture experience combining live code compilation and execution in pure C, mathematical typesetting with KaTeX, VisuAlgo-style animated data structures with custom parameters, non-destructive screen drawing, and instant scratchpad whiteboard derivations.

---

## Flagship Lesson: AVL Trees & Rotations (Built with TDD)

This repository includes a complete reference lesson on **AVL Trees**, featuring:
1. **Pure C AVL Engine (`avl_tree.h`, `avl_tree.c`)**: Built and verified using **Test-Driven Development (TDD)** with 311 passing assertions.
2. **Parameterized Tree Generation by Height ($h$)**: Define target height $h$ to instantly generate minimal Fibonacci AVL trees (demonstrating worst-case height $h < 1.44 \log_2(n+2)$) or complete balanced trees.
3. **VisuAlgo-Style Animation**: Step forward, step backward, scrub through insertions and deletions with real-time balance factor badges ($BF = h_L - h_R$), height counters, and rotation alerts (LL, RR, LR, RL).
4. **Transparent Drawing Overlay & Whiteboard**: Annotate directly on top of slides or toggle a full-screen scratchpad with a single hotkey.
5. **Interactive C Code & Demo Runner**: Review source files and run GCC builds directly in the browser or terminal.

---

## Quick Start

### 1. Launch the Web Platform
```bash
cd c:\projects\ta
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Run Test Suites (TDD Verification)

#### C AVL Test Suite (311 Assertions)
```bash
cd c:\projects\ta\lessons\01-avl-trees\code
gcc -Wall -Wextra test_avl.c avl_tree.c -o test_avl.exe
.\test_avl.exe
```

#### TypeScript Animation Engine Tests (Vitest)
```bash
cd c:\projects\ta
npm test
```

### 3. Run the Interactive C Demo (Command Line)
```bash
cd c:\projects\ta\lessons\01-avl-trees\code
gcc -Wall -Wextra demo_main.c avl_tree.c -o demo.exe
.\demo.exe 3   # Parameterized: generates tree of height 3
```

---

## In-Class Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>D</kbd> | **Toggle Screen Pen / Drawing Overlay** (draw directly on top of slides, trees, and code) |
| <kbd>W</kbd> | **Toggle Classroom Whiteboard** (full-screen scratchpad for math derivations) |
| <kbd>Esc</kbd> | Close active drawing tool or whiteboard |
| <kbd>→</kbd> / <kbd>←</kbd> | Next / Previous slide |
| <kbd>Space</kbd> | Play / Pause VisuAlgo animation |
| <kbd>1</kbd> | Switch to **Slide Deck View** |
| <kbd>2</kbd> | Switch to **VisuAlgo Lab View** |
| <kbd>3</kbd> | Switch to **C Source & Runner View** |

---

## Project Structure

```text
c:\projects\ta/
├── index.html                           # Application entrypoint with KaTeX & fonts
├── package.json                         # Scripts and dependencies
├── vite.config.ts                       # Vite configuration
├── lessons/
│   └── 01-avl-trees/
│       ├── lesson.json                  # Lesson metadata
│       └── code/
│           ├── avl_tree.h               # C AVL tree header
│           ├── avl_tree.c               # C AVL tree implementation
│           ├── test_avl.c               # TDD test suite (311 assertions)
│           ├── demo_main.c              # Parameterized CLI demo
│           └── Makefile                 # Build rules
├── src/
│   ├── branding/
│   │   └── BrandHeader.tsx              # Classroom TA brand header & switcher
│   ├── engine/
│   │   └── avl/                         # TypeScript animation state-machine
│   │       ├── types.ts                 # Node state, steps, and parameters
│   │       ├── avl-generator.ts         # Step generator & SVG layout engine
│   │       └── __tests__/
│   │           └── avl-engine.test.ts   # Vitest TDD test suite
│   ├── components/
│   │   ├── slides/
│   │   │   ├── SlideDeck.tsx            # Slide presentation with KaTeX math
│   │   │   └── KaTeXMath.tsx            # KaTeX LaTeX renderer
│   │   ├── visualizer/
│   │   │   ├── AVLTreeVisualizer.tsx    # VisuAlgo-style interactive SVG visualizer
│   │   │   └── PlaybackControls.tsx     # Step scrubber and playback buttons
│   │   ├── drawing/
│   │   │   ├── DrawingCanvasOverlay.tsx # Non-destructive HUD pen overlay
│   │   │   └── WhiteboardModal.tsx      # Quick-toggle scratchpad whiteboard
│   │   └── editor/
│   │       └── MonacoRunner.tsx         # Code viewer and runner
│   ├── App.tsx                          # Main application router & keybindings
│   └── main.tsx
```
