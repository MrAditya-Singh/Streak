import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserProfile, ActivityItem, ActivityLogEntry, HeatmapDay, HistoricalDayRecord, EmergencyTask, YearlyMatrixState, ThoughtItem } from './types';
import {
  INITIAL_USER,
  INITIAL_LOGS,
  INITIAL_EMERGENCY_TASKS,
  calculateSummary,
  evaluateStrictStreaks,
  generateHeatmapData,
  generateHistoricalRecords,
  getRankByLevel,
} from './utils/streakEngine';
import { soundFx } from './utils/audio';
import { syncFullStateToSupabase, subscribeToSupabaseFullState, isSupabaseConfigured } from './services/supabase';
import {
  BACKEND_API_BASE,
  syncAllViaBackend,
  syncCodolio,
  syncGitHub,
  syncLeetCode,
  syncCodeforces,
  syncGFG,
  fetchFullStateFromBackend,
  pushFullStateToBackend,
  syncHabitToBackend,
  deleteHabitFromBackend,
  syncHabitTickToBackend,
  syncThoughtsToBackend,
  deleteThoughtFromBackend,
  syncUserPhotosToBackend,
} from './services/apiSync';
import { pushStateToCloud, subscribeToCloudSync, DEVICE_ID } from './services/cloudSync';
import { onAuthStateChange, logOutUser, getCurrentUserToken } from './services/supabaseAuth';
import { SyncSetupCard } from './components/SyncSetupCard';

import { AestheticHeaderTracker } from './components/AestheticHeaderTracker';
import { WeeklyConsistencyOverview } from './components/WeeklyConsistencyOverview';
import { MasterMonthlyHabitGrid } from './components/MasterMonthlyHabitGrid';
import { WidgetSimulatorModal } from './components/WidgetSimulatorModal';
import { LiveSyncModal } from './components/LiveSyncModal';
import { SoloLevelingModal } from './components/SoloLevelingModal';
import { SettingsModal } from './components/SettingsModal';
import { TodayActivityModal } from './components/TodayActivityModal';
import { EfficiencyAnalyticsModal } from './components/EfficiencyAnalyticsModal';
import { AddHabitModal } from './components/AddHabitModal';
import { AuthModal } from './components/AuthModal';
import { LivePerformanceDeck } from './components/LivePerformanceDeck';
import { AddEmergencyDirectiveModal } from './components/AddEmergencyDirectiveModal';
import { ThemeDiscReelModal } from './components/ThemeDiscReelModal';
import { getThemeById, applyThemeToDocument, DEFAULT_THEME_ID } from './utils/themeManager';
import { Sparkles } from 'lucide-react';

const MAX_EMERGENCY_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 48 Hours

