'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker (client-side only to avoid SSR issues in Next.js)
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  file: Blob | string;
}

export default function PDFViewer({ file }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle responsiveness
  const onResize = useCallback((entries: ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver(onResize);
    observer.observe(node);

    return () => {
      observer.unobserve(node);
      observer.disconnect();
    };
  }, [onResize]);

  useEffect(() => {
    if (file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(file);
    }
  }, [file]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
  }

  // Prevent right-click and common shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Ctrl+P, Ctrl+S, Ctrl+U
      if (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col items-center bg-slate-900 min-h-screen select-none relative" ref={containerRef}>
      {/* Toolbar - Sticky and Adaptive */}
      <div className="sticky top-0 z-20 w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-3 border-b border-white/10 shadow-xl">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-white text-sm sm:text-sm font-semibold min-w-[60px] text-center">
            {pageNumber} / {numPages || '--'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || prev))}
            disabled={numPages === null || pageNumber >= numPages}
            className="text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScale(prev => Math.max(prev - 0.2, 0.4))}
            className="text-white hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-9"
          >
            <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <span className="text-white text-xs sm:text-sm font-medium min-w-[40px] sm:min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScale(prev => Math.min(prev + 0.2, 3.0))}
            className="text-white hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-9"
          >
            <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScale(1.0)}
            className="text-white hover:bg-white/10 text-[10px] sm:text-xs hidden sm:flex"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* PDF Document Container */}
      <div className="flex-1 w-full flex justify-center overflow-auto py-6 px-2 sm:px-4">
        <div className="shadow-2xl border border-slate-700 rounded-sm sm:rounded-lg overflow-hidden bg-white h-fit">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-slate-400">
                <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mb-4" />
                <p className="text-sm sm:text-base">Loading document...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-red-400">
                <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 mb-4" />
                <p className="text-sm sm:text-base">Failed to load PDF</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              width={containerWidth ? Math.min(containerWidth - 32, 1200) : undefined}
              renderAnnotationLayer={true}
              renderTextLayer={true}
              className="max-w-full"
            />
          </Document>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="w-full bg-slate-900/90 py-4 px-4 border-t border-white/5">
        <p className="text-slate-500 text-[10px] sm:text-xs text-center max-w-md mx-auto italic">
          This document is protected. Unauthorized distribution or reproduction is prohibited.
          Your activity is being monitored by InvertisPrep Security.
        </p>
      </div>
    </div>
  );
}
