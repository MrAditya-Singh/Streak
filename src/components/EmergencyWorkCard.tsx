import React, { useState, useEffect } from 'react';
import { EmergencyTask } from '../types';
import { 
  AlertTriangle, 
  Clock, 
  Plus, 
  X, 
  CheckCircle2, 
  Sparkles, 
  ShieldAlert, 
  Trash2, 
  Zap 
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface EmergencyWorkCardProps {
  tasks: EmergencyTask[];
  onAddTask: (newTask: EmergencyTask) => void;
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const EmergencyWorkCard: React.FC<EmergencyWorkCardProps> = ({
  tasks,
  onAddTask,
  onCompleteTask,
  onDeleteTask,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [deadlineHours, setDeadlineHours] = useState<number>(24);
  const [priority, setPriority] = useState<number>(5);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: EmergencyTask = {
      id: `emg-${Date.now().toString().slice(-6)}`,
      title: taskTitle.trim(),
      createdAt: Date.now(),
      deadlineHours,
      deadlineAt: Date.now() + deadlineHours * 3600 * 1000,
      xpReward: 5,
      priority,
      tag: deadlineHours === 24 ? '24H URGENT' : '48H DIRECTIVE',
    };

    onAddTask(newTask);
    setTaskTitle('');
    setIsAdding(false);
    soundFx.playFlame();
  };

  const handleComplete = (task: EmergencyTask) => {
    setCompletingId(task.id);
    soundFx.playLevelUp();
    
    setTimeout(() => {
      onCompleteTask(task.id);
      setCompletingId(null);
    }, 700);
  };

  const formatRemainingTime = (deadlineAt: number) => {
    const diffMs = deadlineAt - now;
    if (diffMs <= 0) return { text: '🚨 Expired / Critical', isExpired: true };

    const hours = Math.floor(diffMs / (3600 * 1000));
    const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
    
    return {
      text: `${hours}h ${mins}m left`,
      isExpired: false,
      hours,
      mins
    };
  };

  return (
    <div className="relative rounded-3xl p-5 md:p-6 transition-all duration-300 border bg-[#FFF1F2] border-rose-200 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center shadow-md shadow-rose-600/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-wide text-rose-900 flex items-center gap-2">
                EMERGENCY WORK
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-900 border border-rose-300">
                24-48H DIRECTIVE
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Urgent tasks with countdown timers • <span className="text-amber-700 font-bold">+5 XP reward</span> on finish • <span className="text-slate-500">No streaks</span>
            </p>
          </div>
        </div>

        {/* Action: Add Emergency Work */}
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isAdding ? 'Cancel' : '+ Add Emergency Work'}
        </button>
      </div>

      {/* Inline Add Task Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateTask}
          className="relative z-10 mb-4 p-4 rounded-2xl bg-white border border-rose-200 space-y-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-rose-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Deploy Emergency Directive
            </span>
            <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
              Reward: +5 XP
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Emergency Task Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Submit urgent assignment, Resolve critical server bug..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-50 border border-slate-200 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Time Limit (24 - 48 Hours)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeadlineHours(24)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                    deadlineHours === 24
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> 24 Hours
                </button>
                <button
                  type="button"
                  onClick={() => setDeadlineHours(48)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                    deadlineHours === 48
                      ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> 48 Hours
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Priority Rating (1 - 5)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setPriority(lvl)}
                    className={`py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                      priority === lvl
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {lvl === 5 ? '🔥5' : lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-black uppercase text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              + Deploy Task (+5 XP)
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="relative z-10 space-y-2.5">
        {tasks.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-2xl border border-dashed border-rose-300 bg-white/70">
            <ShieldAlert className="w-7 h-7 text-rose-500 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-800">No Active Emergency Directives</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Add time-sensitive (24-48h) emergency tasks whenever urgent duties arise.
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const timeInfo = formatRemainingTime(task.deadlineAt);
            const isCompleting = completingId === task.id;

            return (
              <div
                key={task.id}
                className={`group relative rounded-2xl p-3.5 transition-all duration-300 border ${
                  isCompleting
                    ? 'scale-95 opacity-0 bg-emerald-100 border-emerald-400'
                    : 'bg-white border-rose-150 hover:border-rose-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Urgency Icon + Title + Tags */}
                  <div className="flex items-start gap-2.5 flex-1">
                    <div className="mt-0.5 w-7 h-7 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                    </div>

                    <div className="space-y-0.5 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-[#0f172a] group-hover:text-rose-700 transition-colors">
                          {task.title}
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-100 text-rose-900 border border-rose-200">
                          {task.deadlineHours}H LIMIT
                        </span>

                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                          task.priority >= 4
                            ? 'bg-red-100 text-red-900 border border-red-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}>
                          P{task.priority}
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> +5 XP
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span className={timeInfo.isExpired ? 'text-red-600 font-bold' : 'text-amber-700 font-bold'}>
                          {timeInfo.text}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 text-[10px]">No streak count</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleComplete(task)}
                      disabled={isCompleting}
                      className="px-3 py-1.5 rounded-xl font-black text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isCompleting ? 'Claiming...' : 'Done (+5 XP)'}
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      title="Remove Emergency Task"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
