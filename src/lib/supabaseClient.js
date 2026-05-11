import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://waszqpcofsthbvdeuqer.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhc3pxcGNvZnN0aGJ2ZGV1cWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTc5MjcsImV4cCI6MjA5Mjk3MzkyN30.8bN7brQUpBhUF40e7GsgGBS7Qmfiav99cQad3thJvfE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
