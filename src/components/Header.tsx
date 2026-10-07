import React, { useState } from 'react';
import { 
  Trophy, 
  Calendar, 
  Upload, 
  Table, 
  ShieldCheck, 
  Send, 
  Copy, 
  Check, 
  User, 
  Flame, 
  Settings, 
  Gamepad2,
  RefreshCw
} from 'lucide-react';
import { UserProfile } from '../types/tournament';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: 'dashboard' | 'fixtures' | 'submit' | 'leaderboard' | 'admin' | 'telegram';
  setActiveTab: (tab: 'dashboard' | 'fixtures' | 'submit' | 'leaderboard' | 'admin' | 'telegram') => void;
  currentUser: UserProfile;
  onOpenAuth: () => void;
  onOpenFirebaseConfig: () => void;
  onOpenTelegramScript: () => void;
  pendingReviewsCount: number;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onOpenFirebaseConfig,
  onOpenTelegramScript,
  pendingReviewsCount,
  onResetData
}) => {
  const [copiedId, setCopiedId] = useState(false);

  const copyEfootballId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(currentUser.efootballId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const navItems: Array<{
    id: 'dashboard' | 'fixtures' | 'submit' | 'leaderboard' | 'admin' | 'telegram';
    label: string;
    icon: any;
    badge?: number;
  }> = [
    { id: 'dashboard', label: 'Home', icon: Flame },
    { id: 'fixtures', label: 'Fixtures', icon: Calendar },
    { id: 'submit', label: 'Submit Result', icon: Upload },
    { id: 'leaderboard', label: 'Leaderboard', icon: Table },
    { 
      id: 'admin', 
      label: 'Admin Desk', 
      icon: ShieldCheck,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined 
    },
    { id: 'telegram', label: 'Telegram Bot', icon: Send }
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
              PWA Tournament & Result Desk
            </p>
          </div>
        </div>

        {/* Action Controls & Active Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* PWA Install Button */}
          <div className="hidden xs:block">
            <PWAInstallButton />
          </div>

          {/* Quick Telegram Bot Launcher */}
          <button
            onClick={onOpenTelegramScript}
            className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-950/30 px-2.5 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500/10 hover:border-sky-400 transition-colors"
            title="Configure Telegram Bot & PHP Script"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Telegram Bot</span>
          </button>

          {/* Firebase Settings */}
          <button
            onClick={onOpenFirebaseConfig}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/80 p-1.5 sm:px-2.5 sm:py-1.5 text-xs text-slate-300 hover:text-amber-400 hover:border-amber-400/40 transition-colors"
            title="Configure Firebase Keys & Storage"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden lg:inline">Firebase</span>
          </button>

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
          </div>

        </div>
      </div>

      {/* Main Tab Navigation - Horizontal scroll on mobile for perfect gaming usability */}
      <nav className="border-t border-slate-800/80 bg-slate-950/60 px-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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

          <div className="ml-auto pl-2 flex items-center gap-2">
            <button
              onClick={onResetData}
              className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors"
              title="Reset sample tournament fixtures"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden md:inline">Reset Seeds</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};
