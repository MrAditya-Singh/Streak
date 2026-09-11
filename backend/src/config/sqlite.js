import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dataDir = path.resolve(__dirname, '../../data');
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  dataDir = path.join(os.tmpdir(), 'effstreak-data');
}
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (e) {
  dataDir = path.join(os.tmpdir(), 'effstreak-data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const dbPath = path.join(dataDir, 'effstreak.db');
const sqliteDb = new Database(dbPath);

// Enable WAL mode for high performance concurrent reads and writes
sqliteDb.pragma('journal_mode = WAL');
sqliteDb.pragma('foreign_keys = ON');

// Initialize schema
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    uid TEXT,
    email TEXT,
    name TEXT DEFAULT 'Hunter',
    avatar_url TEXT DEFAULT '/images/char_hero.jpg',
    hunter_rank TEXT DEFAULT 'E',
    level INTEGER DEFAULT 0,
    current_xp INTEGER DEFAULT 0,
    overall_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    efficiency_pct REAL DEFAULT 0,
    age INTEGER,
    blood_group TEXT,
    height TEXT,
    weight TEXT,
    resident TEXT,
    phone_number TEXT,
    bio TEXT,
    header_image TEXT,
    daily_mantra_image TEXT,
    mantra_reel_json TEXT DEFAULT '[]',
    header_reel_json TEXT DEFAULT '[]',
    last_active_date TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS user_state (
    user_id TEXT PRIMARY KEY,
    activities_json TEXT DEFAULT '[]',
    matrix_json TEXT DEFAULT '{}',
    yearly_matrix_json TEXT DEFAULT '{}',
    emergency_tasks_json TEXT DEFAULT '[]',
    thoughts_json TEXT DEFAULT '[]',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    overall_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    efficiency_pct REAL DEFAULT 0,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    icon_name TEXT DEFAULT 'Activity',
    planned_minutes INTEGER DEFAULT 30,
    color TEXT DEFAULT '#3B82F6',
    streak INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    target_count INTEGER DEFAULT 1,
    unit TEXT DEFAULT 'times',
    source TEXT DEFAULT 'Manual',
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS habit_ticks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    habit_id TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'done',
    timestamp INTEGER NOT NULL,
    xp_earned INTEGER DEFAULT 20,
    created_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS thoughts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL, -- 'personal' | 'financial' | 'technical'
    title TEXT NOT NULL,
    content TEXT,
    tags_json TEXT DEFAULT '[]',
    priority TEXT DEFAULT 'medium',
    is_starred INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    activity_id TEXT NOT NULL,
    activity_name TEXT,
    timestamp INTEGER NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS custom_platforms (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'Activity',
    color TEXT DEFAULT '#3B82F6',
    category TEXT DEFAULT 'Custom',
    target_count INTEGER DEFAULT 1,
    unit TEXT DEFAULT 'units',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS integration_cache (
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    data_json TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    PRIMARY KEY (user_id, platform)
  );
`);

console.log(`🗄️ SQLite database initialized successfully at: ${dbPath}`);

// Safe migrations for newly added columns across tables
try { sqliteDb.exec(`ALTER TABLE users ADD COLUMN header_image TEXT`); } catch {}
try { sqliteDb.exec(`ALTER TABLE users ADD COLUMN daily_mantra_image TEXT`); } catch {}
try { sqliteDb.exec(`ALTER TABLE users ADD COLUMN mantra_reel_json TEXT DEFAULT '[]'`); } catch {}
try { sqliteDb.exec(`ALTER TABLE users ADD COLUMN header_reel_json TEXT DEFAULT '[]'`); } catch {}
try { sqliteDb.exec(`ALTER TABLE user_state ADD COLUMN thoughts_json TEXT DEFAULT '[]'`); } catch {}
try { sqliteDb.exec(`ALTER TABLE user_state ADD COLUMN yearly_matrix_json TEXT DEFAULT '{}'`); } catch {}

// Prepared Statements & Helper Functions
export function getUser(userIdOrEmail) {
  if (!userIdOrEmail) return null;
  const raw = String(userIdOrEmail).trim();
  const cleanEmail = raw.startsWith('user_email_') 
    ? raw.replace('user_email_', '').replace(/_/g, '.') 
    : (raw.includes('@') ? raw.toLowerCase() : null);
  const emailKey = cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : null;

  const stmt = sqliteDb.prepare(`
    SELECT * FROM users 
    WHERE id = ? OR uid = ? OR email = ? 
       OR (? IS NOT NULL AND id = ?)
       OR (? IS NOT NULL AND LOWER(email) = LOWER(?))
    LIMIT 1
  `);
  const row = stmt.get(raw, raw, raw, emailKey, emailKey, cleanEmail, cleanEmail);
  if (!row) return null;

  let mantraReel = [];
  let headerReel = [];
  try { mantraReel = JSON.parse(row.mantra_reel_json || '[]'); } catch {}
  try { headerReel = JSON.parse(row.header_reel_json || '[]'); } catch {}

  return {
    id: row.id,
    uid: row.uid || row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    hunterRank: row.hunter_rank,
    level: row.level,
    currentXP: row.current_xp,
    overallStreak: row.overall_streak,
    longestStreak: row.longest_streak,
    efficiencyPct: row.efficiency_pct,
    age: row.age,
    bloodGroup: row.blood_group,
    height: row.height,
    weight: row.weight,
    resident: row.resident,
    phoneNumber: row.phone_number,
    bio: row.bio,
    headerImage: row.header_image,
    dailyMantraImage: row.daily_mantra_image,
    mantraReel,
    headerReel,
    lastActiveDate: row.last_active_date,
    updatedAt: row.updated_at,
  };
}

export function saveUser(profile) {
  const cleanEmail = (profile.email || (typeof profile.id === 'string' && profile.id.includes('@') ? profile.id : null))?.trim().toLowerCase();
  let existingUser = null;
  if (cleanEmail) {
    const emailKey = `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
    existingUser = sqliteDb.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR id = ?').get(cleanEmail, emailKey);
  }
  if (!existingUser) {
    existingUser = getUser(profile.id || profile.uid);
  }

  const targetId = existingUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : (profile.id || profile.uid || 'local_authenticated_dev_user'));
  const mantraReelJson = profile.mantraReel ? JSON.stringify(profile.mantraReel) : undefined;
  const headerReelJson = profile.headerReel ? JSON.stringify(profile.headerReel) : undefined;

  const stmt = sqliteDb.prepare(`
    INSERT INTO users (
      id, uid, email, name, avatar_url, hunter_rank, level, current_xp,
      overall_streak, longest_streak, efficiency_pct, age, blood_group,
      height, weight, resident, phone_number, bio, header_image, daily_mantra_image,
      mantra_reel_json, header_reel_json, last_active_date, updated_at
    ) VALUES (
      @id, @uid, @email, @name, @avatar_url, @hunter_rank, @level, @current_xp,
      @overall_streak, @longest_streak, @efficiency_pct, @age, @blood_group,
      @height, @weight, @resident, @phone_number, @bio, @header_image, @daily_mantra_image,
      @mantra_reel_json, @header_reel_json, @last_active_date, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      email = COALESCE(@email, users.email),
      name = COALESCE(@name, users.name),
      avatar_url = COALESCE(@avatar_url, users.avatar_url),
      hunter_rank = COALESCE(@hunter_rank, users.hunter_rank),
      level = COALESCE(@level, users.level),
      current_xp = COALESCE(@current_xp, users.current_xp),
      overall_streak = COALESCE(@overall_streak, users.overall_streak),
      longest_streak = COALESCE(@longest_streak, users.longest_streak),
      efficiency_pct = COALESCE(@efficiency_pct, users.efficiency_pct),
      age = COALESCE(@age, users.age),
      blood_group = COALESCE(@blood_group, users.blood_group),
      height = COALESCE(@height, users.height),
      weight = COALESCE(@weight, users.weight),
      resident = COALESCE(@resident, users.resident),
      phone_number = COALESCE(@phone_number, users.phone_number),
      bio = COALESCE(@bio, users.bio),
      header_image = COALESCE(@header_image, users.header_image),
      daily_mantra_image = COALESCE(@daily_mantra_image, users.daily_mantra_image),
      mantra_reel_json = COALESCE(@mantra_reel_json, users.mantra_reel_json),
      header_reel_json = COALESCE(@header_reel_json, users.header_reel_json),
      last_active_date = COALESCE(@last_active_date, users.last_active_date),
      updated_at = @updated_at
  `);

  stmt.run({
    id: targetId,
    uid: profile.uid || targetId,
    email: cleanEmail || profile.email || null,
    name: profile.name || 'Hunter',
    avatar_url: profile.avatarUrl || '/images/char_hero.jpg',
    hunter_rank: profile.hunterRank || 'E',
    level: profile.level ?? 0,
    current_xp: profile.currentXP ?? profile.xp ?? 0,
    overall_streak: profile.overallStreak ?? 0,
    longest_streak: profile.longestStreak ?? 0,
    efficiency_pct: profile.efficiencyPct ?? 0,
    age: profile.age ?? null,
    blood_group: profile.bloodGroup ?? null,
    height: profile.height ?? null,
    weight: profile.weight ?? null,
    resident: profile.resident ?? null,
    phone_number: profile.phoneNumber ?? null,
    bio: profile.bio ?? null,
    header_image: profile.headerImage ?? null,
    daily_mantra_image: profile.dailyMantraImage ?? null,
    mantra_reel_json: mantraReelJson ?? null,
    header_reel_json: headerReelJson ?? null,
    last_active_date: profile.lastActiveDate ?? new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString(),
  });

  return getUser(targetId);
}

export function getAllUsers() {
  const rows = sqliteDb.prepare('SELECT * FROM users ORDER BY updated_at DESC').all();
  return rows.map((row) => ({
    id: row.id,
    uid: row.uid || row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    hunterRank: row.hunter_rank,
    level: row.level,
    currentXP: row.current_xp,
    overallStreak: row.overall_streak,
    longestStreak: row.longest_streak,
    efficiencyPct: row.efficiency_pct,
    age: row.age,
    bloodGroup: row.blood_group,
    height: row.height,
    weight: row.weight,
    resident: row.resident,
    phoneNumber: row.phone_number,
    bio: row.bio,
    headerImage: row.header_image,
    dailyMantraImage: row.daily_mantra_image,
    lastActiveDate: row.last_active_date,
    updatedAt: row.updated_at,
  }));
}

// -------------------------------------------------------------
// Habits Relational Model CRUD
// -------------------------------------------------------------
export function saveHabit(userId, habit) {
  const user = getUser(userId);
  const targetId = user?.id || userId || 'local_authenticated_dev_user';
  if (!user) {
    saveUser({ id: targetId, uid: targetId, name: 'Local Hunter' });
  }

  const now = new Date().toISOString();
  const stmt = sqliteDb.prepare(`
    INSERT INTO habits (
      id, user_id, name, category, icon_name, planned_minutes, color,
      streak, completed, target_count, unit, source, created_at, updated_at
    ) VALUES (
      @id, @user_id, @name, @category, @icon_name, @planned_minutes, @color,
      @streak, @completed, @target_count, @unit, @source, @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      name = @name,
      category = @category,
      icon_name = @icon_name,
      planned_minutes = @planned_minutes,
      color = @color,
      streak = @streak,
      completed = @completed,
      target_count = @target_count,
      unit = @unit,
      source = @source,
      updated_at = @updated_at
  `);

  stmt.run({
    id: habit.id,
    user_id: targetId,
    name: habit.name,
    category: habit.category || 'Focus',
    icon_name: habit.iconName || habit.icon || 'Activity',
    planned_minutes: habit.plannedMinutes || habit.duration || 30,
    color: habit.color || '#3B82F6',
    streak: habit.streak || 0,
    completed: habit.completed ? 1 : 0,
    target_count: habit.targetCount || 1,
    unit: habit.unit || 'times',
    source: habit.source || 'Manual',
    created_at: habit.createdAt || now,
    updated_at: now,
  });

  return getHabits(targetId);
}

export function deleteHabit(userId, habitId) {
  const user = getUser(userId);
  const targetId = user?.id || userId || 'local_authenticated_dev_user';
  sqliteDb.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(habitId, targetId);
  sqliteDb.prepare('DELETE FROM habit_ticks WHERE habit_id = ? AND user_id = ?').run(habitId, targetId);
  return getHabits(targetId);
}

export function getHabits(userId) {
  const user = getUser(userId);
  const targetId = user?.id || userId || 'local_authenticated_dev_user';
  const rows = sqliteDb.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at ASC').all(targetId);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    icon: row.icon_name,
    iconName: row.icon_name,
    plannedMinutes: row.planned_minutes,
    color: row.color,
    streak: row.streak,
    completed: Boolean(row.completed),
    targetCount: row.target_count,
    unit: row.unit,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// -------------------------------------------------------------
// Habit Ticks Relational Model CRUD
// -------------------------------------------------------------
export function saveHabitTick(userId, tick) {
  const user = getUser(userId);
  const targetId = user?.id || userId || 'local_authenticated_dev_user';
  if (!user) {
    saveUser({ id: targetId, uid: targetId, name: 'Local Hunter' });
  }

  const tickId = tick.id || `tick_${tick.habitId}_${tick.date}_${Date.now()}`;
  const now = new Date().toISOString();
  const timestamp = tick.timestamp || Date.now();

  const stmt = sqliteDb.prepare(`
    INSERT INTO habit_ticks (id, user_id, habit_id, date, status, timestamp, xp_earned, created_at)
    VALUES (@id, @user_id, @habit_id, @date, @status, @timestamp, @xp_earned, @created_at)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      xp_earned = excluded.xp_earned,
      timestamp = excluded.timestamp
  `);

  stmt.run({
    id: tickId,
    user_id: targetId,
    habit_id: tick.habitId,
    date: tick.date,
    status: tick.status || 'done',
    timestamp,
    xp_earned: tick.xpEarned ?? 20,
    created_at: now,
  });

  return { id: tickId, userId: targetId, habitId: tick.habitId, date: tick.date, status: tick.status || 'done', timestamp, xpEarned: tick.xpEarned ?? 20 };
}

export function getHabitTicks(userId, date) {
  const user = getUser(userId);
  const targetId = user?.id || userId || 'local_authenticated_dev_user';
  if (date) {
    return sqliteDb.prepare('SELECT * FROM habit_ticks WHERE user_id = ? AND date = ?').all(targetId, date);
  }
  return sqliteDb.prepare('SELECT * FROM habit_ticks WHERE user_id = ? ORDER BY timestamp DESC').all(targetId);
}

// -------------------------------------------------------------
// Thoughts Relational Model CRUD
// -------------------------------------------------------------
export function saveSingleThought(userId, thought) {
  const user = getUser(userId);
  const targetId = user?.id || userId || 'local_authenticated_dev_user';
  if (!user) {
    saveUser({ id: targetId, uid: targetId, name: 'Local Hunter' });
  }

  const now = Date.now();
  const stmt = sqliteDb.prepare(`
    INSERT INTO thoughts (id, user_id, category, title, content, tags_json, priority, is_starred, created_at, updated_at)
    VALUES (@id, @user_id, @category, @title, @content, @tags_json, @priority, @is_starred, @created_at, @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      category = excluded.category,
      title = excluded.title,
      content = excluded.content,
      tags_json = excluded.tags_json,
      priority = excluded.priority,
      is_starred = excluded.is_starred,
      updated_at = excluded.updated_at
  `);

  stmt.run({
    id: thought.id || `thought_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user_id: targetId,
    category: thought.category || 'personal',
    title: thought.title || 'Untitled Thought',
    content: thought.content || '',
    tags_json: JSON.stringify(thought.tags || []),
    priority: thought.priority || 'medium',
    is_starred: thought.isStarred ? 1 : 0,
    created_at: thought.createdAt || now,
    updated_at: thought.updatedAt || now,
  });

  return getThoughts(targetId);
}

export function saveThoughts(userId, thoughts) {
  const user = getUser(userId);
  const targetId = user?.id || userId || 'local_authenticated_dev_user';
  if (!Array.isArray(thoughts)) return [];

  const deleteTx = sqliteDb.transaction((items) => {
    sqliteDb.prepare('DELETE FROM thoughts WHERE user_id = ?').run(targetId);
    const stmt = sqliteDb.prepare(`
      INSERT INTO thoughts (id, user_id, category, title, content, tags_json, priority, is_starred, created_at, updated_at)
      VALUES (@id, @user_id, @category, @title, @content, @tags_json, @priority, @is_starred, @created_at, @updated_at)
    `);
    const now = Date.now();
    for (const item of items) {
      stmt.run({
        id: item.id || `thought_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        user_id: targetId,
        category: item.category || 'personal',
        title: item.title || 'Untitled Thought',
        content: item.content || '',
        tags_json: JSON.stringify(item.tags || []),
        priority: item.priority || 'medium',
        is_starred: item.isStarred ? 1 : 0,
        created_at: item.createdAt || now,
        updated_at: item.updatedAt || now,
      });
    }
  });

  deleteTx(thoughts);
  return getThoughts(targetId);
}

