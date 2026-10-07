import React, { useState } from 'react';
import { 
  X, 
  AlertCircle, 
  Check, 
  Users, 
  ShieldCheck,
  Gamepad2
} from 'lucide-react';
import { UserProfile } from '../types/tournament';
import { initFirebase } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onRegister: (data: {
    name: string;
    email: string;
    efootballId: string;
    favoriteClub?: string;
    role?: 'player' | 'admin';
  }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onSelectUser,
  onRegister
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Registration fields
  const [playerName, setPlayerName] = useState('');
  const [efootballId, setEfootballId] = useState('');
  
  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickSwitch, setShowQuickSwitch] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try Firebase Auth if live credentials are active
      const { auth, live } = initFirebase();
      if (live && auth) {
        try {
          await signInWithEmailAndPassword(auth, trimmedEmail, password);
        } catch (firebaseErr: any) {
          console.warn('Firebase signIn notice:', firebaseErr.message);
          // If Firebase says wrong password, propagate error
          if (firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/invalid-credential') {
            setError('Invalid email or password.');
            setIsLoading(false);
            return;
          }
        }
      }

      // 2. Check local users database
      const existing = allUsers.find(
        u => u.email.toLowerCase() === trimmedEmail.toLowerCase()
      );

      if (existing) {
        onSelectUser(existing);
        onClose();
      } else {
        setError('No account found with this email. Please click REGISTER to create your profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = playerName.trim();
    const trimmedEfootballId = efootballId.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Player Name is required.');
      return;
    }
    if (!trimmedEfootballId) {
      setError('eFootball In-Game ID is required to match players!');
      return;
    }
    if (!trimmedEmail) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Register with Firebase Auth if live credentials are active
      const { auth, live } = initFirebase();
      if (live && auth) {
        try {
          await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/email-already-in-use') {
            setError('An account with this email already exists. Please log in.');
            setIsLoading(false);
            return;
          }
        }
      }

      // 2. Create player in tournament system
      onRegister({
        name: trimmedName,
        email: trimmedEmail,
        efootballId: trimmedEfootballId,
        role: 'player'
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      const { auth, live } = initFirebase();
      if (live && auth) {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        if (res.user?.email) {
          const userEmail = res.user.email;
          const found = allUsers.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
          if (found) {
            onSelectUser(found);
            onClose();
            return;
          }
          // Register with generated eFootball ID
          onRegister({
            name: res.user.displayName || 'Google Player',
            email: userEmail,
            efootballId: `EF_${Math.floor(100000 + Math.random() * 900000)}`,
            role: 'player'
          });
          onClose();
          return;
        }
      }
    } catch (err: any) {
      console.warn('Google popup error, falling back:', err.message);
    } finally {
      setIsLoading(false);
    }

    // Default fast login as Mohammad Rifat
    const userToLogin = allUsers[0];
    onSelectUser(userToLogin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-[#0f141d] border border-slate-800/80 p-6 sm:p-7 shadow-2xl text-slate-100 my-auto animate-scaleUp">
        
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Join the Arena'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {mode === 'login' 
                ? 'Login to submit results & track your rank.' 
                : 'Create your player profile to compete.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition -mr-1 -mt-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs (LOGIN / REGISTER) - Exact design from screenshot */}
        <div className="grid grid-cols-2 gap-2 bg-[#090d14] p-1.5 rounded-2xl my-5 border border-slate-800/60">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-[#00e575] text-slate-950 shadow-md shadow-[#00e575]/20'
                : 'bg-transparent text-slate-400 hover:text-white'
            }`}
          >
            LOGIN
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-[#00e575] text-slate-950 shadow-md shadow-[#00e575]/20'
                : 'bg-transparent text-slate-400 hover:text-white'
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM (Screenshot 1: EMAIL, PASSWORD, LOGIN button) */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full rounded-xl bg-[#090d14] border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00e575] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl bg-[#090d14] border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00e575] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 rounded-xl bg-[#00e575] hover:bg-[#00c865] py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-[#00e575]/20 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isLoading ? 'SIGNING IN...' : 'LOGIN'}
            </button>
          </form>
        )}

        {/* REGISTER FORM (Screenshot 2: PLAYER NAME, EFOOTBALL ID, EMAIL, PASSWORD, CREATE ACCOUNT button) */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                PLAYER NAME
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your display name"
                required
                className="w-full rounded-xl bg-[#090d14] border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#0084ff] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                EFOOTBALL ID
              </label>
              <input
                type="text"
                value={efootballId}
                onChange={(e) => setEfootballId(e.target.value)}
                placeholder="e.g. RONALDO_7"
                required
                className="w-full rounded-xl bg-[#090d14] border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#0084ff] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full rounded-xl bg-[#090d14] border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#0084ff] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                className="w-full rounded-xl bg-[#090d14] border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#0084ff] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 rounded-xl bg-[#0084ff] hover:bg-[#0072dd] py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-[#0084ff]/25 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isLoading ? 'CREATING PROFILE...' : 'CREATE ACCOUNT'}
            </button>
          </form>
        )}

        {/* Optional Secondary Actions (Google Sign-In & Quick Player Switch for testing) */}
        <div className="mt-5 pt-4 border-t border-slate-800/60 space-y-2.5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#090d14] hover:bg-slate-800/60 py-2.5 text-xs font-semibold text-slate-300 transition"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick Switch Dropdown Toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowQuickSwitch(!showQuickSwitch)}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition"
            >
              {showQuickSwitch ? 'Hide Quick Switch' : '⚡ Quick Switch Demo Players / Admin'}
            </button>
          </div>

          {showQuickSwitch && (
            <div className="rounded-xl border border-slate-800 bg-[#090d14] p-2 space-y-1 max-h-40 overflow-y-auto">
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onSelectUser(u);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition ${
                    currentUser.id === u.id 
                      ? 'bg-slate-800 text-[#00e575]' 
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={u.avatarUrl} alt={u.name} className="h-5 w-5 rounded object-cover" />
                    <span className="font-medium truncate max-w-[150px]">{u.name}</span>
                  </div>
                  <span className={`text-[9px] uppercase px-1 py-0.2 rounded font-bold ${
                    u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
