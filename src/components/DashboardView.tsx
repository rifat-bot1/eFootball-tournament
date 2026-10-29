import React, { useState } from 'react';
import { 
  Trophy, 
  Users, 
  User, 
  Gamepad2, 
  Flame, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Upload, 
  Copy, 
  Check, 
  Award, 
  Zap, 
  ShieldAlert, 
  SlidersHorizontal, 
  Plus, 
  BookOpen, 
  LogOut, 
  Send, 
  ExternalLink, 
  Image as ImageIcon, 
  History, 
  Coins, 
  Wallet, 
  Edit3, 
  Trash2, 
  Swords, 
  Sparkles, 
  Play 
} from 'lucide-react';
import { Tournament, UserProfile, LeaderboardEntry, MatchFixture } from '../types/tournament';
import confetti from 'canvas-confetti';
import { JoinTournamentModal } from './JoinTournamentModal';
import { EditBannerModal } from './EditBannerModal';
import { EditTournamentModal } from './EditTournamentModal';
import { UpcomingMatchCountdown } from './UpcomingMatchCountdown';
import { handleAvatarError, handleBannerError, DEFAULT_ADMIN_AVATAR, DEFAULT_PLAYER_AVATAR, DEFAULT_BANNER, APP_LOGO } from '../utils/imageUtils';
import { isUserAdmin } from '../services/mockData';
import { getFixtures } from '../services/tournamentService';
import { deductTournamentEntryFee } from '../services/walletService';

interface DashboardViewProps {
  tournaments: Tournament[];
  currentUser: UserProfile;
  leaderboard: LeaderboardEntry[];
  fixtures?: MatchFixture[];
  onOpenWallet?: () => void;
  onJoinTournament: (
    tournamentId: string,
    playerData?: {
      name: string;
      efootballId: string;
      email: string;
      phone?: string;
      favoriteClub: string;
      division: string;
    }
  ) => Promise<any>;
  onLeaveTournament?: (tournamentId: string) => void;
  onUpdateTournamentBanner?: (tournamentId: string, bannerUrl: string) => void;
  onUpdateTournament?: (tournamentId: string, updates: Partial<Tournament>) => void;
  onDeleteTournament?: (tournamentId: string) => void;
  onNavigateToFixtures: (tournamentId?: string) => void;
  onNavigateToSubmit: (fixture?: MatchFixture) => void;
  onOpenCreateModal: () => void;
  onNavigateToRules?: () => void;
  onNavigateToHistory?: () => void;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tournaments,
  currentUser,
  leaderboard,
  fixtures,
  onOpenWallet,
  onJoinTournament,
  onLeaveTournament,
  onUpdateTournamentBanner,
  onUpdateTournament,
  onDeleteTournament,
  onNavigateToFixtures,
  onNavigateToSubmit,
  onOpenCreateModal,
  onNavigateToRules,
  onNavigateToHistory,
  onOpenProfile,
  onOpenAuth,
  onLogout
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [joinedAlert, setJoinedAlert] = useState<string | null>(null);
  const [joiningTournament, setJoiningTournament] = useState<Tournament | null>(null);
  const [editingBannerTour, setEditingBannerTour] = useState<Tournament | null>(null);
  const [editingTour, setEditingTour] = useState<Tournament | null>(null);
  
  // Category filter state: 'all' | '1v1' | '3v3' | 'tournament'
  const [selectedCategory, setSelectedCategory] = useState<'all' | '1v1' | '3v3' | 'tournament'>('all');

  // Find user's leaderboard position
  const userRankIndex = leaderboard.findIndex(e => e.playerId === currentUser.id);
  const userStats = userRankIndex !== -1 ? leaderboard[userRankIndex] : null;
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : '—';

