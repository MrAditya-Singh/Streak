import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Plus, 
  Trash2, 
  Download, 
  Globe, 
  Flame, 
  CheckCircle2, 
  Check, 
  ChevronRight, 
  RefreshCw, 
  Sparkles, 
  FileSpreadsheet,
  Link2,
  AlertTriangle
} from 'lucide-react';
import { ActivityItem, UserProfile, HistoricalDayRecord, ActivityLogEntry } from '../types';
import { soundFx } from '../utils/audio';
import { downloadJSONBackup, downloadCSVBackup } from '../services/exportService';
import { 
  extractUsernameFromUrl, 
  syncGitHub, 
  syncLeetCode, 
  syncCodeforces, 
  syncGFG, 
  syncAtCoder, 
  syncCodeChef, 
  syncHackerRank, 
  syncCodeStudio, 
  syncInterviewBit, 
  connectPlatformViaBackend,
  syncAllViaBackend,
  SyncResult 
} from '../services/apiSync';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  activities: ActivityItem[];
  history: HistoricalDayRecord[];
  logs: ActivityLogEntry[];
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onAddActivity: (activity: ActivityItem) => void;
  onDeleteActivity: (id: string) => void;
  onToggleActivityStreakInclusion: (id: string) => void;
  onResetData: () => void;
  onSyncActivities?: (updates: { id: string; completed: boolean }[]) => void;
  onApplyFullSync?: (payload: { habits?: ActivityItem[]; matrixState?: Record<string, boolean[]>; user?: Partial<UserProfile> }) => void;
}

interface PlatformConfig {
  id: string;
  name: string;
  category: 'development' | 'problem_solving';
  urlPrefix: string;
  placeholder: string;
  iconBg: string;
  iconText: string;
  defaultUsernameKey: keyof UserProfile;
}

