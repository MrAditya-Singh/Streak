import React from 'react';
import { ActivityItem } from '../types';
import { soundFx } from '../utils/audio';

interface PlatformRingsProps {
  activities: ActivityItem[];
}

export const PlatformRings: React.FC<PlatformRingsProps> = ({ activities }) => {
  const ringIds = ['leetcode', 'codeforces', 'gfg', 'github', 'youtube'];
  const ringItems = ringIds.map((id) => activities.find((a) => a.id === id)).filter(Boolean) as ActivityItem[];

  const getRingColor = (id: string) => {
    switch (id) {
      case 'leetcode':
        return '#ffa116';
      case 'codeforces':
        return '#1cb0f6';
      case 'gfg':
        return '#2e7d32';
      case 'github':
        return '#ffffff';
      case 'youtube':
        return '#ff4b4b';
      default:
        return '#58cc02';
    }
  };

  return (
    <div className="glass-card p-4 flex items-center justify-around gap-2 overflow-x-auto">
      {ringItems.map((item) => {
        const color = getRingColor(item.id);
        const radius = 26;
        const circumference = 2 * Math.PI * radius;
        // Mock progress pct based on streak target
        const progress = Math.min(100, Math.max(20, (item.streak / 50) * 100));
        const strokeDashoffset = circumference - (progress / 100) * circumference;

        return (
          <div
            key={item.id}
            onClick={() => {
              soundFx.playClick();
              if (item.url) window.open(item.url, '_blank');
            }}
            className="flex flex-col items-center cursor-pointer group transition-transform hover:scale-105"
          >
            <div className="relative w-16 h-16 flex items-center justify-center">
              {/* Circular SVG Ring */}
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke={color}
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Icon/Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                {item.id === 'leetcode' && (
                  <span className="text-[#ffa116] font-bold text-xs">&lt;/&gt;</span>
                )}
                {item.id === 'codeforces' && (
                  <span className="text-[#1cb0f6] font-bold text-xs">CF</span>
                )}
                {item.id === 'gfg' && (
                  <span className="text-[#4caf50] font-bold text-xs">&gt;=</span>
                )}
                {item.id === 'github' && (
                  <span className="text-white font-bold text-xs">GH</span>
                )}
                {item.id === 'youtube' && (
                  <span className="text-[#ff4b4b] font-bold text-xs">▶</span>
                )}
              </div>
            </div>

            {/* Flame Streak pill below */}
            <div className="mt-1 flex items-center gap-0.5 text-xs font-black text-white">
              <span className="text-[10px] animate-flame">🔥</span>
              <span>{item.streak}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
