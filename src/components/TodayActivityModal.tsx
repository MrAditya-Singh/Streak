import React, { useState } from 'react';
import { X, Clock, CheckCircle2, Circle, Sparkles, Calendar, Search, Filter, Check, Flame } from 'lucide-react';
import { ActivityLogEntry, ActivityItem } from '../types';
import { soundFx } from '../utils/audio';

interface TodayActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLogEntry[];
  activities: ActivityItem[];
  onToggleActivity?: (id: string) => void;
}

export const TodayActivityModal: React.FC<TodayActivityModalProps> = ({
  isOpen,
  onClose,
  logs,
  activities,
  onToggleActivity,
}) => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const completedActivities = activities.filter((a) => a.completed);
  const pendingActivities = activities.filter((a) => !a.completed);

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    if (filter === 'completed' && !act.completed) return false;
    if (filter === 'pending' && act.completed) return false;
    if (searchQuery.trim()) {
      return act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.category.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Sort chronologically by completion time / scheduled time
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    const timeA = a.completedAt || a.scheduledTime || '12:00';
    const timeB = b.completedAt || b.scheduledTime || '12:00';
    return timeA.localeCompare(timeB);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Today's Activity Timeline</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  12:00 AM – 12:00 PM Cycle
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Exact completion timestamps for all "PLAN" tasks on this day
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 border-b border-slate-800 text-center">
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Completed Today</div>
            <div className="text-lg font-black text-emerald-400">{completedActivities.length} Tasks</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Pending Tasks</div>
            <div className="text-lg font-black text-amber-400">{pendingActivities.length} Left</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Day Efficiency</div>
            <div className="text-lg font-black text-purple-400">
              {activities.length > 0 ? Math.round((completedActivities.length / activities.length) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row items-center gap-3 bg-slate-900">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto w-full sm:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex-1 sm:flex-initial ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All ({activities.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex-1 sm:flex-initial ${
                filter === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Done ({completedActivities.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex-1 sm:flex-initial ${
                filter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Pending ({pendingActivities.length})
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Chronological Task Completion Log
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              Click circle to mark completed
            </span>
          </div>

          {/* Activities List */}
          {sortedActivities.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No tasks match your search or filter.
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedActivities.map((activity) => {
                const matchedLog = logs.find((l) => l.activityId === activity.id);
                const completionTime = activity.completedAt || matchedLog?.timeStr || (activity.completed ? '09:15' : (activity.scheduledTime || 'Scheduled'));

                return (
                  <div
                    key={activity.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      activity.completed
                        ? 'bg-slate-800/70 border-emerald-500/30 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Interactive Status Circle */}
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          onToggleActivity?.(activity.id);
                        }}
                        title={activity.completed ? 'Mark pending' : 'Mark completed'}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all hover:scale-105 cursor-pointer ${
                          activity.completed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-purple-400'
                        }`}
                      >
                        {activity.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${activity.completed ? 'text-white' : 'text-slate-300'}`}>
                            {activity.name}
                          </span>
                          {activity.source !== 'manual' ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              ⚡ API Synced
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-slate-800 text-slate-300 border border-slate-700">
                              Manual
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            P{activity.priority || 3}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{activity.plannedMinutes} mins planned</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                            <Flame className="w-3 h-3 animate-flame" /> {activity.streak}d streak
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Completion Timestamp Badge */}
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                          activity.completed
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{completionTime}</span>
                      </div>
                      {activity.completed && (
                        <div className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center justify-end gap-1">
                          <Sparkles className="w-3 h-3" /> +{activity.xpReward || 25} XP
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs text-slate-400">
          <span>Day cycle reset: 12:00 AM (Midnight)</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md shadow-purple-600/30"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

