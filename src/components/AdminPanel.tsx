import React, { useState, useEffect } from 'react';
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
  Send,
  Trophy,
  Coins,
  Settings,
  Megaphone,
  Users,
  Edit3,
  Trash2,
  Save,
  RefreshCw,
  Phone,
  CreditCard,
  MessageSquare,
  Sparkles,
  Award,
  Radio,
  Sliders,
  Check
} from 'lucide-react';
import { MatchFixture, Tournament, UserProfile, TournamentAnnouncement, AppSettings } from '../types/tournament';
import confetti from 'canvas-confetti';
import { handleAvatarError, DEFAULT_PLAYER_AVATAR } from '../utils/imageUtils';
import { broadcastFixturesToTelegram, isUserAdmin } from '../services/tournamentService';
import { getAppSettings, saveAppSettings, updateAppSettings, resetAppSettings } from '../services/settingsService';
import { 
  subscribeToAnnouncements, 
  createAnnouncement, 
  deleteAnnouncement, 
  toggleAnnouncementActive 
} from '../services/announcementService';
import { EditTournamentModal } from './EditTournamentModal';

interface AdminPanelProps {
  currentUser: UserProfile;
  fixtures: MatchFixture[];
  tournaments: Tournament[];
  allUsers?: UserProfile[];
  onApproveResult: (fixtureId: string) => Promise<{ telegramResult?: any }>;
  onRejectResult: (fixtureId: string, reason: string) => void;
  onOpenCreateTournament: () => void;
  onUpdateTournament?: (tournamentId: string, updates: Partial<Tournament>) => void;
  onDeleteTournament?: (tournamentId: string) => void;
  onGenerateFixtures: (tournamentId: string) => { success: boolean; error?: string; count?: number } | void;
  onConcludeTournament?: (tournamentId: string) => void;
  onViewScreenshot: (url: string, fixtureTitle: string) => void;
  onSwitchToAdmin: () => void;
  onAdminAddPlayer?: (tournamentId: string, name?: string) => { success: boolean; error?: string } | void;
  onOverrideMatchResult?: (fixtureId: string, p1Score: number, p2Score: number, winnerId?: string, notes?: string) => void;
  onAdminUpdateUser?: (userId: string, updates: Partial<UserProfile>) => void;
  onAdminDeleteUser?: (userId: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  fixtures,
  tournaments,
  allUsers = [],
  onApproveResult,
  onRejectResult,
  onOpenCreateTournament,
  onUpdateTournament,
  onDeleteTournament,
  onGenerateFixtures,
  onConcludeTournament,
  onViewScreenshot,
  onSwitchToAdmin,
  onAdminAddPlayer,
  onOverrideMatchResult,
  onAdminUpdateUser,
  onAdminDeleteUser
}) => {
  // Sub-tabs in Admin Panel
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<
    'tournaments' | 'settings' | 'reviews' | 'matches' | 'notices' | 'players'
  >('tournaments');

  // Selected tournament for fixture generation
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

  // Tournament editing modal
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [quickFeeTournamentId, setQuickFeeTournamentId] = useState<string | null>(null);
  const [quickFeeValue, setQuickFeeValue] = useState<number>(0);

  // Global App Settings State
  const [settingsForm, setSettingsForm] = useState<AppSettings>(getAppSettings());
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Announcements State
  const [announcements, setAnnouncements] = useState<TournamentAnnouncement[]>([]);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeMessage, setNewNoticeMessage] = useState('');
  const [newNoticeType, setNewNoticeType] = useState<'urgent' | 'tournament' | 'maintenance' | 'info'>('urgent');
  const [newNoticePriority, setNewNoticePriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newNoticeBroadcastTele, setNewNoticeBroadcastTele] = useState(true);
  const [isPostingNotice, setIsPostingNotice] = useState(false);

  // Match override state
  const [selectedFixtureForOverride, setSelectedFixtureForOverride] = useState<string>(fixtures[0]?.id || '');
  const [overrideScore1, setOverrideScore1] = useState<number>(0);
  const [overrideScore2, setOverrideScore2] = useState<number>(0);
  const [overrideNotes, setOverrideNotes] = useState<string>('Match score confirmed by Admin.');
  const [overrideSaved, setOverrideSaved] = useState(false);

  // User edit state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEfootballId, setEditUserEfootballId] = useState('');
  const [editUserRole, setEditUserRole] = useState<'admin' | 'player'>('player');
  const [editUserPhone, setEditUserPhone] = useState('');

  // Subscribe to live announcements
  useEffect(() => {
    const unsub = subscribeToAnnouncements((list) => {
      setAnnouncements(list);
    });
    return () => unsub();
  }, []);

  const pendingSubmissions = fixtures.filter(f => f.status === 'submitted');
  const completedCount = fixtures.filter(f => f.status === 'approved').length;

  const currentSelectedTour = tournaments.find(t => t.id === selectedTourForFixtures) || tournaments[0];
  const registeredCount = currentSelectedTour?.registeredPlayerIds.length || 0;
  const hasEnoughPlayers = registeredCount >= 2;
  const isCurrentUserRegistered = Boolean(currentSelectedTour?.registeredPlayerIds.includes(currentUser.id));
  const activeFixturesForTour = fixtures.filter(f => f.tournamentId === currentSelectedTour?.id);

  const handleGeneratePairings = () => {
    if (!currentSelectedTour) {
      setRecentTelegramNotification({
        text: '⚠️ Please select a tournament to generate fixtures.',
        status: 'failed'
      });
      return;
    }

    if (registeredCount < 2) {
      setRecentTelegramNotification({
        text: `⚠️ Cannot generate fixtures: "${currentSelectedTour.title}" currently has ${registeredCount} registered player${registeredCount === 1 ? '' : 's'}. At least 2 players are required before generating tournament pairings.`,
        status: 'failed'
      });
      return;
    }

    try {
      const res = onGenerateFixtures(currentSelectedTour.id);
      if (res && res.success === false) {
        setRecentTelegramNotification({
          text: `⚠️ ${res.error || 'Failed to generate pairings'}`,
          status: 'failed'
        });
        return;
      }
      confetti({ particleCount: 50, spread: 60 });
      setRecentTelegramNotification({
        text: `🎉 Match pairings generated successfully for "${currentSelectedTour.title}"!`,
        status: 'success'
      });
    } catch (err: any) {
      setRecentTelegramNotification({
        text: `⚠️ ${err?.message || 'Error generating fixtures'}`,
        status: 'failed'
      });
    }
  };

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

  // Quick Fee update for a tournament
  const handleSaveQuickFee = (tour: Tournament) => {
    if (onUpdateTournament) {
      onUpdateTournament(tour.id, { entryFee: Number(quickFeeValue) || 0 });
      setQuickFeeTournamentId(null);
      confetti({ particleCount: 30, spread: 40 });
    }
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveAppSettings(settingsForm);
    setSettingsSavedMessage(true);
    confetti({ particleCount: 40, spread: 50 });
    setTimeout(() => setSettingsSavedMessage(false), 3000);
  };

  // Reset Settings
  const handleResetSettings = () => {
    if (confirm('Are you sure you want to restore default app settings?')) {
      const def = resetAppSettings();
      setSettingsForm(def);
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 2000);
    }
  };

  // Create Announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeMessage.trim()) return;

    try {
      setIsPostingNotice(true);
      await createAnnouncement({
        title: newNoticeTitle.trim(),
        message: newNoticeMessage.trim(),
        type: newNoticeType,
        priority: newNoticePriority,
        authorName: `${currentUser.name} (Admin)`,
        createdBy: currentUser.id,
        postToTelegram: newNoticeBroadcastTele
      });

      setNewNoticeTitle('');
      setNewNoticeMessage('');
      confetti({ particleCount: 40, spread: 50 });
      setRecentTelegramNotification({
        text: `New live notice "${newNoticeTitle}" published!`,
        status: 'success'
      });
    } catch (err: any) {
      alert('Failed to publish announcement: ' + err.message);
    } finally {
      setIsPostingNotice(false);
    }
  };

  // Manual Score Override
  const handleConfirmOverrideScore = () => {
    if (!selectedFixtureForOverride) return;
    if (onOverrideMatchResult) {
      onOverrideMatchResult(
        selectedFixtureForOverride, 
        overrideScore1, 
        overrideScore2, 
        undefined, 
        overrideNotes
      );
      setOverrideSaved(true);
      confetti({ particleCount: 50, spread: 60 });
      setTimeout(() => setOverrideSaved(false), 3000);
    }
  };

  // Save User Edit
  const handleSaveUserEdit = () => {
    if (!editingUser || !onAdminUpdateUser) return;
    onAdminUpdateUser(editingUser.id, {
      name: editUserName.trim() || editingUser.name,
      efootballId: editUserEfootballId.trim() || editingUser.efootballId,
      role: editUserRole,
      phone: editUserPhone.trim()
    });
    setEditingUser(null);
  };

  // Strictly hide entire admin panel from non-admin users
  if (!isUserAdmin(currentUser)) {
    return null;
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
            <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>Admin Master Control Panel</span>
              <span className="rounded bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider border border-amber-400/40">
                Super Admin
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Logged in as <strong className="text-amber-300">{currentUser.name}</strong> • Full control over entry fees, tournaments, settings, and notices
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Telegram Channel Direct Link */}
          <a
            href={settingsForm.telegramChannelUrl || "https://t.me/eFootballTournamentBD"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/40 px-3 py-2 text-xs font-bold text-sky-400 hover:bg-sky-500/20 hover:border-sky-400 hover:text-white transition"
            title="Open Official Telegram Channel"
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
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>System Notice:</strong> {recentTelegramNotification.text}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRecentTelegramNotification(null)}
              className="text-sky-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Admin Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-none">
        
        <button
          onClick={() => setActiveAdminSubTab('tournaments')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 ${
            activeAdminSubTab === 'tournaments'
              ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Tournaments &amp; Entry Fees</span>
          <span className="rounded-full bg-slate-950/40 px-1.5 py-0.2 text-[10px] font-bold">
            {tournaments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('settings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 ${
            activeAdminSubTab === 'settings'
              ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Master App Settings (খুঁটিনাটি)</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('reviews')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 ${
            activeAdminSubTab === 'reviews'
              ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Verification Queue</span>
          {pendingSubmissions.length > 0 && (
            <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[10px] font-bold animate-pulse">
              {pendingSubmissions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminSubTab('notices')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 ${
            activeAdminSubTab === 'notices'
              ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Live Urgent Notices</span>
          <span className="rounded-full bg-slate-950/40 px-1.5 py-0.2 text-[10px] font-bold">
            {announcements.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('matches')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 ${
            activeAdminSubTab === 'matches'
              ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Manual Scores &amp; Fixtures</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('players')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 ${
            activeAdminSubTab === 'players'
              ? 'bg-[#00ff87] text-slate-950 shadow-md shadow-[#00ff87]/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Players &amp; Users</span>
          <span className="rounded-full bg-slate-950/40 px-1.5 py-0.2 text-[10px] font-bold">
            {allUsers.length}
          </span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: TOURNAMENT & ENTRY FEE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'tournaments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>Tournament Customization &amp; Entry Fees</span>
              </h2>
              <p className="text-xs text-slate-400">
                এডমিন যেকোনো টুর্নামেন্টের এন্ট্রি ফি (৳ BDT), প্রাইজপুল, ফরম্যাট ও সকল নিয়ম পরিবর্তন বা কাস্টমাইজ করতে পারবেন।
              </p>
            </div>
            <button
              onClick={onOpenCreateTournament}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-3.5 py-1.5 text-xs font-black text-slate-950 hover:brightness-110 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Tournament</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tour) => {
              const tourFixtures = fixtures.filter(f => f.tournamentId === tour.id);
              const isFree = !tour.entryFee || tour.entryFee === 0;

              return (
                <div 
                  key={tour.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col justify-between shadow-xl hover:border-slate-700 transition"
                >
                  {/* Banner Header */}
                  <div className="relative h-28 w-full bg-slate-950 overflow-hidden">
                    <img 
                      src={tour.bannerUrl} 
                      alt={tour.title}
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        tour.status === 'upcoming' 
                          ? 'bg-emerald-500 text-slate-950' 
                          : tour.status === 'ongoing' 
                          ? 'bg-sky-500 text-slate-950' 
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {tour.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-slate-300 uppercase">
                        {tour.format}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                      <h3 className="text-sm font-black text-white truncate drop-shadow-md">
                        {tour.title}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    
                    <div className="space-y-2">
                      {/* Entry Fee Box - Prominent */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/40 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Entry Fee (এন্ট্রি ফি)
                          </span>
                          <span className={`text-sm font-black flex items-center gap-1 ${
                            isFree ? 'text-[#00ff87]' : 'text-amber-400'
                          }`}>
                            <Coins className="w-3.5 h-3.5" />
                            {isFree ? 'FREE (৳০)' : `৳${tour.entryFee} BDT`}
                          </span>
                        </div>

                        {quickFeeTournamentId === tour.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              value={quickFeeValue}
                              onChange={(e) => setQuickFeeValue(Math.max(0, Number(e.target.value)))}
                              className="w-16 rounded bg-slate-900 border border-amber-400 px-1.5 py-1 text-xs font-bold text-amber-300"
                              placeholder="৳"
                            />
                            <button
                              onClick={() => handleSaveQuickFee(tour)}
                              className="p-1 rounded bg-[#00ff87] text-slate-950 hover:brightness-110"
                              title="Save Entry Fee"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setQuickFeeTournamentId(null)}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setQuickFeeTournamentId(tour.id);
                              setQuickFeeValue(tour.entryFee || 0);
                            }}
                            className="text-[11px] font-bold text-sky-400 hover:text-sky-300 underline"
                          >
                            Quick Edit Fee
                          </button>
                        )}
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-slate-500 block">Slots</span>
                          <strong className="text-white">
                            {tour.registeredPlayerIds.length}/{tour.maxPlayers}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Prize</span>
                          <strong className="text-amber-300 truncate block">
                            {tour.prizePool}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Match Time</span>
                          <strong className="text-slate-200">{tour.rules.matchLength}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">PK / Extra</span>
                          <strong className="text-slate-200">
                            {tour.rules.penalties ? 'PK ON' : 'PK OFF'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setEditingTournament(tour)}
                          className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-bold text-white transition border border-slate-700"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Customize All</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedTourForFixtures(tour.id);
                            setActiveAdminSubTab('matches');
                          }}
                          className="flex items-center justify-center gap-1 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 py-2 text-xs font-bold text-sky-300 transition border border-sky-800/60"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-sky-400" />
                          <span>Pairings ({tourFixtures.length})</span>
                        </button>
                      </div>

                      {tour.status !== 'completed' && onConcludeTournament && (
                        <button
                          onClick={() => {
                            if (confirm(`Conclude "${tour.title}" and award champion?`)) {
                              onConcludeTournament(tour.id);
                            }
                          }}
                          className="w-full flex items-center justify-center gap-1 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 py-1.5 text-[11px] font-bold text-emerald-300 transition border border-emerald-800/50"
                        >
                          <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Finalize &amp; Conclude Tournament</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: MASTER APP SETTINGS (খুঁটিনাটি ছোট-বড় সকল কিছু) */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'settings' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#00ff87]" />
                <span>Master App Settings &amp; Configuration (খুঁটিনাটি সকল সেটিংস)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                বিকাশ/নগদ পেমেন্ট নম্বর, অ্যাপের টাইটেল, লাইভ ব্রেকিং ব্যানার, টেলিগ্রাম সাপোর্ট ও ম্যাচ রুলস কনফিগার করুন।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetSettings}
                className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {settingsSavedMessage && (
            <div className="rounded-xl bg-emerald-500/20 border border-emerald-500 p-3 text-xs text-emerald-300 flex items-center gap-2 font-bold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>App Settings Successfully Saved! সমস্ত পরিবর্তন সাথে সাথে কার্যকর হয়েছে।</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* 1. App Identity & Title */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#00ff87] flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4" />
                <span>1. App Identity &amp; Title (অ্যাপের নাম ও স্লোগান)</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Application Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.appName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, appName: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-bold text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    App Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={settingsForm.appTagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, appTagline: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment & Cash-In Numbers (bKash, Nagad, Rocket) */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-amber-500/40">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>2. Payment Accounts &amp; Cash-In (বিকাশ, নগদ ও রকেট নম্বর)</span>
                </h3>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Visible in Entry Fee checkout
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    bKash Number &amp; Type
                  </label>
                  <input
                    type="text"
                    value={settingsForm.bkashNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bkashNumber: e.target.value })}
                    placeholder="017XXXXXXXX (Personal)"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-bold text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nagad Number &amp; Type
                  </label>
                  <input
                    type="text"
                    value={settingsForm.nagadNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, nagadNumber: e.target.value })}
                    placeholder="018XXXXXXXX (Personal)"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-bold text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Rocket Number
                  </label>
                  <input
                    type="text"
                    value={settingsForm.rocketNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, rocketNumber: e.target.value })}
                    placeholder="019XXXXXXXX-X"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-bold text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Payment Instructions Note for Players (পেমেন্ট নির্দেশিকা)
                </label>
                <textarea
                  rows={2}
                  value={settingsForm.paymentInstructions}
                  onChange={(e) => setSettingsForm({ ...settingsForm, paymentInstructions: e.target.value })}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                />
              </div>
            </div>

            {/* 3. Urgent Live Ticker & Marquee Banner */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-rose-500/40">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-rose-400" />
                  <span>3. Live Urgent Marquee Ticker (জরুরি লাইভ স্ক্রোলিং ব্যানার)</span>
                </h3>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-rose-300">
                  <input
                    type="checkbox"
                    checked={settingsForm.isUrgentTickerActive}
                    onChange={(e) => setSettingsForm({ ...settingsForm, isUrgentTickerActive: e.target.checked })}
                    className="rounded bg-slate-900 border-rose-500 text-rose-500"
                  />
                  <span className="font-bold">Active in App</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Ticker Announcement Message
                </label>
                <input
                  type="text"
                  value={settingsForm.urgentTickerText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, urgentTickerText: e.target.value })}
                  placeholder="e.g. 🔥 Season 1 Championship Registration Open! Play & Win eFootball Coins!"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-rose-400 focus:outline-none"
                />
              </div>
            </div>

            {/* 4. Support & Community Links */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-sky-500/40">
              <h3 className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-sky-400" />
                <span>4. Telegram &amp; WhatsApp Support Links (যোগাযোগ ও চ্যানেল)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Telegram Official Channel URL
                  </label>
                  <input
                    type="text"
                    value={settingsForm.telegramChannelUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, telegramChannelUrl: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Telegram Discussion Group URL
                  </label>
                  <input
                    type="text"
                    value={settingsForm.telegramGroupUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, telegramGroupUrl: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    WhatsApp Support Number / Link
                  </label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Support Hotline / Phone
                  </label>
                  <input
                    type="text"
                    value={settingsForm.supportPhone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 5. Gameplay & Rules Defaults */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>5. Default Match Rules &amp; Verification Windows</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Match Time</label>
                  <select
                    value={settingsForm.defaultMatchLength}
                    onChange={(e) => setSettingsForm({ ...settingsForm, defaultMatchLength: e.target.value })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs text-white"
                  >
                    <option value="8 Mins">8 Mins</option>
                    <option value="10 Mins">10 Mins</option>
                    <option value="12 Mins">12 Mins</option>
                    <option value="15 Mins">15 Mins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Condition</label>
                  <select
                    value={settingsForm.defaultCondition}
                    onChange={(e) => setSettingsForm({ ...settingsForm, defaultCondition: e.target.value })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs text-white"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Normal">Normal</option>
                    <option value="Random">Random</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Deadline (Minutes)
                  </label>
                  <input
                    type="number"
                    min={15}
                    value={settingsForm.screenshotDeadlineMinutes}
                    onChange={(e) => setSettingsForm({ ...settingsForm, screenshotDeadlineMinutes: Number(e.target.value) })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-1.5 text-xs text-white"
                  />
                </div>

                <div className="flex flex-col justify-end gap-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={settingsForm.defaultPenalties}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultPenalties: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-[#00ff87]"
                    />
                    <span>Default PK ON</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={settingsForm.defaultExtraTime}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultExtraTime: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-[#00ff87]"
                    />
                    <span>Extra Time ON</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-8 py-2.5 text-xs font-black uppercase text-slate-950 shadow-lg shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition"
              >
                <Save className="w-4 h-4" />
                <span>Save All Settings (সংরক্ষণ করুন)</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: VERIFICATION QUEUE (SCREENSHOTS) */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'reviews' && (
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
                              (Optional submission)
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
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: LIVE NOTICES FEED MANAGER */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'notices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-400" />
                <span>Live Notices &amp; Urgent Feed Manager</span>
              </h2>
              <p className="text-xs text-slate-400">
                উপরের নোটিশ আইকন ও ফিডে প্রদর্শিত সকল জরুরি ঘোষণা ও ব্রেকিং আপডেট নিয়ন্ত্রণ করুন।
              </p>
            </div>
          </div>

          {/* New Notice Form */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Create New Live Announcement</span>
            </h3>

            <form onSubmit={handlePostAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Notice Title / শিরোনাম
                </label>
                <input
                  type="text"
                  required
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                  placeholder="e.g. 🚨 Urgent: Match Round 1 Deadline extended by 2 hours"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-bold text-white focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Detailed Announcement Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={newNoticeMessage}
                  onChange={(e) => setNewNoticeMessage(e.target.value)}
                  placeholder="Enter the full announcement text, rules notice, or warning for gamers..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Category / Type</label>
                  <select
                    value={newNoticeType}
                    onChange={(e) => setNewNoticeType(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                  >
                    <option value="urgent">🚨 Urgent Alert</option>
                    <option value="tournament">🏆 Tournament Update</option>
                    <option value="maintenance">⚙️ Maintenance</option>
                    <option value="info">ℹ️ General Info</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Priority</label>
                  <select
                    value={newNoticePriority}
                    onChange={(e) => setNewNoticePriority(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                  >
                    <option value="high">High (Top Pin)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-sky-300 pb-2">
                    <input
                      type="checkbox"
                      checked={newNoticeBroadcastTele}
                      onChange={(e) => setNewNoticeBroadcastTele(e.target.checked)}
                      className="rounded bg-slate-900 border-sky-500 text-sky-500"
                    />
                    <span>Post to Telegram Channel</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isPostingNotice}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-6 py-2 text-xs font-black uppercase text-white shadow-md hover:brightness-110 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPostingNotice ? 'Publishing...' : 'Publish Announcement'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Notice List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Published Notices ({announcements.length})
            </h3>

            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      ann.type === 'urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}>
                      {ann.type}
                    </span>
                    <h4 className="text-xs font-black text-white">{ann.title}</h4>
                  </div>
                  <p className="text-xs text-slate-300">{ann.message}</p>
                  <span className="text-[10px] text-slate-500 block">
                    Author: {ann.authorName} • {new Date(ann.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => toggleAnnouncementActive(ann.id, !ann.active)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      ann.active 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {ann.active ? 'Active' : 'Hidden'}
                  </button>

                  <button
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: MANUAL FIXTURES & SCORE OVERRIDE */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'matches' && (
        <div className="space-y-6">
          
          {/* Pairing Generator */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-sky-400" />
                  <span>Fixture Generator &amp; Match Schedule</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generate official match brackets for any tournament
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTourForFixtures}
                  onChange={(e) => setSelectedTourForFixtures(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.format})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleGeneratePairings}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-sky-400 active:scale-95 transition"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Generate Pairings</span>
                </button>
              </div>
            </div>

            {currentSelectedTour && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    hasEnoughPlayers 
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                  }`}>
                    {registeredCount} / {currentSelectedTour.maxPlayers} Players Registered
                  </span>
                  <span className="text-slate-400">
                    Matches Created: <strong className="text-white">{activeFixturesForTour.length}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onAdminAddPlayer && (
                    <button
                      type="button"
                      onClick={() => onAdminAddPlayer(currentSelectedTour.id)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600/30 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Test Player</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Direct Score Override Desk */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-emerald-400" />
                <span>Admin Direct Match Score Override (রেফারি ডেস্ক)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                খেলোয়াড় স্ক্রিনশট দিতে না পারলে বা ওয়াকওভার (Walkover) হলে এডমিন সরাসরি স্কোর বসিয়ে রেজাল্ট অনুমোদন করতে পারবেন।
              </p>
            </div>

            {overrideSaved && (
              <div className="rounded-xl bg-emerald-500/20 border border-emerald-500 p-3 text-xs text-emerald-300 flex items-center gap-2 font-bold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                <span>Match Score Successfully Set &amp; Approved! Leaderboard updated.</span>
              </div>
            )}

            {fixtures.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No fixtures available to score yet.</p>
            ) : (
              <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Select Match Fixture
                  </label>
                  <select
                    value={selectedFixtureForOverride}
                    onChange={(e) => setSelectedFixtureForOverride(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87]"
                  >
                    {fixtures.map((f) => {
                      const t = tournaments.find(tour => tour.id === f.tournamentId);
                      return (
                        <option key={f.id} value={f.id}>
                          {t?.title || 'Tour'} • {f.round}: {f.player1.name} vs {f.player2.name} ({f.status})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {(() => {
                  const targetFix = fixtures.find(f => f.id === selectedFixtureForOverride);
                  if (!targetFix) return null;

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-xs font-bold text-white block">{targetFix.player1.name}</span>
                          <span className="text-[10px] text-slate-400">Score / Goals:</span>
                          <input
                            type="number"
                            min={0}
                            value={overrideScore1}
                            onChange={(e) => setOverrideScore1(Number(e.target.value))}
                            className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-base font-black text-white"
                          />
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-xs font-bold text-white block">{targetFix.player2.name}</span>
                          <span className="text-[10px] text-slate-400">Score / Goals:</span>
                          <input
                            type="number"
                            min={0}
                            value={overrideScore2}
                            onChange={(e) => setOverrideScore2(Number(e.target.value))}
                            className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-base font-black text-white"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { setOverrideScore1(3); setOverrideScore2(0); setOverrideNotes('Walkover 3-0 awarded to ' + targetFix.player1.name); }}
                          className="px-2.5 py-1 rounded bg-sky-950 border border-sky-800 text-[11px] font-bold text-sky-300 hover:bg-sky-900"
                        >
                          Walkover 3-0 ({targetFix.player1.name})
                        </button>
                        <button
                          type="button"
                          onClick={() => { setOverrideScore1(0); setOverrideScore2(3); setOverrideNotes('Walkover 3-0 awarded to ' + targetFix.player2.name); }}
                          className="px-2.5 py-1 rounded bg-sky-950 border border-sky-800 text-[11px] font-bold text-sky-300 hover:bg-sky-900"
                        >
                          Walkover 3-0 ({targetFix.player2.name})
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Verdict Notes / কারণ</label>
                        <input
                          type="text"
                          value={overrideNotes}
                          onChange={(e) => setOverrideNotes(e.target.value)}
                          className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleConfirmOverrideScore}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-6 py-2 text-xs font-black uppercase text-slate-950 shadow-md hover:brightness-110"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Set &amp; Approve Match Result</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 6: PLAYERS & USERS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'players' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00ff87]" />
                <span>Gamers &amp; User Accounts ({allUsers.length})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage registered eFootball IDs, gamer profiles, roles, and contacts
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">eFootball ID</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Club &amp; Division</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850 transition">
                    <td className="px-4 py-3 flex items-center gap-2.5">
                      <img 
                        src={u.avatarUrl || DEFAULT_PLAYER_AVATAR} 
                        alt={u.name} 
                        className="h-7 w-7 rounded-lg object-cover border border-slate-700"
                        onError={(e) => handleAvatarError(e, DEFAULT_PLAYER_AVATAR)}
                      />
                      <div>
                        <strong className="text-white block">{u.name}</strong>
                        <span className="text-[10px] text-slate-500">{u.email}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-[#00ff87]">
                      {u.efootballId || 'None'}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="block">{u.favoriteClub || 'eFootball Club'}</span>
                      <span className="text-[10px] text-slate-500">{u.division}</span>
                    </td>

                    <td className="px-4 py-3 text-slate-400">
                      {u.phone || '—'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setEditUserName(u.name);
                            setEditUserEfootballId(u.efootballId);
                            setEditUserRole(u.role);
                            setEditUserPhone(u.phone || '');
                          }}
                          className="p-1 rounded hover:bg-slate-800 text-sky-400"
                          title="Edit Gamer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {u.id !== currentUser.id && onAdminDeleteUser && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove user "${u.name}"?`)) {
                                onAdminDeleteUser(u.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-slate-800 text-rose-400"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Edit Tournament Modal */}
      <EditTournamentModal
        isOpen={Boolean(editingTournament)}
        onClose={() => setEditingTournament(null)}
        tournament={editingTournament}
        onUpdateTournament={onUpdateTournament || (() => {})}
        onDeleteTournament={onDeleteTournament}
      />

      {/* Quick Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-3.5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Edit Gamer Profile</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">eFootball In-Game ID</label>
              <input
                type="text"
                value={editUserEfootballId}
                onChange={(e) => setEditUserEfootballId(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-xs font-mono font-bold text-[#00ff87]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Role</label>
              <select
                value={editUserRole}
                onChange={(e) => setEditUserRole(e.target.value as any)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-xs text-white"
              >
                <option value="player">Player</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Phone</label>
              <input
                type="text"
                value={editUserPhone}
                onChange={(e) => setEditUserPhone(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUserEdit}
                className="px-4 py-1.5 rounded-lg bg-[#00ff87] text-slate-950 font-bold text-xs hover:brightness-110"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
