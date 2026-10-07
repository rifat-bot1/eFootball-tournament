import React, { useState } from 'react';
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
  LogOut
} from 'lucide-react';
import { UserProfile } from '../types/tournament';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: 'dashboard' | 'fixtures' | 'submit' | 'leaderboard' | 'rules' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'fixtures' | 'submit' | 'leaderboard' | 'rules' | 'admin') => void;
  currentUser: UserProfile;
  onOpenAuth: () => void;
  pendingReviewsCount: number;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  pendingReviewsCount,
  onLogout
}) => {
  const [copiedId, setCopiedId] = useState(false);

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
    { id: 'rules', label: 'Rules', icon: BookOpen },
    { 
      id: 'admin', 
      label: 'Admin Desk', 
      icon: ShieldCheck,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined 
    },
    {
      id: 'telegram',
      label: 'Telegram Channel',
      icon: Send,
      isExternal: true,
      url: 'https://t.me/eFootballTournamentBD'
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#080c14]/90 backdrop-blur-md">
      {/* Top Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
        
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
              PWA Tournament &amp; Result Desk
            </p>
          </div>
        </div>

        {/* Action Controls & Active Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* PWA Install Button */}
          <div className="hidden xs:block">
            <PWAInstallButton />
          </div>

          {/* Direct Telegram Channel Link (Opens https://t.me/eFootballTournamentBD directly) */}
          <a
            href="https://t.me/eFootballTournamentBD"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-950/40 px-2.5 py-1.5 text-xs font-bold text-sky-400 hover:bg-sky-500/20 hover:border-sky-400 hover:text-white transition-all shadow-sm"
            title="Join Official Telegram Channel (@eFootballTournamentBD)"
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Telegram Channel</span>
          </a>

          {/* User Profile Capsule */}
          <div 
            onClick={onOpenAuth}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 p-1.5 pr-2.5 hover:border-[#00ff87]/50 transition-all group"
            title="Click to switch player or sign in"
          >
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.name} 
              className="h-7 w-7 rounded-lg object-cover border border-[#00ff87]/40 group-hover:scale-105 transition-transform"
            />
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white group-hover:text-[#00ff87] transition-colors leading-none">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className={`text-[9px] font-bold px-1 rounded uppercase ${
                  currentUser.role === 'admin' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-[#00ff87]/20 text-[#00ff87]'
                }`}>
                  {currentUser.role}
                </span>
              </div>
              <div 
                onClick={copyEfootballId} 
                className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 hover:text-[#00e5ff] font-mono"
              >
                <span>ID: {currentUser.efootballId}</span>
                {copiedId ? (
                  <Check className="w-2.5 h-2.5 text-[#00ff87]" />
                ) : (
                  <Copy className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
                )}
              </div>
            </div>

            {onLogout && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                className="hidden sm:flex items-center justify-center p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition ml-1"
                title="Log out and switch account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Tab Navigation - Horizontal scroll on mobile for perfect gaming usability */}
      <nav className="border-t border-slate-800/80 bg-slate-950/60 px-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (item.isExternal) {
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500/10 hover:text-white transition-all border border-transparent hover:border-sky-500/30"
                >
                  <Icon className="w-3.5 h-3.5 text-sky-400" />
                  <span>{item.label}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#00ff87]/20 to-[#00e5ff]/10 text-[#00ff87] border border-[#00ff87]/40 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00ff87]' : 'text-slate-400'}`} />
                <span>{item.label}</span>

                {item.badge !== undefined && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-slate-950 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
