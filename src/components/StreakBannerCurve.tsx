import React from 'react';
import { Star } from 'lucide-react';
import { DuoMascot } from './DuoMascot';

interface StreakBannerCurveProps {
  currentStreak: number;
  longestStreak: number;
}

export const StreakBannerCurve: React.FC<StreakBannerCurveProps> = ({
  currentStreak,
  longestStreak,
}) => {
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayIndex = new Date().getDay(); // 0 is Sunday, 6 is Saturday

  return (
    <div className="glass-card p-6 relative overflow-hidden bg-white dark:bg-gradient-to-r dark:from-[#171b26] dark:via-[#201826] dark:to-[#2d1b1f] border-slate-200 dark:border-orange-500/20 shadow-sm">
      {/* Decorative gradient particles */}
      <div className="absolute top-2 left-1/4 w-1.5 h-1.5 rounded-full bg-blue-400/80 animate-ping" />
      <div className="absolute top-4 right-1/3 w-1.5 h-1.5 rounded-full bg-pink-400/80 animate-pulse" />
      <div className="absolute top-3 right-1/6 w-1.5 h-1.5 rounded-full bg-yellow-400/80" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        {/* Left Side: Mascot + Streak text */}
        <div className="flex items-center gap-3.5">
          <DuoMascot size={64} mood="fire" className="animate-mascot" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentStreak}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Day Streak</h3>
            <p className="text-xs text-orange-500 dark:text-orange-400 font-bold flex items-center gap-1">
              You're on fire! 🔥
            </p>
          </div>
        </div>

        {/* Right Side: Graph with Best 97 & Days row */}
        <div className="flex flex-col items-end w-full md:w-auto">
          {/* Curve Visualization with Best Badge */}
          <div className="relative w-full max-w-[200px] h-14 mb-1">
            <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff4b4b" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#ff8800" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ffb020" stopOpacity="1" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Glowing trend curve */}
              <path
                d="M 10 48 Q 60 42 100 30 T 180 12"
                fill="none"
                stroke="url(#curveGradient)"
                strokeWidth="3.5"
                filter="url(#glow)"
                strokeLinecap="round"
              />

              {/* Peak Point on curve */}
              <circle cx="180" cy="12" r="5" fill="#ff9800" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* Best Badge */}
            <div className="absolute -top-1.5 right-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-black/60 border border-orange-200 dark:border-orange-500/40 text-[10px] font-bold text-orange-700 dark:text-orange-300 shadow-sm backdrop-blur-sm">
              <span>Best</span>
              <span className="text-slate-900 dark:text-white font-extrabold">{longestStreak}</span>
              <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            </div>
          </div>

          {/* Days of Week S M T W T F S row */}
          <div className="flex items-center justify-between w-full max-w-[200px] px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {daysOfWeek.map((day, idx) => {
              const isToday = idx === todayIndex;
              const isCompletedPast = idx < todayIndex || (idx === todayIndex && currentStreak > 0);

              return (
                <div
                  key={idx}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isToday
                      ? 'bg-streakOrange text-white shadow-glow-orange font-bold scale-110'
                      : isCompletedPast
                      ? 'text-slate-800 dark:text-slate-200 font-bold'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