  const copyId = () => {
    navigator.clipboard.writeText(currentUser.efootballId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleConfirmJoin = async (
    tournamentId: string,
    playerData: {
      name: string;
      efootballId: string;
      email: string;
      phone?: string;
      favoriteClub: string;
      division: string;
    }
  ) => {
    const tour = tournaments.find(t => t.id === tournamentId) || joiningTournament;
    const fee = tour?.entryFee || 0;
    if (fee > 0 && tour) {
      const deduction = await deductTournamentEntryFee(currentUser, tour);
      if (!deduction.success) {
        alert(deduction.error || 'Failed to deduct entry fee');
        return;
      }
    }

    const res = await onJoinTournament(tournamentId, playerData);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
    setJoinedAlert(
      `🎉 Successfully joined "${res?.tournament?.title || 'Tournament'}"!`
    );
    setTimeout(() => setJoinedAlert(null), 5000);
  };

  // Filter tournaments by selected category
  const filteredTournaments = tournaments.filter(tour => {
    if (selectedCategory === 'all') return true;
    const titleLower = tour.title.toLowerCase();
    const formatLower = tour.format.toLowerCase();
    if (selectedCategory === '1v1') {
      return titleLower.includes('1v1') || titleLower.includes('single') || formatLower.includes('single');
    }
    if (selectedCategory === '3v3') {
      return titleLower.includes('3v3') || titleLower.includes('co-op') || formatLower.includes('co-op');
    }
    if (selectedCategory === 'tournament') {
      return tour.format === 'knockout' || titleLower.includes('cup') || titleLower.includes('tournament');
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Alert Banner */}
      {joinedAlert && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 p-3.5 text-white shadow-lg animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-[#00ff87] flex-shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">{joinedAlert}</p>
        </div>
      )}

      {/* Upcoming Match Countdown & "Match Starting Soon" Notification */}
      <UpcomingMatchCountdown
        fixtures={fixtures || getFixtures()}
        tournaments={tournaments}
        currentUser={currentUser}
        onNavigateToFixtures={onNavigateToFixtures}
        onNavigateToSubmit={onNavigateToSubmit}
      />

      {/* Hero Promo Banner (Matching Attachments 5 & 6) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-900/90 via-indigo-950 to-slate-900 p-4 sm:p-6 shadow-xl">
        {/* Glow circles */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-600/20 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 sm:space-y-1.5 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm">
                eCup 2026
              </span>
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest font-mono">
                Official Season
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <span>EFOOTBALL</span>
              <span className="text-cyan-400">[ECUP]</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Join ongoing matches & win exciting prizes by your mobile!
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenWallet && (
              <button
                onClick={onOpenWallet}
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold text-white transition active:scale-95"
              >
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>৳{currentUser.balance || 0}</span>
                <span className="text-[10px] text-emerald-300 font-black">+ এড</span>
              </button>
            )}
            {isUserAdmin(currentUser) && (
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-2 text-xs font-black uppercase tracking-wider transition shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>টুর্নামেন্ট তৈরি</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🎮 CATEGORIES Section (Exact 2x2 grid from Attachments 5 & 6) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
            <span>🎮</span>
            <span>CATEGORIES</span>
          </h2>

          {onNavigateToRules && (
            <button
              onClick={onNavigateToRules}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white hover:border-slate-600 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#00ff87]" />
              <span>Rules & Guide</span>
            </button>
          )}
        </div>

        {/* 2x2 Grid Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          
          {/* 1. All Matches */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
              selectedCategory === 'all'
                ? 'bg-blue-600/25 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black leading-tight">All Matches</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">সব ম্যাচ</div>
            </div>
          </button>

          {/* 2. 1 vs 1 Single */}
          <button
            onClick={() => setSelectedCategory('1v1')}
            className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
              selectedCategory === '1v1'
                ? 'bg-blue-600/25 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              selectedCategory === '1v1' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black leading-tight">1 vs 1 Single</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">সিঙ্গেল মোড</div>
            </div>
          </button>

          {/* 3. 3 vs 3 Co-op */}
          <button
            onClick={() => setSelectedCategory('3v3')}
            className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
              selectedCategory === '3v3'
                ? 'bg-blue-600/25 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              selectedCategory === '3v3' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black leading-tight">3 vs 3 Co-op</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">স্কোয়াড মোড</div>
            </div>
          </button>

          {/* 4. Tournament */}
          <button
            onClick={() => setSelectedCategory('tournament')}
            className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
              selectedCategory === 'tournament'
                ? 'bg-blue-600/25 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              selectedCategory === 'tournament' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black leading-tight">Tournament</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">নকআউট কাপ</div>
            </div>
          </button>

        </div>
      </div>

      {/* 🔥 Upcoming & Live Matches Section Header */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
              <span>🔥</span>
              <span>Upcoming & Live Matches</span>
            </h2>
            <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-black text-[#00ff87]">
              ({filteredTournaments.length < 10 ? `0${filteredTournaments.length}` : filteredTournaments.length})
            </span>
          </div>

          <button
            onClick={() => onNavigateToFixtures()}
            className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>ম্যাচ ফিক্সচার</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tournament / Match Cards */}
        {filteredTournaments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 sm:p-12 text-center text-slate-400">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2.5" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              {isUserAdmin(currentUser) ? 'কোনো ম্যাচ বা টুর্নামেন্ট পাওয়া যায়নি' : 'এই ক্যাটাগরিতে কোনো ম্যাচ নেই'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {isUserAdmin(currentUser) 
                ? 'নতুন টুর্নামেন্ট তৈরি করতে নিচের বাটনে চাপ দিন।' 
                : 'অন্য ক্যাটাগরি সিলেক্ট করুন অথবা অ্যাডমিনের ঘোষণার জন্য অপেক্ষা করুন।'}
            </p>
            {isUserAdmin(currentUser) && (
              <button
                onClick={onOpenCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-black uppercase text-white shadow-md active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>ম্যাচ তৈরি করুন</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredTournaments.map((tour, index) => {
              const isJoined = tour.registeredPlayerIds.includes(currentUser.id);
              const isFull = tour.registeredPlayerIds.length >= tour.maxPlayers;
              const matchNumber = tour.id.slice(0, 4).toUpperCase();
              const spotsLeft = Math.max(0, tour.maxPlayers - tour.registeredPlayerIds.length);
              const progressPercent = Math.min(100, Math.round((tour.registeredPlayerIds.length / tour.maxPlayers) * 100));

              return (
                <div 
                  key={tour.id}
                  className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-slate-800/90 bg-[#0d1424] p-4 shadow-xl hover:border-slate-700 transition-all overflow-hidden"
                >
                  {/* Top Bar: #1104 - 3vs3 in Gold & [Upcoming] Badge */}
                  <div className="flex items-center justify-between gap-2 pb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-black text-amber-400 truncate tracking-wide">
                        #{matchNumber} - {tour.title}
                      </span>
                    </div>

                    <span className={`rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      tour.status === 'ongoing'
                        ? 'bg-emerald-500/20 text-[#00ff87] border border-emerald-500/40'
                        : tour.status === 'completed'
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    }`}>
                      {tour.status === 'ongoing' ? 'Live' : tour.status === 'completed' ? 'Finished' : 'Upcoming'}
                    </span>
                  </div>

                  {/* Tags Pill Row: [eFootball 2026] [3V3 CO-OP / 1V1 SOLO] */}
                  <div className="flex items-center gap-1.5 flex-wrap pb-2.5">
                    <span className="rounded-md bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase">
                      eFootball 2026
                    </span>
                    <span className="rounded-md bg-blue-950/80 border border-blue-500/40 px-2 py-0.5 text-[10px] font-black text-cyan-300 uppercase">
                      {tour.title.toLowerCase().includes('3v3') ? '3V3 CO-OP' : tour.title.toLowerCase().includes('1v1') ? '1V1 SOLO' : tour.format.toUpperCase()}
                    </span>
                    <span className="rounded-md bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-400 font-medium">
                      Mobile
                    </span>
                  </div>

                  {/* 3-Column Stats Box: PRIZE POOL | ENTRY FEE | MATCH TIME */}
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5 text-center my-1">
                    {/* 1. PRIZE POOL */}
                    <div className="px-1">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                        PRIZE POOL
                      </span>
                      <span className="text-xs sm:text-sm font-black text-emerald-400 mt-0.5 block truncate">
                        {tour.prizePool.startsWith('৳') ? tour.prizePool : `৳${tour.prizePool}`}
                      </span>
                    </div>

                    {/* 2. ENTRY FEE */}
                    <div className="px-1 border-l border-slate-800">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                        ENTRY FEE
                      </span>
                      <span className="text-xs sm:text-sm font-black text-amber-400 mt-0.5 block truncate">
                        {tour.entryFee ? `৳${tour.entryFee}.00` : 'Free (৳০)'}
                      </span>
                    </div>

                    {/* 3. MATCH TIME */}
                    <div className="px-1 border-l border-slate-800">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                        MATCH TIME
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-200 mt-0.5 block truncate">
                        {tour.startDate || '12:00 PM'}
                      </span>
                    </div>
                  </div>

                  {/* Status Red/Rose Banner Button */}
                  <div className="mt-2.5">
                    <div className={`w-full py-1.5 px-3 rounded-xl text-center text-xs font-black uppercase tracking-wider text-white shadow-md ${
                      tour.status === 'ongoing'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                        : isFull
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-gradient-to-r from-rose-600 to-red-600'
                    }`}>
                      {tour.status === 'ongoing' ? 'MATCH STARTED' : isFull ? 'REGISTRATION CLOSED' : 'REGISTRATION OPEN'}
                    </div>
                  </div>

                  {/* Spots Filled Track & Progress */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                      <span>Spots: {tour.registeredPlayerIds.length} / {tour.maxPlayers}</span>
                      <span className="text-slate-400 font-medium">
                        {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom Action Section */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    
                    {/* Join / Registered Button */}
                    <div className="flex-1">
                      {isJoined ? (
                        <div className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 py-2 px-3 text-xs font-bold text-[#00ff87]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Registered</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setJoiningTournament(tour)}
                          disabled={isFull}
                          className={`w-full rounded-xl py-2 text-xs font-black uppercase tracking-wider transition active:scale-95 ${
                            isFull
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:brightness-110'
                          }`}
                        >
                          {isFull ? 'Tournament Full' : 'Join Match'}
                        </button>
                      )}
                    </div>

                    {/* Admin Action Controls: Fee, Banner, Delete */}
                    {isUserAdmin(currentUser) && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTour(tour);
                          }}
                          className="rounded-lg bg-amber-500/90 px-2 py-1.5 text-[10px] font-black text-slate-950 hover:bg-amber-400 transition"
                          title="Edit Fee"
                        >
                          <Coins className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBannerTour(tour);
                          }}
                          className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1.5 text-[10px] font-bold text-slate-200 transition"
                          title="Edit Banner"
                        >
                          <ImageIcon className="w-3 h-3 text-cyan-400" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`⚠️ "${tour.title}" টুর্নামেন্টটি কি ডিলিট করতে চান?`)) {
                              onDeleteTournament?.(tour.id);
                              setJoinedAlert(`Tournament "${tour.title}" deleted.`);
                              setTimeout(() => setJoinedAlert(null), 3000);
                            }
                          }}
                          className="rounded-lg bg-rose-600/90 hover:bg-rose-500 px-2 py-1.5 text-[10px] font-black text-white transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Join Tournament Details & Payment Modal */}
      <JoinTournamentModal
        isOpen={Boolean(joiningTournament)}
        onClose={() => setJoiningTournament(null)}
        tournament={joiningTournament}
        currentUser={currentUser}
        onConfirmJoin={handleConfirmJoin}
        onOpenDeposit={onOpenWallet}
      />

      {/* Edit Tournament Banner Modal (Admin Only) */}
      {isUserAdmin(currentUser) && (
        <>
          <EditBannerModal
            isOpen={Boolean(editingBannerTour)}
            onClose={() => setEditingBannerTour(null)}
            tournament={editingBannerTour}
            onUpdateBanner={(tourId, newBanner) => {
              onUpdateTournamentBanner?.(tourId, newBanner);
              setJoinedAlert('Tournament banner updated successfully!');
              setTimeout(() => setJoinedAlert(null), 3000);
            }}
          />

          <EditTournamentModal
            isOpen={Boolean(editingTour)}
            onClose={() => setEditingTour(null)}
            tournament={editingTour}
            onUpdateTournament={(tourId, updates) => {
              onUpdateTournament?.(tourId, updates);
              setJoinedAlert('Tournament details and entry fee updated!');
              setTimeout(() => setJoinedAlert(null), 3000);
            }}
            onDeleteTournament={onDeleteTournament}
          />
        </>
      )}

    </div>
  );
};
