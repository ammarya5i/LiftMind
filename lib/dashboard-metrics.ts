import { TrainingType } from '@/types/database.types'
import { Database } from '@/types/database.types'

type Workout = Database['public']['Tables']['workouts']['Row']

export interface DashboardMetrics {
  primaryMetric: {
    label: string
    value: number | string
    unit: string
    description: string
    icon: string
  }
  secondaryMetrics: Array<{
    label: string
    value: number | string
    unit: string
    color: string
    icon: string
  }>
  highlights: Array<{
    title: string
    value: number | string
    unit: string
    change?: number
  }>
}

/**
 * Calculate dashboard metrics based on training type
 */
export function calculateDashboardMetrics(
  workouts: Workout[],
  trainingType: TrainingType,
  units: 'kg' | 'lbs'
): DashboardMetrics {
  switch (trainingType) {
    case 'powerlifting':
      return calculatePowerliftingMetrics(workouts, units)
    case 'bodybuilding':
      return calculateBodybuildingMetrics(workouts, units)
    case 'crossfit':
      return calculateCrossFitMetrics(workouts)
    case 'calisthenics':
      return calculateCalisthenicsMetrics(workouts)
    default:
      return calculateGeneralMetrics(workouts, units)
  }
}

function calculatePowerliftingMetrics(workouts: Workout[], units: 'kg' | 'lbs'): DashboardMetrics {
  const maxes = { squat: 0, bench: 0, deadlift: 0 }
  const oldMaxes = { squat: 0, bench: 0, deadlift: 0 }
  
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  
  workouts.forEach((workout: any) => {
    const workoutDate = new Date(workout.date)
    const isRecent = workoutDate >= thirtyDaysAgo
    const isOld = workoutDate >= sixtyDaysAgo && workoutDate < thirtyDaysAgo
    
    workout.lifts.forEach((lift: any) => {
      if (!lift.exercise) return
      const exerciseName = lift.exercise.toLowerCase()
      
      const singles = lift.sets.filter((set: any) => set.completed !== false && set.reps === 1)
      let bestWeight = 0
      
      if (singles.length > 0) {
        bestWeight = singles.reduce((max: number, set: any) => Math.max(max, set.weight || 0), 0)
      } else {
        lift.sets.forEach((set: any) => {
          if (set.completed) {
            const e1rm = set.weight * (1 + set.reps / 30)
            if (e1rm > bestWeight) bestWeight = e1rm
          }
        })
        bestWeight = Math.round(bestWeight)
      }
      
      if (bestWeight === 0) return
      
      if (isRecent) {
        if (exerciseName.includes('squat') && bestWeight > maxes.squat) maxes.squat = bestWeight
        else if (exerciseName.includes('bench') && bestWeight > maxes.bench) maxes.bench = bestWeight
        else if (exerciseName.includes('deadlift') && bestWeight > maxes.deadlift) maxes.deadlift = bestWeight
      }
      
      if (isOld) {
        if (exerciseName.includes('squat') && bestWeight > oldMaxes.squat) oldMaxes.squat = bestWeight
        else if (exerciseName.includes('bench') && bestWeight > oldMaxes.bench) oldMaxes.bench = bestWeight
        else if (exerciseName.includes('deadlift') && bestWeight > oldMaxes.deadlift) oldMaxes.deadlift = bestWeight
      }
    })
  })
  
  const competitionTotal = maxes.squat + maxes.bench + maxes.deadlift
  const oldTotal = oldMaxes.squat + oldMaxes.bench + oldMaxes.deadlift
  const progress = oldTotal > 0 ? competitionTotal - oldTotal : 0
  
  const workoutsWithRPE = workouts.filter(w => (w as any).session_rpe)
  const avgRPE = workoutsWithRPE.length > 0
    ? workoutsWithRPE.reduce((acc, w) => acc + ((w as any).session_rpe || 0), 0) / workoutsWithRPE.length
    : 0
  
  return {
    primaryMetric: {
      label: 'Competition Total',
      value: competitionTotal || 0,
      unit: units,
      description: 'Squat + Bench + Deadlift',
      icon: 'Trophy'
    },
    secondaryMetrics: [
      {
        label: 'Avg Intensity',
        value: avgRPE > 0 ? Math.round(avgRPE * 10) / 10 : 0,
        unit: 'RPE',
        color: 'electric',
        icon: 'Flame'
      },
      {
        label: 'Training Frequency',
        value: workouts.length,
        unit: 'sessions',
        color: 'green',
        icon: 'Calendar'
      },
      {
        label: 'PR Progress',
        value: progress > 0 ? `+${progress}` : progress,
        unit: units,
        color: progress > 0 ? 'green' : 'champion',
        icon: 'TrendingUp'
      }
    ],
    highlights: [
      { title: 'Squat', value: maxes.squat, unit: units },
      { title: 'Bench', value: maxes.bench, unit: units },
      { title: 'Deadlift', value: maxes.deadlift, unit: units }
    ]
  }
}

