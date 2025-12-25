import { sendChatMessage } from './deepseek'

/**
 * AI Coach Helper Functions
 * These provide specialized AI coaching for different contexts
 */

export interface WorkoutData {
  exercises: {
    name: string
    sets: {
      reps: number
      weight: number
      rpe?: number
      completed: boolean
    }[]
  }[]
  sessionRPE?: number
  notes?: string
  date: string
}

export interface UserContext {
  recentWorkouts?: WorkoutData[]
  goals?: string
  experience?: string
  preferences?: any
}

/**
 * Generate AI workout recommendation for today
 */
export async function generateWorkoutSuggestion(
  userContext: UserContext,
  targetMuscleGroup?: string
): Promise<string> {
  const prompt = `Based on this athlete's training history, suggest a workout for today.

${targetMuscleGroup ? `Focus: ${targetMuscleGroup}` : 'Focus: Full body or appropriate split based on their goals'}

Recent workouts:
${userContext.recentWorkouts?.slice(0, 3).map(w => 
  `- ${w.date}: ${w.exercises.map(e => `${e.name} (${e.sets.length} sets)`).join(', ')} - Session RPE: ${w.sessionRPE || 'N/A'}`
).join('\n') || 'No recent workouts'}

Goals: ${userContext.goals || 'General fitness'}
Experience: ${userContext.experience || 'Intermediate'}

Suggest:
1. Which exercises (4-6 exercises, mix of compound and isolation if appropriate)
2. Sets and rep ranges for each (appropriate for their goals)
3. Intensity guidance (RPE targets or weight percentages)
4. Exercise order (compound movements first typically)
5. Brief rationale (1-2 sentences)

Keep it practical and actionable. Format as a clear workout plan. Support all training styles.`

  return await sendChatMessage(prompt, [], '')
}

/**
 * Analyze a completed workout and provide feedback
 */
export async function analyzeCompletedWorkout(
  workout: WorkoutData,
  userContext: UserContext
): Promise<string> {
  const totalVolume = workout.exercises.reduce((sum, ex) => 
    sum + ex.sets.reduce((setSum, set) => 
      set.completed ? setSum + (set.weight * set.reps) : setSum, 0
    ), 0
  )

  const avgRPE = workout.sessionRPE || 
    (workout.exercises.reduce((sum, ex) => 
      sum + ex.sets.reduce((rpeSum, set) => 
        rpeSum + (set.rpe || 0), 0
      ), 0
    ) / workout.exercises.reduce((count, ex) => count + ex.sets.length, 0))

  const prompt = `Analyze this completed workout and provide coaching feedback.

**Workout Details:**
Date: ${workout.date}
Total Volume: ${totalVolume}kg
Session RPE: ${workout.sessionRPE || 'Not recorded'}
Average Set RPE: ${avgRPE.toFixed(1)}

**Exercises:**
${workout.exercises.map(ex => {
  const completed = ex.sets.filter(s => s.completed).length
  const maxWeight = Math.max(...ex.sets.map(s => s.weight))
  const avgRPE = ex.sets.reduce((sum, s) => sum + (s.rpe || 0), 0) / ex.sets.length
  
  return `- ${ex.name}: ${completed}/${ex.sets.length} sets completed
  Top weight: ${maxWeight}kg
  Average RPE: ${avgRPE.toFixed(1)}
  Sets: ${ex.sets.map(s => `${s.reps}×${s.weight}kg ${s.completed ? '✓' : '✗'}`).join(', ')}`
}).join('\n\n')}

${workout.notes ? `\n**Athlete Notes:** ${workout.notes}` : ''}

**Recent Context:**
${userContext.recentWorkouts?.slice(0, 2).map(w => 
  `- ${w.date}: ${w.exercises.map(e => e.name).join(', ')}`
).join('\n') || 'No recent history'}

Provide:
1. **Overall Assessment:** Was this a good session? (2-3 sentences)
2. **Volume Analysis:** Is volume trending appropriately?
3. **Intensity Check:** RPE feedback and fatigue indicators
4. **Key Takeaways:** 2-3 specific coaching points
5. **Next Session Recommendation:** Brief guidance for next workout

Be encouraging but honest. Use general fitness coaching language appropriate for all training styles.`

  return await sendChatMessage(prompt, [], '')
}

