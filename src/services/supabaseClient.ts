import { createClient } from '@supabase/supabase-js';
import { apiClient } from './apiClient';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);
export const supabase = url && key ? createClient(url, key) : null;

supabase?.auth.onAuthStateChange((_event, session) => {
  if (session?.access_token) apiClient.setToken(session.access_token);
  else apiClient.clearToken();
});
