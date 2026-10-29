import React from 'react';
import { APP_LOGO } from '../utils/imageUtils';

interface LoadingScreenProps {
  onDismiss?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onDismiss }) => {
  return (
    <div 
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f8fafc] text-slate-800 transition-opacity duration-300 select-none cursor-pointer"
      title="Click anywhere to skip loading"
    >
      {/* Concentric Spinner Rings Container */}
      <div className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40">
        
        {/* Outer subtle static ring */}
        <div className="absolute inset-0 rounded-full border-2 border-sky-100" />

        {/* Animated spinning outer arc ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-600 border-r-blue-400 animate-spin" />

        {/* Middle subtle ring */}
        <div className="absolute inset-3 rounded-full border border-sky-200/80" />

        {/* Inner reverse-rotating accent ring */}
        <div className="absolute inset-4 rounded-full border-2 border-transparent border-b-cyan-400 border-l-sky-500 animate-[spin_3s_linear_infinite_reverse]" />

        {/* Center Circular Badge with official crest logo */}
        <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900 border-2 border-amber-400/90 shadow-xl overflow-hidden flex items-center justify-center p-0.5">
          <img 
            src={APP_LOGO} 
            alt="DREAM SQUAD BD" 
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/icon.svg';
            }}
          />
        </div>
      </div>

      {/* Main Title */}
      <h1 className="mt-8 text-base sm:text-lg font-black tracking-[0.25em] text-slate-800 uppercase font-mono">
        DREAM SQUAD BD
      </h1>

      {/* Animated dots sub-bar */}
      <p className="mt-2 text-xs sm:text-sm font-bold tracking-[0.2em] text-blue-600 uppercase flex items-center gap-1">
        <span>PREPARING YOUR EXPERIENCE</span>
        <span className="inline-flex gap-0.5">
          <span className="inline-block animate-bounce [animation-delay:0ms]">•</span>
          <span className="inline-block animate-bounce [animation-delay:150ms]">•</span>
          <span className="inline-block animate-bounce [animation-delay:300ms]">•</span>
        </span>
      </p>

      {/* Bengali helper message */}
      <p className="mt-3 text-xs sm:text-sm text-slate-400 font-medium">
        অপেক্ষা করুন, গেম ডাটা লোড হচ্ছে...
      </p>
    </div>
  );
};
