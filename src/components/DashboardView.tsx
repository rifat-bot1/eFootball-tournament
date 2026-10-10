import React, { useState } from 'react';
import { 
  Trophy, 
  Users, 
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
  Image as ImageIcon
} from 'lucide-react';
import { Tournament, UserProfile, LeaderboardEntry } from '../types/tournament';
import confetti from 'canvas-confetti';
import { JoinTournamentModal } from './JoinTournamentModal';
import { EditBannerModal } from './EditBannerModal';
import { handleAvatarError, handleBannerError, DEFAULT_ADMIN_AVATAR, DEFAULT_PLAYER_AVATAR, DEFAULT_BANNER } from '../utils/imageUtils';

interface DashboardViewProps {
  tournaments: Tournament[];
  currentUser: UserProfile;
  leaderboard: LeaderboardEntry[];
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
  onNavigateToFixtures: (tournamentId?: string) => void;
  onNavigateToSubmit: () => void;
  onOpenCreateModal: () => void;
  onNavigateToRules?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tournaments,
  currentUser,
  leaderboard,
  onJoinTournament,
  onLeaveTournament,
  onUpdateTournamentBanner,
  onNavigateToFixtures,
  onNavigateToSubmit,
  onOpenCreateModal,
  onNavigateToRules
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [joinedAlert, setJoinedAlert] = useState<string | null>(null);
  const [joiningTournament, setJoiningTournament] = useState<Tournament | null>(null);
  const [editingBannerTour, setEditingBannerTour] = useState<Tournament | null>(null);

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

      {/* User Gaming Card / Stats Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1224] to-slate-900 p-4 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-[#00ff87]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-48 w-48 rounded-full bg-[#00e5ff]/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          {/* User info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-[#00ff87] shadow-lg shadow-[#00ff87]/20"
                onError={(e) => handleAvatarError(e, currentUser.role === 'admin' ? DEFAULT_ADMIN_AVATAR : DEFAULT_PLAYER_AVATAR)}
              />
              <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-black uppercase text-[#00ff87] border border-[#00ff87]/40">
                {currentUser.division}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  {currentUser.name}
                </h1>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                  {currentUser.favoriteClub}
                </span>
              </div>

              {/* Copy In-Game ID */}
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-slate-400">eFootball In-Game ID:</span>
                <button
                  onClick={copyId}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-800/90 px-2.5 py-1 text-xs font-mono font-bold text-[#00ff87] hover:bg-slate-700 transition"
                  title="Copy eFootball ID to add friend in mobile game"
                >
                  <span>{currentUser.efootballId}</span>
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-[#00ff87]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 opacity-70" />
                  )}
                </button>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Rating: <strong className="text-white">{currentUser.rating}</strong> • Role: <strong className="text-amber-400 uppercase">{currentUser.role}</strong>
              </p>
            </div>
          </div>

