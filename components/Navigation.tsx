'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, TrendingUp, Settings, Dumbbell, LogOut, Zap, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/log-workout', label: 'Log Workout', icon: Dumbbell },
  { href: '/coach', label: 'AI Coach', icon: Zap },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/workouts', label: 'Workouts', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  // Hide nav on login page
  if (pathname === '/login' || pathname === '/reset-password') {
    return null
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-64 bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50 z-50">
        {/* Logo */}
        <div className="p-6 border-b border-dark-700/50">
          <Link href="/" className="group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-electric-500 to-champion-500 rounded-xl flex items-center justify-center shadow-neon">
                  <Zap className="w-6 h-6 text-dark-950" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 bg-electric-500 rounded-xl blur-lg opacity-50 -z-10 group-hover:opacity-70 transition-opacity" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold bg-gradient-to-r from-electric-400 to-champion-400 bg-clip-text text-transparent">
                  LiftMind
                </h1>
                <p className="text-[10px] text-slate-500 tracking-wider uppercase">Elite AI Coach</p>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={isActive ? {} : { x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    group relative flex items-center space-x-3 px-4 py-3.5 rounded-xl
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-electric-500/20 to-champion-500/10 text-electric-400 shadow-glow-electric' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/50'
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-electric-500 to-champion-500 rounded-r-full shadow-neon z-50" />
                  )}
                  
                  <Icon className={`w-5 h-5 transition-all ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="font-medium text-sm">{item.label}</span>
                  
                  {/* Glow effect on hover */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-electric-500/0 via-electric-500/5 to-champion-500/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </div>

        {/* Sign Out */}
        <div className="p-4 border-t border-dark-700/50 space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-dark-800/50 transition-all disabled:opacity-50 group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">{signingOut ? 'Signing out...' : 'Sign Out'}</span>
          </motion.button>
          
          <div className="text-center">
            <p className="text-[10px] text-slate-600 tracking-wider uppercase">Powered by AI</p>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav - Only visible on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-xl border-t border-dark-700/50 z-50">
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`
                    flex flex-col items-center space-y-1 px-1 py-2 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'text-electric-400 bg-electric-500/10' 
                      : 'text-slate-500 active:text-slate-300'
                    }
                  `}
                >
                  <Icon 
                    className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''}`} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  <span className="text-[9px] font-medium text-center leading-tight">{item.label}</span>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
