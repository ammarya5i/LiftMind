export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Send a chat message via the Next.js API route (server-side) to avoid CORS issues
 */
export async function sendChatMessage(
  userMessage: string, 
  conversationHistory: ChatMessage[] = [],
  userContext: string = ''
): Promise<string> {
  try {
    // Call the Next.js API route instead of DeepSeek directly (avoids CORS)
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage,
        conversationHistory,
        userContext,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.message || typeof data.message !== 'string') {
      throw new Error('Invalid response from AI service')
    }

    return data.message
  } catch (error) {
    console.error('Error calling AI chat:', error)
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('not configured')) {
        throw new Error('AI service not configured yet. Please contact support.')
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Too many requests. Please wait a moment and try again.')
      }
      if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('CORS')) {
        throw new Error('Network error. Please check your connection and try again.')
      }
    }
    
    throw error
  }
}

// Alternative: Use n8n webhook (recommended for production)
export async function sendMessageViaWebhook(message: string, userPhone: string): Promise<string> {
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
  
  if (!webhookUrl) {
    throw new Error('n8n webhook not configured')
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: userPhone,
      text: message,
    }),
  })

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.message
}