/**
 * Suggest weight/reps for next set based on previous sets
 */
export async function suggestNextSet(
  exerciseName: string,
  completedSets: { reps: number; weight: number; rpe?: number }[],
  targetRPE: number = 8
): Promise<{ weight: number; reps: number; reasoning: string }> {
  if (completedSets.length === 0) {
    return {
      weight: 60,
      reps: 5,
      reasoning: 'Start with a moderate weight for your first set. Adjust based on feel.'
    }
  }

  const lastSet = completedSets[completedSets.length - 1]
  const prompt = `You're coaching someone on their next set.

Exercise: ${exerciseName}
Completed sets: ${completedSets.map((s, i) => 
  `Set ${i + 1}: ${s.reps} reps × ${s.weight}kg ${s.rpe ? `@ RPE ${s.rpe}` : ''}`
).join(', ')}

Target RPE for next set: ${targetRPE}

Based on the progression, suggest:
1. Weight (in kg)
2. Rep target
3. Brief reasoning (1 sentence)

Response format (JSON):
{
  "weight": <number>,
  "reps": <number>,
  "reasoning": "<string>"
}

Use standard progression logic:
- If RPE increasing: reduce weight or reps
- If RPE stable: maintain or increase slightly
- If no RPE data: conservative progression
- Common jumps: 2.5kg, 5kg, or 10kg depending on exercise and training style`

  const response = await sendChatMessage(prompt, [], '')
  
  // Try to parse JSON from response
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (_e) {
    // Fallback logic
  }

  // Fallback: simple progression logic
  if (lastSet.rpe && lastSet.rpe >= 9) {
    return {
      weight: lastSet.weight - 5,
      reps: lastSet.reps,
      reasoning: 'Reducing weight due to high RPE on previous set'
    }
  } else if (lastSet.rpe && lastSet.rpe <= 6) {
    return {
      weight: lastSet.weight + 5,
      reps: lastSet.reps,
      reasoning: 'Increasing weight as previous set felt easy'
    }
  } else {
    return {
      weight: lastSet.weight,
      reps: lastSet.reps,
      reasoning: 'Maintaining load based on progression'
    }
  }
}

/**
 * Check for overtraining signs and warn user
 */
export async function checkFatigueStatus(
  recentWorkouts: WorkoutData[]
): Promise<{ status: 'good' | 'moderate' | 'high'; message: string }> {
  if (recentWorkouts.length < 3) {
    return {
      status: 'good',
      message: 'Not enough data yet. Keep logging workouts to track fatigue.'
    }
  }

  const last7Days = recentWorkouts.slice(0, 7)
  const avgSessionRPE = last7Days.reduce((sum, w) => sum + (w.sessionRPE || 0), 0) / last7Days.length
  const totalVolume = last7Days.reduce((sum, w) => 
    sum + w.exercises.reduce((exSum, ex) => 
      exSum + ex.sets.reduce((setSum, set) => 
        set.completed ? setSum + (set.weight * set.reps) : setSum, 0
      ), 0
    ), 0
  )

  const prompt = `Analyze this athlete's recent training for fatigue/overtraining signs.

Last 7 days:
${last7Days.map(w => 
  `- ${w.date}: ${w.exercises.map(e => e.name).join(', ')} - RPE ${w.sessionRPE || 'N/A'}`
).join('\n')}

Average Session RPE: ${avgSessionRPE.toFixed(1)}
Total Volume (7 days): ${totalVolume}kg
Workouts this week: ${last7Days.length}

Based on:
- Session RPE trends (rising = fatigue)
- Volume accumulation (high volume = stress)
- Workout frequency (too frequent = no recovery)

Assess fatigue level:
- "good": Well-recovered, ready to train hard
- "moderate": Some fatigue, manageable
- "high": High fatigue, deload recommended

Response format (JSON):
{
  "status": "good" | "moderate" | "high",
  "message": "<1-2 sentence explanation>"
}

Be cautious and prioritize athlete health.`

  const response = await sendChatMessage(prompt, [], '')
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (_e) {
    // Fallback
  }

  // Simple heuristic fallback
  if (avgSessionRPE >= 8.5 || last7Days.length >= 6) {
    return {
      status: 'high',
      message: 'High training stress detected. Consider a deload or rest day.'
    }
  } else if (avgSessionRPE >= 7.5 || last7Days.length >= 5) {
    return {
      status: 'moderate',
      message: 'Moderate fatigue accumulating. Monitor recovery carefully.'
    }
  } else {
    return {
      status: 'good',
      message: 'Recovery looks good. You\'re ready to train hard.'
    }
  }
}

