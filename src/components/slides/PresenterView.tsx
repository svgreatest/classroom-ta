import React, { useState, useEffect, useCallback } from 'react';
import { ParsedSlide } from '../../engine/slides/markdown-parser';
import { MarkdownSlideViewer } from './MarkdownSlideViewer';
import { LessonId } from '../../branding/BrandHeader';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  PenTool, 
  Sparkles, 
  MessageSquare,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface PresenterViewProps {
  slides: ParsedSlide[];
  currentSlideIndex: number;
  onSelectSlideIndex: (idx: number) => void;
  lessonId: LessonId;
  onSwitchToEditor?: () => void;
  onToggleDrawing: () => void;
  isDrawingActive: boolean;
  onOpenWhiteboard: () => void;
}

export const PresenterView: React.FC<PresenterViewProps> = ({
  slides,
  currentSlideIndex,
  onSelectSlideIndex,
  lessonId,
  onToggleDrawing,
  isDrawingActive,
  onOpenWhiteboard,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [revealStep, setRevealStep] = useState<number>(0);

  const totalSlides = slides.length || 1;
  const activeSlide = slides[currentSlideIndex] || slides[0] || {
    id: 0,
    raw: '',
    hasVisualizer: false,
    hasCodeRunner: false,
    maxSteps: 0,
    blocks: []
  };

  const maxSteps = activeSlide.maxSteps || 0;

  // Reset reveal step when current slide changes
  useEffect(() => {
    setRevealStep(0);
  }, [currentSlideIndex]);

  const handleForward = useCallback(() => {
    if (revealStep < maxSteps) {
      setRevealStep(prev => prev + 1);
    } else {
      if (currentSlideIndex < totalSlides - 1) {
        onSelectSlideIndex(currentSlideIndex + 1);
      }
    }
  }, [revealStep, maxSteps, currentSlideIndex, totalSlides, onSelectSlideIndex]);

  const handleBackward = useCallback(() => {
    if (revealStep > 0) {
      setRevealStep(prev => prev - 1);
    } else {
      if (currentSlideIndex > 0) {
        onSelectSlideIndex(currentSlideIndex - 1);
      }
    }
  }, [revealStep, currentSlideIndex, onSelectSlideIndex]);

  // Keyboard navigation within the slide
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

  // Presentation Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181816] text-[#faf6ee] overflow-hidden relative select-none font-sans-anthropic">
      {/* Top Floating Presenter Control HUD */}
      <div className="h-12 bg-[#141413] border-b border-[#383733] px-6 flex items-center justify-between z-20 shadow-md">
        {/* Slide Counter and Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#22221f] px-2.5 py-1 rounded-lg border border-[#383733]">
            <button
              onClick={handleBackward}
              disabled={currentSlideIndex === 0 && revealStep === 0}
              className="text-[#9e978c] hover:text-[#faf6ee] disabled:opacity-30 transition p-0.5"
              title="Previous step or slide (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-[#cc785c] px-1">
              Slide {currentSlideIndex + 1} / {totalSlides}
            </span>
            <button
              onClick={handleForward}
              disabled={currentSlideIndex >= totalSlides - 1 && revealStep >= maxSteps}
              className="text-[#9e978c] hover:text-[#faf6ee] disabled:opacity-30 transition p-0.5"
              title="Next step or slide (Space / Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Reveal Step Pill */}
          {maxSteps > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#22221f] border border-[#383733] text-[11px] font-mono">
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

        {/* Center: Slide Progress Dots */}
        <div className="hidden md:flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSlideIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                currentSlideIndex === idx
                  ? 'w-6 bg-[#cc785c] shadow-sm shadow-[#cc785c]/50'
                  : 'w-2 bg-[#383733] hover:bg-[#4d4b46]'
              }`}
            />
          ))}
        </div>

        {/* Right: Timer, Notes, Tools */}
        <div className="flex items-center gap-3">
          {/* Lecture Timer */}
          <div className="flex items-center gap-1.5 bg-[#22221f] px-2.5 py-1 rounded-lg border border-[#383733] text-xs font-mono text-[#faf6ee]">
            <Clock className="w-3.5 h-3.5 text-[#cc785c]" />
            <span className="font-bold">{formatTime(elapsedSeconds)}</span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-[#9e978c] hover:text-[#faf6ee] ml-1"
            >
              {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setElapsedSeconds(0)}
              className="text-[#9e978c] hover:text-[#faf6ee]"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Speaker Notes Toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
              showNotes
                ? 'bg-[#d49b53]/25 text-[#d49b53] border-[#d49b53]/50 shadow-sm'
                : 'bg-[#22221f] text-[#d4cfc5] border-[#383733] hover:bg-[#2a2a26]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Notes</span>
          </button>

          {/* Screen Pen Toggle */}
          <button
            onClick={onToggleDrawing}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
              isDrawingActive
                ? 'bg-[#d49b53]/25 text-[#d49b53] border-[#d49b53]/50 shadow-sm'
                : 'bg-[#22221f] text-[#d4cfc5] border-[#383733] hover:bg-[#2a2a26]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Pen (D)</span>
          </button>

          {/* Whiteboard Toggle */}
          <button
            onClick={onOpenWhiteboard}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border bg-[#22221f] text-[#d4cfc5] border-[#383733] hover:bg-[#2a2a26] hover:text-[#faf6ee] transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#cc785c]" />
            <span>Board (W)</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-[#9e978c] hover:text-[#faf6ee] hover:bg-[#22221f] rounded-md transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Slide Canvas - Centered Container Identical to SlideEditor Preview */}
      <div className="flex-1 p-6 lg:p-12 overflow-y-auto max-w-6xl mx-auto w-full flex flex-col justify-center relative">
        <MarkdownSlideViewer
          slide={activeSlide}
          lessonId={lessonId}
          hideInteractivePlaceholders={false}
          revealStep={revealStep}
        />
      </div>

      {/* Floating Speaker Notes Panel (when toggled open) */}
      {showNotes && (
        <div className="absolute bottom-4 right-6 w-96 max-h-64 bg-[#22221f]/95 border border-[#d49b53]/40 rounded-xl shadow-2xl p-4 z-30 backdrop-blur overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#d49b53] flex items-center gap-1.5 uppercase tracking-wider font-serif-anthropic">
              <MessageSquare className="w-3.5 h-3.5" />
              Instructor Speaker Notes
            </span>
            <button
              onClick={() => setShowNotes(false)}
              className="text-[#9e978c] hover:text-white text-xs font-mono"
            >
              ✕
            </button>
          </div>
          <div className="text-xs text-[#faf6ee]/90 font-mono leading-relaxed whitespace-pre-wrap">
            {activeSlide.notes || "No speaker notes written for this slide."}
          </div>
        </div>
      )}
    </div>
  );
};