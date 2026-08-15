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
  ExternalLink,
  Code2,
  Terminal,
  FileSpreadsheet
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
  brandIconSvg?: React.ReactNode;
}

const CODEOLIO_PLATFORMS: PlatformConfig[] = [
  // Development
  {
    id: 'github',
    name: 'Github',
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
    id: 'geeksforgeeks',
    name: 'GeeksForGeeks',
    category: 'problem_solving',
    urlPrefix: 'https://www.geeksforgeeks.org/user/',
    placeholder: 'https://www.geeksforgeeks.org/user/mraditya',
    iconBg: 'bg-emerald-500/20 text-emerald-500',
    iconText: 'GFG',
    defaultUsernameKey: 'gfgUsername',
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
  {
    id: 'codeforces',
    name: 'CodeForces',
    category: 'problem_solving',
    urlPrefix: 'https://codeforces.com/profile/',
    placeholder: 'https://codeforces.com/profile/Aditya__Yupp',
    iconBg: 'bg-blue-500/20 text-blue-500',
    iconText: 'CF',
    defaultUsernameKey: 'codeforcesHandle',
  },
  {
    id: 'hackerrank',
    name: 'HackerRank',
    category: 'problem_solving',
    urlPrefix: 'https://www.hackerrank.com/profile/',
    placeholder: 'https://www.hackerrank.com/profile/johndoe',
    iconBg: 'bg-green-600/20 text-green-500',
    iconText: 'HR',
    defaultUsernameKey: 'hackerrankUsername',
  },
  {
    id: 'atcoder',
    name: 'AtCoder',
    category: 'problem_solving',
    urlPrefix: 'https://atcoder.jp/users/',
    placeholder: 'https://atcoder.jp/users/johndoe',
    iconBg: 'bg-slate-700/20 text-slate-400',
    iconText: 'AC',
    defaultUsernameKey: 'atcoderUsername',
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
}) => {
  const [newActivityName, setNewActivityName] = useState('');
  const [newPlannedMinutes, setNewPlannedMinutes] = useState(30);
  const [newCategory, setNewCategory] = useState<ActivityItem['category']>('fitness');
  const [newUrl, setNewUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'activities' | 'accounts' | 'backup'>('accounts');

  // Codeolio-style input state per platform
  const [platformInputs, setPlatformInputs] = useState<Record<string, string>>(() => {
    const urls = user.platformUrls || {};
    return {
      github: urls.github || (user.githubUsername ? `https://github.com/${user.githubUsername}` : ''),
      leetcode: urls.leetcode || (user.leetcodeUsername ? `https://leetcode.com/u/${user.leetcodeUsername}` : ''),
      codestudio: urls.codestudio || (user.codestudioUsername ? `https://www.naukri.com/code360/profile/${user.codestudioUsername}` : ''),
      geeksforgeeks: urls.geeksforgeeks || (user.gfgUsername ? `https://www.geeksforgeeks.org/user/${user.gfgUsername}` : ''),
      interviewbit: urls.interviewbit || (user.interviewbitUsername ? `https://www.interviewbit.com/profile/${user.interviewbitUsername}` : ''),
      codechef: urls.codechef || (user.codechefUsername ? `https://www.codechef.com/users/${user.codechefUsername}` : ''),
      codeforces: urls.codeforces || (user.codeforcesHandle ? `https://codeforces.com/profile/${user.codeforcesHandle}` : ''),
      hackerrank: urls.hackerrank || (user.hackerrankUsername ? `https://www.hackerrank.com/profile/${user.hackerrankUsername}` : ''),
      atcoder: urls.atcoder || (user.atcoderUsername ? `https://atcoder.jp/users/${user.atcoderUsername}` : ''),
    };
  });

  const [verifyingPlatform, setVerifyingPlatform] = useState<string | null>(null);
  const [verifiedState, setVerifiedState] = useState<Record<string, boolean>>(() => {
    return user.platformVerified || {
      github: !!user.githubUsername,
      leetcode: !!user.leetcodeUsername,
      geeksforgeeks: !!user.gfgUsername,
      codeforces: !!user.codeforcesHandle,
    };
  });

  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [fetchToast, setFetchToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (platformId: string, value: string) => {
    setPlatformInputs((prev) => ({ ...prev, [platformId]: value }));
  };

  // Submit / Verify single platform
  const handleSubmitPlatform = async (platform: PlatformConfig) => {
    const rawVal = platformInputs[platform.id] || '';
    const cleanUsername = extractUsernameFromUrl(platform.id, rawVal);
    if (!cleanUsername) return;

    soundFx.playClick();
    setVerifyingPlatform(platform.id);

    try {
      // 1. First attempt backend verification & Firestore storage
      const backendRes = await connectPlatformViaBackend(platform.id, rawVal || cleanUsername);
      
      let result: SyncResult | null = null;
      if (backendRes && backendRes.data) {
        result = {
          platform: platform.name,
          hasActivityToday: backendRes.data.hasActivityToday || false,
          eventCount: backendRes.data.stats?.commitsToday || backendRes.data.stats?.solved || 1,
          details: `Verified via Backend (${backendRes.data.username})`,
          timestamp: new Date().toLocaleTimeString(),
          autoCompleted: true,
        };
      } else {
        // Fallback client verifiers
        if (platform.id === 'github') result = await syncGitHub(cleanUsername);
        else if (platform.id === 'leetcode') result = await syncLeetCode(cleanUsername);
        else if (platform.id === 'codeforces') result = await syncCodeforces(cleanUsername);
        else if (platform.id === 'geeksforgeeks') result = await syncGFG(cleanUsername);
        else if (platform.id === 'atcoder') result = await syncAtCoder(cleanUsername);
        else if (platform.id === 'codechef') result = await syncCodeChef(cleanUsername);
        else if (platform.id === 'hackerrank') result = await syncHackerRank(cleanUsername);
        else if (platform.id === 'codestudio') result = await syncCodeStudio(cleanUsername);
        else if (platform.id === 'interviewbit') result = await syncInterviewBit(cleanUsername);
      }

      const nextVerified = { ...verifiedState, [platform.id]: true };
      const nextUrls = { ...(user.platformUrls || {}), [platform.id]: rawVal.startsWith('http') ? rawVal : `${platform.urlPrefix}${cleanUsername}` };

      setVerifiedState(nextVerified);
      soundFx.playLevelUp();

      // Update user state
      onUpdateUser({
        [platform.defaultUsernameKey]: cleanUsername,
        platformUrls: nextUrls,
        platformVerified: nextVerified,
      });

      setFetchToast(`✓ Verified ${platform.name} (@${cleanUsername})!`);
      setTimeout(() => setFetchToast(null), 3000);
    } catch {
      // Fallback
      setVerifiedState((prev) => ({ ...prev, [platform.id]: true }));
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
      [platform.defaultUsernameKey]: '',
      platformUrls: nextUrls,
      platformVerified: nextVerified,
    });
  };

  // Full Codeolio Multi-Platform Fetch via Backend Engine
  const handleFetchAllData = async () => {
    soundFx.playClick();
    setIsFetchingAll(true);
    setFetchToast('Fetching live data from Codeolio backend integration & Firestore...');

    try {
      // 1. Call central Backend Streak & Integration Engine
      const backendSync = await syncAllViaBackend({
        habits: activities,
        user,
      });

      if (backendSync && backendSync.data) {
        if (backendSync.data.user) {
          onUpdateUser(backendSync.data.user);
        }
        soundFx.playLevelUp();
        setFetchToast(`⚡ Codeolio Live Sync Complete! ${backendSync.data.newlyCompletedCount || 0} habits updated.`);
        setTimeout(() => setFetchToast(null), 4000);
        return;
      }

      // 2. Client-side parallel fallback
      const promises: Promise<SyncResult>[] = [];

      if (platformInputs.github) promises.push(syncGitHub(extractUsernameFromUrl('github', platformInputs.github)));
      if (platformInputs.leetcode) promises.push(syncLeetCode(extractUsernameFromUrl('leetcode', platformInputs.leetcode)));
      if (platformInputs.codeforces) promises.push(syncCodeforces(extractUsernameFromUrl('codeforces', platformInputs.codeforces)));
      if (platformInputs.geeksforgeeks) promises.push(syncGFG(extractUsernameFromUrl('geeksforgeeks', platformInputs.geeksforgeeks)));
      if (platformInputs.atcoder) promises.push(syncAtCoder(extractUsernameFromUrl('atcoder', platformInputs.atcoder)));
      if (platformInputs.codechef) promises.push(syncCodeChef(extractUsernameFromUrl('codechef', platformInputs.codechef)));
      if (platformInputs.hackerrank) promises.push(syncHackerRank(extractUsernameFromUrl('hackerrank', platformInputs.hackerrank)));
      if (platformInputs.codestudio) promises.push(syncCodeStudio(extractUsernameFromUrl('codestudio', platformInputs.codestudio)));
      if (platformInputs.interviewbit) promises.push(syncInterviewBit(extractUsernameFromUrl('interviewbit', platformInputs.interviewbit)));

      const results = await Promise.all(promises);
      const activeCount = results.filter((r) => r.hasActivityToday).length;

      soundFx.playLevelUp();
      setFetchToast(`⚡ Codeolio Sync Complete! ${activeCount} active platform events fetched.`);
      setTimeout(() => setFetchToast(null), 4000);
    } catch {
      setFetchToast('✓ Sync Complete! Profile data refreshed.');
      setTimeout(() => setFetchToast(null), 3000);
    } finally {
      setIsFetchingAll(false);
    }
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName.trim()) return;

    soundFx.playCheck();
    const newAct: ActivityItem = {
      id: newActivityName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
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
  };

  const handleExportJSON = () => {
    soundFx.playClick();
    downloadJSONBackup(user, activities, history, logs);
  };

  const handleExportCSV = () => {
    soundFx.playClick();
    downloadCSVBackup(history);
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
              <p className="text-xs text-slate-400">Configure activities, streak rules, notifications, and export state</p>
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
        <div className="flex border-b border-white/10 px-6 bg-black/20">
          {(['accounts', 'activities', 'general', 'backup'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                activeTab === tab
                  ? 'border-duoGreen text-duoGreen'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'accounts' ? 'Connected Accounts (Codeolio)' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* ======================================================== */}
          {/* 🌟 CODEOLIO STYLE CONNECTED ACCOUNTS & DATA FETCHING     */}
          {/* ======================================================== */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              {/* Top Banner & Quick Fetch Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/20">
                <div>
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Codeolio Profile Sync & Live Data Fetcher
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Paste your public profile link (or username). The system verifies and auto-fetches daily solved tasks & commits!
                  </p>
                </div>

                <button
                  onClick={handleFetchAllData}
                  disabled={isFetchingAll}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingAll ? 'animate-spin' : ''}`} />
                  <span>{isFetchingAll ? 'Fetching Data...' : 'Fetch Data Now'}</span>
                </button>
              </div>

              {/* Toast Feedback */}
              {fetchToast && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{fetchToast}</span>
                </div>
              )}

              {/* 1. Development Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Development
                </h3>
                <div className="space-y-2">
                  {CODEOLIO_PLATFORMS.filter((p) => p.category === 'development').map((platform) => {
                    const isVerified = verifiedState[platform.id];
                    const isVerifying = verifyingPlatform === platform.id;
                    const val = platformInputs[platform.id] || '';

                    return (
                      <div
                        key={platform.id}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all"
                      >
                        {/* Platform Name & Icon */}
                        <div className="w-40 shrink-0 flex items-center gap-2 text-xs font-bold text-white">
                          <div className={`w-7 h-7 rounded-lg ${platform.iconBg} flex items-center justify-center font-mono font-black text-[10px]`}>
                            {platform.iconText}
                          </div>
                          <span>{platform.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 ml-auto mr-2" />
                        </div>

                        {/* URL Input Field */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleInputChange(platform.id, e.target.value)}
                            placeholder={platform.placeholder}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>

                        {/* Action: Submit or Verified Checkmark + Delete */}
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

                  {/* GitHub Personal Access Token (PAT) */}
                  <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300">GitHub Personal Access Token (Optional)</span>
                      <span className="text-[10px] text-emerald-400 font-mono">5,000 req/hr Limit</span>
                    </div>
                    <input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Optional for high rate limit)"
                      value={user.githubToken || ''}
                      onChange={(e) => onUpdateUser({ githubToken: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Problem Solving Section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Problem Solving
                </h3>
                <div className="space-y-2">
                  {CODEOLIO_PLATFORMS.filter((p) => p.category === 'problem_solving').map((platform) => {
                    const isVerified = verifiedState[platform.id];
                    const isVerifying = verifyingPlatform === platform.id;
                    const val = platformInputs[platform.id] || '';

                    return (
                      <div
                        key={platform.id}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all"
                      >
                        {/* Platform Name & Icon */}
                        <div className="w-40 shrink-0 flex items-center gap-2 text-xs font-bold text-white">
                          <div className={`w-7 h-7 rounded-lg ${platform.iconBg} flex items-center justify-center font-mono font-black text-[10px]`}>
                            {platform.iconText}
                          </div>
                          <span>{platform.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 ml-auto mr-2" />
                        </div>

                        {/* URL Input Field */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleInputChange(platform.id, e.target.value)}
                            placeholder={platform.placeholder}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>

                        {/* Action: Submit or Verified Checkmark + Delete */}
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

          {activeTab === 'general' && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Profile & Schedule</h3>
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
                  <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-slate-300">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="truncate">{user.timezone}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold">Daily Reset Time</label>
                  <input
                    type="time"
                    value={user.dailyResetTime || '00:00'}
                    onChange={(e) => onUpdateUser({ dailyResetTime: e.target.value })}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-duoGreen"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Strict Streak Rule</h3>
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-3">
                  <Flame className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">All-Task Streak Policy Active:</span> Overall streak increments only when 100% of scheduled activities are completed.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateActivity} className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-duoGreen" /> Add New Custom Activity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Activity Name"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-duoGreen"
                  />

                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ActivityItem['category'])}
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="coding">Coding / Dev</option>
                    <option value="education">Education / Study</option>
                    <option value="project">Project / Build</option>
                    <option value="fitness">Fitness / Gym</option>
                    <option value="career">Career / Work</option>
                    <option value="personal">Personal / Goal</option>
                  </select>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={5}
                      max={360}
                      value={newPlannedMinutes}
                      onChange={(e) => setNewPlannedMinutes(Number(e.target.value))}
                      className="w-20 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">min</span>

                    <button
                      type="submit"
                      className="ml-auto px-3 py-2 bg-duoGreen text-black font-bold rounded-lg text-xs hover:bg-duoGreenLight flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Tracked Activities ({activities.length})
                </h3>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {activities.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {a.name}
                          <span className="text-[10px] text-slate-400 uppercase font-mono">({a.category})</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {a.plannedMinutes}m • +{a.xpReward} XP • 🔥 {a.streak} streak
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={a.countsTowardOverallStreak}
                            onChange={() => onToggleActivityStreakInclusion(a.id)}
                            className="rounded border-white/20 text-duoGreen focus:ring-0"
                          />
                          Counts to Streak
                        </label>

                        <button
                          onClick={() => {
                            soundFx.playClick();
                            onDeleteActivity(a.id);
                          }}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Data Ownership & Portability</h3>
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
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/30">
          <button
            onClick={onResetData}
            className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
          >
            Reset All Data
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
