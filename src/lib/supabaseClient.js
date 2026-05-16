import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://jfabxqqxchjclniorsja.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmYWJ4cXF4Y2hqY2xuaW9yc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzQzNDEsImV4cCI6MjA5Mjk1MDM0MX0.AFN1Y-rtVLUhbcNK2cpws9i9vxyUPlfKF_ZkRkhxbvc'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)