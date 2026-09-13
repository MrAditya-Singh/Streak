import React, { useState, useEffect } from 'react';
import { Trophy, Camera, Timer, Clock, CheckCircle2, Flame, Trash2, Plus, Zap, Disc } from 'lucide-react';
import { openImagePicker } from '../utils/imageUtils';
import { soundFx } from '../utils/audio';
import { EmergencyTask } from '../types';
import { PhotoDiscWheel } from './PhotoDiscWheel';

interface DayColumnData {
  day: number;
  percentage: number;
  count: number;
  total: number;
  weekIndex: number; // 1 to 5
}

interface WeekSummary {
  week: number;
  efficiency: number;
  color: string;
  borderColor: string;
  bgLight: string;
}

interface WeeklyConsistencyOverviewProps {
  daysData: DayColumnData[];
  weeksSummary: WeekSummary[];
  topHabits: Array<{
    rank: number;
    name: string;
    progressPct: number;
    streak: number;
  }>;
  isDarkMode: boolean;
  dailyMantraImage?: string;
  onUpdateMantraImage?: (newImage: string) => void;
  mantraReel?: string[];
  onUpdateMantraReel?: (reel: string[]) => void;
  emergencyTasks?: EmergencyTask[];
  onCompleteEmergencyTask?: (id: string) => void;
  onDeleteEmergencyTask?: (id: string) => void;
  onOpenAddEmergencyModal?: () => void;
}

