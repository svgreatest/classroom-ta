import React, { useState, useEffect } from 'react';
import { BrandHeader, LessonId, LessonInfo, DEFAULT_LESSONS } from './branding/BrandHeader';
import { SlideDeck } from './components/slides/SlideDeck';
import { HashMapSlideDeck } from './components/slides/HashMapSlideDeck';
import { SlideEditor } from './components/slides/SlideEditor';
import { PresenterView } from './components/slides/PresenterView';
import { NewLessonModal } from './components/lessons/NewLessonModal';
import { parseAllSlides, ParsedSlide } from './engine/slides/markdown-parser';
import { AVLTreeVisualizer } from './components/visualizer/AVLTreeVisualizer';
import { HashMapVisualizer } from './components/visualizer/HashMapVisualizer';
import { MonacoRunner } from './components/editor/MonacoRunner';
import { DrawingCanvasOverlay } from './components/drawing/DrawingCanvasOverlay';
import { WhiteboardModal } from './components/drawing/WhiteboardModal';
import { ArrowLeft, BookOpen, Plus, ChevronDown } from 'lucide-react';

export const App: React.FC = () => {
  const [currentLessonId, setCurrentLessonId] = useState<LessonId>('01-avl-trees');
  const [lessonsList, setLessonsList] = useState<LessonInfo[]>(DEFAULT_LESSONS);
  const [activeTab, setActiveTab] = useState<'slides' | 'visualizer' | 'code'>('slides');
  
  // Dedicated route check: /editor vs /
  const [isEditorRoute, setIsEditorRoute] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/editor');
  });

  const [slides, setSlides] = useState<ParsedSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState<boolean>(false);
  const [isLessonMenuOpenInEditor, setIsLessonMenuOpenInEditor] = useState<boolean>(false);

  const [isDrawingActive, setIsDrawingActive] = useState<boolean>(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState<boolean>(false);

  // Synchronize route with browser history (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setIsEditorRoute(window.location.pathname.startsWith('/editor'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setIsEditorRoute(path.startsWith('/editor'));
  };

  // Load Lessons from /api/lessons
  const refreshLessons = () => {
    fetch('/api/lessons')
      .then(res => res.json())
      .then(data => {
        if (data.lessons && Array.isArray(data.lessons) && data.lessons.length > 0) {
          setLessonsList(data.lessons);
        }
      })
      .catch(err => console.error('Failed to load lessons list:', err));
  };

  useEffect(() => {
    refreshLessons();
  }, []);

  // Load Slides markdown for currentLessonId from /api/slides (for editor or custom lessons)
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/slides?lessonId=${currentLessonId}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.content) {
          const parsed = parseAllSlides(data.content);
          setSlides(parsed);
        }
      })
      .catch(err => console.error('Failed to load lesson slides:', err));

    return () => { isMounted = false; };
  }, [currentLessonId]);

  // Handle lesson change
  const handleSelectLesson = (newLessonId: LessonId) => {
    setCurrentLessonId(newLessonId);
    setCurrentSlide(0);
  };

  const handleLessonCreated = (newLessonId: string) => {
    refreshLessons();
    setCurrentLessonId(newLessonId);
    setCurrentSlide(0);
    navigateTo('/editor');
  };

  // Global Keyboard Shortcuts for In-Class Presentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setIsDrawingActive(prev => !prev);
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setIsWhiteboardOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        if (isWhiteboardOpen) setIsWhiteboardOpen(false);
        else if (isDrawingActive) setIsDrawingActive(false);
      } else if (e.key === '1') {
        setActiveTab('slides');
      } else if (e.key === '2') {
        setActiveTab('visualizer');
      } else if (e.key === '3') {
        setActiveTab('code');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWhiteboardOpen, isDrawingActive]);

  const totalSlidesCount = (currentLessonId === '01-avl-trees' || currentLessonId === '02-hashmaps')
    ? 5 
    : Math.max(1, slides.length);

  // ==========================================
  // VIEW 1: DEDICATED SLIDE STUDIO (/editor)
  // ==========================================
  if (isEditorRoute) {
    const activeLesson = lessonsList.find(l => l.id === currentLessonId) || lessonsList[0] || DEFAULT_LESSONS[0];

    return (
      <div className="h-screen w-screen flex flex-col bg-[#181816] text-[#faf6ee] overflow-hidden relative font-sans-anthropic">
        {/* Editor Studio Top Navigation Header */}
        <header className="h-14 bg-[#141413] border-b border-[#383733] px-4 flex items-center justify-between z-30 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#22221f] text-[#cc785c] border border-[#383733] hover:border-[#cc785c] hover:bg-[#2a2a26] transition shadow-sm"
              title="Return to Live Classroom Presentation (/)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Live Classroom</span>
            </button>

            <span className="text-[#383733]">|</span>

            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-[#faf6ee] uppercase font-serif-anthropic">
                Slide Studio
              </span>
              <span className="text-[10px] bg-[#cc785c]/15 text-[#cc785c] border border-[#cc785c]/30 px-1.5 py-0.5 rounded font-mono font-medium">
                MARKDOWN EDITOR
              </span>
            </div>
          </div>

          {/* Lesson Selector in Editor */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setIsLessonMenuOpenInEditor(!isLessonMenuOpenInEditor)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#22221f] border border-[#383733] hover:border-[#cc785c]/50 text-xs text-[#d4cfc5] hover:text-[#faf6ee] rounded-md transition font-medium"
              >
                <BookOpen className="w-3 h-3 text-[#cc785c]" />
                <span>Editing: {activeLesson.code}: {activeLesson.title}</span>
                <ChevronDown className="w-3 h-3 text-[#9e978c]" />
              </button>

              {isLessonMenuOpenInEditor && (
                <div className="absolute top-full right-0 mt-1 w-72 bg-[#22221f] border border-[#383733] rounded-xl shadow-2xl py-1.5 z-50">
                  <div className="px-3 py-1 flex items-center justify-between text-[10px] font-mono text-[#9e978c] uppercase tracking-wider border-b border-[#383733]">
                    <span>Curriculum Lessons</span>
                    <button
                      onClick={() => {
                        setIsLessonMenuOpenInEditor(false);
                        setIsNewLessonModalOpen(true);
                      }}
                      className="text-[#cc785c] hover:text-[#e08d73] flex items-center gap-1 normal-case font-sans font-bold"
                    >
                      + New Lesson
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {lessonsList.map(l => (
                      <button
                        key={l.id}
                        onClick={() => {
                          handleSelectLesson(l.id);
                          setIsLessonMenuOpenInEditor(false);
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
                </div>
              )}
            </div>

            <button
              onClick={() => setIsNewLessonModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#cc785c]/20 hover:bg-[#cc785c]/30 text-[#faf6ee] transition"
            >
              <Plus className="w-3 h-3 text-[#cc785c]" />
              <span>New Lesson Folder</span>
            </button>
          </div>
        </header>

        {/* Dedicated Markdown Slide Editor */}
        <main className="flex-1 overflow-hidden">
          <SlideEditor
            lessonId={currentLessonId}
            currentSlideIndex={currentSlide}
            onSelectSlideIndex={setCurrentSlide}
            onEnterPresenter={(idx) => {
              setCurrentSlide(idx);
              navigateTo('/');
            }}
          />
        </main>

        <NewLessonModal
          isOpen={isNewLessonModalOpen}
          onClose={() => setIsNewLessonModalOpen(false)}
          onLessonCreated={handleLessonCreated}
        />
      </div>
    );
  }

  // ==========================================
  // VIEW 2: LIVE PRESENTER / CLASSROOM MODE (/)
  // ==========================================
  return (
    <div className="h-screen w-screen flex flex-col bg-[#181816] text-[#faf6ee] overflow-hidden relative font-sans-anthropic">
      {/* Brand Header with Curriculum Switcher & Tools (Zero Editor Clutter) */}
      <BrandHeader
        currentLessonId={currentLessonId}
        onSelectLesson={handleSelectLesson}
        currentSlide={currentSlide}
        totalSlides={totalSlidesCount}
        isDrawingActive={isDrawingActive}
        onToggleDrawing={() => setIsDrawingActive(prev => !prev)}
        onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewLesson={() => setIsNewLessonModalOpen(true)}
        lessonsList={lessonsList}
        onNavigateToEditor={() => navigateTo('/editor')}
      />

      {/* Main Classroom Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'slides' && (
          currentLessonId === '01-avl-trees' ? (
            <SlideDeck
              currentSlide={currentSlide}
              totalSlides={5}
              onNextSlide={() => setCurrentSlide(prev => Math.min(4, prev + 1))}
              onPrevSlide={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
              onSelectSlide={setCurrentSlide}
            />
          ) : currentLessonId === '02-hashmaps' ? (
            <HashMapSlideDeck
              currentSlide={currentSlide}
              totalSlides={5}
              onNextSlide={() => setCurrentSlide(prev => Math.min(4, prev + 1))}
              onPrevSlide={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
              onSelectSlide={setCurrentSlide}
            />
          ) : (
            <PresenterView
              slides={slides}
              currentSlideIndex={currentSlide}
              onSelectSlideIndex={setCurrentSlide}
              lessonId={currentLessonId}
              onToggleDrawing={() => setIsDrawingActive(prev => !prev)}
              isDrawingActive={isDrawingActive}
              onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
            />
          )
        )}

        {activeTab === 'visualizer' && (
          <div className="h-full w-full">
            {currentLessonId === '02-hashmaps' ? (
              <HashMapVisualizer />
            ) : (
              <AVLTreeVisualizer />
            )}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="h-full w-full">
            <MonacoRunner lessonId={currentLessonId} />
          </div>
        )}
      </main>

      {/* Non-destructive Screen Pen / Annotation Overlay */}
      <DrawingCanvasOverlay
        slideKey={`${currentLessonId}-${activeTab === 'slides' ? `slide-${currentSlide}` : activeTab}`}
        isActive={isDrawingActive}
        onClose={() => setIsDrawingActive(false)}
      />

      {/* Quick-Toggle Full Whiteboard Scratchpad */}
      <WhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
      />

      {/* New Lesson Hierarchy Creator Modal */}
      <NewLessonModal
        isOpen={isNewLessonModalOpen}
        onClose={() => setIsNewLessonModalOpen(false)}
        onLessonCreated={handleLessonCreated}
      />
    </div>
  );
};

export default App;

