// Firebase Integration with Offline-First Persistence & Mock Fallback

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
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
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.length > 20 // real key is long; placeholder is short
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

/**
 * 🔑 Cross-Device Unified Account Linker (Gmail + Phone number)
 * Resolves both identifiers to the exact same accountId document doc.
 */
export async function resolveAccountId(email: string, phoneNumber: string): Promise<string> {
  if (!db) return 'user_aditya_canonical';

  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phoneNumber.trim().replace(/[^0-9]/g, '');

  if (!cleanEmail && !cleanPhone) {
    return 'user_aditya_canonical';
  }

  const emailKey = cleanEmail ? `email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : '';
  const phoneKey = cleanPhone ? `phone_${cleanPhone}` : '';

  // 1. Try Email Mapping
  if (emailKey) {
    const emailMappingRef = doc(db, 'account_mappings', emailKey);
    const emailSnap = await getDoc(emailMappingRef);
    if (emailSnap.exists()) {
      const accountId = emailSnap.data().accountId;
      if (phoneKey) {
        const phoneMappingRef = doc(db, 'account_mappings', phoneKey);
        await setDoc(phoneMappingRef, { accountId, email: cleanEmail, phone: cleanPhone }, { merge: true });
      }
      return accountId;
    }
  }

  // 2. Try Phone Mapping
  if (phoneKey) {
    const phoneMappingRef = doc(db, 'account_mappings', phoneKey);
    const phoneSnap = await getDoc(phoneMappingRef);
    if (phoneSnap.exists()) {
      const accountId = phoneSnap.data().accountId;
      if (emailKey) {
        const emailMappingRef = doc(db, 'account_mappings', emailKey);
        await setDoc(emailMappingRef, { accountId, email: cleanEmail, phone: cleanPhone }, { merge: true });
      }
      return accountId;
    }
  }

  // 3. Create a brand new linked account ID
  const seed = cleanEmail || `phone_${cleanPhone}`;
  const newAccountId = `acc_${seed.replace(/[^a-z0-9]/g, '_').substring(0, 30)}_${Date.now()}`;

  if (emailKey) {
    const emailMappingRef = doc(db, 'account_mappings', emailKey);
    await setDoc(emailMappingRef, { accountId: newAccountId, email: cleanEmail, phone: cleanPhone });
  }
  if (phoneKey) {
    const phoneMappingRef = doc(db, 'account_mappings', phoneKey);
    await setDoc(phoneMappingRef, { accountId: newAccountId, email: cleanEmail, phone: cleanPhone });
  }

  return newAccountId;
}

/**
 * ⚡ Save Full Unified Application State to Firestore
 */
export async function syncFullStateToFirestore(userId: string, state: any): Promise<void> {
  if (!db || !userId) return;
  try {
    const docRef = doc(db, 'unified_sync', userId);
    const userRef = doc(db, 'users', userId);
    const isReset = Boolean(state?.isReset);

    if (isReset) {
      try {
        await deleteDoc(docRef);
        await deleteDoc(userRef);
      } catch {
        // Silently continue to overwrite
      }
    }

    const payload = { ...state, updatedAt: Date.now() };

    // Overwrite documents completely (merge: false) so old/deleted habits and pre-reset state are purged
    await setDoc(docRef, payload, { merge: false });
    await setDoc(userRef, payload, { merge: false });
  } catch (err) {
    console.warn('Firestore unified sync warning:', err);
  }
}

/**
 * 🗑️ Delete User Document completely from Firestore
 */
export async function deleteUserProfileDoc(userId: string): Promise<void> {
  if (!db || !userId) return;
  try {
    const docRef = doc(db, 'unified_sync', userId);
    const userRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
    await deleteDoc(userRef);
  } catch (err) {
    console.warn('Firestore delete warning:', err);
  }
}

/**
 * ⚡ Real-Time Full State Firestore Subscription (passes exist status)
 */
export function subscribeToFirestoreFullState(userId: string, onUpdate: (state: any, exists: boolean) => void): () => void {
  if (!db || !userId) return () => {};
  try {
    const docRef = doc(db, 'unified_sync', userId);
    return onSnapshot(docRef, (snap) => {
      onUpdate(snap.exists() ? snap.data() : null, snap.exists());
    });
  } catch {
    return () => {};
  }
}
