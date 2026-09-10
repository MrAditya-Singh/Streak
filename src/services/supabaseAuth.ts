import { supabase, isSupabaseConfigured } from './supabase';

export interface AuthUser {
  uid: string;
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

/**
 * ⚡ Sign In with Google OAuth via Supabase
 */
export async function signInWithGoogle(): Promise<{ user: AuthUser | null; token?: string; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (user) {
      const authUser: AuthUser = {
        uid: user.id,
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
        photoURL: user.user_metadata?.avatar_url,
      };
      localStorage.setItem('effstreak_auth_user', JSON.stringify(authUser));
      return {
        user: authUser,
        token: sessionData.session?.access_token,
      };
    }

    return { user: null };
  } catch (err: any) {
    throw new Error(err.message || 'Supabase Google OAuth failed');
  }
}

/**
 * ⚡ Sign In with Email & Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<{ user: AuthUser | null; token?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass,
    });

    if (error) throw error;
    if (!data.user) throw new Error('User not found');

    const authUser: AuthUser = {
      uid: data.user.id,
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0],
      photoURL: data.user.user_metadata?.avatar_url,
    };

    localStorage.setItem('effstreak_auth_user', JSON.stringify(authUser));
    if (data.user.email) {
      localStorage.setItem('effstreak_sync_email', data.user.email);
    }

    return {
      user: authUser,
      token: data.session?.access_token,
    };
  } catch (err: any) {
    throw new Error(err.message || 'Sign in failed');
  }
}

/**
 * ⚡ Register with Email & Password
 */
export async function registerWithEmail(email: string, pass: string): Promise<{ user: AuthUser | null; token?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: pass,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Registration failed');

    const authUser: AuthUser = {
      uid: data.user.id,
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.user_metadata?.full_name || email.split('@')[0],
    };

    localStorage.setItem('effstreak_auth_user', JSON.stringify(authUser));
    if (data.user.email) {
      localStorage.setItem('effstreak_sync_email', data.user.email);
    }

    return {
      user: authUser,
      token: data.session?.access_token,
    };
  } catch (err: any) {
    throw new Error(err.message || 'Registration failed');
  }
}

/**
 * ⚡ Get current user's session JWT token for backend API authentication
 */
export async function getCurrentUserToken(): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * ⚡ Sign Out
 */
export async function logOutUser(): Promise<void> {
  localStorage.removeItem('effstreak_auth_user');
  if (supabase) {
    await supabase.auth.signOut();
  }
}

/**
 * ⚡ Auth State Listener with Immediate Auto-Login Session Check
 */
export function onAuthStateChange(callback: (user: AuthUser | null, event?: string) => void): () => void {
  // Check stored auth session first for instant synchronous load
  try {
    const saved = localStorage.getItem('effstreak_auth_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.uid && parsed.uid !== 'guest_user_local') {
        callback(parsed, 'PERSISTED_STORAGE');
      }
    }
  } catch { /* ignore */ }

  if (!supabase || !isSupabaseConfigured) {
    return () => {};
  }

  // Check current session from Supabase immediately
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      const user: AuthUser = {
        uid: session.user.id,
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
        photoURL: session.user.user_metadata?.avatar_url,
      };
      localStorage.setItem('effstreak_auth_user', JSON.stringify(user));
      callback(user, 'INITIAL_SESSION');
    }
  }).catch(() => {});

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      const user: AuthUser = {
        uid: session.user.id,
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
        photoURL: session.user.user_metadata?.avatar_url,
      };
      localStorage.setItem('effstreak_auth_user', JSON.stringify(user));
      callback(user, event);
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('effstreak_auth_user');
      callback(null, event);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}
