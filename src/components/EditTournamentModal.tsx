import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Coins, 
  Clock, 
  Users, 
  Gamepad2, 
  Calendar, 
  Check, 
  AlertCircle,
  Save,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { Tournament, TournamentRules } from '../types/tournament';
import { BANNER_PRESETS, DEFAULT_BANNER } from '../utils/imageUtils';

interface EditTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
  onUpdateTournament: (tournamentId: string, updates: Partial<Tournament>) => void;
  onDeleteTournament?: (tournamentId: string) => void;
}

export const EditTournamentModal: React.FC<EditTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onUpdateTournament,
  onDeleteTournament
}) => {
  if (!isOpen || !tournament) return null;

  const [title, setTitle] = useState(tournament.title);
  const [description, setDescription] = useState(tournament.description);
  const [entryFee, setEntryFee] = useState<number>(tournament.entryFee || 0);
  const [prizePool, setPrizePool] = useState(tournament.prizePool);
  const [maxPlayers, setMaxPlayers] = useState<number>(tournament.maxPlayers);
  const [format, setFormat] = useState<'knockout' | 'league'>(tournament.format);
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'completed'>(tournament.status);
  const [matchLength, setMatchLength] = useState(tournament.rules.matchLength || '10 Mins');
  const [extraTime, setExtraTime] = useState(Boolean(tournament.rules.extraTime));
  const [penalties, setPenalties] = useState(Boolean(tournament.rules.penalties));
  const [playerCondition, setPlayerCondition] = useState(tournament.rules.playerCondition || 'Excellent');
  const [bannerUrl, setBannerUrl] = useState(tournament.bannerUrl || DEFAULT_BANNER);
  const [startDate, setStartDate] = useState(tournament.startDate?.slice(0, 16) || '');
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (tournament) {
      setTitle(tournament.title);
      setDescription(tournament.description);
      setEntryFee(tournament.entryFee || 0);
      setPrizePool(tournament.prizePool);
      setMaxPlayers(tournament.maxPlayers);
      setFormat(tournament.format);
      setStatus(tournament.status);
      setMatchLength(tournament.rules.matchLength || '10 Mins');
      setExtraTime(Boolean(tournament.rules.extraTime));
      setPenalties(Boolean(tournament.rules.penalties));
      setPlayerCondition(tournament.rules.playerCondition || 'Excellent');
      setBannerUrl(tournament.bannerUrl || DEFAULT_BANNER);
      setStartDate(tournament.startDate?.slice(0, 16) || '');
    }
  }, [tournament]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Tournament title is required');
      return;
    }

    try {
      setError('');
      onUpdateTournament(tournament.id, {
        title: title.trim(),
        description: description.trim(),
        entryFee: Number(entryFee) || 0,
        prizePool: prizePool.trim(),
        maxPlayers: Number(maxPlayers),
        format,
        status,
        rules: {
          ...tournament.rules,
          matchLength,
          extraTime,
          penalties,
          playerCondition
        },
        bannerUrl,
        startDate: startDate ? new Date(startDate).toISOString() : tournament.startDate
      });

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err?.message || 'Failed to update tournament.');
    }
  };

  const handleDelete = () => {
    if (confirm(`⚠️ আপনি কি নিশ্চিত "${tournament.title}" টুর্নামেন্টটি ডিলিট করতে চান? এটি টুর্নামেন্ট ও এর ম্যাচসমূহ স্থায়ীভাবে মুছে ফেলবে।\n\nAre you sure you want to delete tournament "${tournament.title}"? This cannot be undone.`)) {
      if (onDeleteTournament) {
        onDeleteTournament(tournament.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md pt-[max(env(safe-area-inset-top,0px),36px)] pb-[max(env(safe-area-inset-bottom,0px),50px)] px-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 p-2 text-slate-950 font-black">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Customize Tournament & Entry Fee
              </h2>
              <p className="text-[11px] text-slate-400">
                Admin Control • ID: <span className="font-mono text-slate-300">{tournament.id}</span>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tournament Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Tournament Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:border-[#00ff87] focus:outline-none"
            />
          </div>

          {/* Entry Fee (৳ BDT) & Prize Pool in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Entry Fee (৳ BDT)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {entryFee === 0 ? 'FREE' : `৳${entryFee}`}
                </span>
              </div>
              <input
                type="number"
                min={0}
                step={5}
                required
                value={entryFee}
                onChange={(e) => setEntryFee(Math.max(0, Number(e.target.value)))}
                placeholder="0 for Free"
                className="w-full rounded-xl bg-slate-900 border border-amber-500/50 px-3 py-2 text-sm font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Set <strong>0</strong> for Free tournament, or custom amount like 50, 100, 200 BDT.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Prize Pool / Reward
              </label>
              <input
                type="text"
                required
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                placeholder="e.g. ৳১,০০০ বা 2500 Coins"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Amount or Coins for champion & runner-up.
              </p>
            </div>
          </div>

          {/* Format, Status & Max Players */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Tournament Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
              >
                <option value="knockout">Knockout (Single Elimination)</option>
                <option value="league">Round Robin League</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
              >
                <option value="upcoming">Upcoming (Registration Open)</option>
                <option value="ongoing">Ongoing (Matches in Progress)</option>
                <option value="completed">Completed (Archived)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Max Players (Slots)
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
              >
                <option value={4}>4 Players</option>
                <option value={8}>8 Players</option>
                <option value={16}>16 Players</option>
                <option value={32}>32 Players</option>
                <option value={64}>64 Players</option>
              </select>
            </div>
          </div>

          {/* Match Rules: Length, Extra Time, Penalties, Condition */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 block mb-1">
              Match Rules & Game Settings
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Match Time</label>
                <select
                  value={matchLength}
                  onChange={(e) => setMatchLength(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 p-1.5 text-xs text-white"
                >
                  <option value="8 Mins">8 Mins</option>
                  <option value="10 Mins">10 Mins</option>
                  <option value="12 Mins">12 Mins</option>
                  <option value="15 Mins">15 Mins</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Condition</label>
                <select
                  value={playerCondition}
                  onChange={(e) => setPlayerCondition(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 p-1.5 text-xs text-white"
                >
                  <option value="Excellent">Excellent (Top)</option>
                  <option value="Normal">Normal</option>
                  <option value="Random">Random</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={extraTime}
                    onChange={(e) => setExtraTime(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-[#00ff87] focus:ring-0"
                  />
                  <span>Extra Time</span>
                </label>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={penalties}
                    onChange={(e) => setPenalties(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-[#00ff87] focus:ring-0"
                  />
                  <span>Penalties (PK)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:border-[#00ff87] focus:outline-none"
            />
          </div>

          {/* Banner Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Banner Preset
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BANNER_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => setBannerUrl(preset.url)}
                  className={`cursor-pointer rounded-lg border overflow-hidden p-1 text-center transition ${
                    bannerUrl === preset.url
                      ? 'border-[#00ff87] bg-[#00ff87]/10'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="h-10 w-full object-cover rounded mb-1" />
                  <span className="text-[10px] text-slate-400 truncate block">{preset.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {onDeleteTournament ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Tournament</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-6 py-2 text-xs font-black uppercase text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition"
              >
                {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{isSaved ? 'Saved!' : 'Save Changes'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
