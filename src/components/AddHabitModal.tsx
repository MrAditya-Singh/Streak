import React, { useState } from 'react';
import { X, Plus, Sparkles, Globe, UserCheck, Flame, Zap, Dumbbell, BookOpen, Briefcase, Heart, Code2 } from 'lucide-react';
import { ActivityItem, ActivityCategory } from '../types';
import { soundFx } from '../utils/audio';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (newHabit: ActivityItem) => void;
  isDarkMode?: boolean;
}

const PRESET_ONLINE_PLATFORMS = [
  { id: 'github', name: 'GitHub', defaultUrl: 'https://github.com/MrAditya-Singh', category: 'coding' as ActivityCategory, icon: 'Github' },
  { id: 'leetcode', name: 'LeetCode', defaultUrl: 'https://leetcode.com/u/mradityasingh', category: 'coding' as ActivityCategory, icon: 'Code2' },
  { id: 'codeforces', name: 'Codeforces', defaultUrl: 'https://codeforces.com/profile/Aditya__YUPP', category: 'coding' as ActivityCategory, icon: 'BarChart3' },
  { id: 'gfg', name: 'GeeksforGeeks', defaultUrl: 'https://www.geeksforgeeks.org/user/mraditya', category: 'coding' as ActivityCategory, icon: 'Binary' },
  { id: 'atcoder', name: 'AtCoder', defaultUrl: 'https://atcoder.jp/users/MrAditya', category: 'coding' as ActivityCategory, icon: 'Zap' },
  { id: 'hackerrank', name: 'HackerRank', defaultUrl: 'https://www.hackerrank.com/profile/mradityasingh', category: 'coding' as ActivityCategory, icon: 'Terminal' },
  { id: 'codestudio', name: 'CodeStudio', defaultUrl: 'https://www.naukri.com/code360/profile/', category: 'coding' as ActivityCategory, icon: 'Code2' },
  { id: 'interviewbit', name: 'InterviewBit', defaultUrl: 'https://www.interviewbit.com/profile/', category: 'coding' as ActivityCategory, icon: 'Briefcase' },
  { id: 'youtube', name: 'YouTube', defaultUrl: 'https://www.youtube.com/@Viralhit-1', category: 'personal' as ActivityCategory, icon: 'Youtube' },
];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onAddHabit,
  isDarkMode = false,
}) => {
  // Mode: 'manual' (Offline/Self-tracked) or 'online' (Platform/API Scraped)
  const [mode, setMode] = useState<'manual' | 'online'>('manual');

  // Manual Form State
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState<ActivityCategory>('fitness');
  const [manualDuration, setManualDuration] = useState(45);
  const [manualPriority, setManualPriority] = useState(3);
  const [manualXpReward, setManualXpReward] = useState(20);
  const [countsToStreak, setCountsToStreak] = useState(true);

  // Online Platform Form State
  const [selectedPlatformPreset, setSelectedPlatformPreset] = useState('custom');
  const [onlineName, setOnlineName] = useState('');
  const [onlineProfileUrl, setOnlineProfileUrl] = useState('');
  const [onlineCategory, setOnlineCategory] = useState<ActivityCategory>('coding');
  const [onlineDuration, setOnlineDuration] = useState(60);

  if (!isOpen) return null;

  const handleSelectPreset = (platformId: string) => {
    setSelectedPlatformPreset(platformId);
    if (platformId === 'custom') {
      setOnlineName('');
      setOnlineProfileUrl('');
      setOnlineCategory('coding');
    } else {
      const p = PRESET_ONLINE_PLATFORMS.find((item) => item.id === platformId);
      if (p) {
        setOnlineName(p.name);
        setOnlineProfileUrl(p.defaultUrl);
        setOnlineCategory(p.category);
      }
    }
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    soundFx.playCheck();
    const id = manualName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    
    const newAct: ActivityItem = {
      id,
      name: manualName.trim(),
      category: manualCategory,
      iconName: 'Star',
      plannedMinutes: Number(manualDuration) || 30,
      completed: false,
      streak: 1,
      source: 'manual',
      xpReward: Number(manualXpReward) || 20,
      priority: manualPriority,
      color: manualCategory === 'fitness' ? '#ef4444' : manualCategory === 'education' ? '#3b82f6' : '#10b981',
      countsTowardOverallStreak: countsToStreak,
      countsTowardXP: true,
    };

    onAddHabit(newAct);
    setManualName('');
    onClose();
  };

  const handleSubmitOnline = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = onlineName.trim() || selectedPlatformPreset.toUpperCase();
    if (!finalName || !onlineProfileUrl.trim()) return;

    soundFx.playCheck();
    const id = selectedPlatformPreset !== 'custom' 
      ? selectedPlatformPreset 
      : finalName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);

    const newAct: ActivityItem = {
      id,
      name: finalName,
      category: onlineCategory,
      iconName: 'Zap',
      plannedMinutes: Number(onlineDuration) || 60,
      completed: false,
      streak: 1,
      url: onlineProfileUrl.trim(),
      source: selectedPlatformPreset as any,
      xpReward: 25,
      priority: 4,
      color: '#ffa116',
      countsTowardOverallStreak: true,
      countsTowardXP: true,
      isAutoDetected: true,
    };

    onAddHabit(newAct);
    setOnlineName('');
    setOnlineProfileUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121622] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Add New Habit to Daily Tracker</h2>
              <p className="text-xs text-slate-400">Choose between self-tracked manual tasks or auto-synced online profiles</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Option Segmented Selector: Manual vs Online */}
        <div className="p-4 bg-black/20 border-b border-white/5">
          <div className="grid grid-cols-2 p-1 bg-black/50 border border-white/10 rounded-2xl">
            <button
              onClick={() => {
                soundFx.playClick();
                setMode('manual');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'manual'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Manual / Offline Habit</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setMode('online');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'online'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Online Platform / Auto-Sync</span>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6">
          
          {/* ======================================================== */}
          {/* 1. MANUAL HABIT FORM (OFFLINE / PERSONAL / GYM / STUDY)  */}
          {/* ======================================================== */}
          {mode === 'manual' && (
            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-300">Habit / Task Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gym Workout, Read 10 Pages, German B2, Meditation"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full mt-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Category</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as ActivityCategory)}
                    className="w-full mt-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="fitness">Fitness / Health / Gym</option>
                    <option value="education">Education / Study / Books</option>
                    <option value="coding">Coding / Development</option>
                    <option value="career">Career / Work / Earn</option>
                    <option value="project">Project / Creation</option>
                    <option value="personal">Personal / Life Goal</option>
                    <option value="rest">Rest / Sleep / Mindset</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300">Planned Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className="w-full mt-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">XP Reward on Completion</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={manualXpReward}
                    onChange={(e) => setManualXpReward(Number(e.target.value))}
                    className="w-full mt-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300">Priority (1-5)</label>
                  <select
                    value={manualPriority}
                    onChange={(e) => setManualPriority(Number(e.target.value))}
                    className="w-full mt-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5 (High Urgent)</option>
                    <option value={4}>⭐⭐⭐⭐ 4 (High)</option>
                    <option value={3}>⭐⭐⭐ 3 (Normal / Standard)</option>
                    <option value={2}>⭐⭐ 2 (Low)</option>
                    <option value={1}>⭐ 1 (Optional)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white">Counts to Strict Streak Policy:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Required every day to increase your overall streak counter.</p>
                </div>
                <input
                  type="checkbox"
                  checked={countsToStreak}
                  onChange={(e) => setCountsToStreak(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  + Add Manual Habit
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 2. ONLINE PLATFORM FORM (AUTO-SCRAPER & API TRACKED)     */}
          {/* ======================================================== */}
          {mode === 'online' && (
            <form onSubmit={handleSubmitOnline} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-300">Choose Online Platform</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5 max-h-36 overflow-y-auto pr-1">
                  {PRESET_ONLINE_PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.id)}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                        selectedPlatformPreset === p.id
                          ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow-xs'
                          : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/15'
                      }`}
                    >
                      <div>{p.name}</div>
                      <span className="text-[9px] text-slate-500 uppercase font-mono">{p.category}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('custom')}
                    className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                      selectedPlatformPreset === 'custom'
                        ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow-xs'
                        : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <div>+ Custom Platform</div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono">Other</span>
                  </button>
                </div>
              </div>

              {selectedPlatformPreset === 'custom' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Custom Platform / Service Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kaggle, TryHackMe, Monkeytype, Duolingo, CodeChef"
                    value={onlineName}
                    onChange={(e) => setOnlineName(e.target.value)}
                    className="w-full mt-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-300">Public Profile Link or Username</label>
                <input
                  type="text"
                  placeholder="https://... or username"
                  value={onlineProfileUrl}
                  onChange={(e) => setOnlineProfileUrl(e.target.value)}
                  className="w-full mt-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Category</label>
                  <select
                    value={onlineCategory}
                    onChange={(e) => setOnlineCategory(e.target.value as ActivityCategory)}
                    className="w-full mt-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="coding">Coding / Dev</option>
                    <option value="education">Education / Learning</option>
                    <option value="project">Project / Build</option>
                    <option value="personal">Personal / Goal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300">Planned Duration (Minutes)</label>
                  <input
                    type="number"
                    min={10}
                    max={360}
                    value={onlineDuration}
                    onChange={(e) => setOnlineDuration(Number(e.target.value))}
                    className="w-full mt-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
                >
                  + Add Online Platform Habit
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