function calculateBodybuildingMetrics(workouts: Workout[], units: 'kg' | 'lbs'): DashboardMetrics {
  let totalVolume = 0
  let totalReps = 0
  const muscleGroups: Record<string, number> = {}
  
  workouts.forEach((workout: any) => {
    workout.lifts.forEach((lift: any) => {
      if (!lift.exercise) return
      const volume = lift.sets.reduce((sum: number, set: any) => {
        if (set.completed) {
          totalReps += set.reps
          return sum + (set.weight * set.reps)
        }
        return sum
      }, 0)
      totalVolume += volume
      
      // Categorize by muscle group (simplified)
      const exercise = lift.exercise.toLowerCase()
      if (exercise.includes('chest') || exercise.includes('bench') || exercise.includes('fly')) {
        muscleGroups['Chest'] = (muscleGroups['Chest'] || 0) + volume
      } else if (exercise.includes('back') || exercise.includes('row') || exercise.includes('pull')) {
        muscleGroups['Back'] = (muscleGroups['Back'] || 0) + volume
      } else if (exercise.includes('leg') || exercise.includes('squat')) {
        muscleGroups['Legs'] = (muscleGroups['Legs'] || 0) + volume
      } else if (exercise.includes('shoulder') || exercise.includes('press')) {
        muscleGroups['Shoulders'] = (muscleGroups['Shoulders'] || 0) + volume
      } else if (exercise.includes('arm') || exercise.includes('curl') || exercise.includes('tricep')) {
        muscleGroups['Arms'] = (muscleGroups['Arms'] || 0) + volume
      }
    })
  })
  
  const topMuscleGroup = Object.entries(muscleGroups).sort((a, b) => b[1] - a[1])[0]
  
  const workoutsWithRPE = workouts.filter(w => (w as any).session_rpe)
  const avgRPE = workoutsWithRPE.length > 0
    ? workoutsWithRPE.reduce((acc, w) => acc + ((w as any).session_rpe || 0), 0) / workoutsWithRPE.length
    : 0
  
  return {
    primaryMetric: {
      label: 'Total Volume',
      value: Math.round(totalVolume),
      unit: units,
      description: 'Last 30 days',
      icon: 'Dumbbell'
    },
    secondaryMetrics: [
      {
        label: 'Avg Intensity',
        value: avgRPE > 0 ? Math.round(avgRPE * 10) / 10 : 0,
        unit: 'RPE',
        color: 'electric',
        icon: 'Flame'
      },
      {
        label: 'Training Frequency',
        value: workouts.length,
        unit: 'sessions',
        color: 'green',
        icon: 'Calendar'
      },
      {
        label: 'Total Reps',
        value: totalReps,
        unit: 'reps',
        color: 'champion',
        icon: 'TrendingUp'
      }
    ],
    highlights: [
      { title: topMuscleGroup?.[0] || 'N/A', value: Math.round(topMuscleGroup?.[1] || 0), unit: units },
      { title: 'Total Volume', value: Math.round(totalVolume), unit: units },
      { title: 'Workouts', value: workouts.length, unit: 'sessions' }
    ]
  }
}

function calculateCrossFitMetrics(workouts: Workout[]): DashboardMetrics {
  const workoutFrequency = workouts.length
  const functionalExercises = ['pull-up', 'push-up', 'burpee', 'box jump', 'kettlebell', 'row']
  let functionalCount = 0
  
  workouts.forEach((workout: any) => {
    workout.lifts.forEach((lift: any) => {
      if (!lift.exercise) return
      const exercise = lift.exercise.toLowerCase()
      if (functionalExercises.some(fe => exercise.includes(fe))) {
        functionalCount++
      }
    })
  })
  
  const workoutsWithRPE = workouts.filter(w => (w as any).session_rpe)
  const avgRPE = workoutsWithRPE.length > 0
    ? workoutsWithRPE.reduce((acc, w) => acc + ((w as any).session_rpe || 0), 0) / workoutsWithRPE.length
    : 0
  
  return {
    primaryMetric: {
      label: 'Workout Frequency',
      value: workoutFrequency,
      unit: 'WODs',
      description: 'Last 30 days',
      icon: 'Calendar'
    },
    secondaryMetrics: [
      {
        label: 'Avg Intensity',
        value: avgRPE > 0 ? Math.round(avgRPE * 10) / 10 : 0,
        unit: 'RPE',
        color: 'electric',
        icon: 'Flame'
      },
      {
        label: 'Functional Moves',
        value: functionalCount,
        unit: 'exercises',
        color: 'green',
        icon: 'Dumbbell'
      },
      {
        label: 'Consistency',
        value: workoutFrequency >= 12 ? 'Excellent' : workoutFrequency >= 8 ? 'Good' : 'Building',
        unit: '',
        color: 'champion',
        icon: 'TrendingUp'
      }
    ],
    highlights: [
      { title: 'WODs Completed', value: workoutFrequency, unit: 'sessions' },
      { title: 'Functional Exercises', value: functionalCount, unit: 'exercises' },
      { title: 'Avg Intensity', value: avgRPE > 0 ? Math.round(avgRPE * 10) / 10 : 0, unit: 'RPE' }
    ]
  }
}

