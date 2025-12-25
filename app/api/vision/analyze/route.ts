import { NextResponse } from 'next/server'

// Try multiple Gemini model ids to maximize compatibility
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview-05-20',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-pro-vision',
  'gemini-2.5-pro',
  'gemini-2.5-pro-preview-05-06',
]

export async function POST(req: Request) {
  try {
    const { imageDataUrl, userPrompt, analysisType, mediaType } = await req.json()

    if (!imageDataUrl || !userPrompt || !analysisType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY

    const isVideo = mediaType === 'video' || imageDataUrl.startsWith('data:video')

    // For videos: prefer Gemini (supports native video analysis)
    // For images: prefer OpenAI (better quality, but rate limited)
    if (isVideo && geminiApiKey) {
      const analysis = await analyzeVideoWithGemini(imageDataUrl, userPrompt, analysisType, geminiApiKey)
      return NextResponse.json({ analysis })
    }

    if (openaiApiKey) {
      const analysis = await analyzeWithOpenAI(imageDataUrl, userPrompt, analysisType, openaiApiKey)
      return NextResponse.json({ analysis })
    }

    if (geminiApiKey) {
      const analysis = await analyzeWithGemini(imageDataUrl, userPrompt, analysisType, geminiApiKey)
      return NextResponse.json({ analysis })
    }

    // Text fallback if no vision API keys present
    const analysis = getTextFallback(userPrompt, analysisType)
    return NextResponse.json({ analysis })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Vision analysis failed' }, { status: 500 })
  }
}

async function analyzeVideoWithGemini(videoDataUrl: string, userPrompt: string, analysisType: 'form' | 'progress', apiKey: string): Promise<string> {
  const base64Data = videoDataUrl.split(',')[1]
  const mimeMatch = videoDataUrl.match(/data:([^;]+);/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'video/mp4'

  const systemPrompt = analysisType === 'form' ? getFormSystemPrompt() : getProgressSystemPrompt()

  // Enhanced system prompt for video analysis
  const videoSystemPrompt = `${systemPrompt}

**IMPORTANT: You are analyzing a VIDEO, not a still image. Pay attention to:**
- Movement patterns throughout the entire lift
- Bar path and trajectory
- Tempo and rep speed
- Form breakdown or compensations during the rep
- Starting position, eccentric phase, bottom position, concentric phase, lockout
- Any visible struggle or rep velocity changes (for RPE/RIR assessment)`


  // Try free-tier video models
  const videoModels = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ]

  let lastError: Error | null = null

  for (const model of videoModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      
      const requestBody = {
        contents: [{
          role: 'user',
          parts: [
            { text: `${videoSystemPrompt}\n\n${userPrompt}` },
            { inlineData: { mimeType, data: base64Data } },
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        if (res.status === 404) continue
        const msg = await res.text()
        console.error(`Gemini ${model} error:`, msg)
        lastError = new Error(`Gemini error ${res.status}: ${msg}`)
        continue
      }

      const data = await res.json()

      if (data?.promptFeedback?.blockReason) {
        lastError = new Error(`Gemini blocked request: ${data.promptFeedback.blockReason}`)
        continue
      }

      const candidate = data?.candidates?.find((c: any) => c?.content?.parts?.some((p: any) => p.text))
      if (!candidate) {
        console.error('Gemini unexpected payload:', JSON.stringify(data, null, 2))
        lastError = new Error('Invalid response from Gemini API')
        continue
      }

      const textParts = candidate.content.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text.trim())
        .filter(Boolean)

      if (textParts.length === 0) {
        console.error('Gemini missing text parts:', JSON.stringify(candidate, null, 2))
        lastError = new Error('Gemini response missing text output')
        continue
      }

      return textParts.join('\n\n')
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      continue
    }
  }

  if (lastError) throw lastError
  throw new Error('No compatible Gemini video model available')
}

async function analyzeWithGemini(imageDataUrl: string, userPrompt: string, analysisType: 'form' | 'progress', apiKey: string): Promise<string> {
  const base64Data = imageDataUrl.split(',')[1]
  const mimeMatch = imageDataUrl.match(/data:([^;]+);/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'

  const systemPrompt = analysisType === 'form' ? getFormSystemPrompt() : getProgressSystemPrompt()

  const requestBody = {
    contents: [{
      role: 'user',
      parts: [
        { text: `${systemPrompt}\n\n${userPrompt}` },
        { inlineData: { mimeType, data: base64Data } },
      ]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
    }
  }

  let lastError: Error | null = null
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        if (res.status === 404) continue
        const msg = await res.text()
        lastError = new Error(`Gemini error ${res.status}: ${msg}`)
        continue
      }

      const data = await res.json()

      if (data?.promptFeedback?.blockReason) {
        lastError = new Error(`Gemini blocked request: ${data.promptFeedback.blockReason}`)
        continue
      }

      const candidate = data?.candidates?.find((c: any) => c?.content?.parts?.some((p: any) => p.text))
      if (!candidate) {
        console.error('Gemini unexpected payload:', JSON.stringify(data, null, 2))
        lastError = new Error('Invalid response from Gemini API')
        continue
      }

      const textParts = candidate.content.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text.trim())
        .filter(Boolean)

      if (textParts.length === 0) {
        console.error('Gemini missing text parts:', JSON.stringify(candidate, null, 2))
        lastError = new Error('Gemini response missing text output')
        continue
      }

      return textParts.join('\n\n')
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      continue
    }
  }

  if (lastError) throw lastError
  throw new Error('No compatible Gemini model available for this API version')
}