export function deleteThought(userId, thoughtId) {
  const user = getUser(userId);
  const targetId = user?.id || userId || 'local_authenticated_dev_user';
  sqliteDb.prepare('DELETE FROM thoughts WHERE id = ? AND user_id = ?').run(thoughtId, targetId);
  return getThoughts(targetId);
}

export function getThoughts(userId) {
  const user = getUser(userId);
  const targetId = user?.id || userId || 'local_authenticated_dev_user';
  const rows = sqliteDb.prepare('SELECT * FROM thoughts WHERE user_id = ? ORDER BY updated_at DESC').all(targetId);
  return rows.map((row) => {
    let tags = [];
    try { tags = JSON.parse(row.tags_json || '[]'); } catch {}
    return {
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content,
      tags,
      priority: row.priority,
      isStarred: Boolean(row.is_starred),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

// -------------------------------------------------------------
// User State Sync & Retrieval (One Gmail = One Account)
// -------------------------------------------------------------
export function getUserState(userIdOrEmail, email) {
  const lookupKey = email || userIdOrEmail;
  const targetUser = getUser(lookupKey) || getUser(userIdOrEmail);
  const cleanEmail = (targetUser?.email || email || (typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@') ? userIdOrEmail : null))?.trim().toLowerCase();
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : (userIdOrEmail || 'local_authenticated_dev_user'));
  
  if (!targetUser) {
    saveUser({ id: canonicalId, uid: canonicalId, email: cleanEmail, name: 'Local Hunter' });
  }

  const row = sqliteDb.prepare(`
    SELECT * FROM user_state 
    WHERE user_id = ? OR user_id = ? OR user_id = ?
    ORDER BY updated_at DESC LIMIT 1
  `).get(canonicalId, targetUser?.uid || canonicalId, userIdOrEmail || canonicalId);

  let activities = getHabits(canonicalId);
  let thoughts = getThoughts(canonicalId);

  if (!row) {
    return {
      userId: canonicalId,
      activities,
      matrix: {},
      yearlyMatrix: {},
      emergencyTasks: [],
      thoughts,
      user: {
        currentXP: targetUser?.currentXP || 0,
        level: targetUser?.level || 0,
        overallStreak: targetUser?.overallStreak || 0,
        longestStreak: targetUser?.longestStreak || 0,
        efficiencyPct: targetUser?.efficiencyPct || 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  let matrix = {};
  let yearlyMatrix = {};
  let emergencyTasks = [];

  try { 
    if (activities.length === 0 && row.activities_json) {
      activities = JSON.parse(row.activities_json);
    }
  } catch {}
  try { matrix = JSON.parse(row.matrix_json || '{}'); } catch {}
  try { yearlyMatrix = JSON.parse(row.yearly_matrix_json || '{}'); } catch {}
  try { emergencyTasks = JSON.parse(row.emergency_tasks_json || '[]'); } catch {}
  try {
    if (thoughts.length === 0 && row.thoughts_json) {
      thoughts = JSON.parse(row.thoughts_json);
    }
  } catch {}

  return {
    userId: canonicalId,
    activities,
    matrix,
    yearlyMatrix,
    yearlyMatrixState: yearlyMatrix,
    emergencyTasks,
    thoughts,
    user: {
      currentXP: row.xp || targetUser?.currentXP || 0,
      level: row.level || targetUser?.level || 0,
      overallStreak: row.overall_streak || targetUser?.overallStreak || 0,
      longestStreak: row.longest_streak || targetUser?.longestStreak || 0,
      efficiencyPct: row.efficiency_pct || targetUser?.efficiencyPct || 0,
    },
    lastUpdated: row.updated_at || new Date().toISOString(),
  };
}

export function saveUserState(userIdOrEmail, state, explicitEmail) {
  const cleanEmail = (explicitEmail || state.user?.email || state.email || (typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@') ? userIdOrEmail : null))?.trim().toLowerCase();
  const targetUser = getUser(cleanEmail || userIdOrEmail) || getUser(userIdOrEmail);
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : (userIdOrEmail || 'local_authenticated_dev_user'));
  
  if (!targetUser || !targetUser.email && cleanEmail) {
    saveUser({ id: canonicalId, uid: canonicalId, email: cleanEmail, name: state.user?.name || 'Local Hunter' });
  }

  // Also sync habits table if activities provided
  if (Array.isArray(state.activities) && state.activities.length > 0) {
    for (const act of state.activities) {
      saveHabit(canonicalId, act);
    }
  }

  // Also sync thoughts table if thoughts provided
  if (Array.isArray(state.thoughts) && state.thoughts.length > 0) {
    saveThoughts(canonicalId, state.thoughts);
  }

  const activitiesJson = JSON.stringify(state.activities || []);
  const matrixJson = JSON.stringify(state.matrixState || state.matrix || {});
  const yearlyMatrixJson = JSON.stringify(state.yearlyMatrixState || state.yearlyMatrix || {});
  const emergencyTasksJson = JSON.stringify(state.emergencyTasks || []);
  const thoughtsJson = JSON.stringify(state.thoughts || []);
  const xp = state.user?.currentXP ?? state.user?.xp ?? 0;
  const level = state.user?.level ?? 0;
  const overallStreak = state.user?.overallStreak ?? 0;
  const longestStreak = state.user?.longestStreak ?? 0;
  const efficiencyPct = state.user?.efficiencyPct ?? 0;
  const updatedAt = new Date().toISOString();

  const stmt = sqliteDb.prepare(`
    INSERT INTO user_state (
      user_id, activities_json, matrix_json, yearly_matrix_json, emergency_tasks_json, thoughts_json,
      xp, level, overall_streak, longest_streak, efficiency_pct, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(user_id) DO UPDATE SET
      activities_json = excluded.activities_json,
      matrix_json = excluded.matrix_json,
      yearly_matrix_json = excluded.yearly_matrix_json,
      emergency_tasks_json = excluded.emergency_tasks_json,
      thoughts_json = excluded.thoughts_json,
      xp = excluded.xp,
      level = excluded.level,
      overall_streak = excluded.overall_streak,
      longest_streak = excluded.longest_streak,
      efficiency_pct = excluded.efficiency_pct,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    canonicalId, activitiesJson, matrixJson, yearlyMatrixJson, emergencyTasksJson, thoughtsJson,
    xp, level, overallStreak, longestStreak, efficiencyPct, updatedAt
  );

  return getUserState(canonicalId);
}

export function resetUserData(userId) {
  const targetId = userId || 'local_authenticated_dev_user';
  sqliteDb.prepare('DELETE FROM habits WHERE user_id = ?').run(targetId);
  sqliteDb.prepare('DELETE FROM habit_ticks WHERE user_id = ?').run(targetId);
  sqliteDb.prepare('DELETE FROM thoughts WHERE user_id = ?').run(targetId);

  sqliteDb.prepare(`
    UPDATE user_state SET
      activities_json = '[]',
      matrix_json = '{}',
      yearly_matrix_json = '{}',
      emergency_tasks_json = '[]',
      thoughts_json = '[]',
      xp = 0,
      level = 0,
      overall_streak = 0,
      longest_streak = 0,
      efficiency_pct = 0,
      updated_at = ?
    WHERE user_id = ?
  `).run(new Date().toISOString(), targetId);

  sqliteDb.prepare(`
    UPDATE users SET
      current_xp = 0,
      level = 0,
      overall_streak = 0,
      longest_streak = 0,
      efficiency_pct = 0,
      hunter_rank = 'E',
      updated_at = ?
    WHERE id = ? OR uid = ?
  `).run(new Date().toISOString(), targetId, targetId);

  return getUserState(targetId);
}

export { sqliteDb };
