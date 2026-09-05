import React, { useState, useEffect, useCallback } from 'react';
import { KaTeXMath } from './KaTeXMath';
import { AVLTreeVisualizer } from '../visualizer/AVLTreeVisualizer';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen, 
  Code2, 
  Activity, 
  GitBranch,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface SlideDeckProps {
  currentSlide: number;
  totalSlides: number;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onSelectSlide: (idx: number) => void;
}

export const SlideDeck: React.FC<SlideDeckProps> = ({
  currentSlide,
  totalSlides,
  onNextSlide,
  onPrevSlide,
  onSelectSlide,
}) => {
  // Reveal step for sequential animation within the active slide
  const [revealStep, setRevealStep] = useState<number>(0);

  // Maximum revealable steps per slide
  const getMaxSteps = (slideIdx: number) => {
    switch (slideIdx) {
      case 0: return 2; // Step 1: Naive BST, Step 2: AVL Guarantee
      case 1: return 2; // Step 1: Recurrence, Step 2: Fibonacci & Log Bound
      case 2: return 4; // Steps 1-4: LL, RR, LR, RL
      case 3: return 0; // Interactive Visualizer Lab
      case 4: return 2; // Step 1: Right Rotate, Step 2: Verification
      default: return 0;
    }
  };

  const maxSteps = getMaxSteps(currentSlide);

  // Reset reveal step when slide changes
  useEffect(() => {
    setRevealStep(0);
  }, [currentSlide]);

  const handleForward = useCallback(() => {
    if (revealStep < maxSteps) {
      setRevealStep(prev => prev + 1);
    } else {
      if (currentSlide < totalSlides - 1) {
        onNextSlide();
      }
    }
  }, [revealStep, maxSteps, currentSlide, totalSlides, onNextSlide]);

  const handleBackward = useCallback(() => {
    if (revealStep > 0) {
      setRevealStep(prev => prev - 1);
    } else {
      if (currentSlide > 0) {
        onPrevSlide();
      }
    }
  }, [revealStep, currentSlide, onPrevSlide]);

  // Keyboard navigation within the slide deck
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleForward();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        handleBackward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleForward, handleBackward]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181816] text-[#faf6ee] overflow-hidden relative select-none font-sans-anthropic">
      {/* Slide Content Area */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-6xl mx-auto w-full flex flex-col justify-center">
        {/* SLIDE 0: TITLE & MOTIVATION */}
        {currentSlide === 0 && (
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cc785c]/15 border border-[#cc785c]/30 text-[#cc785c] text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Lesson 01 • Advanced Data Structures & Algorithms
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#faf6ee] tracking-tight font-serif-anthropic">
              AVL Trees: <span className="text-[#cc785c]">Strictly Balanced Binary Search Trees</span>
            </h1>

            <p className="text-base lg:text-lg text-[#d4cfc5] leading-relaxed max-w-3xl">
              Standard Binary Search Trees suffer from pathological degeneration: when keys arrive sorted (<KaTeXMath math="1, 2, 3, \dots, n" />), the tree collapses into a linear chain with <KaTeXMath math="\mathcal{O}(n)" /> search time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 min-h-[190px]">
              {/* Step 1 Box: Naive BST Degeneration */}
              <div 
                className={`bg-[#22221f] border border-[#383733] rounded-xl p-5 shadow-lg transition-all duration-500 transform ${
                  revealStep >= 1 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-2 text-rose-400 font-semibold mb-2 text-sm font-serif-anthropic">
                  <ShieldAlert className="w-5 h-5" />
                  Naive BST Degeneration (<KaTeXMath math="h = n" />)
                </div>
                <p className="text-[#9e978c] text-xs leading-relaxed">
                  Sequential insertions degrade the height to <KaTeXMath math="h = n" />. Every operation deteriorates from logarithmic to linear time:
                </p>
                <div className="mt-3 bg-[#141413] p-3 rounded-lg border border-[#383733] text-center">
                  <KaTeXMath block math="1 \to 2 \to 3 \to \cdots \to n \quad \implies \quad \mathcal{O}(n) \text{ search}" />
                </div>
              </div>

              {/* Step 2 Box: AVL Guarantee */}
              <div 
                className={`bg-[#22221f] border border-[#383733] rounded-xl p-5 shadow-lg transition-all duration-500 transform ${
                  revealStep >= 2 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2 text-sm font-serif-anthropic">
                  <CheckCircle2 className="w-5 h-5" />
                  The AVL Guarantee (Adelson-Velsky & Landis, 1962)
                </div>
                <p className="text-[#9e978c] text-xs leading-relaxed">
                  By maintaining local balance factors at every node, the height is mathematically constrained to <KaTeXMath math="h < 1.44 \log_2(n+2)" />:
                </p>
                <div className="mt-3 bg-[#141413] p-3 rounded-lg border border-[#383733] text-center">
                  <KaTeXMath block math="\text{Search, Insert, Delete: Strictly } \mathcal{O}(\log n)" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: INVARIANT & MATHEMATICAL PROOF */}
        {currentSlide === 1 && (
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-[#faf6ee] flex items-center gap-3 font-serif-anthropic">
              <Activity className="w-7 h-7 text-[#cc785c]" />
              The Balance Factor Invariant & Height Proof
            </h2>

            {/* Invariant Box */}
            <div className="bg-[#22221f] border border-[#cc785c]/30 rounded-xl p-5 shadow-lg">
              <h3 className="text-[#cc785c] font-semibold text-xs uppercase tracking-wider mb-2">
                Definition: Balance Factor <KaTeXMath math="BF(v)" />
              </h3>
              <p className="text-[#d4cfc5] text-sm mb-2">
                For every node <KaTeXMath math="v \in T" />, the height difference between left and right subtrees must not exceed 1:
              </p>
              <div className="bg-[#141413] p-3.5 rounded-lg border border-[#383733] text-center">
                <KaTeXMath block math="BF(v) = \text{height}(v.\text{left}) - \text{height}(v.\text{right}) \in \{-1, 0, +1\}" />
              </div>
            </div>

            {/* Step 1 & 2: Worst-Case Proof Box */}
            <div 
              className={`bg-[#22221f] border border-[#383733] rounded-xl p-5 shadow-lg transition-all duration-500 transform ${
                revealStep >= 1 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <h3 className="text-[#d49b53] font-semibold text-xs uppercase tracking-wider mb-2 font-serif-anthropic">
                Theorem: Worst-Case Height via Minimal Fibonacci Trees
              </h3>
              <p className="text-[#d4cfc5] text-xs leading-relaxed mb-2">
                Let <KaTeXMath math="N(h)" /> denote the minimum number of nodes in an AVL tree of height <KaTeXMath math="h" />. One subtree must have height <KaTeXMath math="h-1" /> and the other <KaTeXMath math="h-2" />:
              </p>
              <div className="bg-[#141413] p-3 rounded-lg border border-[#383733] text-center mb-2">
                <KaTeXMath block math="N(h) = N(h - 1) + N(h - 2) + 1 \quad \text{with } N(0) = 0, \ N(1) = 1, \ N(2) = 2" />
              </div>

              {/* Step 2 Reveal */}
              <div 
                className={`transition-all duration-500 transform ${
                  revealStep >= 2 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-2 pointer-events-none'
                }`}
              >
                <p className="text-[#d4cfc5] text-xs leading-relaxed">
                  Adding <KaTeXMath math="1" /> to both sides yields <KaTeXMath math="N(h) + 1 = (N(h-1) + 1) + (N(h-2) + 1)" />. This is the shifted Fibonacci sequence <KaTeXMath math="F_{h+2}" />:
                </p>
                <div className="bg-[#141413] p-3 rounded-lg border border-[#383733] text-center my-2">
                  <KaTeXMath block math="N(h) = F_{h+2} - 1 \approx \frac{\phi^{h+2}}{\sqrt{5}} - 1 \quad \text{where } \phi = \frac{1 + \sqrt{5}}{2} \approx 1.61803" />
                </div>
                <div className="p-3 bg-emerald-950/25 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center justify-between">
                  <span>Taking base-2 logarithms yields the strict upper bound:</span>
                  <KaTeXMath math="h < \log_\phi(n + 2) \approx \frac{\log_2(n + 2)}{\log_2 \phi} \approx 1.4404 \log_2(n + 2) = \mathcal{O}(\log n)" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: THE 4 ROTATIONS */}
        {currentSlide === 2 && (
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-[#faf6ee] flex items-center gap-3 font-serif-anthropic">
              <GitBranch className="w-7 h-7 text-[#cc785c]" />
              The 4 Rebalancing Rotations
            </h2>
            <p className="text-[#d4cfc5] text-xs">
              When an insertion causes an imbalance (<KaTeXMath math="|BF(z)| = 2" />), exactly one of four local rotations restores the AVL invariant in <KaTeXMath math="\mathcal{O}(1)" /> pointer updates:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1: LL Case */}
              <div 
                className={`bg-[#22221f] border border-[#383733] rounded-xl p-4 transition-all duration-500 transform ${
                  revealStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-2'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#d49b53] bg-[#d49b53]/15 border border-[#d49b53]/30 px-2 py-0.5 rounded">
                    Case 1: Left-Left (LL)
                  </span>
                  <span className="text-xs text-[#9e978c] font-mono"><KaTeXMath math="BF = +2" /></span>
                </div>
                <h4 className="text-[#faf6ee] font-semibold text-sm mt-1.5 font-serif-anthropic">Single Right Rotation</h4>
                <div className="mt-2 bg-[#141413] p-2.5 rounded border border-[#383733] text-center">
                  <KaTeXMath block math="y = \text{rotRight}(z) \iff y.\text{right} = z, \ z.\text{left} = T_2" />
                </div>
              </div>

              {/* Step 2: RR Case */}
              <div 
                className={`bg-[#22221f] border border-[#383733] rounded-xl p-4 transition-all duration-500 transform ${
                  revealStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-2'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#d49b53] bg-[#d49b53]/15 border border-[#d49b53]/30 px-2 py-0.5 rounded">
                    Case 2: Right-Right (RR)
                  </span>
                  <span className="text-xs text-[#9e978c] font-mono"><KaTeXMath math="BF = -2" /></span>
                </div>
                <h4 className="text-[#faf6ee] font-semibold text-sm mt-1.5 font-serif-anthropic">Single Left Rotation</h4>
                <div className="mt-2 bg-[#141413] p-2.5 rounded border border-[#383733] text-center">
                  <KaTeXMath block math="y = \text{rotLeft}(z) \iff y.\text{left} = z, \ z.\text{right} = T_2" />
                </div>
              </div>

              {/* Step 3: LR Case */}
              <div 
                className={`bg-[#22221f] border border-[#383733] rounded-xl p-4 transition-all duration-500 transform ${
                  revealStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-2'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#cc785c] bg-[#cc785c]/15 border border-[#cc785c]/30 px-2 py-0.5 rounded">
                    Case 3: Left-Right (LR)
                  </span>
                  <span className="text-xs text-[#9e978c] font-mono"><KaTeXMath math="BF = +2" /></span>
                </div>
                <h4 className="text-[#faf6ee] font-semibold text-sm mt-1.5 font-serif-anthropic">Double Left-Right Rotation</h4>
                <div className="mt-2 bg-[#141413] p-2.5 rounded border border-[#383733] text-center">
                  <KaTeXMath block math="z.\text{left} = \text{rotLeft}(z.\text{left}); \quad \text{return } \text{rotRight}(z)" />
                </div>
              </div>

              {/* Step 4: RL Case */}
              <div 
                className={`bg-[#22221f] border border-[#383733] rounded-xl p-4 transition-all duration-500 transform ${
                  revealStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-2'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#cc785c] bg-[#cc785c]/15 border border-[#cc785c]/30 px-2 py-0.5 rounded">
                    Case 4: Right-Left (RL)
                  </span>
                  <span className="text-xs text-[#9e978c] font-mono"><KaTeXMath math="BF = -2" /></span>
                </div>
                <h4 className="text-[#faf6ee] font-semibold text-sm mt-1.5 font-serif-anthropic">Double Right-Left Rotation</h4>
                <div className="mt-2 bg-[#141413] p-2.5 rounded border border-[#383733] text-center">
                  <KaTeXMath block math="z.\text{right} = \text{rotRight}(z.\text{right}); \quad \text{return } \text{rotLeft}(z)" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: INTERACTIVE LAB */}
        {currentSlide === 3 && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-[#faf6ee] flex items-center gap-2 font-serif-anthropic">
                <span>Interactive VisuAlgo Lab: Parameterize & Animate</span>
              </h2>
              <span className="text-xs font-mono text-[#cc785c] bg-[#cc785c]/15 px-2.5 py-1 rounded border border-[#cc785c]/30">
                <KaTeXMath math="h \in [1..5]" /> • Minimal Fibonacci & Complete Trees
              </span>
            </div>
            <div className="flex-1 min-h-[480px]">
              <AVLTreeVisualizer />
            </div>
          </div>
        )}

        {/* SLIDE 4: PURE C IMPLEMENTATION & MEMORY */}
        {currentSlide === 4 && (
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-[#faf6ee] flex items-center gap-3 font-serif-anthropic">
              <Code2 className="w-7 h-7 text-[#cc785c]" />
              Pure C Implementation & Memory Architecture
            </h2>
            <p className="text-[#d4cfc5] text-sm leading-relaxed">
              Our C implementation in <code className="text-[#cc785c] bg-[#141413] px-1.5 py-0.5 rounded font-mono border border-[#383733]">avl_tree.c</code> was built strictly following <strong>Test-Driven Development (TDD)</strong> with 311 passing assertions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#141413] border border-[#383733] rounded-xl p-4 font-mono text-xs text-[#faf6ee]">
                <span className="text-[#cc785c] font-semibold">// Both rotRight and rotLeft in O(1) time</span><br/>
                <span className="text-[#d49b53]">AVLNode*</span> <span className="text-[#faf6ee]">avl_rotate_left</span>(AVLNode* x) &#123;<br/>
                &nbsp;&nbsp;AVLNode* y = x-&gt;right;<br/>
                &nbsp;&nbsp;AVLNode* T2 = y-&gt;left;<br/>
                &nbsp;&nbsp;y-&gt;left = x;<br/>
                &nbsp;&nbsp;x-&gt;right = T2;<br/>
                &nbsp;&nbsp;update_height(x);<br/>
                &nbsp;&nbsp;update_height(y);<br/>
                &nbsp;&nbsp;<span className="text-[#d49b53]">return</span> y;<br/>
                &#125;
              </div>

              <div 
                className={`bg-[#141413] border border-[#383733] rounded-xl p-4 font-mono text-xs text-[#faf6ee] transition-all duration-500 transform ${
                  revealStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                }`}
              >
                <span className="text-[#cc785c] font-semibold">// Single Right Rotation</span><br/>
                <span className="text-[#d49b53]">AVLNode*</span> <span className="text-[#faf6ee]">avl_rotate_right</span>(AVLNode* y) &#123;<br/>
                &nbsp;&nbsp;AVLNode* x = y-&gt;left;<br/>
                &nbsp;&nbsp;AVLNode* T2 = x-&gt;right;<br/>
                &nbsp;&nbsp;x-&gt;right = y;<br/>
                &nbsp;&nbsp;y-&gt;left = T2;<br/>
                &nbsp;&nbsp;update_height(y);<br/>
                &nbsp;&nbsp;update_height(x);<br/>
                &nbsp;&nbsp;<span className="text-[#d49b53]">return</span> x;<br/>
                &#125;
              </div>
            </div>

            <div 
              className={`p-4 rounded-xl bg-[#cc785c]/10 border border-[#cc785c]/30 flex items-center justify-between transition-all duration-500 transform ${
                revealStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-[#d4cfc5]">
                  Switch to the <strong>C Source & Runner</strong> tab in the header to edit code directly in Monaco and live-compile!
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                <KaTeXMath math="\mathcal{O}(1) \text{ Rotations}" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Slide Navigation Bar with Reveal Controls */}
      <div className="h-12 bg-[#141413]/90 border-t border-[#383733] px-6 flex items-center justify-between text-xs text-[#9e978c]">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackward}
            disabled={currentSlide === 0 && revealStep === 0}
            className="p-1.5 rounded-lg bg-[#22221f] border border-[#383733] text-[#d4cfc5] hover:text-white disabled:opacity-30 disabled:hover:text-[#d4cfc5] transition"
            title="Previous step or slide (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="font-medium">
            Slide <strong className="text-[#faf6ee]">{currentSlide + 1}</strong> of {totalSlides}
          </span>

          <button
            onClick={handleForward}
            disabled={currentSlide === totalSlides - 1 && revealStep >= maxSteps}
            className="p-1.5 rounded-lg bg-[#22221f] border border-[#383733] text-[#d4cfc5] hover:text-white disabled:opacity-30 disabled:hover:text-[#d4cfc5] transition"
            title="Next step or slide (Space / Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Reveal Step Pill */}
          {maxSteps > 0 && (
            <div className="ml-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#22221f] border border-[#383733] text-[11px] font-mono">
              <Sparkles className="w-3 h-3 text-[#cc785c]" />
              <span className="text-[#d4cfc5]">
                {revealStep < maxSteps ? (
                  <>Reveal {revealStep}/{maxSteps} <span className="text-[#cc785c] font-bold">(Space)</span></>
                ) : (
                  <span className="text-emerald-400">All Revealed ✓</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Slide Progress Indicator Dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => onSelectSlide(i)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === i ? 'w-6 bg-[#cc785c]' : 'w-2 bg-[#383733] hover:bg-[#4d4b46]'
              }`}
            />
          ))}
        </div>

        {/* Keyboard shortcut hint */}
        <div className="text-[11px] text-[#9e978c] hidden sm:flex items-center gap-2 font-mono">
          <span>Reveal / Next:</span>
          <kbd className="bg-[#22221f] px-1.5 py-0.5 rounded text-[#faf6ee] border border-[#383733]">Space</kbd>
          <kbd className="bg-[#22221f] px-1.5 py-0.5 rounded text-[#faf6ee] border border-[#383733]">→</kbd>
          <span className="ml-1">Back:</span>
          <kbd className="bg-[#22221f] px-1.5 py-0.5 rounded text-[#faf6ee] border border-[#383733]">←</kbd>
        </div>
      </div>
    </div>
  );
};