// ─── Innovative Futuristic HUD Mission Countdown Subcomponent ─────────────────
function LiveMissionCountdown({
  task,
  onComplete,
  onDelete,
}: {
  task: EmergencyTask;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = Math.max(0, task.deadlineAt - now);
  const isExpired = remainingMs <= 0;
  const isDone = !!task.completed;

  const totalHours = Math.floor(remainingMs / 3600000);
  const minutes = Math.floor((remainingMs % 3600000) / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  const isUrgent = totalHours < 6 && !isDone && !isExpired;

  return (
    <div
      className={`p-2 px-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 shadow-xs ${
        isDone
          ? 'bg-emerald-500/10 border-emerald-500/30 opacity-70'
          : isUrgent
          ? 'bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-purple-500/15 border-rose-400 shadow-md shadow-rose-500/10'
          : 'bg-slate-50 border-slate-200 hover:border-rose-400'
      }`}
    >
      {/* Left: Checkbox & Directive Title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => {
            soundFx.playCheck();
            onComplete?.(task.id);
          }}
          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            isDone
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
              : 'border-rose-400 hover:bg-rose-100 bg-white'
          }`}
          title={isDone ? 'Completed' : 'Mark Completed'}
        >
          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-bold truncate block ${
                isDone ? 'line-through text-slate-400' : 'text-slate-900'
              }`}
            >
              {task.title}
            </span>
            <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 border border-rose-300 shrink-0">
              {task.tag || 'CRITICAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Innovative Pure Time HUD Display (NO XP) */}
      <div className="flex items-center gap-2 shrink-0">
        {isDone ? (
          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-xl border border-emerald-300 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
          </span>
        ) : isExpired ? (
          <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-100 px-2.5 py-1 rounded-xl border border-rose-300 flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5" /> Expired
          </span>
        ) : (
          /* Innovative Cyber HUD Countdown Timer (Vibrant Crimson Red - Matching Image 3) */
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-400/80 font-mono font-black tracking-wider text-xs shadow-md shadow-rose-600/25 bg-gradient-to-r from-[#e11d48] to-[#be123c] text-white transition-all ${
              isUrgent ? 'animate-pulse ring-2 ring-rose-400' : ''
            }`}
          >
            <Timer className={`w-3.5 h-3.5 shrink-0 text-white ${isUrgent ? 'animate-bounce' : 'animate-spin'}`} />
            
            <div className="flex items-center gap-1">
              <span className="bg-black/25 px-1.5 py-0.5 rounded text-[11px] text-white font-bold">
                {String(totalHours).padStart(2, '0')}h
              </span>
              <span className="text-white font-black">:</span>
              <span className="bg-black/25 px-1.5 py-0.5 rounded text-[11px] text-white font-bold">
                {String(minutes).padStart(2, '0')}m
              </span>
              <span className="text-white font-black">:</span>
              <span className="bg-black/25 px-1.5 py-0.5 rounded text-[11px] text-white font-bold">
                {String(seconds).padStart(2, '0')}s
              </span>
            </div>
          </div>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onDelete(task.id);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Directive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

const MANTRA_DEFAULT_PHOTOS = [
  '/images/char_hero.jpg',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
];

export const WeeklyConsistencyOverview: React.FC<WeeklyConsistencyOverviewProps> = ({
  daysData,
  weeksSummary,
  topHabits,
  isDarkMode,
  dailyMantraImage,
  onUpdateMantraImage,
  mantraReel,
  onUpdateMantraReel,
  emergencyTasks = [],
  onCompleteEmergencyTask,
  onDeleteEmergencyTask,
  onOpenAddEmergencyModal,
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayColumnData | null>(null);
  const [isMantraReelActive, setIsMantraReelActive] = useState<boolean>(false);
  const [isMantraModalOpen, setIsMantraModalOpen] = useState<boolean>(false);
  const effectiveMantraReel = mantraReel || MANTRA_DEFAULT_PHOTOS;

  // Gradient helper for bars based on week
  const getBarGradient = (weekIndex: number, pct: number) => {
    if (pct === 0) return 'bg-slate-200/60 dark:bg-slate-800/80';
    switch (weekIndex) {
      case 1:
        return 'bg-gradient-to-t from-[#60A5FA] to-[#93C5FD] dark:from-blue-600 dark:to-blue-400 shadow-blue-500/20';
      case 2:
        return 'bg-gradient-to-t from-[#F472B6] to-[#FBCFE8] dark:from-pink-600 dark:to-pink-400 shadow-pink-500/20';
      case 3:
        return 'bg-gradient-to-t from-[#14B8A6] to-[#99F6E4] dark:from-teal-600 dark:to-teal-400 shadow-teal-500/20';
      case 4:
        return 'bg-gradient-to-t from-[#F59E0B] to-[#FEF08A] dark:from-amber-600 dark:to-amber-400 shadow-amber-500/20';
      case 5:
      default:
        return 'bg-gradient-to-t from-[#A855F7] to-[#E9D5FF] dark:from-purple-600 dark:to-purple-400 shadow-purple-500/20';
    }
  };

  const activeEmergencyTasks = emergencyTasks.slice(0, 3);

  return (
    <section className={`w-full rounded-2xl sm:rounded-3xl p-3 sm:p-5 lg:p-6 border transition-all duration-300 ${
      isDarkMode 
        ? 'bg-[#0f1422]/95 border-slate-800/80 text-white shadow-2xl backdrop-blur-md' 
        : 'bg-[#FCFBF8] border-[#E8E3D9] text-slate-900 shadow-sm'
    }`}>
      <div className="dashboard-weekly-grid grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 lg:gap-6 items-stretch">
        
        {/* 1. Left: Luxury Polaroid / Motivation Card with 6-Hole Rotating Photo Disc Reel */}
        <div className={`dashboard-mantra-card lg:col-span-3 flex flex-col items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all duration-300 shadow-sm group relative min-h-[340px] sm:min-h-[380px] ${
          isDarkMode ? 'bg-[#121826]/90 border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div className="w-full h-64 sm:h-72 md:h-80 lg:h-64 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center bg-slate-950">
            
            {/* View Mode 1: Main Photo with Ambient Overlay */}
            {!isMantraReelActive ? (
              <>
                <img
                  src={dailyMantraImage || "/images/char_hero.jpg"}
                  alt="Focus Motivation"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out cursor-pointer"
                  onDoubleClick={() => {
                    soundFx.playLevelUp();
                    setIsMantraModalOpen(true);
                  }}
                  title="Double click to Open 6-Slot Photo Disc Manager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                
                {/* Daily Mantra Badge */}
                <span className="absolute top-2.5 left-2.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-black/60 text-white backdrop-blur-md shadow-xs font-mono border border-white/20">
                  Daily Mantra
                </span>

                {/* Modal Instance when triggered from Photo View */}
                {isMantraModalOpen && (
                  <PhotoDiscWheel
                    storageKey="mantra_reel"
                    title="Daily Mantra"
                    activePhoto={dailyMantraImage || "/images/char_hero.jpg"}
                    defaultPhotos={MANTRA_DEFAULT_PHOTOS}
                    slots={effectiveMantraReel}
                    onUpdateSlots={onUpdateMantraReel}
                    onSelectPhoto={(url) => {
                      onUpdateMantraImage?.(url);
                    }}
                    size="sm"
                    isOpenModal={isMantraModalOpen}
                    onCloseModal={() => setIsMantraModalOpen(false)}
                  />
                )}
              </>
            ) : (
              /* View Mode 2: Interactive 6-Hole Rotating Disc Reel Lens */
              <div className="w-full h-full p-2 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black rounded-2xl animate-fade-in relative">
                <PhotoDiscWheel
                  storageKey="mantra_reel"
                  title="Daily Mantra"
                  activePhoto={dailyMantraImage || "/images/char_hero.jpg"}
                  defaultPhotos={MANTRA_DEFAULT_PHOTOS}
                  slots={effectiveMantraReel}
                  onUpdateSlots={onUpdateMantraReel}
                  onSelectPhoto={(url) => {
                    onUpdateMantraImage?.(url);
                  }}
                  size="sm"
                  isOpenModal={isMantraModalOpen}
                  onCloseModal={() => setIsMantraModalOpen(false)}
                />
              </div>
            )}

            {/* Top Right Controls: Toggle Disc Reel Lens */}
            <div className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 z-30 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsMantraReelActive(!isMantraReelActive);
                }}
                title={isMantraReelActive ? 'Switch to Full Photo View' : 'Open Interactive 6-Hole Disc Reel Wheel'}
                className={`p-1 sm:p-1.5 rounded-full backdrop-blur-md transition-all duration-200 border shadow-md cursor-pointer flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 ${
                  isMantraReelActive
                    ? 'bg-rose-600 text-white border-rose-400 scale-105 shadow-rose-600/30'
                    : 'bg-black/70 hover:bg-black/90 text-white border-white/20 hover:scale-105'
                }`}
              >
                <Disc className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isMantraReelActive ? 'animate-spin-slow text-white' : 'text-rose-400'}`} />
                <span>{isMantraReelActive ? 'Photo View' : 'Reel Dial'}</span>
              </button>
            </div>
          </div>

          <div className="text-center mt-2 sm:mt-2.5 px-2">
            <div className={`font-serif-title italic font-black text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>
              I am ...
            </div>
            <p className={`font-calligraphy italic text-xs sm:text-sm font-bold mt-0.5 leading-snug ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
              Focused, intentional, and ready for the month ahead.
            </p>
          </div>
        </div>

        {/* 2. Center: Fixed-Size 5-Week Grouped Bar Chart & Weekly Circular Efficiency Gauges + Emergency Countdown Hub */}
        <div className={`dashboard-weekly-chart lg:col-span-6 flex flex-col justify-between space-y-3 p-3.5 sm:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden min-h-[340px] sm:min-h-[380px] ${
          isDarkMode ? 'bg-[#121826]/90 border-slate-800/90 text-white shadow-md' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
        }`}>
          
          {/* Real-Time Emergency Mission Countdown Banner */}
          {activeEmergencyTasks.length > 0 && (
            <div className={`p-2.5 sm:p-3 rounded-2xl border space-y-2 shadow-2xs ${
              isDarkMode 
                ? 'bg-gradient-to-r from-rose-950/40 via-pink-950/20 to-purple-950/40 border-rose-800/60' 
                : 'bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-purple-500/10 border-rose-300/80'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg bg-gradient-to-tr from-rose-600 to-pink-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-bounce" />
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider font-mono flex items-center gap-1 ${
                    isDarkMode ? 'text-rose-300' : 'text-rose-700'
                  }`}>
                    Emergency Sprint
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.2 rounded-full bg-rose-600 text-white font-mono">
                    {activeEmergencyTasks.filter((t) => !t.completed).length}/3 Active
                  </span>
                </div>

                {activeEmergencyTasks.length < 3 && onOpenAddEmergencyModal && (
                  <button
                    type="button"
                    onClick={onOpenAddEmergencyModal}
                    className="text-[9px] sm:text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer hover:underline font-mono"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                )}
              </div>

              {/* Countdown List */}
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-0.5">
                {activeEmergencyTasks.map((task) => (
                  <LiveMissionCountdown
                    key={task.id}
                    task={task}
                    onComplete={onCompleteEmergencyTask}
                    onDelete={onDeleteEmergencyTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Week Header Labels */}
          <div className={`grid grid-cols-5 text-center text-[10px] sm:text-xs font-serif-title italic font-black border-b pb-1.5 sm:pb-2 ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <span className="text-blue-500 dark:text-blue-400">week 1</span>
            <span className="text-pink-500 dark:text-pink-400">week 2</span>
            <span className="text-teal-500 dark:text-teal-400">week 3</span>
            <span className="text-amber-500 dark:text-amber-400">week 4</span>
            <span className="text-purple-500 dark:text-purple-400">week 5</span>
          </div>

          {/* Daily 30 Bars with Hover Tooltips */}
          <div className="overflow-x-auto touch-pan-x pb-1 relative scroller-smooth">
            <div className="min-w-[320px] sm:min-w-[460px] h-28 sm:h-32 flex items-end justify-between gap-0.5 sm:gap-1 pt-1">
              {daysData.map((d) => (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <div className={`w-full rounded-t-md h-20 sm:h-24 flex items-end overflow-hidden p-0.5 transition-colors ${
                    isDarkMode ? 'bg-slate-900/80 group-hover:bg-slate-800/80' : 'bg-slate-100 group-hover:bg-slate-200'
                  }`}>
                    <div
                      className={`w-full rounded-t-sm transition-all duration-500 shadow-xs ${getBarGradient(d.weekIndex, d.percentage)}`}
                      style={{ height: `${Math.max(6, d.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Hover Tooltip */}
            {hoveredDay && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] sm:text-[10px] font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-slate-700 shadow-lg pointer-events-none z-20 font-mono">
                Day {hoveredDay.day}: {hoveredDay.count}/{hoveredDay.total} Habits ({hoveredDay.percentage.toFixed(0)}%)
              </div>
            )}

            {/* Percentage row under bars */}
            <div className={`min-w-[320px] sm:min-w-[460px] flex items-center justify-between text-[7px] sm:text-[8px] font-mono font-bold pt-1 border-t ${
              isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-slate-200'
            }`}>
              {daysData.map((d) => (
                <span key={`pct-${d.day}`} className="flex-1 text-center truncate">
                  {d.percentage.toFixed(0)}%
                </span>
              ))}
            </div>

            {/* Count row under bars */}
            <div className={`min-w-[320px] sm:min-w-[460px] flex items-center justify-between text-[8px] sm:text-[9px] font-mono font-black pt-0.5 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              {daysData.map((d) => (
                <span key={`cnt-${d.day}`} className="flex-1 text-center">
                  {d.count}
                </span>
              ))}
            </div>
          </div>

          {/* 5 Weekly Circular Efficiency Gauges */}
          <div className={`grid grid-cols-5 gap-1 sm:gap-2 pt-2 sm:pt-2.5 border-t ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}>
            {weeksSummary.map((w) => {
              const radius = 18;
              const circ = 2 * Math.PI * radius;
              const offset = circ - (w.efficiency / 100) * circ;

              return (
                <div key={w.week} className="flex flex-col items-center text-center group">
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                    <svg className="w-12 h-12 sm:w-14 sm:h-14 transform -rotate-90" viewBox="0 0 48 48">
                      <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        className={isDarkMode ? 'stroke-slate-800' : 'stroke-slate-200'}
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke={w.color}
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out group-hover:stroke-width-4"
                      />
                    </svg>
                    <span className={`absolute text-[10px] sm:text-xs font-black font-mono ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {w.efficiency.toFixed(1)}%
                    </span>
                  </div>
                  <span className={`text-[8px] sm:text-[9px] font-serif-title italic font-bold mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-black'}`}>
                    Wk {w.week}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Right: Top 10 Habits / Activities Ranked Leaderboard */}
        <div className={`dashboard-leaderboard lg:col-span-3 flex flex-col justify-between rounded-2xl border p-3.5 sm:p-4.5 shadow-sm min-h-[340px] sm:min-h-[380px] transition-all duration-300 ${
          isDarkMode ? 'bg-[#121826]/90 border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between pb-2 sm:pb-2.5 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-black'}`}>
                TOP 10 HABITS
              </span>
            </div>
            <span className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full font-mono ${
              isDarkMode ? 'bg-amber-950/70 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-900 border border-amber-300/50'
            }`}>
              Ranked
            </span>
          </div>

          {/* Table Header */}
          <div className={`flex items-center justify-between text-[8px] sm:text-[9px] font-serif-title italic font-black px-2.5 py-1 sm:py-1.5 rounded-lg mt-2 sm:mt-2.5 border ${
            isDarkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-black'
          }`}>
            <span>daily habit</span>
            <span>progress</span>
          </div>

          {/* Habits Ranked List */}
          <div className="space-y-1 sm:space-y-1.5 my-2 sm:my-2.5 flex-1 overflow-y-auto max-h-[160px] sm:max-h-[175px] pr-1">
            {topHabits.slice(0, 10).map((h) => {
              const rankBadge = h.rank === 1 ? '🥇' : h.rank === 2 ? '🥈' : h.rank === 3 ? '🥉' : `${h.rank}`;

              return (
                <div key={h.name} className={`flex items-center justify-between text-xs py-1 px-1 rounded transition-colors ${
                  isDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-1.5 sm:gap-2 truncate pr-1">
                    <span className={`text-[9px] sm:text-[10px] font-mono font-black w-4 text-center shrink-0 ${isDarkMode ? 'text-slate-300' : 'text-black'}`}>{rankBadge}</span>
                    <span className={`font-black text-[11px] sm:text-xs truncate ${isDarkMode ? 'text-slate-100' : 'text-black'}`}>
                      {h.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <div className={`w-10 sm:w-12 rounded-full h-1.5 overflow-hidden ${
                      isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                    }`}>
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, h.progressPct)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-mono font-black w-10 sm:w-11 text-right ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {h.progressPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtitle Footer */}
          <div className={`pt-2 sm:pt-2.5 border-t text-[9px] sm:text-[10px] text-center font-bold italic ${
            isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
          }`}>
            Over 100% on 0 habits — keep going! 🚀
          </div>
        </div>

      </div>
    </section>
  );
};
