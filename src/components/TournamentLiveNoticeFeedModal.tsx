import React, { useState, useEffect } from 'react';
import {
  Radio,
  Bell,
  Megaphone,
  AlertTriangle,
  Trophy,
  CheckCircle2,
  Trash2,
  X,
  Plus,
  Send,
  ExternalLink,
  Flame,
  Calendar,
  BookOpen,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { TournamentAnnouncement, UserProfile } from '../types/tournament';
import { isUserAdmin } from '../services/mockData';
import {
  subscribeToAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementActive
} from '../services/announcementService';

interface TournamentLiveNoticeFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onNavigateToFixtures?: () => void;
  onNavigateToRules?: () => void;
  onNavigateToDashboard?: () => void;
}

export const TournamentLiveNoticeFeedModal: React.FC<TournamentLiveNoticeFeedModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigateToFixtures,
  onNavigateToRules,
  onNavigateToDashboard
}) => {
  const [announcements, setAnnouncements] = useState<TournamentAnnouncement[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'urgent' | 'tournament' | 'maintenance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Form state for creating announcement (Admin only)
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'urgent' | 'tournament' | 'maintenance' | 'info'>('urgent');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [actionLabel, setActionLabel] = useState('Check Fixtures');
  const [actionUrl, setActionUrl] = useState('#fixtures');
  const [postToTelegram, setPostToTelegram] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Subscribe to real-time announcements
  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements((data) => {
      setAnnouncements(data);
    });
    return () => unsubscribe();
  }, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Mark all as read when opening
  useEffect(() => {
    if (isOpen) {
      try {
        localStorage.setItem('efootball_last_read_notice_time', Date.now().toString());
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      setIsSubmitting(true);
      await createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        authorName: currentUser.name || 'Mohammad Rifat (Organizer)',
        createdBy: currentUser.id,
        actionLabel: actionLabel.trim() || undefined,
        actionUrl: actionUrl.trim() || undefined,
        postToTelegram
      });

      setTitle('');
      setMessage('');
      setIsComposerOpen(false);
      setFeedback('Urgent Notice published and broadcasted successfully!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert('Error publishing notice: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this notice?')) {
      await deleteAnnouncement(id);
    }
  };

  const handleActionClick = (url?: string) => {
    if (!url) return;
    onClose();
    if (url === '#fixtures' && onNavigateToFixtures) {
      onNavigateToFixtures();
    } else if (url === '#rules' && onNavigateToRules) {
      onNavigateToRules();
    } else if (url === '#dashboard' && onNavigateToDashboard) {
      onNavigateToDashboard();
    } else if (url.startsWith('http')) {
      window.open(url, '_blank', 'noreferrer');
    }
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  // Filter announcements
  const filteredNotices = announcements.filter((item) => {
    if (!item.active && !isUserAdmin(currentUser)) return false;
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchMsg = item.message?.toLowerCase().includes(q);
      const matchAuthor = item.authorName?.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchAuthor) return false;
    }
    return true;
  });

  const urgentCount = announcements.filter(a => a.type === 'urgent' && a.active).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-700/80 bg-[#0a101d] text-white shadow-2xl shadow-emerald-500/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="relative border-b border-slate-800 bg-gradient-to-r from-slate-900 via-[#0d1627] to-slate-900 p-4 sm:p-5 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 via-amber-500 to-[#00ff87] p-[1.5px] shadow-lg shadow-rose-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                  <Megaphone className="h-5 w-5 text-rose-400 animate-pulse" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                    Tournament Live Notice &amp; Urgent Feed
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-300">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-rose-400" />
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official announcements, match deadlines, rules notices &amp; broadcasts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Telegram Channel Shortcut */}
              <a
                href="https://t.me/eFootballTournamentBD"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/40 px-2.5 py-1.5 text-xs font-bold text-sky-400 hover:bg-sky-500/20 transition shadow-sm"
                title="Join Telegram Channel"
              >
                <Send className="w-3.5 h-3.5" />
                <span>@Channel</span>
              </a>

              <button
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                title="Close Feed (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Notice Stats strip */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800/70 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Total Notices: <strong className="text-white font-mono">{announcements.length}</strong>
              </span>
              {urgentCount > 0 && (
                <span className="flex items-center gap-1 text-rose-400 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{urgentCount} Urgent Active</span>
                </span>
              )}
            </div>

            {isUserAdmin(currentUser) && (
              <button
                onClick={() => setIsComposerOpen(!isComposerOpen)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-[#00ff87] hover:bg-emerald-500/30 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isComposerOpen ? 'Close Composer' : 'Post Live Notice'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Admin Compose Form Panel */}
        {isUserAdmin(currentUser) && isComposerOpen && (
          <div className="border-b border-emerald-500/30 bg-emerald-950/30 p-4 animate-fadeIn flex-shrink-0 max-h-[50vh] overflow-y-auto">
            <form onSubmit={handleCreateNotice} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#00ff87] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Admin Broadcast Notice Composer</span>
                </span>
                <span className="text-[10px] text-slate-400">Posts to all players &amp; Telegram</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 🚨 Round 1 Match Deadline: Submit by 11:00 PM!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00ff87] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Detailed Message *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide complete instructions, room match time limit, screenshot submission rules..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00ff87] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                  >
                    <option value="urgent">🚨 Urgent Breaking</option>
                    <option value="tournament">🏆 Tournament Update</option>
                    <option value="maintenance">⚙️ Maintenance</option>
                    <option value="info">ℹ️ General Info</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                  >
                    <option value="high">High (Top Pin)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Action Button</label>
                  <input
                    type="text"
                    placeholder="Check Fixtures"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Action Target</label>
                  <select
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
                  >
                    <option value="#fixtures">Fixtures Page</option>
                    <option value="#rules">Tournament Rules</option>
                    <option value="#dashboard">Dashboard Home</option>
                    <option value="https://t.me/eFootballTournamentBD">Telegram Channel</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-sky-400">
                  <input
                    type="checkbox"
                    checked={postToTelegram}
                    onChange={(e) => setPostToTelegram(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                  />
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast to Telegram Channel (@eFootballTournamentBD)</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-4 py-2 text-xs font-black text-slate-950 hover:brightness-110 transition shadow-md disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Broadcasting...' : 'Publish Live Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/50 p-2.5 px-4 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00ff87] flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="p-3 border-b border-slate-800 bg-[#0a101d] flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                filterType === 'all'
                  ? 'bg-emerald-500/20 text-[#00ff87] border border-emerald-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>All Notices</span>
            </button>
            <button
              onClick={() => setFilterType('urgent')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                filterType === 'urgent'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Urgent Breaking</span>
            </button>
            <button
              onClick={() => setFilterType('tournament')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                filterType === 'tournament'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Trophy className="w-3 h-3 text-sky-400" />
              <span>Tournaments</span>
            </button>
            <button
              onClick={() => setFilterType('maintenance')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                filterType === 'maintenance'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Info className="w-3 h-3 text-amber-400" />
              <span>Rules &amp; System</span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:flex-1 sm:ml-auto">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notices, rules or updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:border-[#00ff87] focus:outline-none"
            />
          </div>
        </div>

        {/* Notices Feed List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 divide-y divide-slate-800/40">
          {filteredNotices.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-3">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-300">No notices in this category</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All tournament notifications are live and updated regularly. Stay tuned or join our Telegram channel for instant alerts.
              </p>
            </div>
          ) : (
            filteredNotices.map((notice) => {
              const isUrgent = notice.type === 'urgent';
              const isTour = notice.type === 'tournament';
              const isMaint = notice.type === 'maintenance';

              return (
                <div
                  key={notice.id}
                  className={`pt-3 first:pt-0 rounded-xl p-3.5 sm:p-4 border transition-all ${
                    isUrgent
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-sm shadow-rose-950/30'
                      : isTour
                      ? 'bg-[#00ff87]/5 border-emerald-500/30 shadow-sm'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  {/* Top card metadata */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/25 border border-rose-500/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-300">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>URGENT NOTICE</span>
                        </span>
                      )}
                      {isTour && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/25 border border-emerald-500/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#00ff87]">
                          <Trophy className="w-3 h-3 text-emerald-400" />
                          <span>TOURNAMENT NEWS</span>
                        </span>
                      )}
                      {isMaint && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/25 border border-amber-500/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                          <Info className="w-3 h-3 text-amber-400" />
                          <span>IMPORTANT RULE</span>
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatTimestamp(notice.createdAt)}</span>
                      </span>
                    </div>

                    {isUserAdmin(currentUser) && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleDeleteNotice(notice.id, e)}
                          className="rounded-lg p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notice Title */}
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 flex items-center gap-2">
                    {notice.title}
                  </h3>

                  {/* Notice Message */}
                  <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed whitespace-pre-line mb-3">
                    {notice.message}
                  </p>

                  {/* Footer with Author & Action button */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00ff87]" />
                      <span>{notice.authorName || 'Mohammad Rifat'}</span>
                      <span className="text-[10px] text-slate-500">(Verified Organizer)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {notice.actionLabel && notice.actionUrl && (
                        <button
                          onClick={() => handleActionClick(notice.actionUrl)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-[#00ff87] hover:bg-emerald-500/30 hover:border-emerald-400 transition shadow-sm"
                        >
                          <span>{notice.actionLabel}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}

                      <a
                        href="https://t.me/eFootballTournamentBD"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-sky-950/60 border border-sky-500/30 px-2 py-1 text-[11px] font-semibold text-sky-400 hover:bg-sky-900/60 transition"
                        title="Telegram Discussion"
                      >
                        <Send className="w-3 h-3" />
                        <span>Telegram</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-slate-950/80 px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Real-time live updates synchronized for all tournament players</span>
            <span className="sm:hidden">Live sync active</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
};
