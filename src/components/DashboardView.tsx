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
  Trash2
} from 'lucide-react';
import { Tournament, UserProfile, LeaderboardEntry, MatchFixture } from '../types/tournament';
import confetti from 'canvas-confetti';
import { JoinTournamentModal } from './JoinTournamentModal';
import { EditBannerModal } from './EditBannerModal';
import { EditTournamentModal } from './EditTournamentModal';
import { UpcomingMatchCountdown } from './UpcomingMatchCountdown';
import { handleAvatarError, handleBannerError, DEFAULT_ADMIN_AVATAR, DEFAULT_PLAYER_AVATAR, DEFAULT_BANNER } from '../utils/imageUtils';
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
    // If tournament has entry fee, deduct from wallet
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
      `🎉 Successfully joined "${res?.tournament?.title || 'Tournament'}"! Player details broadcasted to @eFootballTournamentBD Telegram channel.`
    );
    setTimeout(() => setJoinedAlert(null), 5000);
  };

  const handleLeave = (tour: Tournament) => {
    if (window.confirm(`Are you sure you want to leave "${tour.title}"? You can re-join anytime.`)) {
      onLeaveTournament?.(tour.id);
      setJoinedAlert(`Left "${tour.title}". You can join again whenever you are ready!`);
      setTimeout(() => setJoinedAlert(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Alert Banner */}
      {joinedAlert && (
        <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff87]/20 to-[#00e5ff]/20 border border-[#00ff87] p-4 text-white shadow-lg animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-[#00ff87] flex-shrink-0" />
          <p className="text-sm font-semibold">{joinedAlert}</p>
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

      {/* User Gaming Card / Stats Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1224] to-slate-900 p-3 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-[#00ff87]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-48 w-48 rounded-full bg-[#00e5ff]/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-5">
          {/* User info */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div 
              className={`relative shrink-0 ${onOpenProfile ? 'cursor-pointer group' : ''}`}
              onClick={onOpenProfile}
              title={onOpenProfile ? 'Click to view & edit your profile' : undefined}
            >
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="h-12 w-12 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl object-cover border-2 border-[#00ff87] shadow-lg shadow-[#00ff87]/20 group-hover:scale-105 transition-transform"
                onError={(e) => handleAvatarError(e, isUserAdmin(currentUser) ? DEFAULT_ADMIN_AVATAR : DEFAULT_PLAYER_AVATAR)}
              />
              <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-950 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black uppercase text-[#00ff87] border border-[#00ff87]/40">
                {currentUser.division}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-2xl font-black text-white tracking-wide truncate">
                  {currentUser.name}
                </h1>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold text-slate-300 shrink-0">
                  {currentUser.favoriteClub}
                </span>
                {onOpenProfile && (
                  <button
                    onClick={onOpenProfile}
                    className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-slate-300 hover:border-[#00ff87]/50 hover:text-white transition shrink-0"
                    title="View and edit player profile"
                  >
                    <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#00ff87]" />
                    <span>Edit Profile</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="inline-flex items-center gap-1 rounded border border-rose-900/50 bg-rose-950/40 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-rose-400 hover:bg-rose-900/60 hover:text-white transition shrink-0"
                    title="Log out and switch to login & register"
                  >
                    <LogOut className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-400" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>

              {/* Copy In-Game ID */}
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] sm:text-xs text-slate-400">ID:</span>
                <button
                  onClick={copyId}
                  className="inline-flex items-center gap-1 rounded bg-slate-800/90 px-2 py-0.5 text-[11px] sm:text-xs font-mono font-bold text-[#00ff87] hover:bg-slate-700 transition"
                  title="Copy eFootball ID to add friend in mobile game"
                >
                  <span>{currentUser.efootballId}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-[#00ff87]" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-70" />
                  )}
                </button>
                <span className="text-[10px] sm:text-xs text-slate-400">
                  • Rating: <strong className="text-white">{currentUser.rating}</strong>
                </span>

                {onOpenWallet && (
                  <button
                    onClick={onOpenWallet}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-0.5 text-[11px] sm:text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition shadow-sm ml-1"
                    title="View wallet & deposit/withdraw balance"
                  >
                    <Wallet className="w-3 h-3 text-emerald-400" />
                    <span>৳{currentUser.balance ?? 0}</span>
                    <span className="text-[9px] text-emerald-200 font-semibold bg-emerald-500/20 px-1 py-0.2 rounded">+ Add</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* User Quick Stats Cards */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3 bg-slate-950/70 p-2 sm:p-3 rounded-xl border border-slate-800">
            <div className="text-center px-1">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Rank</span>
              <span className="text-sm sm:text-xl font-black text-amber-400">#{userRank}</span>
            </div>
            <div className="text-center px-1 border-l border-slate-800">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Points</span>
              <span className="text-sm sm:text-xl font-black text-[#00ff87]">{userStats?.points || 0}</span>
            </div>
            <div className="text-center px-1 border-l border-slate-800">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Played</span>
              <span className="text-sm sm:text-xl font-black text-sky-400">{userStats?.played || 0}</span>
            </div>
            <div className="text-center px-1 border-l border-slate-800">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-bold block">W / D / L</span>
              <span className="text-[10px] sm:text-sm font-bold text-slate-200 mt-0.5 block">
                {userStats?.won || 0}-{userStats?.drawn || 0}-{userStats?.lost || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#00ff87] animate-ping" />
            <span className="text-[11px] sm:text-xs text-slate-300 font-medium">Ready for eFootball matchday!</span>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => onNavigateToSubmit()}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-3.5 py-2 text-xs font-black text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition touch-manipulation"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Submit Match Screenshot</span>
            </button>
            {onNavigateToRules && (
              <button
                onClick={onNavigateToRules}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition touch-manipulation"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#00ff87]" />
                <span>Rules</span>
              </button>
            )}
            {onNavigateToHistory && (
              <button
                onClick={onNavigateToHistory}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition touch-manipulation"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>History</span>
              </button>
            )}
            {isUserAdmin(currentUser) && (
              <button
                onClick={onOpenCreateModal}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition touch-manipulation"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Create Tournament</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Official Telegram Channel & Tournament Rules Quick Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        <a
          href="https://t.me/eFootballTournamentBD"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900 to-sky-950/30 hover:border-sky-400 hover:bg-sky-900/30 transition group shadow-md touch-manipulation active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 group-hover:scale-105 transition-transform shrink-0">
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-white truncate">Official Telegram Channel</span>
                <span className="rounded bg-sky-500/20 px-1.5 py-0.2 text-[9px] font-bold text-sky-300 shrink-0">
                  @eFootballTournamentBD
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                Live match fixtures, score announcements &amp; highlights
              </p>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </a>

        {onNavigateToRules && (
          <div
            onClick={onNavigateToRules}
            className="cursor-pointer flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#00ff87]/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 hover:border-[#00ff87]/60 hover:bg-emerald-950/30 transition group shadow-md touch-manipulation active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[#00ff87]/15 text-[#00ff87] border border-[#00ff87]/30 group-hover:scale-105 transition-transform shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#00ff87]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-white truncate">Tournament &amp; Fair Play Rules</span>
                  <span className="rounded bg-[#00ff87]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#00ff87] shrink-0">
                    Guidelines
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                  Screenshot requirements, match lobby rules &amp; scoring system
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00ff87] opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
          </div>
        )}
      </div>

      {/* Section: Active & Upcoming Tournaments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#00ff87]" />
              <span>eFootball Tournaments</span>
            </h2>
            <p className="text-xs text-slate-400">Join cups, check fixtures, and climb the leaderboard.</p>
          </div>
          <button
            onClick={() => onNavigateToFixtures()}
            className="text-xs font-semibold text-[#00ff87] hover:underline flex items-center gap-1"
          >
            <span>All Fixtures</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {tournaments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 sm:p-12 text-center text-slate-400">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">
              {isUserAdmin(currentUser) ? 'No Tournaments Created Yet' : 'No Active Tournaments'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {isUserAdmin(currentUser) 
                ? 'Create a new tournament and rules from here or the Admin Desk.' 
                : 'Tournaments will appear here as soon as they are announced. Check back soon!'}
            </p>
            {isUserAdmin(currentUser) && (
              <button
                onClick={onOpenCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-5 py-2.5 text-xs font-black uppercase text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Tournament</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tour) => {
              const isJoined = tour.registeredPlayerIds.includes(currentUser.id);
              const isFull = tour.registeredPlayerIds.length >= tour.maxPlayers;

              return (
                <div 
                  key={tour.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 glass-card-hover"
                >
                  {/* Banner Image */}
                  <div className="relative h-36 sm:h-48 w-full overflow-hidden bg-slate-950">
                    <img 
                      src={tour.bannerUrl} 
                      alt={tour.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      onError={(e) => handleBannerError(e, DEFAULT_BANNER)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none" />
                    
                    {/* Status Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        tour.status === 'ongoing' 
                          ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/30' 
                          : tour.status === 'completed'
                          ? 'bg-slate-700 text-slate-200'
                          : 'bg-sky-500 text-slate-950'
                      }`}>
                        {tour.status}
                      </span>
                      <span className="rounded-md bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase">
                        {tour.format}
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        tour.entryFee 
                          ? 'bg-amber-400 text-slate-950 shadow-sm' 
                          : 'bg-emerald-500/20 text-[#00ff87] border border-emerald-500/40'
                      }`}>
                        {tour.entryFee ? `৳${tour.entryFee} Fee` : 'Free'}
                      </span>
                    </div>

                    {/* Registered count pill */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md bg-black/75 backdrop-blur-md px-2 py-0.5 text-[11px] font-semibold text-white border border-slate-700/60 z-10">
                      <Users className="w-3 h-3 text-[#00ff87]" />
                      <span>{tour.registeredPlayerIds.length}/{tour.maxPlayers}</span>
                    </div>

                    {/* Admin Quick Actions: Customize Fee, Change Banner & Delete Tournament */}
                    {isUserAdmin(currentUser) && (
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTour(tour);
                          }}
                          className="rounded-lg bg-amber-500/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-black text-slate-950 hover:bg-amber-400 border border-amber-300 flex items-center gap-1 shadow-lg transition active:scale-95 touch-manipulation"
                          title="Customize entry fee and tournament details"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Customize Fee</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBannerTour(tour);
                          }}
                          className="rounded-lg bg-black/85 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-white hover:bg-slate-900 border border-slate-700/80 flex items-center gap-1.5 shadow-lg transition active:scale-95 touch-manipulation"
                          title="Change tournament banner image"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[#00ff87]" />
                          <span>Banner</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`⚠️ আপনি কি নিশ্চিত "${tour.title}" টুর্নামেন্টটি মুছে ফেলতে চান? এটি টুর্নামেন্ট এবং এর সকল ম্যাচ ফিক্সচার স্থায়ীভাবে ডিলিট করে দেবে।\n\nAre you sure you want to delete "${tour.title}"?`)) {
                              onDeleteTournament?.(tour.id);
                              setJoinedAlert(`Tournament "${tour.title}" deleted.`);
                              setTimeout(() => setJoinedAlert(null), 3000);
                            }
                          }}
                          className="rounded-lg bg-rose-600/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-black text-white hover:bg-rose-500 border border-rose-400/80 flex items-center gap-1 shadow-lg transition active:scale-95 touch-manipulation"
                          title="Delete tournament permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#00ff87] transition-colors line-clamp-1">
                        {tour.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                        {tour.description}
                      </p>
                    </div>

                    {/* Rules & Prize Specs */}
                    <div className="space-y-1.5 rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80 text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Duration:
                        </span>
                        <strong className="text-slate-200">{tour.rules.matchLength}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Gamepad2 className="w-3 h-3" /> Extra / PK:
                        </span>
                        <span>
                          ET: {tour.rules.extraTime ? 'ON' : 'OFF'} • PK: {tour.rules.penalties ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Coins className="w-3 h-3 text-emerald-400" /> Entry Fee:
                        </span>
                        <span className={`font-bold ${tour.entryFee ? 'text-amber-300' : 'text-[#00ff87]'}`}>
                          {tour.entryFee ? `৳${tour.entryFee} BDT` : 'Free (৳০)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-400" /> Reward:
                        </span>
                        <span className="font-bold text-amber-300 truncate max-w-[150px]">{tour.prizePool}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {isJoined ? (
                        <div className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 py-2.5 px-3 text-xs font-bold text-[#00ff87]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Registered</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setJoiningTournament(tour)}
                          disabled={isFull}
                          className={`w-full rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition ${
                            isFull
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#00ff87] to-[#00e5ff] text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 flex items-center justify-center'
                          }`}
                        >
                          <span>{isFull ? 'Tournament Full' : 'Join'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rules Notice for Players */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 p-4 sm:p-5 text-slate-300">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>eFootball Mobile Tournament Fair Play & Match Guidelines</span>
        </h4>
        <ul className="text-xs space-y-1.5 text-slate-400 list-disc pl-5">
          <li>Add your opponent using their <strong>eFootball In-Game ID</strong> in the Friend Match lobby.</li>
          <li>Default settings: <strong>10 Minutes, Extra Time OFF, Penalties ON, Condition: Excellent</strong> unless specified.</li>
          <li>After the final whistle, take a <strong>full-screen screenshot</strong> showing both team names, scores, and match statistics.</li>
          <li>Upload the screenshot under <strong>Submit Result</strong>. Once verified, the points table and Telegram notification are updated instantly!</li>
        </ul>
      </div>

      {/* Join Tournament Details & Telegram Broadcast Modal */}
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
