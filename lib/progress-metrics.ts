import { TrainingType } from '@/types/database.types'
import { Database } from '@/types/database.types'

type Workout = Database['public']['Tables']['workouts']['Row']

export interface LiftProgressData {
  date: string
  oneRm: number
}

export interface ProgressMetrics {
  universal: {
    topExercises: Array<{ name: string; volume: number; sessions: number }>
    totalVolume: number
    workoutFrequency: number
    consistency: number
  }
  typeSpecific: {
    charts: Array<{ title: string; data: LiftProgressData[]; color: string }>
    highlights: Array<{ title: string; value: number; unit: string; change?: number }>
    primaryMetric?: {
      label: string
      value: number
      unit: string
    }
  }
}

export function calculateProgressMetrics(
  workouts: Workout[],
  trainingType: TrainingType,
  units: 'kg' | 'lbs'
): ProgressMetrics {
  // Universal metrics (always calculated)
  const universal = calculateUniversalMetrics(workouts, units)
  
  // Type-specific metrics
  const typeSpecific = calculateTypeSpecificMetrics(workouts, trainingType, units)
  
  return { universal, typeSpecific }
}

function calculateUniversalMetrics(workouts: Workout[], units: 'kg' | 'lbs') {
  const exerciseStats: Record<string, { volume: number; sessions: number }> = {}
  let totalVolume = 0
  
  workouts.forEach((workout) => {
    workout.lifts.forEach((lift) => {
      if (!lift.exercise) return
      
      const exerciseName = lift.exercise
      if (!exerciseStats[exerciseName]) {
        exerciseStats[exerciseName] = { volume: 0, sessions: 0 }
      }
      
      const volume = lift.sets.reduce((sum: number, set) => {
        if (set.completed) {
          return sum + (set.weight * set.reps)
        }
        return sum
      }, 0)
      
      exerciseStats[exerciseName].volume += volume
      exerciseStats[exerciseName].sessions += 1
      totalVolume += volume
    })
  })
  
  const topExercises = Object.entries(exerciseStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)
  
  // Calculate consistency (workouts per week on average)
  const daysDiff = workouts.length > 0 
    ? (new Date().getTime() - new Date(workouts[workouts.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)
    : 0
  const consistency = daysDiff > 0 ? Math.round((workouts.length / daysDiff) * 7 * 10) / 10 : 0
  
  return {
    topExercises,
    totalVolume: Math.round(totalVolume),
    workoutFrequency: workouts.length,
    consistency
  }
}

function calculateTypeSpecificMetrics(
  workouts: Workout[],
  trainingType: TrainingType,
  units: 'kg' | 'lbs'
) {
  switch (trainingType) {
    case 'powerlifting':
      return calculatePowerliftingProgress(workouts, units)
    case 'bodybuilding':
      return calculateBodybuildingProgress(workouts, units)
    case 'crossfit':
      return calculateCrossFitProgress(workouts)
    case 'calisthenics':
      return calculateCalisthenicsProgress(workouts)
    default:
      return calculateGeneralProgress(workouts, units)
  }
}

function calculatePowerliftingProgress(workouts: Workout[], units: 'kg' | 'lbs') {
  const processLiftData = (liftName: string) => {
    const liftWorkouts = workouts
      .filter(workout => 
        workout.lifts.some(lift => 
          lift.exercise && lift.exercise.toLowerCase().includes(liftName.toLowerCase())
        )
      )
      .reverse()
    
    const progressData: LiftProgressData[] = []
    let pr = 0
    
    liftWorkouts.forEach(workout => {
      const lift = workout.lifts.find(l => 
        l.exercise && l.exercise.toLowerCase().includes(liftName.toLowerCase())
      )
      
      if (!lift || lift.sets.length === 0) return
      
      const singles = lift.sets.filter(set => set.completed !== false && set.reps === 1)
      
      if (singles.length === 0) return
      
      const bestWeight = singles.reduce((max, set) => Math.max(max, set.weight), 0)
      
      if (bestWeight > 0) {
        progressData.push({
          date: new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          oneRm: bestWeight
        })
        
        if (bestWeight > pr) pr = bestWeight
      }
    })
    
    return { data: progressData, pr, current: progressData.length > 0 ? progressData[progressData.length - 1].oneRm : 0 }
  }
  
  const squat = processLiftData('squat')
  const bench = processLiftData('bench')
  const deadlift = processLiftData('deadlift')
  
  const competitionTotal = squat.current + bench.current + deadlift.current
  const prTotal = squat.pr + bench.pr + deadlift.pr
  
  return {
    charts: [
      { title: 'Squat', data: squat.data, color: '#00a3ff' },
      { title: 'Bench Press', data: bench.data, color: '#fbbf24' },
      { title: 'Deadlift', data: deadlift.data, color: '#10b981' }
    ],
    highlights: [
      { title: 'Squat', value: Math.round(squat.current), unit: units, change: squat.data.length > 1 ? Math.round(squat.current - squat.data[0].oneRm) : undefined },
      { title: 'Bench Press', value: Math.round(bench.current), unit: units, change: bench.data.length > 1 ? Math.round(bench.current - bench.data[0].oneRm) : undefined },
      { title: 'Deadlift', value: Math.round(deadlift.current), unit: units, change: deadlift.data.length > 1 ? Math.round(deadlift.current - deadlift.data[0].oneRm) : undefined }
    ],
    primaryMetric: {
      label: 'Competition Total',
      value: Math.round(competitionTotal),
      unit: units
    }
  }
}

function calculateBodybuildingProgress(workouts: Workout[], units: 'kg' | 'lbs') {
  const muscleGroups: Record<string, { volume: number; sessions: number }> = {}
  let totalVolume = 0
  
  workouts.forEach((workout) => {
    workout.lifts.forEach((lift) => {
      if (!lift.exercise) return
      const volume = lift.sets.reduce((sum: number, set) => {
        if (set.completed) return sum + (set.weight * set.reps)
        return sum
      }, 0)
      totalVolume += volume
      
      const exercise = lift.exercise.toLowerCase()
      let group = 'Other'
      if (exercise.includes('chest') || exercise.includes('bench') || exercise.includes('fly')) group = 'Chest'
      else if (exercise.includes('back') || exercise.includes('row') || exercise.includes('pull')) group = 'Back'
      else if (exercise.includes('leg') || exercise.includes('squat')) group = 'Legs'
      else if (exercise.includes('shoulder') || exercise.includes('press')) group = 'Shoulders'
      else if (exercise.includes('arm') || exercise.includes('curl') || exercise.includes('tricep')) group = 'Arms'
      
      if (!muscleGroups[group]) muscleGroups[group] = { volume: 0, sessions: 0 }
      muscleGroups[group].volume += volume
      muscleGroups[group].sessions += 1
    })
  })
  
  const topGroups = Object.entries(muscleGroups)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 3)
  
  // Create volume progression chart
  const volumeByDate: Record<string, number> = {}
  workouts.forEach((workout) => {
    const date = new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    let dayVolume = 0
    workout.lifts.forEach((lift) => {
      dayVolume += lift.sets.reduce((sum: number, set) => {
        if (set.completed) return sum + (set.weight * set.reps)
        return sum
      }, 0)
    })
    volumeByDate[date] = (volumeByDate[date] || 0) + dayVolume
  })
  
  const volumeChart = Object.entries(volumeByDate)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, volume]) => ({ date, oneRm: Math.round(volume) }))
  
  return {
    charts: [
      { title: 'Total Volume', data: volumeChart, color: '#8b5cf6' }
    ],
    highlights: topGroups.map(group => ({
      title: group.name,
      value: Math.round(group.volume),
      unit: units
    })),
    primaryMetric: {
      label: 'Total Volume',
      value: Math.round(totalVolume),
      unit: units
    }
  }
}

