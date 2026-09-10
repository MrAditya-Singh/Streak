// Supabase Authentication Service & Guest Mode Fallback

import { supabase, isSupabaseConfigured } from './supabase';
import { AuthUser } from './supabaseAuth';

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isConfigured: boolean;
}

export async function loginWithGoogle(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured || !supabase) {
    console.info('Operating in Local/Guest Mode');
    return null;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) throw error;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return {
      uid: session.user.id,
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
      photoURL: session.user.user_metadata?.avatar_url,
    };
  }
  return null;
}

export async function loginWithEmail(email: string, pass: string): Promise<AuthUser | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  if (error) throw error;
  if (!data.user) return null;
  return {
    uid: data.user.id,
    id: data.user.id,
    email: data.user.email,
    displayName: data.user.user_metadata?.full_name || email.split('@')[0],
    photoURL: data.user.user_metadata?.avatar_url,
  };
}

export async function registerWithEmail(email: string, pass: string): Promise<AuthUser | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
  });
  if (error) throw error;
  if (!data.user) return null;
  return {
    uid: data.user.id,
    id: data.user.id,
    email: data.user.email,
    displayName: data.user.user_metadata?.full_name || email.split('@')[0],
  };
}

export async function logoutUser(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('effstreak_auth_user');
}

export function subscribeToAuth(callback: (authState: AuthState) => void): () => void {
  if (!isSupabaseConfigured || !supabase) {
    callback({
      user: null,
      isAuthenticated: false,
      isGuest: true,
      isConfigured: false,
    });
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({
        user: {
          uid: session.user.id,
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          photoURL: session.user.user_metadata?.avatar_url,
        },
        isAuthenticated: true,
        isGuest: false,
        isConfigured: true,
      });
    } else {
      callback({
        user: null,
        isAuthenticated: false,
        isGuest: true,
        isConfigured: true,
      });
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}
