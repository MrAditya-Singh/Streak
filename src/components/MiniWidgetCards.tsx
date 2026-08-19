import React from 'react';
import { ExternalLink } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface MiniWidgetCardsProps {
  currentStreak: number;
  tasksDone: number;
  tasksLeft: number;
  efficiencyPct: number;
  onOpenSimulator: () => void;
}

export const MiniWidgetCards: React.FC<MiniWidgetCardsProps> = ({
  currentStreak,
  tasksDone: _tasksDone,
  tasksLeft: _tasksLeft,
  efficiencyPct,
  onOpenSimulator,
}) => {
  // Only API streak platforms
  const apiStreaks = [
    { name: 'Leet', streak: 42, active: true },
    { name: 'CF', streak: 18, active: true },
    { name: 'GFG', streak: 31, active: true },
    { name: 'GH', streak: 26, active: true },
    { name: 'AtC', streak: 14, active: false },
    { name: 'YT', streak: 12, active: false },
  ];

  return (
    <div className="space-y-3.5">
      {/* Sleek Compact API Streak Widget */}
      <div 
        onDoubleClick={() => {
          soundFx.playFlame();
          onOpenSimulator();
        }}
        onClick={() => {
          soundFx.playClick();
        }}
        title="Double-click to open full Widget Simulator"
        className="glass-card p-4 cursor-pointer hover:border-purple-500/60 transition-all group relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-[#0c101c] dark:via-[#050810] dark:to-[#0c101c] border-slate-200 dark:border-purple-500/30 shadow-sm dark:shadow-[0_0_20px_rgba(139,92,246,0.15)] rounded-2xl"
      >
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg overflow-hidden bg-black p-0.5 border border-purple-400">
              <img src="/app-icon.png" alt="EffStreak" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white tracking-wide flex items-center gap-1">
              STREAK WIDGET
            </span>
            <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
              LIVE API
            </span>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onOpenSimulator();
            }}
            className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-cyan-400 font-bold group-hover:underline"
          >
            <span>Simulator</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>

        {/* Top Overview: Overall Streak + API Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-flame">🔥</span>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white leading-none">{currentStreak} Days</div>
              <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Overall Active Streak</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{efficiencyPct}% Sync</span>
            <span className="text-[8px] text-purple-600 dark:text-purple-300 block font-bold">Solo Leveling B-Rank</span>
          </div>
        </div>

        {/* 6 Connected API Platform Streaks (Only API Streaks) */}
        <div className="grid grid-cols-3 gap-1.5">
          {apiStreaks.map((p) => (
            <div 
              key={p.name}
              className={`p-1.5 rounded-xl border flex items-center justify-between text-[10px] ${
                p.active 
                  ? 'bg-emerald-50 border-emerald-200 text-slate-900 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-white shadow-xs' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-white/5 dark:border-white/5 dark:text-slate-400'
              }`}
            >
              <span className="font-bold">{p.name}</span>
              <span className="font-black text-orange-600 dark:text-orange-400 flex items-center gap-0.5">
                🔥 {p.streak}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Hint */}
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400">
          <span>💡 Double-click to expand</span>
          <span className="text-purple-600 dark:text-cyan-400 font-bold">API Streaks Only</span>
        </div>
      </div>

      {/* Motivation Banner */}
      <div 
        onClick={() => soundFx.playFlame()}
        className="glass-card p-3 relative overflow-hidden bg-purple-50/50 dark:bg-gradient-to-br dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-black border-purple-200 dark:border-purple-500/20 cursor-pointer group rounded-2xl shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-black border border-purple-400/40 shrink-0">
            <img src="/images/char_github.jpg" alt="Motivation" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-snug">
              Every daily streak builds your Hunter Monarch status.
            </p>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[8px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                Cross-Platform Synced
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
