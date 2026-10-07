import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Camera, 
  AlertTriangle, 
  Trophy, 
  Clock, 
  Gamepad2, 
  Upload, 
  Send, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';

interface RulesViewProps {
  onNavigateToSubmit: () => void;
  onNavigateToFixtures: () => void;
}

export const RulesView: React.FC<RulesViewProps> = ({
  onNavigateToSubmit,
  onNavigateToFixtures
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'setup' | 'fairplay' | 'screenshot' | 'points'>('all');

  return (
    <div className="space-y-6">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1224] to-slate-900 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-[#00ff87]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-[#00e5ff]/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-xl bg-[#00ff87]/10 border border-[#00ff87]/30 px-3 py-1 text-xs font-bold text-[#00ff87]">
              <BookOpen className="w-4 h-4" />
              <span>Official Tournament Regulations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Rules &amp; Participant Guidelines
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              To ensure a competitive, fun, and fair playing arena for all eFootball players, 
              please read and adhere to our match settings, fair play standards, and screenshot verification rules.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onNavigateToSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Submit Result</span>
            </button>
            <a
              href="https://t.me/eFootballTournamentBD"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-950/40 px-5 py-3 text-xs font-bold text-sky-400 hover:bg-sky-500/20 hover:text-white transition shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Telegram Channel</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Guidelines
          </button>
          <button
            onClick={() => setActiveCategory('setup')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeCategory === 'setup'
                ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Match Setup &amp; Lobby
          </button>
          <button
            onClick={() => setActiveCategory('fairplay')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeCategory === 'fairplay'
                ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Fair Play &amp; Conduct
          </button>
          <button
            onClick={() => setActiveCategory('screenshot')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeCategory === 'screenshot'
                ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Screenshot Proof (Crucial)
          </button>
          <button
            onClick={() => setActiveCategory('points')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeCategory === 'points'
                ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Points &amp; Leaderboard
          </button>
        </div>
      </div>

      {/* Grid of Rule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Section 1: Match Setup */}
        {(activeCategory === 'all' || activeCategory === 'setup') && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-4 hover:border-slate-700 transition shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">1. Match Setup &amp; Lobby</h3>
                <p className="text-xs text-slate-400">Standard settings for all tournament matches</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-[#00ff87] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Friend Match Lobby:</strong>
                  Find your scheduled opponent in the <strong>Fixtures</strong> tab. Copy their <strong>eFootball In-Game ID</strong>, send an in-game friend request, and create a Friend Match room.
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-[#00ff87] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Match Length &amp; Settings:</strong>
                  Standard match duration is <strong>10 Minutes</strong>. Extra Time is <strong>OFF</strong> for league stages, and <strong>ON</strong> for knockout rounds with Penalties. Player Condition must be set to <strong>Excellent</strong> unless tournament rules specify Random.
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-[#00ff87] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Substitutions:</strong>
                  Maximum <strong>5 substitutions</strong> allowed per match across 3 substitution stops (plus half-time).
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block font-semibold">Disconnection Policy:</strong>
                  If a player disconnects in the first 10 minutes due to genuine server error, restart with mutual agreement. Deliberate rage-quits result in an automatic <strong>3-0 forfeit loss</strong>.
                </div>
              </li>
            </ul>
          </div>
        )}

        {/* Section 2: Screenshot Requirements (Crucial) */}
        {(activeCategory === 'all' || activeCategory === 'screenshot') && (
          <div className="rounded-3xl border border-amber-500/40 bg-slate-900/90 p-5 sm:p-6 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-white">2. Screenshot Proof Requirements</h3>
                    <span className="rounded bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 uppercase font-bold border border-amber-500/30">
                      Mandatory
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Strict rules for result approval</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-950/30 border border-amber-500/30 p-3.5 text-xs text-amber-200">
              <strong>Why screenshots matter:</strong> Every result submitted without a clear, valid screenshot will be rejected by tournament admins to prevent score tampering.
            </div>

            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Full Final Whistle Screen:</strong>
                  Take a complete, uncropped screenshot immediately after the match ends showing the full scoreline, both team names, and match statistics.
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Player In-Game ID / Name Visibility:</strong>
                  Ensure the opponent's name matches their registered tournament identity.
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-300 block font-semibold">Zero Tolerance for Fake Proofs:</strong>
                  Cropped images, low-resolution blurred shots, downloaded images, or edited scores result in immediate tournament expulsion.
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <Clock className="w-4 h-4 text-[#00e5ff] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Submission Deadline:</strong>
                  Screenshots must be uploaded via the <strong>Submit Result</strong> tab within <strong>30 minutes</strong> after match completion.
                </div>
              </li>
            </ul>
          </div>
        )}

        {/* Section 3: Fair Play & Integrity */}
        {(activeCategory === 'all' || activeCategory === 'fairplay') && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-4 hover:border-slate-700 transition shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-[#00ff87] border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">3. Fair Play &amp; Sportsmanship</h3>
                <p className="text-xs text-slate-400">Ensuring genuine competitive eFootball matches</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Network Tampering &amp; Lag Glitches:</strong>
                  Intentionally creating lag or switching network states to manipulate matchmaking or gameplay is strictly prohibited. Offending players face a lifetime ban.
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">No Emulators or Illegal Mods:</strong>
                  All players must play on legitimate mobile devices (Android or iOS). Using keyboard/mouse emulators or modified game APKs is disallowed.
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-[#00ff87] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Respectful Communication:</strong>
                  Maintain respect toward opponents and tournament admins. Abusive conduct in community groups or Telegram channels will not be tolerated.
                </div>
              </li>
            </ul>
          </div>
        )}

        {/* Section 4: Points & Leaderboard */}
        {(activeCategory === 'all' || activeCategory === 'points') && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-4 hover:border-slate-700 transition shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">4. Scoring &amp; Standings System</h3>
                <p className="text-xs text-slate-400">Official tournament ranking calculations</p>
              </div>
            </div>

            {/* Points Formula Strip */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-emerald-950/30 border border-emerald-500/30 p-3">
                <span className="text-xs text-emerald-300 font-bold block">Match Win</span>
                <span className="text-xl font-black text-[#00ff87] block mt-1">+3 Points</span>
              </div>
              <div className="rounded-2xl bg-sky-950/30 border border-sky-500/30 p-3">
                <span className="text-xs text-sky-300 font-bold block">Draw</span>
                <span className="text-xl font-black text-sky-400 block mt-1">+1 Point</span>
              </div>
              <div className="rounded-2xl bg-rose-950/30 border border-rose-500/30 p-3">
                <span className="text-xs text-rose-300 font-bold block">Defeat</span>
                <span className="text-xl font-black text-rose-400 block mt-1">0 Points</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs text-slate-300">
              <strong className="text-white block font-semibold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Tiebreaker Order:</span>
              </strong>
              <p className="text-slate-400 leading-relaxed">
                If two or more players share equal points on the leaderboard, standings are determined in this strict sequence:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-300 font-medium text-[11px]">
                <li><strong>Total Points</strong> earned from approved fixtures.</li>
                <li><strong>Goal Difference (GD)</strong> (Goals For minus Goals Against).</li>
                <li><strong>Goals For (GF)</strong> (Total goals scored in the tournament).</li>
                <li><strong>Head-to-Head result</strong> between the tied opponents.</li>
                <li><strong>Total Wins</strong> count.</li>
              </ol>
            </div>
          </div>
        )}

      </div>

      {/* Admin Authorization Notice */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-sky-950/20 to-slate-900 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-black text-white">Admin Verification Authority</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All submitted results and screenshot proofs undergo verification by Admin <strong>Mohammad Rifat</strong>. 
            Once approved, leaderboard standings and official <strong>Telegram Channel</strong> broadcasts are finalized automatically. 
            In the event of a dispute, submit your complaint to the admin with video or screenshot evidence within 1 hour.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onNavigateToFixtures}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition"
          >
            Check Fixtures
          </button>
          <a
            href="https://t.me/eFootballTournamentBD"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-sky-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:brightness-110 transition shadow-md shadow-sky-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Join Telegram</span>
          </a>
        </div>
      </div>

    </div>
  );
};
