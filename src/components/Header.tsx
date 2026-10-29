import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Calendar, 
  Upload, 
  Table, 
  ShieldCheck, 
  Copy, 
  Check, 
  User, 
  Flame, 
  Gamepad2,
  Send,
  ExternalLink,
  BookOpen,
  LogOut,
  History,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Settings,
  Megaphone,
  Radio,
  Bell,
  Wallet,
  Coins,
  Users
} from 'lucide-react';
import { UserProfile } from '../types/tournament';
import { PWAInstallButton } from './PWAInstallButton';
import { handleAvatarError, DEFAULT_ADMIN_AVATAR, DEFAULT_PLAYER_AVATAR } from '../utils/imageUtils';
import { isUserAdmin } from '../services/mockData';
import { subscribeToAnnouncements } from '../services/announcementService';
import { getAppSettings, subscribeToAppSettings } from '../services/settingsService';
import { AppSettings } from '../types/tournament';

interface HeaderProps {
  activeTab: 'dashboard' | 'fixtures' | 'submit' | 'leaderboard' | 'history' | 'rules' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'fixtures' | 'submit' | 'leaderboard' | 'history' | 'rules' | 'admin') => void;
  currentUser: UserProfile;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenNoticeFeed: () => void;
  onOpenWallet: () => void;
  onOpenAdminUsers: () => void;
  pendingReviewsCount: number;
  pendingTransactionsCount?: number;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenNoticeFeed,
  onOpenWallet,
  onOpenAdminUsers,
  pendingReviewsCount,
  pendingTransactionsCount = 0,
  onLogout
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeNoticeCount, setActiveNoticeCount] = useState<number>(0);
  const [hasUnreadNotice, setHasUnreadNotice] = useState<boolean>(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(getAppSettings());
  const menuRef = useRef<HTMLDivElement>(null);

  // Subscribe to live app settings
  useEffect(() => {
    const unsub = subscribeToAppSettings(setAppSettings);
    return () => unsub();
  }, []);

  // Subscribe to real-time announcements to badge the live notice icon
  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements((data) => {
      const active = data.filter(a => a.active);
      setActiveNoticeCount(active.length);
      try {
        const lastRead = Number(localStorage.getItem('efootball_last_read_notice_time') || '0');
        const hasNew = active.some(a => new Date(a.createdAt).getTime() > lastRead);
        setHasUnreadNotice(hasNew);
      } catch {
        setHasUnreadNotice(active.length > 0);
      }
    });
    return () => unsubscribe();
  }, []);

  // Close menu on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const copyEfootballId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(currentUser.efootballId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Flame },
    { id: 'fixtures', label: 'Fixtures', icon: Calendar },
    { id: 'submit', label: 'Submit Result', icon: Upload },
    { id: 'leaderboard', label: 'Leaderboard', icon: Table },
    { id: 'history', label: 'History', icon: History },
    { id: 'rules', label: 'Rules', icon: BookOpen },
    ...(isUserAdmin(currentUser) ? [{ 
      id: 'admin', 
      label: 'Admin Panel', 
      icon: ShieldCheck,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined 
    }] : []),
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId as any);
    setIsMenuOpen(false);
  };

  const currentTabLabel = navItems.find(item => item.id === activeTab)?.label || 'Home';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#080c14]/95 backdrop-blur-md safe-top-padding sm:pt-0">
      {/* Top Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-2.5 sm:px-6 py-2 sm:py-2.5">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex cursor-pointer items-center gap-2.5 group"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00ff87] via-[#00c853] to-[#00e5ff] p-[1.5px] shadow-lg shadow-[#00ff87]/20 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Gamepad2 className="h-5 w-5 text-[#00ff87]" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ff87]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-wider text-white">eFootball</span>
              <span className="rounded bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-1.5 py-0.2 text-[10px] font-black uppercase text-slate-950">
                Arena
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              {currentTabLabel} • BD Tournament PWA
            </p>
          </div>
        </div>

        {/* Right Controls: Telegram + Profile Icon + 3-Line Menu Icon */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* PWA Install Button (if installable) */}
          <div className="hidden md:block">
            <PWAInstallButton />
          </div>

          {/* 1. Telegram Channel Button */}
          <a
            href={appSettings.telegramChannelUrl || "https://t.me/eFootballTournamentBD"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/40 px-2.5 sm:px-3 py-2 text-xs font-bold text-sky-400 hover:bg-sky-500/20 hover:border-sky-400 hover:text-white transition-all shadow-sm"
            title="Join Official Telegram Channel"
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Telegram</span>
          </a>

          {/* 2. Tournament Live Notice & Urgent Feed Button (New) */}
          <button
            onClick={() => {
              setHasUnreadNotice(false);
              onOpenNoticeFeed();
            }}
            className="relative flex items-center gap-1.5 rounded-xl border border-rose-500/50 bg-rose-950/40 px-2.5 sm:px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/25 hover:border-rose-400 hover:text-white transition-all shadow-md group"
            title="Tournament Live Notice & Urgent Feed (সকল জরুরি নোটিশ ও ব্রেকিং আপডেট)"
            aria-label="Tournament Live Notice & Urgent Feed"
          >
            <div className="relative flex items-center justify-center">
              <Megaphone className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              {hasUnreadNotice && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Live Notice</span>
            {activeNoticeCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500/30 border border-rose-500/60 px-1 text-[10px] font-black text-rose-200">
                {activeNoticeCount}
              </span>
            )}
          </button>

          {/* 3. Wallet Balance Pill Button */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-2 sm:px-2.5 py-1.5 sm:py-2 text-xs font-bold text-[#00ff87] hover:bg-emerald-500/20 hover:border-[#00ff87] transition-all shadow-sm active:scale-95 group shrink-0"
            title="My Wallet & Balance (টাকা জমা ও উত্তোলন)"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="font-mono font-black text-white group-hover:text-[#00ff87]">
              ৳{currentUser.balance || 0}
            </span>
          </button>

          {/* 4. Profile Icon / Capsule: Clicking opens UserProfileModal */}
          <div 
            onClick={onOpenProfile}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1.5 pr-2.5 hover:border-[#00ff87]/60 hover:bg-slate-850 transition-all group shadow-sm"
            title="Click to view & edit your profile details"
          >
            <div className="relative">
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="h-8 w-8 rounded-lg object-cover border border-[#00ff87]/50 group-hover:scale-105 transition-transform"
                onError={(e) => handleAvatarError(e, isUserAdmin(currentUser) ? DEFAULT_ADMIN_AVATAR : DEFAULT_PLAYER_AVATAR)}
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#00ff87] border-2 border-slate-900" />
            </div>

            <div className="text-left hidden sm:block max-w-[120px]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white group-hover:text-[#00ff87] transition-colors leading-none truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className={`text-[9px] font-bold px-1 rounded uppercase flex-shrink-0 ${
                  isUserAdmin(currentUser) 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-[#00ff87]/20 text-[#00ff87]'
                }`}>
                  {isUserAdmin(currentUser) ? 'admin' : 'player'}
                </span>
              </div>
              <div 
                onClick={copyEfootballId} 
                className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 hover:text-[#00e5ff] font-mono truncate"
              >
                <span className="truncate">ID: {currentUser.efootballId}</span>
                {copiedId ? (
                  <Check className="w-2.5 h-2.5 text-[#00ff87] flex-shrink-0" />
                ) : (
                  <Copy className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* 3. 3-Line Menu Icon Button (Hamburger Button beside Telegram & Profile) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-md ${
                isMenuOpen
                  ? 'bg-gradient-to-r from-[#00ff87]/25 to-[#00e5ff]/20 border-[#00ff87] text-[#00ff87]'
                  : 'bg-slate-900/90 border-slate-700/80 text-white hover:border-[#00ff87]/60 hover:bg-slate-800'
              }`}
              aria-label="Navigation Menu"
              title="Open Navigation Menu (Home, Fixtures, Submit Result...)"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-[#00ff87] animate-spin-fast" />
              ) : (
                <Menu className="w-5 h-5 text-[#00ff87]" />
              )}
              <span className="hidden md:inline font-bold">Menu</span>
              
              {/* Badge indicator if pending admin reviews */}
              {pendingReviewsCount > 0 && isUserAdmin(currentUser) && (
                <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            {/* Dropdown / Popover Navigation Menu */}
            {isMenuOpen && (
              <div 
                className="absolute right-0 top-full mt-2.5 w-[calc(100vw-24px)] max-w-[320px] sm:w-80 rounded-2xl border border-slate-800 bg-[#0d1627]/98 backdrop-blur-xl shadow-2xl shadow-black/80 p-2.5 animate-fadeIn z-50 text-slate-100 divide-y divide-slate-800/80 max-h-[85vh] overflow-y-auto"
              >
                {/* Menu Header with User Capsule Shortcut */}
                <div 
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="flex items-center gap-3 p-2.5 mb-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 cursor-pointer border border-slate-800 transition group"
                  title="Click to view & edit your player profile"
                >
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="h-10 w-10 rounded-xl object-cover border border-[#00ff87]/50"
                    onError={(e) => handleAvatarError(e, isUserAdmin(currentUser) ? DEFAULT_ADMIN_AVATAR : DEFAULT_PLAYER_AVATAR)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white group-hover:text-[#00ff87] transition truncate">
                        {currentUser.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        isUserAdmin(currentUser)
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-[#00ff87]/20 text-[#00ff87]'
                      }`}>
                        {isUserAdmin(currentUser) ? 'Admin' : 'Player'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <span>ID: {currentUser.efootballId}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#00ff87] transition" />
                </div>

                {/* Primary Navigation Items */}
                <div className="py-1.5 space-y-0.5">
                  {/* Tournament Live Notice */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setHasUnreadNotice(false);
                      onOpenNoticeFeed();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Megaphone className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-white">Notice</span>
                    </div>
                    {activeNoticeCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
                        {activeNoticeCount}
                      </span>
                    )}
                  </button>

                  {/* Balance */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenWallet();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Balance</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#00ff87]">
                      ৳{currentUser.balance || 0}
                    </span>
                  </button>

                  {/* Users (Admin Only) */}
                  {isUserAdmin(currentUser) && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAdminUsers();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Users</span>
                      </div>
                      {pendingTransactionsCount > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-slate-950">
                          {pendingTransactionsCount}
                        </span>
                      )}
                    </button>
                  )}

                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition ${
                          isActive
                            ? 'bg-[#00ff87]/15 text-[#00ff87] font-bold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#00ff87]' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold">{item.label}</span>
                        </div>

                        {item.badge !== undefined && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-slate-950">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Secondary Actions: Telegram + Switch Account + Logout */}
                <div className="pt-2 space-y-0.5">
                  <a
                    href={appSettings.telegramChannelUrl || "https://t.me/eFootballTournamentBD"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-sky-400 hover:bg-sky-500/10 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Send className="w-4 h-4 text-sky-400" />
                      <span>Telegram</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </a>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-sky-400 hover:bg-sky-500/10 transition"
                  >
                    <User className="w-4 h-4 text-sky-400" />
                    <span>Login / Register</span>
                  </button>

                  {onLogout && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
