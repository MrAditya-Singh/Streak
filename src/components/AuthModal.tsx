import React, { useState, useEffect } from 'react';
import { 
  X, 
  User as UserIcon, 
  Shield, 
  Plus, 
  Check, 
  Sparkles, 
  Flame, 
  ArrowRight,
  RefreshCw,
  LogOut,
  Users,
  Lock,
  Mail,
  KeyRound
} from 'lucide-react';
import { UserProfile } from '../types';
import { soundFx } from '../utils/audio';
import { signInWithGoogle, signInWithEmail, registerWithEmail, logOutUser } from '../services/firebaseAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: Partial<UserProfile>) => void;
}

interface ProfileRecord {
  id: string;
  name: string;
  email: string;
  hunterRank: string;
  level: number;
  avatar: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
}) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'google' | 'email'>('profiles');
  const [profiles, setProfiles] = useState<ProfileRecord[]>([
    {
      id: 'local_user_1',
      name: 'Aditya (Solo Hunter)',
      email: 'aditya@streak.local',
      hunterRank: 'A',
      level: 18,
      avatar: '/images/char_hero.jpg',
    },
    {
      id: 'student_mode',
      name: 'Academic & GATE Prep',
      email: 'study@streak.local',
      hunterRank: 'B',
      level: 12,
      avatar: '/images/char_leetcode.jpg',
    },
  ]);

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Fetch available profiles from backend
  useEffect(() => {
    if (!isOpen) return;
    fetch('http://localhost:5000/api/auth/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users && Array.isArray(data.users)) {
          setProfiles(data.users);
        }
      })
      .catch(() => {
        // local fallback
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwitchProfile = (p: ProfileRecord) => {
    soundFx.playLevelUp();
    onSelectUser({
      name: p.name,
      level: p.level,
      hunterRank: p.hunterRank as any,
    });
    setToast(`✓ Switched active profile to ${p.name}!`);
    setTimeout(() => {
      setToast(null);
      onClose();
    }, 1200);
  };

  // Google OAuth Popup Trigger
  const handleGoogleSignIn = async () => {
    soundFx.playClick();
    setIsAuthLoading(true);
    try {
      const { user } = await signInWithGoogle();
      if (user) {
        soundFx.playLevelUp();
        const googleProfile: ProfileRecord = {
          id: user.uid,
          name: user.displayName || 'Google Hunter',
          email: user.email || 'user@gmail.com',
          hunterRank: 'S',
          level: 25,
          avatar: user.photoURL || '/images/char_hero.jpg',
        };

        setProfiles((prev) => [googleProfile, ...prev.filter((p) => p.id !== user.uid)]);
        handleSwitchProfile(googleProfile);
        setToast(`⚡ Signed in with Google as ${googleProfile.name}!`);
      }
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Email Sign In / Register
  const handleEmailAuth = async (isRegister: boolean) => {
    if (!emailInput.trim() || !passwordInput.trim()) return;
    soundFx.playClick();
    setIsAuthLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await registerWithEmail(emailInput.trim(), passwordInput.trim());
      } else {
        res = await signInWithEmail(emailInput.trim(), passwordInput.trim());
      }

      if (res.user) {
        soundFx.playLevelUp();
        const emailProfile: ProfileRecord = {
          id: res.user.uid,
          name: res.user.displayName || emailInput.split('@')[0],
          email: res.user.email || emailInput,
          hunterRank: 'A',
          level: 18,
          avatar: '/images/char_hero.jpg',
        };
        setProfiles((prev) => [emailProfile, ...prev.filter((p) => p.id !== res.user!.uid)]);
        handleSwitchProfile(emailProfile);
      }
    } catch (err: any) {
      // Offline fallback simulation
      const emailProfile: ProfileRecord = {
        id: `email_${Date.now()}`,
        name: emailInput.split('@')[0],
        email: emailInput,
        hunterRank: 'B',
        level: 14,
        avatar: '/images/char_leetcode.jpg',
      };
      setProfiles((prev) => [emailProfile, ...prev]);
      handleSwitchProfile(emailProfile);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    soundFx.playCheck();
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfiles((prev) => [...prev, data.user]);
        handleSwitchProfile(data.user);
        setIsCreatingNew(false);
        setNewName('');
        setNewEmail('');
      }
    } catch {
      const localNew: ProfileRecord = {
        id: `user_${Date.now()}`,
        name: newName.trim(),
        email: newEmail.trim() || 'user@streak.local',
        hunterRank: 'E',
        level: 1,
        avatar: '/images/char_hero.jpg',
      };
      setProfiles((prev) => [...prev, localNew]);
      handleSwitchProfile(localNew);
      setIsCreatingNew(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0f172a]">Authentication & Accounts</h2>
              <p className="text-xs text-slate-500">Google OAuth, Email Login, or 1-Click Profile Switcher</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Tabs */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === 'profiles' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Quick Switch
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === 'google' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Google Sign-In
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === 'email' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Email Login
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Toast */}
          {toast && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toast}</span>
            </div>
          )}

          {/* Current Active Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-purple-200 overflow-hidden p-0.5 shadow-xs">
                <img src="/images/char_hero.jpg" alt="Avatar" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-[#0f172a]">{currentUser.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-200 text-purple-900">
                    {currentUser.hunterRank}-Rank
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5 font-semibold">
                  <span>Level {currentUser.level}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-orange-600">
                    <Flame className="w-3.5 h-3.5" /> {currentUser.overallStreak}d Streak
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-xl">
              Active
            </span>
          </div>

          {/* 1. TAB: GOOGLE SIGN-IN */}
          {activeTab === 'google' && (
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 mx-auto flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900">Sign In with Google</h3>
                <p className="text-xs text-slate-500 mt-1">Authenticate via official Firebase Google OAuth popup and sync your Hunter profile to the cloud.</p>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-2xl border border-slate-300 shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isAuthLoading ? 'Opening Popup...' : 'Continue with Google Account'}</span>
              </button>
            </div>
          )}

          {/* 2. TAB: EMAIL AUTH */}
          {activeTab === 'email' && (
            <div className="space-y-3 p-4 rounded-3xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black uppercase text-slate-700">Email & Password Sign In</span>
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleEmailAuth(false)}
                  disabled={isAuthLoading || !emailInput}
                  className="py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => handleEmailAuth(true)}
                  disabled={isAuthLoading || !emailInput}
                  className="py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Register
                </button>
              </div>
            </div>
          )}

          {/* 3. TAB: QUICK PROFILES SWITCHER */}
          {activeTab === 'profiles' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Profiles ({profiles.length})
                </h3>
                <button
                  onClick={() => setIsCreatingNew(!isCreatingNew)}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                >
                  {isCreatingNew ? 'Cancel' : <><Plus className="w-3.5 h-3.5" /> Add Profile</>}
                </button>
              </div>

              {isCreatingNew && (
                <form onSubmit={handleCreateProfile} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-black uppercase text-slate-700">Create New Account</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Profile Name (e.g. Work Mode)"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="px-3 py-2 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="px-3 py-2 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Create & Switch
                  </button>
                </form>
              )}

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {profiles.map((p) => {
                  const isActive = currentUser.name.toLowerCase().includes(p.name.toLowerCase()) || p.id === 'local_user_1';
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSwitchProfile(p)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
                        isActive
                          ? 'bg-purple-50/70 border-purple-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-700">
                          {p.avatar ? <img src={p.avatar} alt="Avatar" className="w-full h-full object-cover" /> : p.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0f172a]">{p.name}</div>
                          <div className="text-[11px] text-slate-500">Level {p.level} • {p.hunterRank}-Rank</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-purple-700 flex items-center gap-1 hover:underline">
                            Switch <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
