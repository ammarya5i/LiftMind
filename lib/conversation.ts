import { supabase } from './supabase'
import { getTrainingTypeLabel } from './training-type'

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/**
 * Save a conversation turn (user message + AI response) to the database
 */
export async function saveConversation(
  userId: string,
  userMessage: string,
  aiResponse: string
) {
  try {
    // @ts-expect-error - Supabase generated types sometimes don't align perfectly with runtime
    const { error } = await supabase.from('sessions').insert({
      user_id: userId,
      summary: `User: ${userMessage.substring(0, 100)}... | Coach: ${aiResponse.substring(0, 100)}...`,
      data: {
        type: 'conversation',
        user_message: userMessage,
        ai_response: aiResponse,
        timestamp: new Date().toISOString(),
      },
    })

    if (error) {
      console.error('Error saving conversation:', error)
    }
  } catch (error) {
    console.error('Error saving conversation:', error)
  }
}

/**
 * Load recent conversation history for context
 */
export async function loadConversationHistory(
  userId: string,
  limit: number = 20
): Promise<ConversationMessage[]> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    if (!data || data.length === 0) return []

    // Convert to conversation messages
    const messages: ConversationMessage[] = []
    
    for (const session of (data as any[]).reverse()) {
      if (session.data && typeof session.data === 'object') {
        const sessionData = session.data as any
        
        if (sessionData.type === 'conversation') {
          // Add user message
          if (sessionData.user_message) {
            messages.push({
              role: 'user',
              content: sessionData.user_message,
              timestamp: new Date(session.created_at),
            })
          }
          
          // Add AI response
          if (sessionData.ai_response) {
            messages.push({
              role: 'assistant',
              content: sessionData.ai_response,
              timestamp: new Date(session.created_at),
            })
          }
        }
      }
    }

    return messages
  } catch (error) {
    console.error('Error loading conversation history:', error)
    return []
  }
}

/**
 * Get user context for AI prompt
 */
export async function getUserContext(userId: string): Promise<string> {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, preferences')
      .eq('id', userId)
      .single()

    if (userError || !user) return ''

    const userData = user as any

    // Get all workouts to calculate 1RMs
    const { data: allWorkoutsData, error: workoutsError } = await supabase
      .from('workouts')
      .select('date, lifts, notes')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    const allWorkouts = allWorkoutsData as any

    // Get recent workouts for context
    const recentWorkouts = (allWorkouts as any[])?.slice(0, 3) || []

    const contextParts: string[] = []

    // User info
    if (userData.name) {
      contextParts.push(`Athlete: ${userData.name}`)
    }

    if (userData.preferences) {
      const prefs = userData.preferences as any
      if (prefs.experience) {
        contextParts.push(`Experience: ${prefs.experience}`)
      }
      if (prefs.goal) {
        contextParts.push(`Goal: ${prefs.goal}`)
      }
      if (prefs.focusArea) {
        contextParts.push(`Focus: ${prefs.focusArea}`)
      }
      if (prefs.units) {
        contextParts.push(`Units: ${prefs.units}`)
      }
      if (prefs.trainingType) {
        contextParts.push(`Training Type: ${getTrainingTypeLabel(prefs.trainingType)}`)
      }
    }

    // Calculate current 1RMs from single-rep sets (actual PRs, not estimated)
    const calculate1RM = (liftName: string): number => {
      const workoutsArray = Array.isArray(allWorkouts) ? allWorkouts : []
      if (workoutsArray.length === 0) return 0

      let best1RM = 0

      workoutsArray.forEach((workout: any) => {
        const lift = (workout.lifts as any[]).find((l: any) => 
          l.exercise && l.exercise.toLowerCase().includes(liftName.toLowerCase())
        )

        if (!lift || !lift.sets || lift.sets.length === 0) return

        // Find single-rep sets (actual 1RMs)
        const singles = lift.sets.filter((set: any) => 
          set.completed !== false && set.reps === 1
        )

        if (singles.length > 0) {
          const bestWeight = singles.reduce((max: number, set: any) => 
            Math.max(max, set.weight), 0
          )
          if (bestWeight > best1RM) {
            best1RM = bestWeight
          }
        }
      })

      return best1RM
    }

    const squat1RM = calculate1RM('squat')
    const bench1RM = calculate1RM('bench')
    const deadlift1RM = calculate1RM('deadlift')

    // Add 1RMs to context
    if (squat1RM > 0 || bench1RM > 0 || deadlift1RM > 0) {
      const oneRMs: string[] = []
      if (squat1RM > 0) oneRMs.push(`Squat: ${squat1RM}${userData.preferences && (userData.preferences as any).units ? ' ' + (userData.preferences as any).units : 'kg'}`)
      if (bench1RM > 0) oneRMs.push(`Bench Press: ${bench1RM}${userData.preferences && (userData.preferences as any).units ? ' ' + (userData.preferences as any).units : 'kg'}`)
      if (deadlift1RM > 0) oneRMs.push(`Deadlift: ${deadlift1RM}${userData.preferences && (userData.preferences as any).units ? ' ' + (userData.preferences as any).units : 'kg'}`)
      
      if (oneRMs.length > 0) {
        contextParts.push(`Current 1RMs: ${oneRMs.join(', ')}`)
      }
    }

    // Recent workouts
    if (!workoutsError && recentWorkouts.length > 0) {
      const workoutSummaries = recentWorkouts.map((w: any) => {
        const exercises = (w.lifts as any[]).map((l: any) => l.exercise).join(', ')
        return `${w.date}: ${exercises}`
      }).join(' | ')
      
      contextParts.push(`Recent workouts: ${workoutSummaries}`)
    }

    return contextParts.length > 0 
      ? `\n\nCONTEXT ABOUT THIS ATHLETE:\n${contextParts.join('\n')}\n`
      : ''
  } catch (error) {
    console.error('Error getting user context:', error)
    return ''
  }
}

