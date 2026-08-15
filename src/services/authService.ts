// Firebase Authentication Service & Guest Mode Fallback

import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isConfigured: boolean;
}

export async function loginWithGoogle(): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) {
    console.info('Operating in Local/Guest Mode');
    return null;
  }

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) {
    return null;
  }
  const creds = await signInWithEmailAndPassword(auth, email, pass);
  return creds.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) {
    return null;
  }
  const creds = await createUserWithEmailAndPassword(auth, email, pass);
  return creds.user;
}

export async function logoutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
  localStorage.removeItem('effstreak_auth_user');
}

export function subscribeToAuth(callback: (authState: AuthState) => void): () => void {
  if (!isFirebaseConfigured || !auth) {
    callback({
      user: null,
      isAuthenticated: false,
      isGuest: true,
      isConfigured: false,
    });
    return () => {};
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    callback({
      user: firebaseUser,
      isAuthenticated: !!firebaseUser,
      isGuest: !firebaseUser,
      isConfigured: true,
    });
  });
}
