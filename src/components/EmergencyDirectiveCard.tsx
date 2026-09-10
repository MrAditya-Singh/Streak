import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, ChevronDown, ChevronUp, CheckCircle2,
  Clock, Timer, X, Plus, ShieldCheck, Flame, Trash2
} from 'lucide-react';
import { EmergencyTask } from '../types';
import { soundFx } from '../utils/audio';

interface EmergencyDirectiveCardProps {
  emergencyTasks: EmergencyTask[];
  isDarkMode: boolean;
  onAddEmergencyTask?: (task: EmergencyTask) => void;
  onCompleteEmergencyTask?: (id: string) => void;
  onDeleteEmergencyTask?: (id: string) => void;
  isInitiallyExpanded?: boolean;
}

// ─── Live Futuristic Countdown Component ─────────────────────────────────────
function Countdown({ deadlineAt }: { deadlineAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = deadlineAt - now;
  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-black tracking-widest text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
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
      className={`inline-flex items-center gap-1.5 font-mono font-black text-xs px-2.5 py-1 rounded-full border transition-all ${
        urgent
          ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/40 shadow-xs shadow-rose-500/20 animate-pulse'
          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      }`}
    >
      <Timer className="w-3.5 h-3.5 shrink-0" />
      <span>{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>
    </span>
  );
}

export const EmergencyDirectiveCard: React.FC<EmergencyDirectiveCardProps> = ({
  emergencyTasks,
  isDarkMode,
  onAddEmergencyTask,
  onCompleteEmergencyTask,
  onDeleteEmergencyTask,
  isInitiallyExpanded,
}) => {
  const activeCount = emergencyTasks.filter((t) => !t.completed).length;
  const criticalCount = emergencyTasks.filter((t) => t.priority >= 4 && !t.completed).length;
  const doneCount = emergencyTasks.filter((t) => t.completed).length;

  const [isExpanded, setIsExpanded] = useState<boolean>(
    isInitiallyExpanded ?? (activeCount > 0 || emergencyTasks.length === 0)
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newHours, setNewHours] = useState<24 | 48>(24);
  const [newPriority, setNewPriority] = useState(3);
  const [newTag, setNewTag] = useState('CRITICAL');

  const QUICK_PRESETS = [
    'Submit Project Milestone',
    'Fix Production Bug Before Demo',
    'GATE / Exam 50 MCQs Sprint',
    'LeetCode Biweekly Contest',
  ];

  const handleAdd = () => {
    if (!newTitle.trim() || !onAddEmergencyTask) return;
    soundFx.playClick();
    onAddEmergencyTask({
      id: `em_${Date.now()}`,
      title: newTitle.trim(),
      createdAt: Date.now(),
      deadlineHours: newHours,
      deadlineAt: Date.now() + newHours * 3600000,
      xpReward: 15,
      priority: newPriority,
      tag: newTag,
    });
    setNewTitle('');
    setNewHours(24);
    setNewPriority(3);
    setShowAddForm(false);
    setIsExpanded(true);
    soundFx.playLevelUp();
  };

  return (
    <section
      id="emergency-directive-section"
      className={`w-full rounded-3xl border transition-all duration-500 relative overflow-hidden shadow-lg ${
        isDarkMode
          ? 'bg-gradient-to-br from-[#121124]/95 via-[#16132b]/95 to-[#0c0e1a]/95 border-rose-500/40 text-white shadow-rose-950/20 shadow-2xl'
          : 'bg-gradient-to-br from-[#FFFDFD] via-[#FFF5F7] to-[#FDF2F5] border-rose-300 text-slate-900 shadow-rose-900/5'
      }`}
    >
      {/* Top Ambient Glow Edge */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-80" />

      {/* ── Header Bar ── */}
      <div className={`p-4 sm:p-5 flex items-center justify-between gap-4 border-b ${
        isDarkMode ? 'border-rose-500/20 bg-rose-500/5' : 'border-rose-200/70 bg-rose-500/5'
      }`}>
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className={`font-black text-sm sm:text-base tracking-tight uppercase ${
                isDarkMode ? 'text-white' : 'text-slate-950'
              }`}>
                Emergency Directives
              </h3>

              {activeCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs shadow-rose-600/30 animate-pulse">
                  {activeCount} Active {criticalCount > 0 && `• ${criticalCount} Critical`}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Sector Secure
                </span>
              )}

              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                +15 XP per task
              </span>
            </div>

            <p className={`text-xs mt-0.5 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Time-critical sprint tasks (24h–48h countdown). Boost rank & maintain momentum.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setShowAddForm((prev) => !prev);
              if (!isExpanded) setIsExpanded(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-rose-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Directive</span>
            <span className="sm:hidden">New</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Expandable Body ── */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Inline Quick Add Form */}
          {showAddForm && (
            <div className={`p-4 rounded-2xl border transition-all duration-300 animate-fade-in ${
              isDarkMode 
                ? 'bg-gradient-to-br from-slate-900/90 to-purple-950/40 border-rose-500/40 shadow-xl' 
                : 'bg-white border-rose-300 shadow-md shadow-rose-950/5'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" /> Create Time-Critical Mission
                </span>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Task Title Input */}
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Directive title (e.g. Submit GATE assignment before midnight...)"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all ${
                    isDarkMode
                      ? 'bg-black/60 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                  {QUICK_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTitle(p)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        isDarkMode
                          ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-rose-500 hover:text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-rose-400 hover:text-rose-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Deadline & Priority Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Deadline Hours */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Sprint Deadline
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewHours(24)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          newHours === 24
                            ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                            : isDarkMode ? 'bg-slate-800/60 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        ⚡ 24 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewHours(48)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          newHours === 48
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                            : isDarkMode ? 'bg-slate-800/60 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        ⏳ 48 Hours
                      </button>
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Priority Level
                    </label>
                    <div className="flex gap-2">
                      {[
                        { level: 3, label: 'High', tag: 'HIGH' },
                        { level: 4, label: 'Urgent', tag: 'URGENT' },
                        { level: 5, label: 'Critical', tag: 'CRITICAL' },
                      ].map((p) => (
                        <button
                          key={p.level}
                          type="button"
                          onClick={() => {
                            setNewPriority(p.level);
                            setNewTag(p.tag);
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            newPriority === p.level
                              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-rose-500 shadow-md'
                              : isDarkMode ? 'bg-slate-800/60 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!newTitle.trim()}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-500/30 cursor-pointer"
                  >
                    Launch Directive (+15 XP)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Task Cards / Futuristic Empty State ── */}
          {emergencyTasks.length === 0 && !showAddForm ? (
            <div className={`p-6 sm:p-8 rounded-2xl border text-center transition-all ${
              isDarkMode 
                ? 'bg-gradient-to-b from-slate-900/60 to-purple-950/20 border-slate-800/80 shadow-inner' 
                : 'bg-white/80 border-rose-200/80 shadow-xs'
            }`}>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-rose-500/20 border border-emerald-500/30 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/10">
                <ShieldCheck className="w-7 h-7 text-emerald-500 animate-bounce" />
              </div>

              <h4 className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                All Critical Directives Cleared!
              </h4>
              <p className={`text-xs max-w-md mx-auto mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                No high-stakes emergencies pending. When an urgent deadline strikes, launch a 24h/48h sprint here.
              </p>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowAddForm(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-rose-500/25 transition-all cursor-pointer hover:scale-105"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Emergency Directive</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {emergencyTasks.map((task) => {
                const urgent = task.deadlineAt - Date.now() < 6 * 3600000;
                const done = !!task.completed;

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 relative group flex items-start gap-3.5 ${
                      done
                        ? 'bg-emerald-500/5 border-emerald-500/30 opacity-60'
                        : urgent
                        ? 'bg-rose-500/10 border-rose-500/50 shadow-md shadow-rose-500/10'
                        : isDarkMode
                        ? 'bg-slate-900/90 border-slate-800 hover:border-rose-500/40 hover:bg-slate-850'
                        : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/80 shadow-xs'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playCheck();
                        onCompleteEmergencyTask?.(task.id);
                      }}
                      className={`w-6 h-6 rounded-xl border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        done
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'border-rose-400 dark:border-rose-500/60 hover:bg-rose-500/20'
                      }`}
                    >
                      {done && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs sm:text-sm font-black tracking-tight leading-snug truncate ${
                          done ? 'line-through text-slate-400 dark:text-slate-500' : isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {task.title}
                        </span>

                        {onDeleteEmergencyTask && (
                          <button
                            type="button"
                            onClick={() => {
                              soundFx.playClick();
                              onDeleteEmergencyTask(task.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-red-400 hover:bg-red-500/20 transition-all shrink-0 cursor-pointer"
                            title="Delete Directive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Badges & Live Timer */}
                      <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-mono">
                            {task.tag || 'CRITICAL'}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 font-mono">
                            +{task.xpReward || 15} XP
                          </span>
                        </div>

                        {!done ? (
                          <Countdown deadlineAt={task.deadlineAt} />
                        ) : (
                          <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3 h-3" /> FULFILLED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* KPI Strip */}
          {emergencyTasks.length > 0 && (
            <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono font-bold ${
              isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-4">
                <span>Total: <strong className="text-purple-500">{emergencyTasks.length}</strong></span>
                <span>Active: <strong className="text-rose-500">{activeCount}</strong></span>
                <span>Fulfilled: <strong className="text-emerald-500">{doneCount}</strong></span>
              </div>
              <span className="text-[11px] text-slate-400">Time-Critical Sprint Protocol</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
