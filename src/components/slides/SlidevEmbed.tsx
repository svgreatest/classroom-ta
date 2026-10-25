import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface SlidevEmbedProps {
  lessonId: string;
  isDrawingActive: boolean;
  onSlideChange?: (slideIndex: number) => void;
}

export const SlidevEmbed: React.FC<SlidevEmbedProps> = ({ lessonId, isDrawingActive, onSlideChange }) => {
  const [slidevPort, setSlidevPort] = useState<number>(3030);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Listen for Slidev embedded navigation state updates
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.target === 'slidev' && e.data.navState) {
        const slideNo = e.data.navState.no;
        if (typeof slideNo === 'number' && slideNo >= 1) {
          onSlideChange?.(slideNo - 1);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSlideChange]);

  // Sync lesson with Slidev backend
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    fetch('/api/slidev/set-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.port) setSlidevPort(data.port);
        setIsLoading(false);
        // Not ready yet: show the retry screen instead of loading a dead iframe
        if (data.success === false) {
          setHasError(true);
          return;
        }
        setReloadKey(prev => prev + 1);
      })
      .catch(err => {
        console.error('Failed to notify Slidev of lesson switch:', err);
        setHasError(true);
        setIsLoading(false);
      });
  }, [lessonId]);

  const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
  const slidevUrl = `http://${host}:${slidevPort}/?embedded=true`;

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    fetch('/api/slidev/set-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.port) setSlidevPort(data.port);
        setIsLoading(false);
        if (data.success === false) {
          setHasError(true);
          return;
        }
        setReloadKey(prev => prev + 1);
      })
      .catch(() => {
        setHasError(true);
        setIsLoading(false);
      });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#141413] select-none">
      {/* Main Slidev Viewport (Full Height, No Redundant Sub-bar) */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-black">
        {isLoading && (
          <div className="absolute inset-0 bg-[#181816]/95 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <RefreshCw className="w-8 h-8 text-[#cc785c] animate-spin mb-3" />
            <div className="text-sm font-semibold text-[#faf6ee]">Loading {lessonId} Slides...</div>
            <div className="text-xs text-[#9e978c] mt-1">Connecting to Slidev instance on port {slidevPort}</div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 bg-[#181816] flex flex-col items-center justify-center z-20 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
            <div className="text-base font-bold text-[#faf6ee]">Slidev Server Initializing</div>
            <p className="text-xs text-[#9e978c] max-w-md mt-2">
              Slidev is preparing the slide deck for {lessonId}. Click below to retry.
            </p>
            <button
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-[#cc785c] text-white rounded-lg text-xs font-semibold hover:bg-[#d98367] transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Embedded Iframe */}
        <iframe
          ref={iframeRef}
          key={`${lessonId}-${reloadKey}`}
          src={slidevUrl}
          title="Slidev Lecture Slides"
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          style={{
            pointerEvents: isDrawingActive ? 'none' : 'auto'
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; screen-wake-lock"
          allowFullScreen
        />
      </div>
    </div>
  );
};
