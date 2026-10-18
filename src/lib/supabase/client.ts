import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('[Supabase] No se pudo inicializar el cliente:', err);
  }
}

export const supabase = supabaseInstance;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseKey && supabaseInstance);
};