async function analyzeWithOpenAI(imageDataUrl: string, userPrompt: string, analysisType: 'form' | 'progress', apiKey: string): Promise<string> {
  const systemPrompt = analysisType === 'form' ? getFormSystemPrompt() : getProgressSystemPrompt()


  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: [{ type: 'text', text: systemPrompt }],
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${msg}`)
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content || 'Unable to analyze image.'
}

function getFormSystemPrompt(): string {
  return `You are an expert fitness coach analyzing exercise form.

When analyzing form:
- Identify the exercise being performed (any exercise - strength, hypertrophy, bodyweight, etc.)
- Assess key technical points (movement path, joint angles, positioning, range of motion)
- Note strengths in the person's form
- Point out areas for improvement with specific cues
- Provide 2-3 actionable corrections prioritized by importance
- Comment on safety concerns if any
- Be encouraging and constructive

Structure your response:
1. Exercise identification
2. What looks good
3. What to improve (with specific cues)
4. Safety notes (if applicable)

Be detailed but practical. Use appropriate fitness terminology for the exercise type.`
}

function getProgressSystemPrompt(): string {
  return `You are an expert fitness coach analyzing physique and progress photos.

When analyzing progress:
- Note visible muscle development and changes
- Comment on symmetry and proportions
- Assess progress toward fitness goals (strength, hypertrophy, weight loss, etc.)
- Provide encouragement on visible progress
- Suggest areas to focus on based on their goals
- Be motivating and positive

Structure your response:
1. Overall assessment
2. Visible strengths and improvements
3. Areas to develop (based on their goals)
4. Encouragement and next steps

Be supportive of all fitness goals - strength, muscle building, weight loss, athletic performance, etc.`
}

function getTextFallback(userPrompt: string, analysisType: 'form' | 'progress'): string {
  if (analysisType === 'form') {
    return `📸 Image received! I can't analyze visually without a vision API key, but I can help.

Tell me:
- Which exercise are you performing?
- What concerns you most?
- Where do you feel weak or unstable?

I'll give you specific cues and drills to fix it.`
  }
  return `📸 Progress photo received!

Tell me your goal (bulk/cut/maintain, strength, muscle building, etc.) and concerns. I'll advise what to prioritize for your fitness goals.`
}


