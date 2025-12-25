import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Create a singleton instance to avoid multiple clients warning
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()

// Helper functions for common queries
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  // Don't throw error for missing session, just return null
  if (error && !error.message.includes('session')) {
    console.error('Auth error:', error)
  }
  return user
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateUserProfile(userId: string, updates: Database['public']['Tables']['users']['Update']) {
  const { data, error } = await supabase
    .from('users')
    // @ts-expect-error - Supabase generated types sometimes don't align perfectly
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getWorkouts(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getTodayWorkout(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()
  
  if (error) throw error
  return data
}

export async function getRecentSessions(userId: string, limit: number = 5) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

export async function getUserPrograms(userId: string) {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

