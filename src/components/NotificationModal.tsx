import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Timer,
  Flame,
  Zap,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Plus,
  Calendar,
  CheckCircle,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { EmergencyTask, ActivityItem } from '../types';
import { soundFx } from '../utils/audio';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  emergencyTasks: EmergencyTask[];
  activities: ActivityItem[];
  onCompleteEmergencyTask?: (id: string) => void;
  onToggleActivity?: (id: string) => void;
  onOpenAddEmergency?: () => void;
  onAppRefresh?: () => void;
  isDarkMode: boolean;
  todayDayNumber: number;
}

// ─── Live Futuristic Countdown Component ─────────────────────────────────────
function TaskCountdown({ deadlineAt }: { deadlineAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = deadlineAt - now;
  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/30 animate-pulse">
        <Clock className="w-3 h-3" /> EXPIRED
      </span>
    );
  }

  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const urgent = h < 6;

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-md border ${
        urgent
          ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      }`}
    >
      <Timer className="w-3 h-3 shrink-0" />
      <span>
        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    </span>
  );
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  emergencyTasks = [],
  activities = [],
  onCompleteEmergencyTask,
  onToggleActivity,
  onOpenAddEmergency,
  onAppRefresh,
  isDarkMode,
  todayDayNumber,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'emergency' | 'habits'>('all');

  // Filter undone items
  const undoneEmergency = emergencyTasks.filter((t) => !t.completed);
  const undoneHabits = activities.filter((a) => !a.completed);
  const completedEmergency = emergencyTasks.filter((t) => t.completed);
  const completedHabits = activities.filter((a) => a.completed);

  const totalUndone = undoneEmergency.length + undoneHabits.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 ${
          isDarkMode
            ? 'bg-[#0f1424] border-slate-700/80 text-white shadow-purple-950/40'
            : 'bg-[#FCFBF8] border-slate-300/80 text-slate-900 shadow-slate-400/40'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
            isDarkMode ? 'bg-[#151c30] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md relative ${
                undoneEmergency.length > 0
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : totalUndone > 0
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              <Bell className="w-5 h-5" />
              {totalUndone > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[9px] font-black text-white items-center justify-center">
                    {totalUndone}
                  </span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Mission & Task Notifications</h2>
                {totalUndone > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono">
                    {totalUndone} PENDING
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono">
                    ALL CLEAR
                  </span>
                )}
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Active Emergency Directives & Undone Habits for Day {todayDayNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onAppRefresh && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onAppRefresh();
                }}
                title="Reload & Refresh App"
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          className={`px-4 sm:px-5 py-2.5 border-b flex items-center gap-2 overflow-x-auto scroller-smooth ${
            isDarkMode ? 'bg-[#121828] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/30'
                : isDarkMode
                ? 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Undone ({totalUndone})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('emergency');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'emergency'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : isDarkMode
                ? 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Emergency Directives ({undoneEmergency.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('habits');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'habits'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : isDarkMode
                ? 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Today's Habits ({undoneHabits.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[60vh] space-y-4">
          {/* If everything is completed */}
          {totalUndone === 0 && (
            <div
              className={`p-6 sm:p-8 rounded-2xl border text-center flex flex-col items-center justify-center gap-3 ${
                isDarkMode
                  ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-lg sm:text-xl font-black">All Hunter Directives & Daily Habits Clear!</h3>
              <p className={`text-xs sm:text-sm max-w-md ${isDarkMode ? 'text-emerald-300/80' : 'text-emerald-700'}`}>
                You have completed all emergency missions and daily habits for Day {todayDayNumber}. Your daily streak is completely secured!
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40">
                  {completedHabits.length} Habits Done
                </span>
                {completedEmergency.length > 0 && (
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300">
                    {completedEmergency.length} Directives Cleared
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 1. Emergency Directives Section */}
          {(activeTab === 'all' || activeTab === 'emergency') && undoneEmergency.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-500">
                    Critical Emergency Directives ({undoneEmergency.length})
                  </span>
                </div>
                {onOpenAddEmergency && emergencyTasks.length < 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      onOpenAddEmergency();
                    }}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Directive</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {undoneEmergency.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDarkMode
                        ? 'bg-rose-950/20 border-rose-800/60 hover:border-rose-500/80 shadow-md shadow-rose-950/20'
                        : 'bg-rose-50/70 border-rose-200 hover:border-rose-400 shadow-sm'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase font-mono bg-rose-600 text-white shadow-xs">
                          {task.tag || 'CRITICAL'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          +{task.xpReward || 15} XP
                        </span>
                        <TaskCountdown deadlineAt={task.deadlineAt} />
                      </div>
                      <h4 className={`text-sm sm:text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {task.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onCompleteEmergencyTask?.(task.id);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/30 hover:scale-[1.02] transition-all shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Done</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Today's Undone Habits Section */}
          {(activeTab === 'all' || activeTab === 'habits') && undoneHabits.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className={`text-xs sm:text-sm font-black uppercase tracking-wider ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    Undone Daily Habits for Day {todayDayNumber} ({undoneHabits.length})
                  </span>
                </div>
                <span className={`text-[11px] font-mono font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {completedHabits.length}/{activities.length} Completed
                </span>
              </div>

              <div className="space-y-2">
                {undoneHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isDarkMode
                        ? 'bg-[#151c30]/90 border-slate-800 hover:border-indigo-500/50 hover:bg-[#19223a]'
                        : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded-md border ${
                          isDarkMode ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {habit.category}
                        </span>
                        <span className="text-[10px] font-mono text-amber-500 font-bold">
                          +{habit.xpReward} XP
                        </span>
                        {habit.streak > 0 && (
                          <span className="text-[10px] font-mono text-rose-400 font-bold flex items-center gap-0.5">
                            <Flame className="w-3 h-3 text-rose-500 fill-rose-500" /> {habit.streak}d
                          </span>
                        )}
                      </div>
                      <h4 className={`text-xs sm:text-sm font-bold truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {habit.name}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playCheck();
                        onToggleActivity?.(habit.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 shrink-0 ${
                        isDarkMode
                          ? 'bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 border-emerald-700/60'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Complete Today</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${
            isDarkMode ? 'bg-[#151c30] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Pending: {totalUndone} items
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onAppRefresh && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onAppRefresh();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black border flex items-center gap-1.5 cursor-pointer transition-all ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh App</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:brightness-110 text-white text-xs font-black cursor-pointer shadow-md shadow-rose-600/30 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
