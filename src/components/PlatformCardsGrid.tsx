import React from 'react';
import { ActivityItem } from '../types';
import { soundFx } from '../utils/audio';
import { ExternalLink } from 'lucide-react';

interface PlatformCardsGridProps {
  activities: ActivityItem[];
}

interface PlatformMeta {
  image: string;
  tag: string;
  badgeBg: string;
  borderColor: string;
}

const PLATFORM_META: Record<string, PlatformMeta> = {
  leetcode: {
    image: '/images/char_leetcode.jpg',
    tag: '#CodeHunter',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    borderColor: 'hover:border-amber-400',
  },
  codeforces: {
    image: '/images/char_codeforces.jpg',
    tag: '#Grandmaster',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-200',
    borderColor: 'hover:border-blue-400',
  },
  gfg: {
    image: '/images/char_gfg.jpg',
    tag: '#DSAExpert',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    borderColor: 'hover:border-emerald-400',
  },
  github: {
    image: '/images/char_github.jpg',
    tag: '#OpenSource',
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
    borderColor: 'hover:border-purple-400',
  },
  atcoder: {
    image: '/images/char_hero.jpg',
    tag: '#AtCoder',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    borderColor: 'hover:border-indigo-400',
  },
  hackerrank: {
    image: '/images/char_hero.jpg',
    tag: '#HackerRank',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    borderColor: 'hover:border-emerald-400',
  },
  youtube: {
    image: '/images/char_youtube.jpg',
    tag: '#ContentKing',
    badgeBg: 'bg-red-100 text-red-900 border-red-200',
    borderColor: 'hover:border-red-400',
  },
  projects: {
    image: '/images/char_hero.jpg',
    tag: '#FullStack',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    borderColor: 'hover:border-amber-400',
  },
};

export const PlatformCardsGrid: React.FC<PlatformCardsGridProps> = ({ activities }) => {
  const showcaseIds = ['leetcode', 'codeforces', 'gfg', 'github', 'youtube', 'projects'];
  const showcaseCards = showcaseIds
    .map((id) => activities.find((a) => a.id === id))
    .filter(Boolean) as ActivityItem[];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
      {showcaseCards.map((item) => {
        const meta = PLATFORM_META[item.id] || {
          image: '/images/char_hero.jpg',
          tag: '#Streak',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          borderColor: 'hover:border-emerald-400',
        };

        return (
          <div
            key={item.id}
            onClick={() => {
              soundFx.playClick();
              if (item.url) {
                window.open(item.url, '_blank');
              }
            }}
            className={`p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between items-center text-center group relative overflow-hidden transition-all hover:scale-[1.02] shadow-sm hover:shadow-md cursor-pointer ${meta.borderColor}`}
          >
            {/* External link launcher icon */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-4 h-4 text-slate-400 hover:text-slate-700" />
            </div>

            {/* Platform Tag Badge */}
            <div className="w-full flex items-center justify-between mb-2">
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${meta.badgeBg}`}>
                {meta.tag}
              </span>
            </div>

            {/* Character Artwork Circular Image */}
            <div className="relative my-1.5">
              <div className="w-15 h-15 rounded-full p-0.5 bg-gradient-to-tr from-purple-400 via-indigo-400 to-amber-300 group-hover:scale-110 transition-transform shadow-xs overflow-hidden">
                <img
                  src={meta.image}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            {/* Platform Name - High Contrast */}
            <h4 className="text-sm font-black text-[#0f172a] mt-1">
              {item.name}
            </h4>

            {/* Streak Indicator */}
            <div className="mt-1 flex items-center gap-1">
              <span className="text-sm animate-flame">🔥</span>
              <span className="text-xl font-black text-[#0f172a] font-mono">{item.streak}</span>
            </div>

            <span className="text-xs text-slate-500 font-bold mt-0.5">Day Streak</span>
          </div>
        );
      })}
    </div>
  );
};
