import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env variables
dotenv.config({ path: new URL('../.env', import.meta.url) });
dotenv.config({ path: new URL('./.env', import.meta.url) });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;