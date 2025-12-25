-- Migration: Add conversation threads feature
-- Run this in Supabase SQL Editor after the main schema

-- Threads table
CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thread messages table
CREATE TABLE IF NOT EXISTS thread_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_messages ENABLE ROW LEVEL SECURITY;

-- Policies for threads
CREATE POLICY "Users can view their own threads" 
  ON threads FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own threads" 
  ON threads FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads" 
  ON threads FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads" 
  ON threads FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for thread_messages
CREATE POLICY "Users can view their own thread messages" 
  ON thread_messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thread messages" 
  ON thread_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thread messages" 
  ON thread_messages FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX threads_user_id_idx ON threads(user_id);
CREATE INDEX threads_updated_at_idx ON threads(updated_at DESC);
CREATE INDEX thread_messages_thread_id_idx ON thread_messages(thread_id);
CREATE INDEX thread_messages_created_at_idx ON thread_messages(created_at);

-- Function to update thread's updated_at timestamp
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE threads 
  SET updated_at = NOW() 
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update thread timestamp when message added
CREATE TRIGGER on_message_added
  AFTER INSERT ON thread_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_timestamp();

