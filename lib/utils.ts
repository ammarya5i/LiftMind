/**
 * Utility functions for LiftMind
 */

/**
 * Calculate estimated 1RM using Epley formula
 * Formula: weight × (1 + reps/30)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

/**
 * Calculate total volume for a workout
 * Volume = sum of (sets × reps × weight)
 */
export function calculateVolume(lifts: Array<{ sets: Array<{ reps: number; weight: number }> }>): number {
  return lifts.reduce((total, lift) => {
    const liftVolume = lift.sets.reduce((acc, set) => {
      return acc + (set.reps * set.weight)
    }, 0)
    return total + liftVolume
  }, 0)
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

/**
 * Format time to readable string
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

/**
 * Convert kg to lbs
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462)
}

/**
 * Convert lbs to kg
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.20462)
}

/**
 * Convert weight based on user preference
 */
export function convertWeight(weight: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
  if (from === to) return weight
  return from === 'kg' ? kgToLbs(weight) : lbsToKg(weight)
}

