import { Router } from 'express';
import { db, isFirebaseInitialized } from '../config/firebase.js';

const router = Router();

// In-memory profiles list for local fallback
const defaultProfiles = [
  {
    id: 'local_user_1',
    name: 'Aditya (Solo Hunter)',
    email: 'aditya@streak.local',
    hunterRank: 'A',
    level: 18,
    avatar: '/images/char_hero.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'student_mode',
    name: 'Academic & GATE Prep',
    email: 'study@streak.local',
    hunterRank: 'B',
    level: 12,
    avatar: '/images/char_leetcode.jpg',
    createdAt: new Date().toISOString(),
  },
];

/**
 * @route   GET /api/auth/users
 * @desc    Get list of available profiles for quick personal account switching
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
 * @route   POST /api/auth/register
 * @desc    Register a new user / create a profile
 */
router.post('/register', async (req, res) => {
  const { name, email, avatar } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const userId = `user_${Date.now().toString().slice(-6)}`;
  const newProfile = {
    id: userId,
    name: name.trim(),
    email: (email || `${name.toLowerCase().replace(/\s+/g, '_')}@streak.local`).trim(),
    hunterRank: 'E',
    level: 1,
    currentXP: 0,
    overallStreak: 1,
    avatar: avatar || '/images/char_hero.jpg',
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseInitialized && db) {
    try {
      await db.collection('user_profiles').doc(userId).set(newProfile);
    } catch (err) {
      console.warn('Could not save to Firestore user_profiles:', err.message);
    }
  }

  defaultProfiles.push(newProfile);

  res.status(201).json({
    success: true,
    message: `Account created for ${name}!`,
    user: newProfile,
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate or switch active profile
 */
router.post('/login', async (req, res) => {
  const { userId, email } = req.body;

  let foundUser = defaultProfiles.find((u) => u.id === userId || (email && u.email.toLowerCase() === email.toLowerCase()));

  if (!foundUser && isFirebaseInitialized && db) {
    try {
      if (userId) {
        const doc = await db.collection('user_profiles').doc(userId).get();
        if (doc.exists) foundUser = doc.data();
      }
    } catch (err) {
      // ignore
    }
  }

  if (!foundUser) {
    foundUser = defaultProfiles[0];
  }

  res.status(200).json({
    success: true,
    message: `Welcome back, ${foundUser.name}!`,
    user: foundUser,
  });
});

export default router;
