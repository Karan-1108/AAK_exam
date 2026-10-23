import type { User, UserRole } from '../types';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { apiClient } from './apiClient';

type Profile = { id: string; display_name: string; role: UserRole; student_id: string | null; created_at: string };

function requireClient() {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Authentication is not configured yet. Add the Supabase URL and publishable key to your environment.');
  }
  return supabase;
}

function toUser(profile: Profile, email: string): User {
  return {
    id: profile.id,
    username: email.split('@')[0],
    displayName: profile.display_name,
    email,
    role: profile.role,
    studentId: profile.student_id || undefined,
    teacherId: profile.role === 'teacher' ? profile.id : undefined,
    createdAt: profile.created_at,
  };
}

async function getProfile(userId: string, email: string): Promise<User> {
  const client = requireClient();
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) throw new Error('Your account profile is missing. Ask an administrator to complete account setup.');
  return toUser(data as Profile, email);
}

export const AuthService = {
  async getCurrentUser(): Promise<User | null> {
    const client = requireClient();
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user?.email) {
      apiClient.clearToken();
      return null;
    }
    const { data: { session } } = await client.auth.getSession();
    if (session?.access_token) apiClient.setToken(session.access_token);
    return getProfile(user.id, user.email);
  },

  async login(email: string, password: string, expectedRole: 'student' | 'teacher'): Promise<User> {
    const client = requireClient();
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user?.email) throw new Error(error?.message || 'Unable to sign in. Check your email and password.');
    if (data.session?.access_token) apiClient.setToken(data.session.access_token);
    const user = await getProfile(data.user.id, data.user.email);
    if (user.role !== expectedRole) {
      try {
        await client.auth.signOut();
      } finally {
        apiClient.clearToken();
      }
      throw new Error(expectedRole === 'teacher'
        ? 'This account does not have teacher access. Ask an administrator to approve your teacher account.'
        : 'This account is not registered as a student. Use the Teacher Portal if you are an instructor.');
    }
    return user;
  },

  async register(params: { email: string; password: string; displayName: string; studentId?: string }): Promise<{ user: User | null; confirmationRequired: boolean }> {
    const client = requireClient();
    const email = params.email.trim().toLowerCase();
    const { data, error } = await client.auth.signUp({
      email,
      password: params.password,
      options: {
        data: { display_name: params.displayName.trim(), student_id: params.studentId?.trim() || null },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Account creation did not return a user. Please try again.');
    if (data.session?.access_token) apiClient.setToken(data.session.access_token);
    if (!data.session) return { user: null, confirmationRequired: true };
    return { user: await getProfile(data.user.id, email), confirmationRequired: false };
  },

  async logout(): Promise<void> {
    if (!supabase) {
      apiClient.clearToken();
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    apiClient.clearToken();
  },

  async requestPasswordReset(email: string): Promise<void> {
    const client = requireClient();
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) throw new Error(error.message);
  },

  async updatePassword(password: string): Promise<void> {
    const client = requireClient();
    const { error } = await client.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },

  isConfigured: isSupabaseConfigured,
};
