import React from 'react';
import { X, TrendingUp, Calendar, Clock, Award, Target, Flame } from 'lucide-react';
import { AnalyticsSummary, HistoricalDayRecord } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: AnalyticsSummary;
  history: HistoricalDayRecord[];
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  analytics,
  history,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#131822] border border-white/10 rounded-2xl shadow-2xl p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading">Historical Productivity Analytics</h2>
              <p className="text-xs text-slate-400">Deep dive into your daily, weekly, and monthly consistency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Tier Grid Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Daily Card */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-[#1a2333] to-[#121722] border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Today's Performance</span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-heading">
              {analytics.daily.completed} / {analytics.daily.total} <span className="text-xs text-slate-400 font-normal">Tasks</span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Efficiency:</span>
                <span className="font-bold text-white">{analytics.daily.efficiency}%</span>
              </div>
              <div className="flex justify-between">
                <span>Focus Duration:</span>
                <span className="font-bold text-white">{Math.floor(analytics.daily.focusMinutes / 60)}h {analytics.daily.focusMinutes % 60}m</span>
              </div>
              <div className="flex justify-between">
                <span>XP Earned:</span>
                <span className="font-bold text-amber-400">+{analytics.daily.xp} XP</span>
              </div>
            </div>
          </div>

          {/* Weekly Card */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-[#1a2333] to-[#121722] border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">7-Day Consistency</span>
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400 font-heading">
              {analytics.weekly.completionRate}% <span className="text-xs text-slate-400 font-normal">Success</span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Weekly Tasks Done:</span>
                <span className="font-bold text-white">{analytics.weekly.completed} / {analytics.weekly.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Efficiency:</span>
                <span className="font-bold text-white">{analytics.weekly.avgEfficiency}%</span>
              </div>
              <div className="flex justify-between">
                <span>Trend vs Last Week:</span>
                <span className="font-bold text-emerald-400">+{analytics.weekly.efficiencyChange}% ↗</span>
              </div>
            </div>
          </div>

          {/* Monthly Card */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-[#1a2333] to-[#121722] border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">30-Day Overview</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400 font-heading">
              {analytics.monthly.totalFocusHours}h <span className="text-xs text-slate-400 font-normal">Total Focus</span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Completion Rate:</span>
                <span className="font-bold text-white">{analytics.monthly.completionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>Longest Streak:</span>
                <span className="font-bold text-orange-400 flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {analytics.monthly.longestStreak} days</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly Avg Efficiency:</span>
                <span className="font-bold text-white">{analytics.monthly.avgEfficiency}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7-Day Performance Trend Bar Graph */}
        <div className="mt-6 p-4 rounded-xl bg-black/30 border border-white/5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Past 7 Days Efficiency Trend
          </h3>
          <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4">
            {history.slice(0, 7).reverse().map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  {day.efficiencyPct}%
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all ${
                    day.efficiencyPct >= 80 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]' :
                    day.efficiencyPct >= 50 ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]' :
                    'bg-amber-500'
                  }`}
                  style={{ height: `${Math.max(15, day.efficiencyPct)}%` }}
                />
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(day.date).toLocaleDateString([], { weekday: 'narrow' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
