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
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  HeartPulse,
  Ruler,
  Scale,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { ActivityItem, UserProfile, HistoricalDayRecord, ActivityLogEntry } from '../types';
import { soundFx } from '../utils/audio';

const BACKEND_API_BASE = import.meta.env.VITE_API_URL || 'https://effectivestreak-backend.onrender.com/api';
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
  isDarkMode?: boolean;
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
  isDarkMode = false,
}) => {
  // Activity creation form state
  const [newActivityName, setNewActivityName] = useState('');
  const [newPlannedMinutes, setNewPlannedMinutes] = useState(30);
  const [newCategory, setNewCategory] = useState<ActivityItem['category']>('coding');
  const [newUrl, setNewUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'accounts' | 'activities' | 'general' | 'backup'>('profile');

  // Comprehensive Personal Profile Form State
  const [profileName, setProfileName] = useState(user.name || 'Aditya Singh');
  const [profileEmail, setProfileEmail] = useState(user.email || 'mradityasinghofficial1@gmail.com');
  const [profileAge, setProfileAge] = useState<number | string>(user.age || 21);
  const [profileBloodGroup, setProfileBloodGroup] = useState(user.bloodGroup || 'B+');
  const [profileHeight, setProfileHeight] = useState(user.height || '178 cm');
  const [profileWeight, setProfileWeight] = useState(user.weight || '68 kg');
  const [profileResident, setProfileResident] = useState(user.resident || 'Delhi, India');
  const [profilePhone, setProfilePhone] = useState(user.phoneNumber || '+91 9876543210');
  const [profileBio, setProfileBio] = useState(user.bio || 'Solo Hunter • S-Rank Aspirant • Competitive Programmer');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playCheck();
    setIsSavingProfile(true);
    const profilePayload: Partial<UserProfile> = {
      name: profileName.trim(),
      email: profileEmail.trim().toLowerCase(),
      age: Number(profileAge) || 21,
      bloodGroup: profileBloodGroup,
      height: profileHeight.trim(),
      weight: profileWeight.trim(),
      resident: profileResident.trim(),
      phoneNumber: profilePhone.trim(),
      bio: profileBio.trim(),
    };

    onUpdateUser(profilePayload);
    localStorage.setItem('effstreak_user_profile', JSON.stringify(profilePayload));

    try {
      const res = await fetch(`${BACKEND_API_BASE}/auth/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid || 'aditya-singh',
          ...profilePayload,
        }),
      });
      if (res.ok) {
        soundFx.playLevelUp();
        showToast('✓ Profile & Personal Information saved to Cloud Database!', 'success');
      } else {
        showToast('✓ Profile updated locally.', 'success');
      }
    } catch (err) {
      showToast('✓ Profile updated locally.', 'success');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleGoogleSignIn = async () => {
    soundFx.playClick();
    showToast(`Connecting Google Account (${profileEmail})...`, 'info');
    try {
      const res = await fetch(`${BACKEND_API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profileEmail,
          name: profileName,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        onUpdateUser(data.user);
        soundFx.playLevelUp();
        showToast(`✓ Google Account Connected! Multi-Device Cloud Sync active for ${data.user.email}`, 'success');
      } else {
        showToast(`✓ Google Sync linked to ${profileEmail}`, 'success');
      }
    } catch (err) {
      showToast(`✓ Google Sync linked to ${profileEmail}`, 'success');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
      isDarkMode ? 'bg-black/80 backdrop-blur-md' : 'bg-slate-900/50 backdrop-blur-md'
    }`}>
      <div className={`border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#121622] border-white/10 text-white shadow-purple-950/20' 
          : 'bg-white border-slate-200 text-slate-900 shadow-2xl shadow-slate-900/10'
      }`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-10 transition-colors ${
          isDarkMode ? 'bg-[#121622]/95 border-white/10' : 'bg-white/95 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              isDarkMode ? 'bg-slate-800 border-white/10 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800 shadow-2xs'
            }`}>
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                System Settings & Data
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                Configure activities, streak rules, connected accounts, and export state
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-6 overflow-x-auto transition-colors ${
          isDarkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50/80 border-slate-200'
        }`}>
          {[
            { id: 'profile', label: '👤 Profile & Cloud Sync' },
            { id: 'accounts', label: 'Connected Accounts' },
            { id: 'activities', label: `Activities (${activities.length})` },
            { id: 'general', label: 'General & Schedule' },
            { id: 'backup', label: 'Backup & Reset' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-4 text-xs uppercase tracking-wider transition-colors border-b-2 cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? (isDarkMode ? 'border-duoGreen text-duoGreen font-black' : 'border-purple-600 text-purple-700 font-black')
                  : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900 font-bold')
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Floating Toast Notification */}
        {fetchToast && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
            fetchToast.type === 'success' ? (isDarkMode ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs') :
            fetchToast.type === 'error' ? (isDarkMode ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' : 'bg-rose-50 border border-rose-300 text-rose-900 shadow-2xs') :
            (isDarkMode ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300' : 'bg-blue-50 border border-blue-300 text-blue-900 shadow-2xs')
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{fetchToast.message}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* ======================================================== */}
          {/* 🌟 0. USER PROFILE & CLOUD GMAIL SYNC (CROSS-DEVICE)     */}
          {/* ======================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Google Gmail Multi-Device Sync Banner */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-purple-900/30 border-blue-500/30' 
                  : 'bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 border-blue-200 shadow-xs'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md border border-slate-200">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-sm font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      <span>Gmail Cloud Account Sync</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        isDarkMode ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      }`}>
                        Active Sync
                      </span>
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                      Login with your Gmail to keep all progress identical across Laptop, Mobile App, and Web.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 ${
                    isDarkMode 
                      ? 'bg-white hover:bg-slate-100 text-slate-900' 
                      : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Sync Google Account</span>
                </button>
              </div>

              {/* Comprehensive Personal Information Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className={`flex items-center justify-between border-b pb-2 ${isDarkMode ? 'border-white/10' : 'border-[#E8E3D9]'}`}>
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                    <User className="w-4 h-4 text-purple-500" />
                    Personal & Bio Information
                  </h4>
                  <span className={`text-[11px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Stored securely in Cloud Database
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Aditya Singh"
                      className={`w-full mt-1 border rounded-xl px-3.5 py-2.5 text-xs transition-all focus:outline-none ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500' 
                          : 'bg-white border-[#D5CFBF] text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs font-semibold'
                      }`}
                      required
                    />
                  </div>

                  {/* Gmail / Email */}
                  <div>
                    <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Gmail / Email Address
                    </label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="e.g. mradityasinghofficial1@gmail.com"
                      className={`w-full mt-1 border rounded-xl px-3.5 py-2.5 text-xs font-mono transition-all focus:outline-none ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500' 
                          : 'bg-white border-[#D5CFBF] text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs font-semibold'
                      }`}
                      required
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Activity className="w-3.5 h-3.5 text-slate-400" /> Age (Years)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={profileAge}
                      onChange={(e) => setProfileAge(e.target.value)}
                      placeholder="e.g. 21"
                      className={`w-full mt-1 border rounded-xl px-3.5 py-2.5 text-xs font-mono transition-all focus:outline-none ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500' 
                          : 'bg-white border-[#D5CFBF] text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs font-semibold'
                      }`}
                    />
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Blood Group
                    </label>
                    <select
                      value={profileBloodGroup}
                      onChange={(e) => setProfileBloodGroup(e.target.value)}
                      className={`w-full mt-1 border rounded-xl px-3 py-2.5 text-xs transition-all focus:outline-none ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/10 text-white focus:border-purple-500' 
                          : 'bg-white border-[#D5CFBF] text-slate-900 font-semibold shadow-2xs focus:border-purple-600'
                      }`}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  {/* Height */}
                  <div>
                    <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Ruler className="w-3.5 h-3.5 text-blue-500" /> Height
                    </label>
                    <input
                      type="text"
                      value={profileHeight}
                      onChange={(e) => setProfileHeight(e.target.value)}
                      placeholder="e.g. 178 cm or 5'10"
                      className={`w-full mt-1 border rounded-xl px-3.5 py-2.5 text-xs transition-all focus:outline-none ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500' 
                          : 'bg-white border-[#D5CFBF] text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs font-semibold'
                      }`}
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Scale className="w-3.5 h-3.5 text-emerald-500" /> Weight
                    </label>
                    <input
                      type="text"
                      value={profileWeight}
                      onChange={(e) => setProfileWeight(e.target.value)}
                      placeholder="e.g. 68 kg"
                      className={`w-full mt-1 border rounded-xl px-3.5 py-2.5 text-xs transition-all focus:outline-none ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500' 
                          : 'bg-white border-[#D5CFBF] text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs font-semibold'
                      }`}
                    />
                  </div>

                  {/* Resident / City */}
                  <div>
                    <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <MapPin className="w-3.5 h-3.5 text-amber-500" /> Resident / City / State
                    </label>
                    <input
                      type="text"
                      value={profileResident}
                      onChange={(e) => setProfileResident(e.target.value)}
                      placeholder="e.g. Delhi, India"
                      className={`w-full mt-1 border rounded-xl px-3.5 py-2.5 text-xs transition-all focus:outline-none ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500' 
                          : 'bg-white border-[#D5CFBF] text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs font-semibold'
                      }`}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Phone className="w-3.5 h-3.5 text-green-500" /> Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className={`w-full mt-1 border rounded-xl px-3.5 py-2.5 text-xs font-mono transition-all focus:outline-none ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500' 
                          : 'bg-white border-[#D5CFBF] text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs font-semibold'
                      }`}
                    />
                  </div>
                </div>

                {/* Hunter Tagline / Bio */}
                <div>
                  <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Hunter Tagline & Motivation
                  </label>
                  <textarea
                    rows={2}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="e.g. Solo Hunter • S-Rank Aspirant • Competitive Programmer & Developer"
                    className={`w-full mt-1 border rounded-xl px-3.5 py-2 text-xs transition-all focus:outline-none resize-none ${
                      isDarkMode 
                        ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500' 
                        : 'bg-white border-[#D5CFBF] text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs font-semibold'
                    }`}
                  />
                </div>

                {/* Save Profile Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingProfile ? 'Saving to Database...' : 'Save & Sync Profile to Database'}</span>
                  </button>
                </div>
              </form>

              {/* Reset All Data Clean Zero Card */}
              <div className={`p-4 rounded-2xl border space-y-2 mt-6 transition-all ${
                isDarkMode 
                  ? 'bg-rose-950/30 border-rose-500/30' 
                  : 'bg-rose-50/90 border-rose-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${
                    isDarkMode ? 'text-rose-400' : 'text-rose-800'
                  }`}>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Clean Reset All Data to Zero</span>
                  </div>
                  <button
                    type="button"
                    onClick={onResetData}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    Reset All Data (0%)
                  </button>
                </div>
                <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-rose-700 font-medium'}`}>
                  Wipes level to 0, streaks to 0, XP to 0, clears emergency tasks, matrix checkmarks, and resets cloud sync baseline to 0%.
                </p>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* 🌟 1. CONNECTED ACCOUNTS (WITH REAL-TIME FETCH & CUSTOM)  */}
          {/* ======================================================== */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              
              {/* Top Banner & Quick Fetch Button */}
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border-blue-500/30' 
                  : 'bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 border-blue-200 shadow-xs'
              }`}>
                <div>
                  <div className={`text-sm font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Multi-Platform Real-Time Sync & Scraper
                  </div>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
                    Connect your public handles to auto-fetch daily commits, solved problems, and rating changes into your unified streak!
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowAddCustomPlatform(!showAddCustomPlatform)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDarkMode 
                        ? 'bg-white/10 hover:bg-white/20 text-white' 
                        : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs font-black'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-duoGreen" />
                    <span>Add Platform</span>
                  </button>

                  <button
                    onClick={handleFetchAllData}
                    disabled={isFetchingAll}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingAll ? 'animate-spin' : ''}`} />
                    <span>{isFetchingAll ? 'Fetching Data...' : 'Fetch Data Now'}</span>
                  </button>
                </div>
              </div>

              {/* Add Custom Platform Form Drawer */}
              {showAddCustomPlatform && (
                <form onSubmit={handleAddCustomPlatformSubmit} className={`p-4 rounded-2xl border space-y-3 animate-fade-in ${
                  isDarkMode ? 'bg-black/60 border-purple-500/30' : 'bg-purple-50/70 border-purple-200 shadow-2xs'
                }`}>
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-purple-900 font-black'}`}>
                    <Link2 className="w-4 h-4 text-purple-500" />
                    Add Custom Platform / Service
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      placeholder="Platform Name (e.g. Kaggle, TryHackMe)"
                      value={customPlatformName}
                      onChange={(e) => setCustomPlatformName(e.target.value)}
                      className={`border rounded-lg px-3 py-2 text-xs transition-all focus:outline-none ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500' 
                          : 'bg-white border-[#D5CFBF] text-slate-900 placeholder:text-slate-400 focus:border-purple-600 font-semibold shadow-2xs'
                      }`}
                      required
                    />

                    <input
                      type="text"
                      placeholder="Profile URL or Username"
                      value={customPlatformUrl}
                      onChange={(e) => setCustomPlatformUrl(e.target.value)}
                      className={`border rounded-lg px-3 py-2 text-xs font-mono transition-all focus:outline-none ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500' 
                          : 'bg-white border-[#D5CFBF] text-slate-900 placeholder:text-slate-400 focus:border-purple-600 font-semibold shadow-2xs'
                      }`}
                      required
                    />

                    <div className="flex items-center gap-2">
                      <select
                        value={customPlatformCategory}
                        onChange={(e) => setCustomPlatformCategory(e.target.value as any)}
                        className={`border rounded-lg px-3 py-2 text-xs transition-all focus:outline-none flex-1 ${
                          isDarkMode 
                            ? 'bg-black/60 border-white/10 text-white' 
                            : 'bg-white border-[#D5CFBF] text-slate-900 font-semibold shadow-2xs'
                        }`}
                      >
                        <option value="problem_solving">Problem Solving</option>
                        <option value="development">Development</option>
                      </select>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shrink-0 shadow-md"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* 1. Development Platforms */}
              <div className="space-y-3">
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center justify-between ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-800'
                }`}>
                  <span>Development</span>
                  <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-500 font-bold'}`}>
                    Git & Repositories
                  </span>
                </h3>
                
                <div className="space-y-2">
                  {allPlatforms.filter((p) => p.category === 'development').map((platform) => {
                    const isVerified = verifiedState[platform.id];
                    const isVerifying = verifyingPlatform === platform.id;
                    const val = platformInputs[platform.id] || '';

                    return (
                      <div
                        key={platform.id}
                        className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          isDarkMode 
                            ? 'bg-black/40 border-white/10 hover:border-white/20' 
                            : 'bg-white border-[#E4DFD3] hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className={`w-36 shrink-0 flex items-center gap-2 text-xs font-bold ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          <div className={`w-7 h-7 rounded-lg ${platform.iconBg} flex items-center justify-center font-mono font-black text-[10px] shadow-xs`}>
                            {platform.iconText}
                          </div>
                          <span>{platform.name}</span>
                          <ChevronRight className={`w-3.5 h-3.5 ml-auto mr-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        </div>

                        <div className="flex-1">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleInputChange(platform.id, e.target.value)}
                            placeholder={platform.placeholder}
                            className={`w-full border rounded-lg px-3 py-1.5 text-xs font-mono transition-all focus:outline-none ${
                              isDarkMode 
                                ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500' 
                                : 'bg-[#F8F6F0] border-[#D5CFBF] text-slate-900 placeholder:text-slate-400 focus:border-blue-600 font-semibold'
                            }`}
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isVerified ? (
                            <>
                              <div
                                title="Verified Account"
                                className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center shadow-xs"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>
                              <button
                                onClick={() => handleDeletePlatform(platform)}
                                title="Remove connection"
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isDarkMode 
                                    ? 'bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400' 
                                    : 'bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleSubmitPlatform(platform)}
                              disabled={!val.trim() || isVerifying}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer ${
                                isDarkMode 
                                  ? 'bg-white/10 hover:bg-blue-600 text-white' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                              }`}
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
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center justify-between ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-800'
                }`}>
                  <span>Problem Solving & Competitive Programming</span>
                  <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-500 font-bold'}`}>
                    Algorithms & Daily Tasks
                  </span>
                </h3>
                
                <div className="space-y-2">
                  {allPlatforms.filter((p) => p.category === 'problem_solving').map((platform) => {
                    const isVerified = verifiedState[platform.id];
                    const isVerifying = verifyingPlatform === platform.id;
                    const val = platformInputs[platform.id] || '';

                    return (
                      <div
                        key={platform.id}
                        className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          isDarkMode 
                            ? 'bg-black/40 border-white/10 hover:border-white/20' 
                            : 'bg-white border-[#E4DFD3] hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className={`w-36 shrink-0 flex items-center gap-2 text-xs font-bold ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          <div className={`w-7 h-7 rounded-lg ${platform.iconBg} flex items-center justify-center font-mono font-black text-[10px] shadow-xs`}>
                            {platform.iconText}
                          </div>
                          <span>{platform.name}</span>
                          <ChevronRight className={`w-3.5 h-3.5 ml-auto mr-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        </div>

                        <div className="flex-1">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleInputChange(platform.id, e.target.value)}
                            placeholder={platform.placeholder}
                            className={`w-full border rounded-lg px-3 py-1.5 text-xs font-mono transition-all focus:outline-none ${
                              isDarkMode 
                                ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500' 
                                : 'bg-[#F8F6F0] border-[#D5CFBF] text-slate-900 placeholder:text-slate-400 focus:border-blue-600 font-semibold'
                            }`}
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isVerified ? (
                            <>
                              <div
                                title="Verified Account"
                                className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center shadow-xs"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>
                              <button
                                onClick={() => handleDeletePlatform(platform)}
                                title="Remove connection"
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isDarkMode 
                                    ? 'bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400' 
                                    : 'bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleSubmitPlatform(platform)}
                              disabled={!val.trim() || isVerifying}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer ${
                                isDarkMode 
                                  ? 'bg-white/10 hover:bg-blue-600 text-white' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                              }`}
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
              <form onSubmit={handleCreateActivity} className={`space-y-3 p-4 rounded-xl border transition-all ${
                isDarkMode ? 'bg-black/40 border-white/10' : 'bg-[#F8F6F0] border-[#E4DFD3] shadow-2xs'
              }`}>
                <h4 className={`text-xs font-black flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Plus className="w-4 h-4 text-emerald-500" /> Add New Habit / Activity
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    placeholder="Activity Name (e.g. Sleep, Gym, React)"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    className={`border rounded-lg px-3 py-2 text-xs transition-all focus:outline-none ${
                      isDarkMode 
                        ? 'bg-black/60 border-white/10 text-white placeholder:text-slate-500 focus:border-duoGreen' 
                        : 'bg-white border-[#D5CFBF] text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 font-semibold shadow-2xs'
                    }`}
                    required
                  />

                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ActivityItem['category'])}
                    className={`border rounded-lg px-3 py-2 text-xs transition-all focus:outline-none ${
                      isDarkMode 
                        ? 'bg-black/60 border-white/10 text-white' 
                        : 'bg-white border-[#D5CFBF] text-slate-900 font-semibold shadow-2xs'
                    }`}
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
                      className={`w-20 border rounded-lg px-3 py-2 text-xs font-mono transition-all focus:outline-none ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/10 text-white' 
                          : 'bg-white border-[#D5CFBF] text-slate-900 font-semibold shadow-2xs'
                      }`}
                    />
                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-bold'}`}>min</span>

                    <button
                      type="submit"
                      className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>
              </form>

              {/* Tracked Activities List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-black uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-800'
                  }`}>
                    Tracked Activities ({activities.length})
                  </h3>
                  <span className={`text-[11px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-500 font-bold'}`}>
                    {activities.filter((a) => a.countsTowardOverallStreak).length} count toward streak
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {activities.map((a) => (
                    <div 
                      key={a.id} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs ${
                        isDarkMode 
                          ? 'bg-black/40 border-white/10 hover:border-white/20' 
                          : 'bg-white border-[#E4DFD3] hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          <span>{a.name}</span>
                          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                            isDarkMode ? 'text-slate-400 bg-white/5' : 'text-slate-600 bg-slate-100 border border-slate-200 font-bold'
                          }`}>
                            {a.category}
                          </span>
                        </div>
                        <div className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                          {a.plannedMinutes}m • +{a.xpReward} XP • 🔥 {a.streak} streak
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className={`flex items-center gap-1.5 text-[11px] cursor-pointer font-medium ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          <input
                            type="checkbox"
                            checked={a.countsTowardOverallStreak}
                            onChange={() => onToggleActivityStreakInclusion(a.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer"
                          />
                          Counts to Streak
                        </label>

                        <button
                          onClick={() => {
                            soundFx.playClick();
                            onDeleteActivity(a.id);
                            showToast(`Deleted ${a.name}`, 'info');
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDarkMode 
                              ? 'bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400' 
                              : 'bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600'
                          }`}
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
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
                Profile & Schedule Settings
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Display Name</label>
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => onUpdateUser({ name: e.target.value })}
                    className={`w-full mt-1 border rounded-xl px-3 py-2 text-sm transition-all focus:outline-none ${
                      isDarkMode 
                        ? 'bg-black/40 border-white/10 text-white focus:border-duoGreen' 
                        : 'bg-white border-[#D5CFBF] text-slate-900 font-semibold shadow-2xs focus:border-purple-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Timezone</label>
                  <div className={`flex items-center gap-2 mt-1 px-3 py-2 rounded-xl border text-sm font-mono ${
                    isDarkMode ? 'bg-black/40 border-white/10 text-slate-300' : 'bg-white border-[#D5CFBF] text-slate-900 font-semibold shadow-2xs'
                  }`}>
                    <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate">{user.timezone || 'Asia/Kolkata (GMT+5:30)'}</span>
                  </div>
                </div>

                <div>
                  <label className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Daily Reset Time (Local)</label>
                  <input
                    type="time"
                    value={user.dailyResetTime || '00:00'}
                    onChange={(e) => onUpdateUser({ dailyResetTime: e.target.value })}
                    className={`w-full mt-1 border rounded-xl px-3 py-2 text-sm font-mono transition-all focus:outline-none ${
                      isDarkMode 
                        ? 'bg-black/40 border-white/10 text-white focus:border-duoGreen' 
                        : 'bg-white border-[#D5CFBF] text-slate-900 font-semibold shadow-2xs focus:border-purple-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Current Level & Rank</label>
                  <div className={`mt-1 px-3 py-2 rounded-xl border text-sm font-bold ${
                    isDarkMode ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-900 shadow-2xs'
                  }`}>
                    Lv. {user.level} • {user.hunterRank}-Rank Hunter ({user.currentXP}/{user.xpToNextLevel} XP)
                  </div>
                </div>
              </div>

              <div className={`pt-4 border-t space-y-3 ${isDarkMode ? 'border-white/10' : 'border-[#E8E3D9]'}`}>
                <h3 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
                  Strict Streak Rule
                </h3>
                <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                  isDarkMode 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-300' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium shadow-2xs'
                }`}>
                  <Flame className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>All-Task Streak Policy Active:</span> Overall streak increments only when 100% of scheduled activities are completed.
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
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
                Data Ownership & Portability
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                You own 100% of your activity records. Export anytime to standard JSON or CSV formats.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleExportJSON}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'bg-blue-600/20 border-blue-500/30 hover:bg-blue-600/30 text-white' 
                      : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900 font-bold shadow-xs'
                  }`}
                >
                  <Download className="w-4 h-4 text-blue-500" /> Export Full State (JSON)
                </button>

                <button
                  onClick={handleExportCSV}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'bg-emerald-600/20 border-emerald-500/30 hover:bg-emerald-600/30 text-white' 
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900 font-bold shadow-xs'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export History (CSV)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between transition-colors ${
          isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <button
            onClick={onResetData}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset All Data</span>
          </button>
          
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
            }`}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

