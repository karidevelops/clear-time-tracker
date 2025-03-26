
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Using environment variables injected during build time
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://fhndizppvyufvbejkqzj.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobmRpenBwdnl1ZnZiZWprcXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxOTEwNjQsImV4cCI6MjA1Nzc2NzA2NH0.L5bGoyZs0ZY5dRQPV53fLBk_ieJDtwB979W3Iq4T5tY";

// Check if we're using environment variables or fallbacks
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "Using fallback Supabase credentials. For production, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables."
  );
}

// Create the Supabase client with proper authentication options
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
