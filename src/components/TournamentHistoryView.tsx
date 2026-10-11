import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Calendar, 
  Users, 
  Sparkles, 
  Search, 
  Copy, 
  Check, 
  Eye, 
  Share2, 
  Gamepad2, 
  Flame, 
  ArrowRight, 
  Award, 
  ShieldCheck, 
  Table, 
  Clock, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Tournament, MatchFixture, UserProfile, LeaderboardEntry } from '../types/tournament';
import { 
  HISTORICAL_COMPLETED_TOURNAMENTS, 
  HISTORICAL_COMPLETED_FIXTURES 
} from '../services/mockData';
import { calculateLeaderboard } from '../services/tournamentService';
import { handleAvatarError, handleBannerError, DEFAULT_PLAYER_AVATAR, DEFAULT_BANNER } from '../utils/imageUtils';

interface TournamentHistoryViewProps {
  tournaments: Tournament[];
  fixtures: MatchFixture[];
  currentUser: UserProfile;
  onViewScreenshot: (url: string, title: string) => void;
  onNavigateToFixtures: (tournamentId?: string) => void;
}

export const TournamentHistoryView: React.FC<TournamentHistoryViewProps> = ({
  tournaments,
  fixtures,
  currentUser,
  onViewScreenshot,
  onNavigateToFixtures
}) => {
  // Combine user-completed tournaments with historical archive tournaments
  const allCompletedTournaments = useMemo(() => {
    const liveCompleted = tournaments.filter(t => t.status === 'completed');
    const existingIds = new Set(liveCompleted.map(t => t.id));
    const archivedOnly = HISTORICAL_COMPLETED_TOURNAMENTS.filter(t => !existingIds.has(t.id));
    return [...liveCompleted, ...archivedOnly];
  }, [tournaments]);

  const [selectedTourId, setSelectedTourId] = useState<string>(() => {
    return allCompletedTournaments[0]?.id || '';
  });

  const [activeSubTab, setActiveSubTab] = useState<'standings' | 'matches' | 'stats'>('standings');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Active tournament object
  const currentTour = useMemo(() => {
    return allCompletedTournaments.find(t => t.id === selectedTourId) || allCompletedTournaments[0] || null;
  }, [allCompletedTournaments, selectedTourId]);

  // Combined fixtures for this tournament (including historical archive fixtures)
  const tourFixtures = useMemo(() => {
    if (!currentTour) return [];
    const liveFixtures = fixtures.filter(f => f.tournamentId === currentTour.id);
    if (liveFixtures.length > 0) return liveFixtures;
    return HISTORICAL_COMPLETED_FIXTURES.filter(f => f.tournamentId === currentTour.id);
  }, [currentTour, fixtures]);

  // Compute standings
  const leaderboard = useMemo(() => {
    if (!currentTour) return [];
    const calculated = calculateLeaderboard(currentTour.id);
    if (calculated.length > 0) return calculated;

    // Fallback standings from completed fixtures
    const statsMap: Record<string, LeaderboardEntry> = {};
    tourFixtures.forEach(f => {
      [f.player1, f.player2].forEach(p => {
        if (!statsMap[p.id]) {
          statsMap[p.id] = {
            playerId: p.id,
            playerName: p.name,
            efootballId: p.efootballId,
            avatarUrl: p.avatarUrl,
            favoriteClub: p.favoriteClub,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDiff: 0,
            points: 0,
            form: []
          };
        }
      });

      if (f.status === 'approved' && f.result) {
        const s1 = f.result.player1Score;
        const s2 = f.result.player2Score;
        const p1 = statsMap[f.player1.id];
        const p2 = statsMap[f.player2.id];

        if (p1 && p2) {
          p1.played++;
          p2.played++;
          p1.goalsFor += s1;
          p1.goalsAgainst += s2;
          p1.goalDiff = p1.goalsFor - p1.goalsAgainst;
          p2.goalsFor += s2;
          p2.goalsAgainst += s1;
          p2.goalDiff = p2.goalsFor - p2.goalsAgainst;

          if (s1 > s2) {
            p1.won++;
            p1.points += 3;
            p1.form.push('W');
            p2.lost++;
            p2.form.push('L');
          } else if (s2 > s1) {
            p2.won++;
            p2.points += 3;
            p2.form.push('W');
            p1.lost++;
            p1.form.push('L');
          } else {
            p1.drawn++;
            p2.drawn++;
            p1.points += 1;
            p2.points += 1;
            p1.form.push('D');
            p2.form.push('D');
          }
        }
      }
    });

    return Object.values(statsMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });
  }, [currentTour, tourFixtures]);

  const top3 = leaderboard.slice(0, 3);
  const filteredStandings = leaderboard.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.playerName.toLowerCase().includes(q) || e.efootballId.toLowerCase().includes(q);
  });

  // Tournament aggregate statistics
  interface TourStats {
    totalMatches: number;
    completedMatches: number;
    totalGoals: number;
    avgGoals: string;
    highestScoringMatch: MatchFixture | null;
    goldenBoot: LeaderboardEntry | null;
    bestDefense: LeaderboardEntry | null;
  }

  const stats = useMemo<TourStats>(() => {
    const totalMatches = tourFixtures.length;
    const completedMatches = tourFixtures.filter(f => f.status === 'approved').length;
    let totalGoals = 0;
    let highestScoringMatch: MatchFixture | null = null;
    let maxGoalsInSingleMatch = 0;

    tourFixtures.forEach(f => {
      if (f.result) {
        const sum = (f.result.player1Score || 0) + (f.result.player2Score || 0);
        totalGoals += sum;
        if (sum > maxGoalsInSingleMatch) {
          maxGoalsInSingleMatch = sum;
          highestScoringMatch = f;
        }
      }
    });

    const goldenBoot = [...leaderboard].sort((a, b) => b.goalsFor - a.goalsFor)[0] || null;
    const bestDefense = [...leaderboard].filter(e => e.played > 0).sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0] || null;

    return {
      totalMatches,
      completedMatches,
      totalGoals,
      avgGoals: completedMatches > 0 ? (totalGoals / completedMatches).toFixed(1) : '0.0',
      highestScoringMatch,
      goldenBoot,
      bestDefense
    };
  }, [tourFixtures, leaderboard]);

  const copyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyRecapSummary = () => {
    if (!currentTour) return;
    const champ = top3[0] ? top3[0].playerName : (currentTour.winnerName || 'TBD');
    const text = 
      `🏆 eFootball BD Tournament History Recap 🏆\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🌟 Event: ${currentTour.title}\n` +
      `🥇 Champion: ${champ}\n` +
      (top3[1] ? `🥈 Runner-Up: ${top3[1].playerName}\n` : '') +
      (top3[2] ? `🥉 3rd Place: ${top3[2].playerName}\n` : '') +
      `🎁 Prize: ${currentTour.prizePool}\n` +
      `⚽ Total Goals: ${stats.totalGoals} (${stats.avgGoals} goals/match)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `View full match archives & proof screenshots in eFootball Tournament Arena!`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  if (!currentTour) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center max-w-xl mx-auto space-y-4">
        <Trophy className="w-14 h-14 text-slate-600 mx-auto" />
        <h2 className="text-xl font-black text-white">No Completed Tournaments Yet</h2>
        <p className="text-xs text-slate-400">
          Once ongoing tournaments wrap up, their official podiums, final points tables, and match history will be permanently archived here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Archive Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#0a1224] to-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
                Tournament History &amp; Hall of Fame
              </h1>
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300 border border-amber-500/40">
                Official Archives
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse concluded championships, final podium rankings, and verified match score records.
            </p>
          </div>
        </div>

        {/* Tournament Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <select
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(e.target.value)}
              className="w-full appearance-none rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 pr-8 text-xs font-bold text-white focus:border-[#00ff87] focus:outline-none transition shadow-inner cursor-pointer"
            >
              {allCompletedTournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.format.toUpperCase()})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>

          <button
            onClick={copyRecapSummary}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2.5 text-xs font-bold text-slate-200 transition"
            title="Copy tournament summary to share"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00ff87]" />
                <span className="text-[#00ff87]">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share Recap</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Banner for Selected Historical Tournament */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-slate-950">
          <img 
            src={currentTour.bannerUrl} 
            alt={currentTour.title}
            className="h-full w-full object-cover" 
            onError={(e) => handleBannerError(e, DEFAULT_BANNER)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-slate-800/90 backdrop-blur-md px-2.5 py-1 text-xs font-black uppercase text-slate-300 border border-slate-700">
              Completed Event
            </span>
            <span className="rounded-lg bg-black/70 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-[#00e5ff] uppercase border border-cyan-500/30">
              {currentTour.format}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                {currentTour.title}
              </h2>
              <p className="text-xs text-slate-300 max-w-xl line-clamp-2 mt-1 drop-shadow">
                {currentTour.description}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-400/40 px-3 py-1.5 text-xs font-black text-amber-300 flex items-center gap-1.5 shadow-lg">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Prize: {currentTour.prizePool}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Championship Podium (Top 3) */}
      {top3.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#14120a] via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
          
          <div className="text-center max-w-md mx-auto mb-6">
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              <Crown className="w-3.5 h-3.5" />
              <span>Championship Podium</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
              Honorary Champions
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Final tournament standings calculated from all verified fixtures.
            </p>
          </div>

          {/* Podium Grid (2nd - 1st - 3rd) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 max-w-2xl mx-auto items-end pt-4">
            
            {/* 2nd Place (Runner-up) */}
            {top3[1] ? (
              <div className="flex flex-col items-center text-center group">
                <div className="relative mb-2">
                  <img 
                    src={top3[1].avatarUrl || DEFAULT_PLAYER_AVATAR} 
                    alt={top3[1].playerName}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-slate-400 shadow-xl group-hover:scale-105 transition-transform"
                    onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
                  />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-slate-950 font-black text-xs shadow-md border-2 border-slate-900">
                    2
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-full">
                  {top3[1].playerName}
                </h4>
                <span className="text-[10px] text-slate-400 truncate max-w-full">
                  {top3[1].favoriteClub || 'eFootball FC'}
                </span>
                <span className="mt-1 text-xs font-bold text-slate-300">
                  {top3[1].points} pts
                </span>
                
                {/* Podium Pedestal */}
                <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-slate-800 to-slate-700/60 rounded-t-2xl border-t-2 border-slate-400/80 flex items-center justify-center mt-3 shadow-lg">
                  <span className="text-xl sm:text-2xl font-black text-slate-300">2nd</span>
                </div>
              </div>
            ) : <div />}

            {/* 1st Place (Champion) */}
            {top3[0] && (
              <div className="flex flex-col items-center text-center group -mt-6">
                <div className="relative mb-2">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
                    <Crown className="w-7 h-7 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
                  </div>
                  <img 
                    src={top3[0].avatarUrl || DEFAULT_PLAYER_AVATAR} 
                    alt={top3[0].playerName}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border-3 border-amber-400 shadow-2xl group-hover:scale-105 transition-transform shadow-amber-500/20"
                    onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
                  />
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-md border-2 border-slate-900">
                    🥇
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-amber-300 truncate max-w-full">
                  {top3[0].playerName}
                </h4>
                <span className="text-[10px] sm:text-xs text-slate-300 truncate max-w-full">
                  {top3[0].favoriteClub || 'Champion'}
                </span>
                <span className="mt-1 text-xs sm:text-sm font-black text-[#00ff87]">
                  {top3[0].points} pts ({top3[0].won}W)
                </span>

                {/* Podium Pedestal */}
                <div className="w-full h-28 sm:h-32 bg-gradient-to-t from-amber-950/80 via-amber-900/60 to-amber-600/60 rounded-t-2xl border-t-3 border-amber-400 flex flex-col items-center justify-center mt-3 shadow-2xl shadow-amber-500/20">
                  <Trophy className="w-6 h-6 text-amber-300 mb-0.5" />
                  <span className="text-xl sm:text-2xl font-black text-amber-200">CHAMPION</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] ? (
              <div className="flex flex-col items-center text-center group">
                <div className="relative mb-2">
                  <img 
                    src={top3[2].avatarUrl || DEFAULT_PLAYER_AVATAR} 
                    alt={top3[2].playerName}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-amber-700 shadow-xl group-hover:scale-105 transition-transform"
                    onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
                  />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-amber-100 font-black text-xs shadow-md border-2 border-slate-900">
                    3
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-full">
                  {top3[2].playerName}
                </h4>
                <span className="text-[10px] text-slate-400 truncate max-w-full">
                  {top3[2].favoriteClub || 'eFootball FC'}
                </span>
                <span className="mt-1 text-xs font-bold text-slate-300">
                  {top3[2].points} pts
                </span>

                {/* Podium Pedestal */}
                <div className="w-full h-16 sm:h-20 bg-gradient-to-t from-slate-900 to-amber-950/60 rounded-t-2xl border-t-2 border-amber-700/80 flex items-center justify-center mt-3 shadow-lg">
                  <span className="text-xl sm:text-2xl font-black text-amber-600">3rd</span>
                </div>
              </div>
            ) : <div />}

          </div>

        </div>
      )}

      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('standings')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'standings'
              ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Final Standings ({leaderboard.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('matches')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'matches'
              ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Match Archive ({tourFixtures.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('stats')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'stats'
              ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Tournament Awards &amp; Stats</span>
        </button>
      </div>

      {/* TAB 1: FINAL STANDINGS TABLE */}
      {activeSubTab === 'standings' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 shadow-xl space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Final Championship Points Table</span>
              </h3>
              <p className="text-xs text-slate-400">
                Official tournament conclusion records with goals for/against and form streaks.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search player or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-[#00ff87] focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 sm:px-4 text-center">Rank</th>
                  <th className="py-3 px-3 sm:px-4">Player</th>
                  <th className="py-3 px-3 text-center">P</th>
                  <th className="py-3 px-2 text-center">W</th>
                  <th className="py-3 px-2 text-center">D</th>
                  <th className="py-3 px-2 text-center">L</th>
                  <th className="py-3 px-2 text-center">GF</th>
                  <th className="py-3 px-2 text-center">GA</th>
                  <th className="py-3 px-2 text-center font-mono">GD</th>
                  <th className="py-3 px-3 text-center font-bold text-[#00ff87]">Pts</th>
                  <th className="py-3 px-3 text-center hidden md:table-cell">Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStandings.map((entry, index) => {
                  const isTop1 = index === 0;
                  const isTop3 = index < 3;
                  const isMe = entry.playerId === currentUser.id;

                  return (
                    <tr 
                      key={entry.playerId}
                      className={`hover:bg-slate-900/60 transition ${
                        isMe ? 'bg-[#00ff87]/5 border-l-2 border-[#00ff87]' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-lg text-xs font-black ${
                          isTop1 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                            : isTop3
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>

                      {/* Player */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={entry.avatarUrl || DEFAULT_PLAYER_AVATAR} 
                            alt={entry.playerName}
                            className="h-8 w-8 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                            onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate flex items-center gap-1.5">
                              <span>{entry.playerName}</span>
                              {isTop1 && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                            </span>
                            <div 
                              onClick={(e) => copyId(entry.efootballId, e)}
                              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#00e5ff] cursor-pointer font-mono"
                              title="Copy eFootball ID"
                            >
                              <span>{entry.efootballId}</span>
                              {copiedId === entry.efootballId ? (
                                <Check className="w-2.5 h-2.5 text-[#00ff87]" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 opacity-60" />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center text-slate-300 font-mono">{entry.played}</td>
                      <td className="py-3 px-2 text-center text-slate-300 font-mono">{entry.won}</td>
                      <td className="py-3 px-2 text-center text-slate-400 font-mono">{entry.drawn}</td>
                      <td className="py-3 px-2 text-center text-slate-400 font-mono">{entry.lost}</td>
                      <td className="py-3 px-2 text-center text-slate-300 font-mono">{entry.goalsFor}</td>
                      <td className="py-3 px-2 text-center text-slate-400 font-mono">{entry.goalsAgainst}</td>
                      <td className={`py-3 px-2 text-center font-mono font-bold ${
                        entry.goalDiff > 0 ? 'text-emerald-400' : entry.goalDiff < 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {entry.goalDiff > 0 ? `+${entry.goalDiff}` : entry.goalDiff}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-white text-sm">
                        {entry.points}
                      </td>

                      {/* Form */}
                      <td className="py-3 px-3 text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          {entry.form.slice(-5).map((f, i) => (
                            <span 
                              key={i}
                              className={`h-4 w-4 rounded text-[9px] font-bold flex items-center justify-center ${
                                f === 'W' 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                                  : f === 'D'
                                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: MATCH ARCHIVE & SCREENSHOT PROOFS */}
      {activeSubTab === 'matches' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Concluded Matches Archive</span>
              </h3>
              <p className="text-xs text-slate-400">
                Browse verified match scores, goal tallies, and full-screen result proofs.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {tourFixtures.length} Matches Total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {tourFixtures.map(fixture => {
              const res = fixture.result;
              const hasScore = Boolean(res);
              const p1Score = res?.player1Score ?? 0;
              const p2Score = res?.player2Score ?? 0;

              return (
                <div 
                  key={fixture.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-black uppercase text-slate-300">
                      {fixture.round}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {fixture.scheduledTime}
                    </span>
                  </div>

                  {/* Scoreline */}
                  <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                    {/* Player 1 */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <img 
                        src={fixture.player1.avatarUrl || DEFAULT_PLAYER_AVATAR} 
                        alt={fixture.player1.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                        onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {fixture.player1.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate font-mono">
                          {fixture.player1.efootballId}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-black/60 rounded-lg border border-slate-800">
                      <span className={`text-base font-black ${p1Score > p2Score ? 'text-[#00ff87]' : 'text-white'}`}>
                        {p1Score}
                      </span>
                      <span className="text-slate-600 font-bold">-</span>
                      <span className={`text-base font-black ${p2Score > p1Score ? 'text-[#00ff87]' : 'text-white'}`}>
                        {p2Score}
                      </span>
                    </div>

                    {/* Player 2 */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {fixture.player2.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate font-mono">
                          {fixture.player2.efootballId}
                        </span>
                      </div>
                      <img 
                        src={fixture.player2.avatarUrl || DEFAULT_PLAYER_AVATAR} 
                        alt={fixture.player2.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                        onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
                      />
                    </div>
                  </div>

                  {/* Actions & Proof Inspection */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verified Result</span>
                    </span>

                    {res?.screenshotUrl ? (
                      <button
                        onClick={() => onViewScreenshot(
                          res.screenshotUrl, 
                          `${fixture.player1.name} vs ${fixture.player2.name} (${fixture.round})`
                        )}
                        className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-[#00ff87] border border-slate-700 transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect Screenshot Proof</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No image proof</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TOURNAMENT AWARDS & AGGREGATE STATS */}
      {activeSubTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Golden Boot Top Scorer */}
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Trophy className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Golden Boot Winner</span>
            </div>
            {stats.goldenBoot ? (
              <div>
                <h4 className="text-lg font-black text-white">{stats.goldenBoot.playerName}</h4>
                <p className="text-xs text-slate-400">{stats.goldenBoot.favoriteClub}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-2xl font-black text-amber-400">{stats.goldenBoot.goalsFor}</span>
                  <span className="text-xs text-slate-400">Goals Scored in Event</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No stats recorded</p>
            )}
          </div>

          {/* Card 2: Best Defensive Team */}
          <div className="rounded-2xl border border-sky-500/30 bg-slate-900/90 p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-sky-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Golden Glove / Defense</span>
            </div>
            {stats.bestDefense ? (
              <div>
                <h4 className="text-lg font-black text-white">{stats.bestDefense.playerName}</h4>
                <p className="text-xs text-slate-400">{stats.bestDefense.favoriteClub}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-2xl font-black text-sky-400">{stats.bestDefense.goalsAgainst}</span>
                  <span className="text-xs text-slate-400">Fewest Goals Conceded</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No stats recorded</p>
            )}
          </div>

          {/* Card 3: Total Goals & Match Average */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-[#00ff87]">
              <Flame className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Event Goal Tally</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{stats.totalGoals}</span>
                <span className="text-xs text-slate-400">Total Goals</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Average <strong className="text-[#00ff87]">{stats.avgGoals}</strong> goals per match across {stats.completedMatches} fixtures.
              </p>
            </div>
          </div>

          {/* Card 4: Highest Scoring Match */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-purple-400">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">Most Thrilling Match</span>
            </div>
            {stats.highestScoringMatch && stats.highestScoringMatch.result ? (
              <div>
                <h4 className="text-xs font-bold text-white truncate">
                  {stats.highestScoringMatch.player1.name} vs {stats.highestScoringMatch.player2.name}
                </h4>
                <div className="mt-2 text-xl font-black text-purple-400">
                  {stats.highestScoringMatch.result.player1Score} - {stats.highestScoringMatch.result.player2Score}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {stats.highestScoringMatch.round}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No matches recorded</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
