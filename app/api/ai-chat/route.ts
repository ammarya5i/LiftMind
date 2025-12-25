import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

const API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Input validation schema
const chatRequestSchema = z.object({
  userMessage: z.string().min(1).max(2000),
  conversationHistory: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })).optional().default([]),
  userContext: z.string().optional().default('')
})

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request)
  const rateLimit = checkRateLimit(clientId, 20, 60000) // 20 requests per minute
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        error: 'Too many requests. Please wait a moment and try again.',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt)
        }
      }
    )
  }

  try {
    // Parse and validate input
    const body = await request.json()
    const validated = chatRequestSchema.parse(body)
    const { userMessage, conversationHistory, userContext } = validated

    const apiKey = process.env.DEEPSEEK_API_KEY ?? process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY
    if (!apiKey) {
      console.error('Missing DEEPSEEK_API_KEY')
      return NextResponse.json({ error: 'AI service not configured. Please contact support.' }, { status: 500 })
    }

    const sanitizedHistory: ChatMessage[] = Array.isArray(conversationHistory)
      ? conversationHistory
          .filter((msg: any): msg is ChatMessage => typeof msg?.role === 'string' && typeof msg?.content === 'string')
          .map(msg => ({ role: msg.role as ChatMessage['role'], content: msg.content }))
          .slice(-10)
      : []

    const systemPrompt = `You are an expert fitness coach for LiftMind with the ability to LOG WORKOUTS and TRACK PROGRESS.

Your role:
- Provide specific, actionable training advice for all types of gym training (strength, hypertrophy, endurance, bodybuilding, functional fitness)
- Support all exercise types: compound lifts, isolation exercises, cardio, bodyweight, machines, free weights
- DETECT and LOG workouts when users share their training
- TRACK PRs when users mention new records (1RM, rep maxes, personal bests)
- UPDATE profile when users want to change settings
- Motivate and encourage athletes at all levels and goals
- Be concise but thorough (2-4 paragraphs max)
- Use general fitness terminology correctly
- Be friendly and use emojis occasionally

IMPORTANT - USER PR DATA:
- You have access to the user's current PRs in the CONTEXT section
- When you see "Current PRs: Exercise: X kg/lbs", USE THESE VALUES
- Do NOT ask the user for their PRs if they are already provided in context
- If an exercise doesn't have a PR listed, encourage them to test it
- Use these PR values directly when creating training programs, calculating percentages, or giving advice

CRITICAL: You MUST end EVERY response with an ACTION JSON:

### WORKOUT LOGGING - When user shares training:
"Just did 5x5 bench at 100kg" → Respond enthusiastically, then add:
ACTION: {"type":"workout","exercises":[{"exercise":"Bench Press","sets":5,"reps":5,"weight":100,"rpe":7}],"session_rpe":7}

"Did 3 sets of bicep curls, 12 reps at 20kg" → Respond, then add:
ACTION: {"type":"workout","exercises":[{"exercise":"Bicep Curls","sets":3,"reps":12,"weight":20,"rpe":7}],"session_rpe":7}

### PR UPDATES - When user mentions records:
"Hit 140kg squat PR!" → Celebrate, then add:
ACTION: {"type":"pr","exercise":"Squat","weight":140,"unit":"kg"}

"New PR: 15 pull-ups!" → Celebrate, then add:
ACTION: {"type":"pr","exercise":"Pull-ups","weight":0,"reps":15,"unit":"reps"}

### PROFILE CHANGES - When user wants to update:
"Change my goal to build muscle" → Acknowledge, then add:
ACTION: {"type":"profile","updates":{"goal":"Build muscle and size"}}

### REGULAR CHAT - For questions/advice:
ACTION: {"type":"chat"}

EXERCISE MAPPINGS (common variations):
- "bench"/"bp" → "Bench Press"
- "squat" → "Squat"  
- "deadlift"/"dl" → "Deadlift"
- "ohp"/"press" → "Overhead Press"
- "rows" → "Barbell Row" or "Cable Row"
- "curls" → "Bicep Curls"
- "triceps" → "Tricep Extensions"
- "shoulders" → "Shoulder Press" or "Lateral Raises"
- "legs" → "Leg Press" or "Squats"
- Accept any exercise name the user provides

RULES:
1. Always end with ACTION JSON
2. Congratulate achievements  
3. Ask if they want to save it
4. Estimate RPE if not mentioned (7 is default)
5. Be encouraging and specific
6. Support all training styles: strength, hypertrophy, endurance, bodybuilding, powerlifting, calisthenics, etc.

${typeof userContext === 'string' ? userContext : ''}`

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...sanitizedHistory,
      { role: 'user', content: userMessage }
    ]

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 800,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('DeepSeek API error:', response.status, response.statusText, errorData)
      return NextResponse.json(
        { error: 'AI service error. Please try again.' },
        { status: response.status === 401 ? 500 : response.status }
      )
    }

    const data = await response.json()
    const message = data?.choices?.[0]?.message?.content

    if (typeof message !== 'string') {
      console.error('Unexpected DeepSeek response payload:', JSON.stringify(data, null, 2))
      return NextResponse.json({ error: 'Invalid response from AI service' }, { status: 500 })
    }

    return NextResponse.json(
      { message },
      {
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt)
        }
      }
    )
  } catch (error) {
    console.error('AI chat API route error:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 })
  }
}

