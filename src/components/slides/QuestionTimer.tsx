import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Volume2, 
  VolumeX, 
  Timer
} from 'lucide-react';

export interface QuestionTimerProps {
  initialSeconds?: number;
  slideId?: number | string;
  onTimeExpired?: () => void;
  compact?: boolean;
  title?: string;
}

/**
 * Synthesizes a gentle two-tone bell chime using the Web Audio API.
 * Requires zero external audio files and works offline.
 */
function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First tone: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second tone: G5 (783.99 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.18);
    gain2.gain.setValueAtTime(0.22, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.85);
  } catch {
    // Gracefully handle any browser audio restrictions
  }
}

export const QuestionTimer: React.FC<QuestionTimerProps> = ({
  initialSeconds = 120, // 2 minutes default
  slideId,
  onTimeExpired,
  compact = false,
  title = '2-Minute Question Timer'
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(true); // Auto-start by default
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Keep a ref to onTimeExpired to avoid re-triggering effects
  const onTimeExpiredRef = useRef(onTimeExpired);
  useEffect(() => {
    onTimeExpiredRef.current = onTimeExpired;
  }, [onTimeExpired]);

  // Reset timer whenever slide changes or initialSeconds changes
  useEffect(() => {
    setTimeLeft(initialSeconds);
    setTotalSeconds(initialSeconds);
    setIsRunning(true);
    setIsCompleted(false);
  }, [slideId, initialSeconds]);

  // Countdown ticker
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const intervalId = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsCompleted(true);
          setIsRunning(false);
          if (soundEnabled) {
            playChime();
          }
          if (onTimeExpiredRef.current) {
            onTimeExpiredRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, timeLeft, soundEnabled]);

  // Global Keyboard Shortcuts (T for Toggle, R for Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input, textarea, or Monaco editor
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsRunning(prev => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handleReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [initialSeconds]);

  const handleTogglePlay = useCallback(() => {
    if (isCompleted) {
      // If completed, restart from 2 minutes
      setTimeLeft(initialSeconds);
      setIsCompleted(false);
      setIsRunning(true);
    } else {
      setIsRunning(prev => !prev);
    }
  }, [isCompleted, initialSeconds]);

  const handleReset = useCallback(() => {
    setTimeLeft(initialSeconds);
    setTotalSeconds(initialSeconds);
    setIsCompleted(false);
    setIsRunning(false);
  }, [initialSeconds]);

  const handleAdd30Seconds = useCallback(() => {
    setTimeLeft(prev => prev + 30);
    setTotalSeconds(prev => Math.max(prev, timeLeft + 30));
    if (isCompleted) {
      setIsCompleted(false);
      setIsRunning(true);
    }
  }, [isCompleted, timeLeft]);

  // Format time MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage (0% to 100%)
  const percentage = totalSeconds > 0 ? Math.min(100, Math.max(0, (timeLeft / totalSeconds) * 100)) : 0;

  // Determine visual phase
  const isDanger = timeLeft <= 10 && timeLeft > 0;
  const isWarning = timeLeft <= 30 && timeLeft > 10;

  // Visual classes based on remaining time
  let timeTextColor = 'text-[#faf6ee]';
  let progressColor = 'bg-[#cc785c]';
  let borderColor = 'border-[#383733]';
  let badgeBg = 'bg-[#cc785c]/15 text-[#cc785c] border-[#cc785c]/30';

  if (isCompleted) {
    timeTextColor = 'text-rose-400';
    progressColor = 'bg-rose-500';
    borderColor = 'border-rose-500/60 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500';
    badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  } else if (isDanger) {
    timeTextColor = 'text-rose-400 animate-pulse';
    progressColor = 'bg-rose-500';
    borderColor = 'border-rose-500/60 shadow-md shadow-rose-950/30 ring-1 ring-rose-500/50';
    badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  } else if (isWarning) {
    timeTextColor = 'text-[#d49b53]';
    progressColor = 'bg-[#d49b53]';
    borderColor = 'border-[#d49b53]/50 shadow-md shadow-amber-950/20';
    badgeBg = 'bg-[#d49b53]/15 text-[#d49b53] border-[#d49b53]/30';
  }

  // Compact renderer (e.g. for small headers or nav bars)
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#22221f] border ${borderColor} text-xs font-mono select-none transition-all`}>
        <Timer className={`w-3.5 h-3.5 ${isDanger ? 'text-rose-400 animate-spin' : isWarning ? 'text-[#d49b53]' : 'text-[#cc785c]'}`} />
        <span className={`font-bold ${timeTextColor}`}>{formattedTime}</span>
        <button
          type="button"
          onClick={handleTogglePlay}
          className="p-1 hover:text-white transition"
          title={isRunning ? 'Pause (T)' : 'Resume (T)'}
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`sticky top-0 z-30 mb-5 p-3 sm:p-4 rounded-xl bg-[#181816]/95 backdrop-blur-md border ${borderColor} shadow-2xl transition-all duration-300 select-none`}>
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Left: Badge & Title */}
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${badgeBg}`}>
            <Timer className={`w-5 h-5 ${isDanger ? 'animate-bounce text-rose-400' : isWarning ? 'text-[#d49b53]' : 'text-[#cc785c]'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#faf6ee] uppercase tracking-wider font-serif-anthropic">
                {title}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-semibold ${badgeBg}`}>
                {isCompleted ? "Time's Up!" : isRunning ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="text-[11px] text-[#9e978c] mt-0.5">
              {isCompleted ? (
                <span className="text-rose-300 font-medium">Time expired — open floor for answers & step-by-step analysis</span>
              ) : isDanger ? (
                <span className="text-rose-300 font-medium">Final 10 seconds — submit selections!</span>
              ) : isWarning ? (
                <span className="text-[#d49b53] font-medium">30 seconds remaining</span>
              ) : (
                <span>Discuss and select your answer on the slide below</span>
              )}
            </p>
          </div>
        </div>

        {/* Center: Digital Clock Display */}
        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-1 rounded-lg bg-[#141413] border border-[#383733] font-mono text-2xl sm:text-3xl font-black tracking-widest ${timeTextColor}`}>
            {formattedTime}
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Start / Pause Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all transform active:scale-95 cursor-pointer ${
              isRunning
                ? 'bg-[#22221f] border border-[#383733] text-[#d4cfc5] hover:text-white hover:border-[#cc785c]'
                : isCompleted
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                : 'bg-[#cc785c] hover:bg-[#d98266] text-[#181816] shadow-md'
            }`}
            title="Toggle timer (Shortcut: T)"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isCompleted ? 'Restart' : 'Resume'}</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#22221f] border border-[#383733] hover:border-[#cc785c]/50 text-xs font-medium text-[#d4cfc5] hover:text-white transition cursor-pointer"
            title="Reset to 2:00 (Shortcut: R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* +30s Extra Time Button */}
          <button
            type="button"
            onClick={handleAdd30Seconds}
            className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-[#22221f] border border-[#383733] hover:border-[#cc785c]/50 text-xs font-mono font-bold text-[#cc785c] hover:text-[#e08d73] transition cursor-pointer"
            title="Add +30 seconds of student discussion time"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>30s</span>
          </button>

          {/* Sound Chime Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(prev => !prev)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              soundEnabled
                ? 'bg-[#22221f] border-[#383733] text-[#cc785c] hover:text-[#faf6ee]'
                : 'bg-[#22221f] border-[#383733] text-[#9e978c]/60 hover:text-[#9e978c]'
            }`}
            title={soundEnabled ? 'Chime sound enabled (Click to mute)' : 'Chime sound muted (Click to enable)'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Smooth Horizontal Progress Bar */}
      <div className="w-full h-1.5 bg-[#141413] rounded-full overflow-hidden mt-3 border border-[#383733]/40">
        <div
          className={`h-full transition-all duration-1000 linear ${progressColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Keyboard Shortcut Hint for In-Class TA */}
      <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-[#9e978c] px-0.5">
        <div className="flex items-center gap-2">
          <span>Shortcuts:</span>
          <span><kbd className="px-1 py-0.5 bg-[#22221f] border border-[#383733] rounded text-[#faf6ee]">T</kbd> Pause/Resume</span>
          <span><kbd className="px-1 py-0.5 bg-[#22221f] border border-[#383733] rounded text-[#faf6ee]">R</kbd> Reset</span>
        </div>
        <span>2 min countdown</span>
      </div>
    </div>
  );
};
