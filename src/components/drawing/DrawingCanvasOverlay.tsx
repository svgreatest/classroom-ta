import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, RotateCcw, Trash2, Pen, Highlighter, Type, X } from 'lucide-react';

interface DrawingCanvasOverlayProps {
  slideKey: string;
  isActive: boolean;
  onClose: () => void;
}

interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
  isHighlighter: boolean;
}

interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

interface SlideAnnotations {
  strokes: Stroke[];
  texts: TextAnnotation[];
}

export const DrawingCanvasOverlay: React.FC<DrawingCanvasOverlayProps> = ({
  slideKey,
  isActive,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persistent storage of annotations per slide
  const [annotationsBySlide, setAnnotationsBySlide] = useState<Record<string, SlideAnnotations>>(() => {
    try {
      const saved = localStorage.getItem('classroom_ta_overlay_annotations');
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  // Current slide's strokes and texts
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [texts, setTexts] = useState<TextAnnotation[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [activeTextInput, setActiveTextInput] = useState<{ x: number; y: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState<string>('');

  // Tool settings
  const [color, setColor] = useState<string>('#facc15');
  const [penWidth, setPenWidth] = useState<number>(3);
  const [eraserSize, setEraserSize] = useState<number>(30); // 15, 30, 60, 100
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'text' | 'eraser'>('pen');
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const prevSlideKeyRef = useRef<string>(slideKey);

  const COLORS = ['#facc15', '#f87171', '#38bdf8', '#4ade80', '#c084fc', '#ffffff'];

  // Switch slides: save current slide and load target slide
  useEffect(() => {
    const prevKey = prevSlideKeyRef.current;
    if (prevKey !== slideKey) {
      // Save previous slide's state
      setAnnotationsBySlide(prevMap => {
        const updated = {
          ...prevMap,
          [prevKey]: { strokes, texts }
        };
        try {
          localStorage.setItem('classroom_ta_overlay_annotations', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      // Load new slide's state
      const targetData = annotationsBySlide[slideKey] || { strokes: [], texts: [] };
      setStrokes(targetData.strokes || []);
      setTexts(targetData.texts || []);
      setCurrentStroke(null);
      setActiveTextInput(null);
      prevSlideKeyRef.current = slideKey;
    }
  }, [slideKey, strokes, texts, annotationsBySlide]);

  // Initial load for slideKey on mount
  useEffect(() => {
    const data = annotationsBySlide[slideKey];
    if (data) {
      setStrokes(data.strokes || []);
      setTexts(data.texts || []);
    }
  }, []);

  // Save current slide annotations whenever strokes or texts change
  const persistCurrentSlide = useCallback((newStrokes: Stroke[], newTexts: TextAnnotation[]) => {
    setAnnotationsBySlide(prevMap => {
      const updated = {
        ...prevMap,
        [slideKey]: { strokes: newStrokes, texts: newTexts }
      };
      try {
        localStorage.setItem('classroom_ta_overlay_annotations', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, [slideKey]);

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const renderStroke = (s: Stroke) => {
      if (s.points.length === 0) return;
      ctx.save();

      if (s.isHighlighter) {
        ctx.strokeStyle = s.color;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = s.width * 5;
      } else {
        ctx.strokeStyle = s.color;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = 0.95;
        ctx.lineWidth = s.width;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (s.points.length === 1) {
        ctx.beginPath();
        const r = s.isHighlighter ? (s.width * 5) / 2 : s.width / 2;
        ctx.arc(s.points[0].x, s.points[0].y, Math.max(r, 2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    strokes.forEach(renderStroke);
    if (currentStroke) renderStroke(currentStroke);

    // Draw text annotations
    texts.forEach(t => {
      ctx.save();
      ctx.font = `600 ${t.fontSize}px 'Fira Code', monospace, sans-serif`;
      ctx.fillStyle = t.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
  }, [strokes, currentStroke, texts]);

  // Handle window resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const performErase = (x: number, y: number) => {
    const radius = eraserSize;
    setStrokes(prev => {
      const filtered = prev.filter(s => !s.points.some(p => Math.hypot(p.x - x, p.y - y) <= radius));
      persistCurrentSlide(filtered, texts);
      return filtered;
    });
    setTexts(prev => {
      const filtered = prev.filter(t => Math.hypot(t.x - x, t.y - y) > radius + 15);
      persistCurrentSlide(strokes, filtered);
      return filtered;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'text') {
      if (activeTextInput) {
        commitText();
      }
      setActiveTextInput({ x, y });
      setTextInputValue('');
      return;
    }

    if (tool === 'eraser') {
      performErase(x, y);
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    setCurrentStroke({
      points: [{ x, y }],
      color,
      width: penWidth,
      isHighlighter: tool === 'highlighter'
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });

    if (!isActive) return;

    if (tool === 'eraser' && e.buttons === 1) {
      performErase(x, y);
      return;
    }

    if (currentStroke) {
      setCurrentStroke(prev => (prev ? { ...prev, points: [...prev.points, { x, y }] } : null));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (currentStroke) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      const updatedStrokes = [...strokes, currentStroke];
      setStrokes(updatedStrokes);
      persistCurrentSlide(updatedStrokes, texts);
      setCurrentStroke(null);
    }
  };

  const commitText = () => {
    if (activeTextInput && textInputValue.trim()) {
      const newText: TextAnnotation = {
        id: `txt-${Date.now()}`,
        x: activeTextInput.x,
        y: activeTextInput.y,
        text: textInputValue,
        color,
        fontSize: 18
      };
      const updatedTexts = [...texts, newText];
      setTexts(updatedTexts);
      persistCurrentSlide(strokes, updatedTexts);
    }
    setActiveTextInput(null);
    setTextInputValue('');
  };

  const undo = () => {
    if (texts.length > 0) {
      const updated = texts.slice(0, -1);
      setTexts(updated);
      persistCurrentSlide(strokes, updated);
    } else {
      const updated = strokes.slice(0, -1);
      setStrokes(updated);
      persistCurrentSlide(updated, texts);
    }
  };

  const clearSlide = () => {
    setStrokes([]);
    setTexts([]);
    setActiveTextInput(null);
    persistCurrentSlide([], []);
  };

  if (!isActive && strokes.length === 0 && texts.length === 0) return null;

  return (
    <div
      className={`fixed inset-0 z-40 ${
        isActive ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
      }`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Eraser Outline Preview Cursor */}
      {isActive && tool === 'eraser' && cursorPos && (
        <div
          className="fixed pointer-events-none rounded-full border-2 border-rose-400 bg-rose-500/10 z-50 transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            width: eraserSize * 2,
            height: eraserSize * 2,
          }}
        />
      )}

      {/* Active Floating Text Input */}
      {activeTextInput && (
        <div
          className="absolute z-50 pointer-events-auto flex items-center gap-1 bg-slate-900 border border-indigo-500 rounded-lg p-1.5 shadow-2xl"
          style={{ left: activeTextInput.x, top: activeTextInput.y - 20 }}
        >
          <input
            autoFocus
            type="text"
            placeholder="Type text for this slide..."
            value={textInputValue}
            onChange={e => setTextInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitText();
              if (e.key === 'Escape') setActiveTextInput(null);
            }}
            className="bg-transparent text-white font-mono text-sm px-2 py-1 outline-none border-b border-indigo-400 min-w-[200px]"
            style={{ color }}
          />
          <button
            onClick={commitText}
            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-semibold"
          >
            Add
          </button>
          <button
            onClick={() => setActiveTextInput(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Toolbar (Visible when pen mode is on) */}
      {isActive && (
        <div className="absolute top-16 right-6 bg-slate-900/95 border border-slate-700 shadow-2xl rounded-xl p-2.5 flex items-center gap-2 backdrop-blur pointer-events-auto">
          {/* Slide Indicator Badge */}
          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-1 rounded">
            {slideKey.toUpperCase()}
          </span>

          {/* Tool buttons */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setTool('pen')}
              title="Pen (P)"
              className={`p-1.5 rounded transition ${tool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Pen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('highlighter')}
              title="Highlighter (H)"
              className={`p-1.5 rounded transition ${tool === 'highlighter' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Highlighter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('text')}
              title="Type Text Tool (T)"
              className={`p-1.5 rounded transition ${tool === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              title="Eraser (E)"
              className={`p-1.5 rounded transition ${tool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Tool specific options */}
          {tool === 'eraser' ? (
            /* Eraser Size Selector */
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {[
                { size: 15, label: 'S (15px)' },
                { size: 30, label: 'M (30px)' },
                { size: 60, label: 'L (60px)' },
                { size: 100, label: 'XL (100px)' },
              ].map(opt => (
                <button
                  key={opt.size}
                  onClick={() => setEraserSize(opt.size)}
                  className={`px-2 py-0.5 text-xs font-mono rounded transition ${
                    eraserSize === opt.size
                      ? 'bg-rose-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            /* Color Palette and Width Selector */
            <>
              <div className="flex items-center gap-1.5 px-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <select
                value={penWidth}
                onChange={e => setPenWidth(parseInt(e.target.value))}
                className="bg-slate-950 text-white text-xs border border-slate-700 rounded px-1.5 py-1 focus:outline-none"
                title="Pen Width"
              >
                <option value="2">2px</option>
                <option value="4">4px</option>
                <option value="8">8px</option>
              </select>
            </>
          )}

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Undo and Clear */}
          <button
            onClick={undo}
            title="Undo"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={clearSlide}
            title="Clear current slide drawings"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Close Pen (D)"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
