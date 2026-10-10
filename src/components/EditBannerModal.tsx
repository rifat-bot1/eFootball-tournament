import React, { useState, useRef } from 'react';
import { X, Upload, Check, Image as ImageIcon, Sparkles, Link as LinkIcon } from 'lucide-react';
import { Tournament } from '../types/tournament';
import { BANNER_PRESETS, DEFAULT_BANNER, handleBannerError } from '../utils/imageUtils';

interface EditBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
  onUpdateBanner: (tournamentId: string, bannerUrl: string) => void;
}

export const EditBannerModal: React.FC<EditBannerModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onUpdateBanner
}) => {
  const [selectedBanner, setSelectedBanner] = useState<string>(
    tournament?.bannerUrl || DEFAULT_BANNER
  );
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (tournament) {
      setSelectedBanner(tournament.bannerUrl || DEFAULT_BANNER);
    }
  }, [tournament, isOpen]);

  if (!isOpen || !tournament) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setSelectedBanner(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onUpdateBanner(tournament.id, selectedBanner);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-[#00ff87]/20 p-2 text-[#00ff87] border border-[#00ff87]/40">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Change Tournament Banner
              </h2>
              <p className="text-[11px] text-slate-400">
                {tournament.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Live Banner Preview */}
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
              Current Banner Preview
            </span>
            <div className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
              <img
                src={selectedBanner}
                alt="Banner Preview"
                className="h-full w-full object-cover"
                onError={(e) => handleBannerError(e, DEFAULT_BANNER)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-xs font-black text-white drop-shadow">
                  {tournament.title}
                </span>
              </div>
            </div>
          </div>

          {/* Preset Theme Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Choose HD Vector Theme
              </span>
              <span className="text-[10px] text-[#00ff87] font-semibold">
                Fast &amp; Offline Ready
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BANNER_PRESETS.map((preset) => {
                const isSelected = selectedBanner === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedBanner(preset.url)}
                    className={`relative rounded-xl overflow-hidden border p-1 text-left transition ${
                      isSelected 
                        ? 'border-[#00ff87] bg-[#00ff87]/10 ring-1 ring-[#00ff87]' 
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="relative h-14 w-full rounded-lg overflow-hidden bg-slate-900">
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="h-full w-full object-cover"
                        onError={(e) => handleBannerError(e, DEFAULT_BANNER)}
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 rounded-full bg-[#00ff87] p-0.5 text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="block text-[11px] font-bold text-slate-200 mt-1 truncate">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload or Custom URL Controls */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-slate-200 hover:border-[#00ff87] hover:text-white transition"
            >
              <Upload className="w-3.5 h-3.5 text-[#00ff87]" />
              <span>Upload from Device (গ্যালারি থেকে ফটো)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 hover:text-white transition"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Image URL</span>
            </button>
          </div>

          {showUrlInput && (
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customUrl.trim()) {
                    setSelectedBanner(customUrl.trim());
                  }
                }}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                Apply
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-6 py-2 text-xs font-black uppercase text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition"
            >
              <Check className="w-4 h-4" />
              <span>Save Banner</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
