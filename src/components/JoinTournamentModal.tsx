import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Send, 
  Check, 
  Gamepad2, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  AlertCircle,
  Copy,
  Sparkles
} from 'lucide-react';
import { Tournament, UserProfile } from '../types/tournament';

interface JoinTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
  currentUser: UserProfile;
  onConfirmJoin: (
    tournamentId: string, 
    playerData: {
      name: string;
      efootballId: string;
      email: string;
      phone?: string;
      favoriteClub: string;
      division: string;
    }
  ) => Promise<void>;
}

export const JoinTournamentModal: React.FC<JoinTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  currentUser,
  onConfirmJoin
}) => {
  const [playerName, setPlayerName] = useState(currentUser.name || '');
  const [efootballId, setEfootballId] = useState(currentUser.efootballId || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(
    localStorage.getItem('efootball_saved_phone') || ''
  );
  const [favoriteClub, setFavoriteClub] = useState(currentUser.favoriteClub || 'FC Barcelona');
  const [division, setDivision] = useState(currentUser.division || 'Division 1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setPlayerName(currentUser.name || '');
      setEfootballId(currentUser.efootballId || '');
      setEmail(currentUser.email || '');
      setFavoriteClub(currentUser.favoriteClub || 'FC Barcelona');
      setDivision(currentUser.division || 'Division 1');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !tournament) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      return setError('Please enter your player name.');
    }
    if (!efootballId.trim()) {
      return setError('Please enter your eFootball In-Game ID (e.g. 6595302089).');
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (phone.trim()) {
        localStorage.setItem('efootball_saved_phone', phone.trim());
      }

      await onConfirmJoin(tournament.id, {
        name: playerName.trim(),
        efootballId: efootballId.trim(),
        email: email.trim(),
        phone: phone.trim(),
        favoriteClub: favoriteClub.trim(),
        division
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to join tournament.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] p-2 text-slate-950 font-black">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Join Tournament
              </h2>
              <p className="text-[11px] text-slate-400">
                {tournament.title} • {tournament.format.toUpperCase()}
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

        {/* Telegram Notice Banner */}
        <div className="mx-4 mt-4 sm:mx-5 sm:mt-5 flex items-start gap-2.5 rounded-xl border border-sky-500/30 bg-sky-950/40 p-3 text-xs text-sky-200">
          <Send className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sky-300 block mb-0.5">
              📢 Telegram Live Notification:
            </span>
            <p className="text-[11px] text-slate-300">
              আপনি জয়েন করার সাথে সাথেই আপনার <strong>নাম, eFootball ID, ক্লাব ও ডিটেইলস</strong> আমাদের অফিসিয়াল{' '}
              <a 
                href="https://t.me/eFootballTournamentBD" 
                target="_blank" 
                rel="noreferrer"
                className="text-sky-400 underline font-bold"
              >
                @eFootballTournamentBD
              </a>{' '}
              টেলিগ্রাম চ্যানেলে নোটিফিকেশন হিসেবে চলে যাবে।
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tournament Overview Pill */}
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-950/70 p-2.5 border border-slate-800 text-center text-[11px]">
            <div>
              <span className="text-slate-500 block">Slots</span>
              <strong className="text-white">
                {tournament.registeredPlayerIds.length}/{tournament.maxPlayers}
              </strong>
            </div>
            <div className="border-x border-slate-800">
              <span className="text-slate-500 block">Reward</span>
              <strong className="text-amber-400 truncate block px-1">
                {tournament.prizePool || 'Coins'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Match Time</span>
              <strong className="text-[#00ff87]">{tournament.rules.matchLength}</strong>
            </div>
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Player Name / গেমার নাম <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Mohammad Rifat"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-white focus:border-[#00ff87] focus:outline-none"
              />
            </div>
          </div>

          {/* eFootball In-Game ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                eFootball In-Game ID <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-medium">
                (আইডি সব সময় সেভ থাকবে)
              </span>
            </div>
            <div className="relative">
              <Gamepad2 className="w-4 h-4 text-[#00ff87] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={efootballId}
                onChange={(e) => setEfootballId(e.target.value)}
                placeholder="e.g. 6595302089"
                className="w-full rounded-xl bg-slate-950 border border-[#00ff87]/40 pl-9 pr-3 py-2.5 text-xs sm:text-sm font-mono font-bold text-white focus:border-[#00ff87] focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Opponent will copy this ID to create the Friend Match in eFootball Mobile.
            </p>
          </div>

          {/* Club & Division */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Favorite Club / টিম
              </label>
              <input
                type="text"
                value={favoriteClub}
                onChange={(e) => setFavoriteClub(e.target.value)}
                placeholder="e.g. FC Barcelona"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                In-Game Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
              >
                <option value="Division 1">Division 1 (Top Tier)</option>
                <option value="Division 2">Division 2</option>
                <option value="Division 3">Division 3</option>
                <option value="Division 4">Division 4</option>
                <option value="Division 5">Division 5</option>
              </select>
            </div>
          </div>

          {/* Contact (Email & Phone) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rfrifatbs@gmail.com"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-8 pr-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                WhatsApp / Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-8 pr-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Sending to Telegram...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Join &amp; Notify Telegram</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
