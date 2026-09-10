import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
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
    last_active_date TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS user_state (
    user_id TEXT PRIMARY KEY,
    activities_json TEXT DEFAULT '[]',
    matrix_json TEXT DEFAULT '{}',
    emergency_tasks_json TEXT DEFAULT '[]',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    overall_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    efficiency_pct REAL DEFAULT 0,
    updated_at TEXT,
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

// Prepared Statements & Helper APIs

export function getUser(userId) {
  const stmt = sqliteDb.prepare('SELECT * FROM users WHERE id = ? OR uid = ? OR email = ?');
  const row = stmt.get(userId, userId, userId);
  if (!row) return null;
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
    lastActiveDate: row.last_active_date,
    updatedAt: row.updated_at,
  };
}

export function saveUser(profile) {
  const targetId = profile.id || profile.uid || 'local_authenticated_dev_user';
  const stmt = sqliteDb.prepare(`
    INSERT INTO users (
      id, uid, email, name, avatar_url, hunter_rank, level, current_xp,
      overall_streak, longest_streak, efficiency_pct, age, blood_group,
      height, weight, resident, phone_number, bio, last_active_date, updated_at
    ) VALUES (
      @id, @uid, @email, @name, @avatar_url, @hunter_rank, @level, @current_xp,
      @overall_streak, @longest_streak, @efficiency_pct, @age, @blood_group,
      @height, @weight, @resident, @phone_number, @bio, @last_active_date, @updated_at
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
      last_active_date = COALESCE(@last_active_date, users.last_active_date),
      updated_at = @updated_at
  `);

  stmt.run({
    id: targetId,
    uid: profile.uid || targetId,
    email: profile.email || null,
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
    lastActiveDate: row.last_active_date,
    updatedAt: row.updated_at,
  }));
}

export function getUserState(userId) {
  const targetId = userId || 'local_authenticated_dev_user';
  // Ensure user row exists
  if (!getUser(targetId)) {
    saveUser({ id: targetId, uid: targetId, name: 'Local Hunter' });
  }

  const row = sqliteDb.prepare('SELECT * FROM user_state WHERE user_id = ?').get(targetId);
  if (!row) {
    return {
      userId: targetId,
      activities: [],
      matrix: {},
      emergencyTasks: [],
      user: {
        currentXP: 0,
        level: 0,
        overallStreak: 0,
        longestStreak: 0,
        efficiencyPct: 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  let activities = [];
  let matrix = {};
  let emergencyTasks = [];

  try { activities = JSON.parse(row.activities_json || '[]'); } catch { /* ignore */ }
  try { matrix = JSON.parse(row.matrix_json || '{}'); } catch { /* ignore */ }
  try { emergencyTasks = JSON.parse(row.emergency_tasks_json || '[]'); } catch { /* ignore */ }

  return {
    userId: targetId,
    activities,
    matrix,
    emergencyTasks,
    user: {
      currentXP: row.xp || 0,
      level: row.level || 0,
      overallStreak: row.overall_streak || 0,
      longestStreak: row.longest_streak || 0,
      efficiencyPct: row.efficiency_pct || 0,
    },
    lastUpdated: row.updated_at || new Date().toISOString(),
  };
}

export function saveUserState(userId, state) {
  const targetId = userId || 'local_authenticated_dev_user';
  if (!getUser(targetId)) {
    saveUser({ id: targetId, uid: targetId, name: 'Local Hunter' });
  }

  const activitiesJson = JSON.stringify(state.activities || []);
  const matrixJson = JSON.stringify(state.matrixState || state.matrix || {});
  const emergencyTasksJson = JSON.stringify(state.emergencyTasks || []);
  const xp = state.user?.currentXP ?? state.user?.xp ?? 0;
  const level = state.user?.level ?? 0;
  const overallStreak = state.user?.overallStreak ?? 0;
  const longestStreak = state.user?.longestStreak ?? 0;
  const efficiencyPct = state.user?.efficiencyPct ?? 0;
  const updatedAt = new Date().toISOString();

  const stmt = sqliteDb.prepare(`
    INSERT INTO user_state (
      user_id, activities_json, matrix_json, emergency_tasks_json,
      xp, level, overall_streak, longest_streak, efficiency_pct, updated_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(user_id) DO UPDATE SET
      activities_json = excluded.activities_json,
      matrix_json = excluded.matrix_json,
      emergency_tasks_json = excluded.emergency_tasks_json,
      xp = excluded.xp,
      level = excluded.level,
      overall_streak = excluded.overall_streak,
      longest_streak = excluded.longest_streak,
      efficiency_pct = excluded.efficiency_pct,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    targetId, activitiesJson, matrixJson, emergencyTasksJson,
    xp, level, overallStreak, longestStreak, efficiencyPct, updatedAt
  );

  return getUserState(targetId);
}

export function resetUserData(userId) {
  const targetId = userId || 'local_authenticated_dev_user';
  sqliteDb.prepare(`
    UPDATE user_state SET
      activities_json = '[]',
      matrix_json = '{}',
      emergency_tasks_json = '[]',
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
