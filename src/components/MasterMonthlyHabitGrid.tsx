import React, { useState } from 'react';
import { ActivityItem } from '../types';
import { soundFx } from '../utils/audio';
import { Check, Plus, Trash2, Flame, Calendar } from 'lucide-react';

interface HabitMonthlyMatrixProps {
  activities: ActivityItem[];
  matrixState: Record<string, boolean[]>; // habitId -> boolean array for 30 days
  onToggleMatrixCell: (habitId: string, dayIndex: number) => void;
  onAddHabit?: () => void;
  onDeleteHabit?: (id: string) => void;
  isDarkMode: boolean;
  daysInMonth?: number;
  todayDayNumber?: number;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const MasterMonthlyHabitGrid: React.FC<HabitMonthlyMatrixProps> = ({
  activities,
  matrixState,
  onToggleMatrixCell,
  onAddHabit,
  onDeleteHabit,
  isDarkMode,
  daysInMonth = 31,
  todayDayNumber = 18,
}) => {
  // Phase state: 1 (Days 1-15), 2 (Days 16-31), or 'all' (Days 1-31)
  const [phase, setPhase] = useState<1 | 2 | 'all'>(() => {
    return todayDayNumber <= 15 ? 1 : 2;
  });

  // Determine active start & end days
  const startDay = phase === 1 ? 1 : phase === 2 ? 16 : 1;
  const endDay = phase === 1 ? 15 : daysInMonth;
  const displayedDaysCount = endDay - startDay + 1;
  const displayedDays = Array.from({ length: displayedDaysCount }, (_, i) => startDay + i);

  // All week definitions
  const allWeekGroups = [
    { 
      name: 'week 1', start: 1, end: 7, 
      bg: isDarkMode ? 'bg-blue-950/80 border-blue-800' : 'bg-[#BFDBFE] border-blue-300', 
      text: isDarkMode ? 'text-blue-200' : 'text-blue-950' 
    },
    { 
      name: 'week 2', start: 8, end: 14, 
      bg: isDarkMode ? 'bg-pink-950/80 border-pink-800' : 'bg-[#FBCFE8] border-pink-300', 
      text: isDarkMode ? 'text-pink-200' : 'text-pink-950' 
    },
    { 
      name: 'week 3', start: 15, end: 21, 
      bg: isDarkMode ? 'bg-teal-950/80 border-teal-800' : 'bg-[#99F6E4] border-teal-300', 
      text: isDarkMode ? 'text-teal-200' : 'text-teal-950' 
    },
    { 
      name: 'week 4', start: 22, end: 28, 
      bg: isDarkMode ? 'bg-amber-950/80 border-amber-800' : 'bg-[#FEF08A] border-amber-300', 
      text: isDarkMode ? 'text-amber-200' : 'text-amber-950' 
    },
    { 
      name: 'week 5', start: 29, end: daysInMonth, 
      bg: isDarkMode ? 'bg-purple-950/80 border-purple-800' : 'bg-[#E9D5FF] border-purple-300', 
      text: isDarkMode ? 'text-purple-200' : 'text-purple-950' 
    },
  ];

  // Filter & clamp week groups to visible range
  const visibleWeekGroups = allWeekGroups
    .filter((w) => w.start <= endDay && w.end >= startDay)
    .map((w) => {
      const clampedStart = Math.max(w.start, startDay);
      const clampedEnd = Math.min(w.end, endDay);
      const span = clampedEnd - clampedStart + 1;
      return { ...w, span };
    });

  const getWeekIndex = (dayNum: number) => {
    if (dayNum <= 7) return 1;
    if (dayNum <= 14) return 2;
    if (dayNum <= 21) return 3;
    if (dayNum <= 28) return 4;
    return 5;
  };

  // Small Box Checkbox styling
  const getCheckboxStyle = (weekIndex: number, isChecked: boolean, isToday: boolean) => {
    if (!isChecked) {
      return isToday
        ? 'border-amber-500 bg-amber-100/60 dark:bg-amber-950/50 ring-2 ring-amber-400/50'
        : isDarkMode
          ? 'border-slate-700/80 bg-slate-900/90 hover:border-slate-500 hover:bg-slate-800'
          : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50';
    }

    switch (weekIndex) {
      case 1:
        return 'bg-[#3B82F6] border-[#2563EB] text-white shadow-xs'; // Blue
      case 2:
        return 'bg-[#EC4899] border-[#DB2777] text-white shadow-xs'; // Pink
      case 3:
        return 'bg-[#0D9488] border-[#0F766E] text-white shadow-xs'; // Teal
      case 4:
        return 'bg-[#F59E0B] border-[#D97706] text-white shadow-xs'; // Yellow
      case 5:
      default:
        return 'bg-[#9333EA] border-[#7E22CE] text-white shadow-xs'; // Purple
    }
  };

  const getWeekDayLetter = (dayNum: number) => {
    return WEEKDAYS[(dayNum - 1) % 7];
  };

  const totalCompletedCells = activities.reduce((acc, act) => {
    const days = matrixState[act.id] || [];
    return acc + days.filter(Boolean).length;
  }, 0);

  const totalPossibleCells = activities.length * daysInMonth;

  // Exact 1:1 CSS Grid template
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${displayedDaysCount}, minmax(26px, 1fr))`,
    columnGap: '4px',
  };

  return (
    <section className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 border transition-all duration-300 overflow-hidden ${
      isDarkMode 
        ? 'bg-[#0b0f19] border-slate-800 text-white shadow-2xl backdrop-blur-md' 
        : 'bg-[#FCFBF8] border-[#E2DDD3] text-[#0f172a] shadow-sm'
    }`}>
      {/* Top Header Row with Phase Toggle Switch */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h3 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Monthly Habit Consistency Matrix
          </h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
            isDarkMode 
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
              : 'bg-purple-100 text-purple-800 border-purple-200'
          }`}>
            August 2026
          </span>
        </div>

        {/* 2-Phase Segmented Switch: Phase 1 (1-15) vs Phase 2 (16-31) vs All (1-31) */}
        <div className={`flex flex-wrap items-center p-1 rounded-2xl border ${
          isDarkMode ? 'bg-[#121622] border-slate-800' : 'bg-slate-100 border-slate-200 shadow-xs'
        }`}>
          <button
            onClick={() => {
              soundFx.playClick();
              setPhase(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              phase === 1
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phase 1 (Days 1–15)
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setPhase(2);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              phase === 2
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phase 2 (Days 16–{daysInMonth})
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setPhase('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              phase === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({daysInMonth}d)
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto touch-pan-x scroller-smooth pb-2">
        <div className="min-w-[700px] sm:min-w-[780px] flex items-start gap-3">
        
        {/* ======================================================== */}
        {/* 1. LEFT COLUMN: DAILY HABITS                             */}
        {/* ======================================================== */}
        <div className={`w-52 shrink-0 space-y-1.5 sticky left-0 z-20 ${
          isDarkMode ? 'bg-[#0b0f19]' : 'bg-[#FCFBF8]'
        }`}>
          {/* Synchronized Header: EXACT Height h-[76px] */}
          <div className={`h-[76px] flex flex-col justify-between p-2.5 rounded-xl border shadow-xs ${
            isDarkMode 
              ? 'bg-[#182035] border-slate-700 text-white' 
              : 'bg-[#BFDBFE] border-blue-300 text-blue-950'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-serif-title font-black italic tracking-wider text-xs uppercase ${
                isDarkMode ? 'text-white' : 'text-blue-950'
              }`}>
                DAILY HABITS
              </span>
              {onAddHabit && (
                <button
                  onClick={onAddHabit}
                  title="Add new habit"
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    isDarkMode ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-blue-900/15 hover:bg-blue-900/25 text-blue-950'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className={`text-[10px] font-cold-mono font-bold tracking-tight ${
              isDarkMode ? 'text-slate-300' : 'text-blue-900'
            }`}>
              {activities.length} Habits Tracked
            </div>
          </div>

          {/* List of Habit Rows - EXACT Height h-8 */}
          <div className="space-y-1.5">
            {activities.map((act, idx) => (
              <div
                key={act.id}
                className={`h-8 flex items-center justify-between px-3 rounded-lg border transition-all group ${
                  isDarkMode 
                    ? 'bg-[#121826] border-slate-800 text-white hover:border-slate-700 hover:bg-[#1a2234]' 
                    : 'bg-white border-slate-300 text-[#0f172a] hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  <span className={`font-cold-mono text-[10px] font-black w-4 shrink-0 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className={`truncate font-cold font-bold text-xs tracking-tight ${
                    isDarkMode ? 'text-slate-100' : 'text-[#0f172a]'
                  }`}>
                    {act.name}
                  </span>
                </div>
                {onDeleteHabit && activities.length > 5 && (
                  <button
                    onClick={() => onDeleteHabit(act.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 p-0.5 transition-opacity cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. CENTER: PHASE 1 / PHASE 2 CHECKBOX GRID               */}
        {/* ======================================================== */}
        <div className="flex-1 shrink-0 space-y-1.5">
          {/* Synchronized Header: EXACT Height h-[76px] */}
          <div className="h-[76px] flex flex-col justify-between">
            {/* Week Banners Top Row (h-6) */}
            <div style={gridStyle} className="h-6 items-center">
              {visibleWeekGroups.map((w, idx) => (
                <div
                  key={`${w.name}-${idx}`}
                  style={{ gridColumn: `span ${w.span}` }}
                  className={`text-center text-[10px] font-serif-title italic font-black py-0.5 rounded-t-md border-t border-x shadow-2xs flex items-center justify-center truncate ${w.bg} ${w.text}`}
                >
                  {w.name}
                </div>
              ))}
            </div>

            {/* Weekday Letters Row (h-5) */}
            <div 
              style={gridStyle} 
              className={`h-5 items-center text-[9px] font-black ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {displayedDays.map((day) => (
                <div 
                  key={`weekday-${day}`} 
                  className={`text-center font-cold-mono flex items-center justify-center ${
                    day === todayDayNumber ? 'text-amber-500 font-black' : ''
                  }`}
                >
                  {getWeekDayLetter(day)}
                </div>
              ))}
            </div>

            {/* Day Numbers Row (h-6) */}
            <div 
              style={gridStyle} 
              className={`h-6 items-center text-[10px] font-cold-mono font-black border-b pb-0.5 ${
                isDarkMode ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-300'
              }`}
            >
              {displayedDays.map((day) => {
                const isToday = day === todayDayNumber;
                return (
                  <div
                    key={`num-${day}`}
                    className="flex items-center justify-center"
                  >
                    <span
                      className={`w-full max-w-[26px] h-5.5 flex items-center justify-center rounded-sm transition-all ${
                        isToday 
                          ? 'bg-amber-500 text-white font-black shadow-xs shadow-amber-500/40 scale-105' 
                          : 'text-center'
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Small Box Checkbox Rows */}
          <div className="space-y-1.5">
            {activities.map((act) => {
              const days = matrixState[act.id] || Array.from({ length: daysInMonth }, () => false);

              return (
                <div 
                  key={`matrix-row-${act.id}`} 
                  style={gridStyle}
                  className="h-8 items-center"
                >
                  {displayedDays.map((dayNum) => {
                    const i = dayNum - 1;
                    const isChecked = days[i] || false;
                    const isToday = dayNum === todayDayNumber;
                    const weekIdx = getWeekIndex(dayNum);
                    const chkStyle = getCheckboxStyle(weekIdx, isChecked, isToday);

                    return (
                      <div key={`cell-wrap-${act.id}-${dayNum}`} className="flex items-center justify-center">
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            onToggleMatrixCell(act.id, i);
                          }}
                          title={`Day ${dayNum} - ${act.name}: ${isChecked ? 'Completed' : 'Click to complete'}`}
                          className={`w-full max-w-[26px] h-6 rounded-sm border flex items-center justify-center transition-all cursor-pointer hover:scale-115 active:scale-90 ${chkStyle}`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3.5]" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. RIGHT TABLE: DAILY PROGRESS                           */}
        {/* ======================================================== */}
        <div className="w-64 shrink-0 space-y-1.5">
          {/* Synchronized Header: EXACT Height h-[76px] */}
          <div className={`h-[76px] flex flex-col justify-between p-2.5 rounded-xl border shadow-xs ${
            isDarkMode 
              ? 'bg-[#182035] border-slate-700 text-white' 
              : 'bg-[#BFDBFE] border-blue-300 text-blue-950'
          }`}>
            {/* Top row: Title & Completed Fraction */}
            <div className="flex items-center justify-between">
              <span className={`font-serif-title font-black italic tracking-wider text-xs uppercase ${
                isDarkMode ? 'text-white' : 'text-blue-950'
              }`}>
                DAILY PROGRESS
              </span>
              <span className={`text-[10px] font-cold-mono font-bold ${
                isDarkMode ? 'text-slate-300' : 'text-blue-900'
              }`}>
                {totalCompletedCells} / {totalPossibleCells} done
              </span>
            </div>

            {/* Bottom row: Column Headers */}
            <div className={`flex items-center justify-between text-[9px] font-serif-title italic font-black pt-1 border-t ${
              isDarkMode ? 'text-slate-300 border-slate-700' : 'text-blue-950 border-blue-300/80'
            }`}>
              <span className="w-6 text-center">goal</span>
              <span className="flex-1 text-center">percentage</span>
              <span className="w-10 text-center">count</span>
              <span className="w-9 text-right">streak</span>
            </div>
          </div>

          {/* Row per habit - EXACT Height h-8 */}
          <div className="space-y-1.5">
            {activities.map((act) => {
              const days = matrixState[act.id] || [];
              const doneCount = days.filter(Boolean).length;
              const goal = daysInMonth;
              const pct = Math.round((doneCount / goal) * 100);

              // Calculate longest streak
              let maxStreak = 0;
              let currentStreak = 0;
              for (const d of days) {
                if (d) {
                  currentStreak++;
                  if (currentStreak > maxStreak) maxStreak = currentStreak;
                } else {
                  currentStreak = 0;
                }
              }

              return (
                <div
                  key={`prog-row-${act.id}`}
                  className={`h-8 flex items-center justify-between px-2 rounded-lg border text-xs font-cold-mono transition-all ${
                    isDarkMode 
                      ? 'bg-[#121826] border-slate-800 text-white' 
                      : 'bg-white border-slate-300 text-[#0f172a] shadow-2xs'
                  }`}
                >
                  {/* Goal */}
                  <span className={`w-6 text-center text-[10px] font-black ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>{goal}</span>

                  {/* Percentage Progress Bar */}
                  <div className="flex-1 px-1.5 flex items-center gap-1">
                    <span className={`text-[10px] font-black w-6 text-right ${
                      isDarkMode ? 'text-white' : 'text-[#0f172a]'
                    }`}>{pct}%</span>
                    <div className={`flex-1 rounded-full h-1.5 overflow-hidden ${
                      isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                    }`}>
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Count Fraction */}
                  <span className={`w-10 text-center text-[10px] font-black ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {doneCount}/{goal}
                  </span>

                  {/* Longest Streak */}
                  <span className="w-9 text-right text-[10px] font-black text-amber-500 dark:text-amber-400 flex items-center justify-end gap-0.5">
                    <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                    <span>{Math.max(act.streak || 0, maxStreak || 0)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </section>
);
};
