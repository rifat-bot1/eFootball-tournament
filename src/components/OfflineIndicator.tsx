import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-3 rounded-xl bg-amber-500/90 text-slate-950 px-4 py-2.5 text-xs font-bold shadow-2xl backdrop-blur-md border border-amber-300 animate-bounce">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <div>
        <p className="font-bold">Offline Gaming Mode Active</p>
        <p className="font-normal text-[11px] opacity-90">Cached fixtures & standings available. New submissions will sync once connected.</p>
      </div>
    </div>
  );
};
