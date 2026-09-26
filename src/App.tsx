import React, { useState, useEffect } from 'react';
import { BrandHeader, LessonId, LessonInfo, DEFAULT_LESSONS } from './branding/BrandHeader';
import { SlidevEmbed } from './components/slides/SlidevEmbed';
import { getVisualizerForLesson } from './components/visualizer/registry';
import { NewLessonModal } from './components/lessons/NewLessonModal';
import { parseAllSlides, ParsedSlide } from './engine/slides/markdown-parser';
import { MonacoRunner } from './components/editor/MonacoRunner';
import { DrawingCanvasOverlay } from './components/drawing/DrawingCanvasOverlay';
import { WhiteboardModal } from './components/drawing/WhiteboardModal';

export const App: React.FC = () => {
  const [currentLessonId, setCurrentLessonId] = useState<LessonId>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('classroom_ta_lesson') as LessonId) || '04-stack-applications-and-recursion';
    }
    return '04-stack-applications-and-recursion';
  });
  const [lessonsList, setLessonsList] = useState<LessonInfo[]>(DEFAULT_LESSONS);
  const [activeTab, setActiveTab] = useState<'slides' | 'visualizer' | 'code'>('slides');
  const [selectedTutorExample, setSelectedTutorExample] = useState<string>('basics');
  
  const [slides, setSlides] = useState<ParsedSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState<boolean>(false);

  const [isDrawingActive, setIsDrawingActive] = useState<boolean>(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState<boolean>(false);

  // Listen for C Tutor demo launch requests from Slidev slides or other components
  useEffect(() => {
    const handleLaunchTutor = (e: any) => {
      const exampleId = e.detail?.example || e.detail;
      if (exampleId) {
        setSelectedTutorExample(exampleId);
        setActiveTab('visualizer');
      }
    };
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'launch-tutor-example') {
        const exampleId = e.data.detail || 'basics';
        setSelectedTutorExample(exampleId);
        setActiveTab('visualizer');
      }
      if (e.data && e.data.target === 'slidev' && e.data.navState) {
        const slideNo = e.data.navState.no;
        if (typeof slideNo === 'number' && slideNo >= 1) {
          setCurrentSlide(slideNo - 1);
        }
      }
    };

    window.addEventListener('launch-tutor-example', handleLaunchTutor as EventListener);
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('launch-tutor-example', handleLaunchTutor as EventListener);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

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

  // Load Slides markdown for currentLessonId from /api/slides (for slide count / metadata)
  const loadSlides = (lessonId: LessonId) => {
    fetch(`/api/slides?lessonId=${lessonId}&_t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          const parsed = parseAllSlides(data.content);
          setSlides(parsed);
        }
      })
      .catch(err => console.error('Failed to load lesson slides:', err));
  };

  useEffect(() => {
    loadSlides(currentLessonId);
  }, [currentLessonId]);

  // Handle lesson change
  const handleSelectLesson = (newLessonId: LessonId) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('classroom_ta_lesson', newLessonId);
    }
    setCurrentLessonId(newLessonId);
    setCurrentSlide(0);
  };

  const handleLessonCreated = (newLessonId: string) => {
    refreshLessons();
    handleSelectLesson(newLessonId);
  };

  // Listen for in-slide demo trigger links (e.g. #demo:basics, #demo:quiz_...)
  useEffect(() => {
    const handleLaunchTutor = (e: any) => {
      if (e.detail) {
        setSelectedTutorExample(e.detail);
        setActiveTab('visualizer');
      }
    };
    window.addEventListener('launch-tutor-example', handleLaunchTutor);
    return () => window.removeEventListener('launch-tutor-example', handleLaunchTutor);
  }, []);

  const handlePrevSlide = () => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage({ target: 'slidev', type: 'navigate', operation: 'prev' }, '*');
    });
  };

  const handleNextSlide = () => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage({ target: 'slidev', type: 'navigate', operation: 'next' }, '*');
    });
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
      } else if (activeTab === 'slides') {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          handleNextSlide();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          handlePrevSlide();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWhiteboardOpen, isDrawingActive, activeTab]);

  const totalSlidesCount = slides.length > 0 ? slides.length : 5;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#181816] text-[#faf6ee] overflow-hidden relative font-sans-anthropic">
      {/* Brand Header with Curriculum Switcher & Tools */}
      <BrandHeader
        currentLessonId={currentLessonId}
        onSelectLesson={handleSelectLesson}
        currentSlide={currentSlide}
        totalSlides={totalSlidesCount}
        onPrevSlide={handlePrevSlide}
        onNextSlide={handleNextSlide}
        isDrawingActive={isDrawingActive}
        onToggleDrawing={() => setIsDrawingActive(prev => !prev)}
        onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewLesson={() => setIsNewLessonModalOpen(true)}
        lessonsList={lessonsList}
      />

      {/* Main Classroom Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className={`h-full w-full ${activeTab === 'slides' ? 'block' : 'hidden'}`}>
          <SlidevEmbed
            lessonId={currentLessonId}
            isDrawingActive={isDrawingActive}
            onSlideChange={setCurrentSlide}
          />
        </div>

        <div className={`h-full w-full ${activeTab === 'visualizer' ? 'block' : 'hidden'}`}>
          {React.createElement(getVisualizerForLesson(currentLessonId).component, {
            selectedExampleId: selectedTutorExample,
            onSelectExampleId: setSelectedTutorExample,
            returnToSlideNumber: currentSlide + 1,
            onReturnToSlides: () => {
              setActiveTab('slides');
              const iframes = document.querySelectorAll('iframe');
              iframes.forEach(iframe => {
                iframe.contentWindow?.postMessage({ target: 'slidev', type: 'navigate', no: currentSlide + 1 }, '*');
              });
            },
          })}
        </div>

        <div className={`h-full w-full ${activeTab === 'code' ? 'block' : 'hidden'}`}>
          <MonacoRunner lessonId={currentLessonId} />
        </div>
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

