'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/Button'
import { Check, X, Dumbbell, Trophy, Settings, Loader2 } from 'lucide-react'
import { WorkoutAction, PRAction, ProfileAction } from '@/types/ai-actions'

interface ActionCardProps {
  action: WorkoutAction | PRAction | ProfileAction
  onConfirm: () => void
  onDecline: () => void
  loading?: boolean
}

export function ActionCard({ action, onConfirm, onDecline, loading }: ActionCardProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mt-4 p-4 rounded-xl border-2 border-electric-500/30 bg-gradient-to-br from-electric-500/10 to-champion-500/5 backdrop-blur-sm"
      >
        {action.type === 'workout' && <WorkoutPreview action={action} />}
        {action.type === 'pr' && <PRPreview action={action} />}
        {action.type === 'profile' && <ProfilePreview action={action} />}

        <div className="flex gap-3 mt-4">
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Yes, Save It!
              </>
            )}
          </Button>
          <Button
            onClick={onDecline}
            variant="ghost"
            disabled={loading}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            No Thanks
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function WorkoutPreview({ action }: { action: WorkoutAction }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-electric-500/20 flex items-center justify-center">
          <Dumbbell className="w-4 h-4 text-electric-400" />
        </div>
        <h4 className="font-bold text-white">Log Workout?</h4>
      </div>
      
      <div className="space-y-2 text-sm">
        {action.exercises.map((ex, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 px-3 bg-dark-800/50 rounded-lg">
            <span className="text-slate-300">{ex.exercise}</span>
            <span className="text-electric-400 font-semibold">
              {ex.sets}×{ex.reps} @ {ex.weight}kg
              {ex.rpe && <span className="text-slate-500 ml-2">RPE {ex.rpe}</span>}
            </span>
          </div>
        ))}
        
        {action.session_rpe && (
          <div className="flex justify-between items-center py-2 px-3 bg-dark-800/30 rounded-lg border border-dark-700">
            <span className="text-slate-400">Session RPE</span>
            <span className="text-champion-400 font-semibold">{action.session_rpe}/10</span>
          </div>
        )}
      </div>
    </div>
  )
}

function PRPreview({ action }: { action: PRAction }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-champion-500/20 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-champion-400" />
        </div>
        <h4 className="font-bold text-white">Log New PR?</h4>
      </div>
      
      <div className="py-3 px-4 bg-gradient-to-r from-champion-500/20 to-electric-500/10 rounded-lg border border-champion-500/30">
        <div className="flex items-center justify-between">
          <span className="text-lg text-white font-semibold">{action.exercise}</span>
          <span className="text-2xl font-bold text-champion-400">
            {action.weight} {action.unit}
          </span>
        </div>
        {action.previous_pr && action.previous_pr > 0 && (
          <div className="mt-2 text-sm text-slate-400">
            Previous: {action.previous_pr} {action.unit} 
            <span className="text-green-400 ml-2">
              (+{action.weight - action.previous_pr} {action.unit})
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfilePreview({ action }: { action: ProfileAction }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-electric-500/20 flex items-center justify-center">
          <Settings className="w-4 h-4 text-electric-400" />
        </div>
        <h4 className="font-bold text-white">Update Profile?</h4>
      </div>
      
      <div className="space-y-2 text-sm">
        {action.updates.goal && (
          <div className="py-2 px-3 bg-dark-800/50 rounded-lg">
            <span className="text-slate-400">Goal: </span>
            <span className="text-white">{action.updates.goal}</span>
          </div>
        )}
        {action.updates.experience && (
          <div className="py-2 px-3 bg-dark-800/50 rounded-lg">
            <span className="text-slate-400">Experience: </span>
            <span className="text-white capitalize">{action.updates.experience}</span>
          </div>
        )}
        {action.updates.focus_area && (
          <div className="py-2 px-3 bg-dark-800/50 rounded-lg">
            <span className="text-slate-400">Focus: </span>
            <span className="text-white">{action.updates.focus_area}</span>
          </div>
        )}
        {action.updates.units && (
          <div className="py-2 px-3 bg-dark-800/50 rounded-lg">
            <span className="text-slate-400">Units: </span>
            <span className="text-white uppercase">{action.updates.units}</span>
          </div>
        )}
      </div>
    </div>
  )
}

