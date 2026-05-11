import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wflnfbtnhuoayelajtpr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbG5mYnRuaHVvYXllbGFqdHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODkyMzksImV4cCI6MjA5MjA2NTIzOX0.NXKb1Ko0nF57pyW6OGnFlN_R-OGADoO6yHfl6Xf8z4w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
