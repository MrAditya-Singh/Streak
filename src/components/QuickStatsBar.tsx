import React from 'react';
import { Clock, Target, Zap, Flame, TrendingUp } from 'lucide-react';
import { DailySummary, UserProfile } from '../types';

interface QuickStatsBarProps {
  summary: DailySummary;
  user: UserProfile;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ summary, user }) => {
  const hours = Math.floor(summary.completedMinutes / 60);
  const minutes = summary.completedMinutes % 60;
  const focusTimeFormatted = `${hours}h ${minutes}m`;

  return (
    <div className="p-4 rounded-3xl bg-white border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3.5 shadow-sm">
      {/* 1. Focus Time */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Focus Time</span>
        </div>
        <span className="text-xl sm:text-2xl font-black text-[#0f172a] font-mono">{focusTimeFormatted}</span>
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
          <TrendingUp className="w-3 h-3 stroke-[3]" />
          <span>↑ 12%</span>
        </div>
      </div>

      {/* 2. Tasks Done */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1">
          <Target className="w-4 h-4 text-red-600" />
          <span>Tasks Done</span>
        </div>
        <span className="text-xl sm:text-2xl font-black text-[#0f172a] font-mono">
          {summary.tasksCompleted} / {summary.totalTasks}
        </span>
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
          <TrendingUp className="w-3 h-3 stroke-[3]" />
          <span>↑ 1</span>
        </div>
      </div>

      {/* 3. XP Earned */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1">
          <Zap className="w-4 h-4 text-amber-600 fill-amber-500/20" />
          <span>XP Earned</span>
        </div>
        <span className="text-xl sm:text-2xl font-black text-[#0f172a] font-mono">{summary.xpEarnedToday}</span>
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
          <TrendingUp className="w-3 h-3 stroke-[3]" />
          <span>↑ 40</span>
        </div>
      </div>

      {/* 4. Current Streak */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mb-1">
          <Flame className="w-4 h-4 text-orange-600 fill-orange-500/20 animate-flame" />
          <span>Current Streak</span>
        </div>
        <span className="text-xl sm:text-2xl font-black text-[#0f172a] font-mono">{user.overallStreak} Days</span>
        <div className="flex items-center gap-1 text-[11px] font-extrabold text-orange-700 mt-1">
          <span>🔥 Amazing!</span>
        </div>
      </div>
    </div>
  );
};
