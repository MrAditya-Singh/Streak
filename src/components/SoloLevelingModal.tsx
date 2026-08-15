import React from 'react';
import { X, Sparkles, Shield, Award, Zap, Flame, Crown, Swords, Dumbbell, Brain, BookOpen, Briefcase } from 'lucide-react';
import { UserProfile } from '../types';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';

interface SoloLevelingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLevelUp: () => void;
}

export const SoloLevelingModal: React.FC<SoloLevelingModalProps> = ({
  isOpen,
  onClose,
  user,
  onLevelUp,
}) => {
  if (!isOpen) return null;

  const handleLevelUpClick = () => {
    soundFx.playLevelUp();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#af4bfb', '#58cc02', '#ffd700', '#00f0ff'],
    });
    onLevelUp();
  };

  const getRankColor = (rank: UserProfile['hunterRank']) => {
    switch (rank) {
      case 'National Level':
      case 'S':
        return 'from-amber-500 to-yellow-300 text-yellow-300 border-yellow-400/50 shadow-yellow-500/30';
      case 'A':
        return 'from-purple-600 to-indigo-400 text-purple-200 border-purple-400/50 shadow-purple-500/30';
      case 'B':
        return 'from-blue-600 to-cyan-400 text-blue-200 border-blue-400/50 shadow-blue-500/30';
      default:
        return 'from-emerald-600 to-green-400 text-green-200 border-green-400/50 shadow-green-500/30';
    }
  };

  const attrs = user.attributes || {
    strength: 72,
    intelligence: 91,
    discipline: 84,
    skill: 78,
    knowledge: 85,
    professional: 68,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#151928] to-[#0c0e18] border border-purple-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#151928]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">#SoloLeveling System</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-300 font-bold">
                  Awakened Hunter
                </span>
              </div>
              <p className="text-xs text-slate-400">Attributes calculated directly from your real activity consistency</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hunter Card Display */}
        <div className="p-6 space-y-5">
          {/* Hunter Status Banner */}
          <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center font-black text-2xl shadow-xl border ${getRankColor(
                  user.hunterRank
                )}`}
              >
                {user.hunterRank === 'National Level' ? <Crown className="w-7 h-7 text-yellow-300" /> : user.hunterRank}
              </div>

              <div>
                <div className="text-base font-black text-white flex items-center gap-2">
                  <span>Hunter {user.name}</span>
                </div>
                <div className="text-xs text-purple-300 font-semibold">
                  Rank-{user.hunterRank} Shadow Monarch Path
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Current Level: <span className="font-bold text-white">Level {user.level}</span> ({user.currentXP} / {user.xpToNextLevel} XP)
                </div>
              </div>
            </div>

            {/* Overall Streak Shield */}
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Streak Power</div>
              <div className="text-xl font-black text-streakOrange flex items-center justify-end gap-1">
                <Flame className="w-4 h-4 fill-streakOrange/20 animate-flame" />
                <span>{user.overallStreak}</span>
              </div>
            </div>
          </div>

          {/* 6 Real Attributes Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* 1. Intelligence (INT) */}
            <div className="p-3.5 rounded-xl bg-card/60 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5 text-duoBlue">
                  <Brain className="w-3.5 h-3.5" /> Intelligence (INT)
                </span>
                <span className="font-mono text-white font-bold">{attrs.intelligence} / 100</span>
              </div>
              <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-duoBlue rounded-full" style={{ width: `${attrs.intelligence}%` }} />
              </div>
            </div>

            {/* 2. Skill (SKILL) */}
            <div className="p-3.5 rounded-xl bg-card/60 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Zap className="w-3.5 h-3.5" /> Skill (SKILL)
                </span>
                <span className="font-mono text-white font-bold">{attrs.skill} / 100</span>
              </div>
              <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${attrs.skill}%` }} />
              </div>
            </div>

            {/* 3. Strength (STR) */}
            <div className="p-3.5 rounded-xl bg-card/60 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5 text-red-400">
                  <Dumbbell className="w-3.5 h-3.5" /> Strength (STR)
                </span>
                <span className="font-mono text-white font-bold">{attrs.strength} / 100</span>
              </div>
              <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${attrs.strength}%` }} />
              </div>
            </div>

            {/* 4. Discipline (DISC) */}
            <div className="p-3.5 rounded-xl bg-card/60 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5 text-streakOrange">
                  <Flame className="w-3.5 h-3.5" /> Discipline (DISC)
                </span>
                <span className="font-mono text-white font-bold">{attrs.discipline} / 100</span>
              </div>
              <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-streakOrange rounded-full" style={{ width: `${attrs.discipline}%` }} />
              </div>
            </div>

            {/* 5. Knowledge (KNOW) */}
            <div className="p-3.5 rounded-xl bg-card/60 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5 text-purple-400">
                  <BookOpen className="w-3.5 h-3.5" /> Knowledge (KNOW)
                </span>
                <span className="font-mono text-white font-bold">{attrs.knowledge} / 100</span>
              </div>
              <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${attrs.knowledge}%` }} />
              </div>
            </div>

            {/* 6. Professional (PROF) */}
            <div className="p-3.5 rounded-xl bg-card/60 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Briefcase className="w-3.5 h-3.5" /> Professional (PROF)
                </span>
                <span className="font-mono text-white font-bold">{attrs.professional} / 100</span>
              </div>
              <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${attrs.professional}%` }} />
              </div>
            </div>
          </div>

          {/* Level Up Trigger Button */}
          <button
            onClick={handleLevelUpClick}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-glow-purple transition-all transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Awaken / Level Up (+100 XP)</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end bg-[#151928]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all"
          >
            Close System
          </button>
        </div>
      </div>
    </div>
  );
};
