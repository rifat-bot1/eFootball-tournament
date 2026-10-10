import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Eye, ExternalLink } from 'lucide-react';
import { SAMPLE_MATCH_SCREENSHOT } from '../services/mockData';

interface ScreenshotInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

export const ScreenshotInspectModal: React.FC<ScreenshotInspectModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title
}) => {
  const [scale, setScale] = useState(1);

  if (!isOpen) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `efootball-result-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-5">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[95vh] rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#00ff87]" />
            <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
              {title || 'Match Screenshot Verification'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(Math.min(2.5, scale + 0.25))}
              className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.25))}
              className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale(1)}
              className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-white"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-white"
              title="Download Screenshot"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image viewport */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950/90 min-h-[300px]">
          <div style={{ transform: `scale(${scale})`, transition: 'transform 0.15s ease-out' }}>
            <img 
              src={imageUrl} 
              alt="Match result screenshot"
              className="max-h-[75vh] max-w-full rounded-xl shadow-2xl object-contain border border-slate-800"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== SAMPLE_MATCH_SCREENSHOT) {
                  target.src = SAMPLE_MATCH_SCREENSHOT;
                }
              }}
            />
          </div>
        </div>

        {/* Footer note */}
        <div className="border-t border-slate-800 bg-slate-900/60 px-4 py-2 text-center text-[11px] text-slate-400 flex-shrink-0">
          Inspect team names, goal counts, and in-game statistics to confirm official result.
        </div>

      </div>
    </div>
  );
};
