import React, { useState, useRef } from 'react';
import { 
  X, 
  Trophy, 
  Clock, 
  Gamepad2, 
  Coins, 
  Users, 
  Calendar, 
  Check, 
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { TournamentRules } from '../types/tournament';
import { BANNER_PRESETS, DEFAULT_BANNER, handleBannerError } from '../utils/imageUtils';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTournament: (data: {
    title: string;
    description: string;
    format: 'knockout' | 'league';
    maxPlayers: number;
    prizePool: string;
    rules: TournamentRules;
    bannerUrl?: string;
    entryFee?: number;
  }) => Promise<void>;
}

export const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({
  isOpen,
  onClose,
  onCreateTournament
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<'knockout' | 'league'>('knockout');
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [entryFee, setEntryFee] = useState<number>(0);
  const [prizePool, setPrizePool] = useState('2,500 eFootball Coins + Champion Role');
  const [matchLength, setMatchLength] = useState('10 Mins');
  const [extraTime, setExtraTime] = useState(false);
  const [penalties, setPenalties] = useState(true);
  const [playerCondition, setPlayerCondition] = useState('Excellent');
  const [bannerUrl, setBannerUrl] = useState(DEFAULT_BANNER);
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setBannerUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Please enter a tournament title.');

    try {
      setIsSubmitting(true);
      setError('');
      await onCreateTournament({
        title: title.trim(),
        description: description.trim() || 'Official eFootball Community Tournament.',
        format,
        maxPlayers: Number(maxPlayers),
        prizePool: prizePool.trim(),
        entryFee: Number(entryFee) || 0,
        rules: {
          matchLength,
          extraTime,
          penalties,
          playerCondition,
          injuries: false,
          substitutions: 5
        },
        bannerUrl
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create tournament.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-gradient-to-r from-amber-400 to-[#00ff87] p-2 text-slate-950 font-black">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Create eFootball Tournament
              </h2>
              <p className="text-[11px] text-slate-400">
                Setup rules, brackets &amp; automatic Telegram broadcast
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tournament Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. eFootball Champions Cup Season 2026"
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs sm:text-sm text-white focus:border-[#00ff87] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Brief Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Open knockout cup for all mobile players. Upload screenshot after match."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Format
              </label>
              <select
                value={format}
                onChange={(e: any) => setFormat(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none font-semibold"
              >
                <option value="knockout">Single Knockout Cup</option>
                <option value="league">Round-Robin League</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Max Player Slots
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none font-semibold"
              >
                <option value={4}>4 Players (Semi + Final)</option>
                <option value={8}>8 Players (Quarter-Finals)</option>
                <option value={16}>16 Players (Round of 16)</option>
                <option value={32}>32 Players (Big Open)</option>
              </select>
            </div>
          </div>

          {/* Rules Configuration */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-3">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#00ff87]">
              eFootball Game Rules Configuration
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Match Length</label>
                <select
                  value={matchLength}
                  onChange={(e) => setMatchLength(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="8 Mins">8 Mins</option>
                  <option value="10 Mins">10 Mins (Standard)</option>
                  <option value="12 Mins">12 Mins</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Condition</label>
                <select
                  value={playerCondition}
                  onChange={(e) => setPlayerCondition(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="Excellent">Excellent (Green Arrow)</option>
                  <option value="Random">Random</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={penalties}
                  onChange={(e) => setPenalties(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-[#00ff87] focus:ring-0"
                />
                <span>Penalties ON</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={extraTime}
                  onChange={(e) => setExtraTime(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-[#00ff87] focus:ring-0"
                />
                <span>Extra Time ON</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Entry Fee (৳ BDT)
              </label>
              <input
                type="number"
                min={0}
                value={entryFee}
                onChange={(e) => setEntryFee(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0 (Free)"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Prize / Reward
              </label>
              <input
                type="text"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                placeholder="e.g. 5,000 Coins / ৳1,500"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
              />
            </div>
          </div>

          {/* Tournament Cover Banner Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#00ff87]" />
                <span>Tournament Banner Theme</span>
              </label>
              <span className="text-[10px] text-slate-400">
                HD Vector Artwork
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BANNER_PRESETS.map((preset) => {
                const isSelected = bannerUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setBannerUrl(preset.url)}
                    className={`relative rounded-xl overflow-hidden border p-1 text-left transition group ${
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

            {/* Custom Upload or URL Options */}
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
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-[#00ff87] hover:text-white transition"
              >
                <Upload className="w-3.5 h-3.5 text-[#00ff87]" />
                <span>Upload Custom Banner (গ্যালারি থেকে)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Image URL</span>
              </button>
            </div>

            {showUrlInput && (
              <div className="mt-2 flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/stadium-banner.jpg"
                  className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrl.trim()) {
                      setBannerUrl(customUrl.trim());
                    }
                  }}
                  className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Live Banner Preview Box */}
            <div className="mt-2.5 relative h-24 w-full rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950">
              <img
                src={bannerUrl}
                alt="Banner Preview"
                className="h-full w-full object-cover"
                onError={(e) => handleBannerError(e, DEFAULT_BANNER)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                <span className="text-[11px] font-bold text-slate-200 drop-shadow flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#00ff87]" /> Selected Tournament Header Banner
                </span>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-6 py-2.5 text-xs font-black uppercase text-slate-950 shadow-lg shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Tournament & Broadcast'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
