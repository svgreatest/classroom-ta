import React, { useState, useEffect, useCallback } from 'react';
import { KaTeXMath } from './KaTeXMath';
import { HashMapVisualizer } from '../visualizer/HashMapVisualizer';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen, 
  Code2, 
  Hash, 
  Layers, 
  Database,
  Sparkles,
  Timer
} from 'lucide-react';

import { ParsedSlide } from '../../engine/slides/markdown-parser';
import { MarkdownSlideViewer } from './MarkdownSlideViewer';
import { LessonId } from '../../branding/BrandHeader';

interface HashMapSlideDeckProps {
  currentSlide: number;
  totalSlides: number;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onSelectSlide: (idx: number) => void;
  slides?: ParsedSlide[];
  lessonId?: LessonId;
}

export const HashMapSlideDeck: React.FC<HashMapSlideDeckProps> = ({
  currentSlide,
  totalSlides,
  onNextSlide,
  onPrevSlide,
  onSelectSlide,
  slides,
  lessonId = '02-hashmaps',
}) => {
  const [revealStep, setRevealStep] = useState<number>(0);

  const getMaxSteps = (slideIdx: number) => {
    switch (slideIdx) {
      case 0: return 2; // Step 1: Direct Access, Step 2: Hash Map Solution
      case 1: return 2; // Step 1: SUHA/Load factor, Step 2: O(1) bound
      case 2: return 2; // Step 1: Separate Chaining, Step 2: Open Addressing
      case 3: return 0; // Interactive Visualizer Lab
      case 4: return 2; // Step 1: Rehash code, Step 2: Complexity badge
      default: return 0;
    }
  };

  const activeSlide = slides && slides.length > 0 ? (slides[currentSlide] || slides[0]) : null;
  const maxSteps = activeSlide ? (activeSlide.maxSteps ?? 0) : getMaxSteps(currentSlide);

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
      {/* Slide Body Container */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-6xl mx-auto w-full flex flex-col justify-center">
        {activeSlide ? (
          <MarkdownSlideViewer
            slide={activeSlide}
            lessonId={lessonId}
            revealStep={revealStep}
          />
        ) : (
          <>
            {/* SLIDE 0: TITLE & MOTIVATION */}
            {currentSlide === 0 && (
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cc785c]/15 border border-[#cc785c]/30 text-[#cc785c] text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Lesson 02 • Core Data Structures
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#faf6ee] tracking-tight font-serif-anthropic">
              Hash Maps: <span className="text-[#cc785c]">Constant-Time Dictionaries & Collisions</span>
            </h1>

            <p className="text-base lg:text-lg text-[#d4cfc5] leading-relaxed max-w-3xl">
              How do we search, insert, and delete items with arbitrary keys (strings, objects, UUIDs) in <KaTeXMath math="\mathcal{O}(1)" /> expected time without allocating terabytes of memory?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 min-h-[190px]">
              {/* Step 1: Direct Access Array */}
              <div 
                className={`bg-[#22221f] border border-[#383733] rounded-xl p-5 shadow-lg transition-all duration-500 transform ${
                  revealStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-2 text-rose-400 font-semibold mb-2 text-sm font-serif-anthropic">
                  <Database className="w-5 h-5" />
                  Direct Access Array (Impractical)
                </div>
                <p className="text-[#9e978c] text-xs leading-relaxed">
                  Indexing by arbitrary 64-bit keys or strings would require an array with <KaTeXMath math="M = 2^{64}" /> slots—more memory than exists on Earth.
                </p>
                <div className="mt-3 bg-[#141413] p-3 rounded-lg border border-[#383733] text-center font-mono text-xs text-rose-300">
                  <KaTeXMath block math="\text{Memory} = \Omega(|U|) \gg 10^{19} \text{ bytes}" />
                </div>
              </div>

              {/* Step 2: The Hash Map Solution */}
              <div 
                className={`bg-[#22221f] border border-[#383733] rounded-xl p-5 shadow-lg transition-all duration-500 transform ${
                  revealStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2 text-sm font-serif-anthropic">
                  <CheckCircle2 className="w-5 h-5" />
                  The Hash Map Solution
                </div>
                <p className="text-[#9e978c] text-xs leading-relaxed">
                  Map keys from huge universe <KaTeXMath math="U" /> into <KaTeXMath math="m" /> table slots using a hash function <KaTeXMath math="h: U \to \{0, \dots, m-1\}" />:
                </p>
                <div className="mt-3 bg-[#141413] p-3 rounded-lg border border-[#383733] text-center font-mono text-xs text-emerald-300">
                  <KaTeXMath block math="\text{Expected Time: } \mathcal{O}(1) \quad \text{Space: } \mathcal{O}(n + m)" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: PIGEONHOLE PRINCIPLE & HASH MATH */}
        {currentSlide === 1 && (
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-[#faf6ee] flex items-center gap-3 font-serif-anthropic">
              <Hash className="w-7 h-7 text-[#cc785c]" />
              The Pigeonhole Principle & Expected Chain Length
            </h2>

            <div className="bg-[#22221f] border border-[#cc785c]/30 rounded-xl p-5 shadow-lg">
              <h3 className="text-[#cc785c] font-semibold text-xs uppercase tracking-wider mb-2">
                The Inevitability of Collisions
              </h3>
              <p className="text-[#d4cfc5] text-sm mb-2 leading-relaxed">
                Because <KaTeXMath math="|U| > m" />, by Dirichlet's <strong>Pigeonhole Principle</strong>, there must exist distinct keys <KaTeXMath math="k_1 \neq k_2" /> such that:
              </p>
              <div className="bg-[#141413] p-3.5 rounded-lg border border-[#383733] text-center">
                <KaTeXMath block math="h(k_1) = h(k_2) \pmod m \quad (\text{Collision Inevitability})" />
              </div>
            </div>

            <div 
              className={`bg-[#22221f] border border-[#383733] rounded-xl p-5 shadow-lg transition-all duration-500 transform ${
                revealStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <h3 className="text-[#d49b53] font-semibold text-xs uppercase tracking-wider mb-2 font-serif-anthropic">
                Simple Uniform Hashing Assumption (SUHA)
              </h3>
              <p className="text-[#d4cfc5] text-xs leading-relaxed mb-2">
                Under SUHA, any given key is equally likely to hash to any of the <KaTeXMath math="m" /> slots, independently of where other keys hash.
              </p>
              <div className="bg-[#141413] p-3 rounded-lg border border-[#383733] text-center mb-2">
                <KaTeXMath block math="\text{Load Factor } \alpha = \frac{n}{m} \implies \mathbb{E}[\text{chain length}] = \alpha" />
              </div>

              <div 
                className={`p-3 bg-emerald-950/25 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center justify-between transition-all duration-500 transform ${
                  revealStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                }`}
              >
                <span>When load factor <KaTeXMath math="\alpha \le 0.75" />, average search time is strictly bounded:</span>
                <KaTeXMath math="\mathcal{O}(1 + \alpha) = \mathcal{O}(1)" />
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: COLLISION RESOLUTION COMPARISON */}
        {currentSlide === 2 && (
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-[#faf6ee] flex items-center gap-3 font-serif-anthropic">
              <Layers className="w-7 h-7 text-[#cc785c]" />
              Collision Resolution Strategies
            </h2>
            <p className="text-[#d4cfc5] text-xs">
              When two keys hash to the same bucket, how do we store them? Two primary paradigms exist:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[220px]">
              {/* Step 1: Separate Chaining */}
              <div 
                className={`bg-[#22221f] border border-[#cc785c]/30 rounded-xl p-4 transition-all duration-500 transform ${
                  revealStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-2'
                }`}
              >
                <span className="text-xs font-mono text-[#cc785c] bg-[#cc785c]/15 border border-[#cc785c]/30 px-2 py-0.5 rounded">
                  Strategy 1 (Our Choice)
                </span>
                <h4 className="text-[#faf6ee] font-semibold text-sm mt-1.5 font-serif-anthropic">Separate Chaining</h4>
                <p className="text-[#9e978c] text-xs mt-1 leading-relaxed">
                  Each bucket is a linked list. Colliding keys are chained together in <KaTeXMath math="\mathcal{O}(1)" /> time:
                </p>
                <div className="mt-2 bg-[#141413] p-2.5 rounded border border-[#383733] text-center text-xs text-[#d4cfc5] font-mono">
                  <KaTeXMath block math="\text{Bucket}[i] \to (k_1, v_1) \to (k_2, v_2) \to \text{NULL}" />
                </div>
                <p className="text-emerald-400 text-[11px] mt-2 font-medium">
                  ✓ Simple deletion • Never runs out of slots • Resilient to load spikes
                </p>
              </div>

              {/* Step 2: Open Addressing */}
              <div 
                className={`bg-[#22221f] border border-[#383733] rounded-xl p-4 transition-all duration-500 transform ${
                  revealStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-2'
                }`}
              >
                <span className="text-xs font-mono text-[#d49b53] bg-[#d49b53]/15 border border-[#d49b53]/30 px-2 py-0.5 rounded">
                  Strategy 2
                </span>
                <h4 className="text-[#faf6ee] font-semibold text-sm mt-1.5 font-serif-anthropic">Open Addressing</h4>
                <p className="text-[#9e978c] text-xs mt-1 leading-relaxed">
                  All entries live directly inside the table array. On collision, probe for next available slot:
                </p>
                <div className="mt-2 bg-[#141413] p-2.5 rounded border border-[#383733] text-center text-xs text-[#d49b53] font-mono">
                  <KaTeXMath block math="h(k, i) = (h(k) + i) \pmod m \quad (\text{Linear Probing})" />
                </div>
                <p className="text-amber-400 text-[11px] mt-2 font-medium">
                  ⚠ Primary clustering • Requires tombstone deletion • Fails when <KaTeXMath math="\alpha \ge 1" />
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: INTERACTIVE VISUALIZER */}
        {currentSlide === 3 && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-[#faf6ee] flex items-center gap-2 font-serif-anthropic">
                <span>Interactive VisuAlgo Lab: Hash Maps & Rehashing</span>
              </h2>
              <span className="text-xs font-mono text-[#cc785c] bg-[#cc785c]/15 px-2.5 py-1 rounded border border-[#cc785c]/30">
                <KaTeXMath math="\alpha_{\max} = 0.75" /> • Auto Table Doubling
              </span>
            </div>
            <div className="flex-1 min-h-[480px]">
              <HashMapVisualizer />
            </div>
          </div>
        )}

        {/* SLIDE 4: PURE C IMPLEMENTATION */}
        {currentSlide === 4 && (
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-[#faf6ee] flex items-center gap-3 font-serif-anthropic">
              <Code2 className="w-7 h-7 text-[#cc785c]" />
              Pure C Implementation & Dynamic Table Doubling
            </h2>
            <p className="text-[#d4cfc5] text-sm leading-relaxed">
              Our C implementation in <code className="text-[#cc785c] bg-[#141413] px-1.5 py-0.5 rounded font-mono border border-[#383733]">hashmap.c</code> was built strictly following <strong>Test-Driven Development (TDD)</strong> with 139 passing assertions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#141413] border border-[#383733] rounded-xl p-4 font-mono text-xs text-[#faf6ee]">
                <span className="text-[#cc785c] font-semibold">// djb2 Hash Algorithm in C</span><br/>
                <span className="text-[#d49b53]">unsigned long</span> <span className="text-[#faf6ee]">hashmap_hash_djb2</span>(<span className="text-[#d49b53]">const char*</span> str) &#123;<br/>
                &nbsp;&nbsp;<span className="text-[#d49b53]">unsigned long</span> hash = 5381;<br/>
                &nbsp;&nbsp;<span className="text-[#cc785c]">int</span> c;<br/>
                &nbsp;&nbsp;<span className="text-[#d49b53]">while</span> ((c = (<span className="text-[#d49b53]">unsigned char</span>)*str++)) &#123;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;hash = ((hash &lt;&lt; 5) + hash) + c; <span className="text-[#9e978c]">// * 33 + c</span><br/>
                &nbsp;&nbsp;&#125;<br/>
                &nbsp;&nbsp;<span className="text-[#d49b53]">return</span> hash;<br/>
                &#125;
              </div>

              <div 
                className={`bg-[#141413] border border-[#383733] rounded-xl p-4 font-mono text-xs text-[#faf6ee] transition-all duration-500 transform ${
                  revealStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                }`}
              >
                <span className="text-[#cc785c] font-semibold">// Amortized O(1) Table Doubling</span><br/>
                <span className="text-[#9e978c]">// Triggered when (size + 1) / capacity &gt; 0.75</span><br/>
                <span className="text-[#d49b53]">static bool</span> <span className="text-[#faf6ee]">hashmap_rehash</span>(HashMap* map, <span className="text-[#cc785c]">size_t</span> new_cap) &#123;<br/>
                &nbsp;&nbsp;HashNode** new_b = <span className="text-[#d49b53]">calloc</span>(new_cap, <span className="text-[#d49b53]">sizeof</span>(HashNode*));<br/>
                &nbsp;&nbsp;<span className="text-[#9e978c]">// Re-link nodes into new buckets without reallocation</span><br/>
                &nbsp;&nbsp;<span className="text-[#d49b53]">for</span> (<span className="text-[#cc785c]">size_t</span> i = 0; i &lt; map-&gt;capacity; i++) &#123;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#9e978c]">/* Re-index each node: hash % new_cap */</span><br/>
                &nbsp;&nbsp;&#125;<br/>
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
                  Switch to the <strong>C Source & Runner</strong> tab in the header to edit the Hash Map source code and live-compile!
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                <KaTeXMath math="\mathcal{O}(1) \text{ Amortized Insertion}" />
              </span>
            </div>
          </div>
        )}
      </>
    )}
  </div>

      {/* Slide Navigation Bar with Reveal Controls */}
      <div className="h-12 bg-[#141413]/90 border-t border-[#383733] px-6 flex items-center justify-between text-xs text-[#9e978c]">
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

          {/* Question 2-Min Timer Pill if current slide has a question */}
          {activeSlide?.hasQuestion && (
            <div className="ml-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#cc785c]/15 border border-[#cc785c]/30 text-[11px] font-mono text-[#cc785c]">
              <Timer className="w-3 h-3" />
              <span>2m Question</span>
            </div>
          )}

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

        {/* Slide Progress Dots */}
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
