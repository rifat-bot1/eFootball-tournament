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
  Sparkles,
  Coins,
  Wallet,
  Info
} from 'lucide-react';
import { Tournament, UserProfile } from '../types/tournament';
import { getAppSettings } from '../services/settingsService';

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
  onOpenDeposit?: () => void;
}

export const JoinTournamentModal: React.FC<JoinTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  currentUser,
  onConfirmJoin,
  onOpenDeposit
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

  const userBalance = currentUser.balance || 0;
  const entryFee = tournament?.entryFee || 0;
  const hasEnoughBalance = userBalance >= entryFee;

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

    if (entryFee > 0 && !hasEnoughBalance) {
      return setError(`Insufficient balance! (অপর্যাপ্ত ব্যালেন্স) You need ৳${entryFee} to join, but have ৳${userBalance}. Please deposit money to your wallet.`);
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tournament Overview Pill */}
          <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-950/70 p-2.5 border border-slate-800 text-center text-[11px]">
            <div>
              <span className="text-slate-500 block">Slots</span>
              <strong className="text-white">
                {tournament.registeredPlayerIds.length}/{tournament.maxPlayers}
              </strong>
            </div>
            <div className="border-l border-slate-800">
              <span className="text-slate-500 block">Entry Fee</span>
              <strong className={tournament.entryFee ? "text-amber-300 font-bold" : "text-[#00ff87] font-bold"}>
                {tournament.entryFee ? `৳${tournament.entryFee}` : 'FREE'}
              </strong>
            </div>
            <div className="border-l border-slate-800">
              <span className="text-slate-500 block">Reward</span>
              <strong className="text-amber-400 truncate block px-1">
                {tournament.prizePool || 'Coins'}
              </strong>
            </div>
            <div className="border-l border-slate-800">
              <span className="text-slate-500 block">Duration</span>
              <strong className="text-[#00ff87]">{tournament.rules.matchLength}</strong>
            </div>
          </div>

          {/* Entry Fee & Wallet Deduction Card */}
          {tournament.entryFee && tournament.entryFee > 0 ? (
            <div className={`rounded-xl p-3 text-xs space-y-2 border ${
              hasEnoughBalance 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Fee: ৳{tournament.entryFee}</span>
                </span>
                <span className="font-mono text-white text-[11px]">
                  Wallet: <strong className={hasEnoughBalance ? 'text-[#00ff87]' : 'text-rose-400 font-bold'}>৳{userBalance}</strong>
                </span>
              </div>

              {hasEnoughBalance ? (
                <div className="flex items-center gap-1.5 text-emerald-300 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-[#00ff87] shrink-0" />
                  <span>Wallet থেকে ৳{tournament.entryFee} স্বয়ংক্রিয়ভাবে কাটা হবে</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-300 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>অপর্যাপ্ত ব্যালেন্স (৳{tournament.entryFee} প্রয়োজন)</span>
                  </div>
                  {onOpenDeposit && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenDeposit();
                      }}
                      className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-bold hover:brightness-110 transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Deposit</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/30 p-2.5 text-[11px] text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-[#00ff87] shrink-0" />
              <span>Free Entry (৳০)</span>
            </div>
          )}

          {/* Player Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Player Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Name"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-xs sm:text-sm font-semibold text-white focus:border-[#00ff87] focus:outline-none"
              />
            </div>
          </div>

          {/* eFootball In-Game ID */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              eFootball ID <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Gamepad2 className="w-4 h-4 text-[#00ff87] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={efootballId}
                onChange={(e) => setEfootballId(e.target.value)}
                placeholder="6595302089"
                className="w-full rounded-xl bg-slate-950 border border-[#00ff87]/40 pl-9 pr-3 py-2 text-xs sm:text-sm font-mono font-bold text-white focus:border-[#00ff87] focus:outline-none"
              />
            </div>
          </div>

          {/* Club & Division */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Club
              </label>
              <input
                type="text"
                value={favoriteClub}
                onChange={(e) => setFavoriteClub(e.target.value)}
                placeholder="FC Barcelona"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
              >
                <option value="Division 1">Division 1</option>
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
                Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-8 pr-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Phone
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
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-7 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Joining...</span>
                </>
              ) : (
                <span>Join</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
