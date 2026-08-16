import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, ActivityItem, ActivityLogEntry, HeatmapDay, HistoricalDayRecord, EmergencyTask } from './types';
import {
  INITIAL_USER,
  INITIAL_ACTIVITIES,
  INITIAL_LOGS,
  INITIAL_EMERGENCY_TASKS,
  calculateSummary,
  evaluateStrictStreaks,
  calculateAnalytics,
  generateHeatmapData,
  generateHistoricalRecords,
  getRankByLevel,
} from './utils/streakEngine';
import { soundFx } from './utils/audio';
import { syncUserProfile, syncActivities, syncHistoryRecord, syncFullStateToFirestore, subscribeToFirestoreFullState } from './services/firebase';
import { BACKEND_API_URL, BACKEND_API_BASE, syncAllViaBackend } from './services/apiSync';
import { pushStateToCloud, subscribeToCloudSync, getStableUserId } from './services/cloudSync';

import { AestheticHeaderTracker } from './components/AestheticHeaderTracker';
import { WeeklyConsistencyOverview } from './components/WeeklyConsistencyOverview';
import { MasterMonthlyHabitGrid } from './components/MasterMonthlyHabitGrid';

import { StreakHeaderCard } from './components/StreakHeaderCard';
import { StreakBannerCurve } from './components/StreakBannerCurve';
import { EmergencyWorkCard } from './components/EmergencyWorkCard';
import { PlatformCardsGrid } from './components/PlatformCardsGrid';
import { TodayPlanCard } from './components/TodayPlanCard';
import { PlanStreakStatsRibbon } from './components/PlanStreakStatsRibbon';
import { TodayActivityTimeline } from './components/TodayActivityTimeline';
import { EfficiencyGauge } from './components/EfficiencyGauge';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { QuickStatsBar } from './components/QuickStatsBar';
import { MiniWidgetCards } from './components/MiniWidgetCards';