          {/* User Quick Stats Cards */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-center px-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Rank</span>
              <span className="text-lg sm:text-xl font-black text-amber-400">#{userRank}</span>
            </div>
            <div className="text-center px-1 border-l border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Points</span>
              <span className="text-lg sm:text-xl font-black text-[#00ff87]">{userStats?.points || 0}</span>
            </div>
            <div className="text-center px-1 border-l border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Played</span>
              <span className="text-lg sm:text-xl font-black text-sky-400">{userStats?.played || 0}</span>
            </div>
            <div className="text-center px-1 border-l border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">W / D / L</span>
              <span className="text-xs sm:text-sm font-bold text-slate-200 mt-1 block">
                {userStats?.won || 0}-{userStats?.drawn || 0}-{userStats?.lost || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#00ff87] animate-ping" />
            <span className="text-xs text-slate-300 font-medium">Ready for eFootball matchday!</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onNavigateToSubmit}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-4 py-2 text-xs font-black text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Submit Match Screenshot</span>
            </button>
            {onNavigateToRules && (
              <button
                onClick={onNavigateToRules}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#00ff87]" />
                <span>Rules</span>
              </button>
            )}
            {currentUser.role === 'admin' && (
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Create Tournament</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Official Telegram Channel & Tournament Rules Quick Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <a
          href="https://t.me/eFootballTournamentBD"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-3.5 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900 to-sky-950/30 hover:border-sky-400 hover:bg-sky-900/30 transition group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Official Telegram Channel</span>
                <span className="rounded bg-sky-500/20 px-1.5 py-0.2 text-[9px] font-bold text-sky-300">
                  @eFootballTournamentBD
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Live match fixtures, instant score announcements &amp; highlights
              </p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-sky-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
        </a>

        {onNavigateToRules && (
          <div
            onClick={onNavigateToRules}
            className="cursor-pointer flex items-center justify-between p-3.5 rounded-2xl border border-[#00ff87]/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 hover:border-[#00ff87]/60 hover:bg-emerald-950/30 transition group shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00ff87]/15 text-[#00ff87] border border-[#00ff87]/30 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 text-[#00ff87]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white">Tournament &amp; Fair Play Rules</span>
                  <span className="rounded bg-[#00ff87]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#00ff87]">
                    Guidelines
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Screenshot requirements, match lobby rules &amp; scoring system
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#00ff87] opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
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
            <h3 className="text-base font-bold text-white">No Tournaments Created Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All demo tournaments have been removed. Admins can create new real tournaments from the Admin Desk.
            </p>
            {currentUser.role === 'admin' && (
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
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-950">
                    <img 
                      src={tour.bannerUrl} 
                      alt={tour.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      onError={(e) => handleBannerError(e, DEFAULT_BANNER)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent pointer-events-none" />
                    
                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
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
                    </div>

                    {/* Registered count pill */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-black/75 backdrop-blur-md px-2 py-0.5 text-[11px] font-semibold text-white border border-slate-700/60">
                      <Users className="w-3 h-3 text-[#00ff87]" />
                      <span>{tour.registeredPlayerIds.length}/{tour.maxPlayers}</span>
                    </div>

                    {/* Admin Quick Action: Change Banner */}
                    {currentUser.role === 'admin' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBannerTour(tour);
                        }}
                        className="absolute bottom-3 right-3 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-white hover:bg-slate-900 border border-slate-700/80 flex items-center gap-1.5 shadow-lg transition"
                        title="Change tournament banner image"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-[#00ff87]" />
                        <span>Change Banner</span>
                      </button>
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
                          <Award className="w-3 h-3 text-amber-400" /> Reward:
                        </span>
                        <span className="font-bold text-amber-300 truncate max-w-[150px]">{tour.prizePool}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      {isJoined ? (
                        <>
                          <div className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 py-2 px-2.5 text-xs font-bold text-[#00ff87]">
                            <Check className="w-3.5 h-3.5" />
                            <span>Registered</span>
                          </div>
                          
                          {/* Re-notify / Update details button */}
                          <button
                            onClick={() => setJoiningTournament(tour)}
                            className="inline-flex items-center justify-center gap-1 rounded-xl border border-sky-500/40 bg-sky-950/40 px-2.5 py-2 text-[11px] font-bold text-sky-300 hover:bg-sky-500/20 hover:text-white transition"
                            title="Update player info or resend details to Telegram"
                          >
                            <Send className="w-3 h-3 text-sky-400" />
                            <span>Re-notify Telegram</span>
                          </button>

                          {/* Leave button to allow re-testing registration */}
                          {onLeaveTournament && (
                            <button
                              onClick={() => handleLeave(tour)}
                              className="inline-flex items-center justify-center rounded-xl border border-rose-500/30 bg-rose-950/30 p-2 text-rose-400 hover:bg-rose-500/20 hover:text-rose-200 transition"
                              title="Leave tournament (un-register to test again)"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => setJoiningTournament(tour)}
                          disabled={isFull}
                          className={`flex-1 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition ${
                            isFull
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#00ff87] to-[#00e5ff] text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 flex items-center justify-center gap-1.5'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isFull ? 'Tournament Full' : 'Join & Notify Telegram'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => onNavigateToFixtures(tour.id)}
                        className="rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-slate-300 hover:text-white hover:border-[#00ff87]/50 transition flex items-center justify-center"
                        title="View Fixtures & Standings"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
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
          <li>Upload the screenshot under <strong>Submit Result</strong>. Once verified by an Admin, the points table and Telegram notification are updated instantly!</li>
        </ul>
      </div>

      {/* Join Tournament Details & Telegram Broadcast Modal */}
      <JoinTournamentModal
        isOpen={Boolean(joiningTournament)}
        onClose={() => setJoiningTournament(null)}
        tournament={joiningTournament}
        currentUser={currentUser}
        onConfirmJoin={handleConfirmJoin}
      />

      {/* Edit Tournament Banner Modal */}
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

    </div>
  );
};
