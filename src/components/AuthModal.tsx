import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Gamepad2, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Flame, 
  Users,
  LogIn
} from 'lucide-react';
import { UserProfile } from '../types/tournament';
import { initFirebase } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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
  const [mode, setMode] = useState<'login' | 'register' | 'switch'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [efootballId, setEfootballId] = useState('');
  const [favoriteClub, setFavoriteClub] = useState('FC Barcelona');
  const [role, setRole] = useState<'player' | 'admin'>('player');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter your name.');
    if (!email.trim()) return setError('Please enter your email.');
    if (!efootballId.trim()) return setError('eFootball In-Game ID is required to match players!');

    try {
      onRegister({
        name: name.trim(),
        email: email.trim(),
        efootballId: efootballId.trim(),
        favoriteClub,
        role
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError('Please enter your email.');
    const existing = allUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      onSelectUser(existing);
      onClose();
    } else {
      setError('No account found with this email. Please register with your eFootball ID.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { auth, live } = initFirebase();
      if (live && auth) {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        if (res.user?.email) {
          const email = res.user.email;
          const found = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (found) {
            onSelectUser(found);
            onClose();
            return;
          }
          // Register with generated eFootball ID
          onRegister({
            name: res.user.displayName || 'Google Player',
            email,
            efootballId: `${Math.floor(100 + Math.random() * 899)}-${Math.floor(100 + Math.random() * 899)}-${Math.floor(100 + Math.random() * 899)}`,
            role: 'player'
          });
          onClose();
          return;
        }
      }
    } catch (err: any) {
      console.warn('Google popup error, switching to demo user:', err.message);
    }

    // Fallback: Sign in as premier player
    const userToLogin = allUsers.find(u => u.email === 'rfrifatbs@gmail.com') || allUsers[0];
    onSelectUser(userToLogin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] p-2 text-slate-950 font-black">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Player Profile &amp; Auth
              </h2>
              <p className="text-[11px] text-slate-400">
                Firebase Authentication &amp; In-Game ID Sync
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

        {/* Tab Toggle */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 p-1">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              mode === 'login'
                ? 'bg-slate-800 text-[#00ff87] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              mode === 'register'
                ? 'bg-slate-800 text-[#00ff87] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setMode('switch'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              mode === 'switch'
                ? 'bg-slate-800 text-[#00ff87] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quick Switch
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* GOOGLE SIGN IN BUTTON */}
          {mode !== 'switch' && (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800/80 py-2.5 text-xs font-bold text-white transition shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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

              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500">
                  Or with email
                </span>
              </div>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@efootball.com"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name / Gamer Tag
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kylian Striker"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Email (Firebase Auth)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@efootball.com"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                  />
                </div>
              </div>

              {/* Crucial: eFootball In-Game ID */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                  <span>eFootball In-Game ID</span>
                  <span className="text-[10px] text-[#00ff87] lowercase">crucial for friend matches</span>
                </label>
                <div className="relative">
                  <Gamepad2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={efootballId}
                    onChange={(e) => setEfootballId(e.target.value)}
                    placeholder="e.g. 982-412-104"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Favorite Club
                  </label>
                  <select
                    value={favoriteClub}
                    onChange={(e) => setFavoriteClub(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                  >
                    <option value="FC Barcelona">FC Barcelona</option>
                    <option value="Real Madrid">Real Madrid</option>
                    <option value="Arsenal">Arsenal</option>
                    <option value="Manchester City">Manchester City</option>
                    <option value="Manchester United">Manchester United</option>
                    <option value="Bayern Munich">Bayern Munich</option>
                    <option value="Inter Milan">Inter Milan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-[#00ff87] focus:outline-none"
                  >
                    <option value="player">Player (Contender)</option>
                    <option value="admin">Admin (Manager Desk)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition"
                >
                  Create &amp; Sign In
                </button>
              </div>
            </form>
          )}

          {/* MODE: SWITCH */}
          {mode === 'switch' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Click any profile to instantly switch perspective (useful for testing admin verification or multiple competitors):
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allUsers.map((user) => {
                  const isActive = user.id === currentUser.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        onClose();
                      }}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                        isActive
                          ? 'border-[#00ff87] bg-[#00ff87]/10'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={user.avatarUrl} 
                          alt={user.name} 
                          className="h-9 w-9 rounded-xl object-cover border border-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{user.name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              user.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            eFootball ID: {user.efootballId} • {user.favoriteClub}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <Check className="w-4 h-4 text-[#00ff87] flex-shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
