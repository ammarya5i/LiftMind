import { TrainingType, UserPreferences } from '@/types/database.types'

/**
 * Get user's training type from preferences
 */
export function getTrainingType(preferences?: UserPreferences | null): TrainingType {
  return preferences?.trainingType || 'general_strength'
}

/**
 * Get training type display name
 */
export function getTrainingTypeLabel(type: TrainingType): string {
  const labels: Record<TrainingType, string> = {
    powerlifting: 'Powerlifting',
    bodybuilding: 'Bodybuilding',
    crossfit: 'CrossFit',
    calisthenics: 'Calisthenics',
    general_strength: 'General Strength',
    endurance: 'Endurance',
    functional_fitness: 'Functional Fitness',
  }
  return labels[type]
}

/**
 * Get primary exercises for a training type
 */
export function getPrimaryExercises(type: TrainingType): string[] {
  const exercises: Record<TrainingType, string[]> = {
    powerlifting: ['Squat', 'Bench Press', 'Deadlift'],
    bodybuilding: ['Bicep Curl', 'Tricep Extension', 'Lateral Raise', 'Leg Press', 'Chest Fly'],
    crossfit: ['Pull-up', 'Push-up', 'Burpee', 'Box Jump', 'Kettlebell Swing'],
    calisthenics: ['Pull-up', 'Push-up', 'Dip', 'Muscle-up', 'Handstand'],
    general_strength: ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row'],
    endurance: ['Running', 'Cycling', 'Rowing', 'Elliptical'],
    functional_fitness: ['Kettlebell Swing', 'Turkish Get-up', 'Farmer Walk', 'Battle Ropes'],
  }
  return exercises[type]
}

/**
 * Check if exercise is relevant to training type
 */
export function isExerciseRelevant(exerciseName: string, type: TrainingType): boolean {
  const primary = getPrimaryExercises(type)
  return primary.some(primary => 
    exerciseName.toLowerCase().includes(primary.toLowerCase())
  )
}