/**
 * Generate personalized training program (1 week)
 */
export async function generateWeeklyProgram(
  userContext: UserContext
): Promise<string> {
  const prompt = `Create a 1-week training program for this athlete.

**Athlete Profile:**
Goals: ${userContext.goals || 'General fitness and strength'}
Experience: ${userContext.experience || 'Intermediate'}
${userContext.preferences ? `Preferences: ${JSON.stringify(userContext.preferences)}` : ''}

**Recent Training:**
${userContext.recentWorkouts?.slice(0, 3).map(w => 
  `- ${w.date}: ${w.exercises.map(e => e.name).join(', ')}`
).join('\n') || 'No recent data'}

Create a 3-5 day split appropriate for their goals that includes:
- Main compound movements (squat, bench, deadlift, overhead press, rows, etc.)
- Appropriate variations and accessories
- Sets, reps, and RPE/weight targets
- Exercise order
- Brief notes on intensity and purpose

Format as a clear weekly plan:
**Day 1 - Upper Body Strength**
1. Exercise name: Sets × Reps @ RPE
...

Be specific with rep ranges and RPE. Make it actionable. Support all training goals (strength, hypertrophy, endurance, etc.).`

  return await sendChatMessage(prompt, [], '')
}

/**
 * Provide quick coaching tip based on context
 */
export async function getContextualTip(
  context: 'pre_workout' | 'during_workout' | 'post_workout' | 'rest_day',
  _userContext: UserContext
): Promise<string> {
  const prompts = {
    pre_workout: `Give a brief pre-workout coaching tip (2-3 sentences) for this athlete about to train.
Consider: Warm-up, mental preparation, focus points.`,
    
    during_workout: `Give a brief mid-workout tip (2-3 sentences) about maintaining focus and effort.
Consider: Form, intensity, pacing.`,
    
    post_workout: `Give a brief post-workout tip (2-3 sentences) about recovery.
Consider: Nutrition, rest, reflection.`,
    
    rest_day: `Give a brief rest day tip (2-3 sentences) about active recovery.
Consider: Mobility, light activity, planning.`
  }

  return await sendChatMessage(prompts[context], [], '')
}

/**
 * Analyze exercise form based on user's description
 */
export async function analyzeFormFromDescription(
  exerciseName: string,
  userDescription: string,
  commonIssues?: string[]
): Promise<string> {
  const prompt = `You're a fitness coach. Someone describes an issue with their ${exerciseName}.

**Description:**
"${userDescription}"

${commonIssues ? `\n**Common ${exerciseName} Issues:**\n${commonIssues.join('\n')}` : ''}

Provide:
1. **Likely Cause:** What's probably causing this issue
2. **Fix:** 2-3 specific cues or drills to correct it
3. **Programming Note:** Any set/rep or load adjustments to help

Be specific and practical. Use general fitness coaching language.`

  return await sendChatMessage(prompt, [], '')
}

