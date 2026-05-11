import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_STOCK_SUPABASE_URL || 'https://wflnfbtnhuoayelajtpr.supabase.co';
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_STOCK_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbG5mYnRuaHVvYXllbGFqdHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODkyMzksImV4cCI6MjA5MjA2NTIzOX0.NXKb1Ko0nF57pyW6OGnFlN_R-OGADoO6yHfl6Xf8z4w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
