import React from 'react';
import { TrendingUp, Sparkles, Activity, Clock, Zap } from 'lucide-react';

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
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, efficiencyPct)) / 100) * circumference;

  return (
    <div
      onClick={onOpenEfficiencyAnalytics}
      className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-300 group flex flex-col justify-between cursor-pointer"
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0f172a] group-hover:text-purple-700 transition-colors">
              Efficiency Performance
            </h3>
          </div>
        </div>
        <span className="text-[11px] font-bold text-purple-700 group-hover:underline flex items-center gap-0.5">
          Day • Month • Year →
        </span>
      </div>

      {/* Compact Row: Ring + Metric Stats */}
      <div className="flex items-center justify-around gap-4 py-3 my-auto">
        {/* Compact Circular Ring */}
        <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
          <svg className="w-20 h-20 transform -rotate-90">
            <defs>
              <linearGradient id="effCompactGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-slate-100"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="url(#effCompactGrad)"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))' }}
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-[#0f172a] font-mono leading-none">
              {efficiencyPct}%
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">SCORE</span>
          </div>
        </div>

        {/* Compact Side Stats */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Delta
            </span>
            <span className="font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-mono text-[11px]">
              ↑ {changeFromYesterday}%
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Focus Time
            </span>
            <span className="font-bold text-slate-700 font-mono text-[11px]">
              {Math.round(completedMinutes / 60)}h / {Math.round(plannedMinutes / 60)}h
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Target
            </span>
            <span className="font-black text-purple-700 text-[11px]">≥85% Optimal</span>
          </div>
        </div>
      </div>

      {/* Mascot Footer Pill */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-900 bg-purple-50/70 px-3 py-1.5 rounded-xl">
        <span className="font-semibold truncate flex items-center gap-1">
          <span>🦉</span> Focus fuels progress.
        </span>
        <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
      </div>
    </div>
  );
};