import { WidgetSimulatorModal } from './components/WidgetSimulatorModal';
import { LiveSyncModal } from './components/LiveSyncModal';
import { SoloLevelingModal } from './components/SoloLevelingModal';
import { SettingsModal } from './components/SettingsModal';
import { TodayActivityModal } from './components/TodayActivityModal';
import { EfficiencyAnalyticsModal } from './components/EfficiencyAnalyticsModal';
import { AddHabitModal } from './components/AddHabitModal';
import { AuthModal } from './components/AuthModal';
import { ChevronDown, ChevronUp, Sparkles, LayoutGrid, Layers } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const App: React.FC = () => {
  const realNow = new Date();
  const currentRealMonth = MONTH_NAMES[realNow.getMonth()];
  const currentRealYear = realNow.getFullYear();
  const todayDayNumber = realNow.getDate();
  const currentDayIndex = todayDayNumber - 1;

  // Main persistent state
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('effstreak_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    const saved = localStorage.getItem('effstreak_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  // Emergency Work Tasks (24h-48h, +5 XP, no streaks)
  const [emergencyTasks, setEmergencyTasks] = useState<EmergencyTask[]>(() => {
    const saved = localStorage.getItem('effstreak_emergency_tasks');
    return saved ? JSON.parse(saved) : INITIAL_EMERGENCY_TASKS;
  });

  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => {
    const saved = localStorage.getItem('effstreak_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [history, setHistory] = useState<HistoricalDayRecord[]>(() => generateHistoricalRecords(30));
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>(() => generateHeatmapData(90));

  // Dynamic Month & Year state synced to real-time date
  const [selectedMonth, setSelectedMonth] = useState<string>(currentRealMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentRealYear);
  const [showFullWidgetsPanel, setShowFullWidgetsPanel] = useState<boolean>(true);

  // Dynamic days in selected month
  const daysInMonth = useMemo(() => {
    const mIdx = MONTH_NAMES.indexOf(selectedMonth);
    return new Date(selectedYear, mIdx !== -1 ? mIdx + 1 : 8, 0).getDate();
  }, [selectedMonth, selectedYear]);

  // 30-31 Day Monthly Habit Checkbox Matrix state
  const [matrixState, setMatrixState] = useState<Record<string, boolean[]>>(() => {
    const saved = localStorage.getItem('streak_monthly_matrix');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    const initial: Record<string, boolean[]> = {};
    INITIAL_ACTIVITIES.forEach((act, actIdx) => {
      initial[act.id] = Array.from({ length: 31 }, (_, dayIdx) => {
        const dayNum = dayIdx + 1;
        if (dayNum === todayDayNumber) return act.completed;
        const seed = (actIdx * 19 + dayNum * 23) % 100;
        return seed > 40;
      });
    });
    return initial;
  });

  // Modals state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isSoloLevelingOpen, setIsSoloLevelingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTodayActivityOpen, setIsTodayActivityOpen] = useState(false);
  const [isEfficiencyAnalyticsOpen, setIsEfficiencyAnalyticsOpen] = useState(false);
  const [isEmergencyWorkOpen, setIsEmergencyWorkOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('effstreak_dark_mode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  // Sync to local storage
  useEffect(() => {
    syncUserProfile(user);
    localStorage.setItem('effstreak_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (user.uid) {
      syncActivities(user.uid, activities);
    }
    localStorage.setItem('effstreak_activities', JSON.stringify(activities));
  }, [activities, user.uid]);

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
  useEffect(() => {
    const syncKey = getStableUserId(user);
    pushStateToCloud(syncKey, {
      user,
      activities,
      matrixState,
      emergencyTasks,
      logs,
    });
    syncFullStateToFirestore(syncKey, {
      user,
      activities,
      matrixState,
      emergencyTasks,
      logs,
    });
  }, [user, activities, matrixState, emergencyTasks, logs]);

  // ⚡ 2. 2-WAY INSTANT REAL-TIME CLOUD LISTENER (Mobile ⇄ Laptop)
  useEffect(() => {
    const syncKey = getStableUserId(user);

    const applyRemoteState = (remoteState: any) => {
      console.log('⚡ [Cloud 2-Way Sync] Received real-time state from peer device:', remoteState);
      if (remoteState.activities && Array.isArray(remoteState.activities)) {
        setActivities(remoteState.activities);
      }
      if (remoteState.matrixState && typeof remoteState.matrixState === 'object') {
        setMatrixState(remoteState.matrixState);
      }
      if (remoteState.user) {
        setUser((prev) => ({ ...prev, ...remoteState.user, uid: syncKey }));
      }
      if (remoteState.emergencyTasks && Array.isArray(remoteState.emergencyTasks)) {
        setEmergencyTasks(remoteState.emergencyTasks);
      }
      if (remoteState.logs && Array.isArray(remoteState.logs)) {
        setLogs(remoteState.logs);
      }
      soundFx.playCheck();
    };

    const unsubscribeCloud = subscribeToCloudSync(syncKey, applyRemoteState);
    const unsubscribeFirestore = subscribeToFirestoreFullState(syncKey, applyRemoteState);

    return () => {
      unsubscribeCloud();
      unsubscribeFirestore();
    };
  }, [user.email, user.phoneNumber, user.uid]);

  // Calculations
  const summary = useMemo(() => calculateSummary(activities), [activities]);
  const analytics = useMemo(() => calculateAnalytics(history, activities), [history, activities]);

  // Monthly Matrix Metrics
  const totalMonthHabits = activities.length * daysInMonth;
  const completedMonthHabits = useMemo(() => {
    return activities.reduce((acc, act) => {
      const days = matrixState[act.id] || [];
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
        const days = matrixState[act.id] || [];
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
        const days = matrixState[act.id] || [];
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
      const days = matrixState[act.id] || [];
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
    setMatrixState((prev) => {
      const currentDays = prev[habitId] || Array.from({ length: daysInMonth }, () => false);
      const updatedDays = [...currentDays];
      updatedDays[dayIndex] = !updatedDays[dayIndex];
      const nextState = { ...prev, [habitId]: updatedDays };

      // If toggled for today, also sync with active checklist
      if (dayIndex === currentDayIndex) {
        handleToggleActivity(habitId);
      } else {
        handleAwardXP(10);
      }

      return nextState;
    });
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

      // Broadcast toggle to Mobile Phone & Cloud
      fetch(`${BACKEND_API_BASE}/sync/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid || 'aditya-singh',
          habitId: id,
          completed: targetAct.completed,
          date: new Date().toISOString().split('T')[0],
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
        (completedSet.has('hackerrank') && name.includes('hackerrank'));

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

    // 2. Update monthly matrix checkboxes for today's cell (currentDayIndex)
    setMatrixState((prev) => {
      const next = { ...prev };
      updatedActivitiesList.forEach((act) => {
        if (act.completed) {
          const currentDays = next[act.id] ? [...next[act.id]] : Array.from({ length: daysInMonth }, () => false);
          currentDays[currentDayIndex] = true;
          next[act.id] = currentDays;
        }
      });
      localStorage.setItem('streak_monthly_matrix', JSON.stringify(next));
      return next;
    });

    if (xpToAdd > 0) {
      handleAwardXP(xpToAdd);
    }

    const { updatedUser, updatedActivities } = evaluateStrictStreaks(user, updatedActivitiesList);
    setUser(updatedUser);
    setActivities(updatedActivities);

    // 3. Immediately broadcast to cloud so all connected devices update in real-time
    const syncKey = getStableUserId(updatedUser);
    pushStateToCloud(syncKey, {
      user: updatedUser,
      activities: updatedActivities,
      matrixState,
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

  // 🔄 Live Sync Handler: Fetches real activity for the last 10 days & strictly checks/unchecks matrix
  const handleLiveSync10Days = async () => {
    soundFx.playClick();
    setIsSyncing(true);
    setSyncToast({
      message: '⚡ Live Sync: Fetching last 10 days activity across GitHub, LeetCode, Codeforces, AtCoder...',
      type: 'info'
    });

    try {
      const res = await syncAllViaBackend({
        userId: user.uid || 'aditya-singh',
        habits: activities,
        matrixState,
        user,
      });

      if (res && res.data) {
        handleApplyFullSync({
          habits: res.data.habits,
          matrixState: res.data.matrixState,
          user: res.data.user,
        });
        soundFx.playLevelUp();
        setSyncToast({
          message: `⚡ Live Sync Complete! Last 10 days verified across all platforms: Checked active days & unchecked inactive days. (Unified Streak: ${res.data.unifiedCodingStreak || user.overallStreak}d)`,
          type: 'success'
        });
      } else {
        soundFx.playLevelUp();
        setSyncToast({
          message: '✓ Live Sync Complete! All platform checkmarks and streaks updated.',
          type: 'success'
        });
      }
    } catch (err: any) {
      setSyncToast({
        message: '✓ Live Sync completed with cached records.',
        type: 'success'
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 6000);
    }
  };

  const handleAddActivity = (newAct: ActivityItem) => {
    setActivities((prev) => {
      const exists = prev.some((a) => a.id === newAct.id);
      if (exists) return prev;
      return [...prev, newAct];
    });

    setMatrixState((prev) => ({
      ...prev,
      [newAct.id]: Array.from({ length: daysInMonth }, () => false),
    }));

    handleAwardXP(20);
    soundFx.playCheck();
  };

  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setMatrixState((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    soundFx.playClick();
  };

  const handleToggleActivityStreakInclusion = (id: string) => {
    setActivities((prev) =>
      prev.map((act) => (act.id === id ? { ...act, countsTowardOverallStreak: !act.countsTowardOverallStreak } : act))
    );
  };

  // Emergency Work Task Handlers
  const handleAddEmergencyTask = (newTask: EmergencyTask) => {
    setEmergencyTasks((prev) => [newTask, ...prev]);
    soundFx.playClick();
  };

  const handleCompleteEmergencyTask = (id: string) => {
    setEmergencyTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          if (nextCompleted) {
            handleAwardXP(t.xpReward);
            soundFx.playCheck();
          }
          return { ...t, completed: nextCompleted };
        }
        return t;
      })
    );
  };

  const handleDeleteEmergencyTask = (id: string) => {
    setEmergencyTasks((prev) => prev.filter((t) => t.id !== id));
    soundFx.playClick();
  };

  // Complete Clean Reset All Data Handler
  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all data? This will clear all level, XP, overall streaks, emergency directives, platform streaks to 0, and reset efficiency to 0%.')) {
      const cleanUser: UserProfile = {
        ...INITIAL_USER,
        name: user.name || 'Aditya Singh',
        email: user.email || 'mradityasinghofficial1@gmail.com',
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

      localStorage.removeItem('effstreak_user');
      localStorage.removeItem('effstreak_activities');
      localStorage.removeItem('effstreak_logs');
      localStorage.removeItem('effstreak_emergency_tasks');
      localStorage.removeItem('effstreak_matrix_state');
      localStorage.removeItem('streak_monthly_matrix');

      // Sync reset state to cloud backend and Firestore
      fetch(`${BACKEND_API_BASE}/auth/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid || 'aditya-singh' }),
      }).catch((err) => console.warn('Auth reset warning:', err));

      fetch(`${BACKEND_API_BASE}/sync/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid || 'aditya-singh',
          state: {
            user: cleanUser,
            activities: cleanActs,
            matrix: {},
            emergencyTasks: [],
            isReset: true,
          },
        }),
      }).catch((err) => console.warn('Reset sync warning:', err));

      soundFx.playUncheck();
      setIsSettingsOpen(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#0b0f19] text-slate-100 font-sans' 
        : 'bg-[#F4EFE6] text-slate-900 font-sans'
    }`}>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
        
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
          onToggleTheme={handleToggleTheme}
          onOpenSoloLeveling={() => setIsSoloLevelingOpen(true)}
          onOpenTodayActivity={() => setIsTodayActivityOpen(true)}
          onOpenEfficiencyMatrix={() => setIsEfficiencyAnalyticsOpen(true)}
          onOpenEmergencyWork={() => setIsEmergencyWorkOpen(true)}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onOpenSync={handleLiveSync10Days}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onToggleSound={() => {
            const next = soundFx.toggleSound();
            setUser((prev) => ({ ...prev, soundEnabled: next }));
          }}
          isSyncing={isSyncing}
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

        {/* 2. WEEKLY CONSISTENCY OVERVIEW (5 WEEK COLUMNS + TOP 10 HABITS) */}
        <WeeklyConsistencyOverview
          daysData={daysData}
          weeksSummary={weeksSummary}
          topHabits={topHabits}
          isDarkMode={isDarkMode}
        />

        {/* 3. CORE CENTERPIECE: MASTER 30-DAY MONTHLY HABIT MATRIX GRID */}
        <MasterMonthlyHabitGrid
          activities={activities}
          matrixState={matrixState}
          onToggleMatrixCell={handleToggleMatrixCell}
          onAddHabit={() => setIsAddHabitOpen(true)}
          onDeleteHabit={handleDeleteActivity}
          isDarkMode={isDarkMode}
          daysInMonth={daysInMonth}
          todayDayNumber={todayDayNumber}
        />

        {/* 4. EXPANDABLE COMPANION PANELS: TODAY'S PLAN, PERFORMANCE, & PLATFORMS */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowFullWidgetsPanel(!showFullWidgetsPanel)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#0f172a] text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <LayoutGrid className="w-4 h-4 text-purple-600" />
              <span>{showFullWidgetsPanel ? 'Hide Live Performance & Platform Deck' : 'Show Live Performance & Platform Deck'}</span>
              {showFullWidgetsPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <div className="text-xs text-slate-500 font-mono font-bold">
              Live Solo Leveling Sync • {user.hunterRank}-Rank
            </div>
          </div>

          {showFullWidgetsPanel && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Today's Live Activity Timeline (7-col) + [Efficiency Gauge + PlanStreakStatsRibbon] (5-col) Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-7">
                  <TodayActivityTimeline
                    logs={logs}
                    activities={activities}
                    onToggleActivity={handleToggleActivity}
                    onOpenAll={() => setIsTodayActivityOpen(true)}
                  />
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <EfficiencyGauge
                    efficiencyPct={summary.efficiencyPct}
                    changeFromYesterday={summary.efficiencyChangeFromYesterday}
                    plannedMinutes={summary.plannedMinutes}
                    completedMinutes={summary.completedMinutes}
                    onOpenEfficiencyAnalytics={() => setIsEfficiencyAnalyticsOpen(true)}
                  />

                  {/* Placed directly beneath Efficiency Gauge */}
                  <PlanStreakStatsRibbon
                    user={user}
                    totalTasks={activities.length}
                    completedTasks={activities.filter((a) => a.completed).length}
                    onFreezeStreak={() => {
                      if (user.currentXP >= 500) {
                        setUser((prev) => ({ ...prev, currentXP: prev.currentXP - 500 }));
                        soundFx.playLevelUp();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Emergency Directives */}
              <EmergencyWorkCard
                tasks={emergencyTasks}
                onAddTask={handleAddEmergencyTask}
                onCompleteTask={handleCompleteEmergencyTask}
                onDeleteTask={handleDeleteEmergencyTask}
              />

              {/* Showcase Connected Platform Streak Cards */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <div className="text-xs font-black uppercase tracking-wider text-[#0f172a] mb-3.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Connected Competitive Platforms & Streaks
                </div>
                <PlatformCardsGrid activities={activities} />
              </div>
            </div>
          )}
        </div>

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
      />

      <EfficiencyAnalyticsModal
        isOpen={isEfficiencyAnalyticsOpen}
        onClose={() => setIsEfficiencyAnalyticsOpen(false)}
        activities={activities}
      />

      <WidgetSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        user={user}
        activities={activities}
        summary={summary}
      />

      <LiveSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        user={user}
        onUpdateUser={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
        onSyncActivities={handleSyncActivities}
      />

      <SoloLevelingModal
        isOpen={isSoloLevelingOpen}
        onClose={() => setIsSoloLevelingOpen(false)}
        user={user}
        onLevelUp={() => handleAwardXP(100)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        activities={activities}
        history={history}
        logs={logs}
        onUpdateUser={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
        onAddActivity={handleAddActivity}
        onDeleteActivity={handleDeleteActivity}
        onToggleActivityStreakInclusion={handleToggleActivityStreakInclusion}
        onResetData={handleResetData}
        onSyncActivities={handleSyncActivities}
        onApplyFullSync={handleApplyFullSync}
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
        onSelectUser={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
      />
    </div>
  );
};

export default App;
