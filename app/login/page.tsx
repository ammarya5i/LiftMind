'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { Dumbbell } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'reset') {
        // Password reset
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setError('Success! Check your email for the password reset link.')
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/')
      } else {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        
        // Check if email confirmation is required
        const { data: session } = await supabase.auth.getSession()
        if (session.session) {
          // No email confirmation required - user is logged in
          router.push('/')
        } else {
          // Email confirmation required - switch to sign in mode
          setError('Success! Account created. Check your email for the confirmation link, then sign in.')
          setTimeout(() => {
            setMode('signin')
            setError('')
          }, 3000)
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/10 to-accent/10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-4">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">LiftMind</h1>
            <p className="text-slate-600 mt-2">Your AI Gym Coach</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />

            {mode !== 'reset' && (
              <Input
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            )}

            {error && (
              <div className={`p-3 rounded-xl text-sm ${
                error.includes('Check your email') 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading 
                ? 'Loading...' 
                : mode === 'reset' 
                  ? 'Send Reset Link' 
                  : mode === 'signin' 
                    ? 'Sign In' 
                    : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            {mode === 'signin' && (
              <button
                onClick={() => setMode('reset')}
                className="text-sm text-slate-600 hover:text-primary hover:underline block w-full"
              >
                Forgot password?
              </button>
            )}
            
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm text-primary hover:underline block w-full"
            >
              {mode === 'reset'
                ? 'Back to sign in'
                : mode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

