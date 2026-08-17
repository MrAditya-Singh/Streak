import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Settings, 
  ShieldCheck, 
  RefreshCw, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Sun, 
  Moon, 
  Award, 
  Check,
  ChevronRight,
  Code2,
  Trophy,
  Zap,
  LayoutGrid,
  Activity as ActivityIcon
} from 'lucide-react';
import { UserProfile, ActivityItem, HistoricalDayRecord, ActivityLogEntry, DailySummary } from '../types';
import { soundFx } from '../utils/audio';

interface MobileAppViewProps {
  user: UserProfile;
  activities: ActivityItem[];
  matrixState: Record<string, boolean[]>;
  history: HistoricalDayRecord[];
  logs: ActivityLogEntry[];
  summary: any;
  isDarkMode: boolean;
  onToggleMatrixCell: (activityId: string, dayIndex: number) => void;
  onToggleActivity: (activityId: string) => void;
  onAddHabit: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenSoloLeveling: () => void;
  onOpenEfficiency: () => void;
  onToggleTheme: () => void;
  onSyncActivities?: (updates?: any) => void;
  todayDayNumber: number;
  daysInMonth: number;
  selectedMonth: string;
}

export const MobileAppView: React.FC<MobileAppViewProps> = ({
  user,
  activities,
  matrixState,
  logs,
  summary,
  isDarkMode,
  onToggleMatrixCell,
  onToggleActivity,
  onAddHabit,
  onOpenSettings,
  onOpenAuth,
  onOpenSoloLeveling,
  onOpenEfficiency,
  onToggleTheme,
  onSyncActivities,
  todayDayNumber,
  daysInMonth,
  selectedMonth,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'matrix' | 'platforms' | 'stats'>('today');
  const [selectedDay, setSelectedDay] = useState<number>(todayDayNumber);
  const [isSyncing, setIsSyncing] = useState(false);

  const completedTodayCount = activities.filter((a) => a.completed).length;
  const progressPct = activities.length > 0 ? Math.round((completedTodayCount / activities.length) * 100) : 0;

  const handleSyncClick = async () => {
    soundFx.playClick();
    setIsSyncing(true);
    if (onSyncActivities) {
      await onSyncActivities();
    }
    setTimeout(() => {
      setIsSyncing(false);
      soundFx.playLevelUp();
    }, 800);
  };

  return (
    <div className={`md:hidden min-h-screen pb-28 transition-colors duration-300 font-sans ${
      isDarkMode ? 'bg-[#0B0F17] text-white' : 'bg-[#F8F9FC] text-slate-900'
    }`}>
      
      {/* ======================================================== */}
      {/* 📱 1. ULTRA-COMPACT MOBILE HERO TOP HEADER              */}
      {/* ======================================================== */}
      <header className={`sticky top-0 z-40 px-4 py-3 border-b backdrop-blur-xl transition-colors ${
        isDarkMode ? 'bg-[#0B0F17]/90 border-white/10' : 'bg-white/90 border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center justify-between gap-3">
          
          {/* Avatar & Hunter Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenSoloLeveling();
              }}
              className="relative cursor-pointer group shrink-0"
            >
              <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-purple-500 shadow-md p-0.5 bg-gradient-to-tr from-purple-600 to-indigo-600">
                <img src="/images/char_hero.jpg" alt="Avatar" className="w-full h-full object-cover rounded-xl" />
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-purple-600 text-white text-[9px] font-black tracking-wider uppercase border border-white shadow-xs">
                {user.hunterRank || 'S'}
              </span>
            </button>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {user.name || 'Aditya'}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  Lv.{user.level}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs mt-0.5">
                <span className="flex items-center gap-1 text-orange-500 font-extrabold">
                  <Flame className="w-3.5 h-3.5 fill-orange-500 animate-pulse" />
                  <span>{summary.overallStreakDays} Days Streak</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sync Button */}
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10 text-slate-300 active:bg-white/10' 
                  : 'bg-white border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50'
              }`}
              title="Real-time Sync"
            >
              <RefreshCw className={`w-4 h-4 text-blue-500 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Google Verified Shield */}
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenAuth();
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10 text-slate-300' 
                  : 'bg-white border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50'
              }`}
              title="Google Account"
            >
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => {
                soundFx.playClick();
                onToggleTheme();
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10 text-amber-400' 
                  : 'bg-white border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenSettings();
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10 text-slate-300' 
                  : 'bg-white border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* ======================================================== */}
      {/* 📱 2. MAIN MOBILE BODY CONTENT                          */}
      {/* ======================================================== */}
      <main className="p-4 space-y-4">
        
        {/* Progress Overview Card */}
        <div className={`p-4 rounded-3xl border shadow-sm transition-all ${
          isDarkMode 
            ? 'bg-gradient-to-br from-[#161C2C] to-[#121622] border-white/10' 
            : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white border-transparent shadow-lg shadow-purple-500/20'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-slate-400' : 'text-purple-100'
              }`}>
                Today's Completion
              </span>
              <h2 className="text-xl font-black mt-0.5">
                {completedTodayCount} of {activities.length} Habits Done
              </h2>
            </div>
            
            <div className={`px-3 py-1 rounded-2xl text-xs font-black border ${
              isDarkMode 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-white/20 text-white border-white/30 backdrop-blur-md'
            }`}>
              {progressPct}%
            </div>
          </div>

          {/* Progress bar */}
          <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 ${
            isDarkMode ? 'bg-slate-800' : 'bg-black/20'
          }`}>
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-500 shadow-xs"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
            <div>
              <div className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-slate-400' : 'text-purple-200'}`}>Streak</div>
              <div className="text-sm font-black flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" /> {summary.overallStreakDays}d
              </div>
            </div>
            <div>
              <div className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-slate-400' : 'text-purple-200'}`}>XP Level</div>
              <div className="text-sm font-black text-amber-300">+{user.currentXP} XP</div>
            </div>
            <div>
              <div className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-slate-400' : 'text-purple-200'}`}>Efficiency</div>
              <div className="text-sm font-black text-emerald-300">{summary.efficiencyPct}%</div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: TODAY HABIT CHECKLIST & TIMELINE              */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'today' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Date Selector Row */}
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                Today's Habits ({completedTodayCount}/{activities.length})
              </h3>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onAddHabit();
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add Habit
              </button>
            </div>

            {/* Habit Cards Stack */}
            <div className="space-y-2.5">
              {activities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => {
                    soundFx.playClick();
                    onToggleActivity(act.id);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between active:scale-[0.99] ${
                    act.completed 
                      ? (isDarkMode ? 'bg-emerald-950/30 border-emerald-500/40 text-white' : 'bg-emerald-50/90 border-emerald-300 text-slate-900 shadow-2xs')
                      : (isDarkMode ? 'bg-[#121622] border-white/10 text-white hover:border-white/20' : 'bg-white border-slate-200/80 text-slate-900 shadow-xs hover:border-slate-300')
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        act.completed 
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                          : (isDarkMode ? 'border-2 border-slate-600 text-transparent' : 'border-2 border-slate-300 text-transparent')
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    <div>
                      <h4 className={`text-sm font-bold ${act.completed ? 'line-through opacity-80' : ''}`}>
                        {act.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] mt-0.5 font-medium">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-mono font-bold ${
                          isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {act.category}
                        </span>
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                          {act.plannedMinutes}m • +{act.xpReward} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-black flex items-center gap-1 ${
                      act.completed ? 'text-emerald-500' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')
                    }`}>
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span>{act.streak}d</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: MASTER 30-DAY MONTHLY HABIT MATRIX            */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'matrix' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                  {selectedMonth} Matrix Grid
                </h3>
                <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                  Tap cell to mark completed for any day
                </p>
              </div>

              {/* Day Selector */}
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                isDarkMode ? 'bg-slate-800 border-white/10 text-emerald-400' : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
              }`}>
                Day {todayDayNumber} Active
              </div>
            </div>

            {/* Matrix Habit Cards list */}
            <div className="space-y-3">
              {activities.map((act) => {
                const daysArr = matrixState[act.id] || Array.from({ length: 31 }, () => false);

                return (
                  <div 
                    key={act.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isDarkMode ? 'bg-[#121622] border-white/10' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{act.name}</span>
                        <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${
                          isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {act.category}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-emerald-500">
                        {daysArr.filter(Boolean).length}/{daysInMonth} Days
                      </div>
                    </div>

                    {/* Horizontal Scrollable Days Grid Bar */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                      {Array.from({ length: daysInMonth }).map((_, dIdx) => {
                        const dayNum = dIdx + 1;
                        const isChecked = daysArr[dIdx] || false;
                        const isToday = dayNum === todayDayNumber;

                        return (
                          <button
                            key={dayNum}
                            onClick={() => {
                              soundFx.playClick();
                              onToggleMatrixCell(act.id, dIdx);
                            }}
                            className={`w-7 h-8 rounded-lg flex flex-col items-center justify-center shrink-0 text-[9px] font-mono transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-500 text-white font-bold shadow-xs'
                                : isToday
                                ? (isDarkMode ? 'bg-purple-900/60 border border-purple-500 text-purple-300' : 'bg-purple-100 border border-purple-400 text-purple-900 font-bold')
                                : (isDarkMode ? 'bg-slate-800/80 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                            }`}
                          >
                            <span className="opacity-70 text-[8px]">{dayNum}</span>
                            {isChecked ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="text-[9px]">•</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: CONNECTED COMPETITIVE PLATFORMS DECK          */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'platforms' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                Connected Competitive Deck
              </h3>
              <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-500 font-bold'}`}>
                Auto-Synced Live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* LeetCode Mobile Card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDarkMode ? 'bg-[#121622] border-white/10' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center font-mono font-black text-xs">
                    LC
                  </div>
                  <div>
                    <h4 className="text-xs font-black">LeetCode</h4>
                    <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                      @mradityasingh
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-amber-500">Active Sync</div>
                  <div className="text-[10px] text-emerald-500 font-bold">Aug 1–18 Tracked</div>
                </div>
              </div>

              {/* GitHub Mobile Card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDarkMode ? 'bg-[#121622] border-white/10' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white border border-slate-700 flex items-center justify-center font-mono font-black text-xs">
                    GH
                  </div>
                  <div>
                    <h4 className="text-xs font-black">GitHub</h4>
                    <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                      @MrAditya-Singh
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-500">Synced</div>
                  <div className="text-[10px] text-emerald-500 font-bold">Aug 1–18 Tracked</div>
                </div>
              </div>

              {/* GeeksforGeeks Mobile Card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDarkMode ? 'bg-[#121622] border-white/10' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-mono font-black text-xs">
                    GFG
                  </div>
                  <div>
                    <h4 className="text-xs font-black">GeeksforGeeks</h4>
                    <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                      @mraditya
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-500">Aug 14, 15 Saved</div>
                  <div className="text-[10px] text-emerald-500 font-bold">Aug 1–18 Tracked</div>
                </div>
              </div>

              {/* Codeforces Mobile Card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDarkMode ? 'bg-[#121622] border-white/10' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-500 flex items-center justify-center font-mono font-black text-xs">
                    CF
                  </div>
                  <div>
                    <h4 className="text-xs font-black">Codeforces</h4>
                    <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                      @Aditya__YUPP
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-blue-500">Connected</div>
                  <div className="text-[10px] text-emerald-500 font-bold">Aug 1–18 Tracked</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: SOLO LEVELING HUNTER STATS & ANALYTICS        */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'stats' && (
          <div className="space-y-4 animate-fade-in">
            <div className={`p-4 rounded-3xl border ${
              isDarkMode ? 'bg-[#121622] border-white/10' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black">Solo Leveling Stats</h4>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Level {user.level} • {user.hunterRank}-Rank Hunter
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Current XP:</span>
                  <span className="text-purple-600 font-mono">{user.currentXP} / {user.xpToNextLevel} XP</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${Math.min(100, (user.currentXP / user.xpToNextLevel) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* 📱 3. FLOATING GLASSBAR MOBILE BOTTOM NAVIGATION TABS    */}
      {/* ======================================================== */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 px-4 py-2.5 border-t backdrop-blur-2xl transition-colors ${
        isDarkMode 
          ? 'bg-[#0B0F17]/95 border-white/10 shadow-2xl shadow-purple-950/30' 
          : 'bg-white/95 border-slate-200/90 shadow-2xl'
      }`}>
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          {/* Tab 1: Today */}
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('today');
            }}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer py-1 px-3 rounded-2xl ${
              activeTab === 'today'
                ? (isDarkMode ? 'text-emerald-400 font-black' : 'text-purple-700 font-black')
                : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900')
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 ${activeTab === 'today' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold">Today</span>
          </button>

          {/* Tab 2: Habit Matrix */}
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('matrix');
            }}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer py-1 px-3 rounded-2xl ${
              activeTab === 'matrix'
                ? (isDarkMode ? 'text-emerald-400 font-black' : 'text-purple-700 font-black')
                : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900')
            }`}
          >
            <LayoutGrid className={`w-5 h-5 ${activeTab === 'matrix' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold">Matrix</span>
          </button>

          {/* Tab 3: Platforms */}
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('platforms');
            }}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer py-1 px-3 rounded-2xl ${
              activeTab === 'platforms'
                ? (isDarkMode ? 'text-emerald-400 font-black' : 'text-purple-700 font-black')
                : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900')
            }`}
          >
            <Code2 className={`w-5 h-5 ${activeTab === 'platforms' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold">Platforms</span>
          </button>

          {/* Tab 4: Solo Rank / Stats */}
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('stats');
            }}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer py-1 px-3 rounded-2xl ${
              activeTab === 'stats'
                ? (isDarkMode ? 'text-emerald-400 font-black' : 'text-purple-700 font-black')
                : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900')
            }`}
          >
            <Trophy className={`w-5 h-5 ${activeTab === 'stats' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold">Rank</span>
          </button>

        </div>
      </nav>

    </div>
  );
};
