/**
 * Environment variable validation
 * Run this on app startup to ensure all required env vars are set
 */

export function validateEnvironment() {
  const errors: string[] = []
  const warnings: string[] = []

  // Required for production
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  // AI API keys - at least one should be set
  const hasDeepSeek = !!(process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY)
  const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY)
  const hasOpenAI = !!(process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY)

  if (!hasDeepSeek && !hasGemini && !hasOpenAI) {
    warnings.push('No AI API keys found. AI chat and vision features will not work.')
  }

  // Vision API - at least one should be set for vision features
  if (!hasGemini && !hasOpenAI) {
    warnings.push('No vision API keys found. Image/video analysis will not work.')
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:')
    errors.forEach(error => console.error(`  - ${error}`))
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${errors.join(', ')}`)
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:')
    warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Environment variables validated successfully')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}




