import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzfmpkprenezcuvshomd.supabase.co';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Zm1wa3ByZW5lemN1dnNob21kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjA5NTk2NSwiZXhwIjoyMTA3NjcxOTY1fQ.FSbkPuU06Yo6dkmBUsNdVdKgopQa9bzvW229cY0hPug';

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

