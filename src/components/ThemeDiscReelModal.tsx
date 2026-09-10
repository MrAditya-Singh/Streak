import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, ChevronLeft, ChevronRight, Palette, Disc, Layers } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { APP_THEMES, AppTheme } from '../utils/themeManager';

interface ThemeDiscReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

// Geometry for 7 thematic positions symmetrically around the 360° circular disc (360/7 ≈ 51.43° increments)
const THEME_HOLE_POSITIONS = [
  { top: '16%', left: '50%', angle: 0 },            // 0° (Top)
  { top: '28.8%', left: '76.6%', angle: 51.43 },    // 51.43°
  { top: '57.6%', left: '83.1%', angle: 102.86 },   // 102.86°
  { top: '80.6%', left: '64.8%', angle: 154.29 },   // 154.29°
  { top: '80.6%', left: '35.2%', angle: 205.71 },   // 205.71°
  { top: '57.6%', left: '16.9%', angle: 257.14 },   // 257.14°
  { top: '28.8%', left: '23.4%', angle: 308.57 },   // 308.57°
];

const STEP_ANGLE = 360 / 7; // ≈ 51.42857°

export const ThemeDiscReelModal: React.FC<ThemeDiscReelModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme,
}) => {
  const currentIdx = Math.max(0, APP_THEMES.findIndex((t) => t.id === currentThemeId));
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(currentIdx !== -1 ? currentIdx : 0);
  const [rotationAngle, setRotationAngle] = useState<number>(currentIdx !== -1 ? -currentIdx * STEP_ANGLE : 0);
  const [viewMode, setViewMode] = useState<'reel' | 'grid'>('reel');

  useEffect(() => {
    const idx = APP_THEMES.findIndex((t) => t.id === currentThemeId);
    if (idx !== -1) {
      setActiveSlotIndex(idx);
      setRotationAngle(-idx * STEP_ANGLE);
    }
  }, [currentThemeId, isOpen]);

  if (!isOpen) return null;

  const activeTheme = APP_THEMES[activeSlotIndex] || APP_THEMES[0];

  const handleSelectSlot = (idx: number) => {
    soundFx.playClick();
    setActiveSlotIndex(idx);
    setRotationAngle(-idx * STEP_ANGLE);
    const targetTheme = APP_THEMES[idx];
    if (targetTheme) {
      onSelectTheme(targetTheme.id);
      soundFx.playLevelUp();
    }
  };

  const handleSpinStep = (direction: 1 | -1) => {
    soundFx.playClick();
    const nextIdx = (activeSlotIndex + direction + APP_THEMES.length) % APP_THEMES.length;
    setActiveSlotIndex(nextIdx);
    setRotationAngle((prev) => prev - direction * STEP_ANGLE);
    const targetTheme = APP_THEMES[nextIdx];
    if (targetTheme) {
      onSelectTheme(targetTheme.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#0b0f19] dark:bg-[#070b14] rounded-3xl border border-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden p-4 sm:p-6 space-y-4 max-h-[94vh] flex flex-col text-white">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Palette className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 tracking-tight">
                  <span>Theme Reel Dial</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-500/40 uppercase tracking-wider">
                    7 Bespoke Themes
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Rotate the mechanical 7-slot dial or switch to grid view to explore unique aesthetics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle View: Reel vs Grid */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setViewMode(viewMode === 'reel' ? 'grid' : 'reel');
              }}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-all border border-white/15 cursor-pointer shadow-xs"
            >
              {viewMode === 'reel' ? (
                <>
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gallery Grid</span>
                </>
              ) : (
                <>
                  <Disc className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reel Wheel</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4 custom-theme-scroll">
          {viewMode === 'reel' ? (
            /* 🎡 1. ViewMaster Rotating 7-Slot Theme Disc Reel Lens */
            <div className="flex flex-col items-center justify-center py-2 relative">
              
              {/* Top Active Pointer Beacon */}
              <div className="relative z-30 flex flex-col items-center pointer-events-none mb-1">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping shadow-lg shadow-rose-500/80" />
                <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-rose-500 -mt-1.5 drop-shadow-md" />
              </div>

              {/* Rotating Disc Body Container */}
              <div
                className="relative w-64 h-64 sm:w-76 sm:h-76 rounded-full cursor-pointer shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] my-2 ring-1 ring-white/10"
                style={{ transform: `rotate(${rotationAngle}deg)` }}
              >
                {/* 7 Thematic Aperture Holes */}
                {THEME_HOLE_POSITIONS.map((pos, idx) => {
                  const themeItem = APP_THEMES[idx];
                  const isActive = idx === activeSlotIndex;
                  if (!themeItem) return null;

                  return (
                    <div
                      key={`theme-hole-${themeItem.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSlot(idx);
                      }}
                      style={{
                        top: pos.top,
                        left: pos.left,
                        transform: 'translate(-50%, -50%)',
                      }}
                      title={`${themeItem.name} • ${themeItem.subtitle}`}
                      className={`absolute w-13 h-13 sm:w-15 sm:h-15 rounded-full flex flex-col items-center justify-center transition-all duration-300 z-10 cursor-pointer shadow-lg overflow-hidden ${
                        isActive
                          ? 'ring-4 ring-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.8)] scale-115'
                          : 'hover:scale-110 hover:ring-2 hover:ring-amber-400 opacity-90 hover:opacity-100'
                      }`}
                    >
                      {/* Theme Background Swatch & Radial Glow */}
                      <div
                        className="w-full h-full flex flex-col items-center justify-center relative p-1 transition-all"
                        style={{
                          background: `radial-gradient(circle, ${themeItem.colors.primary} 0%, ${themeItem.colors.bg} 85%)`,
                        }}
                      >
                        <span
                          className="text-base sm:text-xl select-none drop-shadow-md transition-transform duration-500"
                          style={{
                            transform: `rotate(${-rotationAngle}deg)`,
                          }}
                        >
                          {themeItem.emoji}
                        </span>

                        {/* Miniature color dots preview */}
                        <div
                          className="flex items-center gap-0.5 mt-0.5"
                          style={{ transform: `rotate(${-rotationAngle}deg)` }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full ring-1 ring-white/30" style={{ backgroundColor: themeItem.colors.primary }} />
                          <span className="w-1.5 h-1.5 rounded-full ring-1 ring-white/30" style={{ backgroundColor: themeItem.colors.secondary }} />
                          <span className="w-1.5 h-1.5 rounded-full ring-1 ring-white/30" style={{ backgroundColor: themeItem.colors.accent }} />
                        </div>

                        {/* Active check halo */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full border-2 border-rose-400 animate-pulse pointer-events-none" />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Disc Frame Decorative Texture Image / Outer Ring */}
                <img
                  src="/images/disc_reel.png"
                  alt="Theme ViewMaster Rotating Disc"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl z-20 opacity-95"
                />
              </div>

              {/* Disc Navigation & Dial Controls */}
              <div className="flex items-center justify-center gap-3 mt-3 z-30 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSpinStep(-1)}
                  title="Previous Theme"
                  className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition-all hover:scale-110 cursor-pointer shadow-md flex items-center justify-center border border-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-black/80 text-white border border-white/20 shadow-lg">
                  <Disc className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                  <span className="text-xs font-mono font-black tracking-wide">
                    THEME {activeSlotIndex + 1} OF {APP_THEMES.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSpinStep(1)}
                  title="Next Theme"
                  className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition-all hover:scale-110 cursor-pointer shadow-md flex items-center justify-center border border-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Active Theme Rich Card Banner */}
              <div
                className="w-full mt-4 p-4 sm:p-5 rounded-3xl border transition-all duration-300 shadow-2xl relative overflow-hidden"
                style={{
                  background: activeTheme.cardPreviewBg,
                  borderColor: activeTheme.colors.border,
                  boxShadow: `0 15px 35px -5px ${activeTheme.colors.glow}`,
                }}
              >
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xl shrink-0 border"
                        style={{
                          backgroundColor: activeTheme.colors.bg,
                          borderColor: activeTheme.colors.primary,
                        }}
                      >
                        <span>{activeTheme.emoji}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base sm:text-lg font-black text-white">
                            {activeTheme.name}
                          </h4>
                          <span
                            className="text-[9px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border shadow-xs"
                            style={{
                              backgroundColor: activeTheme.colors.pillBg,
                              color: activeTheme.colors.primary,
                              borderColor: activeTheme.colors.primary + '66',
                            }}
                          >
                            {activeTheme.badge}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-300 mt-0.5">
                          {activeTheme.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Palette Pill */}
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15">
                      <span className="text-[10px] font-mono font-bold text-slate-300">Palette:</span>
                      <div className="w-3.5 h-3.5 rounded-full ring-1 ring-white/40" style={{ backgroundColor: activeTheme.colors.primary }} title="Primary" />
                      <div className="w-3.5 h-3.5 rounded-full ring-1 ring-white/40" style={{ backgroundColor: activeTheme.colors.secondary }} title="Secondary" />
                      <div className="w-3.5 h-3.5 rounded-full ring-1 ring-white/40" style={{ backgroundColor: activeTheme.colors.accent }} title="Accent" />
                      <div className="w-3.5 h-3.5 rounded-full ring-1 ring-white/40" style={{ backgroundColor: activeTheme.colors.bg }} title="Background" />
                    </div>
                  </div>

                  {/* Highlights List */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {activeTheme.highlights.map((hl, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-200 flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeTheme.colors.primary }} />
                        {hl}
                      </span>
                    ))}
                  </div>

                  {/* Mini Interactive UI Preview Container */}
                  <div
                    className="mt-1 p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs flex-wrap"
                    style={{
                      backgroundColor: activeTheme.colors.bg,
                      borderColor: activeTheme.colors.border,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shadow-xs"
                        style={{ backgroundColor: activeTheme.colors.primary }}
                      >
                        ✓
                      </span>
                      <span className="font-bold text-white text-[11px]">Daily Habit Demo</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-extrabold flex items-center gap-1"
                        style={{
                          backgroundColor: activeTheme.colors.pillBg,
                          color: activeTheme.colors.primary,
                        }}
                      >
                        🔥 14 DAYS STREAK
                      </span>

                      {/* Mini Gradient Progress Bar */}
                      <div className="w-20 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r"
                          style={{
                            width: '78%',
                            backgroundImage: `linear-gradient(to right, ${activeTheme.colors.primary}, ${activeTheme.colors.secondary})`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 🎴 2. Full Bespoke Gallery Grid View (7 Themes) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {APP_THEMES.map((theme, idx) => {
                const isSelected = theme.id === currentThemeId;

                return (
                  <div
                    key={`grid-theme-${theme.id}`}
                    onClick={() => handleSelectSlot(idx)}
                    className={`p-4 rounded-3xl border cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between gap-3 group ${
                      isSelected
                        ? 'ring-2 ring-rose-500 shadow-2xl scale-[1.02]'
                        : 'hover:scale-[1.015] hover:brightness-110'
                    }`}
                    style={{
                      background: theme.cardPreviewBg,
                      borderColor: isSelected ? '#F43F5E' : theme.colors.border,
                      boxShadow: isSelected
                        ? `0 15px 35px -5px ${theme.colors.glow}`
                        : `0 8px 20px -5px rgba(0,0,0,0.5)`,
                    }}
                  >
                    {/* Top Row: Icon, Title & Archetype Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-lg shrink-0 border transition-transform duration-300 group-hover:scale-105"
                          style={{
                            backgroundColor: theme.colors.bg,
                            borderColor: theme.colors.primary,
                          }}
                        >
                          <span>{theme.emoji}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-black text-white">
                              {theme.name}
                            </h4>
                          </div>
                          <span
                            className="inline-block text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md mt-0.5 border"
                            style={{
                              backgroundColor: theme.colors.pillBg,
                              color: theme.colors.primary,
                              borderColor: theme.colors.primary + '55',
                            }}
                          >
                            {theme.badge}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-mono text-[10px] font-black flex items-center gap-1 shadow-md animate-pulse">
                          <Check className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 group-hover:text-white transition-colors">
                          {theme.archetype}
                        </span>
                      )}
                    </div>

                    {/* Tagline */}
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {theme.tagline}
                    </p>

                    {/* Highlight Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {theme.highlights.map((hl, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-medium px-2 py-0.5 rounded-lg bg-black/40 border border-white/10 text-slate-300"
                        >
                          {hl}
                        </span>
                      ))}
                    </div>

                    {/* Mini UI Preview Box */}
                    <div
                      className="p-2.5 rounded-xl border flex items-center justify-between gap-2 text-[10px]"
                      style={{
                        backgroundColor: theme.colors.bg,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-md flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ backgroundColor: theme.colors.primary }}
                        >
                          ✓
                        </span>
                        <span className="font-semibold text-white truncate max-w-[100px]">
                          Habit UI Preview
                        </span>
                      </div>

                      {/* Mini Streak Pill */}
                      <span
                        className="px-2 py-0.5 rounded-md font-mono font-bold"
                        style={{
                          backgroundColor: theme.colors.pillBg,
                          color: theme.colors.primary,
                        }}
                      >
                        ⚡ 100%
                      </span>

                      {/* Palette Dots */}
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.secondary }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className="text-slate-400 font-mono">
                        {theme.isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSlot(idx);
                        }}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-xs ${
                          isSelected
                            ? 'bg-rose-500 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isSelected ? 'Current Theme' : 'Apply Theme'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
          <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Theme auto-syncs to your profile, SQLite & Supabase cloud.</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black tracking-wide transition-all hover:scale-105 cursor-pointer shadow-lg"
          >
            Done & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
