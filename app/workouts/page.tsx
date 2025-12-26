'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { getCurrentUser, getWorkouts, supabase } from '@/lib/supabase'
import { Database, TrainingType } from '@/types/database.types'
import { Calendar, Dumbbell, ArrowLeft, Filter, Search, Trash2 } from 'lucide-react'
import { getTrainingType, getTrainingTypeLabel } from '@/lib/training-type'
import { motion } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'

type Workout = Database['public']['Tables']['workouts']['Row']

export default function WorkoutsPage() {
  const [loading, setLoading] = useState(true)
  const [units, setUnits] = useState<'kg' | 'lbs'>('kg')
  const [trainingType, setTrainingType] = useState<TrainingType>('general_strength')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filterWorkouts = useCallback(() => {
    let filtered = [...workouts]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(workout => 
        workout.lifts.some(lift => 
          lift.exercise?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        workout.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by month
    if (selectedMonth) {
      filtered = filtered.filter(workout => {
        const workoutDate = new Date(workout.date)
        const workoutMonth = workoutDate.toISOString().slice(0, 7) // YYYY-MM
        return workoutMonth === selectedMonth
      })
    }

    setFilteredWorkouts(filtered)
  }, [workouts, searchTerm, selectedMonth])

  useEffect(() => {
    loadWorkouts()
  }, [])

  useEffect(() => {
    filterWorkouts()
  }, [filterWorkouts])

  async function loadWorkouts() {
    try {
      const authUser = await getCurrentUser()
      if (!authUser) {
        window.location.href = '/login'
        return
      }

      // Load user preferences
      const { data: profile } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', authUser.id)
        .single() as { data: { preferences: { units?: 'kg' | 'lbs'; trainingType?: TrainingType } | null } | null }
      
      if (profile?.preferences) {
        const prefs = profile.preferences
        if (prefs.units) {
          setUnits(prefs.units)
        }
        setTrainingType(getTrainingType(prefs))
      }

      // Get all workouts
      const workoutData: Workout[] = await getWorkouts(authUser.id, 365) // Last year
      setWorkouts(workoutData)
    } catch (error) {
      if (error instanceof Error && !error.message.includes('session')) {
        console.error('Error loading workouts:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  async function deleteWorkout(workoutId: string) {
    if (!confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      return
    }

    setDeletingId(workoutId)
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)

      if (error) throw error

      // Remove from local state
      setWorkouts(prev => prev.filter(w => w.id !== workoutId))
      
      // Show success feedback
      toast.success('Workout deleted successfully!')
    } catch (error) {
      console.error('Error deleting workout:', error)
      toast.error('Failed to delete workout. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  function getUniqueMonths() {
    const months = new Set<string>()
    workouts.forEach(workout => {
      const date = new Date(workout.date)
      const month = date.toISOString().slice(0, 7) // YYYY-MM
      months.add(month)
    })
    return Array.from(months).sort().reverse()
  }

  function formatWorkoutDate(date: string) {
    const workoutDate = new Date(date)
    return {
      full: workoutDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      short: workoutDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      time: workoutDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  function getWorkoutSummary(workout: Workout) {
    const totalSets = workout.lifts.reduce((acc, lift) => acc + lift.sets.length, 0)
    const totalReps = workout.total_reps || 0
    const sessionRPE = workout.session_rpe

    return {
      exercises: workout.lifts.length,
      sets: totalSets,
      reps: totalReps,
      rpe: sessionRPE
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <Link 
                href="/progress"
                className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-electric-500/20 to-electric-600/20">
                  <Dumbbell className="w-8 h-8 text-electric-500" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Workout History</h1>
                  <p className="text-slate-400 text-sm md:text-base">View and analyze your training sessions</p>
                </div>
              </div>
            </div>
            
            {/* Help Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4 md:p-6 rounded-2xl border-electric-500/20"
            >
              <h3 className="text-sm md:text-base font-semibold text-white mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-electric-400" />
                Using Workout History
              </h3>
              <ul className="space-y-1.5 text-xs md:text-sm text-slate-400 list-disc list-inside">
                <li>Search by exercise name or notes to find specific workouts</li>
                <li>Filter by month to see workouts from a specific time period</li>
                <li>Click on any workout to see detailed information</li>
                <li>Your training type badge shows what style you were training</li>
              </ul>
            </motion.div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Total Workouts</p>
              <p className="text-2xl font-bold text-electric-400">{workouts.length}</p>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 rounded-3xl">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search exercises or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-2xl text-white placeholder-slate-500 focus:border-electric-500 focus:outline-none"
                  />
                </div>
                
                {/* Month Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="pl-10 pr-8 py-3 bg-dark-800 border border-dark-700 rounded-2xl text-white focus:border-electric-500 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">All Months</option>
                    {getUniqueMonths().map(month => (
                      <option key={month} value={month}>
                        {new Date(month + '-01').toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Workouts List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredWorkouts.length > 0 ? (
              filteredWorkouts.map((workout, index) => {
                const dateInfo = formatWorkoutDate(workout.date)
                const summary = getWorkoutSummary(workout)
                
                return (
                  <motion.div
                    key={workout.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="hover:border-electric-500/30 hover:shadow-lg transition-all duration-300 group rounded-3xl">
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-500/20 to-electric-600/20 flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-5 h-5 text-electric-400" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-lg font-bold text-white truncate">{dateInfo.full}</h3>
                              <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-slate-400">{dateInfo.time}</p>
                                <span className="px-2 py-0.5 text-xs bg-electric-500/20 text-electric-400 rounded-full">
                                  {getTrainingTypeLabel(trainingType)}
                                </span>
                                {trainingType === 'powerlifting' && workout.lifts.some(lift => {
                                  const exercise = lift.exercise?.toLowerCase() || ''
                                  return exercise.includes('squat') || exercise.includes('bench') || exercise.includes('deadlift')
                                }) && (
                                  <span className="px-2 py-0.5 text-xs bg-champion-500/20 text-champion-400 rounded-full">
                                    Big 3 Session
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Session</p>
                              <p className="text-lg font-semibold text-white">
                                {summary.exercises} exercise{summary.exercises !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteWorkout(workout.id)}
                              disabled={deletingId === workout.id}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all duration-200 disabled:opacity-50 group/delete"
                              title="Delete workout"
                            >
                              {deletingId === workout.id ? (
                                <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-5 h-5 text-red-400 group-hover/delete:text-red-300" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-3 bg-dark-800/50 rounded-xl">
                            <p className="text-xs text-slate-500 mb-1">Sets</p>
                            <p className="text-lg font-bold text-electric-400">{summary.sets}</p>
                          </div>
                          <div className="text-center p-3 bg-dark-800/50 rounded-xl">
                            <p className="text-xs text-slate-500 mb-1">Reps</p>
                            <p className="text-lg font-bold text-champion-400">{summary.reps}</p>
                          </div>
                          {summary.rpe && (
                            <div className="text-center p-3 bg-dark-800/50 rounded-xl">
                              <p className="text-xs text-slate-500 mb-1">RPE</p>
                              <p className="text-lg font-bold text-orange-400">{summary.rpe}</p>
                            </div>
                          )}
                        </div>

                        {/* Exercises */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Exercises</h4>
                          {workout.lifts.map((lift, liftIndex) => (
                            <div key={liftIndex} className="p-3 bg-dark-800/30 rounded-xl border border-dark-700/50">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-white">{lift.exercise}</h5>
                                <span className="text-xs text-slate-500">{lift.sets.length} sets</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {lift.sets.map((set, setIndex) => (
                                  <span 
                                    key={setIndex}
                                    className="px-2 py-1 bg-dark-700 text-xs text-slate-300 rounded-lg"
                                  >
                                    {set.weight}{units} × {set.reps}
                                    {set.rpe && ` @${set.rpe}`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Notes */}
                        {workout.notes && (
                          <div className="mt-4 p-3 bg-dark-800/30 rounded-xl border border-dark-700/50">
                            <h4 className="text-sm font-semibold text-slate-300 mb-2">Notes</h4>
                            <p className="text-sm text-slate-400">{workout.notes}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )
              })
            ) : (
              <Card className="text-center py-16 rounded-3xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <Dumbbell className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {searchTerm || selectedMonth ? 'No workouts found' : 'No workouts yet'}
                </h3>
                <p className="text-slate-400 mb-6">
                  {searchTerm || selectedMonth 
                    ? 'Try adjusting your search criteria or filters'
                    : 'Start logging your workouts to see them here!'
                  }
                </p>
                {!searchTerm && !selectedMonth && (
                  <Link 
                    href="/log-workout"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-600 hover:to-electric-700 text-white font-semibold rounded-2xl transition-all duration-200 hover:scale-105"
                  >
                    <Dumbbell className="w-5 h-5 mr-2" />
                    Log Your First Workout
                  </Link>
                )}
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
