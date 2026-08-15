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
import { syncUserProfile, syncActivities, syncHistoryRecord } from './services/firebase';
import { BACKEND_API_URL, BACKEND_API_BASE } from './services/apiSync';

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
import { AuthModal } from './components/AuthModal';
import { DesktopFloatingWidget } from './components/DesktopFloatingWidget';
import { ChevronDown, ChevronUp, Sparkles, LayoutGrid, Layers } from 'lucide-react';

export const App: React.FC = () => {
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

  // Month & Year state
  const [selectedMonth, setSelectedMonth] = useState<string>('June');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [showFullWidgetsPanel, setShowFullWidgetsPanel] = useState<boolean>(true);

  // 30-Day Monthly Habit Checkbox Matrix state
  const [matrixState, setMatrixState] = useState<Record<string, boolean[]>>(() => {
    const saved = localStorage.getItem('streak_monthly_matrix');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    // Seed matrix realistically
    const initial: Record<string, boolean[]> = {};
    INITIAL_ACTIVITIES.forEach((act, actIdx) => {
      initial[act.id] = Array.from({ length: 30 }, (_, dayIdx) => {
        const dayNum = dayIdx + 1;
        if (dayNum === 15) return act.completed;
        const seed = (actIdx * 19 + dayNum * 23) % 100;
        return seed > 35;
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

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // Enforce pure light mode by default
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

  // ⚡ 2-WAY INSTANT REAL-TIME SYNC LISTENER (Mobile ⇄ Laptop)
  useEffect(() => {
    const userId = user.uid || 'local_user_1';
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`${BACKEND_API_BASE}/sync/events?userId=${userId}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'HABIT_TOGGLED') {
            const { habitId, completed } = data;
            console.log('⚡ [Live SSE] Received habit toggle from Mobile:', habitId, completed);
            
            // 1. Update activity checklist state
            setActivities((prev) =>
              prev.map((act) => {
                if (act.id === habitId) {
                  return {
                    ...act,
                    completed: completed ?? !act.completed,
                    streak: completed ? act.streak + 1 : Math.max(0, act.streak - 1),
                  };
                }
                return act;
              })
            );

            // 2. Update today's cell (Day 15) in 30-day matrix
            setMatrixState((prev) => {
              const currentDays = prev[habitId] || Array.from({ length: 30 }, () => false);
              const updatedDays = [...currentDays];
              updatedDays[14] = completed;
              return { ...prev, [habitId]: updatedDays };
            });

            // 3. Play audio effect
            if (completed) {
              soundFx.playCheck();
            }
          } else if (data.type === 'STATE_UPDATED' || data.type === 'INIT_STATE') {
            if (data.state?.user) {
              setUser((prev) => ({
                ...prev,
                currentXP: data.state.user.currentXP ?? prev.currentXP,
                level: data.state.user.level ?? prev.level,
                overallStreak: data.state.user.overallStreak ?? prev.overallStreak,
              }));
            }
          }
        } catch (err) {
          console.warn('SSE message parsing error:', err);
        }
      };

      eventSource.onerror = () => {
        // Auto-reconnect managed by browser EventSource
      };
    } catch (err) {
      console.warn('EventSource initialization error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user.uid]);

  // Derived calculations
  const summary = calculateSummary(activities);

  // Computed matrix metrics (Weekly & Monthly)
  const daysInMonth = 30;

  const totalPossibleMonthHabits = activities.length * daysInMonth;
  const completedMonthHabits = useMemo(() => {
    return activities.reduce((acc, act) => {
      const days = matrixState[act.id] || [];
      return acc + days.filter(Boolean).length;
    }, 0);
  }, [activities, matrixState]);

  const dailyProgressPct = totalPossibleMonthHabits > 0 
    ? (completedMonthHabits / totalPossibleMonthHabits) * 100 
    : 55.71;

  // 30 Daily columns data for bar charts
  const daysData = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, dayIdx) => {
      const day = dayIdx + 1;
      let completedOnDay = 0;
      activities.forEach((act) => {
        const days = matrixState[act.id] || [];
        if (days[dayIdx]) completedOnDay++;
      });
      const total = activities.length || 1;
      const percentage = Math.round((completedOnDay / total) * 100);

      // Week Index: 1 (1-7), 2 (8-14), 3 (15-21), 4 (22-28), 5 (29-30)
      const weekIndex = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : day <= 28 ? 4 : 5;

      return {
        day,
        percentage,
        count: completedOnDay,
        total,
        weekIndex,
      };
    });
  }, [activities, matrixState]);

  // 5 Weekly Circular Efficiency Summaries
  const weeksSummary = useMemo(() => {
    const weekConfigs = [
      { week: 1, start: 1, end: 7, color: '#3B82F6', borderColor: 'border-blue-400', bgLight: 'bg-blue-50' },
      { week: 2, start: 8, end: 14, color: '#EC4899', borderColor: 'border-pink-400', bgLight: 'bg-pink-50' },
      { week: 3, start: 15, end: 21, color: '#14B8A6', borderColor: 'border-teal-400', bgLight: 'bg-teal-50' },
      { week: 4, start: 22, end: 28, color: '#F59E0B', borderColor: 'border-amber-400', bgLight: 'bg-amber-50' },
      { week: 5, start: 29, end: 30, color: '#A855F7', borderColor: 'border-purple-400', bgLight: 'bg-purple-50' },
    ];

    return weekConfigs.map((cfg) => {
      let completed = 0;
      let total = 0;
      for (let d = cfg.start; d <= cfg.end; d++) {
        activities.forEach((act) => {
          total++;
          const days = matrixState[act.id] || [];
          if (days[d - 1]) completed++;
        });
      }
      const efficiency = total > 0 ? (completed / total) * 100 : 0;
      return {
        week: cfg.week,
        efficiency,
        color: cfg.color,
        borderColor: cfg.borderColor,
        bgLight: cfg.bgLight,
      };
    });
  }, [activities, matrixState]);

  // Top 10 Habits Ranking
  const topHabits = useMemo(() => {
    const list = activities.map((act) => {
      const days = matrixState[act.id] || [];
      const done = days.filter(Boolean).length;
      const progressPct = (done / daysInMonth) * 100;
      return {
        name: act.name,
        progressPct,
        streak: act.streak,
      };
    });

    list.sort((a, b) => b.progressPct - a.progressPct);

    return list.map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));
  }, [activities, matrixState]);

  // Toggle single cell in the 30-day master matrix
  const handleToggleMatrixCell = (habitId: string, dayIndex: number) => {
    setMatrixState((prev) => {
      const currentDays = prev[habitId] || Array.from({ length: daysInMonth }, () => false);
      const updatedDays = [...currentDays];
      updatedDays[dayIndex] = !updatedDays[dayIndex];
      const nextState = { ...prev, [habitId]: updatedDays };

      // If toggled for today (Day 15), also sync with active task status
      if (dayIndex === 14) {
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

    // ⚡ Broadcast Laptop Click to Mobile Phone
    const targetAct = updatedActivitiesList.find((a) => a.id === id);
    if (targetAct) {
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
    setLogs((prev) => [
      {
        id: Date.now().toString(),
        activityId,
        activityName,
        category,
        timeStr,
        timestamp: Date.now(),
        completed,
        source: 'manual',
      },
      ...prev.slice(0, 7),
    ]);
  };

  const handleSyncActivities = (updates: { id: string; completed: boolean }[]) => {
    const updatedActivitiesList = activities.map((act) => {
      const update = updates.find((u) => u.id === act.id);
      if (update && !act.completed && update.completed) {
        handleAwardXP(act.xpReward);
        addLogEntry(act.id, act.name, act.category, true);
        return {
          ...act,
          completed: true,
          isAutoDetected: true,
          streak: act.streak + 1,
          completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return act;
    });

    const { updatedUser, updatedActivities } = evaluateStrictStreaks(user, updatedActivitiesList);
    setUser(updatedUser);
    setActivities(updatedActivities);
  };

  const handleToggleActivityStreakInclusion = (id: string) => {
    setActivities((prev) =>
      prev.map((act) => (act.id === id ? { ...act, countsTowardOverallStreak: !act.countsTowardOverallStreak } : act))
    );
  };

  // Emergency Work Task Handlers
  const handleAddEmergencyTask = (newTask: EmergencyTask) => {
    const updated = [newTask, ...emergencyTasks];
    setEmergencyTasks(updated);
    localStorage.setItem('effstreak_emergency_tasks', JSON.stringify(updated));
  };

  const handleCompleteEmergencyTask = (id: string) => {
    handleAwardXP(5);
    const updated = emergencyTasks.filter((t) => t.id !== id);
    setEmergencyTasks(updated);
    localStorage.setItem('effstreak_emergency_tasks', JSON.stringify(updated));
  };

  const handleDeleteEmergencyTask = (id: string) => {
    const updated = emergencyTasks.filter((t) => t.id !== id);
    setEmergencyTasks(updated);
    localStorage.setItem('effstreak_emergency_tasks', JSON.stringify(updated));
  };

  const handleToggleSound = () => {
    setUser((prev) => {
      const nextVal = !prev.soundEnabled;
      soundFx.setEnabled(nextVal);
      return { ...prev, soundEnabled: nextVal };
    });
  };

  const handleResetData = () => {
    setUser(INITIAL_USER);
    setActivities(INITIAL_ACTIVITIES);
    setEmergencyTasks(INITIAL_EMERGENCY_TASKS);
    setLogs(INITIAL_LOGS);
    setHistory(generateHistoricalRecords(30));
    setHeatmapData(generateHeatmapData(90));
    localStorage.clear();
    setIsSettingsOpen(false);
  };

  // Standalone Desktop Widget Mode
  if (window.location.search.includes('mode=widget')) {
    return (
      <div className="w-screen h-screen bg-transparent p-1 overflow-hidden">
        <DesktopFloatingWidget
          user={user}
          activities={activities}
          onToggleActivity={handleToggleActivity}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans pb-16 transition-colors ${
      isDarkMode ? 'bg-[#0b0e14] text-slate-100' : 'bg-[#F4F1EA] text-slate-800'
    }`}>
      {/* ======================================================== */}
      {/* MASTER AESTHETIC LAPTOP DASHBOARD CONTAINER             */}
      {/* ======================================================== */}
      <main className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 pt-5 space-y-5 flex-1">
        
        {/* 1. TOP AESTHETIC CALLIGRAPHIC HEADER & MOUNTAIN WAVE */}
        <AestheticHeaderTracker
          user={user}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          dailyProgressPct={dailyProgressPct}
          completedMonthHabits={completedMonthHabits}
          totalMonthHabits={totalPossibleMonthHabits}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          onOpenSoloLeveling={() => setIsSoloLevelingOpen(true)}
          onOpenTodayActivity={() => setIsTodayActivityOpen(true)}
          onOpenEfficiencyMatrix={() => setIsEfficiencyAnalyticsOpen(true)}
          onOpenEmergencyWork={() => setIsEmergencyWorkOpen(true)}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onOpenSync={() => setIsSyncOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onToggleSound={handleToggleSound}
          isSyncing={isSyncing}
        />

        {/* 2. MIDDLE SECTION: WEEKS 1-5 BAR COLUMNS & TOP 10 HABITS TABLE */}
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
          onAddHabit={() => setIsSettingsOpen(true)}
          onDeleteHabit={(id) => {
            const updated = activities.filter((a) => a.id !== id);
            setActivities(updated);
          }}
          isDarkMode={isDarkMode}
          daysInMonth={daysInMonth}
        />

        {/* 4. EXPANDABLE COMPANION PANELS: TODAY'S ACTIVITY, EFFICIENCY & PLATFORMS */}
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
              {/* Today's Activity Timeline + Efficiency Gauge Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TodayActivityTimeline
                  logs={logs}
                  activities={activities}
                  onOpenAll={() => setIsTodayActivityOpen(true)}
                />

                <EfficiencyGauge
                  efficiencyPct={summary.efficiencyPct}
                  changeFromYesterday={summary.efficiencyChangeFromYesterday}
                  plannedMinutes={summary.plannedMinutes}
                  completedMinutes={summary.completedMinutes}
                  onOpenEfficiencyAnalytics={() => setIsEfficiencyAnalyticsOpen(true)}
                />
              </div>

              {/* 6 Showcase Platform Streak Cards */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <div className="text-xs font-black uppercase tracking-wider text-[#0f172a] mb-3.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Connected Competitive Platforms & Streaks
                </div>
                <PlatformCardsGrid activities={activities} />
              </div>

              {/* Emergency Directives & Plan Ribbon */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <EmergencyWorkCard
                  tasks={emergencyTasks}
                  onAddTask={handleAddEmergencyTask}
                  onCompleteTask={handleCompleteEmergencyTask}
                  onDeleteTask={handleDeleteEmergencyTask}
                />

                <PlanStreakStatsRibbon
                  user={user}
                  totalTasks={activities.length}
                  completedTasks={activities.filter((a) => a.completed).length}
                  onFreezeStreak={() => {
                    if (user.currentXP >= 500) {
                      setUser((prev) => ({ ...prev, currentXP: prev.currentXP - 500 }));
                    }
                  }}
                />
              </div>

              {/* Activity Heatmap Grid */}
              <ActivityHeatmap data={heatmapData} />

              {/* Bottom Quick Stats */}
              <QuickStatsBar summary={summary} user={user} />
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
        onAddActivity={(newAct) => setActivities((prev) => [...prev, newAct])}
        onDeleteActivity={(id) => setActivities((prev) => prev.filter((a) => a.id !== id))}
        onToggleActivityStreakInclusion={handleToggleActivityStreakInclusion}
        onResetData={handleResetData}
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

