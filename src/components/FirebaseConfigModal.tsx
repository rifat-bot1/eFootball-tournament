import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Check, 
  AlertCircle, 
  Database, 
  Lock, 
  HardDrive, 
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { FirebaseConfigSettings } from '../types/tournament';
import { 
  getStoredFirebaseConfig, 
  saveStoredFirebaseConfig, 
  DEFAULT_FIREBASE_CONFIG 
} from '../services/firebase';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<FirebaseConfigSettings>(getStoredFirebaseConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredFirebaseConfig({
      ...config,
      isConfigured: Boolean(config.apiKey && !config.apiKey.includes('Dummy'))
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      window.location.reload();
    }, 1200);
  };

  const handleResetToDefault = () => {
    setConfig(DEFAULT_FIREBASE_CONFIG);
    saveStoredFirebaseConfig(DEFAULT_FIREBASE_CONFIG);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-slate-900 shadow-2xl text-slate-100 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400 border border-amber-500/40">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Firebase Integration Settings
              </h2>
              <p className="text-[11px] text-slate-400">
                Auth, Cloud Firestore &amp; Firebase Storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
          
          {/* Status Capsule */}
          <div className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
            config.isConfigured
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-slate-800 bg-slate-950/80 text-slate-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${config.isConfigured ? 'bg-[#00ff87] animate-ping' : 'bg-slate-500'}`} />
              <span>
                <strong>Mode:</strong> {config.isConfigured ? 'Connected to Real Firebase' : 'Zero-Setup Local Mode (Full Storage & DB Simulation Active)'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400 space-y-1.5">
            <p className="font-bold text-slate-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" />
              Where to get your Firebase keys:
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-[11px]">
              <li>Open <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a></li>
              <li>Add Web App in Project Settings &rarr; copy your <code>firebaseConfig</code></li>
              <li>Enable Authentication (Email/Password), Firestore, &amp; Firebase Storage</li>
            </ol>
          </div>

          {/* Config fields */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                API Key (apiKey)
              </label>
              <input
                type="text"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Auth Domain
                </label>
                <input
                  type="text"
                  value={config.authDomain}
                  onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                  placeholder="app.firebaseapp.com"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  value={config.projectId}
                  onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                  placeholder="efootball-tournament"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Storage Bucket (for Screenshots)
              </label>
              <input
                type="text"
                value={config.storageBucket}
                onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
                placeholder="efootball-tournament.appspot.com"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Messaging Sender ID
                </label>
                <input
                  type="text"
                  value={config.messagingSenderId}
                  onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
                  placeholder="123456789012"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  App ID
                </label>
                <input
                  type="text"
                  value={config.appId}
                  onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                  placeholder="1:123456789012:web:..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Measurement ID (Optional)
              </label>
              <input
                type="text"
                value={config.measurementId || ''}
                onChange={(e) => setConfig({ ...config, measurementId: e.target.value })}
                placeholder="G-..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset to Demo Store</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#00ff87] px-5 py-2 text-xs font-black uppercase text-slate-950 hover:brightness-110 active:scale-95 transition"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved! Reloading...</span>
                  </>
                ) : (
                  <span>Save Config</span>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
