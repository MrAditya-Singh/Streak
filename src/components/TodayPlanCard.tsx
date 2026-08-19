import React, { useState } from 'react';
import type { ActivityItem } from '../types';
import { Check, Star, Code2, BarChart2, Binary, BookOpen, Briefcase, DollarSign, Plus, Trash2, Zap, UserCheck, Flame, X } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface TodayPlanCardProps {
  activities: ActivityItem[];
  onToggleActivity: (id: string) => void;
  onAddActivity?: (activity: ActivityItem) => void;
  onDeleteActivity?: (id: string) => void;
  onOpenSettings: () => void;
}

export const TodayPlanCard: React.FC<TodayPlanCardProps> = ({
  activities,
  onToggleActivity,
  onAddActivity,
  onDeleteActivity,
  onOpenSettings: _onOpenSettings,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, _setNewCategory] = useState<'coding' | 'fitness' | 'education' | 'career' | 'personal'>('coding');
  const [newDuration, setNewDuration] = useState(45);
  const [newStreak, setNewStreak] = useState(1);
  const [newPriority, setNewPriority] = useState(3);
  const [isApiMode, setIsApiMode] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'api' | 'manual'>('all');
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  const completedCount = activities.filter((a) => a.completed).length;
  const totalCount = activities.length;

  const isOnlineTracked = (item: ActivityItem) => {
    // API tracked platforms or explicit setting
    return ['leetcode', 'codeforces', 'gfg', 'github', 'youtube', 'atcoder'].includes(item.id.toLowerCase()) || !!item.url;
  };

  const filteredActivities = activities.filter((item) => {
    if (filterMode === 'api') return isOnlineTracked(item);
    if (filterMode === 'manual') return !isOnlineTracked(item);
    return true;
  });

  // Sort: Undone tasks (completed === false) at TOP, Completed tasks at BOTTOM
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return (b.priority ?? 3) - (a.priority ?? 3);
  });

  const renderActivityIcon = (item: ActivityItem) => {
    switch (item.id) {
      case 'leetcode':
        return <Code2 className="w-4 h-4 text-[#ffa116]" />;
      case 'codeforces':
        return <BarChart2 className="w-4 h-4 text-[#1cb0f6]" />;
      case 'gfg':
        return <Binary className="w-4 h-4 text-[#4caf50]" />;
      case 'github':
        return (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-800 dark:text-white fill-current">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        );
      case 'gates':
        return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'internship':
        return <Briefcase className="w-4 h-4 text-purple-400" />;
      case 'earn':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      default:
        return <Star className="w-4 h-4 text-amber-400" />;
    }
  };

  const formatPlannedDuration = (mins: number) => {
    if (mins >= 60) {
      const hrs = mins / 60;
      return `${hrs} hr`;
    }
    return `${mins} min`;
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newId = newTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
    const newAct: ActivityItem = {
      id: newId,
      name: newTitle.trim(),
      category: newCategory,
      iconName: isApiMode ? 'zap' : 'star',
      plannedMinutes: newDuration,
      completed: false,
      streak: newStreak,
      priority: newPriority,
      source: isApiMode ? 'leetcode' : 'manual',
      url: isApiMode ? 'https://api.track.online' : '',
      countsTowardOverallStreak: true,
      countsTowardXP: true,
      xpReward: 25,
    };

    if (onAddActivity) {
      onAddActivity(newAct);
    }
    soundFx.playCheck();
    setNewTitle('');
    setNewPriority(3);
    setShowAddForm(false);
  };

  return (
    <div className="glass-card p-6 flex flex-col justify-between h-full shadow-sm">
      <div>
        {/* Header with PLAN title & Add Activity button */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-base">⭐</span>
            <h3 className="text-sm font-black tracking-wider text-slate-900 dark:text-slate-200 uppercase">
              PLAN
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-purple-500/10 text-purple-600 dark:bg-duoGreen/15 dark:text-duoGreenLight border border-purple-200 dark:border-duoGreen/30">
              {completedCount} / {totalCount} Done
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all"
              title="Add New Activity to Plan"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs: All, API Synced, M (Manual) */}
        <div className="flex items-center gap-1.5 mb-3">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            All ({activities.length})
          </button>
          <button
            onClick={() => setFilterMode('api')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              filterMode === 'api'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>⚡ API Synced</span>
          </button>
          <button
            onClick={() => setFilterMode('manual')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              filterMode === 'manual'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Manual Activities"
          >
            <UserCheck className="w-3 h-3 text-emerald-400" />
            <span>✋ M</span>
          </button>
        </div>

        {/* Inline Add Task Form */}
        {showAddForm && (
          <form onSubmit={handleCreateActivity} className="mb-4 p-4 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                + Add Activity to Plan
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Activity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Design, DSA Sheet"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tracking Method
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsApiMode(true)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      isApiMode
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    ⚡ API Track
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsApiMode(false)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      !isApiMode
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    ✋ M
                  </button>
                </div>
              </div>

              {/* Priority Rating Option: 1 - 5 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Priority Rating (1 - 5)
                </label>
                <div className="flex gap-1.5 items-center">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewPriority(lvl)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                        newPriority === lvl
                          ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-400 scale-105'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {lvl === 5 ? '🔥 5' : lvl === 1 ? '1' : `${lvl}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Planned Minutes
                </label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Starting Consistency Streak (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStreak}
                  onChange={(e) => setNewStreak(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
              >
                + Add Activity
              </button>
            </div>
          </form>
        )}

        {/* Task List: Undone on Top, Done on Bottom */}
        <div className="space-y-2.5">
          {sortedActivities.map((item) => {
            const isApi = isOnlineTracked(item);
            const priorityVal = item.priority ?? (item.category === 'coding' ? 4 : 3);
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all select-none group ${
                  item.completed
                    ? 'bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-200/60 dark:bg-[#101b15]/50 dark:hover:bg-[#15231c] dark:border-emerald-500/15 opacity-75'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 dark:bg-card/40 dark:hover:bg-card/80 dark:border-white/5 shadow-xs'
                }`}
              >
                {/* Left side: Icon + Name + Consistency Streak Badge + API/M Tag + Priority */}
                <div
                  onClick={() => {
                    if (item.completed) {
                      soundFx.playUncheck();
                    } else {
                      soundFx.playCheck();
                    }
                    onToggleActivity(item.id);
                  }}
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 flex items-center justify-center shadow-xs">
                    {renderActivityIcon(item)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm transition-all ${
                          item.completed
                            ? 'text-slate-500 dark:text-slate-400 line-through font-medium'
                            : 'text-slate-900 dark:text-slate-200 font-bold'
                        }`}
                      >
                        {item.name}
                      </span>

                      {/* API vs M Tracking Badge */}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider ${
                          isApi
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                        }`}
                      >
                        {isApi ? '⚡ API' : '✋ M'}
                      </span>

                      {/* Priority Rating Badge */}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-black tracking-tight ${
                          priorityVal >= 4
                            ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30'
                            : priorityVal === 3
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                        }`}
                      >
                        P{priorityVal}
                      </span>
                    </div>

                    {/* Consistency Streak Counter */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="flex items-center gap-0.5 text-[11px] font-black text-amber-700 dark:text-amber-400">
                        <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {item.streak} d streak
                      </span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {formatPlannedDuration(item.plannedMinutes)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Delete Button + Circle Checkmark Button */}
                <div className="flex items-center gap-2">
                  {onDeleteActivity && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFx.playClick();
                        setActivityToDelete(item.id);
                      }}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                      title="Remove activity from plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Circle Checkmark Button */}
                  <div
                    onClick={() => {
                      if (item.completed) {
                        soundFx.playUncheck();
                      } else {
                        soundFx.playCheck();
                      }
                      onToggleActivity(item.id);
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      item.completed
                        ? 'bg-duoGreen text-black shadow-glow-green/50 scale-105'
                        : 'border-2 border-slate-400 dark:border-slate-600 bg-white dark:bg-transparent group-hover:border-slate-600 dark:group-hover:border-slate-400'
                    }`}
                  >
                    {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational Footer Quote */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300/90 font-semibold">
        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 flex-shrink-0" />
        <span>Discipline today, success tomorrow.</span>
      </div>

      {/* Delete Confirmation Modal */}
      {activityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#151922] border border-slate-200 dark:border-white/10 rounded-2xl p-5 max-w-[280px] sm:max-w-xs w-full shadow-2xl text-center">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Remove Activity?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to remove this activity from your daily plan?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setActivityToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-slate-200 dark:border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteActivity) onDeleteActivity(activityToDelete);
                  setActivityToDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

