"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/app/components/ui/dialog';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;

interface PhotoViewerProps {
  src: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhotoViewer({ src, open, onOpenChange }: PhotoViewerProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, translateX: 0, translateY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const resetTransform = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!open) resetTransform();
  }, [open, resetTransform]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      setScale((s) => {
        const next = e.deltaY < 0 ? s + SCALE_STEP : s - SCALE_STEP;
        return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
      });
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        translateX: translate.x,
        translateY: translate.y,
      };
    },
    [scale, translate]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setTranslate({
        x: dragStart.current.translateX + e.clientX - dragStart.current.x,
        y: dragStart.current.translateY + e.clientY - dragStart.current.y,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP));
  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed left-1/2 top-1/2 z-50 flex h-[90vh] max-h-[90vh] w-[90vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col gap-0 rounded-xl border-0 bg-black/95 p-0 shadow-2xl focus:outline-none [&_button]:text-white [&_button]:hover:bg-white/20 [&_button]:focus:ring-white/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        onWheel={handleWheel}
        onWheelCapture={(e) => e.preventDefault()}
      >
        {/* Zoom controls */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-white/10 p-1.5 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-white hover:bg-white/20 disabled:opacity-40"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <span className="flex min-w-[3rem] items-center justify-center text-sm font-medium text-white">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-white hover:bg-white/20 disabled:opacity-40"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
        </div>

        {/* Pannable/zoomable area - centered in modal */}
        <div
          ref={containerRef}
          className="flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden rounded-xl"
          onMouseDown={handleMouseDown}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <img
            src={src}
            alt=""
            className="max-h-full max-w-full select-none object-contain"
            draggable={false}
            style={{
              transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
