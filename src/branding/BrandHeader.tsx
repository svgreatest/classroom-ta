import React, { useState } from 'react';
import { 
  GraduationCap, 
  PenTool, 
  SquarePlay, 
  Code2, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileEdit,
  Download,
  Loader2,
  Presentation,
  ExternalLink
} from 'lucide-react';

export type LessonId = string;

export interface LessonInfo {
  id: LessonId;
  code: string;
  title: string;
  topic: string;
}

export const DEFAULT_LESSONS: LessonInfo[] = [
  {
    id: '01-avl-trees',
    code: 'Lesson 01',
    title: 'AVL Trees & Rotations',
    topic: 'Self-Balancing Binary Search Trees'
  },
  {
    id: '02-hashmaps',
    code: 'Lesson 02',
    title: 'Hash Maps & Collisions',
    topic: 'Separate Chaining & Dynamic Rehashing'
  },
  {
    id: '03-pointers-and-stacks',
    code: 'Lesson 03',
    title: 'Pointers to a Generic Stack',
    topic: 'Memory, Pointers, realloc, void* & Stacks'
  },
  {
    id: '04-shipping-a-feature',
    code: 'Lesson 04',
    title: 'Shipping a Feature with GenericStack',
    topic: 'Code Reuse, Interfaces, Tests & Code Review'
  }
];

