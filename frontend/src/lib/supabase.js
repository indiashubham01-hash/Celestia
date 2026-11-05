import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ngrbwxdvpndyzmarzcxy.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_aQqCUXv3_jNN9rCG8a8ETg_CG7SlwrP';

export const supabase = createClient(supabaseUrl, supabaseKey);
