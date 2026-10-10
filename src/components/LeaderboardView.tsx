import React, { useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Copy, 
  Check, 
  Search, 
  Info, 
  Flame,
  ArrowUpDown
} from 'lucide-react';
import { LeaderboardEntry, Tournament, UserProfile } from '../types/tournament';
import { handleAvatarError, DEFAULT_ADMIN_AVATAR, DEFAULT_PLAYER_AVATAR } from '../utils/imageUtils';

interface LeaderboardViewProps {
  leaderboard: LeaderboardEntry[];
  tournaments: Tournament[];
  selectedTournamentId: string;
  onSelectTournamentId: (id: string) => void;
  currentUser: UserProfile;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboard,
  tournaments,
  selectedTournamentId,
  onSelectTournamentId,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEntries = leaderboard.filter(entry => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return entry.playerName.toLowerCase().includes(q) || entry.efootballId.includes(q);
  });

  const top3 = filteredEntries.slice(0, 3);
  const remaining = filteredEntries.slice(3);

  return (
    <div className="space-y-6">
      
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex-1 max-w-sm">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Tournament Standings
          </label>
          <select
            value={selectedTournamentId}
            onChange={(e) => onSelectTournamentId(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm font-semibold text-white focus:border-[#00ff87] focus:outline-none"
          >
            <option value="">Global Arena Standings (All Tournaments)</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 max-w-xs">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filter Players
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#00ff87] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Podium Display (Top 3) */}
      {top3.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          
          {/* Silver #2 */}
          <div className="order-2 md:order-1 flex flex-col items-center justify-end rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 text-center relative overflow-hidden">
            <div className="absolute top-3 left-3 flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-xs font-black text-slate-300">
              <Medal className="w-3.5 h-3.5 text-slate-300" /> 2nd Place
            </div>
            <img 
              src={top3[1].avatarUrl || DEFAULT_PLAYER_AVATAR} 
              alt={top3[1].playerName}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-slate-400 mb-2 shadow-lg"
              onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
            />
            <h4 className="text-sm font-bold text-white truncate max-w-[160px]">{top3[1].playerName}</h4>
            <span className="text-[11px] text-slate-400 font-mono">ID: {top3[1].efootballId}</span>
            <div className="mt-3 flex items-center gap-3">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase">PTS</span>
                <span className="text-lg font-black text-[#00ff87]">{top3[1].points}</span>
              </div>
              <div className="text-center border-l border-slate-800 pl-3">
                <span className="text-[10px] text-slate-500 block uppercase">GD</span>
                <span className="text-lg font-black text-slate-200">
                  {top3[1].goalDiff > 0 ? `+${top3[1].goalDiff}` : top3[1].goalDiff}
                </span>
              </div>
            </div>
          </div>

          {/* Gold #1 (Tallest & glowing) */}
          <div className="order-1 md:order-2 flex flex-col items-center justify-end rounded-2xl border-2 border-amber-400/80 bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 p-6 text-center relative overflow-hidden shadow-2xl shadow-amber-500/10 scale-105">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-3 left-3 flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 text-xs font-black text-amber-300">
              <Crown className="w-4 h-4 text-amber-400" /> Champion
            </div>
            <div className="relative mb-2">
              <img 
                src={top3[0].avatarUrl || DEFAULT_ADMIN_AVATAR} 
                alt={top3[0].playerName}
                className="h-20 w-20 rounded-2xl object-cover border-3 border-amber-400 shadow-xl"
                onError={(e) => handleAvatarError(e, DEFAULT_ADMIN_AVATAR)}
              />
              <Crown className="w-6 h-6 text-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow" />
            </div>
            <h3 className="text-base font-black text-white truncate max-w-[180px]">{top3[0].playerName}</h3>
            <span className="text-xs text-amber-300/80 font-mono">ID: {top3[0].efootballId}</span>
            <div className="mt-3 flex items-center gap-4 bg-slate-950/80 px-4 py-1.5 rounded-xl border border-amber-500/30">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Points</span>
                <span className="text-xl font-black text-[#00ff87]">{top3[0].points}</span>
              </div>
              <div className="text-center border-l border-slate-800 pl-4">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">W / D / L</span>
                <span className="text-sm font-bold text-white">{top3[0].won}-{top3[0].drawn}-{top3[0].lost}</span>
              </div>
            </div>
          </div>

          {/* Bronze #3 */}
          <div className="order-3 flex flex-col items-center justify-end rounded-2xl border border-amber-800/60 bg-slate-900/70 p-5 text-center relative overflow-hidden">
            <div className="absolute top-3 left-3 flex items-center gap-1 rounded-md bg-amber-900/30 px-2 py-0.5 text-xs font-black text-amber-500">
              <Medal className="w-3.5 h-3.5 text-amber-600" /> 3rd Place
            </div>
            <img 
              src={top3[2].avatarUrl || DEFAULT_PLAYER_AVATAR} 
              alt={top3[2].playerName}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-amber-700 mb-2 shadow-lg"
              onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
            />
            <h4 className="text-sm font-bold text-white truncate max-w-[160px]">{top3[2].playerName}</h4>
            <span className="text-[11px] text-slate-400 font-mono">ID: {top3[2].efootballId}</span>
            <div className="mt-3 flex items-center gap-3">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block uppercase">PTS</span>
                <span className="text-lg font-black text-[#00ff87]">{top3[2].points}</span>
              </div>
              <div className="text-center border-l border-slate-800 pl-3">
                <span className="text-[10px] text-slate-500 block uppercase">GD</span>
                <span className="text-lg font-black text-slate-200">
                  {top3[2].goalDiff > 0 ? `+${top3[2].goalDiff}` : top3[2].goalDiff}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Points Table Explanation Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-slate-300">
            <Info className="w-3.5 h-3.5 text-[#00ff87]" />
            Points Rule:
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded text-[11px] border border-slate-800">
            Win: <strong className="text-[#00ff87]">3 pts</strong>
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded text-[11px] border border-slate-800">
            Draw: <strong className="text-sky-400">1 pt</strong>
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded text-[11px] border border-slate-800">
            Loss: <strong className="text-slate-500">0 pts</strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Tiebreaker: Points &gt; GD &gt; GF &gt; Wins
        </div>
      </div>

      {/* Comprehensive Standings Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 uppercase tracking-wider text-[10px] font-black text-slate-400">
              <tr>
                <th scope="col" className="px-3.5 py-3 text-center w-12">#</th>
                <th scope="col" className="px-4 py-3">Player / Club</th>
                <th scope="col" className="px-3 py-3 text-center">MP</th>
                <th scope="col" className="px-3 py-3 text-center">W</th>
                <th scope="col" className="px-3 py-3 text-center">D</th>
                <th scope="col" className="px-3 py-3 text-center">L</th>
                <th scope="col" className="px-3 py-3 text-center hidden sm:table-cell">GF</th>
                <th scope="col" className="px-3 py-3 text-center hidden sm:table-cell">GA</th>
                <th scope="col" className="px-3 py-3 text-center">GD</th>
                <th scope="col" className="px-4 py-3 text-center font-bold text-[#00ff87]">PTS</th>
                <th scope="col" className="px-4 py-3 text-center hidden md:table-cell">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 text-xs">
                    No leaderboard standings yet. Players and matches will appear here once verified.
                  </td>
                </tr>
              ) : filteredEntries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isCurrentUser = entry.playerId === currentUser.id;

                  return (
                    <tr 
                      key={entry.playerId}
                      className={`transition-colors hover:bg-slate-800/40 ${
                        isCurrentUser ? 'bg-[#00ff87]/5 font-semibold text-white' : ''
                      }`}
                    >
                    {/* Rank */}
                    <td className="px-3.5 py-3 text-center font-mono">
                      {rank === 1 ? (
                        <span className="flex h-6 w-6 mx-auto items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-[11px]">
                          1
                        </span>
                      ) : rank === 2 ? (
                        <span className="flex h-6 w-6 mx-auto items-center justify-center rounded-full bg-slate-300 text-slate-950 font-black text-[11px]">
                          2
                        </span>
                      ) : rank === 3 ? (
                        <span className="flex h-6 w-6 mx-auto items-center justify-center rounded-full bg-amber-700 text-white font-black text-[11px]">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400">{rank}</span>
                      )}
                    </td>

                    {/* Player Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={entry.avatarUrl || DEFAULT_PLAYER_AVATAR} 
                          alt={entry.playerName} 
                          className="h-8 w-8 rounded-lg object-cover border border-slate-700"
                          onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold ${
                              isCurrentUser ? 'text-[#00ff87]' : 'text-white'
                            }`}>
                              {entry.playerName}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[9px] bg-[#00ff87]/20 text-[#00ff87] px-1 rounded uppercase font-bold">
                                You
                              </span>
                            )}
                          </div>
                          
                          {/* Copy ID button */}
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">ID: {entry.efootballId}</span>
                            <button
                              onClick={() => copyId(entry.efootballId)}
                              className="text-slate-500 hover:text-white"
                              title="Copy eFootball ID"
                            >
                              {copiedId === entry.efootballId ? (
                                <Check className="w-2.5 h-2.5 text-[#00ff87]" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                            {entry.favoriteClub && (
                              <span className="text-[10px] text-slate-500 hidden sm:inline">• {entry.favoriteClub}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* MP */}
                    <td className="px-3 py-3 text-center font-mono text-slate-300">{entry.played}</td>
                    {/* W */}
                    <td className="px-3 py-3 text-center font-mono text-emerald-400">{entry.won}</td>
                    {/* D */}
                    <td className="px-3 py-3 text-center font-mono text-sky-400">{entry.drawn}</td>
                    {/* L */}
                    <td className="px-3 py-3 text-center font-mono text-rose-400">{entry.lost}</td>
                    {/* GF */}
                    <td className="px-3 py-3 text-center font-mono text-slate-400 hidden sm:table-cell">{entry.goalsFor}</td>
                    {/* GA */}
                    <td className="px-3 py-3 text-center font-mono text-slate-400 hidden sm:table-cell">{entry.goalsAgainst}</td>
                    
                    {/* GD */}
                    <td className={`px-3 py-3 text-center font-mono font-bold ${
                      entry.goalDiff > 0 
                        ? 'text-emerald-400' 
                        : entry.goalDiff < 0 
                        ? 'text-rose-400' 
                        : 'text-slate-400'
                    }`}>
                      {entry.goalDiff > 0 ? `+${entry.goalDiff}` : entry.goalDiff}
                    </td>

                    {/* PTS */}
                    <td className="px-4 py-3 text-center font-mono text-base font-black text-[#00ff87]">
                      {entry.points}
                    </td>

                    {/* Form pills */}
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {entry.form.length === 0 ? (
                          <span className="text-[10px] text-slate-600">—</span>
                        ) : (
                          entry.form.map((res, i) => (
                            <span
                              key={i}
                              className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-black ${
                                res === 'W'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : res === 'D'
                                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {res}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
