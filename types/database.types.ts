export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string | null
          name: string | null
          email: string | null
          preferences: UserPreferences | null
          conversation_history: string | null
          created_at: string
        }
        Insert: {
          id?: string
          phone?: string | null
          name?: string | null
          email?: string | null
          preferences?: UserPreferences | null
          conversation_history?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string | null
          name?: string | null
          email?: string | null
          preferences?: UserPreferences | null
          conversation_history?: string | null
          created_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          date: string
          lifts: Lift[]
          notes: string | null
          session_rpe: number | null
          total_reps: number | null
          working_sets: number | null
          total_volume: number | null
          rpe_adjusted_volume: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          lifts: Lift[]
          notes?: string | null
          session_rpe?: number | null
          total_reps?: number | null
          working_sets?: number | null
          total_volume?: number | null
          rpe_adjusted_volume?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          lifts?: Lift[]
          notes?: string | null
          session_rpe?: number | null
          total_reps?: number | null
          working_sets?: number | null
          total_volume?: number | null
          rpe_adjusted_volume?: number | null
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          summary: string | null
          data: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          summary?: string | null
          data?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          summary?: string | null
          data?: Record<string, any> | null
          created_at?: string
        }
      }
      programs: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          plan: ProgramPlan
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          plan: ProgramPlan
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          plan?: ProgramPlan
          created_at?: string
        }
      }
      threads: {
        Row: {
          id: string
          user_id: string
          title: string
          topic: string
          message_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          topic: string
          message_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          topic?: string
          message_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      thread_messages: {
        Row: {
          id: string
          thread_id: string
          user_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          user_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          user_id?: string
          role?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}

export type TrainingType = 
  | 'powerlifting'
  | 'bodybuilding'
  | 'crossfit'
  | 'calisthenics'
  | 'general_strength'
  | 'endurance'
  | 'functional_fitness'

export interface UserPreferences {
  goal?: string
  units?: 'kg' | 'lbs'
  experience?: 'beginner' | 'intermediate' | 'advanced'
  focusArea?: string
  trainingType?: TrainingType
}

export const TRAINING_TYPES: { value: TrainingType; label: string; description: string }[] = [
  { value: 'powerlifting', label: 'Powerlifting', description: 'Focus on squat, bench, deadlift' },
  { value: 'bodybuilding', label: 'Bodybuilding', description: 'Muscle size and aesthetics' },
  { value: 'crossfit', label: 'CrossFit', description: 'Functional fitness and WODs' },
  { value: 'calisthenics', label: 'Calisthenics', description: 'Bodyweight training' },
  { value: 'general_strength', label: 'General Strength', description: 'Overall strength training' },
  { value: 'endurance', label: 'Endurance', description: 'Cardio and endurance training' },
  { value: 'functional_fitness', label: 'Functional Fitness', description: 'Movement-based training' },
]

export interface Lift {
  exercise: string
  sets: Set[]
}

export interface Set {
  reps: number
  weight: number
  rpe?: number
  completed?: boolean
}

export interface ProgramPlan {
  weeks: number
  daysPerWeek: number
  schedule: WorkoutDay[]
}

export interface WorkoutDay {
  day: number
  name: string
  exercises: Exercise[]
}

export interface Exercise {
  name: string
  sets: number
  reps: string
  intensity?: string
  notes?: string
}