function calculateCrossFitProgress(workouts: Workout[]) {
  const functionalExercises = ['pull-up', 'push-up', 'burpee', 'box jump', 'kettlebell', 'row']
  const exercisePRs: Record<string, number> = {}
  
  workouts.forEach((workout) => {
    workout.lifts.forEach((lift) => {
      if (!lift.exercise) return
      const exercise = lift.exercise.toLowerCase()
      const matched = functionalExercises.find(fe => exercise.includes(fe))
      
      if (matched) {
        const maxReps = Math.max(...lift.sets.map((set) => set.completed ? set.reps : 0))
        if (maxReps > 0) {
          exercisePRs[matched] = Math.max(exercisePRs[matched] || 0, maxReps)
        }
      }
    })
  })
  
  return {
    charts: [],
    highlights: Object.entries(exercisePRs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([exercise, reps]) => ({
        title: exercise.charAt(0).toUpperCase() + exercise.slice(1),
        value: reps,
        unit: 'reps'
      })),
    primaryMetric: {
      label: 'Functional PRs',
      value: Object.keys(exercisePRs).length,
      unit: 'exercises'
    }
  }
}

function calculateCalisthenicsProgress(workouts: Workout[]) {
  const bodyweightExercises = ['pull-up', 'push-up', 'dip', 'muscle-up', 'handstand', 'pistol']
  const exerciseProgress: Record<string, LiftProgressData[]> = {}
  
  workouts.forEach((workout) => {
    const date = new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    workout.lifts.forEach((lift) => {
      if (!lift.exercise) return
      const exercise = lift.exercise.toLowerCase()
      const matched = bodyweightExercises.find(bw => exercise.includes(bw))
      
      if (matched) {
        const maxReps = Math.max(...lift.sets.map((set) => set.completed ? set.reps : 0))
        if (maxReps > 0) {
          if (!exerciseProgress[matched]) exerciseProgress[matched] = []
          exerciseProgress[matched].push({ date, oneRm: maxReps })
        }
      }
    })
  })
  
  const topExercises = Object.entries(exerciseProgress)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
  
  return {
    charts: topExercises.map(([exercise, data]) => ({
      title: exercise.charAt(0).toUpperCase() + exercise.slice(1),
      data,
      color: '#00a3ff'
    })),
    highlights: topExercises.map(([exercise, data]) => ({
      title: exercise.charAt(0).toUpperCase() + exercise.slice(1),
      value: data.length > 0 ? data[data.length - 1].oneRm : 0,
      unit: 'reps'
    })),
    primaryMetric: {
      label: 'Bodyweight PRs',
      value: Object.keys(exerciseProgress).length,
      unit: 'exercises'
    }
  }
}

function calculateGeneralProgress(workouts: Workout[], units: 'kg' | 'lbs') {
  const exerciseFrequency: Record<string, number> = {}
  let totalVolume = 0
  
  workouts.forEach((workout) => {
    workout.lifts.forEach((lift) => {
      if (!lift.exercise) return
      exerciseFrequency[lift.exercise] = (exerciseFrequency[lift.exercise] || 0) + 1
      
      const volume = lift.sets.reduce((sum: number, set) => {
        if (set.completed) return sum + (set.weight * set.reps)
        return sum
      }, 0)
      totalVolume += volume
    })
  })
  
  const topExercises = Object.entries(exerciseFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  
  return {
    charts: [],
    highlights: topExercises.map(([exercise, count]) => ({
      title: exercise,
      value: count,
      unit: 'sessions'
    })),
    primaryMetric: {
      label: 'Total Volume',
      value: Math.round(totalVolume),
      unit: units
    }
  }
}

