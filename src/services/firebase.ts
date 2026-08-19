// Firebase Integration with UID-Isolated Firestore Storage & Subcollections

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  onSnapshot,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { UserProfile, ActivityItem, EmergencyTask, ActivityLogEntry } from '../types';

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
  firebaseConfig.apiKey.length > 20
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    try {
      enableIndexedDbPersistence(db).catch((err) => {
        console.warn('Firestore offline persistence notice:', err.code);
      });
    } catch {
      // Ignore multi-tab persistence warnings
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

export { app, auth, db };

export interface UserCloudState {
  user: UserProfile;
  activities: ActivityItem[];
  matrixState: Record<string, boolean[]>;
  emergencyTasks: EmergencyTask[];
  logs?: ActivityLogEntry[];
  updatedAt: number;
}

/**
 * ⚡ Save Full User Cloud State under users/{uid}/data/state
 * Safe granular setDoc with merge: true to avoid document destruction.
 */
export async function syncFullStateToFirestore(uid: string, state: Partial<UserCloudState>): Promise<void> {
  if (!db || !uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    const dataRef = doc(db, 'users', uid, 'data', 'state');

    const now = Date.now();
    const payload = {
      ...state,
      updatedAt: now,
    };

    // Save profile metadata on root user doc
    if (state.user) {
      await setDoc(userRef, {
        uid,
        email: state.user.email || '',
        name: state.user.name || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    // Save detailed application state under users/{uid}/data/state
    await setDoc(dataRef, payload, { merge: true });
  } catch (err) {
    console.warn('Firestore sync error:', err);
  }
}

/**
 * ⚡ Subscribe to Real-Time Cloud Updates under users/{uid}/data/state
 * Returns unsubscribe function.
 */
export function subscribeToFirestoreFullState(
  uid: string,
  onUpdate: (state: UserCloudState | null, exists: boolean) => void
): () => void {
  if (!db || !uid) {
    onUpdate(null, false);
    return () => {};
  }
  try {
    const dataRef = doc(db, 'users', uid, 'data', 'state');
    return onSnapshot(dataRef, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as UserCloudState, true);
      } else {
        onUpdate(null, false);
      }
    }, (error) => {
      console.warn('Firestore snapshot error:', error.message);
      onUpdate(null, false);
    });
  } catch (err) {
    console.warn('Firestore subscription failed:', err);
    return () => {};
  }
}

/**
 * 🗑️ Delete User Cloud Data completely (e.g. account wipe)
 */
export async function deleteUserProfileDoc(uid: string): Promise<void> {
  if (!db || !uid) return;
  try {
    const dataRef = doc(db, 'users', uid, 'data', 'state');
    const userRef = doc(db, 'users', uid);
    await deleteDoc(dataRef);
    await deleteDoc(userRef);
  } catch (err) {
    console.warn('Firestore delete error:', err);
  }
}
