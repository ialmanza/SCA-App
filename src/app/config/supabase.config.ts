import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ksrwjcosdnpqpxypydov.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcndqY29zZG5wcXB4eXB5ZG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTA3MjQsImV4cCI6MjA2MzQ4NjcyNH0.PQRHNXkTwbrS4fB1GDBDSjCf1AzuUNaci_SbILLaUYk'

export const supabase = createClient(supabaseUrl, supabaseKey);
