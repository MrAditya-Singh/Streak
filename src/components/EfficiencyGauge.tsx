import React from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';

interface EfficiencyGaugeProps {
  efficiencyPct: number;
  changeFromYesterday?: number;
  plannedMinutes?: number;
  completedMinutes?: number;
  onOpenEfficiencyAnalytics?: () => void;
}

export const EfficiencyGauge: React.FC<EfficiencyGaugeProps> = ({
  efficiencyPct,
  changeFromYesterday = 7,
  plannedMinutes = 300,
  completedMinutes = 240,
  onOpenEfficiencyAnalytics,
}) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, efficiencyPct)) / 100) * circumference;

  return (
    <div
      onClick={onOpenEfficiencyAnalytics}
      className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-300 group flex flex-col justify-between cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2.5 border-b border-slate-100">
        <h3 className="text-sm font-black text-[#0f172a] group-hover:text-purple-700 transition-colors">
          Efficiency Performance
        </h3>
        <span className="text-xs font-bold text-purple-700 hover:text-purple-900 group-hover:underline flex items-center gap-0.5">
          Day • Month • Year →
        </span>
      </div>

      {/* Main Row: Circular Ring + Stats */}
      <div className="flex items-center gap-5 my-auto py-1">
        {/* Circular Gauge Ring */}
        <div className="relative w-22 h-22 flex items-center justify-center flex-shrink-0">
          <svg className="w-22 h-22 transform -rotate-90">
            <defs>
              <linearGradient id="efficiencyGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <circle
              cx="44"
              cy="44"
              r={radius}
              className="stroke-slate-100"
              strokeWidth="7"
              fill="transparent"
            />
            {/* Progress Stroke */}
            <circle
              cx="44"
              cy="44"
              r={radius}
              stroke="url(#efficiencyGradientLight)"
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.25))' }}
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-[#0f172a] tracking-tight font-mono">
              {efficiencyPct}%
            </span>
          </div>
        </div>

        {/* Stats & Motivation */}
        <div className="flex flex-col justify-center space-y-0.5">
          <div className="flex items-center gap-1 text-emerald-700 font-black text-sm">
            <TrendingUp className="w-4 h-4 stroke-[3]" />
            <span>↑ {changeFromYesterday}%</span>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            from yesterday
          </span>

          <div className="flex items-center gap-1 text-xs text-[#0f172a] font-bold pt-0.5">
            <span>Great work!</span>
            <span className="text-xs">🚀</span>
          </div>
        </div>
      </div>

      {/* Mascot Quote Pill */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900">
        <span className="text-sm">🦉</span>
        <span className="font-semibold truncate">Focus fuels progress.</span>
        <Sparkles className="w-3.5 h-3.5 text-purple-600 ml-auto flex-shrink-0" />
      </div>
    </div>
  );
};
