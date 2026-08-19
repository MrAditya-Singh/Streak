import { Router } from 'express';
import { db, isFirebaseInitialized } from '../config/firebase.js';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.middleware.js';

const router = Router();

/**
 * @route   GET /api/auth/me
 * @desc    Protected authentication test endpoint (verifies Firebase ID Token)
 */
router.get('/me', verifyFirebaseToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Firebase ID Token verified successfully by backend!',
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// In-memory profiles list for local fallback
let defaultProfiles = [
  {
    id: 'local_authenticated_dev_user',
    name: 'Local User',
    email: 'user@example.com',
    age: 25,
    bloodGroup: 'A+',
    height: '170 cm',
    weight: '65 kg',
    resident: 'Unknown',
    phoneNumber: '+1 555 010 0000',
    bio: 'Local development profile',
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
router.get('/users', verifyFirebaseToken, async (req, res) => {
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
 * @route   GET /api/auth/user-profile
 * @desc    Fetch authenticated user profile from Cloud Firestore using verified Firebase UID
 */
router.get('/user-profile', verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;

  let profile = {
    id: uid,
    uid: uid,
    email: req.user.email,
    name: req.user.name || req.user.email?.split('@')[0] || 'Hunter',
    avatarUrl: '/images/char_hero.jpg',
    hunterRank: 'E',
    level: 0,
    currentXP: 0,
    overallStreak: 0,
    longestStreak: 0,
    age: null,
    bloodGroup: '',
    height: '',
    weight: '',
    resident: '',
    phoneNumber: '',
    bio: '',
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseInitialized && db) {
    try {
      const docRef = db.collection('users').doc(uid);
      const existing = await docRef.get();
      if (existing.exists) {
        profile = { ...profile, ...existing.data(), uid };
      } else {
        await docRef.set(profile, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore user profile fetch warning:', err.message);
    }
  }

  res.status(200).json({
    success: true,
    user: profile,
  });
});

/**
 * @route   POST /api/auth/google
 * @desc    Google / Gmail Sign-In & Unified Multi-Device Profile Fetch (supports Firebase UID & token verification)
 */
router.post('/google', verifyFirebaseToken, async (req, res) => {
  const { email, name, avatarUrl, googleId } = req.body;

  const verifiedUid = req.user.uid;
  const verifiedEmail = (req.user.email || email || '').trim().toLowerCase();

  if (!verifiedEmail && !verifiedUid) {
    return res.status(400).json({ error: 'Email or Firebase UID is required for Google Sign-In' });
  }

  const targetDocId = verifiedUid || verifiedEmail.replace(/[^a-z0-9]/g, '_');

  let profile = {
    id: targetDocId,
    uid: targetDocId,
    email: verifiedEmail,
    name: name || verifiedEmail.split('@')[0] || 'Hunter',
    avatarUrl: avatarUrl || '/images/char_hero.jpg',
    googleId: googleId || '',
    hunterRank: 'E',
    level: 0,
    currentXP: 0,
    overallStreak: 0,
    longestStreak: 0,
    age: null,
    bloodGroup: '',
    height: '',
    weight: '',
    resident: '',
    phoneNumber: '',
    bio: '',
    lastActiveDate: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseInitialized && db) {
    try {
      const docRef = db.collection('users').doc(targetDocId);
      const existing = await docRef.get();
      if (existing.exists) {
        profile = { ...profile, ...existing.data(), ...(verifiedEmail && { email: verifiedEmail }) };
      } else {
        await docRef.set(profile, { merge: true });
        await db.collection('user_profiles').doc(targetDocId).set(profile, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore Google auth merge warning:', err.message);
    }
  }

  const existingIdx = defaultProfiles.findIndex((u) => u.email === verifiedEmail || u.id === targetDocId);
  if (existingIdx >= 0) {
    defaultProfiles[existingIdx] = profile;
  } else {
    defaultProfiles.push(profile);
  }

  res.status(200).json({
    success: true,
    message: `Logged in as ${profile.name} (${verifiedEmail || targetDocId})`,
    user: profile,
  });
});

/**
 * @route   POST /api/auth/profile
 * @desc    Save/Update full personal profile details to Cloud Firestore
 */
router.post('/profile', verifyFirebaseToken, async (req, res) => {
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

  const updateData = {
    userId: targetId,
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
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseInitialized && db) {
    try {
      await db.collection('users').doc(targetId).set(updateData, { merge: true });
      await db.collection('user_profiles').doc(targetId).set(updateData, { merge: true });
    } catch (err) {
      console.warn('Firestore profile save warning:', err.message);
    }
  }

  const idx = defaultProfiles.findIndex((u) => u.id === targetId || u.email === email);
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
router.post('/reset', verifyFirebaseToken, async (req, res) => {
  const userId = req.user.uid;

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
