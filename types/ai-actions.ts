// AI-detected actions from conversation

export type AIActionType = 'workout' | 'pr' | 'profile' | 'chat'

export interface Exercise {
  exercise: string
  sets: number
  reps: number
  weight: number
  rpe?: number
  completed?: boolean
}

export interface WorkoutAction {
  type: 'workout'
  exercises: Exercise[]
  session_rpe?: number
  notes?: string
  date?: string
}

export interface PRAction {
  type: 'pr'
  exercise: string
  weight: number
  unit: string
  previous_pr?: number
}

export interface ProfileAction {
  type: 'profile'
  updates: {
    goal?: string
    experience?: string
    focus_area?: string
    units?: 'kg' | 'lbs'
  }
}

export interface ChatAction {
  type: 'chat'
}

export type AIAction = WorkoutAction | PRAction | ProfileAction | ChatAction

export interface ParsedAIResponse {
  action: AIAction
  message: string
  confidence: number
  raw_response: string
}

