import React, { useState } from 'react';
import { X, Smartphone, Monitor, Check, Flame, TrendingUp, Download, Copy, Sparkles } from 'lucide-react';
import { ActivityItem, UserProfile, DailySummary } from '../types';
import { DuoMascot } from './DuoMascot';
import { soundFx } from '../utils/audio';

interface WidgetSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  activities: ActivityItem[];
  summary: DailySummary;
}

export const WidgetSimulatorModal: React.FC<WidgetSimulatorModalProps> = ({
  isOpen,
  onClose,
  user,
  activities,
  summary,
}) => {
  const [platformTab, setPlatformTab] = useState<'android' | 'windows'>('android');
  const [androidSize, setAndroidSize] = useState<'compact' | 'medium' | 'expanded'>('medium');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const completedActivities = activities.filter((a) => a.completed);

  const handleCopyRainmeterSkin = () => {
    soundFx.playCheck();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121622] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#121622]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-duoGreen/20 border border-duoGreen/40 flex items-center justify-center text-duoGreen">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Cross-Device Widget Simulator</h2>
              <p className="text-xs text-slate-400">Live preview of Android Home Screen & Windows Desktop widgets</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="px-6 pt-4 flex items-center gap-3">
          <button
            onClick={() => {
              soundFx.playClick();
              setPlatformTab('android');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              platformTab === 'android'
                ? 'bg-duoGreen text-black shadow-glow-green/40'
                : 'bg-card border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android Home Screen (Jetpack Glance)</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setPlatformTab('windows');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              platformTab === 'windows'
                ? 'bg-duoBlue text-black shadow-lg shadow-blue-500/30'
                : 'bg-card border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Windows Desktop (Rainmeter)</span>
          </button>
        </div>

        {/* Interactive Preview Canvas */}
        <div className="p-6">
          {platformTab === 'android' ? (
            <div>
              {/* Android Widget Size Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Widget Size:</span>
                  {(['compact', 'medium', 'expanded'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setAndroidSize(size)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                        androidSize === size
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {size} {size === 'compact' ? '(2x2)' : size === 'medium' ? '(4x2)' : '(4x4)'}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-duoGreenLight font-mono">
                  State: Connected • Auto-Synced
                </span>
              </div>

              {/* Android Phone Mockup Frame */}
              <div className="p-8 rounded-3xl bg-gradient-to-b from-[#182030] to-[#0d1017] border-4 border-slate-700 shadow-2xl flex items-center justify-center min-h-[380px] relative overflow-hidden">
                {/* Wallpaper subtle pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#2d3748_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

                {/* 1. Android Medium (4x2) Widget */}
                {androidSize === 'medium' && (
                  <div 
                    onDoubleClick={() => {
                      soundFx.playCheck();
                      onClose();
                    }}
                    title="Double-click to open EffStreak"
                    className="w-full max-w-md bg-black/95 backdrop-blur-2xl border-2 border-purple-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(139,92,246,0.3)] text-white cursor-pointer hover:border-cyan-400 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-black border border-purple-400 p-0.5 shadow-sm">
                          <img src="/app-icon.png" alt="EffStreak" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-black text-white leading-none">🔥 {user.overallStreak}d</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 border border-purple-400/40">
                              Lv.{user.level} Knight
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-semibold">API STREAK TRACKER</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-400">
                          API SYNCED
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Double-tap to open ↗
                        </div>
                      </div>
                    </div>

                    {/* Connected API Platform Streaks (Only API Streaks) */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { name: 'LeetCode', streak: 42, active: true },
                        { name: 'Codeforces', streak: 18, active: true },
                        { name: 'GFG', streak: 31, active: true },
                        { name: 'GitHub', streak: 26, active: true },
                      ].map((a) => (
                        <div key={a.name} className="p-1.5 rounded-xl bg-gradient-to-b from-emerald-950/40 to-black border border-emerald-500/40">
                          <div className="text-[10px] font-bold truncate text-slate-200">{a.name}</div>
                          <div className="text-xs font-black text-amber-400 mt-0.5">🔥 {a.streak}</div>
                          <div className="text-[8px] font-bold text-emerald-400 mt-0.5">✓ ACTIVE</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Android Compact (2x2) Widget */}
                {androidSize === 'compact' && (
                  <div 
                    onDoubleClick={() => {
                      soundFx.playCheck();
                      onClose();
                    }}
                    title="Double-click to open EffStreak"
                    className="w-48 h-48 bg-black/95 backdrop-blur-2xl border-2 border-purple-500/50 rounded-2xl p-3.5 shadow-[0_0_30px_rgba(139,92,246,0.3)] flex flex-col justify-between text-white text-center cursor-pointer hover:border-cyan-400 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-5 h-5 rounded-md bg-black border border-purple-400 p-0.5">
                        <img src="/app-icon.png" alt="EffStreak" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[9px] font-bold text-emerald-400">API LIVE</span>
                    </div>

                    <div className="flex flex-col items-center my-auto">
                      <div className="text-2xl font-black text-amber-400 flex items-center gap-1">
                        <span>🔥</span> {user.overallStreak}d
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Streak</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl text-[9px] font-black">
                      <span className="text-slate-200">LC: 🔥42</span>
                      <span className="text-slate-200">CF: 🔥18</span>
                    </div>
                  </div>
                )}

                {/* 3. Android Expanded (4x4) Widget */}
                {androidSize === 'expanded' && (
                  <div 
                    onDoubleClick={() => {
                      soundFx.playCheck();
                      onClose();
                    }}
                    title="Double-click to open EffStreak"
                    className="w-full max-w-md bg-black/95 backdrop-blur-2xl border-2 border-purple-500/50 rounded-2xl p-5 shadow-[0_0_30px_rgba(139,92,246,0.3)] text-white space-y-3 cursor-pointer hover:border-cyan-400 transition-all"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-black border border-purple-400 p-0.5 shadow-md">
                          <img src="/app-icon.png" alt="EffStreak" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <div className="text-xl font-black flex items-center gap-1">
                            <span>🔥</span> {user.overallStreak} Days Active
                          </div>
                          <div className="text-[10px] text-purple-300 font-semibold">Solo Leveling • Level {user.level} Knight</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400">100% API SYNCED</span>
                      </div>
                    </div>

                    {/* 6 Connected Platform Streaks */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                      {[
                        { name: 'LeetCode', streak: 42, active: true },
                        { name: 'Codeforces', streak: 18, active: true },
                        { name: 'GFG', streak: 31, active: true },
                        { name: 'GitHub', streak: 26, active: true },
                        { name: 'AtCoder', streak: 14, active: false },
                        { name: 'YouTube', streak: 12, active: false },
                      ].map((a) => (
                        <div key={a.name} className={`p-2 rounded-xl border ${
                          a.active ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-white/5 border-white/10 text-slate-400'
                        }`}>
                          <span className="font-bold text-[10px]">{a.name}</span>
                          <div className="font-black text-orange-400 mt-0.5">🔥 {a.streak}d</div>
                        </div>
                      ))}
                    </div>

                    <div className="text-center text-[10px] text-slate-400 pt-1">
                      💡 Double-tap anywhere to open full EffStreak dashboard
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Windows Desktop Widget Preview */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-400">
                  Rainmeter Skin (Active Desktop Component with Lua parser)
                </span>
                <button
                  onClick={handleCopyRainmeterSkin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'Copied INI Code!' : 'Copy Rainmeter .ini'}</span>
                </button>
              </div>

              {/* Windows Desktop Wallpaper Background Simulation */}
              <div className="p-8 rounded-3xl bg-[#0e141f] border-4 border-slate-800 shadow-2xl flex items-center justify-center min-h-[380px] relative overflow-hidden">
                <div className="w-full max-w-sm bg-[#161c28]/90 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl text-slate-100 font-sans">
                  {/* Rainmeter Title Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-streakOrange fill-streakOrange" />
                      <span className="font-extrabold text-sm tracking-wide">
                        {user.overallStreak} DAY STREAK
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                      DESKTOP WIDGET
                    </span>
                  </div>

                  {/* Platform Streaks 2x2 grid */}
                  <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                    <div className="p-2 rounded bg-black/30 flex items-center justify-between">
                      <span className="text-slate-400">LC</span>
                      <span className="font-bold text-orange-400">🔥 42</span>
                    </div>
                    <div className="p-2 rounded bg-black/30 flex items-center justify-between">
                      <span className="text-slate-400">CF</span>
                      <span className="font-bold text-blue-400">🔥 18</span>
                    </div>
                    <div className="p-2 rounded bg-black/30 flex items-center justify-between">
                      <span className="text-slate-400">GFG</span>
                      <span className="font-bold text-green-400">🔥 31</span>
                    </div>
                    <div className="p-2 rounded bg-black/30 flex items-center justify-between">
                      <span className="text-slate-400">GH</span>
                      <span className="font-bold text-slate-200">🔥 26</span>
                    </div>
                  </div>

                  {/* Today's Checklist */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Today</div>
                    {activities.slice(0, 4).map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-0.5">
                        <span className="text-slate-300">{a.name}</span>
                        {a.completed ? (
                          <span className="text-duoGreen font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Done
                          </span>
                        ) : (
                          <span className="text-slate-600">○</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Efficiency Meter */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-duoGreen">
                      {summary.tasksCompleted} / {summary.totalTasks} COMPLETE
                    </span>
                    <span className="font-mono text-slate-300">{summary.efficiencyPct}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with quick export links */}
        <div className="p-5 border-t border-white/10 flex items-center justify-between bg-[#121622]">
          <span className="text-xs text-slate-400">
            Source files available in <code className="text-duoGreen">android/</code> and <code className="text-duoBlue">windows/</code>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-duoGreen text-black font-extrabold hover:bg-duoGreenLight transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
