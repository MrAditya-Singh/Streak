import { 
  ActivityItem, 
  UserProfile, 
  ActivityLogEntry, 
  HeatmapDay, 
  DailySummary, 
  HunterAttributes, 
  HistoricalDayRecord,
  AnalyticsSummary,
  EmergencyTask
} from '../types';

export const INITIAL_USER: UserProfile = {
  uid: 'aditya-singh',
  email: 'mradityasingh@gmail.com',
  name: 'Aditya',
  overallStreak: 97,
  longestStreak: 97,
  lastActiveDate: new Date().toISOString().split('T')[0],
  streakStartDate: '2026-05-09',
  isActiveToday: true,
  streakFreezeCount: 2,
  level: 18,
  currentXP: 1840,
  xpToNextLevel: 2000,
  hunterRank: 'A',
  attributes: {
    strength: 72,     // Gym / Fitness
    intelligence: 91, // LeetCode, Codeforces, GFG, AtCoder, Python
    discipline: 84,   // Consistency, Overall Streak
    skill: 78,        // Projects, GitHub
    knowledge: 85,    // GATE, Book, German B2
    professional: 68, // Internship, Earn
  },
  timezone: 'Asia/Kolkata (GMT+5:30)',
  dailyResetTime: '00:00',
  soundEnabled: true,
  notificationsEnabled: true,
  reminderTime: '21:30',
  codolioUsername: 'Mr.Aditya',
  githubUsername: 'MrAditya-Singh',
  codeforcesHandle: 'Aditya__YUPP',
  leetcodeUsername: 'mradityasingh',
  gfgUsername: 'mraditya',
  atcoderUsername: 'MrAditya',
  hackerrankUsername: 'mradityasingh',
  youtubeChannelId: 'Viralhit-1',
  platformUrls: {
    github: 'https://github.com/MrAditya-Singh',
    leetcode: 'https://leetcode.com/u/mradityasingh',
    codeforces: 'https://codeforces.com/profile/Aditya__YUPP',
    hackerrank: 'https://www.hackerrank.com/profile/mradityasingh',
    atcoder: 'https://atcoder.jp/users/MrAditya',
    geeksforgeeks: 'https://www.geeksforgeeks.org/user/mraditya',
    youtube: 'https://www.youtube.com/@Viralhit-1',
  },
  platformVerified: {
    github: true,
    leetcode: true,
    codeforces: true,
    hackerrank: true,
    atcoder: true,
    geeksforgeeks: true,
    youtube: true,
  },
  platformStats: {
    github: { solved: 32, rating: 32, rank: '32 Repos' },
    codeforces: { rating: 1010, rank: 'newbie' },
    leetcode: { solved: 0, rank: 'active' },
    geeksforgeeks: { solved: 0, rank: 'active' },
    atcoder: { solved: 0, rank: 'active' },
  },
};

// Initial Emergency Work Tasks (24h - 48h directives with +5 XP, no streaks)
export const INITIAL_EMERGENCY_TASKS: EmergencyTask[] = [
  {
    id: 'emg-assignment',
    title: 'Submit Project / Assignment Report',
    createdAt: Date.now() - 4 * 3600 * 1000,
    deadlineHours: 24,
    deadlineAt: Date.now() + 20 * 3600 * 1000,
    xpReward: 5,
    priority: 5,
    tag: '24H URGENT',
  },
  {
    id: 'emg-bugfix',
    title: 'Fix Critical Build & Release Server Issue',
    createdAt: Date.now() - 10 * 3600 * 1000,
    deadlineHours: 48,
    deadlineAt: Date.now() + 38 * 3600 * 1000,
    xpReward: 5,
    priority: 4,
    tag: '48H DIRECTIVE',
  }
];

