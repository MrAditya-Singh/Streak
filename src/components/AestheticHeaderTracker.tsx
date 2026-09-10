import React, { useState } from 'react';
import { UserProfile, EmergencyTask } from '../types';
import { Sparkles, Smartphone, Settings, RefreshCw, Flame, Volume2, VolumeX, Sun, Moon, Zap, ShieldAlert, BarChart3, CheckCircle2, Users, Clock, Camera, Disc } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { openImagePicker } from '../utils/imageUtils';
import { PhotoDiscWheel } from './PhotoDiscWheel';

interface AestheticHeaderTrackerProps {
  user: UserProfile;
  selectedMonth: string;
  selectedYear: number;
  onMonthChange: (month: string) => void;
  dailyProgressPct: number;
  completedMonthHabits: number;
  totalMonthHabits: number;
  isDarkMode: boolean;
  currentThemeId?: string;
  onToggleTheme: () => void;
  onOpenThemeModal?: () => void;
  onOpenSoloLeveling: () => void;
  onOpenTodayActivity: () => void;
  onOpenEfficiencyMatrix: () => void;
  onOpenEmergencyWork: () => void;
  onOpenSimulator: () => void;
  onOpenSync: () => void;
  onOpenSettings: () => void;
  onOpenAuth?: () => void;
  onToggleSound: () => void;
  onUpdateHeaderImage?: (newImage: string) => void;
  isSyncing?: boolean;
  emergencyTasks?: EmergencyTask[];
  onCompleteEmergencyTask?: (id: string) => void;
  onAddEmergencyTask?: (task: EmergencyTask) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const HEADER_DEFAULT_PHOTOS = [
  '/images/header_aesthetic.png',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
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
  currentThemeId,
  onToggleTheme,
  onOpenThemeModal,
  onOpenSoloLeveling,
  onOpenTodayActivity,
  onOpenEfficiencyMatrix,
  onOpenEmergencyWork,
  onOpenSimulator,
  onOpenSync,
  onOpenSettings,
  onOpenAuth,
  onToggleSound,
  onUpdateHeaderImage,
  isSyncing = false,
  emergencyTasks = [],
  onCompleteEmergencyTask,
  onAddEmergencyTask: _onAddEmergencyTask,
}) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, dailyProgressPct)) / 100) * circumference;

  const [_hoveredWavePoint, _setHoveredWavePoint] = useState<{ x: number; y: number; label: string; value: string } | null>(null);
  const [isHeaderReelActive, setIsHeaderReelActive] = useState<boolean>(false);
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState<boolean>(false);

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
    <header className={`w-full rounded-2xl sm:rounded-3xl p-3 sm:p-5 lg:p-6 transition-all duration-300 border ${
      isDarkMode 
        ? 'bg-[#0f1422]/95 border-slate-800/80 text-white shadow-2xl backdrop-blur-md' 
        : 'bg-[#FCFBF8] border-[#E8E3D9] text-slate-900 shadow-sm'
    }`}>
      {/* Top Main Row */}
      <div className="dashboard-header-grid grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 lg:gap-6 items-center">
        
        {/* Left Section: Serif Calligraphic Title & Period Badges */}
        <div className="dashboard-header-copy lg:col-span-3 space-y-2.5 sm:space-y-3">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 font-mono">
                HABIT TRACKER
              </span>
            </div>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-serif-title tracking-tight italic font-black mt-0.5 sm:mt-1 leading-tight ${
              isDarkMode 
                ? 'bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent drop-shadow-sm' 
                : 'text-slate-950'
            }`}>
              {selectedMonth}
            </h1>
          </div>

          {/* Month & Year Selectors (Luxury Crimson Capsules) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gradient-to-r from-[#e11d48] to-[#be123c] border border-rose-400/80 rounded-xl sm:rounded-2xl overflow-hidden shadow-md shadow-rose-600/25 hover:shadow-rose-600/40 hover:brightness-105 transition-all">
              <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 font-black text-rose-100 uppercase text-[8px] sm:text-[9px] tracking-wider border-r border-rose-400/50 font-mono flex items-center gap-1">
                MONTH
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  soundFx.playClick();
                  onMonthChange(e.target.value);
                }}
                className="bg-transparent pl-2 pr-2.5 sm:pr-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-black text-white outline-none cursor-pointer transition-colors"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white font-bold">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-gradient-to-r from-[#e11d48] to-[#be123c] border border-rose-400/80 rounded-xl sm:rounded-2xl overflow-hidden shadow-md shadow-rose-600/25">
              <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 font-black text-rose-100 uppercase text-[8px] sm:text-[9px] tracking-wider border-r border-rose-400/50 font-mono">
                YEAR
              </span>
              <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 font-black text-white font-mono text-[11px] sm:text-xs">
                {selectedYear}
              </span>
            </div>
          </div>

          {/* Real-time Dynamic Live Clock Badge */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono font-black text-white bg-gradient-to-r from-[#e11d48] to-[#be123c] px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border border-rose-400/80 shadow-md shadow-rose-600/25 hover:brightness-105 transition-all w-fit">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-ping shrink-0" />
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white shrink-0" />
            <span className="text-white truncate">{currentRealDate} • {currentRealTime}</span>
          </div>
        </div>

        {/* Center Section: Aesthetic Showcase Banner with Rotating Disc Reel */}
        <div className="dashboard-header-banner lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full h-36 sm:h-48 md:h-54 relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-purple-400/30 dark:border-purple-500/40 shadow-xl shadow-purple-500/10 dark:shadow-[0_0_30px_rgba(168,85,247,0.2)] group transition-all duration-500 hover:shadow-purple-500/25 bg-slate-950 flex items-center justify-center">
            
            {/* Top Ambient Glow Edge */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent z-10 opacity-75" />

            {/* View Mode 1: Main Aesthetic Banner Image */}
            {!isHeaderReelActive ? (
              <>
                <img
                  src={user.headerImage || "/images/header_aesthetic.png"}
                  alt="Aesthetic Header Banner"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out cursor-pointer"
                  onDoubleClick={() => {
                    soundFx.playLevelUp();
                    setIsHeaderModalOpen(true);
                  }}
                  title="Double click to Open 6-Slot Photo Disc Manager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-3 sm:left-4 z-10 flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-pink-500/20 border border-pink-400/40 backdrop-blur-md flex items-center justify-center">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-300 animate-pulse" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-pink-200 font-mono">Hunter Squad</span>
                </div>
              </>
            ) : (
              /* View Mode 2: Interactive 6-Hole Rotating Disc Reel Lens Overlay */
              <div className="w-full h-full p-2 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black rounded-2xl sm:rounded-3xl animate-fade-in relative z-20">
                <PhotoDiscWheel
                  storageKey="header_reel"
                  title="Header Banner"
                  activePhoto={user.headerImage || "/images/header_aesthetic.png"}
                  defaultPhotos={HEADER_DEFAULT_PHOTOS}
                  onSelectPhoto={(url) => {
                    onUpdateHeaderImage?.(url);
                  }}
                  size="sm"
                  isOpenModal={isHeaderModalOpen}
                  onCloseModal={() => setIsHeaderModalOpen(false)}
                />
              </div>
            )}

            {/* Top Right Header Controls: Reel Lens Toggle */}
            <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 z-30 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsHeaderReelActive(!isHeaderReelActive);
                }}
                title={isHeaderReelActive ? 'Switch to Full Photo View' : 'Open 6-Hole Rotating Disc Reel'}
                className={`p-1 sm:p-1.5 rounded-full backdrop-blur-md transition-all duration-200 border shadow-md cursor-pointer flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 ${
                  isHeaderReelActive
                    ? 'bg-rose-600 text-white border-rose-400 scale-105 shadow-rose-600/30'
                    : 'bg-black/70 hover:bg-black/90 text-white border-white/20 hover:scale-105'
                }`}
              >
                <Disc className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isHeaderReelActive ? 'animate-spin-slow text-white' : 'text-rose-400'}`} />
                <span>{isHeaderReelActive ? 'Photo View' : 'Reel Dial'}</span>
              </button>
            </div>

            {/* Bottom Right Floating Badge */}
            {!isHeaderReelActive && (
              <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 z-10 text-[9px] sm:text-[11px] font-mono font-bold text-white drop-shadow-lg flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full border border-white/20 shadow-lg">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-300 animate-pulse" />
                <span>Effective Streak • {selectedMonth}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Luxury Daily Progress & Compact Emergency Directive */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col justify-between gap-2.5 h-full">
          {/* Top: Luxury Daily Progress & Circular Progress Counter */}
          <div className={`dashboard-header-progress flex-1 flex items-center justify-between gap-4 p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#121826]/90 border-slate-800/90 text-white shadow-md' 
              : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
          }`}>
            <div className="text-left sm:text-right flex-1 min-w-0">
              <div className={`text-[9px] sm:text-[10px] font-bold tracking-wider uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                DAILY PROGRESS
              </div>
              <div className={`text-xl sm:text-2xl lg:text-3xl font-black mt-0.5 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                {dailyProgressPct.toFixed(2)}%
              </div>
              <div className="text-[9px] sm:text-[10px] text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 shrink-0" /> Target: ≥85%
              </div>
            </div>

            {/* Circular Ring for Habits Count */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 sm:w-16 sm:h-16 transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r={24}
                  className={isDarkMode ? 'stroke-slate-800' : 'stroke-slate-100'}
                  strokeWidth="4.5"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={24}
                  stroke="#f472b6"
                  strokeWidth="4.5"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 - (Math.min(100, Math.max(0, dailyProgressPct)) / 100) * (2 * Math.PI * 24)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: 'drop-shadow(0 0 5px rgba(244, 114, 182, 0.45))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-0.5">
                <span className={`text-[6px] sm:text-[7px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>HABITS</span>
                <span className={`text-[10px] sm:text-xs font-black leading-none mt-0.5 font-mono ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {completedMonthHabits}/{totalMonthHabits}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom: Luxury Compact Emergency Directive Option */}
          <div className={`flex-1 flex flex-col justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#121826]/90 border-slate-800/90 text-white shadow-md' 
              : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
          }`}>
            {/* Top Row */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-lg flex items-center justify-center border shrink-0 ${
                  isDarkMode ? 'bg-rose-950/80 text-rose-400 border-rose-800/80' : 'bg-rose-100 text-rose-600 border-rose-200'
                }`}>
                  <ShieldAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse" />
                </div>
                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Emergency Directive
                </span>
                {emergencyTasks.filter((t) => !t.completed).length > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs font-mono shrink-0">
                    {emergencyTasks.filter((t) => !t.completed).length}/3 active
                  </span>
                ) : (
                  <span className={`px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider font-mono shrink-0 ${
                    isDarkMode ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    0/3 active
                  </span>
                )}
              </div>

              {emergencyTasks.length < 3 && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    onOpenEmergencyWork();
                  }}
                  className="text-[9px] sm:text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer hover:underline shrink-0"
                >
                  <span>+ Add</span>
                </button>
              )}
            </div>

            {/* Content Area - Max 3 */}
            {emergencyTasks && emergencyTasks.length > 0 ? (
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-0.5">
                {emergencyTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      soundFx.playClick();
                      onCompleteEmergencyTask?.(task.id);
                    }}
                    title={task.title}
                    className={`flex items-center justify-between gap-2 p-1.5 px-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      task.completed
                        ? isDarkMode ? 'bg-slate-900/60 border-slate-800 opacity-60' : 'bg-slate-100 border-slate-200 opacity-60'
                        : isDarkMode ? 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50 hover:bg-slate-800/80 shadow-xs' : 'bg-slate-50/90 border-slate-200 hover:border-rose-400 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md flex items-center justify-center border-1.5 shrink-0 transition-all ${
                        task.completed 
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' 
                          : 'border-rose-400 hover:bg-rose-100'
                      }`}>
                        {task.completed && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                      </div>
                      <span className={`text-[11px] sm:text-xs font-bold truncate ${
                        task.completed ? 'line-through text-slate-500' : isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {task.title}
                      </span>
                    </div>

                    <span className={`text-[7px] sm:text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded-md border shrink-0 ${
                      isDarkMode ? 'bg-rose-950/70 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-700 border border-rose-200'
                    }`}>
                      {task.tag || 'CRITICAL'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => {
                  soundFx.playClick();
                  onOpenEmergencyWork();
                }}
                className={`flex items-center justify-between p-2 px-3 rounded-xl border border-dashed transition-all cursor-pointer group ${
                  isDarkMode 
                    ? 'border-slate-800 bg-slate-900/60 hover:border-rose-500/40 hover:bg-slate-900' 
                    : 'border-slate-300 bg-slate-50/90 hover:border-rose-400 hover:bg-rose-50/50'
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                  <span className={`font-bold text-[11px] sm:text-xs ${isDarkMode ? 'text-slate-300' : 'text-black'}`}>No urgent directives</span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                  + Add
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Quick Access Toolbar for Modals & Settings */}
      <div className="mt-3.5 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between sm:justify-end gap-2 text-xs overflow-x-auto touch-pan-x pb-1 sm:pb-0 scroller-smooth">
        {/* Responsive Toolbar Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onOpenTodayActivity}
            title="Inspect Today's Timestamps"
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-black transition-all border cursor-pointer shadow-xs text-[10px] sm:text-xs ${
              isDarkMode ? 'bg-[#182035] hover:bg-[#1f2a44] text-slate-100 border-slate-700/80' : 'bg-white hover:bg-slate-50 text-black border-slate-300/80'
            }`}
          >
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
            <span className="whitespace-nowrap">Today's Activity</span>
          </button>

          <button
            onClick={onOpenEfficiencyMatrix}
            title="Open Efficiency Day/Month/Year Matrix"
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-black transition-all border cursor-pointer shadow-xs text-[10px] sm:text-xs ${
              isDarkMode ? 'bg-[#182035] hover:bg-[#1f2a44] text-slate-100 border-slate-700/80' : 'bg-white hover:bg-slate-50 text-black border-slate-300/80'
            }`}
          >
            <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">Efficiency Matrix</span>
          </button>

          <button
            onClick={onOpenSimulator}
            title="Widget Simulator"
            className={`p-1.5 sm:p-2 rounded-xl transition-colors border cursor-pointer shadow-xs ${
              isDarkMode ? 'bg-[#182035] hover:bg-[#1f2a44] text-slate-100 border-slate-700/80' : 'bg-white hover:bg-slate-50 text-black border-slate-300/80'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenSync}
            title={
              isSyncing
                ? 'Syncing state & platform activity...'
                : user.lastSyncedAt
                ? `Live Sync: Ready (Last synced: ${new Date(user.lastSyncedAt).toLocaleTimeString()})`
                : 'Live Sync: Connect & synchronize all activity'
            }
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl transition-all border shadow-xs cursor-pointer ${
              isSyncing
                ? 'bg-blue-900/30 border-blue-500 text-blue-300 font-black'
                : isDarkMode
                ? 'bg-[#182035] hover:bg-[#1f2a44] text-slate-100 font-black border-slate-700/80'
                : 'bg-white hover:bg-slate-50 text-black font-black border-slate-300/80'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? 'animate-spin text-blue-400' : isDarkMode ? 'text-slate-300' : 'text-slate-800'}`} />
            <span className="text-[10px] sm:text-[11px] font-black whitespace-nowrap">
              {isSyncing ? 'Syncing...' : 'Live Sync'}
            </span>
          </button>

          <button
            onClick={onToggleSound}
            title="Toggle Sound Effects"
            className={`p-1.5 sm:p-2 rounded-xl transition-colors border cursor-pointer shadow-xs ${
              isDarkMode ? 'bg-[#182035] hover:bg-[#1f2a44] text-slate-100 border-slate-700/80' : 'bg-white hover:bg-slate-50 text-black border-slate-300/80'
            }`}
          >
            {user.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              if (onOpenThemeModal) {
                onOpenThemeModal();
              } else {
                onToggleTheme();
              }
            }}
            title="Open Theme Reel Dial (6 Bespoke Themes)"
            className={`p-1.5 sm:p-2 rounded-xl transition-all hover:scale-105 border cursor-pointer shadow-xs flex items-center justify-center relative ${
              isDarkMode ? 'bg-[#182035] hover:bg-[#1f2a44] text-slate-100 border-slate-700/80' : 'bg-white hover:bg-slate-50 text-black border-slate-300/80'
            }`}
          >
            {isDarkMode ? (
              <Moon className="w-3.5 h-3.5 text-indigo-400 dark:text-cyan-400 animate-pulse" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
            )}
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </button>

          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              title={
                user.uid && user.uid !== 'guest_user_local' && !user.uid.startsWith('guest_')
                  ? `Logged in as ${user.email || user.name || user.uid} - Click to switch accounts`
                  : 'Connect Account & Sync Across Devices'
              }
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-black transition-all border cursor-pointer shadow-xs text-[10px] sm:text-[11px] max-w-[140px] sm:max-w-[170px] ${
                user.uid && user.uid !== 'guest_user_local' && !user.uid.startsWith('guest_')
                  ? isDarkMode ? 'bg-[#182035] border-emerald-500/50 text-emerald-300' : 'bg-white border-emerald-500/50 text-emerald-700'
                  : isDarkMode ? 'bg-[#182035] hover:bg-[#1f2a44] text-slate-100 border-slate-700/80' : 'bg-white hover:bg-slate-50 text-black border-slate-300/80'
              }`}
            >
              {user.uid && user.uid !== 'guest_user_local' && !user.uid.startsWith('guest_') ? (
                <>
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate">{user.email ? user.email.split('@')[0] : (user.name || 'Hunter')}</span>
                </>
              ) : (
                <>
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
                  <span className="whitespace-nowrap">Login / Sync</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="Settings"
            className={`p-1.5 sm:p-2 rounded-xl transition-colors border cursor-pointer shadow-xs ${
              isDarkMode ? 'bg-[#182035] hover:bg-[#1f2a44] text-slate-100 border-slate-700/80' : 'bg-white hover:bg-slate-50 text-black border-slate-300/80'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
