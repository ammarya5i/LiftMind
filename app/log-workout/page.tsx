'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Loading } from '@/components/ui/Loading'
import { getCurrentUser, supabase } from '@/lib/supabase'
import { Plus, Trash2, Save, TrendingUp, Calendar } from 'lucide-react'
import { getTrainingType, getPrimaryExercises, getTrainingTypeLabel } from '@/lib/training-type'
import { TrainingType } from '@/types/database.types'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface Exercise {
  id: string
  name: string
  sets: Set[]
}

interface Set {
  id: string
  reps: number
  weight: number
  rpe?: number
  rir?: number
  completed: boolean
}

const EXERCISES = [
  // Compound Movements
  { value: 'squat', label: 'Squat' },
  { value: 'bench', label: 'Bench Press' },
  { value: 'deadlift', label: 'Deadlift' },
  { value: 'overhead_press', label: 'Overhead Press' },
  { value: 'barbell_row', label: 'Barbell Row' },
  { value: 'pullup', label: 'Pull-up' },
  { value: 'dip', label: 'Dip' },
  
  // Squat Variations
  { value: 'front_squat', label: 'Front Squat' },
  { value: 'pause_squat', label: 'Pause Squat' },
  { value: 'box_squat', label: 'Box Squat' },
  { value: 'goblet_squat', label: 'Goblet Squat' },
  { value: 'bulgarian_split_squat', label: 'Bulgarian Split Squat' },
  
  // Bench Variations
  { value: 'close_grip_bench', label: 'Close Grip Bench' },
  { value: 'incline_bench', label: 'Incline Bench' },
  { value: 'decline_bench', label: 'Decline Bench' },
  { value: 'dumbbell_bench', label: 'Dumbbell Bench' },
  { value: 'dumbbell_fly', label: 'Dumbbell Fly' },
  
  // Deadlift Variations
  { value: 'sumo_deadlift', label: 'Sumo Deadlift' },
  { value: 'romanian_deadlift', label: 'Romanian Deadlift' },
  { value: 'deficit_deadlift', label: 'Deficit Deadlift' },
  { value: 'stiff_leg_deadlift', label: 'Stiff Leg Deadlift' },
  
  // Upper Body - Back
  { value: 'lat_pulldown', label: 'Lat Pulldown' },
  { value: 'cable_row', label: 'Cable Row' },
  { value: 't_bar_row', label: 'T-Bar Row' },
  { value: 'face_pull', label: 'Face Pull' },
  { value: 'shrug', label: 'Shrug' },
  
  // Upper Body - Chest
  { value: 'chest_fly', label: 'Chest Fly' },
  { value: 'cable_crossover', label: 'Cable Crossover' },
  { value: 'push_up', label: 'Push-up' },
  
  // Upper Body - Shoulders
  { value: 'lateral_raise', label: 'Lateral Raise' },
  { value: 'front_raise', label: 'Front Raise' },
  { value: 'rear_delt_fly', label: 'Rear Delt Fly' },
  { value: 'arnold_press', label: 'Arnold Press' },
  
  // Upper Body - Arms
  { value: 'bicep_curl', label: 'Bicep Curl' },
  { value: 'hammer_curl', label: 'Hammer Curl' },
  { value: 'tricep_extension', label: 'Tricep Extension' },
  { value: 'tricep_dip', label: 'Tricep Dip' },
  { value: 'overhead_tricep', label: 'Overhead Tricep Extension' },
  
  // Lower Body - Quads
  { value: 'leg_press', label: 'Leg Press' },
  { value: 'leg_extension', label: 'Leg Extension' },
  { value: 'lunges', label: 'Lunges' },
  { value: 'leg_press', label: 'Leg Press' },
  { value: 'hack_squat', label: 'Hack Squat' },
  
  // Lower Body - Hamstrings
  { value: 'leg_curl', label: 'Leg Curl' },
  { value: 'romanian_deadlift', label: 'Romanian Deadlift' },
  { value: 'good_morning', label: 'Good Morning' },
  
  // Lower Body - Glutes
  { value: 'hip_thrust', label: 'Hip Thrust' },
  { value: 'glute_bridge', label: 'Glute Bridge' },
  { value: 'cable_kickback', label: 'Cable Kickback' },
  
  // Lower Body - Calves
  { value: 'calf_raise', label: 'Calf Raise' },
  { value: 'seated_calf_raise', label: 'Seated Calf Raise' },
  
  // Core
  { value: 'plank', label: 'Plank' },
  { value: 'crunch', label: 'Crunch' },
  { value: 'russian_twist', label: 'Russian Twist' },
  { value: 'leg_raise', label: 'Leg Raise' },
  { value: 'ab_wheel', label: 'Ab Wheel' },
  
  // Cardio/Endurance
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'rowing', label: 'Rowing' },
  { value: 'elliptical', label: 'Elliptical' },
]

