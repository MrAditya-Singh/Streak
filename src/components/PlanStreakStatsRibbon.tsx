import React from 'react';
import { UserProfile } from '../types';
import { Shield, Flame, Sparkles, Snowflake, CheckCircle2 } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface PlanStreakStatsRibbonProps {
  user: UserProfile;
  totalTasks: number;
  completedTasks: number;
  onFreezeStreak?: () => void;
}

export const PlanStreakStatsRibbon: React.FC<PlanStreakStatsRibbonProps> = ({
  user,
  totalTasks,
  completedTasks,
  onFreezeStreak,
}) => {
  const isAllDone = totalTasks > 0 && completedTasks === totalTasks;
  const xpPct = Math.min(100, Math.round((user.currentXP / user.xpToNextLevel) * 100));

  const handleFreeze = () => {
    if (user.currentXP >= 500 && onFreezeStreak) {
      soundFx.playCheck();
      onFreezeStreak();
    } else {
      soundFx.playUncheck();
    }
  };

  return (
    <div className="rounded-3xl p-5 bg-white border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
      
      {/* 1. Level & Hunter Rank Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-[#0f172a]">
                Level {user.level}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                {user.hunterRank}-Rank
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              1 Month Consistency = Level +1
            </p>
          </div>
        </div>

        {/* Freeze Streak Protection Button */}
        <button
          onClick={handleFreeze}
          title="Freeze streak if broken (Costs 500 XP)"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <Snowflake className="w-3.5 h-3.5 text-cyan-600" />
          <span>Freeze (500 XP)</span>
        </button>
      </div>

      {/* 2. Streak Progress & Daily Habit Counter */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-gradient-to-r from-amber-50/70 to-orange-50/50 border border-amber-200/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black shadow-xs">
            <Flame className={`w-4 h-4 ${isAllDone ? 'text-amber-500 animate-bounce' : 'text-amber-600'}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-[#0f172a] font-mono">
                {user.overallStreak}
              </span>
              <span className="text-xs font-black text-amber-900">
                Day Plan Streak
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-semibold">
              {isAllDone ? '✓ All daily plan tasks completed!' : `${completedTasks}/${totalTasks} habits done today`}
            </p>
          </div>
        </div>

        {isAllDone ? (
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        ) : (
          <span className="text-[10px] font-bold text-amber-800 bg-white/80 px-2 py-0.5 rounded-lg border border-amber-200 font-mono">
            {Math.round((completedTasks / Math.max(1, totalTasks)) * 100)}%
          </span>
        )}
      </div>

      {/* 3. XP Progression Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-600 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> XP Progress
          </span>
          <span className="font-mono font-black text-purple-900 text-xs">
            {user.currentXP} <span className="text-slate-400 font-normal">/ {user.xpToNextLevel} XP</span>
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 transition-all duration-500 shadow-sm"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

    </div>
  );
};
