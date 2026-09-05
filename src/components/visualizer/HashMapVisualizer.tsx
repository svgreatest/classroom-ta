import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  createInitialBuckets, 
  generateHashMapInsertSteps, 
  generateHashMapDeleteSteps, 
  hashDjb2 
} from '../../engine/hashmap/hashmap-generator';
import { BucketState, HashMapAnimationStep } from '../../engine/hashmap/types';
import { PlaybackControls } from './PlaybackControls';
import { KaTeXMath } from '../slides/KaTeXMath';
import { 
  Sliders, 
  Plus, 
  Trash, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  GitCommit,
  Hash,
  Database,
  ArrowRight
} from 'lucide-react';

export const HashMapVisualizer: React.FC = () => {
  // Hash map state
  const [capacity, setCapacity] = useState<number>(4);
  const [maxLoadFactor, setMaxLoadFactor] = useState<number>(0.75);
  const [buckets, setBuckets] = useState<BucketState[]>(() => {
    const initial = createInitialBuckets(4);
    // Preload a couple entries
    const steps1 = generateHashMapInsertSteps(initial, 4, 0, 0.75, 'apple', 42);
    const b1 = steps1[steps1.length - 1].buckets;
    const steps2 = generateHashMapInsertSteps(b1, 4, 1, 0.75, 'banana', 99);
    return steps2[steps2.length - 1].buckets;
  });

  const [steps, setSteps] = useState<HashMapAnimationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Input states
  const [inputKey, setInputKey] = useState<string>('cherry');
  const [inputValue, setInputValue] = useState<string>('150');
  const [deleteKey, setDeleteKey] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeStep: HashMapAnimationStep | null = useMemo(() => {
    if (steps.length === 0) return null;
    return steps[currentStepIndex] || null;
  }, [steps, currentStepIndex]);

  const displayBuckets = useMemo(() => {
    return activeStep ? activeStep.buckets : buckets;
  }, [activeStep, buckets]);

  const displayCapacity = activeStep ? activeStep.capacity : capacity;
  const currentSize = useMemo(() => {
    return displayBuckets.reduce((acc, b) => acc + b.entries.length, 0);
  }, [displayBuckets]);

  const loadFactor = displayCapacity > 0 ? (currentSize / displayCapacity) : 0;

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(200, 1100 / speed);
      timerRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, steps.length]);

  // Commit state when animation finishes
  useEffect(() => {
    if (steps.length > 0 && currentStepIndex === steps.length - 1) {
      const final = steps[steps.length - 1];
      setBuckets(final.buckets);
      setCapacity(final.capacity);
    }
  }, [currentStepIndex, steps]);

  const handleInsert = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputKey.trim()) return;
    const val = parseInt(inputValue) || 0;

    const animSteps = generateHashMapInsertSteps(
      buckets,
      capacity,
      currentSize,
      maxLoadFactor,
      inputKey.trim(),
      val
    );
    setSteps(animSteps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setInputKey('');
    setInputValue('');
  };

  const handleDelete = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!deleteKey.trim()) return;

    const animSteps = generateHashMapDeleteSteps(
      buckets,
      capacity,
      currentSize,
      maxLoadFactor,
      deleteKey.trim()
    );
    setSteps(animSteps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setDeleteKey('');
  };

  // Keyboard navigation for step-by-step control (Left/Right Arrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (steps.length <= 1) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentStepIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [steps.length]);

  const handleReset = (newCap: number = capacity) => {
    setCapacity(newCap);
    setBuckets(createInitialBuckets(newCap));
    setSteps([]);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 gap-4 select-none">
      {/* Top Operations & Parameter Bar */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Capacity and Threshold Parameters */}
        <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5" />
            Parameters:
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-300 font-mono">Buckets (m):</span>
            <select
              value={capacity}
              onChange={e => handleReset(parseInt(e.target.value))}
              className="bg-slate-900 text-white text-xs border border-slate-700 rounded px-2 py-1 font-mono focus:outline-none"
            >
              <option value="4">m = 4</option>
              <option value="8">m = 8</option>
              <option value="16">m = 16</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-300 font-mono">Max Load:</span>
            <select
              value={maxLoadFactor}
              onChange={e => setMaxLoadFactor(parseFloat(e.target.value))}
              className="bg-slate-900 text-white text-xs border border-slate-700 rounded px-2 py-1 font-mono focus:outline-none"
            >
              <option value="0.75">α_max = 0.75</option>
              <option value="0.5">α_max = 0.50</option>
              <option value="1.0">α_max = 1.00</option>
            </select>
          </div>
        </div>

        {/* Live Key-Value Insert / Delete Controls */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleInsert} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Key"
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              placeholder="Val"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Put
            </button>
          </form>

          <form onSubmit={handleDelete} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Key"
              value={deleteKey}
              onChange={e => setDeleteKey(e.target.value)}
              className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded transition flex items-center gap-1"
            >
              <Trash className="w-3 h-3" />
              Delete
            </button>
          </form>

          <button
            onClick={() => handleReset(4)}
            title="Reset to 4 empty buckets"
            className="p-1 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col shadow-inner">
        {/* Status Commentary & Hash Formula Banner */}
        <div className="bg-slate-950/95 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs backdrop-blur z-10">
          <div className="flex items-center gap-2">
            {activeStep?.actionType === 'rehash_start' || activeStep?.actionType === 'rehash_complete' ? (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                DYNAMIC REHASHING (TABLE DOUBLING)
              </span>
            ) : loadFactor <= maxLoadFactor ? (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-mono font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <KaTeXMath math="\alpha \le \alpha_{\max}" />
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded font-mono font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                OVERLOAD
              </span>
            )}

            <span className="text-slate-200 font-medium ml-1">
              {activeStep?.description || "Ready. Insert or delete keys to observe hashing, bucket indexing, and separate chaining."}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-300 font-mono text-[11px]">
            <span>Items (<KaTeXMath math="n" />): <strong className="text-white">{currentSize}</strong></span>
            <span>•</span>
            <span>Buckets (<KaTeXMath math="m" />): <strong className="text-white">{displayCapacity}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Load Factor <KaTeXMath math="\alpha = \frac{n}{m}" />: 
              <strong className={loadFactor > maxLoadFactor ? "text-rose-400 font-bold" : "text-emerald-400"}>
                {loadFactor.toFixed(2)}
              </strong>
              <span className="text-slate-500">/ {maxLoadFactor}</span>
            </span>
          </div>
        </div>

        {/* Bucket Table & Chaining Visualizer */}
        <div className="flex-1 w-full h-full p-6 overflow-y-auto">
          <div className="space-y-3 max-w-5xl mx-auto">
            {displayBuckets.map((bucket) => {
              const isTargetBucket = activeStep && activeStep.bucketIndex === bucket.index;
              const hasCollision = bucket.entries.length > 1;

              return (
                <div
                  key={`bucket-${bucket.index}`}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 ${
                    isTargetBucket
                      ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  {/* Bucket Slot Header */}
                  <div className="w-28 flex items-center justify-between px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      Bucket [{bucket.index}]
                    </span>
                    {hasCollision && (
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">
                        {bucket.entries.length} coll
                      </span>
                    )}
                  </div>

                  {/* Arrow to first node */}
                  <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

                  {/* Linked List Chain */}
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {bucket.entries.length === 0 ? (
                      <span className="text-xs font-mono text-slate-600 italic px-2">
                        NULL (empty)
                      </span>
                    ) : (
                      bucket.entries.map((entry, idx) => {
                        const isNodeActive = activeStep && activeStep.activeKey === entry.key && isTargetBucket;

                        return (
                          <React.Fragment key={entry.id || `${bucket.index}-${entry.key}`}>
                            <div
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs shadow-md transition-all duration-300 ${
                                isNodeActive
                                  ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-white/50 scale-105'
                                  : 'bg-slate-800/90 text-slate-200 border-slate-700'
                              }`}
                            >
                              <span className="font-bold text-indigo-300">
                                "{entry.key}"
                              </span>
                              <span className="text-slate-400">:</span>
                              <span className="text-emerald-400 font-semibold">
                                {entry.value}
                              </span>
                            </div>

                            {/* Pointer link */}
                            <span className="text-slate-600 text-xs font-mono flex items-center">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </React.Fragment>
                        );
                      })
                    )}
                    {bucket.entries.length > 0 && (
                      <span className="text-xs font-mono text-slate-600 px-1">
                        NULL
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* VisuAlgo Playback Controls */}
      <PlaybackControls
        currentStep={currentStepIndex}
        totalSteps={steps.length}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onStepForward={() => setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1))}
        onStepBack={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
        onFirst={() => setCurrentStepIndex(0)}
        onLast={() => setCurrentStepIndex(steps.length - 1)}
        onSeek={step => setCurrentStepIndex(step)}
        speed={speed}
        onSpeedChange={setSpeed}
      />
    </div>
  );
};
