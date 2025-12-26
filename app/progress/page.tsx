'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { getCurrentUser, getWorkouts, supabase } from '@/lib/supabase'
import { Database, TrainingType } from '@/types/database.types'
import { TrendingUp, Trophy, Zap, Calendar, Dumbbell, Eye } from 'lucide-react'
import { getTrainingType } from '@/lib/training-type'
import { calculateProgressMetrics, ProgressMetrics } from '@/lib/progress-metrics'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import Link from 'next/link'

type Workout = Database['public']['Tables']['workouts']['Row']

interface LiftProgressData {
  date: string
  oneRm: number
}

export default function ProgressPage() {
  const [loading, setLoading] = useState(true)
  const [units, setUnits] = useState<'kg' | 'lbs'>('kg')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [trainingType, setTrainingType] = useState<TrainingType>('general_strength')
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetrics | null>(null)

  useEffect(() => {
    loadProgressData()
  }, [])

  async function loadProgressData() {
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
        .single()
      
      let userUnits: 'kg' | 'lbs' = 'kg'
      let userTrainingType: TrainingType = 'general_strength'
      
      if (profile && (profile as any).preferences) {
        const prefs = (profile as any).preferences
        userUnits = prefs.units || 'kg'
        userTrainingType = getTrainingType(prefs)
        setUnits(userUnits)
        setTrainingType(userTrainingType)
      }

      // Get last 90 days of workouts for better progression tracking
      const workoutData: Workout[] = await getWorkouts(authUser.id, 90)
      setWorkouts(workoutData)

      // Calculate progress metrics
      const metrics = calculateProgressMetrics(workoutData, userTrainingType, userUnits)
      setProgressMetrics(metrics)

    } catch (error) {
      if (error instanceof Error && !error.message.includes('session')) {
        console.error('Error loading progress data:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading || !progressMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    )
  }

  // Helper component for lift progression chart
  const LiftChart = ({ 
    data, 
    title, 
    color 
  }: { 
    data: LiftProgressData[]
    title: string
    color: string
  }) => (
    <Card className="hover:border-electric-500/30 hover:shadow-lg transition-all duration-300 rounded-3xl group">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">{title} Progression</h2>
        <div className="text-sm text-slate-400 bg-dark-800 px-3 py-1 rounded-full">{data.length} sessions</div>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#23232e" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={{ stroke: '#23232e' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12}
              tickLine={{ stroke: '#23232e' }}
              label={{ 
                value: `1RM (${units})`, 
                angle: -90, 
                position: 'insideLeft', 
                fill: '#94a3b8',
                style: { textAnchor: 'middle' }
              }} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a24', 
                border: '1px solid #23232e',
                borderRadius: '12px',
                color: '#f1f5f9',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}
              labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
              formatter={(value: any, name: string) => {
                if (name === 'oneRm') return [value + ' ' + units, '1RM']
                return [value, name]
              }}
            />
            <Line 
              type="monotone" 
              dataKey="oneRm" 
              stroke={color}
              strokeWidth={4}
              dot={{ fill: color, r: 6, strokeWidth: 2, stroke: '#1a1a24' }}
              activeDot={{ r: 8, stroke: color, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
            <TrendingUp className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-slate-400 text-base">No {title.toLowerCase()} data yet</p>
          <p className="text-slate-500 text-sm mt-1">Start tracking this lift to see your progression!</p>
        </div>
      )}
    </Card>
  )

  // Helper component for recent workouts
  const RecentWorkouts = () => {
    const recentWorkouts = workouts.slice(0, 5)
    
    if (recentWorkouts.length === 0) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="hover:border-electric-500/30 hover:shadow-lg transition-all duration-300 rounded-3xl group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-electric-500/20 to-electric-600/20 group-hover:scale-110 transition-transform duration-300">
                <Dumbbell className="w-6 h-6 text-electric-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Recent Workouts</h2>
            </div>
            <Link 
              href="/workouts"
              className="flex items-center space-x-2 text-electric-400 hover:text-electric-300 transition-colors bg-electric-500/10 hover:bg-electric-500/20 px-3 py-2 rounded-lg"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">View All</span>
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-2xl border border-dark-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-500/20 to-electric-600/20 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-electric-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {new Date(workout.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-slate-400">
                      {workout.lifts.length} exercise{workout.lifts.length !== 1 ? 's' : ''}
                      {(workout as any).session_rpe && ` • RPE ${(workout as any).session_rpe}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {(workout as any).total_reps || 0} reps
                  </p>
                  <p className="text-xs text-slate-500">
                    {(workout as any).working_sets || 0} working sets
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-champion-500/20 to-champion-600/20">
                  <Trophy className="w-8 h-8 text-champion-500" />
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-electric-400 to-champion-500 bg-clip-text text-transparent">
                  Lift Progression
                </h1>
              </div>
              <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
              {trainingType === 'powerlifting' 
                ? 'Track your strength gains on the big three lifts with detailed analytics'
                : trainingType === 'bodybuilding'
                ? 'Track your volume progression and muscle group development'
                : trainingType === 'crossfit'
                ? 'Track your WOD performance and functional movement progress'
                : trainingType === 'calisthenics'
                ? 'Track your bodyweight exercise progression and PRs'
                : 'Track your exercise progression with detailed analytics'}
            </p>
            </div>
            
            {/* Help Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4 md:p-6 rounded-2xl border-electric-500/20"
            >
              <h3 className="text-sm md:text-base font-semibold text-white mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 md:w-5 md:h-5 text-electric-400" />
                Understanding Your Progress
              </h3>
              <ul className="space-y-1.5 text-xs md:text-sm text-slate-400 list-disc list-inside">
                <li>Charts show your estimated 1RM (one-rep max) progression over time</li>
                <li>Metrics adapt to your training type (Powerlifting, Bodybuilding, etc.)</li>
                <li>Volume = total weight lifted (sets × reps × weight)</li>
                <li>More workouts = more accurate progress tracking</li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Primary Metric Card */}
          {progressMetrics.typeSpecific.primaryMetric && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-champion-500/10 via-dark-800 to-electric-500/10 border-champion-500/30 hover:border-champion-500/50 hover:shadow-2xl transition-all duration-300 rounded-3xl group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-champion-500/10 rounded-full blur-3xl group-hover:bg-champion-500/20 transition-colors duration-500" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-electric-500/10 rounded-full blur-3xl group-hover:bg-electric-500/20 transition-colors duration-500" />
              
              <div className="relative z-10 p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-champion-500/20 to-champion-600/20 group-hover:scale-110 transition-transform duration-300">
                      <Trophy className="w-10 h-10 text-champion-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white">
                          {progressMetrics.typeSpecific.primaryMetric.label}
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base">
                          {trainingType === 'powerlifting' ? 'Squat + Bench + Deadlift' : 'Key Performance Indicator'}
                        </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs md:text-sm text-slate-500">Last updated</p>
                    <p className="text-sm md:text-base font-medium text-white">
                      {workouts.length > 0 ? new Date(workouts[0].date).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
                
                  <div className="text-center p-6 bg-dark-800/50 rounded-2xl border border-dark-700/50">
                    <p className="text-4xl md:text-5xl font-display font-bold text-champion-400">
                      {progressMetrics.typeSpecific.primaryMetric.value || '—'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">{progressMetrics.typeSpecific.primaryMetric.unit}</p>
                </div>
              </div>
              </Card>
            </motion.div>
          )}

          {/* Universal Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card className="p-6">
              <p className="text-sm text-slate-400 mb-2">Total Volume</p>
              <p className="text-3xl font-bold text-white">{progressMetrics.universal.totalVolume} {units}</p>
              <p className="text-xs text-slate-500 mt-1">Last 90 days</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-slate-400 mb-2">Workout Frequency</p>
              <p className="text-3xl font-bold text-white">{progressMetrics.universal.workoutFrequency}</p>
              <p className="text-xs text-slate-500 mt-1">Sessions</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-slate-400 mb-2">Consistency</p>
              <p className="text-3xl font-bold text-white">{progressMetrics.universal.consistency}</p>
              <p className="text-xs text-slate-500 mt-1">Workouts/week</p>
            </Card>
          </motion.div>

          {/* Type-Specific Highlights */}
          {progressMetrics.typeSpecific.highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
              {progressMetrics.typeSpecific.highlights.map((highlight, index) => {
                const colors = ['electric', 'champion', 'green']
                const color = colors[index % colors.length]
                const colorClasses = {
                  electric: 'text-electric-400',
                  champion: 'text-champion-400',
                  green: 'text-green-400'
                }
                const icons = [TrendingUp, Zap, Trophy]
                const Icon = icons[index % icons.length]
                
                const bgClasses = {
                  electric: 'from-electric-500/20 to-electric-600/20',
                  champion: 'from-champion-500/20 to-champion-600/20',
                  green: 'from-green-500/20 to-green-600/20'
                }
                
                return (
                  <Card key={highlight.title} className="hover:border-electric-500/30 hover:shadow-lg transition-all duration-300 rounded-3xl group">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${bgClasses[color as keyof typeof bgClasses]} group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-6 h-6 ${colorClasses[color as keyof typeof colorClasses]}`} />
                        </div>
                        <h3 className="text-xl font-bold text-white">{highlight.title}</h3>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="text-center">
                        <p className="text-sm text-slate-400 mb-2">Current</p>
                        <p className={`text-4xl md:text-5xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
                          {highlight.value || '—'} {highlight.unit}
                        </p>
                      </div>
                      
                      {highlight.change !== undefined && (
                        <div className="text-center pt-4 border-t border-dark-700">
                          <p className="text-xs text-slate-500 mb-2">Progress</p>
                          <p className={`text-lg font-semibold ${highlight.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {highlight.change >= 0 ? '+' : ''}{highlight.change} {highlight.unit}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
          </motion.div>
          )}

          {/* Charts Section */}
          {progressMetrics.typeSpecific.charts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">Progression Charts</h2>
                <p className="text-slate-400">
                  {trainingType === 'powerlifting' 
                    ? 'Track your 1RM improvements over time'
                    : trainingType === 'bodybuilding'
                    ? 'Track your volume progression'
                    : 'Track your exercise progression'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {progressMetrics.typeSpecific.charts.map((chart) => (
                  <LiftChart 
                    key={chart.title} 
                    data={chart.data} 
                    title={chart.title} 
                    color={chart.color} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Workouts */}
          <RecentWorkouts />

          {/* Empty State */}
          {progressMetrics.universal.workoutFrequency === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="text-center py-16 bg-gradient-to-br from-dark-800/50 to-dark-900/50 rounded-3xl">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">No Lift Data Yet</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Start logging your workouts to track your progression and see detailed analytics for all your exercises!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/log-workout"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-600 hover:to-electric-700 text-white font-semibold rounded-2xl transition-all duration-200 hover:scale-105"
                  >
                    <Dumbbell className="w-5 h-5 mr-2" />
                    Log Your First Workout
                  </Link>
                  <Link 
                    href="/coach"
                    className="inline-flex items-center px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white font-semibold rounded-2xl transition-all duration-200 border border-dark-600"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Ask AI Coach
                  </Link>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