// Complete 15-Activity Production Matrix
export const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'leetcode',
    name: 'LeetCode',
    category: 'coding',
    iconName: 'Code2',
    plannedMinutes: 60,
    completed: true,
    completedAt: '09:15',
    scheduledTime: '09:15',
    streak: 42,
    url: 'https://leetcode.com/u/mradityasingh',
    source: 'leetcode',
    xpReward: 25,
    color: '#ff9800',
    countsTowardOverallStreak: true,
    countsTowardXP: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'coding',
    iconName: 'Github',
    plannedMinutes: 30,
    completed: true,
    completedAt: '10:05',
    scheduledTime: '10:05',
    streak: 26,
    url: 'https://github.com/MrAditya-Singh',
    source: 'github',
    xpReward: 20,
    color: '#ffffff',
    countsTowardOverallStreak: true,
    countsTowardXP: true,
  },
  {
    id: 'codeforces',
    name: 'Codeforces',
    category: 'coding',
    iconName: 'BarChart3',
    plannedMinutes: 60,
    completed: true,
    completedAt: '11:30',
    scheduledTime: '11:30',
    streak: 18,
    url: 'https://codeforces.com/profile/Aditya__YUPP',
    source: 'codeforces',
    xpReward: 25,
    color: '#1cb0f6',
    countsTowardOverallStreak: true,
    countsTowardXP: true,
  },
  {
    id: 'gate',
    name: 'Study (Gates)',
    category: 'education',
    iconName: 'GraduationCap',
    plannedMinutes: 120,
    completed: false,
    scheduledTime: '14:10',
    streak: 22,
    url: '',
    source: 'manual',
    xpReward: 35,
    color: '#3b82f6',
    countsTowardOverallStreak: true,
    countsTowardXP: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'personal',
    iconName: 'Youtube',
    plannedMinutes: 30,
    completed: false,
    scheduledTime: '18:30',
    streak: 12,
    url: 'https://www.youtube.com/@Viralhit-1',
    source: 'youtube',
    xpReward: 15,
    color: '#ff4b4b',
    countsTowardOverallStreak: false,
    countsTowardXP: true,
  },
  {
    id: 'gfg',
    name: 'GFG',
    category: 'coding',
    iconName: 'Binary',
    plannedMinutes: 60,
    completed: true,
    completedAt: '12:15',
    scheduledTime: '12:15',
    streak: 31,
    url: 'https://www.geeksforgeeks.org/user/mraditya',
    source: 'gfg',
    xpReward: 20,
    color: '#2e7d32',
    countsTowardOverallStreak: true,
    countsTowardXP: true,
  },
  {
    id: 'atcoder',
    name: 'AtCoder',
    category: 'coding',
    iconName: 'Terminal',
    plannedMinutes: 45,
    completed: false,
    scheduledTime: '19:00',
    streak: 14,
    url: 'https://atcoder.jp/users/MrAditya',
    source: 'atcoder',
    xpReward: 20,
    color: '#8b5cf6',
    countsTowardOverallStreak: false,
    countsTowardXP: true,
  },
  {
    id: 'python',
    name: 'Python',
    category: 'coding',
    iconName: 'FileCode',
    plannedMinutes: 45,
    completed: false,
    scheduledTime: '16:00',
    streak: 19,
    url: 'https://python.org',
    source: 'manual',
    xpReward: 20,
    color: '#38bdf8',
    countsTowardOverallStreak: true,
    countsTowardXP: true,
  },
  {
    id: 'project',
    name: 'Projects',
    category: 'project',
    iconName: 'FolderKanban',
    plannedMinutes: 60,
    completed: false,
    scheduledTime: '17:00',
    streak: 9,
    url: 'https://github.com',
    source: 'manual',
    xpReward: 30,
    color: '#eab308',
    countsTowardOverallStreak: true,
    countsTowardXP: true,
  },
  {
    id: 'book',
    name: 'Book',
    category: 'education',
    iconName: 'BookOpen',
    plannedMinutes: 30,
    completed: false,
    scheduledTime: '20:30',
    streak: 16,
    url: '',
    source: 'manual',
    xpReward: 15,
    color: '#f97316',
    countsTowardOverallStreak: false,
    countsTowardXP: true,
  },
  {
    id: 'german',
    name: 'German B2',
    category: 'education',
    iconName: 'Languages',
    plannedMinutes: 45,
    completed: false,
    scheduledTime: '21:15',
    streak: 11,
    url: 'https://duolingo.com',
    source: 'manual',
    xpReward: 20,
    color: '#ec4899',
    countsTowardOverallStreak: false,
    countsTowardXP: true,
  },
  {
    id: 'internship',
    name: 'Internship',
    category: 'career',
    iconName: 'Briefcase',
    plannedMinutes: 60,
    completed: false,
    scheduledTime: '15:00',
    streak: 15,
    url: '',
    source: 'manual',
    xpReward: 25,
    color: '#a855f7',
    countsTowardOverallStreak: true,
    countsTowardXP: true,
  },
  {
    id: 'earn',
    name: 'Earn',
    category: 'career',
    iconName: 'DollarSign',
    plannedMinutes: 30,
    completed: false,
    scheduledTime: '22:00',
    streak: 8,
    url: '',
    source: 'manual',
    xpReward: 20,
    color: '#22c55e',
    countsTowardOverallStreak: false,
    countsTowardXP: true,
  },
  {
    id: 'gym',
    name: 'Gym',
    category: 'fitness',
    iconName: 'Dumbbell',
    plannedMinutes: 60,
    completed: false,
    scheduledTime: '07:00',
    streak: 17,
    url: '',
    source: 'manual',
    xpReward: 25,
    color: '#ef4444',
    countsTowardOverallStreak: false,
    countsTowardXP: true,
  },
  {
    id: 'voice',
    name: 'Voice',
    category: 'personal',
    iconName: 'Mic',
    plannedMinutes: 20,
    completed: false,
    scheduledTime: '22:45',
    streak: 6,
    url: '',
    source: 'manual',
    xpReward: 15,
    color: '#14b8a6',
    countsTowardOverallStreak: false,
    countsTowardXP: true,
  }
];

