import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dppykzbxaxtemgomwcvi.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcHlremJ4YXh0ZW1nb213Y3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDA0NDEsImV4cCI6MjA2MTY3NjQ0MX0._gIlq0Jaf_DfRDes7zev3Fl7ASCMtgNI_OqtN8k1hIU';

export const supabase = createClient(supabaseUrl, supabaseKey);
