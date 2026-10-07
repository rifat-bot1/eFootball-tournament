import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already installed and running standalone, do not show install CTA
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-[#00ff87] border border-emerald-500/20">
        <Check className="w-3.5 h-3.5" />
        <span>PWA Installed</span>
      </div>
    );
  }

  // Android / Chromium / Edge / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={async () => {
          const success = await install();
          if (success) setInstalledSuccess(true);
        }}
        className={`flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-lg shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition-all ${
          compact ? 'px-2 py-1 text-[11px]' : ''
        }`}
        title="Install eFootball Tournament Arena to your Home Screen"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#00ff87]/30 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-[#00ff87] hover:bg-[#00ff87]/10 transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#00ff87]" />
                  <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00ff87]/20 text-[#00ff87] flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  <span>
                    In Safari, tap the <strong>Share</strong> button (box with upward arrow) at the bottom toolbar.
                  </span>
                </div>
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00ff87]/20 text-[#00ff87] flex items-center justify-center font-bold text-xs">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00ff87]/20 text-[#00ff87] flex items-center justify-center font-bold text-xs">
                    3
                  </span>
                  <span>
                    Tap <strong>Add</strong> in the top-right corner to play with full-screen gaming mode!
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] py-2.5 text-sm font-bold text-slate-950 hover:brightness-110 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback banner for desktop browsers without prompt
  return (
    <button
      onClick={() => alert('To install, open this app in Chrome, Edge, or mobile Safari, then choose "Install App" or "Add to Home Screen".')}
      className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-[#00ff87] hover:border-[#00ff87]/40 transition-colors"
    >
      <Download className="w-3.5 h-3.5 text-[#00ff87]" />
      <span>PWA Ready</span>
    </button>
  );
};
