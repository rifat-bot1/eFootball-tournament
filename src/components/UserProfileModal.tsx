import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Copy, 
  Check, 
  Save, 
  LogOut, 
  LogIn, 
  Sparkles, 
  Phone, 
  Mail, 
  Gamepad2, 
  Trophy, 
  Flame, 
  Image as ImageIcon, 
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Clock,
  ShieldAlert,
  Info,
  Calendar,
  Edit3,
  ArrowLeft,
  Zap,
  Swords,
  Award,
  Activity,
  Shield
} from 'lucide-react';
import { UserProfile, MatchFixture } from '../types/tournament';
import { handleAvatarError, AVATAR_PRESETS, DEFAULT_PLAYER_AVATAR, DEFAULT_ADMIN_AVATAR } from '../utils/imageUtils';
import { isUserAdmin } from '../services/mockData';
import { auth } from '../services/firebase';
import { updatePassword } from 'firebase/auth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  fixtures: MatchFixture[];
  onUpdateProfile: (updatedData: Partial<UserProfile>) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

const POPULAR_CLUBS = [
  'FC Barcelona',
  'Real Madrid',
  'Manchester City',
  'Arsenal',
  'Bayern Munich',
  'Liverpool',
  'Paris Saint-Germain',
  'Inter Milan',
  'AC Milan',
  'Chelsea',
  'Manchester United',
  'Juventus',
  'Argentina',
  'Brazil',
  'eFootball FC',
  'Custom Club...'
];

const DIVISIONS = [
  'Division 1',
  'Division 2',
  'Division 3',
  'Division 4',
  'Division 5',
  'Division 6',
  'Division 7',
  'Division 8+'
];

