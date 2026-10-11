import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Trophy, 
  Zap, 
  Info, 
  X, 
  Plus, 
  Send, 
  Radio, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  Trash2, 
  ExternalLink,
  Sparkles,
  Flame
} from 'lucide-react';
import { TournamentAnnouncement, UserProfile } from '../types/tournament';
import { isUserAdmin } from '../services/mockData';
import { 
  subscribeToAnnouncements, 
  createAnnouncement, 
  deleteAnnouncement, 
  toggleAnnouncementActive 
} from '../services/announcementService';

interface TournamentAnnouncementsProps {
  currentUser: UserProfile;
  onNavigateToFixtures?: () => void;
  onNavigateToRules?: () => void;
  onOpenCreateTournament?: () => void;
}

export const TournamentAnnouncements: React.FC<TournamentAnnouncementsProps> = ({
  currentUser,
  onNavigateToFixtures,
  onNavigateToRules,
  onOpenCreateTournament
}) => {
  const [announcements, setAnnouncements] = useState<TournamentAnnouncement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('efootball_dismissed_announcements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Form state for creating announcement (Admin only)
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'urgent' | 'tournament' | 'maintenance' | 'info'>('urgent');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [actionLabel, setActionLabel] = useState('Check Fixtures');
  const [actionUrl, setActionUrl] = useState('#fixtures');
  const [postToTelegram, setPostToTelegram] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // Real-time Firestore subscription
  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements((data) => {
      setAnnouncements(data);
    });
    return () => unsubscribe();
  }, []);

  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('efootball_dismissed_announcements', JSON.stringify(updated));
    } catch {}
  };

  const handleRestoreAll = () => {
    setDismissedIds([]);
    try {
      sessionStorage.removeItem('efootball_dismissed_announcements');
    } catch {}
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this announcement?')) {
      await deleteAnnouncement(id);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      setIsSubmitting(true);
      await createAnnouncement({
        title,
        message,
        type,
        priority,
        authorName: currentUser.name || 'Mohammad Rifat',
        createdBy: currentUser.id,
        actionLabel: actionLabel.trim() || undefined,
        actionUrl: actionUrl.trim() || undefined,
        postToTelegram
      });

      setTitle('');
      setMessage('');
      setIsModalOpen(false);
      setSubmitFeedback('Announcement published successfully!');
      setTimeout(() => setSubmitFeedback(null), 4000);
    } catch (err: any) {
      alert('Error creating announcement: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionClick = (url?: string) => {
    if (!url) return;
    if (url === '#fixtures' && onNavigateToFixtures) {
      onNavigateToFixtures();
    } else if (url === '#rules' && onNavigateToRules) {
      onNavigateToRules();
    } else if (url === '#create' && onOpenCreateTournament) {
      onOpenCreateTournament();
    } else if (url.startsWith('http')) {
      window.open(url, '_blank', 'noreferrer');
    }
  };

  // Filter active and non-dismissed announcements
  const activeAnnouncements = announcements.filter(a => a.active);
  const visibleAnnouncements = activeAnnouncements.filter(a => !dismissedIds.includes(a.id));

  if (activeAnnouncements.length === 0 && !isUserAdmin(currentUser)) {
    return null;
  }

  return (
    <div className="w-full space-y-2.5">
      
      {/* Top Header Strip with Live Notice Indicator */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tournament Live Notice &amp; Urgent Feed</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {dismissedIds.length > 0 && (
            <button
              onClick={handleRestoreAll}
              className="text-[10px] text-slate-400 hover:text-white underline transition"
            >
              Restore Hidden ({dismissedIds.length})
            </button>
          )}

          {isUserAdmin(currentUser) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-[#00ff87] hover:bg-emerald-500/30 transition shadow-sm"
              title="Post new announcement"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Announcement</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Success feedback alert */}
      {submitFeedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/60 border border-emerald-500/50 p-3 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{submitFeedback}</span>
        </div>
      )}

      {/* Announcements List Container */}
      {isExpanded && (
        <div className="space-y-2">
          {visibleAnnouncements.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 text-center">
              <p className="text-xs text-slate-400">
                All announcements caught up! No urgent updates at the moment.
              </p>
            </div>
          ) : (
            visibleAnnouncements.map((ann) => {
              const isUrgent = ann.type === 'urgent';
              const isTour = ann.type === 'tournament';
              const isMaint = ann.type === 'maintenance';

              // Visual theme styling
              const borderClass = isUrgent
                ? 'border-rose-500/50 shadow-rose-950/20 bg-gradient-to-r from-rose-950/40 via-slate-900/90 to-slate-900/90'
                : isTour
                ? 'border-emerald-500/50 shadow-emerald-950/20 bg-gradient-to-r from-emerald-950/30 via-slate-900/90 to-slate-900/90'
                : isMaint
                ? 'border-sky-500/50 shadow-sky-950/20 bg-gradient-to-r from-sky-950/30 via-slate-900/90 to-slate-900/90'
                : 'border-slate-800 bg-slate-900/80';

              const iconBadge = isUrgent ? (
                <div className="rounded-xl bg-rose-500/20 p-2 text-rose-400 border border-rose-500/30 flex-shrink-0 animate-pulse">
                  <Flame className="w-4 h-4 text-rose-400" />
                </div>
              ) : isTour ? (
                <div className="rounded-xl bg-emerald-500/20 p-2 text-[#00ff87] border border-emerald-500/30 flex-shrink-0">
                  <Trophy className="w-4 h-4 text-[#00ff87]" />
                </div>
              ) : isMaint ? (
                <div className="rounded-xl bg-sky-500/20 p-2 text-sky-400 border border-sky-500/30 flex-shrink-0">
                  <Zap className="w-4 h-4 text-sky-400" />
                </div>
              ) : (
                <div className="rounded-xl bg-slate-800 p-2 text-slate-300 border border-slate-700 flex-shrink-0">
                  <Info className="w-4 h-4" />
                </div>
              );

              return (
                <div
                  key={ann.id}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border p-3.5 sm:p-4 shadow-lg transition-all ${borderClass}`}
                >
                  {/* Left: Icon & Message Details */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {iconBadge}

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          isUrgent
                            ? 'bg-rose-500 text-slate-950'
                            : isTour
                            ? 'bg-[#00ff87] text-slate-950'
                            : isMaint
                            ? 'bg-sky-400 text-slate-950'
                            : 'bg-slate-700 text-slate-200'
                        }`}>
                          {ann.type}
                        </span>

                        <h4 className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
                          {ann.title}
                        </h4>

                        <span className="text-[10px] text-slate-400 font-mono">
                          • {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed break-words">
                        {ann.message}
                      </p>

                      {ann.authorName && (
                        <span className="text-[10px] text-slate-400 block italic">
                          From: {ann.authorName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {ann.actionLabel && (
                      <button
                        onClick={() => handleActionClick(ann.actionUrl)}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-[#00ff87] px-3 py-1.5 text-xs font-bold text-white transition active:scale-95"
                      >
                        <span>{ann.actionLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#00ff87]" />
                      </button>
                    )}

                    {isUserAdmin(currentUser) && (
                      <button
                        onClick={(e) => handleDelete(ann.id, e)}
                        className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete announcement (Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={(e) => handleDismiss(ann.id, e)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Dismiss notice"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Admin Create Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-emerald-500/20 p-2 text-[#00ff87] border border-emerald-500/30">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Publish Real-Time Announcement
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Broadcast urgent updates live to all players
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Announcement Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['urgent', 'tournament', 'maintenance', 'info'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`rounded-xl py-2 px-2 text-xs font-bold uppercase transition border ${
                        type === t
                          ? t === 'urgent'
                            ? 'bg-rose-500 text-slate-950 border-rose-400'
                            : t === 'tournament'
                            ? 'bg-[#00ff87] text-slate-950 border-[#00ff87]'
                            : t === 'maintenance'
                            ? 'bg-sky-400 text-slate-950 border-sky-400'
                            : 'bg-indigo-500 text-white border-indigo-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Title / শিরোনাম <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 🚨 Match Schedule Deadline Extension"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-[#00ff87] focus:outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Message Details / বিস্তারিত নোটিশ <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write urgent details, rules clarification, or schedule updates..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs sm:text-sm text-white focus:border-[#00ff87] focus:outline-none resize-none"
                />
              </div>

              {/* Action Button CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Action Button Label
                  </label>
                  <input
                    type="text"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    placeholder="e.g. Check Fixtures"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Action Destination
                  </label>
                  <select
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-semibold text-white focus:border-[#00ff87] focus:outline-none"
                  >
                    <option value="#fixtures">Fixtures Page (#fixtures)</option>
                    <option value="#rules">Tournament Rules (#rules)</option>
                    <option value="#create">Create Tournament (#create)</option>
                    <option value="https://t.me/eFootballTournamentBD">Telegram Channel</option>
                  </select>
                </div>
              </div>

              {/* Also post to Telegram toggle */}
              <div className="rounded-xl bg-sky-950/30 border border-sky-500/30 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Broadcast to Telegram
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Instantly sends this announcement to @eFootballTournamentBD
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={postToTelegram}
                  onChange={(e) => setPostToTelegram(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#00ff87]"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