export default function LogWorkoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [units, setUnits] = useState<'kg' | 'lbs'>('kg')
  const [trainingType, setTrainingType] = useState<TrainingType>('general_strength')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0])
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [sessionRPE, setSessionRPE] = useState<number>(7)
  const [effortMode, setEffortMode] = useState<'rpe' | 'rir'>('rpe') // Toggle between RPE and RIR

  useEffect(() => {
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadUser() {
    const user = await getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUserId(user.id)
    
    // Load user preferences for units and training type
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single() as { data: { preferences: { units?: 'kg' | 'lbs'; trainingType?: TrainingType } | null } | null }
      
      if (profile?.preferences) {
        if (profile.preferences.units) {
        setUnits(profile.preferences.units)
        }
        if (profile.preferences.trainingType) {
          setTrainingType(profile.preferences.trainingType)
        } else {
          setTrainingType(getTrainingType(profile.preferences))
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
    
    setLoading(false)
  }

  function addExercise() {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: 'squat',
      sets: [
        {
          id: `${Date.now()}-1`,
          reps: 5,
          weight: 0,
          rpe: 7,
          completed: false
        }
      ]
    }
    setExercises([...exercises, newExercise])
  }

  function addExerciseWithName(exerciseName: string) {
    const exerciseValue = EXERCISES.find(e => 
      e.label.toLowerCase().includes(exerciseName.toLowerCase())
    )?.value || 'squat'
    
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: exerciseValue,
      sets: [
        {
          id: `${Date.now()}-1`,
          reps: 5,
          weight: 0,
          rpe: 7,
          completed: false
        }
      ]
    }
    setExercises([...exercises, newExercise])
  }

  function getOrderedExercises() {
    const primary = getPrimaryExercises(trainingType)
    const allExercises = [...EXERCISES]
    
    // Sort: primary exercises first, then others
    return allExercises.sort((a, b) => {
      const aIsPrimary = primary.some(p => a.label.toLowerCase().includes(p.toLowerCase()))
      const bIsPrimary = primary.some(p => b.label.toLowerCase().includes(p.toLowerCase()))
      if (aIsPrimary && !bIsPrimary) return -1
      if (!aIsPrimary && bIsPrimary) return 1
      return 0
    })
  }

  function removeExercise(exerciseId: string) {
    setExercises(exercises.filter(ex => ex.id !== exerciseId))
  }

  function updateExercise(exerciseId: string, field: keyof Exercise, value: string) {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ))
  }

  function addSet(exerciseId: string) {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1]
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: `${Date.now()}-${ex.sets.length}`,
              reps: lastSet?.reps || 5,
              weight: lastSet?.weight || 0,
              rpe: lastSet?.rpe || 7,
              completed: false
            }
          ]
        }
      }
      return ex
    }))
  }

  function removeSet(exerciseId: string, setId: string) {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.filter(s => s.id !== setId)
        }
      }
      return ex
    }))
  }

  function updateSet(exerciseId: string, setId: string, field: keyof Set, value: number | boolean) {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => 
            s.id === setId ? { ...s, [field]: value } : s
          )
        }
      }
      return ex
    }))
  }

  function calculate1RM(weight: number, reps: number): number {
    // Epley formula: 1RM = weight × (1 + reps/30)
    if (reps === 1) return weight
    return Math.round(weight * (1 + reps / 30))
  }

  // Convert RPE to RIR
  function rpeToRir(rpe: number): number {
    return Math.max(0, 10 - rpe)
  }

  // Convert RIR to RPE
  function rirToRpe(rir: number): number {
    return Math.max(1, 10 - rir)
  }

  // Get the effort value based on current mode
  function getEffortValue(set: Set): number {
    if (effortMode === 'rpe') {
      return set.rpe || 7
    } else {
      return set.rir !== undefined ? set.rir : rpeToRir(set.rpe || 7)
    }
  }

  // Update effort value based on current mode
  function updateEffortValue(exerciseId: string, setId: string, value: number) {
    setExercises(prev =>
      prev.map(ex =>
        ex.id === exerciseId
          ? {
            ...ex,
            sets: ex.sets.map(set =>
              set.id === setId
                ? effortMode === 'rpe'
                  ? { ...set, rpe: value, rir: rpeToRir(value) }
                  : { ...set, rir: value, rpe: rirToRpe(value) }
                : set
            ),
          }
          : ex
      )
    )
  }

  function calculateVolume(exercise: Exercise): number {
    return exercise.sets.reduce((total, set) => {
      if (set.completed) {
        return total + (set.weight * set.reps)
      }
      return total
    }, 0)
  }

  async function saveWorkout() {
    if (!userId || exercises.length === 0) {
      toast.error('Please add at least one exercise.')
      return
    }

    setSaving(true)
    try {
      // Calculate total volume
      const totalVolume = exercises.reduce((sum, ex) => sum + calculateVolume(ex), 0)

      // Format lifts data matching the database schema
      const lifts = exercises.map(ex => {
        // Find the exercise label from the EXERCISES array
        const exerciseOption = EXERCISES.find(opt => opt.value === ex.name)
        const exerciseName = exerciseOption ? exerciseOption.label : ex.name
        
        return {
          exercise: exerciseName,
          sets: ex.sets.map(s => ({
            reps: s.reps,
            weight: s.weight,
            rpe: s.rpe || 7,
            completed: s.completed
          }))
        }
      })

      // Create workout record
      // Calculate powerlifting metrics
      let totalReps = 0
      let workingSets = 0
      let rpeAdjustedVolume = 0

      exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.completed) {
            totalReps += set.reps
            
            // Working sets (80%+ of estimated max, or RPE 7+)
            const estimatedMax = set.weight * (1 + set.reps / 30)
            const workingPercentage = (set.weight / estimatedMax) * 100
            if (workingPercentage >= 80 || (set.rpe && set.rpe >= 7)) {
              workingSets++
            }
            
            // RPE-adjusted volume
            const rpeFactor = set.rpe ? (set.rpe / 10) : 0.7
            rpeAdjustedVolume += set.reps * set.weight * rpeFactor
          }
        })
      })

      const insertResult = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          date: workoutDate,
          lifts: lifts as any,
          notes: workoutNotes || '',
          session_rpe: sessionRPE,
          total_reps: totalReps,
          working_sets: workingSets,
          total_volume: Math.round(totalVolume),
          rpe_adjusted_volume: Math.round(rpeAdjustedVolume)
        } as any)
        .select()
        .single()

      const workout = insertResult.data as { id: string } | null
      if (insertResult.error || !workout) {
        console.error('Workout error:', insertResult.error)
        throw insertResult.error || new Error('Failed to create workout')
      }

      // Create session record for AI context
      const sessionText = exercises.map(ex => {
        const completedSets = ex.sets.filter(s => s.completed)
        return `${ex.name}: ${completedSets.length} sets completed`
      }).join(', ')

      await supabase.from('sessions').insert({
        user_id: userId,
        summary: `Logged workout: ${sessionText}`,
        data: {
          type: 'workout_log',
          workout_id: workout.id,
          volume: totalVolume,
          session_rpe: sessionRPE,
          exercises: lifts
        }
      } as any)

      toast.success('Workout saved successfully! 💪')
      // Success! Navigate to progress page
      setTimeout(() => {
      router.push('/progress')
      }, 1000)
    } catch (error) {
      console.error('Error saving workout:', error)
      if (error instanceof Error) {
        toast.error(`Failed to save workout: ${error.message}`)
      } else {
        toast.error('Failed to save workout. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-electric-400 to-champion-400 bg-clip-text text-transparent">
                Log Your Workout
              </h1>
              <p className="text-slate-400 mt-1 text-sm md:text-base">Track your training session step by step</p>
            </div>
            <button 
              onClick={() => router.push('/progress')} 
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-slate-400 hover:text-electric-400 hover:bg-dark-800/50 transition-all text-sm md:text-base"
            >
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline">Progress</span>
            </button>
          </div>
          
          {/* Step-by-step Guide */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 md:p-6 rounded-2xl border-electric-500/20"
          >
            <h3 className="text-sm md:text-base font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-electric-500/20 rounded-lg flex items-center justify-center text-electric-400 font-bold">?</span>
              How to log your workout:
            </h3>
            <ol className="space-y-2 text-sm md:text-base text-slate-400 list-decimal list-inside">
              <li>Click &quot;Add Exercise&quot; below to start</li>
              <li>Select an exercise from the dropdown</li>
              <li>Enter your sets: reps, weight, and effort level (RPE/RIR)</li>
              <li>Check the box when you complete each set</li>
              <li>Add more exercises or sets as needed</li>
              <li>Click &quot;Save Workout&quot; when done</li>
            </ol>
          </motion.div>
        </motion.div>

        {/* Workout Date & Session RPE */}
        <Card className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Workout Date
              </label>
              <Input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Overall Difficulty
                <span className="text-xs text-slate-500 ml-2">(1-10)</span>
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={sessionRPE}
                onChange={(e) => setSessionRPE(Number(e.target.value))}
                placeholder="How hard was it?"
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">1 = Easy, 10 = Maximum effort</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Effort Scale
              </label>
              <div className="flex space-x-2">
                <Button
                  variant={effortMode === 'rpe' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setEffortMode('rpe')}
                  className="flex-1 text-xs md:text-sm"
                  title="Rate of Perceived Exertion: How hard the set felt (1-10)"
                >
                  RPE
                </Button>
                <Button
                  variant={effortMode === 'rir' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setEffortMode('rir')}
                  className="flex-1 text-xs md:text-sm"
                  title="Reps in Reserve: How many more reps you could do (0-5+)"
                >
                  RIR
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {effortMode === 'rpe' ? 'RPE: How hard it felt' : 'RIR: Reps left in the tank'}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Add Section */}
        {trainingType !== 'general_strength' && (
          <Card className="p-4 md:p-6">
            <h3 className="text-sm md:text-base font-semibold text-slate-300 mb-3">
              Quick Add - {getTrainingTypeLabel(trainingType)} Exercises
            </h3>
            <p className="text-xs text-slate-500 mb-3">Tap to quickly add your most common exercises</p>
            <div className="flex flex-wrap gap-2">
              {getPrimaryExercises(trainingType).slice(0, 4).map(exercise => (
                <Button
                  key={exercise}
                  variant="secondary"
                  size="sm"
                  onClick={() => addExerciseWithName(exercise)}
                  className="text-xs md:text-sm"
                >
                  {exercise}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Exercises */}
        <div className="space-y-4">
          {exercises.map((exercise) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                  <div className="flex-1 w-full md:max-w-xs">
                    <label className="block text-xs text-slate-500 mb-1">Exercise</label>
                    <Select
                      value={exercise.name}
                      onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                      options={getOrderedExercises()}
                    />
                  </div>
                  <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                    <span className="text-xs md:text-sm text-slate-400">
                      Volume: <span className="font-bold text-white">{calculateVolume(exercise)}</span> {units}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(exercise.id)}
                      className="text-red-500 hover:text-red-400"
                      title="Remove exercise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Sets Table */}
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="px-4 md:px-0">
                    <p className="text-xs text-slate-500 mb-2">Fill in your sets below. Check ✓ when completed.</p>
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b border-dark-700">
                          <th className="text-left py-2 px-2 text-xs md:text-sm font-medium text-slate-300">Set</th>
                          <th className="text-left py-2 px-2 text-xs md:text-sm font-medium text-slate-300">Reps</th>
                          <th className="text-left py-2 px-2 text-xs md:text-sm font-medium text-slate-300">Weight ({units})</th>
                          <th className="text-left py-2 px-2 text-xs md:text-sm font-medium text-slate-300">
                            {effortMode === 'rpe' ? 'RPE' : 'RIR'}
                          </th>
                          <th className="text-left py-2 px-2 text-xs md:text-sm font-medium text-slate-300 hidden md:table-cell">Est. 1RM</th>
                          <th className="text-left py-2 px-2 text-xs md:text-sm font-medium text-slate-300">Done</th>
                          <th className="py-2 px-2"></th>
                        </tr>
                      </thead>
                    <tbody>
                      {exercise.sets.map((set, setIndex) => (
                        <tr key={set.id} className="border-b border-slate-100">
                          <td className="py-2 px-2 text-sm text-slate-600">{setIndex + 1}</td>
                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              min="1"
                              value={set.reps}
                              onChange={(e) => updateSet(exercise.id, set.id, 'reps', Number(e.target.value))}
                              className="w-16 md:w-20 text-sm"
                              placeholder="5"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              min="0"
                              step={units === 'kg' ? "2.5" : "5"}
                              value={set.weight}
                              onChange={(e) => updateSet(exercise.id, set.id, 'weight', Number(e.target.value))}
                              className="w-20 md:w-24 text-sm"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              min={effortMode === 'rpe' ? "1" : "0"}
                              max={effortMode === 'rpe' ? "10" : "10"}
                              value={getEffortValue(set)}
                              onChange={(e) => updateEffortValue(exercise.id, set.id, Number(e.target.value))}
                              className="w-16 md:w-20 text-sm"
                              placeholder={effortMode === 'rpe' ? "7" : "3"}
                            />
                          </td>
                          <td className="py-2 px-2 text-xs md:text-sm text-electric-400 hidden md:table-cell">
                            {set.weight > 0 && set.reps > 0 ? calculate1RM(set.weight, set.reps) : '-'} {units}
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="checkbox"
                              checked={set.completed}
                              onChange={(e) => updateSet(exercise.id, set.id, 'completed', e.target.checked)}
                              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                              title="Mark as completed"
                            />
                          </td>
                          <td className="py-2 px-2">
                            {exercise.sets.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSet(exercise.id, set.id)}
                              >
                                <Trash2 className="w-3 h-3 text-slate-400" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addSet(exercise.id)}
                  className="mt-3 text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Set
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Add Exercise Button */}
        <Button onClick={addExercise} className="w-full text-base md:text-lg py-4">
          <Plus className="w-5 h-5 mr-2" />
          Add Exercise
        </Button>
        <p className="text-xs text-center text-slate-500 mt-2">
          Add all exercises from your workout session
        </p>

        {/* Workout Notes */}
        <Card className="p-4 md:p-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Workout Notes <span className="text-xs text-slate-500">(Optional)</span>
          </label>
          <p className="text-xs text-slate-500 mb-2">How did you feel? Any observations about form, fatigue, or performance?</p>
          <textarea
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
            placeholder="Example: Felt strong today. Bench press felt smooth. Legs were tired from yesterday's session."
            rows={3}
            className="input-dark w-full text-sm md:text-base"
          />
        </Card>

        {/* Save Button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
          <Button
            onClick={saveWorkout}
            disabled={saving || exercises.length === 0}
            className="flex-1 text-base md:text-lg py-4"
            size="lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Workout'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="md:w-auto"
          >
            Cancel
          </Button>
        </div>
        {exercises.length === 0 && (
          <p className="text-xs text-center text-slate-500 mt-2">
            Add at least one exercise to save your workout
          </p>
        )}
      </div>
    </div>
  )
}

