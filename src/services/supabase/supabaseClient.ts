import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const SUPABASE_URL =
  metaEnv.VITE_SUPABASE_URL || 'https://vsysihbzjwbpvzuoaqrv.supabase.co';
const SUPABASE_ANON_KEY =
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeXNpaGJ6andicHZ6dW9hcXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTg2NjgsImV4cCI6MjEwNDA3NDY2OH0.swdJEM-HbMXAL11TApceWehAjFlraSuvbcjU-wIMg14';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your-project'));
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};
