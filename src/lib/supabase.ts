import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL
    : '') || '';

export const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
      import.meta.env.PUBLIC_SUPABASE_KEY ||
      import.meta.env.SUPABASE_KEY
    : '') || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
