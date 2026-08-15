import React from 'react';
import { Flame, Bell, Settings, Shield, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { soundFx } from '../utils/audio';

interface StreakHeaderCardProps {
  user: UserProfile;
  onOpenSettings: () => void;
  onOpenSoloLeveling: () => void;
}

export const StreakHeaderCard: React.FC<StreakHeaderCardProps> = ({
  user,
  onOpenSettings,
  onOpenSoloLeveling,
}) => {
  const xpPercent = Math.min(100, Math.round((user.currentXP / user.xpToNextLevel) * 100));

  return (
    <div className="glass-card p-6 relative overflow-hidden flex flex-col justify-between group">
      {/* Background ambient flame glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-orange-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:from-orange-500/25 transition-all" />

      <div>
        {/* Top bar with Character Art & Streak Counter */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Anime Hero Character Artwork with Glowing Halo */}
            <div 
              className="relative cursor-pointer transition-transform hover:scale-105" 
              onClick={() => {
                soundFx.playFlame();
                onOpenSoloLeveling();
              }}
            >
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-purple-500 via-indigo-400 to-amber-400 shadow-lg shadow-purple-500/25">
                <div className="w-full h-full rounded-xl overflow-hidden bg-black relative">
                  <img 
                    src="/images/char_hero.jpg" 
                    alt="Shadow Monarch" 
                    className="w-full h-full object-cover animate-float" 
                  />
                </div>
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-purple-600 text-[10px] font-black text-white border border-purple-300 shadow">
                Lv.{user.level}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl animate-flame">🔥</span>
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white glow-orange-text">
                  {user.overallStreak}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-sm font-black tracking-wide text-slate-800 dark:text-slate-200">Day Streak</h2>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  ✦ Big future.
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                Keep going, {user.name}! You're doing amazing! 💪
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                soundFx.playCheck();
                alert(`🔥 Streak protected today! At least 1 coding session logged.`);
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/5 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all"
              title="Streak Status"
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenSettings();
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/5 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SoloLeveling RPG XP Progress Bar with Knight Badge */}
      <div
        className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/5 cursor-pointer group/xp"
        onClick={() => {
          soundFx.playClick();
          onOpenSoloLeveling();
        }}
      >
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200">
              Level {user.level} <span className="text-purple-600 dark:text-purple-400 font-semibold">• Knight</span>
            </span>
          </div>
          <span className="font-mono text-purple-600 dark:text-purple-300 font-bold">
            {user.currentXP.toLocaleString()} / {user.xpToNextLevel.toLocaleString()}{' '}
            <span className="text-purple-600 dark:text-purple-400 font-black">XP</span>
          </span>
        </div>

        {/* Progress bar container */}
        <div className="w-full h-3 bg-slate-100 dark:bg-black/60 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-purple-500/30">
          <div
            className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-400 rounded-full transition-all duration-700 shadow-glow-purple group-hover/xp:brightness-110"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
