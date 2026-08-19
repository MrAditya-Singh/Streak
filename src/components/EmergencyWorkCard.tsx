import React, { useState, useEffect } from 'react';
import { EmergencyTask } from '../types';
import { 
  AlertTriangle, 
  Clock, 
  Plus, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  Trash2, 
  Zap,
  Check
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
  const [priority, _setPriority] = useState<number>(5);
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
    }, 500);
  };

  const formatRemainingTime = (deadlineAt: number) => {
    const diffMs = deadlineAt - now;
    if (diffMs <= 0) return { text: '🚨 Expired', isExpired: true };

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
    <div className="rounded-3xl p-4 sm:p-5 transition-all duration-300 border bg-gradient-to-r from-rose-50/80 via-white to-rose-50/50 border-rose-200 shadow-sm">
      
      {/* Compact Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-rose-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                Emergency Directives
              </h3>
              <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                24-48H Fast Track
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Urgent tasks with countdowns • <span className="text-amber-700 font-bold">+5 XP on finish</span>
            </p>
          </div>
        </div>

        {/* Action: Add Emergency Work */}
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isAdding ? 'Cancel' : '+ Add Directive'}</span>
        </button>
      </div>

      {/* Inline Add Task Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateTask}
          className="mb-3.5 p-3.5 rounded-2xl bg-white border border-rose-200 space-y-2.5 shadow-sm animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-rose-900 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Deploy Fast Directive
            </span>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.2 rounded border border-amber-200">
              Reward: +5 XP
            </span>
          </div>

          <input
            type="text"
            required
            placeholder="Directive title (e.g. Submit Project / Assignment Report)"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-rose-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-600">Deadline:</span>
              <button
                type="button"
                onClick={() => setDeadlineHours(24)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  deadlineHours === 24 ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                24 Hours
              </button>
              <button
                type="button"
                onClick={() => setDeadlineHours(48)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  deadlineHours === 48 ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                48 Hours
              </button>
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Deploy Directive
            </button>
          </div>
        </form>
      )}

      {/* Compact Directives Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-4 bg-white/70 rounded-2xl border border-rose-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-70" />
            <p className="text-xs font-bold text-slate-600">No emergency tasks pending</p>
            <p className="text-[10px] text-slate-400">All fast-track directives cleared.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const timeInfo = formatRemainingTime(task.deadlineAt);
            const isDone = completingId === task.id;

            return (
              <div
                key={task.id}
                className={`p-3 rounded-2xl bg-white border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all shadow-2xs hover:border-rose-300 ${
                  isDone ? 'scale-98 opacity-50 bg-emerald-50' : ''
                }`}
              >
                {/* Left: Task Name + Priority + Time pill */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {task.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800">
                        {task.tag || '24H LIMIT'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                        P{task.priority || 5}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                      <span className={`flex items-center gap-1 font-mono font-bold ${
                        timeInfo.isExpired ? 'text-rose-600' : 'text-amber-700'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {timeInfo.text}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold font-mono">+{task.xpReward || 5} XP</span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Done Action + Delete */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleComplete(task)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Done (+5 XP)</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onDeleteTask(task.id);
                    }}
                    title="Dismiss directive"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
