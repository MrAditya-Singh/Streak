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
    <header className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-300 border ${
      isDarkMode 
        ? 'bg-[#0f1422]/95 border-slate-800/80 text-white shadow-2xl backdrop-blur-md' 
        : 'bg-[#FCFBF8] border-[#E8E3D9] text-slate-900 shadow-sm'
    }`}>
      {/* Top Main Row */}
      <div className="dashboard-header-grid grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
        
        {/* Left Section: Serif Calligraphic Title & Period Badges (Image 2) */}
        <div className="dashboard-header-copy lg:col-span-3 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 font-mono">
                HABIT TRACKER
              </span>
            </div>
            <h1 className={`text-4xl sm:text-5xl font-serif-title tracking-tight italic font-black mt-1 leading-tight ${
              isDarkMode 
                ? 'bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent drop-shadow-sm' 
                : 'text-slate-950'
            }`}>
              {selectedMonth}
            </h1>
          </div>

          {/* Month & Year Selectors (Vibrant Crimson Rose Luxury Capsules - Matching Image 2) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gradient-to-r from-[#e11d48] to-[#be123c] border border-rose-400/80 rounded-2xl overflow-hidden shadow-md shadow-rose-600/25 hover:shadow-rose-600/40 hover:brightness-105 transition-all">
              <span className="px-3 py-1.5 font-black text-rose-100 uppercase text-[9px] tracking-wider border-r border-rose-400/50 font-mono flex items-center gap-1">
                MONTH
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  soundFx.playClick();
                  onMonthChange(e.target.value);
                }}
                className="bg-transparent pl-2.5 pr-3 py-1.5 text-xs font-black text-white outline-none cursor-pointer transition-colors"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white font-bold">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-gradient-to-r from-[#e11d48] to-[#be123c] border border-rose-400/80 rounded-2xl overflow-hidden shadow-md shadow-rose-600/25">
              <span className="px-3 py-1.5 font-black text-rose-100 uppercase text-[9px] tracking-wider border-r border-rose-400/50 font-mono">
                YEAR
              </span>
              <span className="px-3 py-1.5 font-black text-white font-mono text-xs">
                {selectedYear}
              </span>
            </div>
          </div>

          {/* Real-time Dynamic Live Clock Badge (Vibrant Crimson Red Capsule - Matching Image 3) */}
          <div className="flex items-center gap-2.5 text-[11px] font-mono font-black text-white bg-gradient-to-r from-[#e11d48] to-[#be123c] px-3.5 py-1.5 rounded-2xl border border-rose-400/80 shadow-md shadow-rose-600/25 hover:brightness-105 transition-all w-fit">
            <div className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <Clock className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="text-white">{currentRealDate} • {currentRealTime}</span>
          </div>
        </div>

        {/* Center Section: Premium Visual Aesthetic Showcase Banner with 6-Hole Rotating Disc Reel */}
        <div className="dashboard-header-banner lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full h-44 sm:h-50 md:h-56 relative rounded-3xl overflow-hidden border-2 border-purple-400/30 dark:border-purple-500/40 shadow-xl shadow-purple-500/10 dark:shadow-[0_0_30px_rgba(168,85,247,0.2)] group transition-all duration-500 hover:shadow-purple-500/25 bg-slate-950 flex items-center justify-center">
            
            {/* Top Ambient Glow Edge */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent z-10 opacity-75" />

            {/* View Mode 1: Main Aesthetic Banner Image */}
            {!isHeaderReelActive ? (
              <>
                <img
                  src={user.headerImage || "/images/header_aesthetic.png"}
                  alt="Visual Aesthetic Banner"
                  className="w-full h-full object-cover object-[center_30%] group-hover:scale-105 transition-transform duration-700 ease-out cursor-pointer"
                  onDoubleClick={() => {
                    soundFx.playLevelUp();
                    setIsHeaderModalOpen(true);
                  }}
                  title="Double click to Open 6-Slot Photo Disc Manager"
                />
                
                {/* Cinematic Gradient Vignette Overlay for Crisp Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-950/20 via-transparent to-pink-950/20 pointer-events-none" />
                
                {/* Top Left Squad Badge */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-200">Hunter Squad</span>
                </div>
              </>
            ) : (
              /* View Mode 2: Interactive 6-Hole Rotating Disc Reel Lens Overlay */
              <div className="w-full h-full p-2 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black rounded-3xl animate-fade-in relative z-20">
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
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsHeaderReelActive(!isHeaderReelActive);
                }}
                title={isHeaderReelActive ? 'Switch to Full Photo View' : 'Open 6-Hole Rotating Disc Reel'}
                className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 border shadow-md cursor-pointer flex items-center gap-1 text-[10px] font-bold px-2.5 ${
                  isHeaderReelActive
                    ? 'bg-rose-600 text-white border-rose-400 scale-105 shadow-rose-600/30'
                    : 'bg-black/70 hover:bg-black/90 text-white border-white/20 hover:scale-105'
                }`}
              >
                <Disc className={`w-3.5 h-3.5 ${isHeaderReelActive ? 'animate-spin-slow text-white' : 'text-rose-400'}`} />
                <span>{isHeaderReelActive ? 'Photo View' : 'Reel Dial'}</span>
              </button>
            </div>

            {/* Bottom Right Floating Badge */}
            {!isHeaderReelActive && (
              <div className="absolute bottom-3 right-3 z-10 text-[11px] font-mono font-bold text-white drop-shadow-lg flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/20 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-pink-300 animate-pulse" />
                <span>Effective Streak • {selectedMonth}</span>
              </div>
            )}
          </div>
        </div>        {/* Right Section: Luxury Daily Progress & Compact Emergency Directive */}
        <div className="lg:col-span-3 flex flex-col justify-between gap-2.5 h-full">
          {/* Top: Luxury Daily Progress & Circular Progress Counter */}
          <div className="dashboard-header-progress flex items-center justify-between sm:justify-end gap-5 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm text-slate-900">
            <div className="text-right">
              <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                DAILY PROGRESS
              </div>
              <div className="text-2xl sm:text-3xl font-black text-black mt-0.5 tracking-tight">
                {dailyProgressPct.toFixed(2)}%
              </div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Target: ≥85%
              </div>
            </div>

            {/* Pink/Rose Circular Ring for Habits Count */}
            <div className="relative w-18 h-18 flex items-center justify-center flex-shrink-0">
              <svg className="w-18 h-18 transform -rotate-90">
                <circle
                  cx="36"
                  cy="36"
                  r={30}
                  className="stroke-slate-100"
                  strokeWidth="5.5"
                  fill="transparent"
                />
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  stroke="#f472b6"
                  strokeWidth="5.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(244, 114, 182, 0.45))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">HABITS</span>
                <span className="text-xs font-black text-black leading-none mt-0.5 font-mono">
                  {completedMonthHabits}/{totalMonthHabits}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom: Luxury Compact Emergency Directive Option */}
          <div className="flex flex-col justify-between p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-sm text-slate-900 transition-all duration-300">
            {/* Top Row */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                  <ShieldAlert className="w-3 h-3 animate-pulse" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-black">
                  Emergency Directive
                </span>
                {emergencyTasks.filter((t) => !t.completed).length > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs font-mono">
                    {emergencyTasks.filter((t) => !t.completed).length}/3 active
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 font-mono">
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
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <span>+ Add</span>
                </button>
              )}
            </div>

            {/* Content Area - Only Headings of Directives (Max 3) */}
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
                        ? 'bg-slate-100 border-slate-200 opacity-60'
                        : 'bg-slate-50/90 border-slate-200 hover:border-rose-400 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border-1.5 shrink-0 transition-all ${
                        task.completed 
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' 
                          : 'border-rose-400 hover:bg-rose-100'
                      }`}>
                        {task.completed && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <span className={`text-xs font-bold truncate ${
                        task.completed ? 'line-through text-slate-400' : 'text-black font-semibold'
                      }`}>
                        {task.title}
                      </span>
                    </div>

                    <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
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
                className="flex items-center justify-between p-2 px-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/90 hover:border-rose-400 hover:bg-rose-50/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                  <span className="font-bold text-xs text-black">No urgent directives</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                  + Add
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Quick Access Toolbar for Modals & Settings */}
      <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-end gap-3 text-xs">
        {/* Right Tools: Today Timestamps, Efficiency Matrix, Sync, Simulator, Settings, Theme */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenTodayActivity}
            title="Inspect Today's Timestamps"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-black font-black transition-all border border-slate-300/80 cursor-pointer shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            <span>Today's Activity</span>
          </button>

          <button
            onClick={onOpenEfficiencyMatrix}
            title="Open Efficiency Day/Month/Year Matrix"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-black font-black transition-all border border-slate-300/80 cursor-pointer shadow-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Efficiency Matrix</span>
          </button>

          <button
            onClick={onOpenSimulator}
            title="Widget Simulator"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-black transition-colors border border-slate-300/80 cursor-pointer shadow-xs"
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
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all border shadow-xs cursor-pointer ${
              isSyncing
                ? 'bg-blue-50 border-blue-400 text-blue-700 font-black'
                : 'bg-white hover:bg-slate-50 text-black font-black border-slate-300/80'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-800'}`} />
            <span className="text-[11px] font-black hidden sm:inline">
              {isSyncing ? 'Syncing...' : 'Live Sync'}
            </span>
          </button>

          <button
            onClick={onToggleSound}
            title="Toggle Sound Effects"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-black transition-colors border border-slate-300/80 cursor-pointer shadow-xs"
          >
            {user.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
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
            title="Open Theme Reel Dial (8 World-Class Themes)"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-black transition-all hover:scale-105 border border-slate-300/80 cursor-pointer shadow-xs group flex items-center justify-center relative"
          >
            {isDarkMode ? (
              <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400 animate-pulse" />
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
              className={
                user.uid && user.uid !== 'guest_user_local' && !user.uid.startsWith('guest_')
                  ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-black font-black transition-all border border-emerald-500/50 cursor-pointer shadow-xs max-w-[170px]'
                  : 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-black font-black transition-all border border-slate-300/80 cursor-pointer shadow-xs text-[11px]'
              }
            >
              {user.uid && user.uid !== 'guest_user_local' && !user.uid.startsWith('guest_') ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[11px] truncate text-black font-black">{user.email ? user.email.split('@')[0] : (user.name || 'Hunter')}</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                  <span>Login / Sync</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-black transition-colors border border-slate-300/80 cursor-pointer shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-800" />
          </button>
        </div>
      </div>
    </header>
  );
};
