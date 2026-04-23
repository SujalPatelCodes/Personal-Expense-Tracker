import { createClient } from '@supabase/supabase-js';

// Your web app's Supabase configuration
// REPLACE these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wzbsddqoisigtpkbvqgx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6YnNkZHFvaXNpZ3Rwa2J2cWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjMwOTYsImV4cCI6MjA5MjQ5OTA5Nn0.dMDIG-YN-MNuuOSQgpu85OWmjXi2Td3wFXIuNUZagBw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
