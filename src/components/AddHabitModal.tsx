import React, { useState } from 'react';
import { X, Plus, Globe, Dumbbell } from 'lucide-react';
import { ActivityItem, ActivityCategory } from '../types';
import { soundFx } from '../utils/audio';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (newHabit: ActivityItem) => void;
  isDarkMode?: boolean;
}

const PRESET_ONLINE_PLATFORMS = [
  { id: 'github', name: 'GitHub', defaultUrl: 'https://github.com/', category: 'coding' as ActivityCategory, icon: 'Github' },
  { id: 'leetcode', name: 'LeetCode', defaultUrl: 'https://leetcode.com/u/', category: 'coding' as ActivityCategory, icon: 'Code2' },
  { id: 'codeforces', name: 'Codeforces', defaultUrl: 'https://codeforces.com/profile/', category: 'coding' as ActivityCategory, icon: 'BarChart3' },
  { id: 'gfg', name: 'GeeksforGeeks', defaultUrl: 'https://www.geeksforgeeks.org/user/', category: 'coding' as ActivityCategory, icon: 'Binary' },
  { id: 'atcoder', name: 'AtCoder', defaultUrl: 'https://atcoder.jp/users/', category: 'coding' as ActivityCategory, icon: 'Zap' },
  { id: 'hackerrank', name: 'HackerRank', defaultUrl: 'https://www.hackerrank.com/profile/', category: 'coding' as ActivityCategory, icon: 'Terminal' },
  { id: 'codestudio', name: 'CodeStudio', defaultUrl: 'https://www.naukri.com/code360/profile/', category: 'coding' as ActivityCategory, icon: 'Code2' },
  { id: 'interviewbit', name: 'InterviewBit', defaultUrl: 'https://www.interviewbit.com/profile/', category: 'coding' as ActivityCategory, icon: 'Briefcase' },
  { id: 'youtube', name: 'YouTube', defaultUrl: 'https://www.youtube.com/@', category: 'personal' as ActivityCategory, icon: 'Youtube' },
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
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
      isDarkMode ? 'bg-black/80' : 'bg-slate-900/50'
    }`}>
      <div className={`rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col border transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#121622] border-white/10 text-white shadow-purple-950/20' 
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10'
      }`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between transition-colors ${
          isDarkMode ? 'border-white/10 bg-black/40' : 'border-slate-100 bg-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Add New Habit to Daily Tracker
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Choose between self-tracked manual tasks or auto-synced online profiles
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Option Segmented Selector: Manual vs Online */}
        <div className={`p-4 border-b transition-colors ${
          isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50/80 border-slate-100'
        }`}>
          <div className={`grid grid-cols-2 p-1 border rounded-2xl ${
            isDarkMode ? 'bg-black/50 border-white/10' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <button
              onClick={() => {
                soundFx.playClick();
                setMode('manual');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'manual'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
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
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Online Platform / Auto-Sync</span>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className={`p-6 transition-colors ${isDarkMode ? 'bg-[#121622]' : 'bg-white'}`}>
          
          {/* ======================================================== */}
          {/* 1. MANUAL HABIT FORM (OFFLINE / PERSONAL / GYM / STUDY)  */}
          {/* ======================================================== */}
          {mode === 'manual' && (
            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div>
                <label className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Habit / Task Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gym Workout, Read 10 Pages, German B2, Meditation"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className={`w-full mt-1 border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 ${
                    isDarkMode 
                      ? 'bg-black/60 border-white/10'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as ActivityCategory)}
                    className={`w-full mt-1 border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 ${
                      isDarkMode 
                        ? 'bg-black/60 border-white/10' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
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
                  <label className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Planned Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className={`w-full mt-1 border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 font-mono ${
                      isDarkMode 
                        ? 'bg-black/60 border-white/10' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>XP Reward on Completion</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={manualXpReward}
                    onChange={(e) => setManualXpReward(Number(e.target.value))}
                    className={`w-full mt-1 border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 font-mono ${
                      isDarkMode 
                        ? 'bg-black/60 border-white/10' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Priority (1-5)</label>
                  <select
                    value={manualPriority}
                    onChange={(e) => setManualPriority(Number(e.target.value))}
                    className={`w-full mt-1 border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 ${
                      isDarkMode 
                        ? 'bg-black/60 border-white/10' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5 (High Urgent)</option>
                    <option value={4}>⭐⭐⭐⭐ 4 (High)</option>
                    <option value={3}>⭐⭐⭐ 3 (Normal / Standard)</option>
                    <option value={2}>⭐⭐ 2 (Low)</option>
                    <option value={1}>⭐ 1 (Optional)</option>
                  </select>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDarkMode 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}>
                <div className="text-xs">
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>Counts to Strict Streak Policy:</span>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-emerald-800'}`}>Required every day to increase your overall streak counter.</p>
                </div>
                <input
                  type="checkbox"
                  checked={countsToStreak}
                  onChange={(e) => setCountsToStreak(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
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
                <label className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Choose Online Platform</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5 max-h-36 overflow-y-auto pr-1">
                  {PRESET_ONLINE_PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.id)}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                        selectedPlatformPreset === p.id
                          ? 'bg-purple-600/30 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                          : isDarkMode
                            ? 'bg-black/40 border-white/5 text-slate-400 hover:border-white/15'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-purple-300'
                      }`}
                    >
                      <div>{p.name}</div>
                      <span className={`text-[9px] uppercase font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{p.category}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('custom')}
                    className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                      selectedPlatformPreset === 'custom'
                        ? 'bg-purple-600/30 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                        : isDarkMode
                          ? 'bg-black/40 border-white/5 text-slate-400 hover:border-white/15'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-purple-300'
                    }`}
                  >
                    <div>+ Custom Platform</div>
                    <span className={`text-[9px] uppercase font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Other</span>
                  </button>
                </div>
              </div>

              {selectedPlatformPreset === 'custom' && (
                <div>
                  <label className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Custom Platform / Service Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kaggle, TryHackMe, Monkeytype, Duolingo, CodeChef"
                    value={onlineName}
                    onChange={(e) => setOnlineName(e.target.value)}
                    className={`w-full mt-1 border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-purple-500 ${
                      isDarkMode 
                        ? 'bg-black/60 border-white/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                    required
                  />
                </div>
              )}

              <div>
                <label className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Public Profile Link or Username</label>
                <input
                  type="text"
                  placeholder="https://... or username"
                  value={onlineProfileUrl}
                  onChange={(e) => setOnlineProfileUrl(e.target.value)}
                  className={`w-full mt-1 border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-purple-500 font-mono ${
                    isDarkMode 
                      ? 'bg-black/60 border-white/10'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
                  <select
                    value={onlineCategory}
                    onChange={(e) => setOnlineCategory(e.target.value as ActivityCategory)}
                    className={`w-full mt-1 border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-purple-500 ${
                      isDarkMode 
                        ? 'bg-black/60 border-white/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="coding">Coding / Dev</option>
                    <option value="education">Education / Learning</option>
                    <option value="project">Project / Build</option>
                    <option value="personal">Personal / Goal</option>
                  </select>
                </div>

                <div>
                  <label className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Planned Duration (Minutes)</label>
                  <input
                    type="number"
                    min={10}
                    max={360}
                    value={onlineDuration}
                    onChange={(e) => setOnlineDuration(Number(e.target.value))}
                    className={`w-full mt-1 border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-purple-500 font-mono ${
                      isDarkMode 
                        ? 'bg-black/60 border-white/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
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
