import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Medication = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type MedicationLog = {
  id: string;
  medication_id: string;
  user_id: string;
  date: string;
  taken: boolean;
  created_at: string;
  updated_at: string;
};
