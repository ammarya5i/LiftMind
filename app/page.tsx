'use client'

import { useEffect, useState } from 'react'
import { Loading } from '@/components/ui/Loading'
import { getCurrentUser, getUserProfile, getWorkouts } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { Calendar, Flame, Dumbbell, Zap, Brain, Sparkles, Trophy, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getContextualTip } from '@/lib/ai-coach'
import { getTrainingType } from '@/lib/training-type'
import { calculateDashboardMetrics, DashboardMetrics } from '@/lib/dashboard-metrics'
import { TrainingType } from '@/types/database.types'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type User = Database['public']['Tables']['users']['Row']

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [aiTip, setAiTip] = useState<string>('')
  const [loadingTip, setLoadingTip] = useState(false)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadDashboard() {
    try {
      const authUser = await getCurrentUser()
      if (!authUser) {
        window.location.href = '/login'
        return
      }

      // Check if user has seen welcome page
      const { data: profileData } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', authUser.id)
        .single()
      
      const welcomeSeen = profileData?.preferences?.welcomeSeen
      if (!welcomeSeen) {
        window.location.href = '/welcome'
        return
      }

      const [profile, recentWorkouts] = await Promise.all([
        getUserProfile(authUser.id),
        getWorkouts(authUser.id, 30)
      ])
      setUser(profile)
      
      // Load user preferences safely
      let userTrainingType: TrainingType = 'general_strength'
      let userUnits: 'kg' | 'lbs' = 'kg'
      
      if (profile && (profile as any).preferences) {
        const prefs = (profile as any).preferences
        userUnits = prefs.units || 'kg'
        userTrainingType = getTrainingType(prefs)
      }
      
      // Calculate metrics based on training type
      const calculatedMetrics = calculateDashboardMetrics(
        recentWorkouts,
        userTrainingType,
        userUnits
      )
      setMetrics(calculatedMetrics)
      
      // Load AI tip
      loadAITip()
    } catch (error) {
      if (error instanceof Error && !error.message.includes('session')) {
        console.error('Error loading dashboard:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadAITip() {
    setLoadingTip(true)
    try {
      const tip = await getContextualTip('pre_workout', {
        recentWorkouts: [],
        goals: user?.preferences?.goal,
        experience: user?.preferences?.experience
      })
      setAiTip(tip)
    } catch (error) {
      console.error('Error loading AI tip:', error)
      setAiTip('Stay focused, train hard, and trust the process. 💪')
    } finally {
      setLoadingTip(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* AI Coach Section - Moved to Top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 md:p-10 bg-gradient-to-br from-electric-500/10 via-dark-800 to-champion-500/10 border border-electric-500/30"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-electric-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-electric-500 to-champion-500 rounded-2xl flex items-center justify-center shadow-neon animate-glow">
                <Brain className="w-8 h-8 md:w-10 md:h-10 text-dark-950" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2">
                    Your AI Coach
                    <Sparkles className="w-5 h-5 text-electric-400 animate-pulse" />
                  </h3>
                  <Link href="/coach">
                    <Button variant="ghost" size="sm" className="text-electric-400 hover:text-electric-300">
                      Chat Now →
                    </Button>
                  </Link>
                </div>
                {loadingTip ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-2 h-2 bg-electric-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-electric-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-electric-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    <span className="ml-2">Getting your personalized tip...</span>
                  </div>
                ) : (
                  <p className="text-slate-300 leading-relaxed text-base md:text-lg">{aiTip}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl p-6 md:p-10 bg-gradient-to-br from-dark-800 via-dark-900 to-dark-950 border border-dark-700/50"
        >
          {/* Animated glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-electric-500/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-champion-500/15 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 md:space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-sm font-medium text-electric-400 tracking-wider uppercase flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-5xl lg:text-6xl font-display font-bold"
              >
                <span className="bg-gradient-to-r from-electric-400 to-champion-400 bg-clip-text text-transparent">
                  Welcome back,
                </span>
                <br />
                <span className="text-white">{user?.name || 'Athlete'}!</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-slate-400 text-base md:text-lg"
              >
                Ready to crush today&apos;s session? Let&apos;s make it count. 💪
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Link href="/log-workout">
                <button className="group relative px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-electric-600 to-electric-500 text-white font-bold text-base md:text-lg rounded-2xl overflow-hidden shadow-neon hover:shadow-neon-lg transition-all duration-300 hover:scale-105">
                  <span className="relative z-10 flex items-center space-x-2">
                    <Dumbbell className="w-5 h-5 md:w-6 md:h-6" />
                    <span>Log Workout</span>
                  </span>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Primary Metric */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6 rounded-2xl hover:border-champion-500/50 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
              <p className="text-sm text-slate-500 uppercase tracking-wide">{metrics.primaryMetric.label}</p>
              <p className="text-4xl font-display font-bold text-white mt-2">{metrics.primaryMetric.value || '—'}</p>
              <p className="text-xs text-slate-600 mt-1">
                {metrics.primaryMetric.value ? `${metrics.primaryMetric.unit} • ${metrics.primaryMetric.description}` : 'No data yet'}
              </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-champion-500/20 to-champion-500/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="w-7 h-7 text-champion-400" />
              </div>
            </div>
          </motion.div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.secondaryMetrics.map((metric, index) => {
            const IconComponent = metric.icon === 'Flame' ? Flame : metric.icon === 'Calendar' ? Calendar : TrendingUp
            const getColorClasses = (color: string) => {
              if (color === 'electric') {
                return {
                  border: 'hover:border-electric-500/50',
                  bg: 'from-electric-500/20 to-electric-500/5',
                  text: 'text-electric-400'
                }
              } else if (color === 'green') {
                return {
                  border: 'hover:border-green-500/50',
                  bg: 'from-green-500/20 to-green-500/5',
                  text: 'text-green-400'
                }
              } else {
                return {
                  border: 'hover:border-champion-500/50',
                  bg: 'from-champion-500/20 to-champion-500/5',
                  text: 'text-champion-400'
                }
              }
            }
            const colors = getColorClasses(metric.color)
            
            return (
          <motion.div
                key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className={`glass-card p-6 rounded-2xl ${colors.border} transition-all group`}
          >
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm text-slate-500 uppercase tracking-wide">{metric.label}</p>
                    <p className="text-4xl font-display font-bold text-white mt-2">{metric.value || '—'}</p>
                    <p className="text-xs text-slate-600 mt-1">{metric.unit ? `${metric.unit}` : 'No data'}</p>
              </div>
                  <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`w-7 h-7 ${colors.text}`} />
              </div>
            </div>
          </motion.div>
            )
          })}
        </div>

        {/* Highlights */}
        {metrics.highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="glass-card p-8 rounded-2xl border-champion-500/30"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-champion-500/20 to-champion-600/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-champion-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white">Key Highlights</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {metrics.highlights.map((highlight, index) => {
                const colorConfigs = [
                  { bg: 'bg-electric-500/10', border: 'border-electric-500/20', text: 'text-electric-400' },
                  { bg: 'bg-champion-500/10', border: 'border-champion-500/20', text: 'text-champion-400' },
                  { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' }
                ]
                const color = colorConfigs[index % colorConfigs.length]
                return (
                  <div key={highlight.title} className={`text-center p-4 ${color.bg} rounded-xl border ${color.border}`}>
                    <p className={`text-sm ${color.text} font-medium mb-2`}>{highlight.title.toUpperCase()}</p>
                    <p className="text-3xl font-bold text-white">{highlight.value} {highlight.unit}</p>
                    {highlight.change !== undefined && (
                      <p className={`text-xs mt-1 ${highlight.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {highlight.change >= 0 ? '+' : ''}{highlight.change}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/coach">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="glass-card p-8 rounded-2xl cursor-pointer hover:border-electric-500/50 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-electric-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-neon group-hover:shadow-neon-lg transition-all">
                  <Zap className="w-7 h-7 text-dark-950" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">AI Coach Chat</h3>
                  <p className="text-slate-400 text-sm">Get form checks, programming advice, and fitness insights from your AI coach.</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/progress">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="glass-card p-8 rounded-2xl cursor-pointer hover:border-champion-500/50 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-champion-500 to-champion-600 rounded-2xl flex items-center justify-center shadow-champion group-hover:shadow-champion-lg transition-all">
                  <TrendingUp className="w-7 h-7 text-dark-950" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">Lift Progression</h3>
                  <p className="text-slate-400 text-sm">Track your exercise progression with detailed charts and stats for all your lifts.</p>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  )
}
