import React from 'react';
import { UserProfile } from '../types';
import { Shield, Flame, Sparkles, Snowflake } from 'lucide-react';
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
    }
  };

  return (
    <div className="rounded-3xl p-5 transition-all duration-300 bg-white border border-slate-200 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        
        {/* 1. Level Section */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 shadow-xs">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-[#0f172a]">
                Level {user.level}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-900 border border-indigo-200">
                {user.hunterRank}-Rank
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              1 Month Consistency = Level 1
            </p>
          </div>
        </div>

        {/* 2. Middle Section */}
        <div className="flex items-center justify-between sm:justify-center gap-3 border-y sm:border-y-0 sm:border-x border-slate-100 py-2 sm:py-0 sm:px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
              <Flame className={`w-5 h-5 ${isAllDone ? 'text-amber-500 animate-bounce' : 'text-amber-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-[#0f172a] font-mono">
                  {user.overallStreak}
                </span>
                <span className="text-xs font-black text-amber-800">
                  Day Plan Streak
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">
                {isAllDone ? '✓ All daily plan tasks completed!' : `${completedTasks}/${totalTasks} tasks done today`}
              </p>
            </div>
          </div>

          {/* 500 XP Freeze Protection Button */}
          <button
            onClick={handleFreeze}
            title="Freeze streak if broken (Costs 500 XP)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100 transition-all cursor-pointer shadow-xs"
          >
            <Snowflake className="w-3.5 h-3.5 text-cyan-600" />
            <span>Freeze (500 XP)</span>
          </button>
        </div>

        {/* 3. Right Section */}
        <div className="space-y-1.5 sm:text-right">
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Daily + Emergency XP
            </span>
            <span className="text-xs font-black text-purple-800 font-mono">
              {user.currentXP} / {user.xpToNextLevel} XP
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
