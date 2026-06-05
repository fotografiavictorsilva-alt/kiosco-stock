import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dxdpicrfjkdmliyyouwo.supabase.co'
const SUPABASE_KEY = 'sb_publishable_DIGIR2ZOZrdutHtQx67cyQ_1x3pVrrh'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)