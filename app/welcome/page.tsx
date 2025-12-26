'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Dumbbell, Zap, TrendingUp, MessageSquare, Target, Users, ArrowRight } from 'lucide-react'

export default function WelcomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const checkUser = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }
      setLoading(false)
    } catch {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    checkUser()
  }, [checkUser])


  async function handleGetStarted() {
    try {
      const user = await getCurrentUser()
      if (!user) return

      // Mark welcome as seen in user preferences
      const { data: profile } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single()

      const preferences = profile?.preferences || {}
      await supabase
        .from('users')
        .update({
          preferences: {
            ...preferences,
            welcomeSeen: true
          }
        })
        .eq('id', user.id)

      router.push('/')
    } catch (error) {
      console.error('Error saving welcome status:', error)
      router.push('/')
    }
  }

  const features = [
    {
      icon: Dumbbell,
      title: 'Log Your Workouts',
      description: 'Track every exercise, set, rep, and weight. Simple interface designed for everyone.',
      color: 'from-electric-500 to-blue-500'
    },
    {
      icon: Zap,
      title: 'AI Fitness Coach',
      description: 'Get personalized advice, form checks, and training tips from your AI coach.',
      color: 'from-champion-500 to-orange-500'
    },
    {
      icon: TrendingUp,
      title: 'Track Progress',
      description: 'See your strength gains, volume trends, and achievements over time.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: MessageSquare,
      title: 'Ask Questions',
      description: 'Chat with your AI coach about nutrition, programming, form, and more.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Target,
      title: 'All Training Styles',
      description: 'Powerlifting, Bodybuilding, CrossFit, Calisthenics, and more - we support them all.',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      icon: Users,
      title: 'For Everyone',
      description: 'Whether you\'re a beginner or advanced athlete, LiftMind adapts to your level.',
      color: 'from-rose-500 to-pink-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-electric-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block mb-6"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-electric-500 to-champion-500 rounded-3xl flex items-center justify-center shadow-neon-lg">
              <Dumbbell className="w-10 h-10 md:w-12 md:h-12 text-dark-950" />
            </div>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
            <span className="bg-gradient-to-r from-electric-400 to-champion-400 bg-clip-text text-transparent">
              Welcome to LiftMind
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto">
            Your AI-powered fitness companion for tracking workouts, getting coaching advice, and achieving your goals.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="glass-card p-6 rounded-2xl hover:border-electric-500/50 transition-all group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-dark-950" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass-card p-8 md:p-12 rounded-3xl mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-8 text-center">
            How It Works
          </h2>
          <div className="space-y-6">
            {[
              { step: 1, title: 'Log Your Workouts', desc: 'Record exercises, sets, reps, and weights after each session.' },
              { step: 2, title: 'Track Your Progress', desc: 'View charts and stats showing your strength gains over time.' },
              { step: 3, title: 'Get AI Coaching', desc: 'Ask questions, get form tips, and receive personalized training advice.' },
              { step: 4, title: 'Achieve Your Goals', desc: 'Stay consistent and watch your fitness journey unfold.' }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-electric-500 to-champion-500 rounded-xl flex items-center justify-center font-bold text-dark-950">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="text-center"
        >
          <Button
            onClick={handleGetStarted}
            className="px-8 py-4 text-lg font-bold"
            size="lg"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-slate-500 text-sm mt-4">
            You can always access this guide from your settings
          </p>
        </motion.div>
      </div>
    </div>
  )
}

