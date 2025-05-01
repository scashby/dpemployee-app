import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bntoivaipesuovselglg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudG9pdmFpcGVzdW92c2VsZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNTk4ODAsImV4cCI6MjA2MDkzNTg4MH0.uDeEUal876k9isQio0svNEQe1EFC0Q_yKZDy8-vLslM';
export const supabase = createClient(supabaseUrl, supabaseKey);