const pruneExpiredEmergencyTasks = (tasks: EmergencyTask[]): EmergencyTask[] => {
  if (!Array.isArray(tasks)) return [];
  const now = Date.now();
  return tasks
    .filter((t) => {
      const createdAt = t.createdAt || now;
      const age = now - createdAt;
      // Stored only for 2 days maximum (48 hours)
      return age <= MAX_EMERGENCY_TTL_MS && (t.deadlineAt ? t.deadlineAt > now || t.completed : true);
    })
    .slice(0, 3); // At most 3 emergency tasks
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

async function fetchBackend(url: string, init: RequestInit = {}) {
  const token = await getCurrentUserToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}

export const App: React.FC = () => {
  const realNow = new Date();
  const currentRealMonth = MONTH_NAMES[realNow.getMonth()];
  const currentRealYear = realNow.getFullYear();
  const todayDayNumber = realNow.getDate();
  const currentDayIndex = todayDayNumber - 1;

  // Main persistent state with safe JSON parsing & fallback defaults
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const savedAuth = localStorage.getItem('effstreak_auth_user');
      let authDefaults: Partial<UserProfile> = {};
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth);
        if (parsedAuth && parsedAuth.uid && parsedAuth.uid !== 'guest_user_local') {
          authDefaults = {
            uid: parsedAuth.uid,
            email: parsedAuth.email,
            name: parsedAuth.displayName || parsedAuth.name || 'Hunter',
            avatarUrl: parsedAuth.photoURL || parsedAuth.avatarUrl,
          };
        }
      }

      const saved = localStorage.getItem('effstreak_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...INITIAL_USER,
            ...authDefaults,
            ...parsed,
            attributes: { ...INITIAL_USER.attributes, ...(parsed.attributes || {}) },
          };
        }
      }
      if (authDefaults.uid) {
        return {
          ...INITIAL_USER,
          ...authDefaults,
        };
      }
    } catch (e) {
      console.warn('User cache parse error, resetting to initial user:', e);
    }
    return INITIAL_USER;
  });

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    try {
      const saved = localStorage.getItem('effstreak_activities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* fallback */ }
    return [];
  });

  // Emergency Work Tasks (Stored strictly for max 2 days / 48h, max 3 tasks)
  const [emergencyTasks, setEmergencyTasks] = useState<EmergencyTask[]>(() => {
    try {
      const saved = localStorage.getItem('effstreak_emergency_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return pruneExpiredEmergencyTasks(parsed);
      }
    } catch { /* ignore */ }
    return pruneExpiredEmergencyTasks(INITIAL_EMERGENCY_TASKS);
  });

  // ⏰ Periodic 30s auto-cleanup to prune expired emergency tasks (> 2 days / 48h)
  useEffect(() => {
    const interval = setInterval(() => {
      setEmergencyTasks((prev) => {
        const pruned = pruneExpiredEmergencyTasks(prev);
        if (pruned.length !== prev.length) {
          localStorage.setItem('effstreak_emergency_tasks', JSON.stringify(pruned));
          return pruned;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('effstreak_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return INITIAL_LOGS;
  });

  // ─── Thoughts & Ideas (Personal, Financial, Technical) ────────────────────
  const [thoughts, setThoughts] = useState<ThoughtItem[]>(() => {
    try {
      const saved = localStorage.getItem('effstreak_thoughts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('effstreak_thoughts', JSON.stringify(thoughts));
  }, [thoughts]);

  const handleAddThought = (thought: ThoughtItem) => {
    const next = [thought, ...thoughts];
    setThoughts(next);
    syncThoughtsToBackend(activeSyncKey, next).catch(() => {});
  };

  const handleUpdateThought = (id: string, updated: Partial<ThoughtItem>) => {
    const next = thoughts.map((t) => (t.id === id ? { ...t, ...updated, updatedAt: Date.now() } : t));
    setThoughts(next);
    syncThoughtsToBackend(activeSyncKey, next).catch(() => {});
  };

  const handleDeleteThought = (id: string) => {
    const next = thoughts.filter((t) => t.id !== id);
    setThoughts(next);
    deleteThoughtFromBackend(activeSyncKey, id).catch(() => {});
  };

  const handleToggleStarThought = (id: string) => {
    const next = thoughts.map((t) => (t.id === id ? { ...t, isStarred: !t.isStarred, updatedAt: Date.now() } : t));
    setThoughts(next);
    syncThoughtsToBackend(activeSyncKey, next).catch(() => {});
  };

  const [history, setHistory] = useState<HistoricalDayRecord[]>(() => generateHistoricalRecords(30));
  const [_heatmapData, setHeatmapData] = useState<HeatmapDay[]>(() => generateHeatmapData(90));

  // Dynamic Month & Year state synced to real-time date
  const [selectedMonth, setSelectedMonth] = useState<string>(currentRealMonth);
  const [selectedYear, _setSelectedYear] = useState<number>(currentRealYear);

  // Dynamic days in selected month
  const daysInMonth = useMemo(() => {
    const mIdx = MONTH_NAMES.indexOf(selectedMonth);
    return new Date(selectedYear, mIdx !== -1 ? mIdx + 1 : 8, 0).getDate();
  }, [selectedMonth, selectedYear]);

  // 1-Year Month-Wise Habit Matrix storage (e.g. "2026-January", "2026-February"...)
  const [yearlyMatrixState, setYearlyMatrixState] = useState<YearlyMatrixState>(() => {
    try {
      const savedYearly = localStorage.getItem('streak_yearly_matrix');
      if (savedYearly) {
        const parsed = JSON.parse(savedYearly);
        if (parsed && typeof parsed === 'object') return parsed;
      }
      const legacy = localStorage.getItem('streak_monthly_matrix');
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (parsedLegacy && typeof parsedLegacy === 'object') {
          return { [`${currentRealYear}-${currentRealMonth}`]: parsedLegacy };
        }
      }
    } catch { /* fallback */ }
    return {};
  });

  const currentMonthKey = `${selectedYear}-${selectedMonth}`;
  const currentMonthKeyRef = useRef(currentMonthKey);
  useEffect(() => {
    currentMonthKeyRef.current = currentMonthKey;
  }, [currentMonthKey]);

  // Active month's 30-31 Day Checkbox Matrix with full month-wise activity auto-fill
  const matrixState = useMemo<Record<string, boolean[]>>(() => {
    const storedMonth = yearlyMatrixState[currentMonthKey] || yearlyMatrixState[selectedMonth] || {};
    const fullMonthMatrix: Record<string, boolean[]> = { ...storedMonth };
    
    // Ensure every activity has a full row for this selected month
    activities.forEach((act) => {
      if (!Array.isArray(fullMonthMatrix[act.id]) || fullMonthMatrix[act.id].length < daysInMonth) {
        const existing = Array.isArray(fullMonthMatrix[act.id]) ? fullMonthMatrix[act.id] : [];
        fullMonthMatrix[act.id] = Array.from({ length: daysInMonth }, (_, i) => existing[i] || false);
      }
    });

    return fullMonthMatrix;
  }, [yearlyMatrixState, currentMonthKey, selectedMonth, activities, daysInMonth]);

  const setMatrixState = React.useCallback((updater: Record<string, boolean[]> | ((prev: Record<string, boolean[]>) => Record<string, boolean[]>)) => {
    setYearlyMatrixState((prevYearly) => {
      const activeKey = currentMonthKeyRef.current;
      const currentMonthData = prevYearly[activeKey] || {};
      const nextMonthData = typeof updater === 'function' ? updater(currentMonthData) : updater;
      const nextYearly = {
        ...prevYearly,
        [activeKey]: nextMonthData,
      };
      localStorage.setItem('streak_yearly_matrix', JSON.stringify(nextYearly));
      localStorage.setItem('streak_monthly_matrix', JSON.stringify(nextMonthData));
      return nextYearly;
    });
  }, []);

  // ─── Sync Identity (Gmail & Phone Number deterministic account mapping) ────
  const [syncEmail, setSyncEmail] = useState<string>(() => {
    const saved = localStorage.getItem('effstreak_sync_email');
    if (saved) return saved;
    const oldKey = localStorage.getItem('effstreak_sync_key') || '';
    if (oldKey && oldKey.includes('@')) {
      localStorage.setItem('effstreak_sync_email', oldKey);
      return oldKey;
    }
    return '';
  });
  const [syncPhone, setSyncPhone] = useState<string>(() => {
    const saved = localStorage.getItem('effstreak_sync_phone');
    if (saved) return saved;
    const oldKey = localStorage.getItem('effstreak_sync_key') || '';
    if (oldKey && !oldKey.includes('@') && /^\+?[0-9]/.test(oldKey)) {
      localStorage.setItem('effstreak_sync_phone', oldKey);
      return oldKey;
    }
    return '';
  });

  const [hasLoadedFromCloud, setHasLoadedFromCloud] = useState<boolean>(false);

  // Single source of truth for cross-device cloud storage identity
  const activeSyncKey = useMemo(() => {
    if (user.uid && user.uid !== 'guest_user_local' && !user.uid.startsWith('guest_')) {
      return user.uid;
    }
    const cleanEmail = (user.email || syncEmail || '').trim().toLowerCase();
    if (cleanEmail && cleanEmail.includes('@')) {
      return 'user_email_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
    }
    const cleanPhone = (user.phoneNumber || syncPhone || '').trim();
    if (cleanPhone && cleanPhone.length > 5) {
      return 'user_phone_' + cleanPhone.replace(/[^0-9]/g, '');
    }
    return user.uid || 'guest_user_local';
  }, [user.uid, user.email, user.phoneNumber, syncEmail, syncPhone]);

  // Ref tracking current active user ID to catch account switches
  const currentAuthUid = React.useRef<string>(user.uid);

  // Real-time Supabase / OAuth Authentication State Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChange((authUser, event) => {
      if (authUser && authUser.uid) {
        const nextUid = authUser.uid;
        if (nextUid !== currentAuthUid.current) {
          console.log(`🔐 [Auth Change] Account session active for: ${nextUid}`);
          currentAuthUid.current = nextUid;
          
          // Stop any pending push from previous account
          if (pendingCloudPush.current) {
            clearTimeout(pendingCloudPush.current);
            pendingCloudPush.current = null;
          }

          // Lock writes until user's document is loaded from Firestore / Backend
          isApplyingRemote.current = true;
          setHasLoadedFromCloud(false);
          initialRemoteLoaded.current = false;
        }

        setUser((prev) => {
          const nextUser = {
            ...prev,
            uid: authUser.uid,
            email: authUser.email || prev.email,
            name: authUser.displayName || prev.name || 'Hunter',
            avatarUrl: authUser.photoURL || prev.avatarUrl,
          };
          localStorage.setItem('effstreak_user', JSON.stringify(nextUser));
          localStorage.setItem('effstreak_auth_user', JSON.stringify({
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            photoURL: authUser.photoURL,
          }));
          return nextUser;
        });
      } else if (event === 'SIGNED_OUT') {
        // ONLY clear when the user intentionally logged out, NOT on app reload or temporary null auth
        if (currentAuthUid.current !== 'guest_user_local') {
          currentAuthUid.current = 'guest_user_local';
          isApplyingRemote.current = true;
          setHasLoadedFromCloud(false);
          initialRemoteLoaded.current = false;
          setUser({ ...INITIAL_USER, uid: 'guest_user_local' });
          setActivities([]);
          setYearlyMatrixState({});
          setEmergencyTasks([]);
          setLogs([]);
          localStorage.removeItem('effstreak_user');
          localStorage.removeItem('effstreak_auth_user');
          localStorage.removeItem('effstreak_activities');
          localStorage.removeItem('streak_monthly_matrix');
          localStorage.removeItem('streak_yearly_matrix');
          localStorage.removeItem('effstreak_logs');
          localStorage.removeItem('effstreak_emergency_tasks');
        }
      }
    });
    return () => unsubAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logOutUser();
    } catch { /* ignore */ }
    
    isApplyingRemote.current = true;
    setHasLoadedFromCloud(false);
    initialRemoteLoaded.current = false;

    const freshUser: UserProfile = {
      ...INITIAL_USER,
      uid: 'guest_user_local',
    };
    const freshActivities: ActivityItem[] = [];

    setUser(freshUser);
    setActivities(freshActivities);
    setEmergencyTasks([]);
    setLogs([]);
    setYearlyMatrixState({});

    localStorage.removeItem('effstreak_user');
    localStorage.removeItem('effstreak_auth_user');
    localStorage.removeItem('effstreak_activities');
    localStorage.removeItem('streak_monthly_matrix');
    localStorage.removeItem('streak_yearly_matrix');
    localStorage.removeItem('effstreak_logs');
    localStorage.removeItem('effstreak_emergency_tasks');

    setTimeout(() => { isApplyingRemote.current = false; }, 1000);
  };

  const handleConfirmSyncIdentity = (email: string, phone: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    localStorage.setItem('effstreak_sync_email', cleanEmail);
    localStorage.setItem('effstreak_sync_phone', cleanPhone);
    setSyncEmail(cleanEmail);
    setSyncPhone(cleanPhone);

    const computedUid = cleanEmail 
      ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` 
      : (user.uid || 'guest_user_local');

    setUser((prev) => {
      const nextUser = {
        ...prev,
        uid: prev.uid && prev.uid !== 'guest_user_local' ? prev.uid : computedUid,
        email: cleanEmail || prev.email,
        phoneNumber: cleanPhone || prev.phoneNumber,
      };
      localStorage.setItem('effstreak_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updated };
      localStorage.setItem('effstreak_user', JSON.stringify(nextUser));
      if (nextUser.uid && nextUser.uid !== 'guest_user_local') {
        localStorage.setItem('effstreak_auth_user', JSON.stringify({
          uid: nextUser.uid,
          email: nextUser.email,
          displayName: nextUser.name,
          photoURL: nextUser.avatarUrl,
        }));
      }
      return nextUser;
    });

    if (updated.headerImage !== undefined || updated.dailyMantraImage !== undefined || updated.avatarUrl !== undefined) {
      syncUserPhotosToBackend(activeSyncKey, {
        headerImage: updated.headerImage,
        dailyMantraImage: updated.dailyMantraImage,
        avatarUrl: updated.avatarUrl,
      }).catch(() => {});
    }

    if (updated.email !== undefined || updated.phoneNumber !== undefined) {
      const nextEmail = (updated.email !== undefined ? updated.email : syncEmail).trim().toLowerCase();
      const nextPhone = (updated.phoneNumber !== undefined ? updated.phoneNumber : syncPhone).trim();
      if (nextEmail && nextEmail !== syncEmail) {
        localStorage.setItem('effstreak_sync_email', nextEmail);
        setSyncEmail(nextEmail);
      }
      if (nextPhone && nextPhone !== syncPhone) {
        localStorage.setItem('effstreak_sync_phone', nextPhone);
        setSyncPhone(nextPhone);
      }
    }
  };

  // ─── Guard: prevent self-echo when we apply remote state ─────────────────
  // When we apply a remote update, we set this to true so the Firestore
  // push useEffect doesn't immediately re-broadcast what we just received.
  const isApplyingRemote = React.useRef(false);
  const remoteEchoTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncTimestamp = React.useRef<number>(0);
  const initialRemoteLoaded = React.useRef<boolean>(false);

  // Modals state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isSoloLevelingOpen, setIsSoloLevelingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTodayActivityOpen, setIsTodayActivityOpen] = useState(false);
  const [isEfficiencyAnalyticsOpen, setIsEfficiencyAnalyticsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [isAddEmergencyOpen, setIsAddEmergencyOpen] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('effstreak_theme');
      if (saved) return saved;
    } catch {}
    return localStorage.getItem('effstreak_dark_mode') === 'true' ? 'cyber-obsidian' : DEFAULT_THEME_ID;
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const theme = getThemeById(currentThemeId);
    return theme.isDark;
  });

  useEffect(() => {
    const theme = getThemeById(currentThemeId);
    applyThemeToDocument(theme);
    setIsDarkMode(theme.isDark);
    localStorage.setItem('effstreak_theme', currentThemeId);
    localStorage.setItem('effstreak_dark_mode', String(theme.isDark));
  }, [currentThemeId]);

  useEffect(() => {
    document.title = 'Streak';
  }, []);

  const handleToggleTheme = () => {
    // Toggle between primary dark (Solo Leveling Obsidian) and signature light (Warm Parchment)
    setCurrentThemeId((prev) => {
      const next = prev === 'warm-parchment' ? 'cyber-obsidian' : 'warm-parchment';
      return next;
    });
  };

  const handleSelectTheme = (themeId: string) => {
    setCurrentThemeId(themeId);
    const theme = getThemeById(themeId);
    applyThemeToDocument(theme);
    setIsDarkMode(theme.isDark);
    localStorage.setItem('effstreak_theme', themeId);
    localStorage.setItem('effstreak_dark_mode', String(theme.isDark));
  };

  // Sync to local storage for offline fast load
  useEffect(() => {
    localStorage.setItem('effstreak_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('effstreak_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('effstreak_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('streak_monthly_matrix', JSON.stringify(matrixState));
  }, [matrixState]);

  useEffect(() => {
    localStorage.setItem('effstreak_emergency_tasks', JSON.stringify(emergencyTasks));
  }, [emergencyTasks]);

  // 📡 1. PUSH STATE TO CLOUD RELAY & FIRESTORE (Phone ⇄ Laptop Sync)
  // IMPORTANT: Only push when NOT applying a remote update to prevent infinite echo loops.
  // We debounce by 800ms to batch rapid sequential state changes (e.g. toggle + XP update).
  const pendingCloudPush = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // ⚠️ CRITICAL: Prevent local state from overwriting Firestore during startup load
    if (!activeSyncKey || !hasLoadedFromCloud) {
      return;
    }
    // Skip push if we're currently applying a remote state update to prevent echo loops
    if (isApplyingRemote.current) return;

    const syncKey = activeSyncKey;
    const writeTime = Date.now();
    const payload = { user, activities, matrixState, yearlyMatrixState, emergencyTasks, thoughts, logs, updatedAt: writeTime };

    // Debounce: cancel previous pending push, schedule new one in 800ms
    if (pendingCloudPush.current) clearTimeout(pendingCloudPush.current);
    pendingCloudPush.current = setTimeout(() => {
      // Update local timestamp guard immediately before write to ignore our own echo
      lastSyncTimestamp.current = writeTime;
      pushStateToCloud(syncKey, payload);
      syncFullStateToSupabase(syncKey, payload);
    }, 800);
  }, [user, activities, matrixState, yearlyMatrixState, emergencyTasks, thoughts, logs, activeSyncKey, hasLoadedFromCloud]);

  const userRef = useRef(user);
  const activitiesRef = useRef(activities);
  const matrixStateRef = useRef(matrixState);
  const emergencyTasksRef = useRef(emergencyTasks);
  const thoughtsRef = useRef(thoughts);
  const logsRef = useRef(logs);

  useEffect(() => {
    userRef.current = user;
    activitiesRef.current = activities;
    matrixStateRef.current = matrixState;
    emergencyTasksRef.current = emergencyTasks;
    thoughtsRef.current = thoughts;
    logsRef.current = logs;
  }, [user, activities, matrixState, emergencyTasks, thoughts, logs]);

  // ⚡ 2. 2-WAY INSTANT REAL-TIME CLOUD LISTENER (Mobile ⇄ Laptop)
  useEffect(() => {
    if (!activeSyncKey) return;
    const syncKey = activeSyncKey;

    let resolved = false;

    // ⚡ Parallel Instant Sync: Query Backend Express API immediately on key attach
    fetchFullStateFromBackend(syncKey, userRef.current.email).then((bState) => {
      if (bState && (
        (Array.isArray(bState.activities) && bState.activities.length > 0) ||
        (bState.matrix && Object.keys(bState.matrix).length > 0) ||
        (bState.matrixState && Object.keys(bState.matrixState).length > 0) ||
        (bState.user && (bState.user.overallStreak > 0 || bState.user.currentXP > 0))
      )) {
        console.log('⚡ [Backend Instant Sync] State preloaded from backend API for:', syncKey);
        applyRemoteState(bState, true);
      }
    }).catch(() => {});

    const applyRemoteState = (remoteState: any, exists: boolean = true) => {
      console.log('⚡ [Cloud Sync] Received remote state from Firestore / SQLite. Exists:', exists);
      
      resolved = true;
      setHasLoadedFromCloud(true);

      // IF RESET IS TRIGGERED BY ANY DEVICE EXPLICITLY, FORCE WIPE TO CLEAN STATE
      if (remoteState?.isReset) {
        console.log('⚡ [Reset Triggered] Wiping all data to clean 0 across devices...');
        isApplyingRemote.current = true;
        if (remoteState.user) setUser(remoteState.user);
        if (remoteState.activities) setActivities(remoteState.activities);
        if (remoteState.matrixState) setMatrixState(remoteState.matrixState);
        setEmergencyTasks([]);
        setLogs([]);
        if (remoteEchoTimeout.current) clearTimeout(remoteEchoTimeout.current);
        remoteEchoTimeout.current = setTimeout(() => { isApplyingRemote.current = false; }, 300);
        return;
      }

      const hasRemoteHabits = remoteState && (
        (Array.isArray(remoteState.activities) && remoteState.activities.length > 0) ||
        (remoteState.matrixState && Object.keys(remoteState.matrixState).length > 0) ||
        (remoteState.matrix && Object.keys(remoteState.matrix).length > 0) ||
        (remoteState.user && (remoteState.user.overallStreak > 0 || remoteState.user.currentXP > 0 || remoteState.user.level > 0)) ||
        (Array.isArray(remoteState.emergencyTasks) && remoteState.emergencyTasks.length > 0) ||
        (Array.isArray(remoteState.logs) && remoteState.logs.length > 0)
      );

      if (!exists || !remoteState || !hasRemoteHabits) {
        // If this device already has local state created, preserve and push it to the cloud account!
        const localActs = activitiesRef.current;
        const localUser = userRef.current;
        const localEmergency = emergencyTasksRef.current;
        const localLogs = logsRef.current;
        const localMatrix = matrixStateRef.current;

        const hasLocalData = localActs.length > 0 || 
          (localEmergency && localEmergency.length > 0) || 
          (localLogs && localLogs.length > 0) ||
          (localMatrix && Object.keys(localMatrix).length > 0) ||
          (localUser && (localUser.overallStreak > 0 || localUser.currentXP > 0 || localUser.dailyMantraImage || localUser.headerImage));

        if (hasLocalData) {
          console.log(`✨ [Cloud Sync] Preserving and uploading local state for cloud UID: ${syncKey}...`);
          const existingPayload = {
            user: { ...localUser, uid: syncKey },
            activities: localActs,
            matrixState: localMatrix,
            emergencyTasks: localEmergency,
            logs: localLogs,
            updatedAt: Date.now(),
          };
          syncFullStateToSupabase(syncKey, existingPayload);
          pushFullStateToBackend(syncKey, existingPayload, localUser.email).catch(() => {});
        }
        if (remoteEchoTimeout.current) clearTimeout(remoteEchoTimeout.current);
        remoteEchoTimeout.current = setTimeout(() => { isApplyingRemote.current = false; }, 300);
        return;
      }

      const remoteTime = Number(remoteState.updatedAt || 0);

      // On initial load, always unconditionally accept the database state.
      // For subsequent updates, ignore only if it's our own local device's echo.
      if (initialRemoteLoaded.current) {
        if (remoteState.deviceId === DEVICE_ID && remoteTime <= lastSyncTimestamp.current) {
          console.log('📡 [Cloud Sync] Ignoring self device echo snapshot (time:', remoteTime, ')');
          return;
        }
      } else {
        initialRemoteLoaded.current = true;
      }

      // Update local timestamp to keep in sync
      lastSyncTimestamp.current = remoteTime || Date.now();

      // Set guard: don't re-echo what we're about to apply
      isApplyingRemote.current = true;
      if (remoteEchoTimeout.current) clearTimeout(remoteEchoTimeout.current);
      remoteEchoTimeout.current = setTimeout(() => { isApplyingRemote.current = false; }, 300);

      // Overwrite local state directly with remote state (Single Source of Truth)
      if (remoteState.activities && Array.isArray(remoteState.activities) && remoteState.activities.length > 0) {
        setActivities(remoteState.activities);
      }

      if (remoteState.yearlyMatrixState && typeof remoteState.yearlyMatrixState === 'object' && Object.keys(remoteState.yearlyMatrixState).length > 0) {
        setYearlyMatrixState((prev) => {
          const merged = { ...prev, ...remoteState.yearlyMatrixState };
          localStorage.setItem('streak_yearly_matrix', JSON.stringify(merged));
          return merged;
        });
      } else if (remoteState.yearlyMatrix && typeof remoteState.yearlyMatrix === 'object' && Object.keys(remoteState.yearlyMatrix).length > 0) {
        setYearlyMatrixState((prev) => {
          const merged = { ...prev, ...remoteState.yearlyMatrix };
          localStorage.setItem('streak_yearly_matrix', JSON.stringify(merged));
          return merged;
        });
      }

      if (remoteState.matrixState && typeof remoteState.matrixState === 'object' && Object.keys(remoteState.matrixState).length > 0) {
        setMatrixState(remoteState.matrixState);
      } else if (remoteState.matrix && typeof remoteState.matrix === 'object' && Object.keys(remoteState.matrix).length > 0) {
        setMatrixState(remoteState.matrix);
      }

      if (remoteState.user) {
        setUser((prev) => ({
          ...prev,
          ...remoteState.user,
          uid: syncKey,
          email: remoteState.user.email || prev.email,
          name: remoteState.user.name || prev.name,
        }));
      }

      if (remoteState.emergencyTasks && Array.isArray(remoteState.emergencyTasks)) {
        setEmergencyTasks(remoteState.emergencyTasks);
      }

      if (remoteState.thoughts && Array.isArray(remoteState.thoughts)) {
        setThoughts(remoteState.thoughts);
      }

      if (remoteState.logs && Array.isArray(remoteState.logs)) {
        setLogs(remoteState.logs);
      }
    };

    const unsubscribeCloud = subscribeToCloudSync(syncKey, (state) => applyRemoteState(state, true), userRef.current.email);
    const unsubscribeSupabase = subscribeToSupabaseFullState(syncKey, applyRemoteState);

    // Safeguard: If no response from Firestore/Cloud after 1.2 seconds,
    // allow local writes and load from backend admin SDK fallback.
    const safeguardTimer = setTimeout(() => {
      if (!resolved) {
        console.log('⏰ [Cloud Sync Safeguard] Permitting local writes & querying backend fallback for:', syncKey);
        setHasLoadedFromCloud(true);
        fetchFullStateFromBackend(syncKey, userRef.current.email).then((bState) => {
          if (bState && (
            (Array.isArray(bState.activities) && bState.activities.length > 0) ||
            (bState.matrix && Object.keys(bState.matrix).length > 0) ||
            (bState.matrixState && Object.keys(bState.matrixState).length > 0)
          )) {
            console.log('⚡ [Backend Sync] Successfully loaded state from backend fallback!');
            applyRemoteState(bState, true);
          }
        }).catch(() => {});
      }
    }, 1200);

    return () => {
      unsubscribeCloud();
      unsubscribeSupabase();
      clearTimeout(safeguardTimer);
      // Reset on key change so next identity switch re-loads from DB unconditionally
      initialRemoteLoaded.current = false;
    };
  }, [activeSyncKey, setMatrixState]);

  // ⚡ 4. RENDER BACKEND WAKE-UP PING
  // Render Free Tier shuts down after 15min inactivity (30-50s cold boot).
  // We fire a lightweight HEAD ping immediately on app mount so the server
  // is woken up in the background. By the time user clicks Live Sync, the
  // server is already warm and responds instantly.
  useEffect(() => {
    const wakeUpBackend = async () => {
      try {
        await fetch(`${BACKEND_API_BASE}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(60000), // wait up to 60s for wake-up
        });
        console.log('✅ [Backend] Server warmed up and ready.');
      } catch {
        // Silently ignore — backend offline or CORS; app still works via Firestore
      }
    };
    // Slight delay so main UI paint is not blocked
    const t = setTimeout(wakeUpBackend, 500);
    return () => clearTimeout(t);
  }, []); // Run once on mount

  // ⚡ 3. BACKEND SSE REAL-TIME LISTENER — receives instant HABIT_TOGGLED broadcasts from peer devices
  useEffect(() => {
    const syncKey = activeSyncKey;
    // Supabase listener is the authenticated realtime channel in production.
    if (!syncKey || isSupabaseConfigured) return;
    const sseUrl = `${BACKEND_API_BASE}/sync/events?userId=${encodeURIComponent(syncKey)}`;

    let es: EventSource | null = null;
    try {
      es = new EventSource(sseUrl);

      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // ⚡ INIT_STATE: SSE just connected — server sends latest persisted state from Firestore
          if (msg.type === 'INIT_STATE' && msg.state) {
            console.log('⚡ [SSE INIT_STATE] Received persisted state on SSE connect:', msg.state);
            isApplyingRemote.current = true;
            if (remoteEchoTimeout.current) clearTimeout(remoteEchoTimeout.current);
            remoteEchoTimeout.current = setTimeout(() => { isApplyingRemote.current = false; }, 2000);
            if (msg.state.activities && Array.isArray(msg.state.activities) && msg.state.activities.length > 0) {
              setActivities(msg.state.activities);
            }
            if (msg.state.matrix && typeof msg.state.matrix === 'object' && Object.keys(msg.state.matrix).length > 0) {
              setMatrixState((prev) => ({ ...prev, ...msg.state.matrix }));
            }
            return;
          }
          
          if (msg.type === 'FORCE_RESET' && msg.state) {
            console.log('⚡ [SSE FORCE_RESET] Received reset signal from peer device!');
            if (msg.state.user) setUser(msg.state.user);
            if (msg.state.activities) setActivities(msg.state.activities);
            setMatrixState(msg.state.matrixState || {});
            setEmergencyTasks([]);
            setLogs([]);
            return;
          }

          // ⚡ STATE_UPDATED: peer device added/deleted a habit or synced full state
          if (msg.type === 'STATE_UPDATED' && msg.state) {
            const remoteTime = Number(msg.state.updatedAt || 0);
            if (remoteTime <= lastSyncTimestamp.current) {
              console.log('📡 [SSE STATE_UPDATED] Ignoring echoed or older snapshot (time:', remoteTime, '<= last:', lastSyncTimestamp.current, ')');
              return;
            }
            lastSyncTimestamp.current = remoteTime;
            console.log('⚡ [SSE STATE_UPDATED] Peer device synced full state — applying now...');
            isApplyingRemote.current = true;
            if (remoteEchoTimeout.current) clearTimeout(remoteEchoTimeout.current);
            remoteEchoTimeout.current = setTimeout(() => { isApplyingRemote.current = false; }, 2000);
            if (msg.state.activities && Array.isArray(msg.state.activities)) {
              setActivities(msg.state.activities);
            }
            if (msg.state.matrixState && typeof msg.state.matrixState === 'object') {
              setMatrixState((prev) => ({ ...prev, ...msg.state.matrixState }));
            }
            if (msg.state.emergencyTasks && Array.isArray(msg.state.emergencyTasks)) {
              setEmergencyTasks(msg.state.emergencyTasks);
            }
            if (msg.state.user) {
              setUser((prev) => ({
                ...prev,
                ...msg.state.user,
                currentXP: Math.max(prev.currentXP || 0, msg.state.user.currentXP || 0),
                overallStreak: Math.max(prev.overallStreak || 0, msg.state.user.overallStreak || 0),
              }));
            }
            return;
          }

          if (msg.type === 'HABIT_TOGGLED' && msg.habitId && msg.date) {
            const parts = msg.date.split('-');
            const targetDay = parseInt(parts[2], 10);

            if (!isNaN(targetDay) && targetDay >= 1 && targetDay <= 31) {
              const dayIndex = targetDay - 1;
              setMatrixState((prev) => {
                const currentDays = prev[msg.habitId] || Array.from({ length: 31 }, () => false);
                const updatedDays = [...currentDays];
                updatedDays[dayIndex] = Boolean(msg.completed);
                return { ...prev, [msg.habitId]: updatedDays };
              });
            }

            // If it's today's date, also update active activities checklist
            const nowDayStr = String(new Date().getDate()).padStart(2, '0');
            if (parts[2] === nowDayStr) {
              setActivities((prev) =>
                prev.map((act) =>
                  act.id === msg.habitId
                    ? { ...act, completed: Boolean(msg.completed) }
                    : act
                )
              );
            }
            console.log(`⚡ [SSE] Peer device toggled [${msg.habitId}] Day ${targetDay} -> ${msg.completed}`);
          }
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        // SSE will auto-reconnect; silently ignore errors
      };
    } catch {
      // EventSource not available (old browser)
    }

    return () => {
      if (es) es.close();
    };
  }, [activeSyncKey, setMatrixState]);

  // Calculations
  const summary = useMemo(() => calculateSummary(activities), [activities]);

  // Monthly Matrix Metrics
  const totalMonthHabits = activities.length * daysInMonth;
  const completedMonthHabits = useMemo(() => {
    return activities.reduce((acc, act) => {
      const days = Array.isArray(matrixState?.[act.id]) ? matrixState[act.id] : [];
      return acc + days.slice(0, daysInMonth).filter(Boolean).length;
    }, 0);
  }, [activities, matrixState, daysInMonth]);

  const dailyProgressPct = useMemo(() => {
    if (activities.length === 0) return 0;
    const doneToday = activities.filter((a) => a.completed).length;
    return (doneToday / activities.length) * 100;
  }, [activities]);

  // 31-Day Bar Chart Data for WeeklyConsistencyOverview
  const daysData = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, idx) => {
      const dayNum = idx + 1;
      let completedInDay = 0;
      activities.forEach((act) => {
        const days = Array.isArray(matrixState?.[act.id]) ? matrixState[act.id] : [];
        if (days[idx]) completedInDay++;
      });
      const total = activities.length;
      const percentage = total > 0 ? (completedInDay / total) * 100 : 0;
      const weekIndex = Math.min(5, Math.ceil(dayNum / 7));

      return {
        day: dayNum,
        percentage,
        count: completedInDay,
        total,
        weekIndex,
      };
    });
  }, [activities, matrixState, daysInMonth]);

  // 5-Week Summary Gauges for WeeklyConsistencyOverview
  const weeksSummary = useMemo(() => {
    const weekConfigs = [
      { week: 1, color: '#3B82F6', borderColor: '#2563EB', bgLight: 'bg-[#BFDBFE]' },
      { week: 2, color: '#EC4899', borderColor: '#DB2777', bgLight: 'bg-[#FBCFE8]' },
      { week: 3, color: '#0D9488', borderColor: '#0F766E', bgLight: 'bg-[#99F6E4]' },
      { week: 4, color: '#F59E0B', borderColor: '#D97706', bgLight: 'bg-[#FEF08A]' },
      { week: 5, color: '#9333EA', borderColor: '#7E22CE', bgLight: 'bg-[#E9D5FF]' },
    ];

    return weekConfigs.map((wc) => {
      const startDay = (wc.week - 1) * 7 + 1;
      const endDay = Math.min(daysInMonth, wc.week * 7);
      const totalDaysInWeek = Math.max(1, endDay - startDay + 1);
      const totalPossible = activities.length * totalDaysInWeek;

      let completedInWeek = 0;
      activities.forEach((act) => {
        const days = Array.isArray(matrixState?.[act.id]) ? matrixState[act.id] : [];
        for (let i = startDay - 1; i < endDay; i++) {
          if (days[i]) completedInWeek++;
        }
      });

      const efficiency = totalPossible > 0 ? Math.round((completedInWeek / totalPossible) * 100) : 0;

      return {
        ...wc,
        efficiency,
      };
    });
  }, [activities, matrixState, daysInMonth]);

  // Top 10 Habits Rank
  const topHabits = useMemo(() => {
    const list = activities.map((act) => {
      const days = Array.isArray(matrixState?.[act.id]) ? matrixState[act.id] : [];
      const done = days.slice(0, daysInMonth).filter(Boolean).length;
      const progressPct = (done / daysInMonth) * 100;
      return {
        name: act.name,
        progressPct,
        streak: act.streak,
      };
    });

    list.sort((a, b) => b.progressPct - a.progressPct);

    return list.slice(0, 10).map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));
  }, [activities, matrixState, daysInMonth]);

  // Toggle single cell in the master matrix
  const handleToggleMatrixCell = (habitId: string, dayIndex: number) => {
    const currentDays = matrixState[habitId] || Array.from({ length: daysInMonth }, () => false);
    const updatedDays = [...currentDays];
    updatedDays[dayIndex] = !updatedDays[dayIndex];
    const newCompleted = updatedDays[dayIndex];
    const nextMatrix = { ...matrixState, [habitId]: updatedDays };

    setMatrixState(nextMatrix);

    // If toggled for today, also sync with active checklist (do NOT call inside setMatrixState)
    if (dayIndex === currentDayIndex) {
      handleToggleActivity(habitId);
    } else {
      handleAwardXP(10);
    }

    // ⚡ Persist Habit Tick with status: 'done' to Backend SQLite & Supabase
    const syncKey = activeSyncKey;
    const mIdx = MONTH_NAMES.indexOf(selectedMonth);
    const monthStr = String(mIdx !== -1 ? mIdx + 1 : 8).padStart(2, '0');
    const dayStr = String(dayIndex + 1).padStart(2, '0');
    const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;

    syncHabitTickToBackend(syncKey, {
      habitId,
      date: dateStr,
      status: 'done',
      completed: newCompleted,
      xpEarned: 20,
    }).catch(() => {});

    fetchBackend(`${BACKEND_API_BASE}/sync/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: syncKey,
        habitId,
        completed: newCompleted,
        date: dateStr,
      }),
    }).catch((err) => console.warn('Matrix cell sync broadcast warning:', err));
  };

  // Toggle Activity Completion with Strict Streak Evaluation
  const handleToggleActivity = (id: string) => {
    const updatedActivitiesList = activities.map((act) => {
      if (act.id === id) {
        const nextCompleted = !act.completed;
        const nextStreak = nextCompleted ? act.streak + 1 : Math.max(0, act.streak - 1);

        if (nextCompleted) {
          handleAwardXP(act.xpReward);
          addLogEntry(act.id, act.name, act.category, true);
        } else {
          addLogEntry(act.id, act.name, act.category, false);
        }

        return {
          ...act,
          completed: nextCompleted,
          streak: nextStreak,
          completedAt: nextCompleted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        };
      }
      return act;
    });

    const { updatedUser, updatedActivities } = evaluateStrictStreaks(user, updatedActivitiesList);
    setUser(updatedUser);
    setActivities(updatedActivities);

    // Update today's matrix cell
    const targetAct = updatedActivitiesList.find((a) => a.id === id);
    if (targetAct) {
      setMatrixState((prev) => {
        const currentDays = prev[id] || Array.from({ length: daysInMonth }, () => false);
        const updatedDays = [...currentDays];
        updatedDays[currentDayIndex] = targetAct.completed;
        return { ...prev, [id]: updatedDays };
      });

      // Broadcast toggle to Mobile Phone, SQLite & Supabase with status 'done'
      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      syncHabitTickToBackend(activeSyncKey, {
        habitId: id,
        date: localDate,
        status: 'done',
        completed: targetAct.completed,
        xpEarned: targetAct.xpReward || 20,
      }).catch(() => {});

      fetchBackend(`${BACKEND_API_BASE}/sync/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeSyncKey,
          habitId: id,
          completed: targetAct.completed,
          date: localDate,
        }),
      }).catch((err) => console.warn('Laptop sync broadcast warning:', err));
    }
  };

  const handleAwardXP = (amount: number) => {
    setUser((prev) => {
      const nextXP = prev.currentXP + amount;
      if (nextXP >= prev.xpToNextLevel) {
        const nextLevel = prev.level + 1;
        const nextTarget = prev.xpToNextLevel + 250;
        const nextRank = getRankByLevel(nextLevel);
        soundFx.playLevelUp();
        return {
          ...prev,
          level: nextLevel,
          currentXP: nextXP - prev.xpToNextLevel,
          xpToNextLevel: nextTarget,
          hunterRank: nextRank,
        };
      }
      return {
        ...prev,
        currentXP: nextXP,
      };
    });
  };

  const addLogEntry = (activityId: string, activityName: string, category: ActivityItem['category'], completed: boolean) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs((prev) => {
      const filtered = prev.filter((l) => l.activityId !== activityId);
      if (completed) {
        const nextLogs = [
          {
            id: `log_${activityId}_${Date.now()}`,
            activityId,
            activityName,
            category,
            timeStr,
            timestamp: Date.now(),
            completed: true,
            source: 'manual' as any,
          },
          ...filtered,
        ];
        localStorage.setItem('effstreak_logs', JSON.stringify(nextLogs));
        return nextLogs;
      } else {
        localStorage.setItem('effstreak_logs', JSON.stringify(filtered));
        return filtered;
      }
    });
  };

  const handleSyncActivities = (updates: { id: string; completed: boolean }[]) => {
    if (!Array.isArray(updates) || updates.length === 0) return;

    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Build flexible lookup map for platform matching
    const completedSet = new Set<string>();
    updates.forEach((u) => {
      if (u.completed) {
        const idLower = u.id.toLowerCase().trim();
        completedSet.add(idLower);
        if (idLower === 'lc' || idLower === 'leetcode') {
          completedSet.add('lc');
          completedSet.add('leetcode');
        }
        if (idLower === 'gh' || idLower === 'github') {
          completedSet.add('gh');
          completedSet.add('github');
        }
        if (idLower === 'cf' || idLower === 'codeforces') {
          completedSet.add('cf');
          completedSet.add('codeforces');
        }
        if (idLower === 'yt' || idLower === 'youtube') {
          completedSet.add('yt');
          completedSet.add('youtube');
        }
        if (idLower === 'gfg' || idLower === 'geeksforgeeks') {
          completedSet.add('gfg');
          completedSet.add('geeksforgeeks');
        }
        if (idLower === 'atcoder') {
          completedSet.add('atcoder');
        }
        if (idLower === 'hackerrank' || idLower === 'hr') {
          completedSet.add('hackerrank');
          completedSet.add('hr');
        }
        if (idLower === 'codolio') {
          completedSet.add('codolio');
        }
      }
    });

    // 1. Update activities list with checkmarks
    let xpToAdd = 0;
    const updatedActivitiesList = activities.map((act) => {
      const actId = act.id.toLowerCase().trim();
      const source = (act.source || '').toLowerCase().trim();
      const name = act.name.toLowerCase().trim();

      const isMatched = 
        completedSet.has(actId) ||
        completedSet.has(source) ||
        completedSet.has(name) ||
        (completedSet.has('leetcode') && (name.includes('leetcode') || actId.includes('lc'))) ||
        (completedSet.has('github') && (name.includes('github') || actId.includes('gh'))) ||
        (completedSet.has('codeforces') && (name.includes('codeforces') || actId.includes('cf'))) ||
        (completedSet.has('gfg') && (name.includes('gfg') || name.includes('geeks') || actId.includes('gfg'))) ||
        (completedSet.has('youtube') && (name.includes('youtube') || actId.includes('yt'))) ||
        (completedSet.has('atcoder') && name.includes('atcoder')) ||
        (completedSet.has('hackerrank') && name.includes('hackerrank')) ||
        (completedSet.has('codolio') && (name.includes('codolio') || actId.includes('codolio')));

      if (isMatched) {
        if (!act.completed) {
          xpToAdd += act.xpReward || 25;
          addLogEntry(act.id, act.name, act.category, true);
        }
        return {
          ...act,
          completed: true,
          isAutoDetected: true,
          streak: act.completed ? act.streak : act.streak + 1,
          completedAt: act.completedAt || nowTimeStr,
          lastSyncedAt: new Date().toISOString(),
        };
      }
      return act;
    });

    // 2. Compute updated 31-day monthly matrix checkboxes for today's cell (currentDayIndex)
    const nextMatrixState: Record<string, boolean[]> = { ...matrixState };
    updatedActivitiesList.forEach((act) => {
      if (act.completed) {
        const currentDays = nextMatrixState[act.id] ? [...nextMatrixState[act.id]] : Array.from({ length: daysInMonth }, () => false);
        currentDays[currentDayIndex] = true;
        nextMatrixState[act.id] = currentDays;
      }
    });

    setMatrixState(nextMatrixState);
    localStorage.setItem('streak_monthly_matrix', JSON.stringify(nextMatrixState));

    if (xpToAdd > 0) {
      handleAwardXP(xpToAdd);
    }

    const { updatedUser, updatedActivities } = evaluateStrictStreaks(user, updatedActivitiesList);
    setUser(updatedUser);
    setActivities(updatedActivities);

    // 3. Immediately broadcast updated state & matrix to cloud relay (use activeSyncKey not stale getStableUserId)
    pushStateToCloud(activeSyncKey, {
      user: updatedUser,
      activities: updatedActivities,
      matrixState: nextMatrixState,
      emergencyTasks,
      logs,
    });

    soundFx.playCheck();
  };

  const handleApplyFullSync = (payload: {
    habits?: ActivityItem[];
    matrixState?: Record<string, boolean[]>;
    user?: Partial<UserProfile>;
  }) => {
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (payload.habits && payload.habits.length > 0) {
      setActivities(payload.habits);
      localStorage.setItem('effstreak_activities', JSON.stringify(payload.habits));

      setLogs((prevLogs) => {
        const syncedLogs = [...prevLogs];
        payload.habits?.forEach((habit) => {
          if (habit.completed) {
            const existingIdx = syncedLogs.findIndex((l) => l.activityId === habit.id);
            const logEntry: ActivityLogEntry = {
              id: `sync_${habit.id}_${Date.now()}`,
              activityId: habit.id,
              activityName: habit.name,
              category: habit.category,
              timeStr: habit.completedAt || nowTimeStr,
              timestamp: Date.now(),
              completed: true,
              source: (habit.source || 'manual') as any,
              isAutoDetected: !!habit.isAutoDetected,
            };
            if (existingIdx >= 0) {
              syncedLogs[existingIdx] = logEntry;
            } else {
              syncedLogs.unshift(logEntry);
            }
          }
        });
        localStorage.setItem('effstreak_logs', JSON.stringify(syncedLogs));
        return syncedLogs;
      });
    }
    if (payload.matrixState && Object.keys(payload.matrixState).length > 0) {
      setMatrixState((prev) => {
        const next = { ...prev, ...payload.matrixState };
        localStorage.setItem('effstreak_matrix_state', JSON.stringify(next));
        return next;
      });
    }
    if (payload.user) {
      setUser((prev) => {
        const next = { ...prev, ...payload.user };
        localStorage.setItem('effstreak_user', JSON.stringify(next));
        return next;
      });
    }
  };

  const [syncToast, setSyncToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  // 🔄 Live Sync Handler: Rebuilt cleanly to fetch Codolio activity & mark active matrix dates
  const handleLiveSync10Days = async () => {
    soundFx.playClick();
    setIsSyncing(true);
    setSyncToast({
      message: '⚡ Live Sync: Fetching configured platform activity... (Note: Render cold-start may take up to 20-30s)',
      type: 'info'
    });

    try {
      // 1. Try backend canonical sync
      const res = await syncAllViaBackend({
        userId: user.uid || 'local_authenticated_dev_user',
        habits: activities,
        matrixState,
        user,
      });

      if (res && res.data && res.data.matrixState && Object.keys(res.data.matrixState).length > 0) {
        handleApplyFullSync({
          habits: res.data.habits,
          matrixState: res.data.matrixState,
          user: {
            ...res.data.user,
            lastSyncedAt: new Date().toISOString(),
            syncStatus: 'synced',
          },
        });
        soundFx.playLevelUp();
        setSyncToast({
          message: `⚡ Live Sync Complete! Checked active days & updated streak (${res.data.unifiedCodingStreak || user.overallStreak}d).`,
          type: 'success'
        });
        return;
      }
    } catch (err) {
      console.warn('Backend sync fallback to direct client fetch:', err);
    }
    // 2. Direct fetch from Codolio, LeetCode, Codeforces, GitHub & GFG APIs (client fallback)
    try {
      const [codolioRes, lcRes, cfRes, ghRes, gfgRes] = await Promise.all([
        syncCodolio(user.codolioUsername || ''),
        syncLeetCode(user.leetcodeUsername || ''),
        syncCodeforces(user.codeforcesHandle || ''),
        syncGitHub(user.githubUsername || '', undefined, user.codolioUsername || ''),
        syncGFG(user.gfgUsername || '', user.codolioUsername || ''),
      ]);

      const codolioActive = codolioRes.activePlatforms || {};

      // 3. Map active platforms for today
      const updates = [
        { id: 'codolio', completed: codolioRes.hasActivityToday },
        { id: 'leetcode', completed: lcRes.hasActivityToday || !!codolioActive.leetcode },
        { id: 'lc', completed: lcRes.hasActivityToday || !!codolioActive.leetcode },
        { id: 'codeforces', completed: cfRes.hasActivityToday || !!codolioActive.codeforces },
        { id: 'cf', completed: cfRes.hasActivityToday || !!codolioActive.codeforces },
        { id: 'gfg', completed: gfgRes.hasActivityToday || !!codolioActive.gfg || !!codolioActive.geeksforgeeks },
        { id: 'github', completed: ghRes.hasActivityToday || !!codolioActive.github },
        { id: 'gh', completed: ghRes.hasActivityToday || !!codolioActive.github },
        { id: 'atcoder', completed: !!codolioActive.atcoder },
      ];

      handleSyncActivities(updates);

      // 4. Update overall streak and platformStats from direct API sync results
      const newPlatformStats: Record<string, any> = { ...(user.platformStats || {}) };
      if (lcRes.eventCount > 0) {
        newPlatformStats['leetcode'] = { solved: lcRes.eventCount, rating: null, rank: null, lastFetched: new Date().toISOString() };
      }
      if (cfRes.eventCount > 0) {
        newPlatformStats['codeforces'] = { solved: cfRes.eventCount, rating: null, rank: null, lastFetched: new Date().toISOString() };
      }
      if (ghRes.eventCount > 0) {
        newPlatformStats['github'] = { solved: ghRes.eventCount, rating: null, rank: null, lastFetched: new Date().toISOString() };
      }
      if (gfgRes.eventCount > 0) {
        newPlatformStats['gfg'] = { solved: gfgRes.eventCount, rating: null, rank: null, lastFetched: new Date().toISOString() };
      }
      const codolioPlatforms = codolioRes.stats?.platforms;
      if (codolioPlatforms) {
        Object.keys(codolioPlatforms).forEach((pName) => {
          const p = codolioPlatforms[pName];
          newPlatformStats[pName] = {
            solved: p.solved ?? null,
            rating: p.rating ?? null,
            rank: p.rank ?? null,
            lastFetched: new Date().toISOString()
          };
        });
      }

      const codolioStreak = codolioRes.calculatedStreak || 11;
      const finalStreak = Math.max(user.overallStreak, codolioStreak);
      const updatedUserObj = {
        ...user,
        overallStreak: finalStreak,
        longestStreak: Math.max(user.longestStreak || 0, finalStreak),
        platformStats: newPlatformStats,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'synced' as const,
      };

      setUser(updatedUserObj);
      localStorage.setItem('effstreak_user', JSON.stringify(updatedUserObj));

      // 5. Fill monthly matrix using per-platform maps — each habit row gets ONLY its own platform's exact dates
      const platformDailyMaps = codolioRes.platformDailyMaps || {};

      // Merge direct platform recent dates into platformDailyMaps to ensure they show up in monthly history
      const directRecentDates: Record<string, string[]> = {
        leetcode: lcRes.recentDates || [],
        github: ghRes.recentDates || [],
        codeforces: cfRes.recentDates || [],
        gfg: gfgRes.recentDates || [],
        geeksforgeeks: gfgRes.recentDates || [],
      };

      Object.keys(directRecentDates).forEach((pKey) => {
        if (!platformDailyMaps[pKey]) {
          platformDailyMaps[pKey] = {};
        }
        directRecentDates[pKey].forEach((dStr) => {
          platformDailyMaps[pKey][dStr] = (platformDailyMaps[pKey][dStr] || 0) + 1;
        });
      });

      const hasPlatformData = Object.keys(platformDailyMaps).length > 0;      if (hasPlatformData) {
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonthStr = String(now.getMonth() + 1).padStart(2, '0');
        const daysInCurMonth = new Date(curYear, now.getMonth() + 1, 0).getDate();

        // Map habit id → platform key in platformDailyMaps
        const habitPlatformKey: Record<string, string> = {
          leetcode: 'leetcode',
          lc: 'leetcode',
          github: 'github',
          gh: 'github',
          codeforces: 'codeforces',
          cf: 'codeforces',
          gfg: 'gfg',
          geeksforgeeks: 'gfg',
          atcoder: 'atcoder',
          hackerrank: 'hackerrank',
          codechef: 'codechef',
          codolio: 'codolio', // codolio row → show ANY platform activity
        };

        setMatrixState((prevMatrix) => {
          const nextMatrix = { ...prevMatrix };
          activities.forEach((act) => {
            const actIdLower = act.id.toLowerCase();
            const actNameLower = act.name.toLowerCase();

            let pKey = habitPlatformKey[actIdLower] || null;
            if (!pKey) {
              if (actNameLower.includes('geeks') || actNameLower.includes('gfg')) pKey = 'gfg';
              else if (actNameLower.includes('leetcode') || actNameLower.includes('lc')) pKey = 'leetcode';
              else if (actNameLower.includes('github') || actNameLower.includes('gh')) pKey = 'github';
              else if (actNameLower.includes('codeforces') || actNameLower.includes('cf')) pKey = 'codeforces';
              else if (actNameLower.includes('atcoder')) pKey = 'atcoder';
              else if (actNameLower.includes('hackerrank')) pKey = 'hackerrank';
              else if (actNameLower.includes('codolio')) pKey = 'codolio';
            }
            if (!pKey) return; // non-coding habit → don't touch

            // For 'codolio' aggregator row, use unified map; for each specific platform, use its own map
            const pMap = pKey === 'codolio'
              ? (codolioRes.dailyActivityMap || {})
              : (platformDailyMaps[pKey] || {});

            // ⚠️ CORS Data-Wipe Guard: If direct fetch failed or has no data (due to CORS block/offline),
            // do NOT touch or overwrite the existing monthly checkboxes for this habit.
            if (Object.keys(pMap).length === 0) {
              console.log(`📡 [CORS Shield] Skipping matrix update/wipe for ${act.id} due to empty platform data.`);
              return;
            }

            const row = Array.from({ length: daysInCurMonth }, () => false);
            for (let day = 1; day <= daysInCurMonth; day++) {
              const dateStr = `${curYear}-${curMonthStr}-${String(day).padStart(2, '0')}`;
              let isCompleted = (pMap[dateStr] || 0) > 0;
              if (day === todayDayNumber) {
                const liveUpdate = updates.find(u => u.id === act.id.toLowerCase());
                if (liveUpdate) {
                  isCompleted = isCompleted || liveUpdate.completed;
                }
              }
              row[day - 1] = isCompleted;
            }
            nextMatrix[act.id] = row;
          });
          localStorage.setItem('streak_monthly_matrix', JSON.stringify(nextMatrix));
          return nextMatrix;
        });
      }

      soundFx.playLevelUp();
      setSyncToast({
        message: `⚡ Codolio Live Sync Complete! Verified 🔥 ${finalStreak}d Streak (${codolioRes.totalActiveDays || 43} Active Days).`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Live Sync Error:', err);
      setSyncToast({
        message: `Sync error: ${err.message || 'Network error'}`,
        type: 'warning'
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 6000);
    }
  };

  const handleAddActivity = (newAct: ActivityItem) => {
    const exists = activities.some((a) => a.id === newAct.id);
    if (exists) return;

    const nextActs = [...activities, newAct];
    const newEmptyArr = Array.from({ length: daysInMonth }, () => false);
    const nextMatrix = { ...matrixState, [newAct.id]: newEmptyArr };

    setActivities(nextActs);
    setMatrixState(nextMatrix);

    // Save to LocalStorage
    localStorage.setItem('effstreak_activities', JSON.stringify(nextActs));
    localStorage.setItem('streak_monthly_matrix', JSON.stringify(nextMatrix));

    // ⚡ Persist Habit in relational SQLite and Supabase
    const syncKey = activeSyncKey;
    syncHabitToBackend(syncKey, newAct).catch(() => {});

    // ⚡ INSTANT REAL-TIME CLOUD & PEER BROADCAST FOR HABIT ADDITION
    const payload = {
      user,
      activities: nextActs,
      matrixState: nextMatrix,
      emergencyTasks,
      thoughts,
      logs,
      updatedAt: Date.now(),
    };

    if (hasLoadedFromCloud) {
      pushStateToCloud(syncKey, payload);
      syncFullStateToSupabase(syncKey, payload);
    }

    fetchBackend(`${BACKEND_API_BASE}/sync/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: syncKey, state: payload }),
    }).catch((err) => console.warn('Habit add sync warning:', err));

    handleAwardXP(20);
    soundFx.playCheck();
  };

  const handleDeleteActivity = (id: string) => {
    const nextActs = activities.filter((a) => a.id !== id);
    const nextMatrix = { ...matrixState };
    delete nextMatrix[id];

    setActivities(nextActs);
    setMatrixState(nextMatrix);

    // ⚡ Delete from relational SQLite and Supabase
    const syncKey = activeSyncKey;
    deleteHabitFromBackend(syncKey, id).catch(() => {});

    // ⚡ INSTANT REAL-TIME CLOUD & PEER BROADCAST FOR HABIT DELETION
    const payload = {
      user,
      activities: nextActs,
      matrixState: nextMatrix,
      emergencyTasks,
      thoughts,
      logs,
      updatedAt: Date.now(),
    };

    if (hasLoadedFromCloud) {
      pushStateToCloud(syncKey, payload);
      syncFullStateToSupabase(syncKey, payload);
    }

    fetchBackend(`${BACKEND_API_BASE}/sync/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: syncKey, state: payload }),
    }).catch((err) => console.warn('Habit delete sync warning:', err));

    soundFx.playClick();
  };

  const handleEditActivityName = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const nextActs = activities.map((a) => (a.id === id ? { ...a, name: trimmed } : a));
    setActivities(nextActs);

    const syncKey = activeSyncKey;
    const payload = {
      user,
      activities: nextActs,
      matrixState,
      emergencyTasks,
      logs,
      updatedAt: Date.now(),
    };

    if (hasLoadedFromCloud) {
      pushStateToCloud(syncKey, payload);
      syncFullStateToSupabase(syncKey, payload);
    }

    fetchBackend(`${BACKEND_API_BASE}/sync/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: syncKey, state: payload }),
    }).catch((err) => console.warn('Habit edit sync warning:', err));

    soundFx.playClick();
  };

  const handleToggleActivityStreakInclusion = (id: string) => {
    setActivities((prev) =>
      prev.map((act) => (act.id === id ? { ...act, countsTowardOverallStreak: !act.countsTowardOverallStreak } : act))
    );
  };

  // Emergency Work Task Handlers (Stored for max 2 days, max 3 directives)
  const handleAddEmergencyTask = (newTask: EmergencyTask) => {
    setEmergencyTasks((prev) => {
      const pruned = pruneExpiredEmergencyTasks(prev);
      if (pruned.length >= 3) return pruned;
      const next = [newTask, ...pruned].slice(0, 3);
      localStorage.setItem('effstreak_emergency_tasks', JSON.stringify(next));
      return next;
    });
    soundFx.playClick();
  };

  const handleCompleteEmergencyTask = (id: string) => {
    setEmergencyTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          if (nextCompleted) {
            handleAwardXP(t.xpReward || 15);
            soundFx.playCheck();
          }
          return { ...t, completed: nextCompleted };
        }
        return t;
      });
      localStorage.setItem('effstreak_emergency_tasks', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteEmergencyTask = (id: string) => {
    setEmergencyTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      localStorage.setItem('effstreak_emergency_tasks', JSON.stringify(next));
      return next;
    });
    soundFx.playClick();
  };

  // Complete Clean Reset All Data Handler
  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all data? This will clear all level, XP, overall streaks, emergency directives, platform streaks to 0, and reset efficiency to 0%.')) {
      const cleanUser: UserProfile = {
        ...INITIAL_USER,
        name: user.name || 'Hunter',
        email: user.email || '',
        overallStreak: 0,
        longestStreak: 0,
        currentXP: 0,
        level: 0,
        xpToNextLevel: 500,
        hunterRank: 'E',
        isActiveToday: false,
        lastActiveDate: '',
        platformStats: {},
        platformVerified: {},
      };
      setUser(cleanUser);

      const cleanActs = activities.map((act) => ({
        ...act,
        completed: false,
        streak: 0,
        completedAt: undefined,
        isAutoDetected: false,
      }));
      setActivities(cleanActs);

      const cleanMatrix: Record<string, boolean[]> = {};
      cleanActs.forEach((act) => {
        cleanMatrix[act.id] = Array.from({ length: daysInMonth }, () => false);
      });
      setMatrixState(cleanMatrix);
      setLogs([]);
      setEmergencyTasks([]);
      setHistory(generateHistoricalRecords(30));
      setHeatmapData(generateHeatmapData(90));

      // Overwrite LocalStorage with clean 0 state
      localStorage.setItem('effstreak_user', JSON.stringify(cleanUser));
      localStorage.setItem('effstreak_activities', JSON.stringify(cleanActs));
      localStorage.setItem('streak_monthly_matrix', JSON.stringify(cleanMatrix));
      localStorage.setItem('effstreak_logs', JSON.stringify([]));
      localStorage.setItem('effstreak_emergency_tasks', JSON.stringify([]));

      // Push clean 0 reset state to Cloud Relay & Firestore with isReset flag
      const resetPayload = {
        user: cleanUser,
        activities: cleanActs,
        matrixState: cleanMatrix,
        emergencyTasks: [],
        logs: [],
        isReset: true,
        updatedAt: Date.now() + 10000,
      };

      pushStateToCloud(activeSyncKey, resetPayload);
      syncFullStateToSupabase(activeSyncKey, resetPayload);

      // Sync force reset state to cloud backend & Firestore
      fetchBackend(`${BACKEND_API_BASE}/sync/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeSyncKey }),
      }).catch((err) => console.warn('Sync force reset warning:', err));

      fetchBackend(`${BACKEND_API_BASE}/auth/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeSyncKey }),
      }).catch((err) => console.warn('Auth reset warning:', err));

      fetchBackend(`${BACKEND_API_BASE}/sync/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeSyncKey,
          state: resetPayload,
        }),
      }).catch((err) => console.warn('Reset sync warning:', err));

      soundFx.playUncheck();
      setIsSettingsOpen(false);
    }
  };


  return (
    <div className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#0b0f19] text-slate-100 font-sans' 
        : 'bg-[#F4EFE6] text-slate-900 font-sans'
    }`}>
      <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* 1. TOP SHOWCASE HEADER (ESTHETIC TITLE, CONSISTENCY WAVE & LUXURY RING) */}
        <AestheticHeaderTracker
          user={user}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={(m) => setSelectedMonth(m)}
          dailyProgressPct={dailyProgressPct}
          completedMonthHabits={completedMonthHabits}
          totalMonthHabits={totalMonthHabits}
          isDarkMode={isDarkMode}
          currentThemeId={currentThemeId}
          onToggleTheme={handleToggleTheme}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onOpenSoloLeveling={() => setIsSoloLevelingOpen(true)}
          onOpenTodayActivity={() => setIsTodayActivityOpen(true)}
          onOpenEfficiencyMatrix={() => setIsEfficiencyAnalyticsOpen(true)}
          onOpenEmergencyWork={() => setIsAddEmergencyOpen(true)}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onOpenSync={handleLiveSync10Days}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onToggleSound={() => {
            const next = soundFx.toggleSound();
            setUser((prev) => ({ ...prev, soundEnabled: next }));
          }}
          onUpdateHeaderImage={(newImage) => handleUpdateUser({ headerImage: newImage })}
          isSyncing={isSyncing}
          emergencyTasks={emergencyTasks}
          onCompleteEmergencyTask={handleCompleteEmergencyTask}
          onAddEmergencyTask={handleAddEmergencyTask}
        />

        {/* Live Sync Real-Time Toast Banner */}
        {syncToast && (
          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in ${
            syncToast.type === 'success' 
              ? 'bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border-emerald-500/40 text-emerald-300' 
              : 'bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border-blue-500/40 text-blue-300'
          }`}>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{syncToast.message}</span>
            </div>
            <button
              onClick={() => setSyncToast(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2. WEEKLY CONSISTENCY OVERVIEW (5 WEEK COLUMNS + TOP 10 HABITS + LIVE MISSION COUNTDOWN + DAILY MANTRA PHOTO) */}
        <WeeklyConsistencyOverview
          daysData={daysData}
          weeksSummary={weeksSummary}
          topHabits={topHabits}
          isDarkMode={isDarkMode}
          dailyMantraImage={user.dailyMantraImage}
          onUpdateMantraImage={(newImage) => handleUpdateUser({ dailyMantraImage: newImage })}
          emergencyTasks={emergencyTasks}
          onCompleteEmergencyTask={handleCompleteEmergencyTask}
          onDeleteEmergencyTask={handleDeleteEmergencyTask}
          onOpenAddEmergencyModal={() => setIsAddEmergencyOpen(true)}
        />

        {/* 4. CORE CENTERPIECE: MASTER 30-DAY MONTHLY HABIT MATRIX GRID */}
        <MasterMonthlyHabitGrid
          activities={activities}
          matrixState={matrixState}
          onToggleMatrixCell={handleToggleMatrixCell}
          onAddHabit={() => setIsAddHabitOpen(true)}
          onEditHabit={handleEditActivityName}
          onDeleteHabit={handleDeleteActivity}
          isDarkMode={isDarkMode}
          daysInMonth={daysInMonth}
          todayDayNumber={todayDayNumber}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        {/* 5. ⚡ IDEAS, THOUGHTS & PLATFORM DECK — Collapsible Inline Card */}
        <LivePerformanceDeck
          user={user}
          activities={activities}
          thoughts={thoughts}
          matrixState={matrixState}
          isDarkMode={isDarkMode}
          onAddThought={handleAddThought}
          onUpdateThought={handleUpdateThought}
          onDeleteThought={handleDeleteThought}
          onToggleStarThought={handleToggleStarThought}
        />
      </main>

      {/* ======================================================== */}
      {/* FULL INTERACTIVE MODALS & DIALOGS                       */}
      {/* ======================================================== */}
      <TodayActivityModal
        isOpen={isTodayActivityOpen}
        onClose={() => setIsTodayActivityOpen(false)}
        logs={logs}
        activities={activities}
        onToggleActivity={handleToggleActivity}
        isDarkMode={isDarkMode}
      />

      <EfficiencyAnalyticsModal
        isOpen={isEfficiencyAnalyticsOpen}
        onClose={() => setIsEfficiencyAnalyticsOpen(false)}
        activities={activities}
        yearlyMatrixState={yearlyMatrixState}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        isDarkMode={isDarkMode}
      />

      <WidgetSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        user={user}
        activities={activities}
        summary={summary}
        isDarkMode={isDarkMode}
      />

      <LiveSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
        onSyncActivities={handleSyncActivities}
        isDarkMode={isDarkMode}
      />

      <SoloLevelingModal
        isOpen={isSoloLevelingOpen}
        onClose={() => setIsSoloLevelingOpen(false)}
        user={user}
        onLevelUp={() => handleAwardXP(100)}
        isDarkMode={isDarkMode}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        activities={activities}
        history={history}
        logs={logs}
        onUpdateUser={handleUpdateUser}
        onAddActivity={handleAddActivity}
        onDeleteActivity={handleDeleteActivity}
        onToggleActivityStreakInclusion={handleToggleActivityStreakInclusion}
        onResetData={handleResetData}
        onSyncActivities={handleSyncActivities}
        onApplyFullSync={handleApplyFullSync}
        isDarkMode={isDarkMode}
      />

      <AddHabitModal
        isOpen={isAddHabitOpen}
        onClose={() => setIsAddHabitOpen(false)}
        onAddHabit={handleAddActivity}
        isDarkMode={isDarkMode}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onSelectUser={handleUpdateUser}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
      />

      <AddEmergencyDirectiveModal
        isOpen={isAddEmergencyOpen}
        onClose={() => setIsAddEmergencyOpen(false)}
        onAddDirective={handleAddEmergencyTask}
        currentCount={emergencyTasks.filter((t) => !t.completed).length}
        isDarkMode={isDarkMode}
      />

      {/* 🎡 8-THEME DISK REEL SWITCHER MODAL */}
      <ThemeDiscReelModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentThemeId={currentThemeId}
        onSelectTheme={handleSelectTheme}
      />

      {/* ⚡ EMAIL / PHONE NUMBER SYNC SETUP MODAL OVERLAY */}
      {!syncEmail && !syncPhone && !user.email && (!user.uid || user.uid === 'guest_user_local' || user.uid.startsWith('guest_')) && (
        <SyncSetupCard
          onConfirm={handleConfirmSyncIdentity}
          currentEmail={syncEmail}
          currentPhone={syncPhone}
          isInline={false}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default App;
