import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 1. Standard client (For simple public reads if needed)
export const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Admin client (ONLY use this inside Next.js API Routes or Server Components)
export const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});