interface BrandHeaderProps {
  currentLessonId: LessonId;
  onSelectLesson: (id: LessonId) => void;
  currentSlide: number;
  totalSlides: number;
  onPrevSlide?: () => void;
  onNextSlide?: () => void;
  isDrawingActive: boolean;
  onToggleDrawing: () => void;
  onOpenWhiteboard: () => void;
  activeTab: 'slides' | 'visualizer' | 'code';
  onSelectTab: (tab: 'slides' | 'visualizer' | 'code') => void;
  onOpenNewLesson?: () => void;
  lessonsList?: LessonInfo[];
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  currentLessonId,
  onSelectLesson,
  currentSlide,
  totalSlides,
  onPrevSlide,
  onNextSlide,
  isDrawingActive,
  onToggleDrawing,
  onOpenWhiteboard,
  activeTab,
  onSelectTab,
  onOpenNewLesson,
  lessonsList = DEFAULT_LESSONS,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLessonMenuOpen, setIsLessonMenuOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const activeLesson = lessonsList.find(l => l.id === currentLessonId) || lessonsList[0] || DEFAULT_LESSONS[0];

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const res = await fetch(`/api/export-pdf?lessonId=${currentLessonId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      } else {
        alert(data.error || 'Failed to export PDF');
      }
    } catch (err: any) {
      alert('PDF export error: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <header className="h-14 bg-[#181816]/95 backdrop-blur border-b border-[#383733] px-4 flex items-center justify-between z-50 select-none relative font-sans-anthropic">
      {/* Brand Identity & Lesson Selector */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-[#cc785c] to-[#e08d73] flex items-center justify-center shadow-md text-white flex-shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide text-[#faf6ee] uppercase flex items-center gap-1.5 font-serif-anthropic">
              Classroom TA
              <span className="text-[10px] bg-[#cc785c]/20 text-[#cc785c] border border-[#cc785c]/40 px-1.5 py-0.5 rounded font-medium font-sans">
                LIVE
              </span>
            </span>

            {/* Native Slidev Editor Launch */}
            <button
              onClick={() => {
                const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
                window.open(`http://${host}:3030/`, '_blank');
              }}
              title="Open Native Slidev Slide Editor in new tab"
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-sans font-medium rounded-md bg-[#22221f] hover:bg-[#2a2a26] text-[#d4cfc5] hover:text-[#faf6ee] border border-[#383733] hover:border-[#cc785c]/50 transition shadow-sm"
            >
              <FileEdit className="w-3 h-3 text-[#cc785c]" />
              <span>Slidev Editor</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-50 ml-0.5" />
            </button>

            <span className="text-[#4d4b46]">|</span>

            {/* Interactive Lesson Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLessonMenuOpen(!isLessonMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#22221f] border border-[#383733] hover:border-[#cc785c]/50 text-xs text-[#d4cfc5] hover:text-[#faf6ee] rounded-md transition font-medium"
              >
                <BookOpen className="w-3 h-3 text-[#cc785c]" />
                <span>{activeLesson.code}: {activeLesson.title}</span>
                <ChevronDown className="w-3 h-3 text-[#9e978c]" />
              </button>

              {isLessonMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-[#22221f] border border-[#383733] rounded-xl shadow-2xl py-1.5 z-50">
                  <div className="px-3 py-1 flex items-center justify-between text-[10px] font-mono text-[#9e978c] uppercase tracking-wider border-b border-[#383733]">
                    <span>Curriculum Lessons</span>
                    {onOpenNewLesson && (
                      <button
                        onClick={() => {
                          setIsLessonMenuOpen(false);
                          onOpenNewLesson();
                        }}
                        className="text-[#cc785c] hover:text-[#e08d73] flex items-center gap-1 normal-case font-sans font-bold"
                      >
                        + New Lesson
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {lessonsList.map(l => (
                      <button
                        key={l.id}
                        onClick={() => {
                          onSelectLesson(l.id);
                          setIsLessonMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex flex-col transition ${
                          l.id === currentLessonId
                            ? 'bg-[#cc785c]/15 border-l-2 border-[#cc785c] text-white'
                            : 'text-[#d4cfc5] hover:bg-[#2a2a26] hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold text-[#faf6ee]">
                          {l.code}: {l.title}
                        </span>
                        <span className="text-[11px] text-[#9e978c] truncate">
                          {l.topic}
                        </span>
                      </button>
                    ))}
                  </div>
                  {onOpenNewLesson && (
                    <div className="p-1.5 border-t border-[#383733]">
                      <button
                        onClick={() => {
                          setIsLessonMenuOpen(false);
                          onOpenNewLesson();
                        }}
                        className="w-full py-1.5 px-2 text-xs font-semibold text-center rounded bg-[#cc785c]/20 hover:bg-[#cc785c]/30 text-[#faf6ee] transition flex items-center justify-center gap-1.5"
                      >
                        <span>+ Add New Lesson Folder</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="text-[11px] text-[#9e978c]">Classroom Teaching Assistant</div>
        </div>
      </div>

      {/* Mode / View Selector */}
      <div className="flex items-center bg-[#141413] p-1 rounded-lg border border-[#383733]">
        <div className="flex items-center">
          <button
            onClick={() => onSelectTab('slides')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs transition font-medium ${
              activeTab === 'slides'
                ? 'bg-[#cc785c] text-white shadow-sm rounded-l-md'
                : 'text-[#9e978c] hover:text-[#d4cfc5] hover:bg-[#22221f] rounded-md'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Slides ({currentSlide + 1}/{totalSlides})</span>
          </button>
          {activeTab === 'slides' && (
            <div className="flex items-center bg-[#cc785c] text-white rounded-r-md border-l border-white/20 px-0.5 py-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevSlide?.();
                }}
                disabled={currentSlide <= 0}
                title="Previous Slide (← / PgUp)"
                className="p-0.5 hover:bg-black/20 rounded disabled:opacity-35 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNextSlide?.();
                }}
                disabled={currentSlide >= totalSlides - 1}
                title="Next Slide (→ / PgDn / Space)"
                className="p-0.5 hover:bg-black/20 rounded disabled:opacity-35 transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => onSelectTab('visualizer')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition font-medium ${
            activeTab === 'visualizer'
              ? 'bg-[#cc785c] text-white shadow-sm'
              : 'text-[#9e978c] hover:text-[#d4cfc5] hover:bg-[#22221f]'
          }`}
        >
          <SquarePlay className="w-3.5 h-3.5" />
          VisuAlgo Lab
        </button>

        <button
          onClick={() => onSelectTab('code')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition font-medium ${
            activeTab === 'code'
              ? 'bg-[#cc785c] text-white shadow-sm'
              : 'text-[#9e978c] hover:text-[#d4cfc5] hover:bg-[#22221f]'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          C Source & Runner
        </button>
      </div>

      {/* Classroom Tools & Presentation Controls */}
      <div className="flex items-center gap-2">
        {/* Draw Overlay Toggle */}
        <button
          onClick={onToggleDrawing}
          title="Toggle Screen Pen / Draw Overlay (Hotkey: D)"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition font-medium ${
            isDrawingActive
              ? 'bg-[#d49b53]/25 text-[#d49b53] border-[#d49b53]/50 shadow-sm'
              : 'bg-[#22221f] text-[#d4cfc5] border-[#383733] hover:bg-[#2a2a26] hover:text-[#faf6ee]'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          Pen (D)
        </button>

        {/* Quick Whiteboard Toggle */}
        <button
          onClick={onOpenWhiteboard}
          title="Open Blank Whiteboard Scratchpad (Hotkey: W)"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border bg-[#22221f] text-[#d4cfc5] border-[#383733] hover:bg-[#2a2a26] hover:text-[#faf6ee] transition font-medium"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#cc785c]" />
          Whiteboard (W)
        </button>

        {/* Export PDF Action */}
        <button
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          title="Export Current Slidev Deck as PDF"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border bg-[#22221f] text-[#d4cfc5] border-[#383733] hover:bg-[#2a2a26] hover:text-[#faf6ee] transition font-medium disabled:opacity-50"
        >
          {isExportingPdf ? (
            <Loader2 className="w-3.5 h-3.5 text-[#cc785c] animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 text-[#cc785c]" />
          )}
          <span>{isExportingPdf ? 'Exporting...' : 'Export PDF'}</span>
        </button>

        {/* Slidev Editor Action */}
        <button
          onClick={() => {
            const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
            window.open(`http://${host}:3030/`, '_blank');
          }}
          title="Open Native Slidev Slide Editor (with Live HMR)"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border bg-[#22221f] text-[#d4cfc5] border-[#383733] hover:bg-[#2a2a26] hover:text-[#faf6ee] transition font-medium"
        >
          <FileEdit className="w-3.5 h-3.5 text-[#cc785c]" />
          <span>Slidev Editor</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
        </button>

        {/* Presenter Mode Action */}
        <button
          onClick={() => {
            const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
            window.open(`http://${host}:3030/presenter/`, '_blank', 'width=1280,height=800');
          }}
          title="Open Slidev Presenter Mode with Speaker Notes & Timer"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border bg-[#22221f] text-[#d4cfc5] border-[#383733] hover:bg-[#2a2a26] hover:text-[#faf6ee] transition font-medium"
        >
          <Presentation className="w-3.5 h-3.5 text-[#cc785c]" />
          <span>Presenter Mode</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
        </button>

        <div className="h-4 w-[1px] bg-[#383733] mx-1" />

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          title="Toggle Projector Fullscreen"
          className="p-1.5 text-[#9e978c] hover:text-[#faf6ee] hover:bg-[#22221f] rounded-md transition"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