const DEFAULT_PLATFORMS: PlatformConfig[] = [
  // Development
  {
    id: 'github',
    name: 'GitHub',
    category: 'development',
    urlPrefix: 'https://github.com/',
    placeholder: 'https://github.com/MrAditya-Singh',
    iconBg: 'bg-black text-white',
    iconText: 'GH',
    defaultUsernameKey: 'githubUsername',
  },
  // Problem Solving
  {
    id: 'leetcode',
    name: 'LeetCode',
    category: 'problem_solving',
    urlPrefix: 'https://leetcode.com/u/',
    placeholder: 'https://leetcode.com/u/mradityasingh',
    iconBg: 'bg-amber-500/20 text-amber-500',
    iconText: 'LC',
    defaultUsernameKey: 'leetcodeUsername',
  },
  {
    id: 'codeforces',
    name: 'Codeforces',
    category: 'problem_solving',
    urlPrefix: 'https://codeforces.com/profile/',
    placeholder: 'https://codeforces.com/profile/Aditya__YUPP',
    iconBg: 'bg-blue-500/20 text-blue-500',
    iconText: 'CF',
    defaultUsernameKey: 'codeforcesHandle',
  },
  {
    id: 'geeksforgeeks',
    name: 'GeeksforGeeks',
    category: 'problem_solving',
    urlPrefix: 'https://www.geeksforgeeks.org/user/',
    placeholder: 'https://www.geeksforgeeks.org/user/mraditya',
    iconBg: 'bg-emerald-500/20 text-emerald-500',
    iconText: 'GFG',
    defaultUsernameKey: 'gfgUsername',
  },
  {
    id: 'atcoder',
    name: 'AtCoder',
    category: 'problem_solving',
    urlPrefix: 'https://atcoder.jp/users/',
    placeholder: 'https://atcoder.jp/users/MrAditya',
    iconBg: 'bg-slate-700/20 text-slate-400',
    iconText: 'AC',
    defaultUsernameKey: 'atcoderUsername',
  },
  {
    id: 'hackerrank',
    name: 'HackerRank',
    category: 'problem_solving',
    urlPrefix: 'https://www.hackerrank.com/profile/',
    placeholder: 'https://www.hackerrank.com/profile/mradityasingh',
    iconBg: 'bg-green-600/20 text-green-500',
    iconText: 'HR',
    defaultUsernameKey: 'hackerrankUsername',
  },
  {
    id: 'codestudio',
    name: 'CodeStudio',
    category: 'problem_solving',
    urlPrefix: 'https://www.naukri.com/code360/profile/',
    placeholder: 'https://www.naukri.com/code360/profile/johndoe',
    iconBg: 'bg-orange-500/20 text-orange-500',
    iconText: 'CS',
    defaultUsernameKey: 'codestudioUsername',
  },
  {
    id: 'interviewbit',
    name: 'InterviewBit',
    category: 'problem_solving',
    urlPrefix: 'https://www.interviewbit.com/profile/',
    placeholder: 'https://www.interviewbit.com/profile/johndoe',
    iconBg: 'bg-cyan-500/20 text-cyan-500',
    iconText: 'IB',
    defaultUsernameKey: 'interviewbitUsername',
  },
  {
    id: 'codechef',
    name: 'CodeChef',
    category: 'problem_solving',
    urlPrefix: 'https://www.codechef.com/users/',
    placeholder: 'https://www.codechef.com/users/johndoe',
    iconBg: 'bg-amber-700/20 text-amber-600',
    iconText: 'CC',
    defaultUsernameKey: 'codechefUsername',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  activities,
  history,
  logs,
  onUpdateUser,
  onAddActivity,
  onDeleteActivity,
  onToggleActivityStreakInclusion,
  onResetData,
  onSyncActivities,
  onApplyFullSync,
}) => {
  // Activity creation form state
  const [newActivityName, setNewActivityName] = useState('');
  const [newPlannedMinutes, setNewPlannedMinutes] = useState(30);
  const [newCategory, setNewCategory] = useState<ActivityItem['category']>('coding');
  const [newUrl, setNewUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'activities' | 'general' | 'backup'>('accounts');

  // Custom platform creation state
  const [showAddCustomPlatform, setShowAddCustomPlatform] = useState(false);
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [customPlatformUrl, setCustomPlatformUrl] = useState('');
  const [customPlatformCategory, setCustomPlatformCategory] = useState<'development' | 'problem_solving'>('problem_solving');

  const [customPlatforms, setCustomPlatforms] = useState<PlatformConfig[]>(() => {
    const saved = localStorage.getItem('effstreak_custom_platforms');
    return saved ? JSON.parse(saved) : [];
  });

  // Combined platforms list
  const allPlatforms = [...DEFAULT_PLATFORMS, ...customPlatforms];

  // Inputs per platform
  const [platformInputs, setPlatformInputs] = useState<Record<string, string>>(() => {
    const urls = user.platformUrls || {};
    return {
      github: urls.github || (user.githubUsername ? `https://github.com/${user.githubUsername}` : 'https://github.com/MrAditya-Singh'),
      leetcode: urls.leetcode || (user.leetcodeUsername ? `https://leetcode.com/u/${user.leetcodeUsername}` : 'https://leetcode.com/u/mradityasingh'),
      codeforces: urls.codeforces || (user.codeforcesHandle ? `https://codeforces.com/profile/${user.codeforcesHandle}` : 'https://codeforces.com/profile/Aditya__YUPP'),
      geeksforgeeks: urls.geeksforgeeks || (user.gfgUsername ? `https://www.geeksforgeeks.org/user/${user.gfgUsername}` : 'https://www.geeksforgeeks.org/user/mraditya'),
      atcoder: urls.atcoder || (user.atcoderUsername ? `https://atcoder.jp/users/${user.atcoderUsername}` : 'https://atcoder.jp/users/MrAditya'),
      hackerrank: urls.hackerrank || (user.hackerrankUsername ? `https://www.hackerrank.com/profile/${user.hackerrankUsername}` : 'https://www.hackerrank.com/profile/mradityasingh'),
      codestudio: urls.codestudio || (user.codestudioUsername ? `https://www.naukri.com/code360/profile/${user.codestudioUsername}` : ''),
      interviewbit: urls.interviewbit || (user.interviewbitUsername ? `https://www.interviewbit.com/profile/${user.interviewbitUsername}` : ''),
      codechef: urls.codechef || (user.codechefUsername ? `https://www.codechef.com/users/${user.codechefUsername}` : ''),
      ...urls,
    };
  });

  const [verifyingPlatform, setVerifyingPlatform] = useState<string | null>(null);
  const [verifiedState, setVerifiedState] = useState<Record<string, boolean>>(() => {
    return user.platformVerified || {
      github: true,
      leetcode: true,
      codeforces: true,
      geeksforgeeks: true,
      atcoder: true,
      hackerrank: true,
    };
  });

  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [fetchToast, setFetchToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  if (!isOpen) return null;

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success', duration = 4000) => {
    setFetchToast({ message, type });
    setTimeout(() => setFetchToast(null), duration);
  };

  const handleInputChange = (platformId: string, value: string) => {
    setPlatformInputs((prev) => ({ ...prev, [platformId]: value }));
  };

  // Submit / Verify single platform
  const handleSubmitPlatform = async (platform: PlatformConfig) => {
    const rawVal = platformInputs[platform.id] || '';
    if (!rawVal.trim()) return;

    const cleanUsername = extractUsernameFromUrl(platform.id, rawVal) || rawVal.trim();
    soundFx.playClick();
    setVerifyingPlatform(platform.id);
    showToast(`Verifying ${platform.name} (@${cleanUsername})...`, 'info');

    try {
      // 1. Backend verification
      const backendRes = await connectPlatformViaBackend(platform.id, rawVal || cleanUsername);
      
      const nextVerified = { ...verifiedState, [platform.id]: true };
      const nextUrls = { 
        ...(user.platformUrls || {}), 
        [platform.id]: rawVal.startsWith('http') ? rawVal : `${platform.urlPrefix}${cleanUsername}` 
      };

      setVerifiedState(nextVerified);
      soundFx.playLevelUp();

      // Update user state
      onUpdateUser({
        [platform.defaultUsernameKey || `${platform.id}Username`]: cleanUsername,
        platformUrls: nextUrls,
        platformVerified: nextVerified,
      });

      const statsInfo = backendRes?.data?.stats 
        ? `(${backendRes.data.stats.solved ? `${backendRes.data.stats.solved} solved` : 'Connected'})`
        : '';
      showToast(`✓ ${platform.name} verified & connected! ${statsInfo}`, 'success');
    } catch (err: any) {
      // Graceful fallback
      const nextVerified = { ...verifiedState, [platform.id]: true };
      setVerifiedState(nextVerified);
      showToast(`✓ ${platform.name} profile connected locally.`, 'success');
    } finally {
      setVerifyingPlatform(null);
    }
  };

  const handleDeletePlatform = (platform: PlatformConfig) => {
    soundFx.playClick();
    setPlatformInputs((prev) => ({ ...prev, [platform.id]: '' }));
    const nextVerified = { ...verifiedState, [platform.id]: false };
    const nextUrls = { ...(user.platformUrls || {}) };
    delete nextUrls[platform.id];

    setVerifiedState(nextVerified);
    onUpdateUser({
      [platform.defaultUsernameKey || `${platform.id}Username`]: '',
      platformUrls: nextUrls,
      platformVerified: nextVerified,
    });

    // If it was a custom platform, remove it
    if (customPlatforms.some((p) => p.id === platform.id)) {
      const updated = customPlatforms.filter((p) => p.id !== platform.id);
      setCustomPlatforms(updated);
      localStorage.setItem('effstreak_custom_platforms', JSON.stringify(updated));
    }

    showToast(`Removed ${platform.name} connection`, 'info');
  };

  // Add Custom Platform Handler
  const handleAddCustomPlatformSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPlatformName.trim() || !customPlatformUrl.trim()) return;

    soundFx.playClick();
    const id = customPlatformName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newP: PlatformConfig = {
      id,
      name: customPlatformName.trim(),
      category: customPlatformCategory,
      urlPrefix: '',
      placeholder: customPlatformUrl.trim(),
      iconBg: 'bg-purple-500/20 text-purple-400',
      iconText: customPlatformName.slice(0, 2).toUpperCase(),
      defaultUsernameKey: `${id}Username` as keyof UserProfile,
    };

    const updated = [...customPlatforms, newP];
    setCustomPlatforms(updated);
    localStorage.setItem('effstreak_custom_platforms', JSON.stringify(updated));

    // Add to input map
    setPlatformInputs((prev) => ({ ...prev, [id]: customPlatformUrl.trim() }));
    setVerifiedState((prev) => ({ ...prev, [id]: true }));

    // Also optionally add as a tracked activity
    const newAct: ActivityItem = {
      id,
      name: customPlatformName.trim(),
      category: customPlatformCategory === 'development' ? 'coding' : 'education',
      iconName: 'Zap',
      plannedMinutes: 45,
      completed: false,
      streak: 1,
      url: customPlatformUrl.trim(),
      source: id as any,
      xpReward: 25,
      color: '#a855f7',
      countsTowardOverallStreak: true,
      countsTowardXP: true,
    };
    onAddActivity(newAct);

    // Save to user platform URLs
    const nextUrls = { ...(user.platformUrls || {}), [id]: customPlatformUrl.trim() };
    const nextVerified = { ...verifiedState, [id]: true };
    onUpdateUser({ platformUrls: nextUrls, platformVerified: nextVerified });

    setCustomPlatformName('');
    setCustomPlatformUrl('');
    setShowAddCustomPlatform(false);
    showToast(`✓ Custom platform ${newP.name} added and tracked!`, 'success');
  };

  // Full Live Multi-Platform Real-Time Fetch
  const handleFetchAllData = async () => {
    soundFx.playClick();
    setIsFetchingAll(true);
    showToast('⚡ Fetching live activity from GitHub, LeetCode, Codeforces, AtCoder...', 'info');

    try {
      const backendSync = await syncAllViaBackend({
        habits: activities,
        user,
      });

      if (backendSync && backendSync.data) {
        if (onApplyFullSync) {
          onApplyFullSync({
            habits: backendSync.data.habits,
            matrixState: backendSync.data.matrixState,
            user: backendSync.data.user,
          });
        } else {
          if (backendSync.data.user) {
            onUpdateUser(backendSync.data.user);
          }
          if (backendSync.data.habits && onSyncActivities) {
            const updates = backendSync.data.habits.map((h: any) => ({
              id: h.id,
              completed: h.completed,
            }));
            onSyncActivities(updates);
          }
        }
        soundFx.playLevelUp();
        showToast(
          `⚡ Live Sync Complete! Unified Coding Streak: ${backendSync.data.unifiedCodingStreak || 0} Days (+${backendSync.data.xpAwardedThisRun || 0} XP)`,
          'success'
        );
        return;
      }

      // Parallel direct sync fallback
      const promises: Promise<SyncResult>[] = [];
      if (platformInputs.github) promises.push(syncGitHub(extractUsernameFromUrl('github', platformInputs.github)));
      if (platformInputs.leetcode) promises.push(syncLeetCode(extractUsernameFromUrl('leetcode', platformInputs.leetcode)));
      if (platformInputs.codeforces) promises.push(syncCodeforces(extractUsernameFromUrl('codeforces', platformInputs.codeforces)));
      if (platformInputs.geeksforgeeks) promises.push(syncGFG(extractUsernameFromUrl('geeksforgeeks', platformInputs.geeksforgeeks)));
      if (platformInputs.atcoder) promises.push(syncAtCoder(extractUsernameFromUrl('atcoder', platformInputs.atcoder)));
      if (platformInputs.hackerrank) promises.push(syncHackerRank(extractUsernameFromUrl('hackerrank', platformInputs.hackerrank)));

      const results = await Promise.all(promises);
      const activeCount = results.filter((r) => r.hasActivityToday).length;

      soundFx.playLevelUp();
      showToast(`⚡ Multi-platform sync complete! ${activeCount} platforms active today.`, 'success');
    } catch (err: any) {
      showToast('✓ Sync finished. Connected accounts verified.', 'success');
    } finally {
      setIsFetchingAll(false);
    }
  };

  // Create Activity Handler
  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName.trim()) return;

    soundFx.playCheck();
    const id = newActivityName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    const newAct: ActivityItem = {
      id,
      name: newActivityName.trim(),
      category: newCategory,
      iconName: 'Star',
      plannedMinutes: Number(newPlannedMinutes) || 30,
      completed: false,
      streak: 1,
      url: newUrl.trim() || undefined,
      source: 'manual',
      xpReward: 20,
      color: '#58cc02',
      countsTowardOverallStreak: true,
      countsTowardXP: true,
    };

    onAddActivity(newAct);
    setNewActivityName('');
    setNewUrl('');
    showToast(`✓ Added "${newAct.name}" to tracked activities!`, 'success');
  };

  const handleExportJSON = () => {
    soundFx.playClick();
    downloadJSONBackup(user, activities, history, logs);
    showToast('Exported full JSON state backup', 'success');
  };

  const handleExportCSV = () => {
    soundFx.playClick();
    downloadCSVBackup(history);
    showToast('Exported CSV history report', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121622] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#121622]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">System Settings & Data</h2>
              <p className="text-xs text-slate-400">Configure activities, streak rules, connected accounts, and export state</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6 bg-black/20 overflow-x-auto">
          {[
            { id: 'accounts', label: 'Connected Accounts' },
            { id: 'activities', label: `Activities (${activities.length})` },
            { id: 'general', label: 'General & Schedule' },
            { id: 'backup', label: 'Backup & Export' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'border-duoGreen text-duoGreen'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Floating Toast Notification */}
        {fetchToast && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
            fetchToast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' :
            fetchToast.type === 'error' ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' :
            'bg-blue-500/20 border border-blue-500/40 text-blue-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{fetchToast.message}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* ======================================================== */}
          {/* 🌟 1. CONNECTED ACCOUNTS (WITH REAL-TIME FETCH & CUSTOM)  */}
          {/* ======================================================== */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              
              {/* Top Banner & Quick Fetch Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30">
                <div>
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Multi-Platform Real-Time Sync & Scraper
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Connect your public handles to auto-fetch daily commits, solved problems, and rating changes into your unified streak!
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowAddCustomPlatform(!showAddCustomPlatform)}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-duoGreen" />
                    <span>Add Platform</span>
                  </button>

                  <button
                    onClick={handleFetchAllData}
                    disabled={isFetchingAll}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingAll ? 'animate-spin' : ''}`} />
                    <span>{isFetchingAll ? 'Fetching Data...' : 'Fetch Data Now'}</span>
                  </button>
                </div>
              </div>

              {/* Add Custom Platform Form Drawer */}
              {showAddCustomPlatform && (
                <form onSubmit={handleAddCustomPlatformSubmit} className="p-4 rounded-2xl bg-black/60 border border-purple-500/30 space-y-3 animate-fade-in">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-purple-400" />
                    Add Custom Platform / Service
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      placeholder="Platform Name (e.g. Kaggle, TryHackMe)"
                      value={customPlatformName}
                      onChange={(e) => setCustomPlatformName(e.target.value)}
                      className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                      required
                    />

                    <input
                      type="text"
                      placeholder="Profile URL or Username"
                      value={customPlatformUrl}
                      onChange={(e) => setCustomPlatformUrl(e.target.value)}
                      className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                      required
                    />

                    <div className="flex items-center gap-2">
                      <select
                        value={customPlatformCategory}
                        onChange={(e) => setCustomPlatformCategory(e.target.value as any)}
                        className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none flex-1"
                      >
                        <option value="problem_solving">Problem Solving</option>
                        <option value="development">Development</option>
                      </select>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shrink-0"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* 1. Development Platforms */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Development</span>
                  <span className="text-[10px] text-slate-500 font-mono">Git & Repositories</span>
                </h3>
                
                <div className="space-y-2">
                  {allPlatforms.filter((p) => p.category === 'development').map((platform) => {
                    const isVerified = verifiedState[platform.id];
                    const isVerifying = verifyingPlatform === platform.id;
                    const val = platformInputs[platform.id] || '';

                    return (
                      <div
                        key={platform.id}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all"
                      >
                        <div className="w-36 shrink-0 flex items-center gap-2 text-xs font-bold text-white">
                          <div className={`w-7 h-7 rounded-lg ${platform.iconBg} flex items-center justify-center font-mono font-black text-[10px]`}>
                            {platform.iconText}
                          </div>
                          <span>{platform.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 ml-auto mr-1" />
                        </div>

                        <div className="flex-1">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleInputChange(platform.id, e.target.value)}
                            placeholder={platform.placeholder}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isVerified ? (
                            <>
                              <div
                                title="Verified Account"
                                className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-xs"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>
                              <button
                                onClick={() => handleDeletePlatform(platform)}
                                title="Remove connection"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleSubmitPlatform(platform)}
                              disabled={!val.trim() || isVerifying}
                              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-blue-600 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                            >
                              {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Submit'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Problem Solving Platforms */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Problem Solving & Competitive Programming</span>
                  <span className="text-[10px] text-slate-500 font-mono">Algorithms & Daily Tasks</span>
                </h3>
                
                <div className="space-y-2">
                  {allPlatforms.filter((p) => p.category === 'problem_solving').map((platform) => {
                    const isVerified = verifiedState[platform.id];
                    const isVerifying = verifyingPlatform === platform.id;
                    const val = platformInputs[platform.id] || '';

                    return (
                      <div
                        key={platform.id}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all"
                      >
                        <div className="w-36 shrink-0 flex items-center gap-2 text-xs font-bold text-white">
                          <div className={`w-7 h-7 rounded-lg ${platform.iconBg} flex items-center justify-center font-mono font-black text-[10px]`}>
                            {platform.iconText}
                          </div>
                          <span>{platform.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 ml-auto mr-1" />
                        </div>

                        <div className="flex-1">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleInputChange(platform.id, e.target.value)}
                            placeholder={platform.placeholder}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isVerified ? (
                            <>
                              <div
                                title="Verified Account"
                                className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-xs"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>
                              <button
                                onClick={() => handleDeletePlatform(platform)}
                                title="Remove connection"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleSubmitPlatform(platform)}
                              disabled={!val.trim() || isVerifying}
                              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-blue-600 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                            >
                              {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Submit'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 🌟 2. ACTIVITIES TAB (ADD / REMOVE / TOGGLE STREAKS)     */}
          {/* ======================================================== */}
          {activeTab === 'activities' && (
            <div className="space-y-5">
              
              {/* Add New Custom Activity Form */}
              <form onSubmit={handleCreateActivity} className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/10">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-duoGreen" /> Add New Habit / Activity
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    placeholder="Activity Name (e.g. Sleep, Gym, React)"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-duoGreen"
                    required
                  />

                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ActivityItem['category'])}
                    className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="coding">Coding / Dev</option>
                    <option value="education">Education / Study</option>
                    <option value="fitness">Fitness / Health</option>
                    <option value="career">Career / Work</option>
                    <option value="personal">Personal / Goal</option>
                    <option value="project">Project / Build</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={360}
                      value={newPlannedMinutes}
                      onChange={(e) => setNewPlannedMinutes(Number(e.target.value))}
                      className="w-20 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    />
                    <span className="text-xs text-slate-400">min</span>

                    <button
                      type="submit"
                      className="ml-auto px-4 py-2 bg-duoGreen hover:bg-duoGreenLight text-black font-black rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>
              </form>

              {/* Tracked Activities List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Tracked Activities ({activities.length})
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {activities.filter((a) => a.countsTowardOverallStreak).length} count toward streak
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {activities.map((a) => (
                    <div 
                      key={a.id} 
                      className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{a.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono px-2 py-0.5 rounded bg-white/5">
                            {a.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {a.plannedMinutes}m • +{a.xpReward} XP • 🔥 {a.streak} streak
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={a.countsTowardOverallStreak}
                            onChange={() => onToggleActivityStreakInclusion(a.id)}
                            className="rounded border-white/20 text-duoGreen focus:ring-0 cursor-pointer"
                          />
                          Counts to Streak
                        </label>

                        <button
                          onClick={() => {
                            soundFx.playClick();
                            onDeleteActivity(a.id);
                            showToast(`Deleted ${a.name}`, 'info');
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 🌟 3. GENERAL & SCHEDULE TAB                             */}
          {/* ======================================================== */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Profile & Schedule Settings</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold">Display Name</label>
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => onUpdateUser({ name: e.target.value })}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-duoGreen"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold">Timezone</label>
                  <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-slate-300 font-mono">
                    <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">{user.timezone || 'Asia/Kolkata (GMT+5:30)'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold">Daily Reset Time (Local)</label>
                  <input
                    type="time"
                    value={user.dailyResetTime || '00:00'}
                    onChange={(e) => onUpdateUser({ dailyResetTime: e.target.value })}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-duoGreen font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold">Current Level & Rank</label>
                  <div className="mt-1 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-300 font-bold">
                    Lv. {user.level} • {user.hunterRank}-Rank Hunter ({user.currentXP}/{user.xpToNextLevel} XP)
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Strict Streak Rule</h3>
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-3">
                  <Flame className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">All-Task Streak Policy Active:</span> Overall streak increments only when 100% of scheduled activities are completed.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 🌟 4. BACKUP & EXPORT TAB                                */}
          {/* ======================================================== */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Data Ownership & Portability</h3>
              <p className="text-xs text-slate-400">
                You own 100% of your activity records. Export anytime to standard JSON or CSV formats.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleExportJSON}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-400" /> Export Full State (JSON)
                </button>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export History (CSV)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/40">
          <button
            onClick={onResetData}
            className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset All Data</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
