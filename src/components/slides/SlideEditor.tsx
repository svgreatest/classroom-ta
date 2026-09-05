import React, { useState, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { LessonId } from '../../branding/BrandHeader';
import { parseAllSlides, ParsedSlide } from '../../engine/slides/markdown-parser';
import { MarkdownSlideViewer } from './MarkdownSlideViewer';
import { 
  Save, 
  Eye, 
  Presentation, 
  Plus, 
  Sigma, 
  Layers, 
  Code2, 
  MessageSquare, 
  Check, 
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SlideEditorProps {
  lessonId: LessonId;
  onEnterPresenter: (slideIndex: number) => void;
  currentSlideIndex: number;
  onSelectSlideIndex: (idx: number) => void;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  lessonId,
  onEnterPresenter,
  currentSlideIndex,
  onSelectSlideIndex,
}) => {
  const [markdown, setMarkdown] = useState<string>('');
  const [slides, setSlides] = useState<ParsedSlide[]>([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(currentSlideIndex || 0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Fetch markdown for the active lesson from /api/slides
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/slides?lessonId=${lessonId}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        const initialMd = data.content || `# ${lessonId}\n:::badge Overview\n\nNew lesson slides.\n\n---\n\n## Next Slide\nMore content.`;
        setMarkdown(initialMd);
        const parsed = parseAllSlides(initialMd);
        setSlides(parsed);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load slides', err);
        setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [lessonId]);

  // Keep internal active slide synced with prop
  useEffect(() => {
    if (currentSlideIndex >= 0 && currentSlideIndex < slides.length) {
      setActiveSlideIdx(currentSlideIndex);
    }
  }, [currentSlideIndex, slides.length]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Immediately remeasure fonts to eliminate cursor misalignment
    monaco.editor.remeasureFonts();

    // Re-measure after asynchronous web fonts have loaded
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        monaco.editor.remeasureFonts();
      });
    }

    // Remeasure whenever user focuses into editor
    editor.onDidFocusEditorText(() => {
      monaco.editor.remeasureFonts();
    });
  };

  const handleMarkdownChange = (val: string | undefined) => {
    const text = val || '';
    setMarkdown(text);
    const parsed = parseAllSlides(text);
    setSlides(parsed);
    if (activeSlideIdx >= parsed.length) {
      const newIdx = Math.max(0, parsed.length - 1);
      setActiveSlideIdx(newIdx);
      onSelectSlideIndex(newIdx);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/slides?lessonId=${lessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: markdown })
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to insert snippets into Monaco editor at current cursor
  const insertSnippet = (snippet: string) => {
    if (!editorRef.current) return;
    const selection = editorRef.current.getSelection();
    const id = { major: 1, minor: 1 };
    const op = { identifier: id, range: selection, text: snippet, forceMoveMarkers: true };
    editorRef.current.executeEdits('slide-editor-insert', [op]);
    editorRef.current.focus();
  };

  const activeSlide = slides[activeSlideIdx] || slides[0] || {
    id: 0,
    raw: '',
    hasVisualizer: false,
    hasCodeRunner: false,
    blocks: []
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181816] overflow-hidden select-none font-sans-anthropic">
      {/* Editor Action Toolbar */}
      <div className="h-12 bg-[#141413] border-b border-[#383733] px-4 flex items-center justify-between gap-3 flex-shrink-0 shadow-md">
        {/* Quick Insert Snippet Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => insertSnippet('\n\n---\n\n# New Slide Title\n:::badge Section\n\nContent goes here.\n')}
            title="Insert Slide Break"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#22221f] border border-[#383733] text-[#faf6ee] hover:bg-[#2a2a26] transition"
          >
            <Plus className="w-3.5 h-3.5 text-[#cc785c]" />
            <span>Add Slide (---)</span>
          </button>

          <button
            onClick={() => insertSnippet('$$\\mathcal{O}(\\log n)$$')}
            title="Insert KaTeX Math Block"
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#22221f] border border-[#383733] text-[#d4cfc5] hover:text-[#faf6ee] hover:bg-[#2a2a26] transition"
          >
            <Sigma className="w-3.5 h-3.5 text-[#cc785c]" />
            <span>Math</span>
          </button>

          <button
            onClick={() => insertSnippet('\n\n:::visualizer\n\n')}
            title="Insert Algorithm Visualizer Component"
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#22221f] border border-[#383733] text-[#d4cfc5] hover:text-[#faf6ee] hover:bg-[#2a2a26] transition"
          >
            <Layers className="w-3.5 h-3.5 text-[#d49b53]" />
            <span>:::visualizer</span>
          </button>

          <button
            onClick={() => insertSnippet('\n\n:::code\n\n')}
            title="Insert Monaco C Editor and GCC Runner"
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#22221f] border border-[#383733] text-[#d4cfc5] hover:text-[#faf6ee] hover:bg-[#2a2a26] transition"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>:::code</span>
          </button>

          <button
            onClick={() => insertSnippet('\n\n:::notes\nInstructor speaker notes here.\n:::\n\n')}
            title="Insert Speaker Notes"
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#22221f] border border-[#383733] text-[#d4cfc5] hover:text-[#faf6ee] hover:bg-[#2a2a26] transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#d49b53]" />
            <span>Notes</span>
          </button>
        </div>

        {/* Save and Presenter Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shadow-md ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-[#cc785c] hover:bg-[#d9886c] text-white shadow-[#cc785c]/20'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved to Disk!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Slides'}</span>
              </>
            )}
          </button>

          <button
            onClick={() => onEnterPresenter(activeSlideIdx)}
            title="Enter Fullscreen Presenter Mode"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#22221f] hover:bg-[#2a2a26] text-[#faf6ee] border border-[#383733] transition"
          >
            <Presentation className="w-3.5 h-3.5 text-[#cc785c]" />
            <span>Live Presenter Mode</span>
          </button>
        </div>
      </div>

      {/* Split-Screen: Editor on Left, Live Preview on Right */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: Monaco Markdown Editor */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col border-b md:border-b-0 md:border-r border-[#383733] bg-[#141413] select-text">
          <div className="h-8 bg-[#181816] px-3 flex items-center justify-between text-[11px] font-mono text-[#9e978c] border-b border-[#383733]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#cc785c]" />
              <span>slides.md ({slides.length} slides detected)</span>
            </span>
            <span>Markdown + KaTeX ($ math $)</span>
          </div>

          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={markdown}
              onChange={handleMarkdownChange}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                lineHeight: 21,
                letterSpacing: 0,
                fontLigatures: false,
                wordWrap: 'on',
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 },
                fontFamily: "Consolas, 'Fira Code', 'Courier New', monospace",
                automaticLayout: true
              }}
            />
          </div>
        </div>

        {/* Right Pane: Live Rendered Slide Preview */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-[#181816] overflow-hidden">
          {/* Slide Selector Header */}
          <div className="h-8 bg-[#141413] px-3 flex items-center justify-between border-b border-[#383733] text-xs">
            <span className="font-semibold text-[#faf6ee] flex items-center gap-1.5 font-serif-anthropic">
              <Eye className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>Live Slide Preview: Slide {activeSlideIdx + 1} of {slides.length}</span>
            </span>

            {/* Slide Navigation in Preview */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const newIdx = Math.max(0, activeSlideIdx - 1);
                  setActiveSlideIdx(newIdx);
                  onSelectSlideIndex(newIdx);
                }}
                disabled={activeSlideIdx === 0}
                className="p-1 text-[#9e978c] hover:text-[#faf6ee] disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-[#cc785c] px-1 font-bold">
                {activeSlideIdx + 1} / {slides.length}
              </span>
              <button
                onClick={() => {
                  const newIdx = Math.min(slides.length - 1, activeSlideIdx + 1);
                  setActiveSlideIdx(newIdx);
                  onSelectSlideIndex(newIdx);
                }}
                disabled={activeSlideIdx >= slides.length - 1}
                className="p-1 text-[#9e978c] hover:text-[#faf6ee] disabled:opacity-30 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rendered Slide Content */}
          <div className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-5xl mx-auto w-full flex flex-col justify-center relative">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-[#9e978c] text-xs gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#cc785c]" />
                <span>Loading slides from disk...</span>
              </div>
            ) : (
              <MarkdownSlideViewer
                slide={activeSlide}
                lessonId={lessonId}
                hideInteractivePlaceholders={false}
              />
            )}
          </div>

          {/* Speaker Notes Preview Footer (if any) */}
          {activeSlide.notes && (
            <div className="p-3 bg-[#22221f] border-t border-[#383733] text-xs text-[#faf6ee]">
              <span className="font-bold flex items-center gap-1 text-[#d49b53] mb-1 font-serif-anthropic">
                <MessageSquare className="w-3.5 h-3.5" />
                Speaker Notes:
              </span>
              <p className="font-mono text-[11px] text-[#d4cfc5] whitespace-pre-wrap">
                {activeSlide.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};