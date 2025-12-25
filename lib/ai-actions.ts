import { ParsedAIResponse, AIAction, Exercise } from '@/types/ai-actions'

/**
 * Enhanced AI system prompt for detecting and structuring workout actions
 */
export const WORKOUT_COACH_PROMPT = `You are an AI powerlifting coach with the ability to log workouts and track progress.

IMPORTANT: When users mention workout data, you MUST respond with structured JSON at the end of your message.

### DETECTION PATTERNS:

1. WORKOUT LOGGING - Detect when user shares training data:
   - "Just did 5x5 bench at 100kg"
   - "Squatted 3 sets of 8 reps at 140kg"
   - "Hit bench for 5 reps at 100"
   
2. PR UPDATES - Detect personal records:
   - "New squat PR of 140kg!"
   - "Hit 100kg bench for the first time"
   - "PR: deadlift 180kg"

3. PROFILE CHANGES - Detect preference updates:
   - "Change my goal to compete in 6 months"
   - "Switch to pounds"
   - "I'm an intermediate lifter now"

4. MULTI-EXERCISE SESSIONS:
   - "Today: squat 5x5 130kg, bench 5x5 95kg"
   - "Full session: squat/bench/deadlift"

### RESPONSE FORMAT:

For WORKOUT logging, end your response with:
ACTION: {"type":"workout","exercises":[{"exercise":"Bench Press","sets":5,"reps":5,"weight":100,"rpe":7}],"session_rpe":8}

For PR updates:
ACTION: {"type":"pr","exercise":"Squat","weight":140,"unit":"kg"}

For profile changes:
ACTION: {"type":"profile","updates":{"goal":"Compete in 6 months"}}

For regular chat (no action):
ACTION: {"type":"chat"}

### EXERCISE NAME MAPPING:
- "bench" → "Bench Press"
- "squat" → "Squat"
- "deadlift" → "Deadlift"
- "ohp" or "press" → "Overhead Press"

### IMPORTANT RULES:
1. Always congratulate achievements
2. Ask if they want to save/log it
3. Be encouraging and specific
4. Include the ACTION JSON at the END of every response
5. Estimate RPE if not mentioned (default: 7)
6. Always respond in a friendly, motivating tone

Example response:
"Awesome work on that 5x5 bench at 100kg! 💪 That's solid volume work. How did it feel? Would you like me to log this workout for you?

ACTION: {"type":"workout","exercises":[{"exercise":"Bench Press","sets":5,"reps":5,"weight":100,"rpe":7}],"session_rpe":7}"
`

/**
 * Parse AI response for structured actions
 */
export function parseAIResponse(response: string): ParsedAIResponse {
  try {
    // Extract ACTION JSON from response
    const actionMatch = response.match(/ACTION:\s*({[\s\S]*?})(?:\n|$)/i)
    
    if (!actionMatch) {
      // No action detected, treat as regular chat
      return {
        action: { type: 'chat' },
        message: response,
        confidence: 1.0,
        raw_response: response
      }
    }

    const actionJSON = actionMatch[1]
    const message = response.replace(/ACTION:\s*{[\s\S]*?}(?:\n|$)/i, '').trim()
    
    const action: AIAction = JSON.parse(actionJSON)
    
    // Validate and normalize the action
    const normalized = normalizeAction(action)
    
    return {
      action: normalized,
      message: message || response,
      confidence: 0.9,
      raw_response: response
    }
  } catch (error) {
    console.error('Error parsing AI response:', error)
    // Fallback to chat if parsing fails
    return {
      action: { type: 'chat' },
      message: response,
      confidence: 0.5,
      raw_response: response
    }
  }
}

/**
 * Normalize and validate action data
 */
function normalizeAction(action: AIAction): AIAction {
  if (action.type === 'workout') {
    // Normalize exercise names
    action.exercises = action.exercises.map(ex => ({
      ...ex,
      exercise: normalizeExerciseName(ex.exercise),
      completed: true,
      rpe: ex.rpe || 7
    }))
    
    // Default session RPE if not provided
    if (!action.session_rpe && action.exercises.length > 0) {
      action.session_rpe = Math.round(
        action.exercises.reduce((sum, ex) => sum + (ex.rpe || 7), 0) / action.exercises.length
      )
    }
  }
  
  if (action.type === 'pr') {
    action.exercise = normalizeExerciseName(action.exercise)
    action.unit = action.unit || 'kg'
  }
  
  return action
}

/**
 * Normalize exercise names to database format
 */
function normalizeExerciseName(name: string): string {
  const normalized = name.toLowerCase().trim()
  
  const mappings: Record<string, string> = {
    'bench': 'Bench Press',
    'bench press': 'Bench Press',
    'bp': 'Bench Press',
    'squat': 'Squat',
    'back squat': 'Squat',
    'deadlift': 'Deadlift',
    'dl': 'Deadlift',
    'dead lift': 'Deadlift',
    'ohp': 'Overhead Press',
    'overhead press': 'Overhead Press',
    'press': 'Overhead Press',
    'military press': 'Overhead Press',
  }
  
  return mappings[normalized] || toTitleCase(name)
}

/**
 * Convert string to title case
 */
function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Calculate workout metrics
 */
export function calculateWorkoutMetrics(exercises: Exercise[]) {
  let totalReps = 0
  let totalVolume = 0
  let workingSets = 0
  let rpeAdjustedVolume = 0

  exercises.forEach(exercise => {
    const reps = exercise.sets * exercise.reps
    const volume = reps * exercise.weight
    const rpeFactor = (exercise.rpe || 7) / 10
    
    totalReps += reps
    totalVolume += volume
    rpeAdjustedVolume += volume * rpeFactor
    
    // Working sets (RPE 7+ is considered working)
    if ((exercise.rpe || 7) >= 7) {
      workingSets += exercise.sets
    }
  })

  return {
    total_reps: totalReps,
    total_volume: Math.round(totalVolume),
    working_sets: workingSets,
    rpe_adjusted_volume: Math.round(rpeAdjustedVolume)
  }
}

