// Firebase Integration with Offline-First Persistence & Mock Fallback

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { UserProfile, ActivityItem, HistoricalDayRecord } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  !firebaseConfig.apiKey.includes('YourFirebaseApiKey')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    // Enable offline persistence in browser
    try {
      enableIndexedDbPersistence(db).catch((err) => {
        console.warn('Firestore offline persistence warning:', err.code);
      });
    } catch {
      // Ignore if multi-tab or already enabled
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

export { app, auth, db };

/**
 * Save user profile to Firestore & Local Storage
 */
export async function syncUserProfile(user: UserProfile): Promise<void> {
  localStorage.setItem('effstreak_user', JSON.stringify(user));

  if (db && user.uid) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { ...user, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Could not sync user to Firestore (operating offline):', err);
    }
  }
}

/**
 * Save current activities state to Firestore & Local Storage
 */
export async function syncActivities(userId: string, activities: ActivityItem[]): Promise<void> {
  localStorage.setItem('effstreak_activities', JSON.stringify(activities));

  if (db && userId) {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'users', userId, 'daily_plans', dateStr);
      await setDoc(docRef, { activities, date: dateStr, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Could not sync activities to Firestore (operating offline):', err);
    }
  }
}

/**
 * Save history records
 */
export async function syncHistoryRecord(userId: string, record: HistoricalDayRecord): Promise<void> {
  if (db && userId) {
    try {
      const docRef = doc(db, 'users', userId, 'history', record.date);
      await setDoc(docRef, record, { merge: true });
    } catch (err) {
      console.warn('Could not sync history to Firestore (operating offline):', err);
    }
  }
}

/**
 * Real-time listener for user profile
 */
export function subscribeToUserProfile(userId: string, onUpdate: (user: UserProfile) => void): () => void {
  if (!db || !userId) {
    return () => {};
  }

  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as UserProfile);
    }
  });
}
