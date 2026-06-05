import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dxdpicrfjkdmliyyouwo.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZHBpY3JmamtkbWxpeXlvdXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MzUxNjAsImV4cCI6MjA5NjIxMTE2MH0.XBxikoHXv9PHPheFRa0-w2oOt5gh6Di2IxBRyA4Ki9c'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)