function calculateCalisthenicsMetrics(workouts: Workout[]): DashboardMetrics {
  const bodyweightExercises = ['pull-up', 'push-up', 'dip', 'muscle-up', 'handstand', 'pistol']
  const bodyweightPRs: Record<string, number> = {}
  
  workouts.forEach((workout: any) => {
    workout.lifts.forEach((lift: any) => {
      if (!lift.exercise) return
      const exercise = lift.exercise.toLowerCase()
      const matchedExercise = bodyweightExercises.find(bw => exercise.includes(bw))
      
      if (matchedExercise) {
        const maxReps = Math.max(...lift.sets.map((set: any) => set.completed ? set.reps : 0))
        if (maxReps > 0) {
          const key = matchedExercise.charAt(0).toUpperCase() + matchedExercise.slice(1)
          bodyweightPRs[key] = Math.max(bodyweightPRs[key] || 0, maxReps)
        }
      }
    })
  })
  
  const topPR = Object.entries(bodyweightPRs).sort((a, b) => b[1] - a[1])[0]
  
  const workoutsWithRPE = workouts.filter(w => (w as any).session_rpe)
  const avgRPE = workoutsWithRPE.length > 0
    ? workoutsWithRPE.reduce((acc, w) => acc + ((w as any).session_rpe || 0), 0) / workoutsWithRPE.length
    : 0
  
  return {
    primaryMetric: {
      label: topPR ? `${topPR[0]} PR` : 'Bodyweight Training',
      value: topPR ? topPR[1] : 0,
      unit: 'reps',
      description: 'Best bodyweight exercise',
      icon: 'Trophy'
    },
    secondaryMetrics: [
      {
        label: 'Avg Intensity',
        value: avgRPE > 0 ? Math.round(avgRPE * 10) / 10 : 0,
        unit: 'RPE',
        color: 'electric',
        icon: 'Flame'
      },
      {
        label: 'Training Frequency',
        value: workouts.length,
        unit: 'sessions',
        color: 'green',
        icon: 'Calendar'
      },
      {
        label: 'Bodyweight PRs',
        value: Object.keys(bodyweightPRs).length,
        unit: 'exercises',
        color: 'champion',
        icon: 'TrendingUp'
      }
    ],
    highlights: Object.entries(bodyweightPRs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([exercise, reps]) => ({
        title: exercise,
        value: reps,
        unit: 'reps'
      }))
  }
}

function calculateGeneralMetrics(workouts: Workout[], units: 'kg' | 'lbs'): DashboardMetrics {
  let totalVolume = 0
  let totalReps = 0
  const exerciseFrequency: Record<string, number> = {}
  
  workouts.forEach((workout: any) => {
    workout.lifts.forEach((lift: any) => {
      if (!lift.exercise) return
      const volume = lift.sets.reduce((sum: number, set: any) => {
        if (set.completed) {
          totalReps += set.reps
          return sum + (set.weight * set.reps)
        }
        return sum
      }, 0)
      totalVolume += volume
      exerciseFrequency[lift.exercise] = (exerciseFrequency[lift.exercise] || 0) + 1
    })
  })
  
  const topExercise = Object.entries(exerciseFrequency).sort((a, b) => b[1] - a[1])[0]
  
  const workoutsWithRPE = workouts.filter(w => (w as any).session_rpe)
  const avgRPE = workoutsWithRPE.length > 0
    ? workoutsWithRPE.reduce((acc, w) => acc + ((w as any).session_rpe || 0), 0) / workoutsWithRPE.length
    : 0
  
  return {
    primaryMetric: {
      label: 'Total Volume',
      value: Math.round(totalVolume),
      unit: units,
      description: 'Last 30 days',
      icon: 'Dumbbell'
    },
    secondaryMetrics: [
      {
        label: 'Avg Intensity',
        value: avgRPE > 0 ? Math.round(avgRPE * 10) / 10 : 0,
        unit: 'RPE',
        color: 'electric',
        icon: 'Flame'
      },
      {
        label: 'Training Frequency',
        value: workouts.length,
        unit: 'sessions',
        color: 'green',
        icon: 'Calendar'
      },
      {
        label: 'Top Exercise',
        value: topExercise ? topExercise[0] : 'N/A',
        unit: '',
        color: 'champion',
        icon: 'TrendingUp'
      }
    ],
    highlights: [
      { title: 'Total Volume', value: Math.round(totalVolume), unit: units },
      { title: 'Total Reps', value: totalReps, unit: 'reps' },
      { title: 'Workouts', value: workouts.length, unit: 'sessions' }
    ]
  }
}

