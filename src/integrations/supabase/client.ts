import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rziuqjxcgizyjerpfjqq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6aXVxanhjZ2l6eWplcnBmanFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTAwMzksImV4cCI6MjA3MTEyNjAzOX0.3ipRXB3v-QT_TmSQrovxHo2Wm72N7t09Rp8T_AsMfww";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});