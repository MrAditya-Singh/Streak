import React from 'react';
import { ActivityItem } from '../types';
import { Check, Calendar } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface CircularPlanIconsProps {
  activities: ActivityItem[];
  onToggleActivity: (id: string) => void;
}

export const CircularPlanIcons: React.FC<CircularPlanIconsProps> = ({
  activities,
  onToggleActivity,
}) => {
  const completedCount = activities.filter((a) => a.completed).length;
  const totalCount = activities.length;

  const getPlatformIconContent = (item: ActivityItem) => {
    switch (item.id) {
      case 'leetcode':
        return <span className="text-[#ffa116] font-bold text-xs">&lt;/&gt;</span>;
      case 'codeforces':
        return <span className="text-[#1cb0f6] font-bold text-xs">CF</span>;
      case 'gfg':
        return <span className="text-[#4caf50] font-bold text-xs">&gt;=</span>;
      case 'github':
        return <span className="text-slate-800 dark:text-white font-bold text-xs">GH</span>;
      case 'gates':
        return <span className="text-blue-500 font-bold text-xs">📖</span>;
      case 'internship':
        return <span className="text-purple-500 font-bold text-xs">💼</span>;
      default:
        return <span className="text-emerald-500 font-bold text-xs">👥</span>;
    }
  };

  return (
    <div className="glass-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-600 dark:text-duoBlue" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">Today's Plan</h4>
        </div>
        <span className="text-xs font-extrabold text-purple-600 dark:text-duoGreenLight">
          {completedCount} / {totalCount} Done
        </span>
      </div>

      {/* Circular Platform List with Checkmarks */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto py-1">
        {activities.slice(0, 7).map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            onClick={() => {
              soundFx.playClick();
              onToggleActivity(item.id);
            }}
            className="flex flex-col items-center gap-1.5 cursor-pointer group min-w-[48px]"
          >
            <div className="relative">
              {/* Circular Icon Container */}
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                  item.completed
                    ? 'bg-emerald-50 border-emerald-400 dark:bg-[#15231c] dark:border-duoGreen/50 shadow-sm dark:shadow-glow-green/30'
                    : 'bg-slate-100 border-slate-200 dark:bg-[#161c27] dark:border-white/10 group-hover:border-slate-300 dark:group-hover:border-white/20'
                }`}
              >
                {getPlatformIconContent(item)}
              </div>

              {/* Status Badge below/over */}
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                  item.completed
                    ? 'bg-duoGreen text-black shadow-sm'
                    : 'bg-slate-200 border border-slate-300 dark:bg-[#1a2130] dark:border-white/20 text-transparent'
                }`}
              >
                {item.completed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : null}
              </div>
            </div>

            {/* Label */}
            <span
              className={`text-[10px] font-semibold truncate max-w-[55px] text-center ${
                item.completed ? 'text-slate-900 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500'
              }`}
            >
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
