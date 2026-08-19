import React, { useState } from 'react';

interface SyncSetupCardProps {
  onConfirm: (email: string, phone: string) => void;
  currentEmail?: string;
  currentPhone?: string;
  isInline?: boolean; // true = settings panel, false = first-time overlay
  isDarkMode?: boolean;
}

export const SyncSetupCard: React.FC<SyncSetupCardProps> = ({
  onConfirm,
  currentEmail = '',
  currentPhone = '',
  isInline = false,
  isDarkMode = false,
}) => {
  const [email, setEmail] = useState(currentEmail);
  const [phone, setPhone] = useState(currentPhone);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim() && !phone.trim()) {
      return 'Please enter at least your Gmail address or Contact number.';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid Gmail / email address.';
    }
    if (phone.trim() && !/^\+?[0-9\s-]{8,15}$/.test(phone.trim())) {
      return 'Please enter a valid Contact number.';
    }
    return '';
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    onConfirm(email.trim().toLowerCase(), phone.trim());
  };

  const card = (
    <div className={`rounded-3xl p-7 sm:p-8 max-w-md w-full shadow-2xl border transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-[#101428] via-[#161e38] to-[#0c2040] border-indigo-500/40 text-white shadow-black/60' 
        : 'bg-white border-indigo-100 text-slate-900 shadow-slate-900/10'
    }`}>
      {/* Icon */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 inline-flex items-center justify-center text-3xl mb-3.5 shadow-lg shadow-indigo-500/30 text-white">
          🔗
        </div>
        <h2 className={`text-xl font-extrabold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Connect Unified Account
        </h2>
        <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
          Enter your Gmail and Contact number to link your account. Your habits will sync instantly across laptop and mobile.
        </p>
      </div>

      <div className="space-y-3.5 mb-4">
        {/* Email Field */}
        <div>
          <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
            isDarkMode ? 'text-white/50' : 'text-slate-500'
          }`}>
            ✉️ Gmail Address
          </label>
          <input
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors border focus:border-indigo-500 ${
              isDarkMode 
                ? 'bg-white/5 border-indigo-500/30 text-white placeholder-slate-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Phone Field */}
        <div>
          <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
            isDarkMode ? 'text-white/50' : 'text-slate-500'
          }`}>
            📱 Contact Number
          </label>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(''); }}
            className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors border focus:border-indigo-500 ${
              isDarkMode 
                ? 'bg-white/5 border-indigo-500/30 text-white placeholder-slate-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {error && (
        <div className={`rounded-xl p-3 text-xs mb-4 border ${
          isDarkMode 
            ? 'bg-red-500/15 border-red-500/30 text-red-400' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          ⚠️ {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-bold tracking-wide shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all cursor-pointer"
      >
        {currentEmail || currentPhone ? 'Update Linked Account' : 'Connect & Sync Account →'}
      </button>

      {(currentEmail || currentPhone) && (
        <div className={`mt-3.5 text-center text-xs space-y-0.5 ${
          isDarkMode ? 'text-white/45' : 'text-slate-500'
        }`}>
          {currentEmail && <div>Linked Gmail: <span className="text-indigo-500 font-semibold">{currentEmail}</span></div>}
          {currentPhone && <div>Linked Phone: <span className="text-indigo-500 font-semibold">{currentPhone}</span></div>}
        </div>
      )}
    </div>
  );

  if (isInline) return card;

  // Full-screen overlay for first-time setup
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-5 backdrop-blur-md animate-fade-in ${
      isDarkMode ? 'bg-black/85' : 'bg-slate-900/50'
    }`}>
      {card}
    </div>
  );
};
