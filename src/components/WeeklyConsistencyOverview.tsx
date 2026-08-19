import React, { useState } from 'react';
import { Trophy } from 'lucide-react';

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
}

export const WeeklyConsistencyOverview: React.FC<WeeklyConsistencyOverviewProps> = ({
  daysData,
  weeksSummary,
  topHabits,
  isDarkMode,
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayColumnData | null>(null);

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

  return (
    <section className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 border transition-all duration-300 ${
      isDarkMode 
        ? 'bg-[#0f1422]/95 border-slate-800/80 text-white shadow-2xl backdrop-blur-md' 
        : 'bg-[#FCFBF8] border-[#E8E3D9] text-slate-900 shadow-sm'
    }`}>
      <div className="dashboard-weekly-grid grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        
        {/* 1. Left: Luxury Polaroid / Motivation Card */}
        <div className="dashboard-mantra-card lg:col-span-3 flex flex-col items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs group">
          <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden relative shadow-inner">
            <img
              src="/images/char_hero.jpg"
              alt="Focus Motivation"
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/90 dark:bg-black/70 text-slate-900 dark:text-white backdrop-blur-md shadow-xs">
              Daily Mantra
            </span>
          </div>

          <div className="text-center mt-3.5 px-2">
            <div className="font-serif-title italic font-bold text-base text-slate-900 dark:text-slate-100">
              I am ...
            </div>
            <p className="font-calligraphy italic text-sm text-slate-600 dark:text-slate-300 mt-1 leading-snug">
              Focused, intentional, and ready for the month ahead.
            </p>
          </div>
        </div>

        {/* 2. Center: 5-Week Grouped Bar Chart & Weekly Circular Efficiency Gauges */}
        <div className="dashboard-weekly-chart lg:col-span-6 flex flex-col justify-between space-y-4 p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 shadow-xs relative overflow-hidden">
          
          {/* Week Header Labels */}
          <div className="grid grid-cols-5 text-center text-xs font-serif-title italic font-bold border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <span className="text-blue-600 dark:text-blue-300">week 1</span>
            <span className="text-pink-600 dark:text-pink-300">week 2</span>
            <span className="text-teal-600 dark:text-teal-300">week 3</span>
            <span className="text-amber-600 dark:text-amber-300">week 4</span>
            <span className="text-purple-600 dark:text-purple-300">week 5</span>
          </div>

          {/* Daily 30 Bars with Hover Tooltips */}
          <div className="overflow-x-auto touch-pan-x pb-1 relative scroller-smooth">
            <div className="min-w-[420px] sm:min-w-[480px] h-34 flex items-end justify-between gap-1 pt-2">
              {daysData.map((d) => (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <div className="w-full bg-slate-100 dark:bg-slate-800/90 rounded-t-md h-26 flex items-end overflow-hidden p-0.5 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
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
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-lg border border-slate-700 shadow-lg pointer-events-none z-20">
                Day {hoveredDay.day}: {hoveredDay.count}/{hoveredDay.total} Habits ({hoveredDay.percentage}%)
              </div>
            )}

            {/* Percentage row under bars */}
            <div className="min-w-[480px] flex items-center justify-between text-[8px] font-mono font-bold text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
              {daysData.map((d) => (
                <span key={`pct-${d.day}`} className="flex-1 text-center truncate">
                  {d.percentage}%
                </span>
              ))}
            </div>

            {/* Count row under bars */}
            <div className="min-w-[480px] flex items-center justify-between text-[9px] font-mono font-black text-slate-800 dark:text-slate-200 pt-0.5">
              {daysData.map((d) => (
                <span key={`cnt-${d.day}`} className="flex-1 text-center">
                  {d.count}
                </span>
              ))}
            </div>
          </div>

          {/* 5 Weekly Circular Efficiency Gauges */}
          <div className="grid grid-cols-5 gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            {weeksSummary.map((w) => {
              const radius = 22;
              const circ = 2 * Math.PI * radius;
              const offset = circ - (w.efficiency / 100) * circ;

              return (
                <div key={w.week} className="flex flex-col items-center text-center group">
                  <div className="relative w-15 h-15 flex items-center justify-center">
                    <svg className="w-15 h-15 transform -rotate-90">
                      <circle
                        cx="30"
                        cy="30"
                        r={radius}
                        className="stroke-slate-200/80 dark:stroke-slate-800"
                        strokeWidth="4"
                        fill="transparent"
                      />
                      <circle
                        cx="30"
                        cy="30"
                        r={radius}
                        stroke={w.color}
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out group-hover:stroke-width-5"
                      />
                    </svg>
                    <span className="absolute text-xs font-black text-slate-900 dark:text-white font-mono">
                      {w.efficiency.toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-[9px] font-serif-title italic text-slate-500 mt-0.5">
                    Wk {w.week}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Right: Top 10 Habits / Activities Ranked Leaderboard */}
        <div className="dashboard-leaderboard lg:col-span-3 flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-4.5 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                TOP 10 HABITS
              </span>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              Ranked
            </span>
          </div>

          {/* Table Header */}
          <div className="flex items-center justify-between text-[9px] font-serif-title italic font-bold text-blue-700 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/60 px-2.5 py-1.5 rounded-lg mt-2.5">
            <span>daily habit</span>
            <span>progress</span>
          </div>

          {/* Habits Ranked List */}
          <div className="space-y-1.5 my-2.5 flex-1 overflow-y-auto max-h-[175px] pr-1">
            {topHabits.slice(0, 10).map((h) => {
              const rankBadge = h.rank === 1 ? '🥇' : h.rank === 2 ? '🥈' : h.rank === 3 ? '🥉' : `${h.rank}`;

              return (
                <div key={h.name} className="flex items-center justify-between text-xs py-1 px-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-2 truncate pr-1">
                    <span className="text-[10px] font-mono text-slate-400 w-4 text-center">{rankBadge}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                      {h.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 dark:bg-blue-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, h.progressPct)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 w-11 text-right">
                      {h.progressPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtitle Footer */}
          <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium italic">
            Over 100% on 0 habits — keep going! 🚀
          </div>
        </div>

      </div>
    </section>
  );
};
