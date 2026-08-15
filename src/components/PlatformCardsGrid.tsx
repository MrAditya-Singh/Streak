import React from 'react';
import { ActivityItem } from '../types';
import { soundFx } from '../utils/audio';
import { ExternalLink, Flame, CheckCircle2, Globe, Sparkles } from 'lucide-react';

interface PlatformCardsGridProps {
  activities: ActivityItem[];
}

interface PlatformMeta {
  image: string;
  tag: string;
  badgeBg: string;
  ringColor: string;
  bgGradient: string;
  statsLabel: string;
}

const PLATFORM_META: Record<string, PlatformMeta> = {
  leetcode: {
    image: '/images/char_leetcode.jpg',
    tag: '#CODEHUNTER',
    badgeBg: 'bg-amber-500/15 text-amber-900 border-amber-300 dark:text-amber-300 dark:border-amber-500/30',
    ringColor: 'ring-amber-400',
    bgGradient: 'from-amber-500/10 via-white to-orange-500/5',
    statsLabel: 'Algorithms & Daily POTD',
  },
  codeforces: {
    image: '/images/char_codeforces.jpg',
    tag: '#GRANDMASTER',
    badgeBg: 'bg-blue-500/15 text-blue-900 border-blue-300 dark:text-blue-300 dark:border-blue-500/30',
    ringColor: 'ring-blue-400',
    bgGradient: 'from-blue-500/10 via-white to-cyan-500/5',
    statsLabel: 'Contest Submissions',
  },
  gfg: {
    image: '/images/char_gfg.jpg',
    tag: '#DSAEXPERT',
    badgeBg: 'bg-emerald-500/15 text-emerald-900 border-emerald-300 dark:text-emerald-300 dark:border-emerald-500/30',
    ringColor: 'ring-emerald-400',
    bgGradient: 'from-emerald-500/10 via-white to-teal-500/5',
    statsLabel: 'Practice & POTD Solved',
  },
  github: {
    image: '/images/char_github.jpg',
    tag: '#OPENSOURCE',
    badgeBg: 'bg-purple-500/15 text-purple-900 border-purple-300 dark:text-purple-300 dark:border-purple-500/30',
    ringColor: 'ring-purple-400',
    bgGradient: 'from-purple-500/10 via-white to-indigo-500/5',
    statsLabel: 'Commits & Contributions',
  },
  youtube: {
    image: '/images/char_youtube.jpg',
    tag: '#CONTENTKING',
    badgeBg: 'bg-rose-500/15 text-rose-900 border-rose-300 dark:text-rose-300 dark:border-rose-500/30',
    ringColor: 'ring-rose-400',
    bgGradient: 'from-rose-500/10 via-white to-pink-500/5',
    statsLabel: 'Video Feed & Creator Activity',
  },
  atcoder: {
    image: '/images/char_hero.jpg',
    tag: '#ATCODER',
    badgeBg: 'bg-indigo-500/15 text-indigo-900 border-indigo-300 dark:text-indigo-300 dark:border-indigo-500/30',
    ringColor: 'ring-indigo-400',
    bgGradient: 'from-indigo-500/10 via-white to-violet-500/5',
    statsLabel: 'Weekly Contest Solves',
  },
};

export const PlatformCardsGrid: React.FC<PlatformCardsGridProps> = ({ activities }) => {
  const showcaseIds = ['leetcode', 'codeforces', 'gfg', 'github', 'youtube', 'atcoder'];
  const showcaseCards = showcaseIds
    .map((id) => activities.find((a) => a.id === id || a.id.toLowerCase().includes(id)))
    .filter(Boolean) as ActivityItem[];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {showcaseCards.map((item) => {
        const meta = PLATFORM_META[item.id] || PLATFORM_META['leetcode'];

        return (
          <div
            key={item.id}
            onClick={() => {
              soundFx.playClick();
              if (item.url) {
                window.open(item.url, '_blank');
              }
            }}
            className={`p-4 rounded-3xl bg-gradient-to-br ${meta.bgGradient} border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col justify-between cursor-pointer relative overflow-hidden`}
          >
            {/* Top Row: Tag Badge + External Launcher */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${meta.badgeBg}`}>
                {meta.tag}
              </span>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 group-hover:text-purple-600 font-bold transition-colors">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">Open Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Middle Row: Professionally Framed Picture + Platform Title + Stats */}
            <div className="flex items-center gap-3.5 my-1">
              {/* Picture Frame with Glowing Ring */}
              <div className="relative flex-shrink-0">
                <div className={`w-14 h-14 rounded-2xl overflow-hidden ring-2 ${meta.ringColor} shadow-md group-hover:scale-105 transition-transform duration-300 bg-slate-900`}>
                  <img
                    src={meta.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
              </div>

              {/* Title & Stats */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-slate-900 group-hover:text-purple-900 transition-colors truncate">
                  {item.name}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {meta.statsLabel}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Cloud Verified</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Streak Badge + Activity Status */}
            <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
              <div className="flex items-center gap-1 text-slate-800">
                <Flame className={`w-4 h-4 ${item.streak > 0 ? 'text-orange-500 animate-flame' : 'text-slate-400'}`} />
                <span className="font-mono font-black text-sm">{item.streak || 0}</span>
                <span className="text-[11px] font-bold text-slate-500">Days</span>
              </div>

              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md font-mono ${
                item.completed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {item.completed ? '✓ Done Today' : 'Pending Today'}
              </span>
            </div>

          </div>
        );
      })}
    </div>
  );
};
