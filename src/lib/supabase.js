import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// During development before Supabase is wired up, use a dummy valid URL
// so createClient doesn't throw and the UI still renders.
const url = supabaseUrl?.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient(url, key)

/** True when real Supabase credentials are present */
export const supabaseReady =
  !!supabaseUrl?.startsWith('http') && !!supabaseAnonKey && supabaseAnonKey !== 'placeholder-key'
