import React from 'react';
import { ActivityItem } from '../types';
import { soundFx } from '../utils/audio';
import { ExternalLink, Flame, CheckCircle2, Sparkles, Zap, ArrowUpRight } from 'lucide-react';

interface PlatformCardsGridProps {
  activities: ActivityItem[];
}

interface PlatformMeta {
  image: string;
  tag: string;
  tagBg: string;
  neonGlow: string;
  accentColor: string;
  categoryDesc: string;
}

const PLATFORM_META: Record<string, PlatformMeta> = {
  leetcode: {
    image: '/images/char_leetcode.jpg',
    tag: '#CODEHUNTER',
    tagBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-amber-500/20',
    neonGlow: 'group-hover:border-amber-400 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.35)]',
    accentColor: 'text-amber-400',
    categoryDesc: 'Daily POTD & Problem Solves',
  },
  codeforces: {
    image: '/images/char_codeforces.jpg',
    tag: '#GRANDMASTER',
    tagBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-cyan-500/20',
    neonGlow: 'group-hover:border-cyan-400 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]',
    accentColor: 'text-cyan-400',
    categoryDesc: 'Contests & Rating Arena',
  },
  gfg: {
    image: '/images/char_gfg.jpg',
    tag: '#DSAEXPERT',
    tagBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-emerald-500/20',
    neonGlow: 'group-hover:border-emerald-400 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.35)]',
    accentColor: 'text-emerald-400',
    categoryDesc: 'Practice & Algorithmic Track',
  },
  github: {
    image: '/images/char_github.jpg',
    tag: '#OPENSOURCE',
    tagBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40 shadow-purple-500/20',
    neonGlow: 'group-hover:border-purple-400 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.35)]',
    accentColor: 'text-purple-400',
    categoryDesc: 'Commits & Repo Activity',
  },
  youtube: {
    image: '/images/char_youtube.jpg',
    tag: '#CONTENTKING',
    tagBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40 shadow-rose-500/20',
    neonGlow: 'group-hover:border-rose-400 group-hover:shadow-[0_0_30px_rgba(244,63,94,0.35)]',
    accentColor: 'text-rose-400',
    categoryDesc: 'Video Stream & Feed Updates',
  },
  atcoder: {
    image: '/images/char_hero.jpg',
    tag: '#ATCODER',
    tagBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40 shadow-indigo-500/20',
    neonGlow: 'group-hover:border-indigo-400 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.35)]',
    accentColor: 'text-indigo-400',
    categoryDesc: 'Weekly Contest Solves',
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
            className={`group relative h-64 sm:h-72 rounded-3xl overflow-hidden border border-slate-700/60 shadow-lg transition-all duration-500 hover:-translate-y-1.5 cursor-pointer select-none ${meta.neonGlow}`}
          >
            {/* 1. FULL-BLEED BACKGROUND IMAGE WITH HIGH BRIGHTNESS & ZOOM EFFECT */}
            <img
              src={meta.image}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover object-top filter brightness-125 contrast-105 saturate-110 transform group-hover:scale-105 group-hover:brightness-135 transition-all duration-700 ease-out"
            />

            {/* 2. LIGHT GRADIENT OVERLAY (HIGH CLARITY & BRIGHT VISIBILITY) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060813]/90 via-[#0b0f19]/30 to-transparent transition-opacity duration-300 group-hover:via-[#0b0f19]/20" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

            {/* 3. FLOATING TOP BAR: HOLOGRAPHIC TAG & EXTERNAL LINK */}
            <div className="relative z-10 p-4 flex items-center justify-between">
              <span className={`px-3 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase border backdrop-blur-md shadow-md ${meta.tagBg}`}>
                {meta.tag}
              </span>

              <div className="w-8 h-8 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white/80 group-hover:text-white group-hover:bg-white/20 group-hover:border-white/30 flex items-center justify-center transition-all duration-300 shadow-sm">
                <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>

            {/* 4. BOTTOM FLOATING CONTENT: TITLE, STREAK & LIVE STATUS */}
            <div className="absolute bottom-0 inset-x-0 p-4 z-10 space-y-2.5">
              
              {/* Platform Title + Live Dot */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black text-white tracking-wide flex items-center gap-1.5 drop-shadow-md">
                    <span>{item.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  </h4>
                  <p className="text-[11px] font-medium text-slate-300/90 drop-shadow-sm">
                    {meta.categoryDesc}
                  </p>
                </div>

                {/* Cloud Verified Badge */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Streak Counter & Daily Status Pill */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                {/* Flame Streak Pill */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 shadow-inner">
                  <Flame className={`w-4 h-4 ${item.streak > 0 ? 'text-amber-400 animate-flame' : 'text-slate-400'}`} />
                  <span className="text-base font-black text-white font-mono leading-none">
                    {item.streak || 0}
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    Days
                  </span>
                </div>

                {/* Status Indicator */}
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wide uppercase border backdrop-blur-md ${
                  item.completed
                    ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-white/10 text-slate-300 border-white/15'
                }`}>
                  {item.completed ? '✓ Active Today' : 'Pending Today'}
                </span>
              </div>

            </div>

            {/* 5. TOP SUBTLE NEON LIGHT HIGHLIGHT */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        );
      })}
    </div>
  );
};
