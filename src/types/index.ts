export type ActivityCategory = 
  | 'coding' 
  | 'education' 
  | 'project' 
  | 'fitness' 
  | 'career' 
  | 'personal' 
  | 'social' 
  | 'rest';

export type ActivitySource = 
  | 'manual' 
  | 'github' 
  | 'codeforces' 
  | 'leetcode' 
  | 'gfg' 
  | 'atcoder' 
  | 'youtube';

export interface HunterAttributes {
  strength: number;     // STR (Fitness/Gym)
  intelligence: number; // INT (Coding/Algorithms)
  discipline: number;   // DISC (Consistency & Streaks)
  skill: number;        // SKILL (Projects & GitHub)
  knowledge: number;    // KNOWLEDGE (GATE, Books, Languages)
  professional: number; // PROF (Internship, Earn)
}

export interface EmergencyTask {
  id: string;
  title: string;
  createdAt: number;
  deadlineHours: number; // 24 or 48
  deadlineAt: number;    // timestamp in ms
  xpReward: number;      // 5 XP
  priority: number;      // 1 to 5
  tag?: string;          // 'CRITICAL', '24H URGENT', '48H DIRECTIVE'
  completed?: boolean;
}

export interface ActivityItem {
  id: string;
  name: string;
  category: ActivityCategory;
  iconName: string;
  plannedMinutes: number;
  completed: boolean;
  completedAt?: string;
  scheduledTime?: string;
  streak: number;
  url?: string;
  source: ActivitySource;
  xpReward: number;
  color?: string;
  countsTowardOverallStreak: boolean;
  countsTowardXP: boolean;
  priority?: number; // 1 to 5 (5 highest priority)
  isAutoDetected?: boolean;
  manualOverride?: boolean;
  lastSyncedAt?: string;
}

export interface UserProfile {
  uid?: string;
  email?: string;
  name: string;
  age?: number;
  bloodGroup?: string;
  height?: string;
  weight?: string;
  resident?: string;
  phoneNumber?: string;
  bio?: string;
  avatarUrl?: string;
  overallStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  streakStartDate: string; // YYYY-MM-DD
  isActiveToday: boolean;
  streakFreezeCount: number;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  hunterRank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National Level';
  attributes: HunterAttributes;
  timezone: string;
  dailyResetTime: string; // e.g. "00:00" or "04:00"
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  reminderTime?: string; // e.g. "21:30"
  githubUsername?: string;
  githubToken?: string;
  codeforcesHandle?: string;
  leetcodeUsername?: string;
  gfgUsername?: string;
  atcoderUsername?: string;
  youtubeChannelId?: string;
  codestudioUsername?: string;
  interviewbitUsername?: string;
  codechefUsername?: string;
  hackerrankUsername?: string;
  platformUrls?: Record<string, string>;
  platformVerified?: Record<string, boolean>;
  platformStats?: Record<string, { solved?: number; rating?: number; rank?: string; lastFetched?: string }>;
}

export interface ActivityLogEntry {
  id: string;
  activityId: string;
  activityName: string;
  category: ActivityCategory;
  timeStr: string;
  timestamp: number;
  completed: boolean;
  source: ActivitySource;
  isAutoDetected?: boolean;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
  completedActivities: string[];
  totalMinutes: number;
  allScheduledCompleted: boolean;
}

export interface HistoricalDayRecord {
  date: string; // YYYY-MM-DD
  allCompleted: boolean;
  completedCount: number;
  totalScheduled: number;
  plannedMinutes: number;
  completedMinutes: number;
  efficiencyPct: number;
  xpEarned: number;
  activities: Array<{
    id: string;
    name: string;
    category: ActivityCategory;
    completed: boolean;
    durationMinutes: number;
  }>;
}

export interface DailySummary {
  plannedMinutes: number;
  completedMinutes: number;
  efficiencyPct: number;
  efficiencyChangeFromYesterday: number;
  tasksCompleted: number;
  totalTasks: number;
  xpEarnedToday: number;
  allScheduledDone: boolean;
}

export interface AnalyticsSummary {
  daily: {
    completed: number;
    total: number;
    efficiency: number;
    focusMinutes: number;
    xp: number;
  };
  weekly: {
    completed: number;
    total: number;
    completionRate: number;
    avgEfficiency: number;
    efficiencyChange: number;
    currentWeekStreak: number;
  };
  monthly: {
    completed: number;
    total: number;
    completionRate: number;
    longestStreak: number;
    avgEfficiency: number;
    totalFocusHours: number;
  };
}
