import React, { useState } from 'react';
import { HeatmapDay } from '../types';

interface ActivityHeatmapProps {
  data: HeatmapDay[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  const [range, setRange] = useState<'30' | '90'>('30');
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getCellColor = (intensity: number) => {
    switch (intensity) {
      case 4:
        return 'bg-emerald-600 shadow-xs';
      case 3:
        return 'bg-emerald-500';
      case 2:
        return 'bg-emerald-400';
      case 1:
        return 'bg-emerald-200';
      default:
        return 'bg-slate-150 bg-slate-200/80';
    }
  };

  const displayData = range === '30' ? data.slice(-28) : data;

  return (
    <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative">
      {/* Header with Range Filter */}
      <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100">
        <h3 className="text-sm font-black text-[#0f172a]">Activity Heatmap</h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRange('30')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              range === '30'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setRange('90')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              range === '90'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Interactive Tooltip popup */}
      {hoveredDay && (
        <div className="absolute top-4 right-36 bg-[#0f172a] text-white px-3 py-1.5 rounded-xl text-xs z-20 pointer-events-none shadow-lg">
          <div className="font-bold text-emerald-400">{hoveredDay.date}</div>
          <div className="text-slate-300">{hoveredDay.count} activities ({hoveredDay.totalMinutes} min)</div>
        </div>
      )}

      {/* Grid container with days on left */}
      <div className="flex gap-3 overflow-x-auto py-1">
        {/* Days label column */}
        <div className="flex flex-col justify-between text-[10px] font-bold text-slate-500 py-0.5 select-none">
          {daysOfWeek.map((day, idx) => (
            <span key={idx} className="h-3.5 leading-3.5">
              {day}
            </span>
          ))}
        </div>

        {/* Heatmap cells grid */}
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 flex-1">
          {displayData.map((day, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`w-3.5 h-3.5 rounded-sm heatmap-cell cursor-pointer transition-all hover:scale-125 ${getCellColor(
                day.intensity
              )}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-[11px] text-slate-500 font-semibold">
        <span>Less</span>
        <div className="flex gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-200/80" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
