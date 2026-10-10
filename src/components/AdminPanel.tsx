import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Plus, 
  Shuffle, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Gamepad2, 
  FileCheck, 
  ExternalLink, 
  ChevronRight,
  Flame,
  Send
} from 'lucide-react';
import { MatchFixture, Tournament, UserProfile } from '../types/tournament';
import confetti from 'canvas-confetti';
import { handleAvatarError, DEFAULT_PLAYER_AVATAR } from '../utils/imageUtils';
import { broadcastFixturesToTelegram } from '../services/tournamentService';

interface AdminPanelProps {
  currentUser: UserProfile;
  fixtures: MatchFixture[];
  tournaments: Tournament[];
  onApproveResult: (fixtureId: string) => Promise<{ telegramResult?: any }>;
  onRejectResult: (fixtureId: string, reason: string) => void;
  onOpenCreateTournament: () => void;
  onGenerateFixtures: (tournamentId: string) => void;
  onViewScreenshot: (url: string, fixtureTitle: string) => void;
  onSwitchToAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  fixtures,
  tournaments,
  onApproveResult,
  onRejectResult,
  onOpenCreateTournament,
  onGenerateFixtures,
  onViewScreenshot,
  onSwitchToAdmin
}) => {
  const [selectedTourForFixtures, setSelectedTourForFixtures] = useState<string>(
    tournaments[0]?.id || ''
  );
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionModalFixture, setRejectionModalFixture] = useState<MatchFixture | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isBroadcastingFixtures, setIsBroadcastingFixtures] = useState(false);
  const [recentTelegramNotification, setRecentTelegramNotification] = useState<{
    text: string;
    status: 'success' | 'failed' | 'simulated';
  } | null>(null);

  const pendingSubmissions = fixtures.filter(f => f.status === 'submitted');
  const completedCount = fixtures.filter(f => f.status === 'approved').length;

  const handleApprove = async (fixture: MatchFixture) => {
    try {
      setProcessingId(fixture.id);
      const res = await onApproveResult(fixture.id);
      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.6 }
      });
      if (res.telegramResult) {
        setRecentTelegramNotification({
          text: res.telegramResult.message || 'Notification broadcasted to Telegram!',
          status: res.telegramResult.success ? 'success' : 'failed'
        });
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectionModalFixture) return;
    onRejectResult(rejectionModalFixture.id, rejectionReason);
    setRejectionModalFixture(null);
    setRejectionReason('');
  };

  // If user is not admin, show friendly unlock / switch button
  if (currentUser.role !== 'admin') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white">Admin Privileges Required</h2>
        <p className="text-xs text-slate-400">
          You are currently signed in as <strong>{currentUser.name}</strong> (Player).
          To review screenshot submissions, approve match scores, and dispatch Telegram notifications, switch to the Admin profile.
        </p>
        <button
          onClick={onSwitchToAdmin}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-2.5 text-xs font-black uppercase text-slate-950 hover:brightness-110 active:scale-95 transition"
        >
          <UserCheck className="w-4 h-4" />
          <span>Switch to Admin (Mohammad Rifat)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Admin Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-400 border border-amber-500/40">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">
              eFootball Admin Verification Desk
            </h1>
            <p className="text-xs text-slate-400">
              Logged in as <strong className="text-amber-300">{currentUser.name}</strong> • Real-time score authorization
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Telegram Channel Direct Link */}
          <a
            href="https://t.me/eFootballTournamentBD"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/40 px-3.5 py-2 text-xs font-bold text-sky-400 hover:bg-sky-500/20 hover:border-sky-400 hover:text-white transition"
            title="Open Telegram Channel (@eFootballTournamentBD)"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram Channel</span>
          </a>

          <button
            onClick={onOpenCreateTournament}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-4 py-2 text-xs font-black text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tournament</span>
          </button>
        </div>
      </div>

      {/* Telegram Notification Banner if recently dispatched */}
      {recentTelegramNotification && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sky-950/40 border border-sky-500/40 p-4 text-sky-200 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span><strong>Telegram Broadcast:</strong> {recentTelegramNotification.text}</span>
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
              onClick={() => setRecentTelegramNotification(null)}
              className="text-sky-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Admin Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Reviews</span>
          <span className="text-2xl font-black text-amber-400 block mt-0.5">{pendingSubmissions.length}</span>
        </div>
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Verified Matches</span>
          <span className="text-2xl font-black text-[#00ff87] block mt-0.5">{completedCount}</span>
        </div>
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Tournaments</span>
          <span className="text-2xl font-black text-sky-400 block mt-0.5">{tournaments.length}</span>
        </div>
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Fixtures</span>
          <span className="text-2xl font-black text-white block mt-0.5">{fixtures.length}</span>
        </div>
      </div>

      {/* Section 1: Verification Desk (Pending Match Result Screenshots) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-400" />
            <span>Screenshot Verification Queue ({pendingSubmissions.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Approving updates the leaderboard and triggers Telegram bot broadcast
          </span>
        </div>

        {pendingSubmissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-[#00ff87] mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-white">Queue is clear!</p>
            <p className="text-xs text-slate-500 mt-0.5">All submitted eFootball match screenshots have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingSubmissions.map((fixture) => {
              const res = fixture.result!;
              const tour = tournaments.find(t => t.id === fixture.tournamentId);

              return (
                <div 
                  key={fixture.id}
                  className="rounded-2xl border border-amber-500/40 bg-slate-900 p-4 sm:p-5 shadow-xl space-y-4"
                >
                  {/* Fixture Details Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-bold text-amber-300">
                        {tour?.title || 'Tournament'} • {fixture.round}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Submitted by <strong>{res.submittedByName}</strong> at {new Date(res.submittedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300 border border-amber-500/30 animate-pulse">
                      Action Required
                    </span>
                  </div>

                  {/* Claimed Scores vs Players */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    
                    {/* Players & Scores */}
                    <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img 
                            src={fixture.player1.avatarUrl || DEFAULT_PLAYER_AVATAR} 
                            alt={fixture.player1.name} 
                            className="h-8 w-8 rounded-lg object-cover border border-slate-700"
                            onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">{fixture.player1.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {fixture.player1.efootballId}</span>
                          </div>
                        </div>
                        <span className="text-2xl font-black font-mono text-white px-3 py-1 rounded bg-slate-900 border border-slate-700">
                          {res.player1Score}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                        <div className="flex items-center gap-2">
                          <img 
                            src={fixture.player2.avatarUrl || DEFAULT_PLAYER_AVATAR} 
                            alt={fixture.player2.name} 
                            className="h-8 w-8 rounded-lg object-cover border border-slate-700"
                            onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">{fixture.player2.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {fixture.player2.efootballId}</span>
                          </div>
                        </div>
                        <span className="text-2xl font-black font-mono text-white px-3 py-1 rounded bg-slate-900 border border-slate-700">
                          {res.player2Score}
                        </span>
                      </div>

                      {res.notes && (
                        <div className="mt-2 text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                          <strong>Player Note:</strong> "{res.notes}"
                        </div>
                      )}
                    </div>

                    {/* Screenshot Preview */}
                    <div className="flex flex-col items-center justify-center bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      {res.screenshotUrl ? (
                        <>
                          <div className="relative group cursor-pointer w-full max-h-40 overflow-hidden rounded-lg flex items-center justify-center bg-black"
                               onClick={() => onViewScreenshot(res.screenshotUrl, `${fixture.player1.name} vs ${fixture.player2.name}`)}>
                            <img 
                              src={res.screenshotUrl} 
                              alt="Screenshot Proof"
                              className="max-h-36 w-auto object-contain rounded"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-1.5 text-xs text-white font-bold">
                              <Eye className="w-4 h-4 text-[#00ff87]" />
                              <span>Inspect Full Screen</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1.5">
                            Click screenshot to inspect full in-game score &amp; statistics
                          </span>
                        </>
                      ) : (
                        <div className="py-6 px-4 text-center">
                          <p className="text-xs font-semibold text-slate-400">No Screenshot Attached</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            (Player submitted without screenshot - Optional submission)
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Admin Decision Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setRejectionModalFixture(fixture)}
                      disabled={processingId === fixture.id}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Score</span>
                    </button>

                    <button
                      onClick={() => handleApprove(fixture)}
                      disabled={processingId === fixture.id}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-5 py-2 text-xs font-black uppercase text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                    >
                      {processingId === fixture.id ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                          <span>Approving &amp; Broadcasting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve &amp; Update Leaderboard</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Fixture Pairings Generator */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-[#00e5ff]" />
              <span>Generate Tournament Fixtures</span>
            </h3>
            <p className="text-xs text-slate-400">
              Randomly shuffle registered players and generate round pairings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {tournaments.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No tournaments created yet</span>
            ) : (
              <>
                <select
                  value={selectedTourForFixtures}
                  onChange={(e) => setSelectedTourForFixtures(e.target.value)}
                  className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white"
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.registeredPlayerIds.length} players)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedTourForFixtures) {
                      onGenerateFixtures(selectedTourForFixtures);
                      confetti({ particleCount: 50, spread: 60 });
                      setRecentTelegramNotification({
                        text: 'Fixtures generated & broadcasting to Telegram (@eFootballTournamentBD)!',
                        status: 'success'
                      });
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-[#00e5ff]/50 bg-sky-950/40 px-3.5 py-1.5 text-xs font-bold text-[#00e5ff] hover:bg-sky-500/20 transition"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Generate Pairings</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (selectedTourForFixtures) {
                      try {
                        setIsBroadcastingFixtures(true);
                        const res = await broadcastFixturesToTelegram(selectedTourForFixtures);
                        setRecentTelegramNotification({
                          text: res.message || 'Fixtures posted to Telegram channel!',
                          status: res.success ? 'success' : 'failed'
                        });
                      } catch (err: any) {
                        setRecentTelegramNotification({
                          text: err.message || 'Failed to broadcast fixtures',
                          status: 'failed'
                        });
                      } finally {
                        setIsBroadcastingFixtures(false);
                      }
                    }
                  }}
                  disabled={isBroadcastingFixtures}
                  className="flex items-center gap-1.5 rounded-xl border border-sky-500/50 bg-gradient-to-r from-sky-600 to-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:brightness-110 transition disabled:opacity-50"
                  title="Post fixtures to Telegram (@eFootballTournamentBD)"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isBroadcastingFixtures ? 'Posting...' : 'Post to Telegram'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectionModalFixture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/50 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <XCircle className="w-6 h-6" />
              <h3 className="text-base font-bold">Reject Result Submission</h3>
            </div>
            <p className="text-xs text-slate-300">
              Specify the reason why this screenshot or match score cannot be verified. This will be visible to both players.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Screenshot blurry, scores do not match in-game result screen, or wrong match date."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalFixture(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
