-- LiftMind Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT,
  name TEXT,
  email TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  conversation_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read/update their own data
CREATE POLICY "Users can view their own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Workouts table
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  lifts JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own workouts
CREATE POLICY "Users can view their own workouts" 
  ON workouts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts" 
  ON workouts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" 
  ON workouts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" 
  ON workouts FOR DELETE 
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX workouts_user_id_idx ON workouts(user_id);
CREATE INDEX workouts_date_idx ON workouts(date DESC);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own sessions
CREATE POLICY "Users can view their own sessions" 
  ON sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
  ON sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_created_at_idx ON sessions(created_at DESC);

-- Programs table
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own programs
CREATE POLICY "Users can view their own programs" 
  ON programs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own programs" 
  ON programs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs" 
  ON programs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs" 
  ON programs FOR DELETE 
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX programs_user_id_idx ON programs(user_id);

-- Function to automatically create a user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (new.id, new.email, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Sample data (optional - for testing)
-- Uncomment to insert sample data

/*
-- Insert a test user (you'll need to replace with actual auth user ID)
INSERT INTO users (id, name, phone, email, preferences) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test Athlete', '+1234567890', 'test@example.com', 
   '{"goal": "Increase squat to 500 lbs", "units": "lbs", "experience": "intermediate", "focusArea": "Squat"}'::jsonb);

-- Insert a sample workout
INSERT INTO workouts (user_id, date, lifts, notes) VALUES
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 
   '[
     {
       "exercise": "Squat",
       "sets": [
         {"reps": 5, "weight": 315, "rpe": 7, "completed": true},
         {"reps": 5, "weight": 335, "rpe": 8, "completed": true},
         {"reps": 5, "weight": 355, "rpe": 9, "completed": false}
       ]
     },
     {
       "exercise": "Bench Press",
       "sets": [
         {"reps": 8, "weight": 225, "rpe": 7, "completed": true},
         {"reps": 8, "weight": 235, "rpe": 8, "completed": true},
         {"reps": 8, "weight": 245, "rpe": 9, "completed": true}
       ]
     }
   ]'::jsonb,
   'Felt strong today, squat moving well');

-- Insert a sample session
INSERT INTO sessions (user_id, summary, data) VALUES
  ('00000000-0000-0000-0000-000000000001', 
   'Great squat session! Your technique is improving. Focus on keeping your chest up in the bottom position.',
   '{"feedback": "positive", "focus": "squat technique"}'::jsonb);

-- Insert a sample program
INSERT INTO programs (user_id, name, description, plan) VALUES
  ('00000000-0000-0000-0000-000000000001',
   '12-Week Squat Peak',
   'Progressive overload program focused on increasing squat strength',
   '{
     "weeks": 12,
     "daysPerWeek": 4,
     "schedule": [
       {
         "day": 1,
         "name": "Squat Focus",
         "exercises": [
           {"name": "Squat", "sets": 4, "reps": "5", "intensity": "80%"},
           {"name": "Romanian Deadlift", "sets": 3, "reps": "8", "intensity": "70%"},
           {"name": "Leg Press", "sets": 3, "reps": "12", "intensity": "RPE 8"}
         ]
       }
     ]
   }'::jsonb);
*/

