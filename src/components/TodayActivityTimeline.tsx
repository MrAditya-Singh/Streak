import React from 'react';
import type { ActivityLogEntry, ActivityItem } from '../types';
import { Check, Clock } from 'lucide-react';

interface TodayActivityTimelineProps {
  logs?: ActivityLogEntry[];
  activities?: ActivityItem[];
  onOpenAll: () => void;
}

export const TodayActivityTimeline: React.FC<TodayActivityTimelineProps> = ({
  logs = [],
  activities = [],
  onOpenAll,
}) => {
  const displayItems = React.useMemo(() => {
    if (activities.length > 0) {
      const primaryKeys = ['leetcode', 'github', 'codeforces', 'gate', 'youtube'];
      const matched = primaryKeys
        .map((key) => activities.find((a) => a.id === key || a.id.toLowerCase().includes(key)))
        .filter(Boolean) as ActivityItem[];

      const remaining = activities.filter((a) => !matched.includes(a));
      const combined = [...matched, ...remaining].slice(0, 5);

      return combined.map((act) => {
        const log = logs.find((l) => l.activityId === act.id);
        const time = act.completedAt || log?.timeStr || act.scheduledTime || '12:00';
        return {
          id: act.id,
          name: act.name,
          timeStr: time,
          completed: act.completed,
        };
      });
    }

    return logs.slice(0, 5).map((l) => ({
      id: l.activityId,
      name: l.activityName,
      timeStr: l.timeStr,
      completed: l.completed,
    }));
  }, [activities, logs]);

  return (
    <div
      onClick={onOpenAll}
      className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-300 group flex flex-col justify-between cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black text-[#0f172a] group-hover:text-purple-700 transition-colors">
            Today's Activity
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            12 AM – 12 PM
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenAll();
          }}
          className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline transition-colors flex items-center gap-0.5 cursor-pointer"
        >
          View All →
        </button>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-1.5 my-auto">
        {displayItems.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            {/* Timestamp + Activity Name */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-500 font-bold text-xs">
                {item.timeStr}
              </span>
              <span className={`font-bold transition-colors ${
                item.completed
                  ? 'text-[#0f172a]'
                  : 'text-slate-400'
              }`}>
                {item.name}
              </span>
            </div>

            {/* Status Checkmark / Circle */}
            <div className="flex items-center justify-center">
              {item.completed ? (
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sub-bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          Click to inspect all timestamps
        </span>
        <span className="font-bold text-purple-800 font-mono">
          {displayItems.filter(i => i.completed).length}/{displayItems.length} Done
        </span>
      </div>
    </div>
  );
};