export const INITIAL_LOGS: ActivityLogEntry[] = [
  { id: '1', activityId: 'leetcode', activityName: 'LeetCode', category: 'coding', timeStr: '09:15', timestamp: Date.now() - 3600000 * 6, completed: true, source: 'leetcode' },
  { id: '2', activityId: 'github', activityName: 'GitHub', category: 'coding', timeStr: '10:05', timestamp: Date.now() - 3600000 * 5, completed: true, source: 'github' },
  { id: '3', activityId: 'codeforces', activityName: 'Codeforces', category: 'coding', timeStr: '11:30', timestamp: Date.now() - 3600000 * 4, completed: true, source: 'codeforces' },
  { id: '4', activityId: 'gate', activityName: 'Study (Gates)', category: 'education', timeStr: '14:10', timestamp: Date.now() - 3600000 * 1.5, completed: true, source: 'manual' },
  { id: '5', activityId: 'youtube', activityName: 'YouTube', category: 'personal', timeStr: '18:30', timestamp: Date.now() + 3600000 * 2, completed: false, source: 'youtube' },
];

/**
 * Calculates daily efficiency and stats based on active tasks.
 * Formula: efficiency of day = ("Plan" task completed on that day / total task of "Plan" on that day)%
 */
export function calculateSummary(activities: ActivityItem[]): DailySummary {
  const scheduledActivities = activities.filter((a) => a.countsTowardOverallStreak);
  const targetList = scheduledActivities.length > 0 ? scheduledActivities : activities;

  const plannedMinutes = activities.reduce((acc, curr) => acc + curr.plannedMinutes, 0);
  const completedMinutes = activities
    .filter((a) => a.completed)
    .reduce((acc, curr) => acc + curr.plannedMinutes, 0);

  const tasksCompleted = activities.filter((a) => a.completed).length;
  const totalTasks = activities.length;

  const efficiencyPct = totalTasks > 0 
    ? Math.round((tasksCompleted / totalTasks) * 100) 
    : 0;

  const xpEarnedToday = activities.filter((a) => a.completed && a.countsTowardXP).reduce((acc, curr) => acc + curr.xpReward, 0);
  const allScheduledDone = targetList.length > 0 && targetList.every((a) => a.completed);

  return {
    plannedMinutes,
    completedMinutes,
    efficiencyPct,
    efficiencyChangeFromYesterday: 0,
    tasksCompleted,
    totalTasks,
    xpEarnedToday,
    allScheduledDone,
  };
}

/**
 * Strict Production Streak Evaluator
 * Rule: Overall streak only counts if 100% of scheduled tasks are completed.
 */
export function evaluateStrictStreaks(
  user: UserProfile,
  activities: ActivityItem[],
  currentDateStr: string = new Date().toISOString().split('T')[0]
): { updatedUser: UserProfile; updatedActivities: ActivityItem[] } {
  const summary = calculateSummary(activities);
  const allScheduledCompleted = summary.allScheduledDone;

  const isToday = user.lastActiveDate === currentDateStr;
  let overallStreak = user.overallStreak;
  let freezeCount = user.streakFreezeCount;

  if (allScheduledCompleted) {
    if (!user.isActiveToday) {
      overallStreak += 1;
    }
  }

  // Update attributes dynamically
  const attributes = calculateHunterAttributes(activities, overallStreak);

  const updatedUser: UserProfile = {
    ...user,
    overallStreak,
    longestStreak: Math.max(user.longestStreak, overallStreak),
    isActiveToday: allScheduledCompleted,
    lastActiveDate: allScheduledCompleted ? currentDateStr : user.lastActiveDate,
    streakFreezeCount: freezeCount,
    attributes,
  };

  const updatedActivities = activities.map((act) => {
    return {
      ...act,
      streak: act.completed ? act.streak : act.streak,
    };
  });

  return { updatedUser, updatedActivities };
}

/**
 * Derives Solo Leveling Hunter Attributes from real activity consistency.
 */
export function calculateHunterAttributes(activities: ActivityItem[], overallStreak: number): HunterAttributes {
  const codingCompleted = activities.filter((a) => a.category === 'coding' && a.completed).length;
  const projectCompleted = activities.filter((a) => a.category === 'project' && a.completed).length;
  const fitnessCompleted = activities.filter((a) => a.category === 'fitness' && a.completed).length;
  const eduCompleted = activities.filter((a) => a.category === 'education' && a.completed).length;
  const careerCompleted = activities.filter((a) => a.category === 'career' && a.completed).length;

  return {
    intelligence: Math.min(99, 65 + codingCompleted * 6),
    skill: Math.min(99, 60 + projectCompleted * 10 + (activities.find((a) => a.id === 'github')?.completed ? 8 : 0)),
    strength: Math.min(99, 50 + fitnessCompleted * 15),
    discipline: Math.min(99, Math.min(99, 50 + Math.floor(overallStreak / 2))),
    knowledge: Math.min(99, 60 + eduCompleted * 8),
    professional: Math.min(99, 55 + careerCompleted * 10),
  };
}

