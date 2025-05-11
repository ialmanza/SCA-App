import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://voxuvyquduqvpcjbeuff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveHV2eXF1ZHVxdnBjamJldWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MjkzNDQsImV4cCI6MjA2MjUwNTM0NH0.NwkOAUkRlg48rebpbaN7_6EOufRFZru6s6rByecm794';

export const supabase = createClient(supabaseUrl, supabaseKey); 