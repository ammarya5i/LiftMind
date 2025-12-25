const _DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
const _DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

export interface VisionMessage {
  role: 'system' | 'user'
  content: Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: {
      url: string
      detail?: 'low' | 'high' | 'auto'
    }
  }>
}

/**
 * Analyze an image (form check or progress photo) using DeepSeek Vision
 */
export async function analyzeImage(
  imageUrl: string,
  userPrompt: string,
  analysisType: 'form' | 'progress',
  mediaType?: 'image' | 'video'
): Promise<string> {
  // Detect media type from data URL if not provided
  const detectedType = mediaType || (imageUrl.startsWith('data:video') ? 'video' : 'image')
  
  // Route through our API to handle provider differences and model fallbacks
  try {
    const res = await fetch('/api/vision/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageDataUrl: imageUrl, 
        userPrompt, 
        analysisType,
        mediaType: detectedType 
      }),
    })
    if (!res.ok) {
      const msg = await res.text()
      
      // Check for rate limit errors
      if (msg.includes('rate_limit_exceeded') || msg.includes('Rate limit reached')) {
        return `⏳ **Rate Limit Reached**

The vision AI has hit its usage limit for now. But I can still help!

**Your question:** ${userPrompt}

**What you can do:**
1. **Wait a few hours** - The limit resets automatically
2. **Add payment method** - Get instant access at https://platform.openai.com/account/billing (costs ~$0.005 per analysis)
3. **Describe what you see** - Tell me about the ${analysisType === 'form' ? 'lift' : 'progress'} and I'll give you detailed feedback

**Common things to mention:**
${analysisType === 'form' ? `
- Which lift (squat/bench/deadlift)?
- Bar path observations
- Joint angles or positioning concerns
- Where you feel unstable or weak` : `
- How long you've been training
- Current body weight and goals
- Which areas look developed
- What you want to focus on`}

I'm here to help either way! 💪`
      }
      
      throw new Error(msg || 'Vision API error')
    }
    const data = await res.json()
    return data.analysis as string
  } catch (err) {
    console.error('Vision analyze error:', err)
    return getTextBasedFormAdvice(userPrompt, analysisType)
  }
}

/**
 * Analyze image using Google Gemini (cheaper, excellent vision)
 */
async function _analyzeWithGemini(
  imageUrl: string,
  userPrompt: string,
  analysisType: 'form' | 'progress'
): Promise<string> {
  const systemPrompts = {
    form: `You are an expert powerlifting coach analyzing exercise form. 

When analyzing form:
- Identify the exercise being performed
- Assess key technical points (bar path, joint angles, positioning)
- Note strengths in the lifter's form
- Point out areas for improvement with specific cues
- Provide 2-3 actionable corrections prioritized by importance
- Comment on safety concerns if any
- Be encouraging and constructive

Structure your response:
1. Exercise identification
2. What looks good
3. What to improve (with specific cues)
4. Safety notes (if applicable)

Be detailed but practical. Use powerlifting terminology correctly.`,
    
    progress: `You are an expert powerlifting coach analyzing physique and progress photos.

When analyzing progress:
- Note visible muscle development
- Comment on symmetry and proportions
- Assess if physique supports powerlifting goals
- Provide encouragement on visible progress
- Suggest areas to focus on for strength sports
- Be motivating and positive

Structure your response:
1. Overall assessment
2. Visible strengths
3. Areas to develop for powerlifting
4. Encouragement and next steps

Focus on strength sport performance, not bodybuilding aesthetics.`
  }

  try {
    // Convert data URL to base64 without prefix
    const base64Data = imageUrl.split(',')[1]
    
    // Determine mime type from data URL
    const mimeMatch = imageUrl.match(/data:([^;]+);/)
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'

    const requestBody = {
      contents: [{
        parts: [
          {
            text: `${systemPrompts[analysisType]}\n\n${userPrompt}`
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      console.error('Invalid Gemini response:', data)
      throw new Error('Invalid response from Gemini API')
    }

    return data.candidates[0].content.parts[0].text
  } catch (error) {
    console.error('Error with Gemini:', error)
    throw error
  }
}

/**
 * Analyze image using OpenAI GPT-4 Vision
 */
async function _analyzeWithOpenAI(
  imageUrl: string,
  userPrompt: string,
  analysisType: 'form' | 'progress'
): Promise<string> {
  const systemPrompts = {
    form: `You are an expert powerlifting coach analyzing exercise form. 

When analyzing form:
- Identify the exercise being performed
- Assess key technical points (bar path, joint angles, positioning)
- Note strengths in the lifter's form
- Point out areas for improvement with specific cues
- Provide 2-3 actionable corrections prioritized by importance
- Comment on safety concerns if any
- Be encouraging and constructive

Structure your response:
1. Exercise identification
2. What looks good
3. What to improve (with specific cues)
4. Safety notes (if applicable)

Be detailed but practical. Use powerlifting terminology correctly.`,
    
    progress: `You are an expert powerlifting coach analyzing physique and progress photos.

When analyzing progress:
- Note visible muscle development
- Comment on symmetry and proportions
- Assess if physique supports powerlifting goals
- Provide encouragement on visible progress
- Suggest areas to focus on for strength sports
- Be motivating and positive
- Avoid being overly critical about aesthetics

Structure your response:
1. Overall assessment
2. Visible strengths
3. Areas to develop for powerlifting
4. Encouragement and next steps

Focus on strength sport performance, not bodybuilding aesthetics.`
  }

  try {
    const messages: VisionMessage[] = [
      {
        role: 'system',
        content: [{ type: 'text', text: systemPrompts[analysisType] }]
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'high' // High detail for better form analysis
            }
          },
          {
            type: 'text',
            text: userPrompt
          }
        ]
      }
    ]

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // GPT-4o-mini has vision and is cost-effective
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error analyzing image:', error)
    throw error
  }
}

/**
 * Convert file to base64 data URL for API
 */
export async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Extract frame from video for analysis
 */
export async function extractVideoFrame(file: File, timeInSeconds: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas not supported'))
      return
    }

    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.src = URL.createObjectURL(file)

    let frameExtracted = false

    const cleanup = () => {
      URL.revokeObjectURL(video.src)
      video.remove()
    }

    video.onloadedmetadata = () => {
      // Ensure video dimensions are valid
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        cleanup()
        reject(new Error('Invalid video dimensions'))
        return
      }
      
      // Seek to a frame (1 second or middle of video)
      const seekTime = Math.min(timeInSeconds, video.duration / 2)
      video.currentTime = seekTime
    }

    video.onseeked = () => {
      if (frameExtracted) return
      frameExtracted = true

      try {
        // Set canvas size
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert to JPEG with quality 0.85 (balance between quality and size)
        const dataURL = canvas.toDataURL('image/jpeg', 0.85)
        
        cleanup()
        resolve(dataURL)
      } catch (error) {
        cleanup()
        reject(new Error(`Failed to extract frame: ${error}`))
      }
    }

    video.onerror = () => {
      cleanup()
      reject(new Error(`Error loading video: ${video.error?.message || 'Unknown error'}`))
    }

    // Timeout fallback (30 seconds)
    setTimeout(() => {
      if (!frameExtracted) {
        cleanup()
        reject(new Error('Video frame extraction timeout'))
      }
    }, 30000)
  })
}

