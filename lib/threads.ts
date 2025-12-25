import { supabase } from './supabase'

export interface Thread {
  id: string
  user_id: string
  title: string
  topic: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface ThreadMessage {
  id: string
  thread_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

/**
 * Get all threads for a user
 */
export async function getUserThreads(userId: string): Promise<Thread[]> {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Create a new thread
 */
export async function createThread(
  userId: string,
  title: string,
  topic: string
): Promise<Thread> {
  const { data, error } = await supabase
    .from('threads')
    // @ts-expect-error - Supabase generated types sometimes don't align perfectly with runtime
    .insert({
      user_id: userId,
      title,
      topic,
      message_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get messages for a specific thread
 */
export async function getThreadMessages(threadId: string): Promise<ThreadMessage[]> {
  const { data, error } = await supabase
    .from('thread_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Add message to thread
 */
export async function addMessageToThread(
  threadId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  // Add message
  const { error: messageError } = await supabase
    .from('thread_messages')
    // @ts-expect-error - Supabase generated types sometimes don't align perfectly with runtime
    .insert({
      thread_id: threadId,
      user_id: userId,
      role,
      content,
    })

  if (messageError) throw messageError

  // Update thread's message count and updated_at
  // First get the current message count
  const { data: thread } = await supabase
    .from('threads')
    .select('message_count')
    .eq('id', threadId)
    .single()

  const newCount = ((thread as any)?.message_count || 0) + 1

  const { error: updateError } = await supabase
    .from('threads')
    // @ts-expect-error - Supabase generated types sometimes don't align perfectly with runtime
    .update({
      updated_at: new Date().toISOString(),
      message_count: newCount,
    })
    .eq('id', threadId)

  if (updateError) console.error('Error updating thread:', updateError)
}

/**
 * Delete a thread and all its messages
 */
export async function deleteThread(threadId: string): Promise<void> {
  const { error } = await supabase
    .from('threads')
    .delete()
    .eq('id', threadId)

  if (error) throw error
}

/**
 * Update thread title
 */
export async function updateThreadTitle(threadId: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('threads')
    // @ts-expect-error - Supabase generated types sometimes don't align perfectly with runtime
    .update({ title })
    .eq('id', threadId)

  if (error) throw error
}

