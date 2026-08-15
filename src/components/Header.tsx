import React, { useState, useEffect } from 'react';
import { Flame, Bell, Settings, Smartphone, Monitor, Sparkles, RefreshCw, Volume2, VolumeX, TrendingUp, Calendar, Sun, Moon } from 'lucide-react';
import { UserProfile } from '../types';
import { soundFx } from '../utils/audio';

interface HeaderProps {
  user: UserProfile;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSimulator: () => void;
  onOpenSync: () => void;
  onOpenSoloLeveling: () => void;
  onOpenAnalytics: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isDarkMode,
  onToggleTheme,
  onOpenSimulator,
  onOpenSync,
  onOpenSoloLeveling,
  onOpenAnalytics,
  onOpenHistory,
  onOpenSettings,
  onToggleSound,
  isSyncing = false,
}) => {
  const [greeting, setGreeting] = useState<string>('Good day');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17 && hour < 22) setGreeting('Good evening');
    else setGreeting('Good night');
  }, []);

  return (
    <header className={`w-full max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b backdrop-blur-md sticky top-0 z-40 transition-colors ${
      isDarkMode 
        ? 'border-white/5 bg-black/80 text-white' 
        : 'border-slate-200 bg-white/85 text-slate-800 shadow-sm'
    }`}>
      {/* Left: Brand Logo & User Greeting */}
      <div className="flex items-center gap-3.5">
        <div className="relative group cursor-pointer" onClick={onOpenSoloLeveling}>
          <div className="w-11 h-11 rounded-2xl bg-black/80 border border-blue-500/40 p-0.5 overflow-hidden shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <img src="/app-icon.png" alt="EffStreak" className="w-full h-full object-contain" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black" title="Live Synced" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-lg tracking-tight flex items-center">
              <span className="text-white">Streak</span>
            </h1>
            <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              #SoloLeveling
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <img 
              src="/images/char_hero.jpg" 
              alt={user.name} 
              className="w-4 h-4 rounded-full object-cover border border-purple-400/60" 
            />
            <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {greeting}, <span className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{user.name}</span>! 🌙
            </p>
          </div>
        </div>
      </div>

      {/* Center Live Stats & Quick Launchers */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        {/* Hunter Rank Quick Badge */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenSoloLeveling();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all shadow-sm ${
            isDarkMode 
              ? 'bg-purple-950/60 border-purple-500/30 text-purple-200 hover:border-purple-400/60' 
              : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-bold">Rank {user.hunterRank}</span>
          <span className="opacity-40">|</span>
          <span className="text-xs font-semibold">Lv. {user.level}</span>
        </button>

        {/* Analytics Modal Trigger */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenAnalytics();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            isDarkMode 
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200' 
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
          }`}
          title="Productivity Analytics"
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline font-medium">Analytics</span>
        </button>

        {/* History Modal Trigger */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenHistory();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            isDarkMode 
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200' 
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
          }`}
          title="Past Activity History"
        >
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline font-medium">History</span>
        </button>

        {/* Live Sync Trigger */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenSync();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            isDarkMode 
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200' 
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
          } ${isSyncing ? 'border-duoGreen/50 text-duoGreen' : ''}`}
          title="Live Sync GitHub, Codeforces, LeetCode"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-duoGreen' : 'text-slate-400'}`} />
          <span className="hidden sm:inline font-medium">Sync Center</span>
        </button>

        {/* Small Widget Simulator Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenSimulator();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-duoGreen/15 hover:bg-duoGreen/25 border border-duoGreen/40 text-duoGreenLight font-bold transition-all shadow-sm"
        >
          <div className="flex items-center gap-0.5">
            <Smartphone className="w-3.5 h-3.5" />
            <Monitor className="w-3.5 h-3.5" />
          </div>
          <span>Widget Simulator</span>
        </button>
      </div>

      {/* Right Controls: Theme Switcher, Sound, Notifications, Settings */}
      <div className="flex items-center gap-2">
        {/* 1-Tap Theme Switcher ☀️ / 🌙 */}
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-xl border transition-all ${
            isDarkMode 
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-400 hover:text-amber-300' 
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-indigo-600'
          }`}
          title={isDarkMode ? 'Switch to Light Mode ☀️' : 'Switch to AMOLED Dark Mode 🌙'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl border transition-all ${
            isDarkMode 
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300' 
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
          }`}
          title={user.soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
        >
          {user.soundEnabled ? <Volume2 className="w-4 h-4 text-duoGreen" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => {
            soundFx.playCheck();
            alert(`🔥 Notification Reminder:\nYour ${user.overallStreak}-Day streak is protected today!`);
          }}
          className={`p-2 rounded-xl border transition-all relative ${
            isDarkMode 
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300' 
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
          }`}
          title="Streak Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </button>

        {/* Settings */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenSettings();
          }}
          className={`p-2 rounded-xl border transition-all ${
            isDarkMode 
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300' 
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
          }`}
          title="App Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