const PLAYSTYLES = [
  'Quick Counter',
  'Possession Game',
  'Long Ball Counter',
  'Out Wide',
  'Long Ball'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  fixtures,
  onUpdateProfile,
  onOpenAuth,
  onLogout
}) => {
  // Modal active tab: 'overview' (DEFAULT profile template view) | 'edit' (edit form) | 'stats' (records) | 'avatar' (presets)
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'avatar' | 'stats'>('overview');

  // Form states
  const [name, setName] = useState(currentUser.name || '');
  const [efootballId, setEfootballId] = useState(currentUser.efootballId || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [favoriteClub, setFavoriteClub] = useState(currentUser.favoriteClub || 'eFootball FC');
  const [customClub, setCustomClub] = useState('');
  const [isCustomClubSelected, setIsCustomClubSelected] = useState(false);
  const [division, setDivision] = useState(currentUser.division || 'Division 3');
  const [playstyle, setPlaystyle] = useState(currentUser.playstyle || 'Quick Counter');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || DEFAULT_PLAYER_AVATAR);
  const [bio, setBio] = useState(currentUser.bio || '');

  const [copiedId, setCopiedId] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 10-day cooldown calculation for eFootball In-Game ID
  const COOLDOWN_DAYS = 10;
  const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

  const cooldownInfo = React.useMemo(() => {
    if (!currentUser.lastEfootballIdChangedAt) {
      return { isCooldownActive: false, remainingDays: 0, remainingHours: 0, remainingMinutes: 0, remainingText: '' };
    }
    const lastChange = new Date(currentUser.lastEfootballIdChangedAt).getTime();
    const elapsed = Date.now() - lastChange;
    if (elapsed >= COOLDOWN_MS) {
      return { isCooldownActive: false, remainingDays: 0, remainingHours: 0, remainingMinutes: 0, remainingText: '' };
    }
    const remainingMs = COOLDOWN_MS - elapsed;
    const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

    let remainingText = '';
    if (remainingDays > 0) {
      remainingText = `${remainingDays}d ${remainingHours}h`;
    } else if (remainingHours > 0) {
      remainingText = `${remainingHours}h ${remainingMinutes}m`;
    } else {
      remainingText = `${Math.max(1, remainingMinutes)}m`;
    }

    return {
      isCooldownActive: true,
      remainingDays,
      remainingHours,
      remainingMinutes,
      remainingText
    };
  }, [currentUser.lastEfootballIdChangedAt]);

  // Reset form when modal opens or user changes, and default to 'overview'
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview'); // Default to full Profile Template View
      setName(currentUser.name || '');
      setEfootballId(currentUser.efootballId || '');
      setPassword('');
      setShowPassword(false);
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || '');
      
      const currentClub = currentUser.favoriteClub || 'FC Barcelona';
      if (POPULAR_CLUBS.includes(currentClub)) {
        setFavoriteClub(currentClub);
        setIsCustomClubSelected(false);
        setCustomClub('');
      } else {
        setFavoriteClub('Custom Club...');
        setIsCustomClubSelected(true);
        setCustomClub(currentClub);
      }

      setDivision(currentUser.division || 'Division 3');
      setPlaystyle(currentUser.playstyle || 'Quick Counter');
      setAvatarUrl(currentUser.avatarUrl || (isUserAdmin(currentUser) ? DEFAULT_ADMIN_AVATAR : DEFAULT_PLAYER_AVATAR));
      setBio(currentUser.bio || '');
      setStatusMessage(null);
    }
  }, [isOpen, currentUser]);

  // Compute live match statistics for this player
  const playerStats = React.useMemo(() => {
    const userId = currentUser.id?.toLowerCase();
    const eId = currentUser.efootballId?.trim().toLowerCase();

    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    const recentForm: ('W' | 'D' | 'L')[] = [];

    // Sort approved fixtures chronologically
    const userFixtures = fixtures.filter(f => {
      if (f.status !== 'approved' || !f.result) return false;
      const isP1 = f.player1.id?.toLowerCase() === userId || (eId && f.player1.efootballId?.toLowerCase() === eId);
      const isP2 = f.player2.id?.toLowerCase() === userId || (eId && f.player2.efootballId?.toLowerCase() === eId);
      return isP1 || isP2;
    });

    userFixtures.forEach(f => {
      const isP1 = f.player1.id?.toLowerCase() === userId || (eId && f.player1.efootballId?.toLowerCase() === eId);
      played++;
      const pScore = isP1 ? f.result!.player1Score : f.result!.player2Score;
      const oScore = isP1 ? f.result!.player2Score : f.result!.player1Score;

      goalsFor += pScore;
      goalsAgainst += oScore;

      if (pScore > oScore) {
        won++;
        recentForm.push('W');
      } else if (pScore < oScore) {
        lost++;
        recentForm.push('L');
      } else {
        drawn++;
        recentForm.push('D');
      }
    });

    const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
    const goalDiff = goalsFor - goalsAgainst;
    const last5Form = recentForm.slice(-5);

    return { played, won, drawn, lost, goalsFor, goalsAgainst, winRate, goalDiff, last5Form };
  }, [fixtures, currentUser]);

  // Upcoming fixtures for this player
  const upcomingFixtures = React.useMemo(() => {
    const userId = currentUser.id?.toLowerCase();
    const eId = currentUser.efootballId?.trim().toLowerCase();

    return fixtures.filter(f => {
      if (f.status === 'approved') return false;
      const isP1 = f.player1.id?.toLowerCase() === userId || (eId && f.player1.efootballId?.toLowerCase() === eId);
      const isP2 = f.player2.id?.toLowerCase() === userId || (eId && f.player2.efootballId?.toLowerCase() === eId);
      return isP1 || isP2;
    }).slice(0, 3);
  }, [fixtures, currentUser]);

  // Live duplicate eFootball ID check
  const duplicateIdPlayer = React.useMemo(() => {
    const trimmed = efootballId.trim().toLowerCase();
    if (!trimmed || trimmed === (currentUser.efootballId || '').trim().toLowerCase()) {
      return null;
    }
    return allUsers.find(
      u => u.id !== currentUser.id && u.efootballId && u.efootballId.trim().toLowerCase() === trimmed
    ) || null;
  }, [efootballId, currentUser, allUsers]);

  // Live duplicate email check
  const duplicateEmailPlayer = React.useMemo(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || trimmed === (currentUser.email || '').trim().toLowerCase()) {
      return null;
    }
    return allUsers.find(
      u => u.id !== currentUser.id && u.email && u.email.trim().toLowerCase() === trimmed
    ) || null;
  }, [email, currentUser, allUsers]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    const idToCopy = currentUser.efootballId || efootballId;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleClubChange = (value: string) => {
    if (value === 'Custom Club...') {
      setIsCustomClubSelected(true);
      setFavoriteClub('Custom Club...');
    } else {
      setIsCustomClubSelected(false);
      setFavoriteClub(value);
    }
  };

  const isIdModified = Boolean(
    currentUser.efootballId &&
    efootballId.trim().toLowerCase() !== currentUser.efootballId.trim().toLowerCase()
  );

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatusMessage(null);

    const trimmedName = name.trim();
    const trimmedId = efootballId.trim();
    const trimmedEmail = email.trim();
    const finalClub = (isCustomClubSelected ? customClub.trim() : favoriteClub) || 'eFootball FC';

    if (!trimmedName) {
      setStatusMessage({ type: 'error', text: 'Please enter your Player Name / Gamer Tag.' });
      return;
    }

    if (!trimmedId) {
      setStatusMessage({ type: 'error', text: 'Please enter your eFootball In-Game ID (e.g. 982-412-104).' });
      return;
    }

    // 1. Uniqueness check for eFootball ID
    if (isIdModified) {
      if (duplicateIdPlayer) {
        setStatusMessage({ 
          type: 'error', 
          text: `❌ This eFootball In-Game ID is already taken by player "${duplicateIdPlayer.name}". Every player must have a unique ID! (এই eFootball In-Game ID টি অন্য একজন খেলোয়াড় ইতিমধ্যে ব্যবহার করছেন। সবার আইডি আলাদা হতে হবে।)` 
        });
        return;
      }

      // 2. Cooldown check for eFootball ID (10 days)
      if (cooldownInfo.isCooldownActive) {
        setStatusMessage({
          type: 'error',
          text: `⏳ eFootball In-Game ID can only be changed once every 10 days! Please wait ${cooldownInfo.remainingText} more before changing your ID. (eFootball In-Game ID ১০ দিন পরপর পরিবর্তন করা যাবে। আর ${cooldownInfo.remainingText} বাকি।)`
        });
        return;
      }
    }

    // 3. Uniqueness check for Email/Gmail
    if (trimmedEmail && trimmedEmail.toLowerCase() !== (currentUser.email || '').toLowerCase()) {
      if (duplicateEmailPlayer) {
        setStatusMessage({
          type: 'error',
          text: `❌ The email address "${trimmedEmail}" is already registered to another account.`
        });
        return;
      }
    }

    // 4. Password validation
    if (password.trim() && password.trim().length < 6) {
      setStatusMessage({
        type: 'error',
        text: '❌ Password must be at least 6 characters long (পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে).'
      });
      return;
    }

    setIsSaving(true);
    try {
      // Background account password update if logged in
      if (password.trim() && auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, password.trim());
        } catch (_pwdErr) {}
      }

      await onUpdateProfile({
        name: trimmedName,
        efootballId: trimmedId,
        password: password.trim() ? password.trim() : undefined,
        phone: phone.trim(),
        email: trimmedEmail,
        favoriteClub: finalClub,
        division,
        playstyle,
        avatarUrl,
        bio: bio.trim()
      });

      // Clear password field after successful save
      setPassword('');

      setStatusMessage({
        type: 'success',
        text: '🎉 Profile updated successfully! All player information (Name, Club, Password, ID, Gmail) saved.'
      });

      // Automatically return to the Profile Template View so the player sees their updated template
      setActiveTab('overview');

      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = isUserAdmin(currentUser);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center pt-[max(env(safe-area-inset-top,0px),36px)] pb-[max(env(safe-area-inset-bottom,0px),50px)] px-3 sm:px-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-[#0b1220] border border-slate-800 rounded-3xl shadow-2xl shadow-[#00ff87]/10 overflow-hidden my-auto max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glows */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-52 w-52 rounded-full bg-[#00ff87]/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 -ml-16 h-52 w-52 rounded-full bg-[#00e5ff]/10 blur-3xl pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="relative px-5 sm:px-6 pt-4 pb-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00ff87]/25 via-[#00c853]/20 to-[#00e5ff]/25 border border-[#00ff87]/40 text-[#00ff87] shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Player Profile Showcase
                </h2>
                {isAdmin ? (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300">
                    Admin
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-black uppercase text-[#00ff87]">
                    Verified Player
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {activeTab === 'overview' 
                  ? 'খেলোয়াড়ের বিস্তারিত প্রোফাইল কার্ড ও তথ্য তালিকা' 
                  : 'Modify player name, password, club, in-game ID (10-day cooldown), & Gmail'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'overview' && (
              <button
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Back to profile details"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Profile View</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Message Notification Toast */}
        {statusMessage && (
          <div className={`mx-5 sm:mx-6 mt-3 p-3 rounded-xl flex items-start gap-2.5 text-xs font-semibold ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#00ff87] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Navigation Tabs (Website Profile Template Navigation) */}
        <div className="px-5 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex gap-2 sm:gap-4 text-xs font-bold overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2.5 px-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-[#00ff87] text-[#00ff87]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>প্রোফাইল বিবরণী (Overview)</span>
            </button>

            <button
              onClick={() => setActiveTab('edit')}
              className={`py-2.5 px-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'edit'
                  ? 'border-[#00ff87] text-[#00ff87]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>তথ্য পরিবর্তন করুন (Edit Profile)</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2.5 px-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'border-[#00ff87] text-[#00ff87]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-sky-400" />
              <span>ম্যাচ রেকর্ড ও ক্যারিয়ার (Stats)</span>
            </button>

            <button
              onClick={() => setActiveTab('avatar')}
              className={`py-2.5 px-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'avatar'
                  ? 'border-[#00ff87] text-[#00ff87]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>অ্যাভাটার (Avatars)</span>
            </button>
          </div>

          {/* Quick Edit button when on overview */}
          {activeTab === 'overview' && (
            <button
              onClick={() => setActiveTab('edit')}
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-[#00ff87]/15 border border-[#00ff87]/40 px-3 py-1.5 text-xs font-bold text-[#00ff87] hover:bg-[#00ff87] hover:text-slate-950 transition cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

          {/* ============================================================== */}
          {/* TAB 1: OVERVIEW - DETAILED PROFILE TEMPLATE SHOWCASE (DEFAULT) */}
          {/* ============================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* 1. HERO PROFILE CARD TEMPLATE (Steam/Faceit/Gaming style) */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900 via-[#0d172c] to-slate-950 shadow-xl">
                
                {/* Profile Cover Top Strip */}
                <div className="h-24 sm:h-28 w-full bg-gradient-to-r from-emerald-900/60 via-slate-900 to-cyan-900/60 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#00ff87_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                  
                  {/* Top Right Badges */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className="rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 px-2.5 py-1 text-[11px] font-bold text-sky-300 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      <span>{currentUser.division || 'Division 3'}</span>
                    </span>
                    <button
                      onClick={() => setActiveTab('edit')}
                      className="flex items-center gap-1 rounded-full bg-[#00ff87] px-3 py-1 text-[11px] font-black text-slate-950 hover:bg-[#00ff87]/90 transition shadow-md"
                      title="Edit your player details"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>তথ্য পরিবর্তন</span>
                    </button>
                  </div>
                </div>

                {/* Profile Identity Details Row */}
                <div className="px-5 pb-5 pt-0">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-12 sm:-mt-14 gap-4 pb-4 border-b border-slate-800/70">
                    
                    {/* Avatar with glow and badge */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3.5 text-center sm:text-left">
                      <div 
                        className="relative cursor-pointer group"
                        onClick={() => setActiveTab('avatar')}
                        title="Click to change avatar"
                      >
                        <img
                          src={currentUser.avatarUrl || DEFAULT_PLAYER_AVATAR}
                          alt={currentUser.name}
                          className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-4 border-[#0b1220] ring-2 ring-[#00ff87] shadow-xl group-hover:scale-105 transition-transform"
                          onError={(e) => handleAvatarError(e, isAdmin ? DEFAULT_ADMIN_AVATAR : DEFAULT_PLAYER_AVATAR)}
                        />
                        <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-[#00ff87] border-2 border-[#0b1220]" />
                        <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold">
                          <ImageIcon className="w-4 h-4 mb-0.5 text-[#00ff87]" />
                          <span>Change</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {currentUser.name}
                          </h3>
                          {isAdmin ? (
                            <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase px-2 py-0.5">
                              Admin
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-500/20 text-[#00ff87] border border-emerald-500/40 text-[10px] font-black uppercase px-2 py-0.5">
                              Pro Player
                            </span>
                          )}
                        </div>

                        {/* eFootball In-Game ID badge with copy */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                          <div 
                            onClick={handleCopyId}
                            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#00ff87] bg-slate-950/90 px-3 py-1 rounded-xl border border-slate-700/80 hover:border-[#00ff87] hover:bg-slate-900 cursor-pointer transition shadow-sm"
                            title="Click to copy in-game ID"
                          >
                            <Gamepad2 className="w-3.5 h-3.5 text-[#00ff87]" />
                            <span>ID: {currentUser.efootballId || 'Not Set'}</span>
                            {copiedId ? (
                              <Check className="w-3 h-3 text-[#00ff87]" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 hover:text-white" />
                            )}
                          </div>

                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            <strong className="text-slate-200">{currentUser.favoriteClub || 'eFootball FC'}</strong>
                          </span>
                        </div>

                        {currentUser.bio && (
                          <p className="text-xs text-slate-300 italic pt-1 max-w-md">
                            "{currentUser.bio}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center min-w-[200px]">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Matches</span>
                        <span className="text-base font-black text-white">{playerStats.played}</span>
                      </div>
                      <div className="border-l border-slate-800">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">W-D-L</span>
                        <span className="text-xs font-black text-[#00ff87]">{playerStats.won}-{playerStats.drawn}-{playerStats.lost}</span>
                      </div>
                      <div className="border-l border-slate-800">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Win Rate</span>
                        <span className="text-base font-black text-amber-400">{playerStats.winRate}%</span>
                      </div>
                    </div>

                  </div>

                  {/* Cooldown Status Quick Banner */}
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-400" />
                      <span className="text-slate-300 font-medium">
                        eFootball In-Game ID Cooldown Status:
                      </span>
                    </div>

                    {cooldownInfo.isCooldownActive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2.5 py-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>১০ দিন পর পর পরিবর্তন সম্ভব (বাকি: {cooldownInfo.remainingText})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-[#00ff87] px-2.5 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready to change if needed (পরিবর্তন করার জন্য প্রস্তুত)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. COMPREHENSIVE INFORMATION GRID (সকল তথ্য বিস্তারিত) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* CARD A: Personal & Account Information */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#00ff87]" />
                      <span>Account & Personal Details (ব্যক্তিগত তথ্য)</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {currentUser.id.slice(0, 8)}...</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Full Name */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="text-slate-400">Player Full Name (নাম):</span>
                      <strong className="text-white font-bold">{currentUser.name}</strong>
                    </div>

                    {/* Email / Gmail */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="text-slate-400">Linked Gmail (জিমেইল):</span>
                      <div className="flex items-center gap-1 text-right">
                        <strong className="text-sky-300 font-semibold">{currentUser.email || 'None'}</strong>
                        <span title="Verified">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#00ff87]" />
                        </span>
                      </div>
                    </div>

                    {/* Password Status */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="text-slate-400">Password (পাসওয়ার্ড):</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-mono tracking-widest">••••••••</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-1.5 py-0.2 rounded">
                          Protected
                        </span>
                      </div>
                    </div>

                    {/* Phone / WhatsApp */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="text-slate-400">Phone / WhatsApp (যোগাযোগ):</span>
                      <strong className="text-slate-200">
                        {currentUser.phone || 'Not added yet (যোগ করা হয়নি)'}
                      </strong>
                    </div>

                    {/* Role */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="text-slate-400">Platform Role (রোল):</span>
                      <span className="font-bold text-amber-300 uppercase text-[11px]">
                        {currentUser.role}
                      </span>
                    </div>

                    {/* Member Since */}
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400">Member Since (নিবন্ধন):</span>
                      <span className="text-slate-300 font-mono text-[11px]">
                        {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Active Member'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD B: eFootball Gaming Identity */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-cyan-400" />
                      <span>eFootball Gaming Identity (গেমিং প্রোফাইল)</span>
                    </h4>
                    <span className="text-[10px] text-[#00ff87] font-semibold bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                      Mobile v4.x Ready
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* In-Game ID */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="text-slate-400">In-Game ID (ইন-গেম আইডি):</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#00ff87] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {currentUser.efootballId}
                        </span>
                        <button
                          onClick={handleCopyId}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Copy ID"
                        >
                          {copiedId ? <Check className="w-3 h-3 text-[#00ff87]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Favorite Club */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="text-slate-400">Favorite Club (প্রিয় ক্লাব):</span>
                      <strong className="text-amber-300 flex items-center gap-1 font-bold">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        {currentUser.favoriteClub || 'eFootball FC'}
                      </strong>
                    </div>

                    {/* League Division */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="text-slate-400">Current Division (ডিভিশন):</span>
                      <strong className="text-sky-300 font-bold">{currentUser.division || 'Division 3'}</strong>
                    </div>

                    {/* Playstyle / Tactics */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="text-slate-400">Tactical Playstyle (খেলার ধরন):</span>
                      <strong className="text-[#00ff87]">{currentUser.playstyle || 'Quick Counter'}</strong>
                    </div>

                    {/* Tournament Rating */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                      <span className="text-slate-400">Current ELO Rating:</span>
                      <strong className="text-amber-400 font-mono">{currentUser.rating || 1500} pts</strong>
                    </div>

                    {/* ID Cooldown Rule */}
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400">ID Change Rule:</span>
                      <span className="text-[11px] text-slate-300">
                        ১০ দিন অন্তর পরিবর্তনযোগ্য
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. TOURNAMENT PERFORMANCE CAPSULE (ম্যাচ রেকর্ড ও পরিসংখ্যান) */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Tournament Performance & Record (ম্যাচ পারফরম্যান্স)</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('stats')}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    View Details →
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Matches</span>
                    <span className="text-xl font-black text-white">{playerStats.played}</span>
                  </div>
                  <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block">Victories (জয়)</span>
                    <span className="text-xl font-black text-[#00ff87]">{playerStats.won}</span>
                  </div>
                  <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-amber-400 uppercase block">Draws (ড্র)</span>
                    <span className="text-xl font-black text-amber-300">{playerStats.drawn}</span>
                  </div>
                  <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-rose-400 uppercase block">Defeats (হার)</span>
                    <span className="text-xl font-black text-rose-400">{playerStats.lost}</span>
                  </div>
                </div>

                {/* Win rate progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Win Rate Efficiency</span>
                    <span className="font-bold text-amber-400">{playerStats.winRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-[#00ff87] rounded-full transition-all duration-500" 
                      style={{ width: `${playerStats.winRate}%` }}
                    />
                  </div>
                </div>

                {/* Goals comparison and recent form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Goals (Scored / Conceded):</span>
                    <span className="font-bold font-mono">
                      <span className="text-emerald-400">{playerStats.goalsFor}</span> / <span className="text-rose-400">{playerStats.goalsAgainst}</span>
                      <span className={`ml-1 text-[10px] ${playerStats.goalDiff >= 0 ? 'text-[#00ff87]' : 'text-rose-400'}`}>
                        ({playerStats.goalDiff >= 0 ? `+${playerStats.goalDiff}` : playerStats.goalDiff})
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Recent Form (শেষ ৫ ম্যাচ):</span>
                    <div className="flex items-center gap-1">
                      {playerStats.last5Form.length > 0 ? (
                        playerStats.last5Form.map((res, i) => (
                          <span 
                            key={i} 
                            className={`h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold ${
                              res === 'W' 
                                ? 'bg-emerald-500/20 text-[#00ff87] border border-emerald-500/40' 
                                : res === 'D' 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {res}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[11px]">No matches played yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. UPCOMING MATCHES FOR THIS PLAYER (আসন্ন ম্যাচসমূহ) */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span>Your Scheduled Upcoming Fixtures (আসন্ন ম্যাচ)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {upcomingFixtures.length} matches pending
                  </span>
                </div>

                {upcomingFixtures.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingFixtures.map(fixture => {
                      const isP1 = fixture.player1.id === currentUser.id || fixture.player1.efootballId === currentUser.efootballId;
                      const opponent = isP1 ? fixture.player2 : fixture.player1;
                      return (
                        <div 
                          key={fixture.id} 
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <Swords className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <div>
                              <p className="font-bold text-white">
                                vs <span className="text-sky-300">{opponent.name}</span>
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Opponent ID: {opponent.efootballId || 'Pending'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="rounded bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[10px] font-bold px-2 py-0.5">
                              {fixture.round || 'Match Fixture'}
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {fixture.scheduledTime ? new Date(fixture.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Scheduled Soon'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">
                    <p>No pending upcoming fixtures right now.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Join upcoming tournaments from the Home dashboard to compete!</p>
                  </div>
                )}
              </div>

              {/* Action Banner to Edit Information */}
              <div className="rounded-2xl border border-[#00ff87]/30 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <Edit3 className="w-4 h-4 text-[#00ff87]" />
                    <span>কোনো তথ্য পরিবর্তন করতে চান? (Want to change your profile?)</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    You can modify your player name, club, password, eFootball in-game ID (10-day cooldown), and Gmail anytime!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('edit')}
                  className="rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-5 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition cursor-pointer flex-shrink-0"
                >
                  তথ্য পরিবর্তন করুন (Edit Profile)
                </button>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: EDIT PROFILE FORM - FULL CONTROL OVER ALL FIELDS        */}
          {/* ============================================================== */}
          {activeTab === 'edit' && (
            <form id="profile-edit-form" onSubmit={handleSave} className="space-y-5">
              
              {/* Important Rule Notice Banner */}
              <div className="rounded-2xl border border-sky-500/20 bg-sky-950/25 p-4 flex items-start gap-3 text-xs text-sky-200">
                <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-white text-sm">
                    Player Profile Modification Guidelines (তথ্য পরিবর্তনের নিয়মাবলী):
                  </p>
                  <p>• <strong>Player Name, Password, Favorite Club, ও Gmail</strong> যেকোনো সময় ইচ্ছামতো পরিবর্তন করতে পারবেন।</p>
                  <p>• <strong>eFootball In-Game ID</strong>: প্রতি <strong>১০ দিন পর পর (10-day cooldown)</strong> পরিবর্তন করা যাবে এবং এই আইডিটি টুর্নামেন্টের অন্য সবার থেকে <strong>সম্পূর্ণ আলাদা (Unique)</strong> হতে হবে।</p>
                </div>
              </div>

              {/* Form Section 1: Player Name & Account Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Player Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00ff87]" />
                      <span>Player Name / Gamer Tag (খেলোয়াড়ের নাম) *</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Anytime</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Mohammad Rifat"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#00ff87] focus:outline-none focus:ring-1 focus:ring-[#00ff87]"
                  />
                  <p className="text-[10px] text-slate-400">Displayed in fixtures, results, and official broadcasts.</p>
                </div>

                {/* 2. Password Change */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Account Password (পাসওয়ার্ড পরিবর্তন)</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold">Min 6 chars</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep existing password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {password ? 'New password will be updated and secured.' : 'Type a new password here if you want to update it.'}
                  </p>
                </div>
              </div>

              {/* Form Section 2: eFootball In-Game ID (with 10-day cooldown and uniqueness) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Gamepad2 className="w-4 h-4 text-[#00ff87]" />
                    <span>eFootball In-Game ID (১০ দিন পর পর পরিবর্তনযোগ্য) *</span>
                  </label>
                  
                  {/* Cooldown Status Badge */}
                  {cooldownInfo.isCooldownActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2.5 py-0.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>10-Day Lock: {cooldownInfo.remainingText} left (১০ দিন বাকি)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[#00ff87] px-2.5 py-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready to change (পরিবর্তন করা যাবে)</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={efootballId}
                    onChange={(e) => setEfootballId(e.target.value)}
                    required
                    placeholder="e.g. 982-412-104"
                    className={`w-full rounded-xl border bg-slate-950 px-3.5 py-2.5 text-xs font-mono font-bold text-[#00ff87] placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      duplicateIdPlayer 
                        ? 'border-rose-500 focus:ring-rose-500 text-rose-300' 
                        : isIdModified && cooldownInfo.isCooldownActive
                        ? 'border-amber-500/80 focus:ring-amber-400'
                        : 'border-slate-700 focus:border-[#00ff87] focus:ring-[#00ff87]'
                    }`}
                  />
                </div>

                {/* Validation Feedback Messages */}
                {duplicateIdPlayer && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-400 bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/50">
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      ⚠️ eFootball ID "{efootballId.trim()}" is already taken by <strong>{duplicateIdPlayer.name}</strong>. All player IDs must be unique! (সবার আইডি আলাদা হতে হবে)।
                    </span>
                  </div>
                )}

                {isIdModified && cooldownInfo.isCooldownActive && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 bg-amber-950/30 p-2.5 rounded-lg border border-amber-900/50">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      ⏳ 10-day cooldown active! You can change this ID again in <strong>{cooldownInfo.remainingText}</strong>. (১০ দিন পর পর eFootball ID পরিবর্তন সম্ভব)।
                    </span>
                  </div>
                )}

                <p className="text-[10px] text-slate-400">
                  Opponents use this ID to send Friend Match invites in eFootball mobile. Must be unique across all players.
                </p>
              </div>

              {/* Form Section 3: Email / Gmail and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Account Email / Gmail */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                      <span>Account Email / Gmail (জিমেইল পরিবর্তন)</span>
                    </span>
                    <span className="text-[10px] text-sky-400 font-semibold">Editable</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@gmail.com"
                    className={`w-full rounded-xl border bg-slate-900/90 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none ${
                      duplicateEmailPlayer 
                        ? 'border-rose-500 text-rose-300' 
                        : 'border-slate-700 focus:border-[#00ff87]'
                    }`}
                  />
                  {duplicateEmailPlayer && (
                    <p className="text-[10px] text-rose-400 font-semibold">
                      This email is already registered to another account.
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Change your linked Gmail / email address for your player profile.
                  </p>
                </div>

                {/* Phone / WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Phone / WhatsApp (Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1712-345678"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#00ff87] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">Used for direct match coordination and notifications.</p>
                </div>
              </div>

              {/* Form Section 4: Favorite Club & Division */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Favorite Club */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Favorite Club / Model Team (প্রিয় ক্লাব)</span>
                  </label>
                  <select
                    value={isCustomClubSelected ? 'Custom Club...' : favoriteClub}
                    onChange={(e) => handleClubChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                  >
                    {POPULAR_CLUBS.map(club => (
                      <option key={club} value={club}>{club}</option>
                    ))}
                  </select>

                  {/* Custom Club input if selected */}
                  {isCustomClubSelected && (
                    <input
                      type="text"
                      value={customClub}
                      onChange={(e) => setCustomClub(e.target.value)}
                      placeholder="Type your custom club name (e.g. Dhaka Dynamos)"
                      className="mt-1.5 w-full rounded-xl border border-amber-500/50 bg-slate-950 px-3 py-2 text-xs text-amber-200 placeholder-slate-500 focus:border-[#00ff87] focus:outline-none"
                    />
                  )}
                  <p className="text-[10px] text-slate-400">Select popular club or type any custom dream team name.</p>
                </div>

                {/* Division & Playstyle */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Division</span>
                    </label>
                    <select
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                    >
                      {DIVISIONS.map(div => (
                        <option key={div} value={div}>{div}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-[#00ff87]" />
                      <span>Playstyle</span>
                    </label>
                    <select
                      value={playstyle}
                      onChange={(e) => setPlaystyle(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                    >
                      {PLAYSTYLES.map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Section 5: Bio / Motto */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Player Motto / Status Bio (খেলোয়াড়ের স্লোগান বা পরিচিতি)
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Ready to conquer Division 1 and claim the trophy! ⚽🔥"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#00ff87] focus:outline-none"
                />
              </div>

              {/* Submit / Save Button Bar inside Edit View */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  ↩️ Cancel & Back to Profile (বাতিল)
                </button>

                <button
                  type="submit"
                  disabled={isSaving || Boolean(duplicateIdPlayer) || Boolean(duplicateEmailPlayer)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-6 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save All Changes (সব তথ্য সংরক্ষণ করুন)'}</span>
                </button>
              </div>

            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 3: AVATAR GALLERY & CUSTOM URL                             */}
          {/* ============================================================== */}
          {activeTab === 'avatar' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Choose Preset Gaming Avatar</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          setAvatarUrl(preset.url);
                          // Auto trigger update or let them save
                        }}
                        className={`cursor-pointer rounded-2xl border p-3 flex flex-col items-center gap-2 transition-all ${
                          isSelected
                            ? 'border-[#00ff87] bg-[#00ff87]/10 shadow-lg shadow-[#00ff87]/15 ring-2 ring-[#00ff87]/40'
                            : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="h-16 w-16 rounded-xl object-cover border border-slate-700"
                          />
                          {isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#00ff87] text-slate-950">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-200 text-center">
                          {preset.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Or Enter Custom Image URL</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/my-avatar.png"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(DEFAULT_PLAYER_AVATAR)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Reset Default
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Back to Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  className="rounded-xl bg-[#00ff87] px-5 py-2 text-xs font-black text-slate-950 hover:bg-[#00ff87]/90"
                >
                  Save Avatar
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: MATCH STATISTICS & TOURNAMENT RECORDS                  */}
          {/* ============================================================== */}
          {activeTab === 'stats' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-900 p-3 border border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Played</span>
                  <p className="text-xl font-black text-white">{playerStats.played}</p>
                </div>
                <div className="rounded-xl bg-slate-900 p-3 border border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Victories</span>
                  <p className="text-xl font-black text-[#00ff87]">{playerStats.won}</p>
                </div>
                <div className="rounded-xl bg-slate-900 p-3 border border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Draws</span>
                  <p className="text-xl font-black text-amber-300">{playerStats.drawn}</p>
                </div>
                <div className="rounded-xl bg-slate-900 p-3 border border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-rose-400 uppercase">Defeats</span>
                  <p className="text-xl font-black text-rose-400">{playerStats.lost}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Goals Scored:</span>
                  <strong className="text-emerald-400 font-bold">{playerStats.goalsFor}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Goals Conceded:</span>
                  <strong className="text-rose-400 font-bold">{playerStats.goalsAgainst}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Goal Difference:</span>
                  <strong className={playerStats.goalDiff >= 0 ? 'text-[#00ff87] font-bold' : 'text-rose-400 font-bold'}>
                    {playerStats.goalDiff > 0 ? `+${playerStats.goalDiff}` : playerStats.goalDiff}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Win Rate:</span>
                  <strong className="text-amber-400 font-bold">{playerStats.winRate}%</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Current Rating:</span>
                  <strong className="text-amber-400 font-mono">{currentUser.rating || 1500} ePoints</strong>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Back to Profile Overview
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Persistent Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-950 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
          {/* Left Actions: Switch account & Logout */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-600 transition"
              title="Switch player account or sign in"
            >
              <LogIn className="w-3.5 h-3.5 text-sky-400" />
              <span>Switch / Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-rose-900/40 bg-rose-950/20 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-900/30 transition"
              title="Log out of current account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Right Actions: Modal Close or Edit / Save */}
          <div className="flex items-center gap-2.5">
            {activeTab === 'overview' ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-5 py-2 text-xs font-black text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>তথ্য পরিবর্তন (Edit Profile)</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Back to Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={isSaving || Boolean(duplicateIdPlayer) || Boolean(duplicateEmailPlayer)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-5 py-2 text-xs font-black text-slate-950 shadow-md shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
