import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Pen, Highlighter, Eraser, RotateCcw, Trash2, Grid, Type } from 'lucide-react';

interface WhiteboardModalProps {
  isOpen: boolean;
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

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [texts, setTexts] = useState<TextAnnotation[]>([]);
  const [activeTextInput, setActiveTextInput] = useState<{ x: number; y: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState<string>('');

  const [color, setColor] = useState<string>('#ffffff');
  const [penWidth, setPenWidth] = useState<number>(3);
  const [eraserSize, setEraserSize] = useState<number>(30); // 15, 30, 60, 100
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'text' | 'eraser'>('pen');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const COLORS = ['#ffffff', '#facc15', '#f87171', '#38bdf8', '#4ade80', '#c084fc'];

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
      ctx.shadowBlur = 6;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
  }, [strokes, currentStroke, texts]);

  // Handle canvas sizing when modal opens or resizes
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, redraw]);

  useEffect(() => {
    if (isOpen) {
      redraw();
    }
  }, [isOpen, redraw]);

  const performErase = (x: number, y: number) => {
    const radius = eraserSize;
    setStrokes(prev =>
      prev.filter(s => !s.points.some(p => Math.hypot(p.x - x, p.y - y) <= radius))
    );
    setTexts(prev =>
      prev.filter(t => Math.hypot(t.x - x, t.y - y) > radius + 20)
    );
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
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
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  const commitText = () => {
    if (activeTextInput && textInputValue.trim()) {
      setTexts(prev => [
        ...prev,
        {
          id: `wb-txt-${Date.now()}`,
          x: activeTextInput.x,
          y: activeTextInput.y,
          text: textInputValue,
          color,
          fontSize: 20
        }
      ]);
    }
    setActiveTextInput(null);
    setTextInputValue('');
  };

  const undo = () => {
    if (texts.length > 0) {
      setTexts(prev => prev.slice(0, -1));
    } else {
      setStrokes(prev => prev.slice(0, -1));
    }
  };

  const clear = () => {
    setStrokes([]);
    setTexts([]);
    setActiveTextInput(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none">
      {/* Grid Pattern Background */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle, #6366f1 1.5px, transparent 1.5px)',
            backgroundSize: '36px 36px'
          }}
        />
      )}

      {/* Eraser Outline Preview Cursor */}
      {tool === 'eraser' && cursorPos && (
        <div
          className="fixed pointer-events-none rounded-full border-2 border-rose-400 bg-rose-500/15 z-50 transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            width: eraserSize * 2,
            height: eraserSize * 2,
          }}
        />
      )}

      {/* Top Header & Toolbar */}
      <div className="relative z-20 h-14 bg-slate-900/95 border-b border-slate-800 px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm tracking-wide text-white uppercase">
            Classroom Whiteboard
          </span>
          <span className="text-xs text-indigo-400 font-mono">Full Scratchpad Mode</span>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setTool('pen')}
              title="Pen"
              className={`p-1.5 rounded transition ${tool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Pen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('highlighter')}
              title="Highlighter"
              className={`p-1.5 rounded transition ${tool === 'highlighter' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Highlighter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('text')}
              title="Text Tool (Type mathematical notes)"
              className={`p-1.5 rounded transition ${tool === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              title="Eraser"
              className={`p-1.5 rounded transition ${tool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Tool specific options */}
          {tool === 'eraser' ? (
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
            <>
              <div className="flex items-center gap-1.5 px-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-indigo-500' : 'opacity-80 hover:opacity-100'}`}
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

          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid Dots"
            className={`p-1.5 rounded border transition ${showGrid ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40' : 'text-slate-400 border-slate-700 hover:text-white'}`}
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={undo}
            title="Undo"
            className="p-1.5 text-slate-400 hover:text-white rounded transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={clear}
            title="Clear All"
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition"
        >
          <X className="w-4 h-4" />
          Close (Esc / W)
        </button>
      </div>

      {/* Floating Active Text Input on Whiteboard */}
      {activeTextInput && (
        <div
          className="absolute z-50 pointer-events-auto flex items-center gap-1 bg-slate-900 border border-indigo-500 rounded-lg p-1.5 shadow-2xl"
          style={{ left: activeTextInput.x, top: activeTextInput.y - 24 }}
        >
          <input
            autoFocus
            type="text"
            placeholder="Type note or math derivation..."
            value={textInputValue}
            onChange={e => setTextInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitText();
              if (e.key === 'Escape') setActiveTextInput(null);
            }}
            className="bg-transparent text-white font-mono text-base px-2 py-1 outline-none border-b border-indigo-400 min-w-[240px]"
            style={{ color }}
          />
          <button
            onClick={commitText}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-semibold"
          >
            Place
          </button>
          <button
            onClick={() => setActiveTextInput(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 w-full h-full cursor-crosshair block relative z-10"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
};
