import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  buildParameterizedTree, 
  generateInsertSteps, 
  generateDeleteSteps, 
  calculateTreeLayout, 
  getTreeHeight, 
  isAVLBalanced 
} from '../../engine/avl/avl-generator';
import { AVLNodeState, AVLAnimationStep } from '../../engine/avl/types';
import { PlaybackControls } from './PlaybackControls';
import { KaTeXMath } from '../slides/KaTeXMath';
import { 
  Sliders, 
  Plus, 
  Trash, 
  RotateCcw, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  GitCommit,
  Sparkles
} from 'lucide-react';

export const AVLTreeVisualizer: React.FC = () => {
  // Tree & Animation state
  const [tree, setTree] = useState<AVLNodeState | null>(() =>
    buildParameterizedTree({ targetHeight: 3, mode: 'minimal_fibonacci' })
  );
  const [steps, setSteps] = useState<AVLAnimationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Parameter controls
  const [targetHeight, setTargetHeight] = useState<number>(3);
  const [presetMode, setPresetMode] = useState<'minimal_fibonacci' | 'complete' | 'random'>('minimal_fibonacci');
  const [inputKey, setInputKey] = useState<string>('25');
  const [deleteKey, setDeleteKey] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active step snapshot
  const activeStep: AVLAnimationStep | null = useMemo(() => {
    if (steps.length === 0) return null;
    return steps[currentStepIndex] || null;
  }, [steps, currentStepIndex]);

  // Current tree to render (either intermediate step or base tree)
  const displayTree = useMemo(() => {
    const raw = activeStep ? activeStep.treeSnapshot : tree;
    return calculateTreeLayout(raw, 900, 520);
  }, [activeStep, tree]);

  // Handle Playback Interval
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(200, 1200 / speed);
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

  // Action: Generate Tree by Parameters
  const handleGenerateByHeight = () => {
    const newTree = buildParameterizedTree({ targetHeight, mode: presetMode });
    setTree(newTree);
    setSteps([]);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Action: Insert Key with Animation
  const handleInsert = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(inputKey);
    if (isNaN(val)) return;

    const animSteps = generateInsertSteps(tree, val);
    setSteps(animSteps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setInputKey('');
  };

  // Action: Delete Key with Animation
  const handleDelete = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(deleteKey);
    if (isNaN(val)) return;

    const animSteps = generateDeleteSteps(tree, val);
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

  // When animation finishes, commit final state to base tree
  useEffect(() => {
    if (steps.length > 0 && currentStepIndex === steps.length - 1) {
      setTree(steps[steps.length - 1].treeSnapshot);
    }
  }, [currentStepIndex, steps]);

  // Render SVG Edges recursively
  const renderEdges = (node: AVLNodeState | null): React.ReactNode => {
    if (!node) return null;
    const lines: React.ReactNode[] = [];

    if (node.left && node.left.x !== undefined && node.left.y !== undefined) {
      lines.push(
        <g key={`edge-${node.id}-${node.left.id}`}>
          <line
            x1={node.x}
            y1={node.y}
            x2={node.left.x}
            y2={node.left.y}
            stroke="#475569"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      );
      lines.push(renderEdges(node.left));
    }

    if (node.right && node.right.x !== undefined && node.right.y !== undefined) {
      lines.push(
        <g key={`edge-${node.id}-${node.right.id}`}>
          <line
            x1={node.x}
            y1={node.y}
            x2={node.right.x}
            y2={node.right.y}
            stroke="#475569"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      );
      lines.push(renderEdges(node.right));
    }

    return lines;
  };

  // Render SVG Nodes recursively
  const renderNodes = (node: AVLNodeState | null): React.ReactNode => {
    if (!node || node.x === undefined || node.y === undefined) return null;

    const isActive = activeStep && (activeStep.activeKey === node.key || activeStep.compareWithKey === node.key);
    const isPivot = activeStep && activeStep.pivotKey === node.key;
    const isImbalanced = Math.abs(node.balanceFactor) > 1;

    let nodeFill = '#1e293b'; // Default slate
    let nodeStroke = '#6366f1'; // Indigo border

    if (isImbalanced) {
      nodeFill = '#7f1d1d'; // Crimson
      nodeStroke = '#ef4444';
    } else if (isPivot) {
      nodeFill = '#78350f'; // Amber
      nodeStroke = '#f59e0b';
    } else if (isActive) {
      nodeFill = '#312e81'; // Bright indigo
      nodeStroke = '#818cf8';
    }

    return (
      <g key={node.id} className="transition-all duration-300">
        {/* Glow halo on active or pivot node */}
        {(isActive || isPivot || isImbalanced) && (
          <circle
            cx={node.x}
            cy={node.y}
            r="28"
            fill="none"
            stroke={isImbalanced ? '#ef4444' : isPivot ? '#f59e0b' : '#6366f1'}
            strokeWidth="2"
            strokeDasharray="4 4"
            className="animate-spin"
            style={{ animationDuration: '4s' }}
          />
        )}

        {/* Node Circle */}
        <circle
          cx={node.x}
          cy={node.y}
          r="22"
          fill={nodeFill}
          stroke={nodeStroke}
          strokeWidth="3"
          className="shadow-md"
        />

        {/* Key Label */}
        <text
          x={node.x}
          y={node.y + 5}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="14"
          fontWeight="bold"
          fontFamily="Fira Code, monospace"
        >
          {node.key}
        </text>

        {/* Balance Factor Badge */}
        <g transform={`translate(${node.x + 12}, ${node.y - 18})`}>
          <rect
            x="-10"
            y="-8"
            width="20"
            height="16"
            rx="4"
            fill={isImbalanced ? '#dc2626' : node.balanceFactor === 0 ? '#10b981' : '#0284c7'}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {node.balanceFactor > 0 ? `+${node.balanceFactor}` : node.balanceFactor}
          </text>
        </g>

        {/* Height Badge */}
        <g transform={`translate(${node.x - 14}, ${node.y + 14})`}>
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontWeight="600"
            fontFamily="monospace"
          >
            h:{node.height}
          </text>
        </g>

        {/* Child recursive nodes */}
        {renderNodes(node.left)}
        {renderNodes(node.right)}
      </g>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 gap-4 select-none">
      {/* Top Parameter & Operations Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Parameter Definition */}
        <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5" />
            Tree Parameters:
          </div>

          {/* Target Height Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-300 font-mono">Height (h):</span>
            <select
              value={targetHeight}
              onChange={e => setTargetHeight(parseInt(e.target.value))}
              className="bg-slate-900 text-white text-xs border border-slate-700 rounded px-2 py-1 font-mono focus:outline-none focus:border-indigo-500"
            >
              {[1, 2, 3, 4, 5].map(h => (
                <option key={h} value={h}>h = {h}</option>
              ))}
            </select>
          </div>

          {/* Mode Selector */}
          <select
            value={presetMode}
            onChange={e => setPresetMode(e.target.value as any)}
            className="bg-slate-900 text-white text-xs border border-slate-700 rounded px-2 py-1 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="minimal_fibonacci">Minimal Fibonacci (Worst-Case AVL)</option>
            <option value="complete">Complete Balanced Tree</option>
            <option value="random">Random Tree</option>
          </select>

          <button
            onClick={handleGenerateByHeight}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition shadow-sm flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Generate Tree
          </button>
        </div>

        {/* Live Key Insert / Delete Controls */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleInsert} className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Key"
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Insert
            </button>
          </form>

          <form onSubmit={handleDelete} className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Key"
              value={deleteKey}
              onChange={e => setDeleteKey(e.target.value)}
              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
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
            onClick={() => { setTree(null); setSteps([]); }}
            title="Reset Tree"
            className="p-1 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl relative overflow-hidden flex flex-col shadow-inner">
        {/* Active Step Commentary Banner (VisuAlgo Style) */}
        <div className="bg-slate-950/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs backdrop-blur z-10">
          <div className="flex items-center gap-2">
            {activeStep?.rotationCase && activeStep.rotationCase !== 'NONE' ? (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                ROTATION: {activeStep.rotationCase}
              </span>
            ) : isAVLBalanced(activeStep ? activeStep.treeSnapshot : tree) ? (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-mono font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <KaTeXMath math="\text{AVL BALANCED } (|BF| \le 1)" />
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded font-mono font-medium flex items-center gap-1">
                <GitCommit className="w-3.5 h-3.5" />
                STEPPING
              </span>
            )}

            <span className="text-slate-200 font-medium ml-1">
              {activeStep?.description || "Ready. Define tree parameters above or insert keys to begin animation."}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-300 font-mono text-[11px]">
            <span>Height: <strong className="text-white">{getTreeHeight(activeStep ? activeStep.treeSnapshot : tree)}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-500" /> <KaTeXMath math="BF = 0" />
              <span className="inline-block w-2.5 h-2.5 rounded bg-sky-500 ml-1" /> <KaTeXMath math="BF = \pm 1" />
              <span className="inline-block w-2.5 h-2.5 rounded bg-rose-500 ml-1" /> <KaTeXMath math="|BF| \ge 2" />
            </span>
          </div>
        </div>

        {/* SVG Tree Canvas */}
        <div className="flex-1 w-full h-full relative overflow-auto flex items-center justify-center p-4">
          {!displayTree ? (
            <div className="text-slate-500 text-sm flex flex-col items-center gap-2">
              <Info className="w-8 h-8 opacity-40" />
              <span>Tree is empty. Click "Generate Tree" or insert a key.</span>
            </div>
          ) : (
            <svg
              className="w-full h-full min-w-[700px] min-h-[460px]"
              viewBox="0 0 900 520"
              preserveAspectRatio="xMidYMid meet"
            >
              {renderEdges(displayTree)}
              {renderNodes(displayTree)}
            </svg>
          )}
        </div>
      </div>

      {/* VisuAlgo Playback Bar */}
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
