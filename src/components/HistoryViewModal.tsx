import React, { useState } from 'react';
import { X, Calendar, CheckCircle2, Circle, Clock, Filter, Flame } from 'lucide-react';
import { HistoricalDayRecord, ActivityCategory } from '../types';

interface HistoryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoricalDayRecord[];
}

export const HistoryViewModal: React.FC<HistoryViewModalProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(history[0]?.date || new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const currentRecord = history.find((h) => h.date === selectedDate) || history[0];

  const filteredActivities = (currentRecord?.activities || []).filter((act) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'coding') return act.category === 'coding';
    if (selectedCategory === 'study') return act.category === 'education';
    if (selectedCategory === 'fitness') return act.category === 'fitness';
    if (selectedCategory === 'career') return act.category === 'career';
    if (selectedCategory === 'personal') return act.category === 'personal' || act.category === 'social';
    return true;
  });

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'coding', label: 'Coding' },
    { id: 'study', label: 'Study' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'career', label: 'Career' },
    { id: 'personal', label: 'Personal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#131822] border border-white/10 rounded-2xl shadow-2xl p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading">Past Activity History</h2>
              <p className="text-xs text-slate-400">Review task completions and efficiency from previous days</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector Pills */}
        <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
          {history.slice(0, 14).map((record) => {
            const isSelected = record.date === selectedDate;
            const dateObj = new Date(record.date);
            const label = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

            return (
              <button
                key={record.date}
                onClick={() => setSelectedDate(record.date)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {label} {record.allCompleted ? '🔥' : '○'}
              </button>
            );
          })}
        </div>

        {/* Selected Day Overview */}
        {currentRecord && (
          <div className="mt-2 p-4 rounded-xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400">Date Inspected</div>
              <div className="text-lg font-bold text-white font-heading">
                {new Date(currentRecord.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xs text-slate-400">Efficiency</div>
                <div className="text-lg font-bold text-emerald-400">{currentRecord.efficiencyPct}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">Tasks Completed</div>
                <div className="text-lg font-bold text-blue-400">{currentRecord.completedCount} / {currentRecord.totalScheduled}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">Focus Time</div>
                <div className="text-lg font-bold text-purple-400">{Math.floor(currentRecord.completedMinutes / 60)}h {currentRecord.completedMinutes % 60}m</div>
              </div>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex items-center gap-2 mt-5 border-b border-white/10 pb-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 mr-2 font-medium">Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Activities List */}
        <div className="mt-4 space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                act.completed
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-white'
                  : 'bg-white/5 border-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                {act.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <div className={`text-sm font-semibold ${act.completed ? 'text-white' : 'text-slate-400'}`}>
                    {act.name}
                  </div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                    {act.category} • {act.durationMinutes} min
                  </div>
                </div>
              </div>

              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                act.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-400'
              }`}>
                {act.completed ? 'Completed' : 'Missed'}
              </span>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No activities found for this category on this date.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
