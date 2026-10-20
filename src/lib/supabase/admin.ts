import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzfmpkprenezcuvshomd.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let adminInstance: SupabaseClient | null = null;

if (supabaseUrl && serviceRoleKey) {
  try {
    adminInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err) {
    console.warn('[Supabase Admin] No se pudo inicializar cliente admin:', err);
  }
}

export const supabaseAdmin = adminInstance;

