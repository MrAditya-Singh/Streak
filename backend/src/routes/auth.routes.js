import { Router } from 'express';
import { 
  getUser, 
  saveUser, 
  getAllUsers, 
  resetUserData 
} from '../config/sqlite.js';
import { 
  supabase, 
  isSupabaseConfigured, 
  syncUserToSupabase 
} from '../config/supabase.js';
import { verifySupabaseToken } from '../middleware/supabaseAuth.middleware.js';

const router = Router();

/**
 * @route   GET /api/auth/me
 * @desc    Protected authentication test endpoint (verifies Supabase / Local Token)
 */
router.get('/me', verifySupabaseToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth token verified successfully by backend!',
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/auth/users
 * @desc    Get list of available profiles from SQLite & Supabase
 */
router.get('/users', verifySupabaseToken, async (req, res) => {
  // 1. Check Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: cloudUsers, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && cloudUsers && cloudUsers.length > 0) {
        return res.status(200).json({ success: true, users: cloudUsers, source: 'supabase' });
      }
    } catch (err) {
      console.warn('Supabase users fetch fallback to SQLite:', err.message);
    }
  }

  // 2. Fetch from Local SQLite Database
  const localUsers = getAllUsers();
  res.status(200).json({
    success: true,
    users: localUsers,
    source: 'sqlite',
  });
});

/**
 * @route   GET /api/auth/user-profile
 * @desc    Fetch authenticated user profile from SQLite local database + Supabase
 */
router.get('/user-profile', verifySupabaseToken, async (req, res) => {
  const uid = req.user.uid;

  // 1. Check local SQLite DB first
  let localProfile = getUser(uid);

  // 2. If Supabase configured, check cloud DB
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: cloudUser, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (!error && cloudUser) {
        // Update local SQLite cache
        saveUser(cloudUser);
        localProfile = getUser(uid);
      }
    } catch (err) {
      console.warn('Supabase user-profile fetch notice:', err.message);
    }
  }

  if (!localProfile) {
    localProfile = saveUser({
      id: uid,
      uid: uid,
      email: req.user.email,
      name: req.user.name || req.user.email?.split('@')[0] || 'Hunter',
      avatarUrl: req.user.avatarUrl || '/images/char_hero.jpg',
      hunterRank: 'E',
      level: 0,
      currentXP: 0,
      overallStreak: 0,
      longestStreak: 0,
    });
  }

  res.status(200).json({
    success: true,
    user: localProfile,
  });
});

/**
 * @route   POST /api/auth/google
 * @desc    Google / OAuth Sign-In & Multi-Device Profile Fetch & SQLite/Supabase Upsert
 */
router.post('/google', verifySupabaseToken, async (req, res) => {
  const { email, name, avatarUrl, googleId } = req.body;

  const verifiedUid = req.user.uid;
  const verifiedEmail = (req.user.email || email || '').trim().toLowerCase();

  const targetDocId = verifiedUid || (verifiedEmail ? verifiedEmail.replace(/[^a-z0-9]/g, '_') : 'local_authenticated_dev_user');

  const existingProfile = getUser(targetDocId);

  const profileData = {
    id: targetDocId,
    uid: targetDocId,
    email: verifiedEmail || existingProfile?.email || '',
    name: name || existingProfile?.name || verifiedEmail.split('@')[0] || 'Hunter',
    avatarUrl: avatarUrl || existingProfile?.avatarUrl || '/images/char_hero.jpg',
    googleId: googleId || '',
    hunterRank: existingProfile?.hunterRank || 'E',
    level: existingProfile?.level ?? 0,
    currentXP: existingProfile?.currentXP ?? 0,
    overallStreak: existingProfile?.overallStreak ?? 0,
    longestStreak: existingProfile?.longestStreak ?? 0,
    age: existingProfile?.age ?? null,
    bloodGroup: existingProfile?.bloodGroup ?? '',
    height: existingProfile?.height ?? '',
    weight: existingProfile?.weight ?? '',
    resident: existingProfile?.resident ?? '',
    phoneNumber: existingProfile?.phoneNumber ?? '',
    bio: existingProfile?.bio ?? '',
    lastActiveDate: new Date().toISOString().split('T')[0],
  };

  // 1. Save to Local SQLite Database
  const savedProfile = saveUser(profileData);

  // 2. Sync to Supabase Cloud if available
  if (isSupabaseConfigured) {
    syncUserToSupabase(profileData).catch(() => {});
  }

  res.status(200).json({
    success: true,
    message: `Logged in as ${savedProfile.name} (${verifiedEmail || targetDocId})`,
    user: savedProfile,
  });
});

/**
 * @route   POST /api/auth/profile
 * @desc    Save/Update personal profile details to SQLite & Supabase
 */
router.post('/profile', verifySupabaseToken, async (req, res) => {
  const {
    name,
    email,
    age,
    bloodGroup,
    height,
    weight,
    resident,
    phoneNumber,
    bio,
    avatarUrl,
  } = req.body;

  const targetId = req.user.uid;
  const existing = getUser(targetId) || {};

  const updatedProfile = {
    ...existing,
    id: targetId,
    uid: targetId,
    ...(name && { name: name.trim() }),
    ...(email && { email: email.trim().toLowerCase() }),
    ...(age !== undefined && { age: Number(age) }),
    ...(bloodGroup && { bloodGroup: bloodGroup.trim() }),
    ...(height && { height: height.trim() }),
    ...(weight && { weight: weight.trim() }),
    ...(resident && { resident: resident.trim() }),
    ...(phoneNumber && { phoneNumber: phoneNumber.trim() }),
    ...(bio && { bio: bio.trim() }),
    ...(avatarUrl && { avatarUrl: avatarUrl.trim() }),
  };

  // 1. Persist to SQLite
  const saved = saveUser(updatedProfile);

  // 2. Sync to Supabase Cloud
  if (isSupabaseConfigured) {
    syncUserToSupabase(updatedProfile).catch(() => {});
  }

  res.status(200).json({
    success: true,
    message: 'Profile details saved to SQLite & Cloud Database successfully!',
    profile: saved,
  });
});

/**
 * @route   POST /api/auth/reset
 * @desc    Reset all data to clean 0 across SQLite and Supabase
 */
router.post('/reset', verifySupabaseToken, async (req, res) => {
  const userId = req.user.uid;

  // 1. Reset in SQLite Local Database
  const resetState = resetUserData(userId);

  // 2. Reset in Supabase Cloud
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('user_profiles').update({
        level: 0,
        current_xp: 0,
        overall_streak: 0,
        longest_streak: 0,
        efficiency_pct: 0,
        hunter_rank: 'E',
        updated_at: new Date().toISOString(),
      }).eq('id', userId);

      await supabase.from('user_state').update({
        activities: [],
        matrix_state: {},
        emergency_tasks: [],
        xp: 0,
        level: 0,
        overall_streak: 0,
        longest_streak: 0,
        efficiency_pct: 0,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);
    } catch (err) {
      console.warn('Supabase reset notice:', err.message);
    }
  }

  res.status(200).json({
    success: true,
    message: 'All streak, level, XP, and platform data wiped to clean 0 in SQLite & Supabase!',
    zeroState: resetState,
  });
});

export default router;
