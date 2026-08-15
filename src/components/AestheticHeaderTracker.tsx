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
    <header className={`w-full rounded-3xl p-6 transition-all duration-300 border ${
      isDarkMode 
        ? 'bg-[#0f1422]/95 border-slate-800/80 text-white shadow-2xl backdrop-blur-md' 
        : 'bg-[#FCFBF8] border-[#E8E3D9] text-slate-900 shadow-sm'
    }`}>
      {/* Top Main Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
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

        {/* Center Section: Smooth Mountain Continuous Progress Curve Chart */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full h-28 sm:h-32 relative rounded-2xl overflow-hidden bg-gradient-to-b from-blue-50/60 to-indigo-50/20 dark:from-blue-950/20 dark:to-slate-900/40 border border-blue-100/90 dark:border-blue-900/40 p-2.5 shadow-inner">
            <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="waveFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.15" />
                </linearGradient>
                <linearGradient id="waveStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="40%" stopColor="#818cf8" />
                  <stop offset="70%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              
              {/* Smooth mountain wave fill */}
              <path
                d="M 0,120 L 0,35 Q 35,10 70,30 T 140,45 T 210,15 T 280,25 T 350,10 T 420,20 Q 460,40 500,120 Z"
                fill="url(#waveFillGrad)"
              />
              
              {/* Mountain ridge stroke line */}
              <path
                d="M 0,35 Q 35,10 70,30 T 140,45 T 210,15 T 280,25 T 350,10 T 420,20 Q 460,40 500,120"
                fill="none"
                stroke="url(#waveStrokeGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              
              {/* Peak interactive markers */}
              <circle
                cx="70" cy="30" r="4.5"
                className="fill-blue-500 hover:fill-blue-400 hover:r-6 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredWavePoint({ x: 70, y: 30, label: 'Week 1 Peak', value: '78.5%' })}
                onMouseLeave={() => setHoveredWavePoint(null)}
              />
              <circle
                cx="210" cy="15" r="5"
                className="fill-indigo-500 hover:fill-indigo-400 hover:r-6 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredWavePoint({ x: 210, y: 15, label: 'Mid-Month Peak', value: '92.0%' })}
                onMouseLeave={() => setHoveredWavePoint(null)}
              />
              <circle
                cx="350" cy="10" r="5.5"
                className="fill-purple-500 hover:fill-purple-400 hover:r-6 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredWavePoint({ x: 350, y: 10, label: 'Monthly High', value: '95.4%' })}
                onMouseLeave={() => setHoveredWavePoint(null)}
              />
            </svg>

            {/* Hover Tooltip on curve */}
            {hoveredWavePoint && (
              <div
                className="absolute px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[10px] font-bold border border-slate-700 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
                style={{ left: `${(hoveredWavePoint.x / 500) * 100}%`, top: `${(hoveredWavePoint.y / 120) * 100}%` }}
              >
                {hoveredWavePoint.label}: {hoveredWavePoint.value}
              </div>
            )}

            <div className="absolute bottom-2 right-3 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-500" />
              Continuous Consistency Curve • {selectedMonth}
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-purple-500/20 text-slate-700 dark:text-slate-200 font-semibold transition-all border border-slate-200/60 dark:border-slate-700/60 cursor-pointer shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 text-purple-500" />
            <span>Today's Activity</span>
          </button>

          <button
            onClick={onOpenEfficiencyMatrix}
            title="Open Efficiency Day/Month/Year Matrix"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-200 font-semibold transition-all border border-slate-200/60 dark:border-slate-700/60 cursor-pointer shadow-2xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Efficiency Matrix</span>
          </button>

          <button
            onClick={onOpenSimulator}
            title="Widget Simulator"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-cyan-500/20 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200/60 dark:border-slate-700/60 cursor-pointer shadow-2xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenSync}
            title="Live Sync"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-blue-500/20 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200/60 dark:border-slate-700/60 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <button
            onClick={onToggleSound}
            title="Toggle Sound Effects"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200/60 dark:border-slate-700/60 cursor-pointer shadow-2xs"
          >
            {user.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            onClick={onToggleTheme}
            title="Toggle Dark / Editorial Paper Mode"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200/60 dark:border-slate-700/60 cursor-pointer shadow-2xs"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
          </button>

          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              title="Switch Accounts & Profiles"
              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors border border-purple-200 cursor-pointer shadow-2xs"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200/60 dark:border-slate-700/60 cursor-pointer shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
