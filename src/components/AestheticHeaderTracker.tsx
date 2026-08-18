import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Sparkles, Smartphone, Settings, RefreshCw, Flame, Volume2, VolumeX, Sun, Moon, Zap, ShieldAlert, BarChart3, TrendingUp, Calendar, CheckCircle2, Users, Clock } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface AestheticHeaderTrackerProps {
  user: UserProfile;
  selectedMonth: string;
  selectedYear: number;
  onMonthChange: (month: string) => void;
  dailyProgressPct: number;
  completedMonthHabits: number;
  totalMonthHabits: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSoloLeveling: () => void;
  onOpenTodayActivity: () => void;
  onOpenEfficiencyMatrix: () => void;
  onOpenEmergencyWork: () => void;
  onOpenSimulator: () => void;
  onOpenSync: () => void;
  onOpenSettings: () => void;
  onOpenAuth?: () => void;
  onToggleSound: () => void;
  isSyncing?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AestheticHeaderTracker: React.FC<AestheticHeaderTrackerProps> = ({
  user,
  selectedMonth,
  selectedYear,
  onMonthChange,
  dailyProgressPct,
  completedMonthHabits,
  totalMonthHabits,
  isDarkMode,
  onToggleTheme,
  onOpenSoloLeveling,
  onOpenTodayActivity,
  onOpenEfficiencyMatrix,
  onOpenEmergencyWork,
  onOpenSimulator,
  onOpenSync,
  onOpenSettings,
  onOpenAuth,
  onToggleSound,
  isSyncing = false,
}) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, dailyProgressPct)) / 100) * circumference;

  const [hoveredWavePoint, setHoveredWavePoint] = useState<{ x: number; y: number; label: string; value: string } | null>(null);

  const [currentRealTime, setCurrentRealTime] = React.useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const [currentRealDate, setCurrentRealDate] = React.useState<string>(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentRealTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentRealDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-300 border ${
      isDarkMode 
        ? 'bg-[#0f1422]/95 border-slate-800/80 text-white shadow-2xl backdrop-blur-md' 
        : 'bg-[#FCFBF8] border-[#E8E3D9] text-slate-900 shadow-sm'
    }`}>
      {/* Top Main Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
        
        {/* Left Section: Serif Calligraphic Title & Period Badges */}
        <div className="lg:col-span-3 space-y-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400 dark:text-slate-400">
                HABIT TRACKER
              </span>
            </div>
            <h1 className={`text-4xl sm:text-5xl font-serif-title tracking-tight italic font-bold mt-1 ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {selectedMonth}
            </h1>
          </div>

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#FEF3C7] dark:bg-[#78350F]/30 border border-[#FDE68A] dark:border-amber-600/30 rounded-xl overflow-hidden text-xs shadow-2xs">
              <span className="px-3 py-1 font-bold text-[#92400E] dark:text-amber-200 uppercase text-[9px] tracking-wider border-r border-[#FDE68A] dark:border-amber-600/30">
                MONTH
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-transparent px-3 py-1 text-xs font-bold text-[#92400E] dark:text-amber-200 outline-none cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-[#FEF3C7] dark:bg-[#78350F]/30 border border-[#FDE68A] dark:border-amber-600/30 rounded-xl overflow-hidden text-xs shadow-2xs">
              <span className="px-3 py-1 font-bold text-[#92400E] dark:text-amber-200 uppercase text-[9px] tracking-wider border-r border-[#FDE68A] dark:border-amber-600/30">
                YEAR
              </span>
              <span className="px-3 py-1 font-bold text-[#92400E] dark:text-amber-200 font-mono">
                {selectedYear}
              </span>
            </div>
          </div>

          {/* Real-time Dynamic Live Clock Badge */}
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs w-fit">
            <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
            <span>{currentRealDate} • {currentRealTime}</span>
          </div>
        </div>

        {/* Center Section: Premium Visual Aesthetic Showcase Banner (Expanded & Enhanced) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full h-40 sm:h-44 md:h-48 relative rounded-3xl overflow-hidden border-2 border-purple-400/30 dark:border-purple-500/40 shadow-xl shadow-purple-500/10 dark:shadow-[0_0_30px_rgba(168,85,247,0.2)] group transition-all duration-500 hover:shadow-purple-500/25">
            
            {/* Top Ambient Glow Edge */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent z-10 opacity-75" />

            <img
              src="/images/header_aesthetic.png"
              alt="Visual Aesthetic Banner"
              className="w-full h-full object-cover object-[center_30%] group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            
            {/* Cinematic Gradient Vignette Overlay for Crisp Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-950/20 via-transparent to-pink-950/20 pointer-events-none" />
            
            {/* Top Left Squad Badge */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-md">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-200">Hunter Squad</span>
            </div>

            {/* Bottom Right Floating Badge */}
            <div className="absolute bottom-3 right-3 z-10 text-[11px] font-mono font-bold text-white drop-shadow-lg flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/20 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-pink-300 animate-pulse" />
              <span>Effective Streak • {selectedMonth}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Luxury Daily Progress & Circular Progress Counter */}
        <div className="lg:col-span-3 flex items-center justify-between sm:justify-end gap-6 bg-slate-50/90 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
          <div className="text-right">
            <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              DAILY PROGRESS
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
              {dailyProgressPct.toFixed(2)}%
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Target: ≥85%
            </div>
          </div>

          {/* Pink/Rose Circular Ring for Habits Count */}
          <div className="relative w-22 h-22 flex items-center justify-center flex-shrink-0">
            <svg className="w-22 h-22 transform -rotate-90">
              <circle
                cx="44"
                cy="44"
                r={radius}
                className="stroke-pink-100 dark:stroke-pink-950/40"
                strokeWidth="6.5"
                fill="transparent"
              />
              <circle
                cx="44"
                cy="44"
                r={radius}
                stroke="#f472b6"
                strokeWidth="6.5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ filter: 'drop-shadow(0 0 6px rgba(244, 114, 182, 0.45))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">HABITS</span>
              <span className="text-xs font-black text-slate-900 dark:text-white leading-none mt-0.5 font-mono">
                {completedMonthHabits}/{totalMonthHabits}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Access Toolbar for Modals & Solo Leveling Stats */}
      <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left badges: Hunter Rank & Overall Streak */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenSoloLeveling();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold hover:scale-105 transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span>Lv. {user.level} {user.hunterRank}-Rank Hunter</span>
          </button>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-700 dark:text-orange-400 font-bold shadow-xs">
            <Flame className="w-3.5 h-3.5 animate-flame" />
            <span>{user.overallStreak} Day Streak</span>
          </div>

          <button
            onClick={onOpenEmergencyWork}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-500/25 transition-all shadow-xs cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Emergency Directives</span>
          </button>
        </div>

        {/* Right Tools: Today Timestamps, Efficiency Matrix, Sync, Simulator, Settings, Theme */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenTodayActivity}
            title="Inspect Today's Timestamps"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-bold transition-all border border-slate-200 dark:border-slate-700/60 cursor-pointer shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            <span>Today's Activity</span>
          </button>

          <button
            onClick={onOpenEfficiencyMatrix}
            title="Open Efficiency Day/Month/Year Matrix"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-bold transition-all border border-slate-200 dark:border-slate-700/60 cursor-pointer shadow-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Efficiency Matrix</span>
          </button>

          <button
            onClick={onOpenSimulator}
            title="Widget Simulator"
            className="p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer shadow-xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenSync}
            title="Live Sync"
            className="p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          <button
            onClick={onToggleSound}
            title="Toggle Sound Effects"
            className="p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer shadow-xs"
          >
            {user.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            onClick={onToggleTheme}
            title="Toggle Dark / Editorial Paper Mode"
            className="p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer shadow-xs"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
          </button>

          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              title="Switch Accounts & Profiles"
              className="p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 text-purple-700 dark:text-purple-300 transition-colors border border-purple-200 dark:border-slate-700/60 cursor-pointer shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-purple-600" />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer shadow-xs"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
