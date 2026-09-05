import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight,
  Gauge
} from 'lucide-react';

interface PlaybackControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onFirst: () => void;
  onLast: () => void;
  onSeek: (step: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  onPlayPause,
  onStepForward,
  onStepBack,
  onFirst,
  onLast,
  onSeek,
  speed,
  onSpeedChange,
}) => {
  const isFirst = currentStep <= 0;
  const isLast = currentStep >= totalSteps - 1 || totalSteps === 0;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-4 select-none shadow-lg">
      {/* Step-by-Step Primary Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onFirst}
          disabled={isFirst}
          title="Jump to Start"
          className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Prev Step Button */}
        <button
          onClick={onStepBack}
          disabled={isFirst}
          title="Step Backward (Left Arrow)"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-950 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev Step</span>
        </button>

        {/* Primary Next Step Button */}
        <button
          onClick={onStepForward}
          disabled={isLast}
          title="Step Forward (Right Arrow)"
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:hover:bg-indigo-600 transition"
        >
          <span>Next Step</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={onLast}
          disabled={isLast}
          title="Jump to End"
          className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-800 mx-1" />

        {/* Auto Play / Pause (Secondary) */}
        <button
          onClick={onPlayPause}
          disabled={totalSteps <= 1}
          title={isPlaying ? "Pause Auto-play (Space)" : "Auto-play All Steps (Space)"}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg font-medium border transition ${
            isPlaying
              ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Auto Play</span>
            </>
          )}
        </button>
      </div>

      {/* Scrubber Timeline */}
      <div className="flex-1 flex items-center gap-3 w-full">
        <span className="text-xs font-mono text-slate-300 whitespace-nowrap bg-slate-950 px-2 py-1 rounded border border-slate-800">
          Step <strong>{totalSteps > 0 ? currentStep + 1 : 0}</strong> of {totalSteps || 0}
        </span>
        <input
          type="range"
          min="0"
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={e => onSeek(parseInt(e.target.value))}
          disabled={totalSteps <= 1}
          className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-30"
        />
      </div>

      {/* Speed Slider */}
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-400 font-mono">{speed}x</span>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.5"
          value={speed}
          onChange={e => onSpeedChange(parseFloat(e.target.value))}
          className="w-20 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};
