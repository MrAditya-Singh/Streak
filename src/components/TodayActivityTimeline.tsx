import React, { useState } from 'react';
import type { ActivityLogEntry, ActivityItem } from '../types';
import { Check, Clock, Sparkles, Zap, User, Flame, CheckCircle2 } from 'lucide-react';

interface TodayActivityTimelineProps {
  logs?: ActivityLogEntry[];
  activities?: ActivityItem[];
  onToggleActivity?: (id: string) => void;
  onOpenAll: () => void;
}

export const TodayActivityTimeline: React.FC<TodayActivityTimelineProps> = ({
  logs = [],
  activities = [],
  onToggleActivity,
  onOpenAll,
}) => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const formattedItems = React.useMemo(() => {
    return activities.map((act) => {
      const log = logs.find((l) => l.activityId === act.id);
      const recordedTime = act.completedAt || log?.timeStr || (act.completed ? 'Just now' : 'Scheduled');
      const isAuto = act.isAutoDetected || log?.isAutoDetected || (typeof act.source === 'string' && act.source !== 'manual');

      return {
        id: act.id,
        name: act.name,
        category: act.category,
        timeStr: recordedTime,
        completed: act.completed,
        isAuto,
        streak: act.streak || 0,
        xpReward: act.xpReward || 20,
        eventCount: (act as any).eventCount || (act.completed ? 1 : 0),
        url: act.url,
      };
    });
  }, [activities, logs]);

  const filteredItems = React.useMemo(() => {
    if (filter === 'completed') return formattedItems.filter((i) => i.completed);
    if (filter === 'pending') return formattedItems.filter((i) => !i.completed);
    return formattedItems;
  }, [formattedItems, filter]);

  const completedCount = formattedItems.filter((i) => i.completed).length;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#0f172a] flex items-center gap-2">
              <span>Today's Activity & Live Timestamps</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time timestamp logged upon manual check or cloud sync
            </p>
          </div>
        </div>

        {/* Filter Pills & View All */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'all' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({activities.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'completed' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Done ({completedCount})
            </button>
          </div>

          <button
            onClick={onOpenAll}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline transition-colors flex items-center gap-0.5 cursor-pointer ml-1"
          >
            Details →
          </button>
        </div>
      </div>

      {/* Activity Timeline List (Scrollable, Clean, Spacious) */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onToggleActivity?.(item.id)}
            className={`p-3 rounded-2xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
              item.completed
                ? 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50/80 shadow-2xs'
                : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
            }`}
          >
            {/* Left: Checkbox + Timestamp + Habit Name */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                  item.completed
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'border-2 border-slate-300 hover:border-purple-400 bg-white'
                }`}
              >
                {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${item.completed ? 'text-slate-900' : 'text-slate-700'}`}>
                    {item.name}
                  </span>
                  
                  {/* Sync Source Badge */}
                  {item.isAuto ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-800 flex items-center gap-1 border border-blue-200/60">
                      <Zap className="w-2.5 h-2.5 text-blue-600" />
                      API Sync
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200/60 flex items-center gap-0.5">
                      <User className="w-2.5 h-2.5" />
                      Manual
                    </span>
                  )}
                </div>

                {/* Recorded Timestamp + Stats */}
                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                  <span className="font-mono text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded">
                    🕒 {item.timeStr}
                  </span>
                  {item.streak > 0 && (
                    <span className="text-orange-600 font-bold flex items-center gap-0.5">
                      <Flame className="w-3 h-3" /> {item.streak}d
                    </span>
                  )}
                  <span className="text-slate-400 font-mono text-[10px]">+{item.xpReward} XP</span>
                </div>
              </div>
            </div>

            {/* Right: Status Indicator */}
            <div className="flex items-center gap-2">
              {item.completed ? (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400">
                  Tap to tick
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Progress Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
        <span className="flex items-center gap-1.5 text-purple-700 font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          Today's Completion: {Math.round((completedCount / Math.max(1, activities.length)) * 100)}%
        </span>
        <span className="font-mono text-slate-700 font-black">
          {completedCount}/{activities.length} Habits
        </span>
      </div>

    </div>
  );
};
