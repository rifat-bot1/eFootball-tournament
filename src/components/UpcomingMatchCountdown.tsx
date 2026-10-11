import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Gamepad2, 
  Flame, 
  Copy, 
  Check, 
  Upload, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  Swords,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { MatchFixture, Tournament, UserProfile } from '../types/tournament';
import { handleAvatarError, DEFAULT_PLAYER_AVATAR } from '../utils/imageUtils';

interface UpcomingMatchCountdownProps {
  fixtures: MatchFixture[];
  tournaments: Tournament[];
  currentUser: UserProfile;
  onNavigateToFixtures: (tournamentId?: string) => void;
  onNavigateToSubmit: (fixture?: MatchFixture) => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isStartingSoon: boolean; // within 15 minutes
  isKickoffNow: boolean;    // kickoff time reached within past 90 mins
  isOverdue: boolean;       // past 90 mins
}

export const UpcomingMatchCountdown: React.FC<UpcomingMatchCountdownProps> = ({
  fixtures,
  tournaments,
  currentUser,
  onNavigateToFixtures,
  onNavigateToSubmit
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [isMinimized, setIsMinimized] = useState(false);

  // Live timer tick every 1000ms
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter pending upcoming fixtures for current user
  const userUpcomingFixtures = useMemo(() => {
    const currentUserId = currentUser.id?.toLowerCase();
    const currentEfootballId = currentUser.efootballId?.trim().toLowerCase();
    const currentEmail = currentUser.email?.trim().toLowerCase();

    return fixtures.filter(f => {
      // Must not be already finished or submitted
      if (f.status === 'approved' || f.status === 'submitted') {
        return false;
      }

      // Check if user is either player1 or player2
      const isPlayer1 = 
        f.player1.id?.toLowerCase() === currentUserId ||
        (currentEfootballId && f.player1.efootballId?.toLowerCase() === currentEfootballId) ||
        (currentEmail && f.player1.id?.toLowerCase().includes(currentEmail));

      const isPlayer2 = 
        f.player2.id?.toLowerCase() === currentUserId ||
        (currentEfootballId && f.player2.efootballId?.toLowerCase() === currentEfootballId) ||
        (currentEmail && f.player2.id?.toLowerCase().includes(currentEmail));

      return isPlayer1 || isPlayer2;
    }).sort((a, b) => {
      const timeA = new Date(a.scheduledTime.replace(' ', 'T')).getTime() || 0;
      const timeB = new Date(b.scheduledTime.replace(' ', 'T')).getTime() || 0;
      return timeA - timeB;
    });
  }, [fixtures, currentUser]);

  // Current selected fixture
  const currentFixture = userUpcomingFixtures[activeMatchIndex] || userUpcomingFixtures[0];

  // Tournament for this fixture
  const tournament = useMemo(() => {
    if (!currentFixture) return null;
    return tournaments.find(t => t.id === currentFixture.tournamentId) || null;
  }, [currentFixture, tournaments]);

  // Identify who is user and who is opponent
  const { me, opponent } = useMemo(() => {
    if (!currentFixture) return { me: null, opponent: null };
    const currentUserId = currentUser.id?.toLowerCase();
    const currentEfootballId = currentUser.efootballId?.trim().toLowerCase();

    const isPlayer1Me = 
      currentFixture.player1.id?.toLowerCase() === currentUserId ||
      (currentEfootballId && currentFixture.player1.efootballId?.toLowerCase() === currentEfootballId);

    return {
      me: isPlayer1Me ? currentFixture.player1 : currentFixture.player2,
      opponent: isPlayer1Me ? currentFixture.player2 : currentFixture.player1
    };
  }, [currentFixture, currentUser]);

  // Time remaining calculation
  const timeRemaining: TimeRemaining = useMemo(() => {
    if (!currentFixture) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0,
        isStartingSoon: false,
        isKickoffNow: false,
        isOverdue: false
      };
    }

    // Support formats like "2026-10-10 18:30" or ISO
    const dateStr = currentFixture.scheduledTime.includes('T') 
      ? currentFixture.scheduledTime 
      : currentFixture.scheduledTime.replace(' ', 'T');

    let matchTimestamp = new Date(dateStr).getTime();
    if (isNaN(matchTimestamp)) {
      matchTimestamp = new Date(currentFixture.scheduledTime).getTime();
    }
    if (isNaN(matchTimestamp)) {
      matchTimestamp = Date.now() + 3600000; // fallback 1 hour
    }

    const diff = matchTimestamp - now;

    // Kickoff window: within past 90 mins (match duration)
    const isKickoffNow = diff <= 0 && diff >= -90 * 60 * 1000;
    const isOverdue = diff < -90 * 60 * 1000;
    const isStartingSoon = diff > 0 && diff <= 15 * 60 * 1000; // within 15 minutes

    const totalSeconds = Math.max(0, Math.floor(Math.abs(diff) / 1000));
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      days,
      hours,
      minutes,
      seconds,
      totalMs: diff,
      isStartingSoon,
      isKickoffNow,
      isOverdue
    };
  }, [currentFixture, now]);

  const copyOpponentId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // If user has no upcoming fixtures, return null
  if (userUpcomingFixtures.length === 0 || !currentFixture || !opponent || !me) {
    return null;
  }

  // Minimized banner state
  if (isMinimized) {
    return (
      <div className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-[#00ff87]/30 px-4 py-2.5 rounded-2xl shadow-lg animate-fadeIn">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ff87]"></span>
          </span>
          <span className="text-xs font-bold text-white">
            Upcoming Match: <strong className="text-[#00ff87]">vs {opponent.name}</strong> ({currentFixture.round})
          </span>
          {timeRemaining.isStartingSoon && (
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/40 animate-pulse">
              Starting Soon
            </span>
          )}
          {timeRemaining.isKickoffNow && (
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/40 animate-pulse">
              Kickoff Live
            </span>
          )}
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          className="text-xs font-bold text-[#00ff87] hover:underline flex items-center gap-1"
        >
          <span>Expand Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#00ff87]/40 bg-gradient-to-b from-[#0a1525] via-slate-900 to-[#080d18] p-4 sm:p-5 shadow-2xl shadow-[#00ff87]/10 animate-fadeIn group">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 -mt-12 h-40 w-40 rounded-full bg-[#00ff87]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 -mb-10 h-32 w-32 rounded-full bg-[#00e5ff]/10 blur-2xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Status Indicator Pill */}
          {timeRemaining.isKickoffNow ? (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-black uppercase text-emerald-300 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Kickoff Time! Match Live</span>
            </div>
          ) : timeRemaining.isStartingSoon ? (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 px-3 py-1 text-xs font-black uppercase text-amber-300 animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>Match Starting Soon</span>
            </div>
          ) : timeRemaining.isOverdue ? (
            <div className="flex items-center gap-1.5 rounded-full bg-sky-500/20 border border-sky-400/40 px-3 py-1 text-xs font-black uppercase text-sky-300">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Scheduled Window Open</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/30 px-3 py-1 text-xs font-black uppercase text-[#00ff87]">
              <Clock className="w-3.5 h-3.5 text-[#00ff87]" />
              <span>Upcoming Fixture Scheduled</span>
            </div>
          )}

          {/* Tournament and Round context */}
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            • {tournament?.title || 'Tournament'} • <strong className="text-white">{currentFixture.round}</strong>
          </span>
        </div>

        {/* Right side: Match navigation if multiple, and minimize button */}
        <div className="flex items-center gap-2">
          {userUpcomingFixtures.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 rounded-xl px-2 py-0.5 text-xs text-slate-400">
              <button
                disabled={activeMatchIndex === 0}
                onClick={() => setActiveMatchIndex(prev => Math.max(0, prev - 1))}
                className="hover:text-white disabled:opacity-30 p-1"
                title="Previous match"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono">
                {activeMatchIndex + 1}/{userUpcomingFixtures.length}
              </span>
              <button
                disabled={activeMatchIndex === userUpcomingFixtures.length - 1}
                onClick={() => setActiveMatchIndex(prev => Math.min(userUpcomingFixtures.length - 1, prev + 1))}
                className="hover:text-white disabled:opacity-30 p-1"
                title="Next match"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsMinimized(true)}
            className="text-[11px] text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg transition"
            title="Minimize countdown bar"
          >
            Hide
          </button>
        </div>
      </div>

      {/* Main Grid: Countdown + Matchup Display */}
      <div className="relative mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        
        {/* Left Column: Live Countdown Clock Display (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-3 bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#00ff87]" />
              <span>Kickoff Countdown</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {currentFixture.scheduledTime}
            </span>
          </div>

          {/* Countdown Digit Blocks */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* Days */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-2 sm:p-2.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono block">
                {String(timeRemaining.days).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mt-0.5">
                Days
              </span>
            </div>

            {/* Hours */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-2 sm:p-2.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono block">
                {String(timeRemaining.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mt-0.5">
                Hours
              </span>
            </div>

            {/* Minutes */}
            <div className={`rounded-xl border p-2 sm:p-2.5 transition ${
              timeRemaining.isStartingSoon 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              <span className="text-xl sm:text-2xl font-black font-mono block">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mt-0.5">
                Mins
              </span>
            </div>

            {/* Seconds */}
            <div className={`rounded-xl border p-2 sm:p-2.5 transition ${
              timeRemaining.isStartingSoon
                ? 'bg-[#00ff87]/20 border-[#00ff87]/50 text-[#00ff87]'
                : 'bg-slate-900 border-slate-800 text-[#00ff87]'
            }`}>
              <span className="text-xl sm:text-2xl font-black font-mono block">
                {String(timeRemaining.seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mt-0.5">
                Secs
              </span>
            </div>
          </div>

          {/* Reminder / Helper Tip */}
          <div className="text-[11px] text-slate-400 leading-snug">
            {timeRemaining.isKickoffNow ? (
              <span className="text-emerald-300 font-medium">
                ⚡ Kickoff time is now! Open eFootball, host a Friend Match, and take a screenshot after 90 mins!
              </span>
            ) : timeRemaining.isStartingSoon ? (
              <span className="text-amber-300 font-medium">
                🔥 Less than 15 minutes remaining! Copy opponent's ID below and prepare your squad.
              </span>
            ) : (
              <span>
                Add your opponent via eFootball ID to get ready before kickoff.
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Head-to-Head Opponent Card (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3.5 bg-gradient-to-r from-slate-950/70 to-slate-900/60 rounded-2xl p-4 border border-slate-800/80">
          
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span>Head-to-Head Matchup</span>
            </span>

            {/* Quick Rules pill */}
            {tournament && (
              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 font-mono">
                {tournament.rules.matchLength} • PK: {tournament.rules.penalties ? 'ON' : 'OFF'}
              </span>
            )}
          </div>

          {/* Opponent & You Display */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            {/* You */}
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={me.avatarUrl || DEFAULT_PLAYER_AVATAR} 
                alt={me.name}
                className="w-10 h-10 rounded-xl object-cover border-2 border-[#00ff87] flex-shrink-0"
                onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
              />
              <div className="min-w-0">
                <span className="text-xs font-black text-white block truncate">
                  {me.name} <span className="text-[10px] text-[#00ff87] font-semibold">(You)</span>
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {me.favoriteClub || 'eFootball FC'}
                </span>
              </div>
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center px-2">
              <span className="rounded-lg bg-[#00ff87]/20 border border-[#00ff87]/40 px-2 py-0.5 text-[10px] font-black uppercase text-[#00ff87]">
                VS
              </span>
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-2.5 min-w-0 text-right justify-end">
              <div className="min-w-0">
                <span className="text-xs font-black text-white block truncate">
                  {opponent.name}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {opponent.favoriteClub || 'Opponent FC'}
                </span>
              </div>
              <img 
                src={opponent.avatarUrl || DEFAULT_PLAYER_AVATAR} 
                alt={opponent.name}
                className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400 flex-shrink-0"
                onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
              />
            </div>
          </div>

          {/* Opponent eFootball ID Copy Strip (Crucial for mobile lobby invite) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] text-slate-400">Opponent eFootball ID:</span>
              <code className="bg-slate-900 px-2 py-0.5 rounded text-white font-mono font-bold text-xs border border-slate-700/80">
                {opponent.efootballId}
              </code>
            </div>

            <button
              onClick={(e) => copyOpponentId(opponent.efootballId, e)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 px-3 py-1.5 text-xs font-black uppercase text-slate-950 transition active:scale-95 shadow-md shadow-amber-400/20"
              title="Copy opponent ID to search in eFootball Mobile"
            >
              {copiedId === opponent.efootballId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-950" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-950" />
                  <span>Copy ID to Add</span>
                </>
              )}
            </button>
          </div>

          {/* CTA Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              onClick={() => onNavigateToFixtures(currentFixture.tournamentId)}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold transition"
            >
              <span>View Tournament Bracket</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateToSubmit(currentFixture)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-4 py-2 text-xs font-black uppercase text-slate-950 hover:brightness-110 active:scale-95 transition shadow-lg shadow-[#00ff87]/20"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Submit Match Score</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