/**
 * Validate file type and size
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  const maxImageSize = 10 * 1024 * 1024 // 10MB for images
  const maxVideoSize = 100 * 1024 * 1024 // 100MB for videos
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm']

  const isImage = allowedImageTypes.includes(file.type)
  const isVideo = allowedVideoTypes.includes(file.type)

  // Check size based on type
  if (isImage && file.size > maxImageSize) {
    return { valid: false, error: 'Image must be less than 10MB' }
  }
  
  if (isVideo && file.size > maxVideoSize) {
    return { valid: false, error: 'Video must be less than 100MB' }
  }

  if (!isImage && !isVideo) {
    return { 
      valid: false, 
      error: 'File must be an image (JPG, PNG, WEBP) or video (MP4, MOV, WEBM)' 
    }
  }

  return { valid: true }
}

/**
 * Fallback: Provide text-based form advice when vision API not available
 */
function getTextBasedFormAdvice(userPrompt: string, analysisType: 'form' | 'progress'): string {
  if (analysisType === 'form') {
    return `📸 **Image uploaded successfully!**

I can see you've uploaded a ${analysisType === 'form' ? 'form check' : 'progress photo'}, but I need OpenAI API access for visual analysis.

**For now, I can help with:**

🎯 **Describe what you're seeing:**
Tell me:
- Which exercise (squat/bench/deadlift)?
- What specifically concerns you?
- Where do you feel weak in the movement?
- Any pain or discomfort?

💡 **Common form issues I can help with:**

**Squat:**
- Depth issues
- Knee cave
- Forward lean
- Bar path
- Losing tightness

**Bench:**
- Bar path
- Shoulder positioning
- Leg drive
- Arch setup
- Touch point

**Deadlift:**
- Back rounding
- Bar distance from shins
- Hip positioning
- Lockout issues
- Setup

Just describe what you see or feel, and I'll provide specific cues and corrections!

**Want full visual analysis?** 
Add your OpenAI API key to enable GPT-4 Vision for automatic form analysis.`
  } else {
    return `📸 **Progress photo uploaded!**

While I can't analyze the image visually without OpenAI API access, I can definitely help with progress tracking!

**Tell me:**
- How long have you been training?
- What's your current weight?
- What are you focusing on (bulk/cut/maintain)?
- How do YOU feel your physique is developing?
- Any specific concerns?

**I can help with:**
- Muscle group priorities for powerlifting
- Bulk/cut recommendations
- Training adjustments
- Strength-to-weight optimization

**Want visual analysis?**
Add your OpenAI API key to enable GPT-4 Vision for automatic progress photo analysis.`
  }
}


