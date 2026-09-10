import React, { useState } from 'react';
import { X, Flame, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { EmergencyTask } from '../types';
import { soundFx } from '../utils/audio';

interface AddEmergencyDirectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDirective: (directive: EmergencyTask) => void;
  currentCount: number;
  isDarkMode: boolean;
}

const QUICK_PRESETS = [
  'Fix Production Bug Before Demo',
  'Submit GATE / Exam Assignment Sprint',
  'LeetCode Contest / 5 Hard Problems',
  'Deploy Feature & Run End-to-End Tests',
];

export const AddEmergencyDirectiveModal: React.FC<AddEmergencyDirectiveModalProps> = ({
  isOpen,
  onClose,
  onAddDirective,
  currentCount,
  isDarkMode,
}) => {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState<24 | 48>(24);
  const [priority, setPriority] = useState<number>(4);
  const [tag, setTag] = useState<string>('CRITICAL');

  if (!isOpen) return null;

  const isMaxReached = currentCount >= 3;

  const handleLaunch = () => {
    if (!title.trim() || isMaxReached) return;
    soundFx.playClick();
    const now = Date.now();
    onAddDirective({
      id: `em_${now}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      createdAt: now,
      deadlineHours: hours,
      deadlineAt: now + hours * 3600000,
      xpReward: 15,
      priority,
      tag,
    });
    soundFx.playLevelUp();
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl transition-all duration-300 relative overflow-hidden ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#121124] via-[#16132b] to-[#0c0e1a] border-rose-500/40 text-white shadow-rose-950/30'
            : 'bg-white border-rose-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Top Glow Ribbon */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rose-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Add Emergency Directive</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30">
                  {currentCount}/3 Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Temporary sprint mission (Expires in max 2 days / 48h).
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Limit Warning */}
        {isMaxReached ? (
          <div className="my-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-rose-600 dark:text-rose-400 font-black block">Maximum Limit Reached (3/3)</strong>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                You can have at most 3 emergency tasks at a time. Please complete or delete an existing directive to launch a new one.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 my-5">
            {/* Title / Heading Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Directive Heading / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fix critical login bug before 6 PM..."
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleLaunch()}
                className={`w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all ${
                  isDarkMode
                    ? 'bg-black/50 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
              {QUICK_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTitle(p)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-rose-500 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-rose-400 hover:text-rose-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Sprint Hours & Priority Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Sprint Duration (Max 2 days / 48h) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Countdown Sprint (Max 2 Days)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHours(24)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      hours === 24
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                        : isDarkMode
                        ? 'bg-slate-800/60 border-slate-700 text-slate-400'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    ⚡ 24 Hours (1 Day)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHours(48)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      hours === 48
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                        : isDarkMode
                        ? 'bg-slate-800/60 border-slate-700 text-slate-400'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    ⏳ 48 Hours (2 Days)
                  </button>
                </div>
              </div>

              {/* Priority Tag */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Urgency Level
                </label>
                <div className="flex gap-1.5">
                  {[
                    { level: 3, label: 'High', tag: 'HIGH' },
                    { level: 4, label: 'Urgent', tag: 'URGENT' },
                    { level: 5, label: 'Critical', tag: 'CRITICAL' },
                  ].map((p) => (
                    <button
                      key={p.level}
                      type="button"
                      onClick={() => {
                        setPriority(p.level);
                        setTag(p.tag);
                      }}
                      className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        priority === p.level
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-rose-500 shadow-md'
                          : isDarkMode
                          ? 'bg-slate-800/60 border-slate-700 text-slate-400'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-rose-500/5 p-3 rounded-xl border border-rose-500/20 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                Completing an emergency directive grants <strong>+15 XP</strong>. Directives automatically vanish after 2 days.
              </span>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-rose-500/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>

          {!isMaxReached && (
            <button
              type="button"
              onClick={handleLaunch}
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-500/30 flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Directive (+15 XP)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