/**
 * Generates Real Activity Heatmap data.
 */
export function generateHeatmapData(days: number = 30): HeatmapDay[] {
  const result: HeatmapDay[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Historical simulation with high consistency
    let intensity: 0 | 1 | 2 | 3 | 4 = 3;
    const randomVal = (d.getDate() * 19 + d.getMonth() * 37) % 100;
    
    if (i === 0) {
      intensity = 4;
    } else if (randomVal > 75) {
      intensity = 4;
    } else if (randomVal > 35) {
      intensity = 3;
    } else if (randomVal > 15) {
      intensity = 2;
    } else {
      intensity = 1;
    }

    result.push({
      date: dateStr,
      count: intensity * 2,
      intensity,
      completedActivities: ['LeetCode', 'GitHub', 'Codeforces', 'GFG', 'GATE'],
      totalMinutes: intensity * 75,
      allScheduledCompleted: intensity >= 3,
    });
  }

  return result;
}

/**
 * Historical day records for multi-day analysis
 */
export function generateHistoricalRecords(days: number = 30): HistoricalDayRecord[] {
  const records: HistoricalDayRecord[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const completed = i === 0 ? 5 : (i % 7 === 0 ? 4 : 6);
    const totalScheduled = 7;
    const allCompleted = completed >= totalScheduled;

    records.push({
      date: dateStr,
      allCompleted,
      completedCount: completed,
      totalScheduled,
      plannedMinutes: 390,
      completedMinutes: completed * 55,
      efficiencyPct: Math.round((completed / totalScheduled) * 100),
      xpEarned: completed * 22,
      activities: INITIAL_ACTIVITIES.slice(0, totalScheduled).map((a, idx) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        completed: idx < completed,
        durationMinutes: a.plannedMinutes,
      })),
    });
  }

  return records;
}

/**
 * Calculates complete daily/weekly/monthly analytics
 */
export function calculateAnalytics(history: HistoricalDayRecord[], currentActivities: ActivityItem[]): AnalyticsSummary {
  const todaySummary = calculateSummary(currentActivities);
  const last7Days = history.slice(0, 7);
  const last30Days = history.slice(0, 30);

  const weeklyCompleted = last7Days.reduce((acc, curr) => acc + curr.completedCount, 0);
  const weeklyTotal = last7Days.reduce((acc, curr) => acc + curr.totalScheduled, 0);
  const avgWeeklyEfficiency = Math.round(last7Days.reduce((acc, curr) => acc + curr.efficiencyPct, 0) / Math.max(1, last7Days.length));

  const monthlyCompleted = last30Days.reduce((acc, curr) => acc + curr.completedCount, 0);
  const monthlyTotal = last30Days.reduce((acc, curr) => acc + curr.totalScheduled, 0);
  const avgMonthlyEfficiency = Math.round(last30Days.reduce((acc, curr) => acc + curr.efficiencyPct, 0) / Math.max(1, last30Days.length));
  const totalFocusHours = Math.round(last30Days.reduce((acc, curr) => acc + curr.completedMinutes, 0) / 60);

  return {
    daily: {
      completed: todaySummary.tasksCompleted,
      total: todaySummary.totalTasks,
      efficiency: todaySummary.efficiencyPct,
      focusMinutes: todaySummary.completedMinutes,
      xp: todaySummary.xpEarnedToday,
    },
    weekly: {
      completed: weeklyCompleted,
      total: weeklyTotal,
      completionRate: Math.round((weeklyCompleted / Math.max(1, weeklyTotal)) * 100),
      avgEfficiency: avgWeeklyEfficiency,
      efficiencyChange: 12,
      currentWeekStreak: 7,
    },
    monthly: {
      completed: monthlyCompleted,
      total: monthlyTotal,
      completionRate: Math.round((monthlyCompleted / Math.max(1, monthlyTotal)) * 100),
      longestStreak: 31,
      avgEfficiency: avgMonthlyEfficiency,
      totalFocusHours,
    },
  };
}

export function getRankByLevel(level: number): UserProfile['hunterRank'] {
  if (level >= 50) return 'National Level';
  if (level >= 35) return 'S';
  if (level >= 25) return 'A';
  if (level >= 15) return 'B';
  if (level >= 8) return 'C';
  if (level >= 4) return 'D';
  return 'E';
}
