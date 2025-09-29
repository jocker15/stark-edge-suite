import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kpuqqqaqiwxbjpbmmcfz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdXFxcWFxaXd4YmpwYm1tY2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NzMyODUsImV4cCI6MjA3NDU0OTI4NX0.Rz_doNu-rxhq_-ixaTcSW_hZGeAhh4zWBqwfrmKErVc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)