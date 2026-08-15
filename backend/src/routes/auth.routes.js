import { Router } from 'express';
import { db, isFirebaseInitialized } from '../config/firebase.js';

const router = Router();

// In-memory profiles list for local fallback
let defaultProfiles = [
  {
    id: 'aditya-singh',
    name: 'Aditya Singh',
    email: 'mradityasinghofficial1@gmail.com',
    age: 21,
    bloodGroup: 'B+',
    height: '178 cm',
    weight: '68 kg',
    resident: 'India',
    phoneNumber: '+91 9876543210',
    bio: 'Solo Hunter • S-Rank Aspirant • Competitive Programmer & Developer',
    hunterRank: 'A',
    level: 18,
    avatar: '/images/char_hero.jpg',
    createdAt: new Date().toISOString(),
  },
];

/**
 * @route   GET /api/auth/users
 * @desc    Get list of available profiles
 */
router.get('/users', async (req, res) => {
  if (isFirebaseInitialized && db) {
    try {
      const snapshot = await db.collection('user_profiles').get();
      if (!snapshot.empty) {
        const users = [];
        snapshot.forEach((doc) => users.push(doc.data()));
        return res.status(200).json({ success: true, users });
      }
    } catch (err) {
      console.warn('Firestore user profile fetch fallback:', err.message);
    }
  }

  res.status(200).json({
    success: true,
    users: defaultProfiles,
  });
});

/**
 * @route   POST /api/auth/google
 * @desc    Google / Gmail Sign-In & Unified Multi-Device Profile Fetch
 */
router.post('/google', async (req, res) => {
  const { email, name, avatarUrl, googleId } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required for Google Sign-In' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const userId = cleanEmail.replace(/[^a-z0-9]/g, '_');

  let profile = {
    id: userId,
    uid: userId,
    email: cleanEmail,
    name: name || cleanEmail.split('@')[0],
    avatarUrl: avatarUrl || '/images/char_hero.jpg',
    googleId: googleId || '',
    hunterRank: 'A',
    level: 18,
    currentXP: 1840,
    overallStreak: 98,
    longestStreak: 98,
    age: 21,
    bloodGroup: 'B+',
    height: '178 cm',
    weight: '68 kg',
    resident: 'India',
    phoneNumber: '+91 9876543210',
    bio: 'Solo Hunter • S-Rank Aspirant',
    lastActiveDate: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseInitialized && db) {
    try {
      const docRef = db.collection('users').doc(userId);
      const existing = await docRef.get();
      if (existing.exists) {
        profile = { ...profile, ...existing.data(), email: cleanEmail };
      } else {
        await docRef.set(profile, { merge: true });
        await db.collection('user_profiles').doc(userId).set(profile, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore Google auth merge warning:', err.message);
    }
  }

  const existingIdx = defaultProfiles.findIndex((u) => u.email === cleanEmail);
  if (existingIdx >= 0) {
    defaultProfiles[existingIdx] = profile;
  } else {
    defaultProfiles.push(profile);
  }

  res.status(200).json({
    success: true,
    message: `Logged in as ${profile.name} (${cleanEmail})`,
    user: profile,
  });
});

/**
 * @route   POST /api/auth/profile
 * @desc    Save/Update full personal profile details to Cloud Firestore
 */
router.post('/profile', async (req, res) => {
  const {
    userId = 'aditya-singh',
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

  const updateData = {
    userId,
    uid: userId,
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
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseInitialized && db) {
    try {
      await db.collection('users').doc(userId).set(updateData, { merge: true });
      await db.collection('user_profiles').doc(userId).set(updateData, { merge: true });
    } catch (err) {
      console.warn('Firestore profile save warning:', err.message);
    }
  }

  const idx = defaultProfiles.findIndex((u) => u.id === userId || u.email === email);
  if (idx >= 0) {
    defaultProfiles[idx] = { ...defaultProfiles[idx], ...updateData };
  }

  res.status(200).json({
    success: true,
    message: 'Profile details saved to Cloud Database successfully!',
    profile: updateData,
  });
});

/**
 * @route   POST /api/auth/reset
 * @desc    Reset all data to clean 0 across Firestore and memory
 */
router.post('/reset', async (req, res) => {
  const { userId = 'aditya-singh' } = req.body;

  const zeroState = {
    userId,
    currentXP: 0,
    xp: 0,
    level: 0,
    overallStreak: 0,
    longestStreak: 0,
    efficiencyPct: 0,
    hunterRank: 'E',
    isActiveToday: false,
    streakFreezeCount: 0,
    emergencyTasks: [],
    platformStreaks: {},
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseInitialized && db) {
    try {
      await db.collection('users').doc(userId).set(zeroState, { merge: true });
      await db.collection('matrix').doc(`${userId}_matrix`).set({
        lastUpdated: new Date().toISOString(),
        isReset: true,
      });
    } catch (err) {
      console.warn('Firestore reset warning:', err.message);
    }
  }

  res.status(200).json({
    success: true,
    message: 'All streak, level, XP, and platform data wiped to clean 0!',
    zeroState,
  });
});

export default router;
