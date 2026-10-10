import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Hourglass, 
  XCircle, 
  Copy, 
  Check, 
  Eye, 
  Upload, 
  Filter, 
  Search,
  ExternalLink,
  ShieldCheck,
  Gamepad2,
  Send,
  CheckCircle2
} from 'lucide-react';
import { MatchFixture, Tournament, UserProfile } from '../types/tournament';
import { handleAvatarError, DEFAULT_PLAYER_AVATAR } from '../utils/imageUtils';
import { broadcastFixturesToTelegram, broadcastSingleFixtureToTelegram } from '../services/tournamentService';

interface FixturesViewProps {
  fixtures: MatchFixture[];
  tournaments: Tournament[];
  selectedTournamentId: string;
  onSelectTournamentId: (id: string) => void;
  currentUser: UserProfile;
  onSubmitResult: (fixture: MatchFixture) => void;
  onViewScreenshot: (url: string, fixtureTitle: string) => void;
}

export const FixturesView: React.FC<FixturesViewProps> = ({
  fixtures,
  tournaments,
  selectedTournamentId,
  onSelectTournamentId,
  currentUser,
  onSubmitResult,
  onViewScreenshot
}) => {
  const [filterType, setFilterType] = useState<'all' | 'my' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isBroadcastingAll, setIsBroadcastingAll] = useState(false);
  const [postingFixtureId, setPostingFixtureId] = useState<string | null>(null);
  const [broadcastAlert, setBroadcastAlert] = useState<{ text: string; isError?: boolean } | null>(null);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBroadcastAllFixtures = async () => {
    const targetTourId = selectedTournamentId || (fixtures.length > 0 ? fixtures[0].tournamentId : null);
    if (!targetTourId) {
      setBroadcastAlert({ text: 'Please select a tournament with scheduled fixtures to broadcast.', isError: true });
      return;
    }

    try {
      setIsBroadcastingAll(true);
      const res = await broadcastFixturesToTelegram(targetTourId);
      setBroadcastAlert({
        text: res.message || 'Match fixtures posted to Telegram channel (@eFootballTournamentBD)!',
        isError: !res.success
      });
      setTimeout(() => setBroadcastAlert(null), 6000);
    } catch (err: any) {
      setBroadcastAlert({
        text: err.message || 'Failed to post fixtures to Telegram.',
        isError: true
      });
    } finally {
      setIsBroadcastingAll(false);
    }
  };

  const handleBroadcastSingle = async (fixtureId: string) => {
    try {
      setPostingFixtureId(fixtureId);
      const res = await broadcastSingleFixtureToTelegram(fixtureId);
      setBroadcastAlert({
        text: res.message || 'Match fixture posted to Telegram channel!',
        isError: !res.success
      });
      setTimeout(() => setBroadcastAlert(null), 5000);
    } catch (err: any) {
      setBroadcastAlert({
        text: err.message || 'Failed to post match fixture to Telegram.',
        isError: true
      });
    } finally {
      setPostingFixtureId(null);
    }
  };

  // Filter fixtures by tournament
  const tournamentFixtures = fixtures.filter(f => 
    !selectedTournamentId || f.tournamentId === selectedTournamentId
  );

  // Filter fixtures by tab & search query
  const filteredFixtures = tournamentFixtures.filter(f => {
    // Status filter
    if (filterType === 'my') {
      const isMyMatch = f.player1.id === currentUser.id || f.player2.id === currentUser.id;
      if (!isMyMatch) return false;
    } else if (filterType === 'pending') {
      if (f.status === 'approved') return false;
    } else if (filterType === 'completed') {
      if (f.status !== 'approved') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const p1Match = f.player1.name.toLowerCase().includes(query) || f.player1.efootballId.includes(query);
      const p2Match = f.player2.name.toLowerCase().includes(query) || f.player2.efootballId.includes(query);
      const roundMatch = f.round.toLowerCase().includes(query);
      return p1Match || p2Match || roundMatch;
    }

    return true;
  });

  const currentTour = tournaments.find(t => t.id === selectedTournamentId);

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        
        {/* Tournament Selector */}
        <div className="flex-1 max-w-md">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Selected Tournament
          </label>
          <select
            value={selectedTournamentId}
            onChange={(e) => onSelectTournamentId(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm font-semibold text-white focus:border-[#00ff87] focus:outline-none"
          >
            <option value="">All Tournaments ({fixtures.length} matches)</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.format.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Search input */}
        <div className="flex-1 max-w-sm">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Search Player / eFootball ID
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="e.g. Striker or 982-412"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#00ff87] focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-end overflow-x-auto">
          {(['all', 'my', 'pending', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition ${
                filterType === tab
                  ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'my' ? 'My Matches' : tab === 'pending' ? 'Pending' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Rules pill for selected tournament */}
      {currentTour && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a1224] border border-cyan-500/20 px-4 py-2.5 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <Gamepad2 className="w-4 h-4 text-[#00e5ff]" />
            <span>Match Rules: {currentTour.rules.matchLength} • Extra Time: {currentTour.rules.extraTime ? 'ON' : 'OFF'} • Penalties: {currentTour.rules.penalties ? 'ON' : 'OFF'} • Condition: {currentTour.rules.playerCondition}</span>
          </div>
          <span className="text-slate-400 font-mono">
            {tournamentFixtures.filter(f => f.status === 'approved').length}/{tournamentFixtures.length} Matches Completed
          </span>
        </div>
      )}

      {/* Broadcast Alert Banner if recently dispatched */}
      {broadcastAlert && (
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-xs transition ${
          broadcastAlert.isError
            ? 'bg-rose-950/40 border border-rose-500/40 text-rose-200'
            : 'bg-sky-950/40 border border-sky-500/40 text-sky-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {broadcastAlert.isError ? (
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span><strong>Telegram Broadcast:</strong> {broadcastAlert.text}</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://t.me/eFootballTournamentBD"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[#00ff87] hover:underline flex items-center gap-1"
            >
              <span>View Channel</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setBroadcastAlert(null)}
              className="text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Broadcast Fixtures to Telegram Banner */}
      {tournamentFixtures.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-sky-950/60 via-slate-900 to-slate-900 border border-sky-500/30 p-3.5 sm:p-4 rounded-2xl shadow-lg shadow-sky-950/20">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-500/20 p-2 text-sky-400 border border-sky-500/30">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>Post Fixtures to Telegram Channel</span>
                <span className="text-[10px] text-sky-300 font-normal">(@eFootballTournamentBD)</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Publish full match schedule, opponent pairings &amp; eFootball IDs directly to your Telegram channel.
              </p>
            </div>
          </div>

          <button
            onClick={handleBroadcastAllFixtures}
            disabled={isBroadcastingAll}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-black uppercase text-white shadow-lg shadow-sky-500/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isBroadcastingAll ? 'Posting Fixtures...' : 'Post Fixtures to Telegram'}</span>
          </button>
        </div>
      )}

      {/* Fixtures List */}
      {filteredFixtures.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No match fixtures found</h3>
          <p className="text-xs text-slate-500 mt-1">Try changing your filters or generate new pairings from the Admin Desk.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFixtures.map((fixture) => {
            const isUserP1 = fixture.player1.id === currentUser.id;
            const isUserP2 = fixture.player2.id === currentUser.id;
            const isMyMatch = isUserP1 || isUserP2;
            const hasScore = Boolean(fixture.result);

            return (
              <div 
                key={fixture.id}
                className={`relative overflow-hidden rounded-2xl border transition-all ${
                  isMyMatch 
                    ? 'border-[#00ff87]/50 bg-slate-900/95 shadow-lg shadow-[#00ff87]/5' 
                    : 'border-slate-800/80 bg-slate-900/70'
                }`}
              >
                {/* Header Strip */}
                <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#00ff87] tracking-wider uppercase text-[11px]">
                      {fixture.round}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {fixture.scheduledTime}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {fixture.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-[#00ff87] border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    ) : fixture.status === 'submitted' ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30 animate-pulse">
                        <Hourglass className="w-3 h-3" />
                        Under Review
                      </span>
                    ) : fixture.status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                        <XCircle className="w-3 h-3" />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                        Scheduled
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Opponents Body */}
                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-7 items-center gap-2">
                    
                    {/* Player 1 (3 cols) */}
                    <div className="col-span-3 text-left space-y-1.5">
                      <div className="flex items-center gap-2">
                        <img 
                          src={fixture.player1.avatarUrl || DEFAULT_PLAYER_AVATAR} 
                          alt={fixture.player1.name} 
                          className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl object-cover border ${
                            isUserP1 ? 'border-[#00ff87]' : 'border-slate-700'
                          }`}
                          onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
                        />
                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-bold truncate ${
                            isUserP1 ? 'text-[#00ff87]' : 'text-white'
                          }`}>
                            {fixture.player1.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {fixture.player1.favoriteClub || 'Club'}
                          </p>
                        </div>
                      </div>

                      {/* Copy Opponent eFootball ID */}
                      <button
                        onClick={() => copyId(fixture.player1.efootballId)}
                        className="flex items-center gap-1 rounded bg-slate-950 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-300 hover:text-[#00ff87] border border-slate-800"
                        title="Copy eFootball ID"
                      >
                        <span>ID: {fixture.player1.efootballId}</span>
                        {copiedId === fixture.player1.efootballId ? (
                          <Check className="w-2.5 h-2.5 text-[#00ff87]" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 opacity-60" />
                        )}
                      </button>
                    </div>

                    {/* Score / VS Center (1 col) */}
                    <div className="col-span-1 text-center">
                      {hasScore ? (
                        <div className="flex flex-col items-center">
                          <div className={`rounded-lg px-2.5 py-1 font-mono text-base sm:text-lg font-black tracking-widest ${
                            fixture.status === 'approved'
                              ? 'bg-gradient-to-r from-[#00ff87]/20 to-[#00e5ff]/20 text-[#00ff87] border border-[#00ff87]/40 shadow-md shadow-[#00ff87]/10'
                              : 'bg-slate-950 text-amber-300 border border-slate-700'
                          }`}>
                            {fixture.result?.player1Score} - {fixture.result?.player2Score}
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                            FT
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-full bg-slate-950 border border-slate-800 px-2 py-1 text-xs font-black text-slate-500">
                          VS
                        </div>
                      )}
                    </div>

                    {/* Player 2 (3 cols) */}
                    <div className="col-span-3 text-right space-y-1.5 flex flex-col items-end">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-bold truncate ${
                            isUserP2 ? 'text-[#00ff87]' : 'text-white'
                          }`}>
                            {fixture.player2.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {fixture.player2.favoriteClub || 'Club'}
                          </p>
                        </div>
                        <img 
                          src={fixture.player2.avatarUrl || DEFAULT_PLAYER_AVATAR} 
                          alt={fixture.player2.name} 
                          className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl object-cover border ${
                            isUserP2 ? 'border-[#00ff87]' : 'border-slate-700'
                          }`}
                          onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
                        />
                      </div>

                      {/* Copy Opponent eFootball ID */}
                      <button
                        onClick={() => copyId(fixture.player2.efootballId)}
                        className="flex items-center gap-1 rounded bg-slate-950 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-300 hover:text-[#00ff87] border border-slate-800"
                        title="Copy eFootball ID"
                      >
                        <span>ID: {fixture.player2.efootballId}</span>
                        {copiedId === fixture.player2.efootballId ? (
                          <Check className="w-2.5 h-2.5 text-[#00ff87]" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 opacity-60" />
                        )}
                      </button>
                    </div>

                  </div>

                  {/* Rejection Note if rejected */}
                  {fixture.status === 'rejected' && fixture.result?.adminVerdict?.rejectionReason && (
                    <div className="mt-3 rounded-lg bg-rose-950/40 border border-rose-800/60 p-2 text-[11px] text-rose-300">
                      <strong>Admin Note:</strong> {fixture.result.adminVerdict.rejectionReason}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Screenshot view button if submitted */}
                      {fixture.result?.screenshotUrl && (
                        <button
                          onClick={() => onViewScreenshot(
                            fixture.result!.screenshotUrl, 
                            `${fixture.player1.name} vs ${fixture.player2.name}`
                          )}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-[#00ff87] hover:border-[#00ff87]/40 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      )}

                      {/* Post Match to Telegram Button */}
                      <button
                        type="button"
                        onClick={() => handleBroadcastSingle(fixture.id)}
                        disabled={postingFixtureId === fixture.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-950/40 px-2.5 py-1 text-xs font-bold text-sky-300 hover:bg-sky-500/20 hover:text-white transition disabled:opacity-50"
                        title="Post this match fixture to Telegram channel"
                      >
                        <Send className="w-3 h-3 text-sky-400" />
                        <span>{postingFixtureId === fixture.id ? 'Posting...' : 'Telegram'}</span>
                      </button>
                    </div>

                    {/* Submit Result CTA if not yet approved */}
                    {fixture.status !== 'approved' && (
                      <button
                        onClick={() => onSubmitResult(fixture)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition ${
                          isMyMatch
                            ? 'bg-gradient-to-r from-[#00ff87] to-[#00e5ff] text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95'
                            : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{fixture.status === 'submitted' ? 'Update Result' : 'Submit Result'}</span>
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
  );
};
