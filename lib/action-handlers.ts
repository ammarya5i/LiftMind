import { supabase } from './supabase'
import { WorkoutAction, PRAction, ProfileAction } from '@/types/ai-actions'
import { calculateWorkoutMetrics } from './ai-actions'

/**
 * Save workout from AI conversation
 */
export async function saveWorkoutAction(
  userId: string,
  action: WorkoutAction
): Promise<{ success: boolean; error?: string; workoutId?: string }> {
  try {
    const metrics = calculateWorkoutMetrics(action.exercises)
    
    const workoutData = {
        user_id: userId,
        date: action.date || new Date().toISOString().split('T')[0],
        lifts: action.exercises.map(ex => ({
          exercise: ex.exercise,
          sets: Array.from({ length: ex.sets }, () => ({
            reps: ex.reps,
            weight: ex.weight,
            rpe: ex.rpe || 7,
            completed: true
          }))
        })),
        notes: action.notes || 'Logged via AI Coach',
        session_rpe: action.session_rpe || 7,
        total_reps: metrics.total_reps,
        total_volume: metrics.total_volume,
        working_sets: metrics.working_sets,
        rpe_adjusted_volume: metrics.rpe_adjusted_volume
    }

    const { data, error } = await supabase
      .from('workouts')
      // @ts-expect-error - Supabase generated types sometimes don't align perfectly with runtime
      .insert(workoutData)
      .select()
      .single()

    if (error) throw error

    return { success: true, workoutId: (data as any)?.id || '' }
  } catch (error) {
    console.error('Error saving workout:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save workout'
    }
  }
}

/**
 * Handle PR update from AI conversation
 */
export async function savePRAction(
  userId: string,
  action: PRAction
): Promise<{ success: boolean; error?: string; isNewPR?: boolean; previousPR?: number }> {
  try {
    // Get user's previous best for this lift
    const { data: workouts } = await supabase
      .from('workouts')
      .select('lifts, date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100)

    let previousBest = 0

    // Find previous PR for this exercise
    // Priority: actual single-rep sets first, then estimated e1RM
    workouts?.forEach((workout: any) => {
      workout.lifts?.forEach((lift: any) => {
        if (lift.exercise?.toLowerCase() === action.exercise.toLowerCase()) {
          // First, check for actual single-rep sets (true 1RMs)
          const singles = lift.sets?.filter((set: any) => set.completed !== false && set.reps === 1) || []
          
          if (singles.length > 0) {
            const bestSingle = singles.reduce((max: number, set: any) => Math.max(max, set.weight || 0), 0)
            if (bestSingle > previousBest) previousBest = bestSingle
          } else {
            // If no single-rep sets, use estimated e1RM
            lift.sets?.forEach((set: any) => {
              if (set.completed) {
                const e1rm = set.weight * (1 + set.reps / 30) // Epley formula
                if (e1rm > previousBest) previousBest = Math.round(e1rm)
              }
            })
          }
        }
      })
    })

    const isNewPR = action.weight > previousBest

    // Log this PR as a workout
    const workoutResult = await saveWorkoutAction(userId, {
      type: 'workout',
      exercises: [{
        exercise: action.exercise,
        sets: 1,
        reps: 1,
        weight: action.weight,
        rpe: 10, // PR is always max effort
        completed: true
      }],
      session_rpe: 10,
      notes: `🏆 New PR: ${action.exercise} ${action.weight}${action.unit}`
    })

    if (!workoutResult.success) throw new Error(workoutResult.error)

    return {
      success: true,
      isNewPR,
      previousPR: previousBest
    }
  } catch (error) {
    console.error('Error saving PR:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save PR'
    }
  }
}

/**
 * Update user profile from AI conversation
 */
export async function saveProfileAction(
  userId: string,
  action: ProfileAction
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current preferences
    const { data: currentUser } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single()

    const currentPrefs = (currentUser as any)?.preferences || {}

    // Merge updates with existing preferences
    const updatedPrefs = {
      ...currentPrefs,
      ...(action.updates.goal && { goal: action.updates.goal }),
      ...(action.updates.experience && { experience: action.updates.experience }),
      ...(action.updates.focus_area && { focusArea: action.updates.focus_area }),
      ...(action.updates.units && { units: action.updates.units })
    }

    const { error } = await supabase
      .from('users')
      // @ts-expect-error - Supabase generated types sometimes don't align perfectly with runtime
      .update({ preferences: updatedPrefs })
      .eq('id', userId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error updating profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile'
    }
  }
}

