import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Mail, 
  Globe,
  LogOut,
  Key
} from 'lucide-react';
import { UserProfile } from '../types';
import { soundFx } from '../utils/audio';
import { signInWithGoogle, signInWithEmail, registerWithEmail, logOutUser } from '../services/firebaseAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: Partial<UserProfile>) => void;
  onLogout?: () => void;
  isDarkMode?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onLogout,
  isDarkMode = false,
}) => {
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Google OAuth Sign-In & Firebase UID identity
  const handleGoogleSignIn = async () => {
    soundFx.playClick();
    setIsAuthLoading(true);
    try {
      const { user } = await signInWithGoogle();
      if (user && user.uid) {
        soundFx.playLevelUp();
        const googleProfile: Partial<UserProfile> = {
          uid: user.uid,
          name: user.displayName || 'Google Verified User',
          email: user.email || undefined,
          avatarUrl: user.photoURL || '/images/char_hero.jpg',
        };
        onSelectUser(googleProfile);
        showNotification(`⚡ Signed in via Firebase Google Auth! UID: ${user.uid.substring(0, 10)}...`);
        setTimeout(onClose, 1200);
      }
    } catch (err: any) {
      showNotification(`❌ Sign-in failed: ${err.message || 'Google Auth error'}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Email / Password Authentication
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      showNotification('Please enter both email and password.');
      return;
    }
    soundFx.playClick();
    setIsAuthLoading(true);
    try {
      const result = isRegisterMode
        ? await registerWithEmail(emailInput, passwordInput)
        : await signInWithEmail(emailInput, passwordInput);

      if (result.user && result.user.uid) {
        soundFx.playLevelUp();
        onSelectUser({
          uid: result.user.uid,
          name: result.user.displayName || emailInput.split('@')[0],
          email: result.user.email || emailInput,
        });
        showNotification(`⚡ ${isRegisterMode ? 'Account created' : 'Logged in'}! UID: ${result.user.uid.substring(0, 10)}...`);
        setTimeout(onClose, 1200);
      }
    } catch (err: any) {
      showNotification(`❌ Auth Error: ${err.message}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOutClick = async () => {
    soundFx.playClick();
    try {
      await logOutUser();
      if (onLogout) onLogout();
      showNotification('Logged out successfully.');
      setTimeout(onClose, 800);
    } catch (err: any) {
      showNotification(`Sign out failed: ${err.message}`);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
      isDarkMode ? 'bg-black/80 backdrop-blur-md' : 'bg-slate-900/50 backdrop-blur-md'
    }`}>
      <div className={`rounded-3xl w-full max-w-md shadow-2xl border overflow-hidden flex flex-col animate-fade-in transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#121622] text-white border-white/10 shadow-purple-950/20' 
          : 'bg-white text-slate-900 border-slate-200 shadow-2xl shadow-slate-900/10'
      }`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between transition-colors ${
          isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Firebase Authentication
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                Secure Multi-Device UID Account Isolation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white' 
                : 'bg-slate-200/70 hover:bg-slate-300/70 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {toast && (
            <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
              toast.includes('❌')
                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                : isDarkMode 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
            }`}>
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{toast}</span>
            </div>
          )}

          {/* Currently Authenticated User Card */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-md transition-all ${
            isDarkMode 
              ? 'bg-gradient-to-r from-blue-950/50 via-indigo-950/50 to-purple-950/50 border-blue-500/30' 
              : 'bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 border-blue-200/80 shadow-sm'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-blue-400 overflow-hidden p-0.5 shadow-md flex items-center justify-center shrink-0">
                <img src={currentUser.avatarUrl || '/images/char_hero.jpg'} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black truncate max-w-[140px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {currentUser.name || 'Authenticated User'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${
                    isDarkMode 
                      ? 'bg-purple-500/20 text-purple-300' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {currentUser.hunterRank || 'E'}-Rank
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  UID: {currentUser.uid || 'Anonymous'}
                </div>
              </div>
            </div>

            {currentUser.uid && (
              <button
                onClick={handleSignOutClick}
                title="Sign Out"
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>

          {/* Primary Google Auth Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthLoading}
            className={`w-full py-3 px-4 text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99] ${
              isDarkMode 
                ? 'bg-white hover:bg-slate-100 text-slate-900' 
                : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300/80 shadow-sm hover:shadow-md'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isAuthLoading ? 'Authenticating with Google...' : 'Sign In with Google Account'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className={`flex-1 h-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">or Email Auth</span>
            <div className={`flex-1 h-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
          </div>

          {/* Email / Password Sign In / Registration Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="relative">
              <Mail className={`w-4 h-4 absolute left-3 top-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter email address"
                required
                className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs font-mono transition-all focus:outline-none ${
                  isDarkMode 
                    ? 'bg-slate-900 border border-slate-700 text-white focus:border-blue-500' 
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold'
                }`}
              />
            </div>

            <div className="relative">
              <Key className={`w-4 h-4 absolute left-3 top-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password (min 6 chars)"
                required
                className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs font-mono transition-all focus:outline-none ${
                  isDarkMode 
                    ? 'bg-slate-900 border border-slate-700 text-white focus:border-blue-500' 
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isAuthLoading ? 'Processing...' : isRegisterMode ? 'Create Firebase Account' : 'Sign In with Email'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-[11px] font-bold text-blue-500 hover:underline cursor-pointer"
              >
                {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Register"}
              </button>
            </div>
          </form>

          {/* Security Banner */}
          <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2.5 transition-colors ${
            isDarkMode 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
              : 'bg-emerald-50/90 border-emerald-200 text-emerald-900 shadow-2xs font-medium'
          }`}>
            <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Cloud Source of Truth: <strong>Firestore `users/&#123;uid&#125;`</strong></span>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-end transition-colors ${
          isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
            }`}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
