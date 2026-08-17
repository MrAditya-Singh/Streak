import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { app, isFirebaseConfigured } from './firebase';

// Reuse the same Firebase app instance from firebase.ts — NEVER create a duplicate!
const _auth = (isFirebaseConfigured && app) ? getAuth(app) : null;
export { _auth as auth };
export const googleProvider = new GoogleAuthProvider();

/**
 * ⚡ Sign In with Google Popup
 */
export async function signInWithGoogle(): Promise<{ user: User | null; token?: string; error?: string }> {
  if (!_auth) throw new Error('Firebase not configured. Add your .env credentials.');
  try {
    const result = await signInWithPopup(_auth, googleProvider);
    const token = await result.user.getIdToken();
    return { user: result.user, token };
  } catch (err: any) {
    throw new Error(err.message || 'Google Sign-In failed');
  }
}

/**
 * ⚡ Sign In with Email & Password
 */
export async function signInWithEmail(email: string, pass: string) {
  if (!_auth) throw new Error('Firebase not configured.');
  try {
    const result = await signInWithEmailAndPassword(_auth, email, pass);
    const token = await result.user.getIdToken();
    return { user: result.user, token };
  } catch (err: any) {
    throw new Error(err.message);
  }
}

/**
 * ⚡ Register with Email & Password
 */
export async function registerWithEmail(email: string, pass: string) {
  if (!_auth) throw new Error('Firebase not configured.');
  try {
    const result = await createUserWithEmailAndPassword(_auth, email, pass);
    const token = await result.user.getIdToken();
    return { user: result.user, token };
  } catch (err: any) {
    throw new Error(err.message);
  }
}

/**
 * ⚡ Sign Out
 */
export async function logOutUser() {
  if (_auth) await signOut(_auth);
}

/**
 * ⚡ Auth State Listener
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  if (!_auth) { callback(null); return () => {}; }
  return onAuthStateChanged(_auth, callback);
}
