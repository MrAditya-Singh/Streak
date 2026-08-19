import React from 'react';

import { UserProfile, ActivityItem } from '../types';
import { soundFx } from '../utils/audio';

interface DesktopFloatingWidgetProps {
  user: UserProfile;
  activities: ActivityItem[];
  onToggleActivity: (id: string) => void;
}

export const DesktopFloatingWidget: React.FC<DesktopFloatingWidgetProps> = ({
  user,
  activities,
  onToggleActivity,
}) => {
  const completedCount = activities.filter((a) => a.completed).length;
  const totalCount = activities.length;
  const efficiencyPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const quickItems = activities.slice(0, 4);

  return (
    <div
      className="w-full h-full p-3 rounded-2xl bg-black/90 border border-purple-500/40 text-white shadow-2xl backdrop-blur-xl flex flex-col justify-between select-none overflow-hidden"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Top Header Row (Draggable) */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg overflow-hidden bg-black p-0.5 border border-blue-500/40">
            <img src="/app-icon.png" alt="EffStreak" className="w-full h-full object-contain" />
          </div>
          <span className="text-[11px] font-black tracking-tight flex items-center gap-1">
            Eff<span className="text-duoGreen">Streak</span>
            <span className="text-[9px] text-purple-400 font-bold px-1 py-0.2 rounded bg-purple-500/20">
              Lv.{user.level}
            </span>
          </span>
        </div>

        {/* Live streak indicator */}
        <div className="flex items-center gap-1">
          <span className="text-xs animate-flame">🔥</span>
          <span className="text-xs font-black text-amber-400">{user.overallStreak}d</span>
          <span className="text-[10px] text-emerald-400 font-bold ml-1">{efficiencyPct}%</span>
        </div>
      </div>

      {/* Center 4 Quick Check Pills (Non-Draggable for Clicking) */}
      <div
        className="grid grid-cols-4 gap-1.5 my-1"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {quickItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.completed) soundFx.playUncheck();
              else soundFx.playCheck();
              onToggleActivity(item.id);
            }}
            className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${item.completed
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm'
                : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400'
              }`}
          >
            <span className="text-[9px] font-black truncate max-w-full">
              {item.id === 'leetcode' ? 'Leet' : item.id === 'codeforces' ? 'CF' : item.id === 'gfg' ? 'GFG' : 'GH'}
            </span>
            <span className="text-[11px] font-bold mt-0.5">
              {item.completed ? '✓' : '○'}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom Progress Bar */}
      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-white/5">
        <span className="font-semibold">
          {completedCount}/{totalCount} Completed
        </span>
        <span className="text-purple-300 font-bold">
          Knight • {user.currentXP} XP
        </span>
      </div>
    </div>
  );
};
