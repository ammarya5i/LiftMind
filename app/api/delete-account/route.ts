import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // First, delete all user data from database tables
    await Promise.all([
      supabaseAdmin.from('thread_messages').delete().eq('user_id', userId),
      supabaseAdmin.from('threads').delete().eq('user_id', userId),
      supabaseAdmin.from('programs').delete().eq('user_id', userId),
      supabaseAdmin.from('sessions').delete().eq('user_id', userId),
      supabaseAdmin.from('workouts').delete().eq('user_id', userId),
      supabaseAdmin.from('users').delete().eq('id', userId)
    ])

    // Delete the auth user using admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete authentication account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete-account API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

