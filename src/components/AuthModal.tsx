import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertCircle, 
  Check, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  Gamepad2, 
  LogIn, 
  UserPlus, 
  ChevronDown 
} from 'lucide-react';
import { UserProfile } from '../types/tournament';
import { auth, signInWithGoogle } from '../services/firebase';
import { ADMIN_EMAIL, ADMIN_PASSWORD, OFFICIAL_ADMIN_PROFILE } from '../services/mockData';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onRegister: (data: {
    name: string;
    email: string;
    efootballId: string;
    password?: string;
    phone?: string;
    role?: 'player' | 'admin';
  }) => void;
  onLogout?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  currentUser,
  allUsers,
  onSelectUser,
  onRegister,
  onLogout
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Registration fields
  const [playerName, setPlayerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [inGameName, setInGameName] = useState('');
  
  // Shared fields
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSavedAccounts, setShowSavedAccounts] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset errors and fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setPassword('');
      setEmailOrUsername(currentUser?.email || '');
      setPlayerName('');
      setPhoneNumber('');
      setInGameName('');
      setShowSavedAccounts(false);
      setShowPassword(false);
      if (initialMode) {
        setMode(initialMode);
      }
    }
  }, [isOpen, initialMode, currentUser]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const input = emailOrUsername.trim();

    if (!input) {
      setError('ইউজারনেম বা ইমেইল এড্রেস লিখুন।');
      return;
    }
    if (!password) {
      setError('পাসওয়ার্ড লিখুন।');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Admin login check
      const isAdminAttempt = 
        input.toLowerCase() === ADMIN_EMAIL.toLowerCase() || 
        input.toLowerCase() === 'admin' ||
        input.toLowerCase() === 'admin@efootball.bd';

      if (isAdminAttempt) {
        if (password !== ADMIN_PASSWORD) {
          setError('ভুল এডমিন পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।');
          setIsLoading(false);
          return;
        }

        // Background Firebase Auth
        if (auth) {
          try {
            await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
          } catch (_err) {}
        }

        localStorage.setItem('efootball_remembered_email', ADMIN_EMAIL);
        onSelectUser(OFFICIAL_ADMIN_PROFILE);
        onClose();
        return;
      }

      // 2. Normal Player Authentication (by email or username)
      const targetUser = allUsers.find(
        u => u.email.toLowerCase() === input.toLowerCase() || 
             u.name.toLowerCase() === input.toLowerCase() ||
             u.efootballId.toLowerCase() === input.toLowerCase()
      );

      const targetEmail = targetUser?.email || (input.includes('@') ? input : `${input.toLowerCase().replace(/\s+/g, '')}@efootball.player`);

      if (auth && input.includes('@')) {
        try {
          await signInWithEmailAndPassword(auth, targetEmail, password);
        } catch (authErr: any) {
          if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
            setError('ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
            setIsLoading(false);
            return;
          }
        }
      }

      // Remember email permanently
      localStorage.setItem('efootball_remembered_email', targetEmail);

      if (targetUser) {
        if (targetUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
          targetUser.role = 'player';
        }
        onSelectUser(targetUser);
        onClose();
      } else {
        // Create new session profile
        const generatedId = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        onRegister({
          name: input.split('@')[0],
          email: targetEmail,
          efootballId: generatedId,
          role: 'player'
        });
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = playerName.trim();
    const trimmedEmail = emailOrUsername.trim();
    const trimmedPhone = phoneNumber.trim();
    const generatedId = inGameName.trim() || `${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    if (!trimmedName) {
      setError('ইউজার নেম / নাম দেওয়া আবশ্যক।');
      return;
    }
    if (!trimmedEmail) {
      setError('একটি বৈধ ইমেইল এড্রেস লিখুন।');
      return;
    }
    if (trimmedEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setError('এই ইমেইলটি এডমিনের জন্য সংরক্ষিত। অনুগ্রহ করে লগইন ট্যাব ব্যবহার করুন।');
      return;
    }
    if (!password || password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Firebase Auth Registration
      if (auth) {
        try {
          await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/email-already-in-use') {
            setError('এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট তৈরি করা আছে। লগইন করুন।');
            setIsLoading(false);
            return;
          }
        }
      }

      localStorage.setItem('efootball_remembered_email', trimmedEmail);

      // 2. Tournament system registration
      onRegister({
        name: trimmedName,
        email: trimmedEmail,
        efootballId: generatedId,
        password: password,
        phone: trimmedPhone,
        role: 'player'
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuickAccount = (user: UserProfile) => {
    setEmailOrUsername(user.email);
    setShowSavedAccounts(false);
  };

  const fillAdminCredentials = () => {
    setEmailOrUsername(ADMIN_EMAIL);
    setPassword(ADMIN_PASSWORD);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-[390px] rounded-[28px] bg-white text-slate-800 shadow-2xl overflow-hidden border border-slate-200/80 my-auto animate-scaleUp">
        
        {/* Top Gradient Banner Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Shield Icon Badge */}
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-amber-300 shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wider uppercase text-white font-mono leading-tight">
                DREAM SQUAD BD
              </h2>
              <p className="text-xs text-blue-100 font-medium mt-0.5">
                {mode === 'login' ? 'লগইন পোর্টাল' : 'নতুন অ্যাকাউন্ট রেজিস্ট্রেশন'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: [->] লগইন | [👤+] রেজিস্ট্রেশন */}
        <div className="p-4 sm:p-5 pb-5">
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/70 mb-4">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-black rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 font-bold'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-black rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 font-bold'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>রেজিস্ট্রেশন</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              
              {/* Field 1: Username / Email with Saved Accounts */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    ইউজারনেম বা ইমেইল: <span className="text-rose-500">*</span>
                  </label>
                  
                  {allUsers.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSavedAccounts(prev => !prev)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>সেভড অ্যাকাউন্টস ({allUsers.length})</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {showSavedAccounts && (
                        <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-20 max-h-48 overflow-y-auto">
                          <button
                            type="button"
                            onClick={fillAdminCredentials}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center justify-between"
                          >
                            <span>👑 Master Admin</span>
                            <span className="text-[10px] text-amber-600">admin@efootball.bd</span>
                          </button>
                          <div className="h-px bg-slate-100 my-1" />
                          {allUsers.slice(0, 5).map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => handleSelectQuickAccount(u)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                            >
                              <span className="truncate">{u.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">৳{u.balance || 0}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="Mohammad Rifat"
                    required
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    পাসওয়ার্ড: <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('পাসওয়ার্ড রিসেটের জন্য এডমিনকে মেসেজ দিন (01621833825)')}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>

                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}</span>
              </button>

              {/* Admin Quick Login Pill Button */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="text-[11px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg px-2.5 py-1 transition"
                >
                  👑 এডমিন অটো-ফিল (admin@efootball.bd)
                </button>
              </div>

              {/* Switch to Register */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  অ্যাকাউন্ট নেই?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); }}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    নতুন অ্যাকাউন্ট খুলুন
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ================= REGISTER FORM ================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              
              {/* Field 1: User name / Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ১. ইউজার নেম / নাম: <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                    required
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Field 2: Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ২. ইমেইল এড্রেস: <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="যেমন: yourname@gmail.com"
                    required
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Field 3: Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ৩. মোবাইল নম্বর: <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="017XXXXXXXX"
                    required
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Field 4: Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ৪. পাসওয়ার্ড: <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড লিখুন"
                    required
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-10 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Field 5: IGN Game Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    ৫. গেমের নাম (IGN):
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">(ঐচ্ছিক)</span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={inGameName}
                    onChange={(e) => setInGameName(e.target.value)}
                    placeholder="যেমন: MasterGamer (না দিলেও চলবে)"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Register Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isLoading ? 'তৈরি করা হচ্ছে...' : 'রেজিস্ট্রেশন সম্পন্ন করুন'}</span>
              </button>

              {/* Switch to Login */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    লগইন করুন
                  </button>
                </p>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
