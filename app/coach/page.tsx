'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Loading } from '@/components/ui/Loading'
import { MediaUpload } from '@/components/MediaUpload'
import { ActionCard } from '@/components/ActionCard'
import { sendChatMessage } from '@/lib/deepseek'
import { getCurrentUser } from '@/lib/supabase'
import { loadConversationHistory, saveConversation, getUserContext } from '@/lib/conversation'
import { getThreadMessages, addMessageToThread, getUserThreads, createThread, deleteThread } from '@/lib/threads'
import { parseAIResponse } from '@/lib/ai-actions'
import { saveWorkoutAction, savePRAction, saveProfileAction } from '@/lib/action-handlers'
import { Database } from '@/types/database.types'
import { ParsedAIResponse } from '@/types/ai-actions'
import { Send, Bot, User, X, ChevronDown, Plus, Trash2, MessageSquare, Camera, Image } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type UserProfile = Database['public']['Tables']['users']['Row']

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  parsedAction?: ParsedAIResponse
}

interface Thread {
  id: string
  title: string
  topic: string
  created_at: string
  updated_at: string
  message_count: number
}

function CoachPageContent() {
  const searchParams = useSearchParams()
  const threadId = searchParams?.get('thread')
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [showMediaUpload, setShowMediaUpload] = useState(false)
  const [analysisType, setAnalysisType] = useState<'form' | 'progress'>('form')
  
  // Thread management state
  const [threads, setThreads] = useState<Thread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(threadId)
  const [showThreadDropdown, setShowThreadDropdown] = useState(false)
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [newThreadTopic, setNewThreadTopic] = useState('')
  
  // AI Action handling state
  const [pendingAction, setPendingAction] = useState<{ messageId: string; action: ParsedAIResponse } | null>(null)
  const [savingAction, setSavingAction] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showThreadDropdown && !(event.target as Element).closest('.thread-dropdown')) {
        setShowThreadDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showThreadDropdown])

  async function loadUserData() {
    try {
      const authUser = await getCurrentUser()
      if (!authUser) {
        window.location.href = '/login'
        return
      }
      
      setUserId(authUser.id)

      // Load user's threads
      const userThreads = await getUserThreads(authUser.id)
      setThreads(userThreads)

      // Load conversation history based on thread
      if (threadId) {
        // Load specific thread messages
        const threadMessages = await getThreadMessages(threadId)
        
        if (threadMessages.length > 0) {
          const loadedMessages: Message[] = threadMessages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }))
          
          setMessages(loadedMessages)
          setCurrentThreadId(threadId)
          setHistoryLoaded(true)
        } else {
          // New thread, show welcome
          setMessages([{
            id: '1',
            role: 'assistant',
            content: "Hey! Let's talk about this topic. What would you like to know?",
            timestamp: new Date(),
          }])
          setCurrentThreadId(threadId)
          setHistoryLoaded(true)
        }
      } else {
        // Load main conversation history (backward compatible)
        const history = await loadConversationHistory(authUser.id, 50)
        
        if (history.length > 0) {
          const loadedMessages: Message[] = history.map((msg, idx) => ({
            id: `history-${idx}`,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          }))
          
          setMessages(loadedMessages)
          setHistoryLoaded(true)
        } else {
          setMessages([{
            id: '1',
            role: 'assistant',
            content: "Hey! I'm your AI fitness coach. I remember all our conversations, so I'll get to know you better over time. I can help with any type of training - strength, hypertrophy, endurance, bodybuilding, powerlifting, and more! What can I help you with today?",
            timestamp: new Date(),
          }])
        }
      }
    } catch (error) {
      // Only log non-auth errors
      if (error instanceof Error && !error.message.includes('session')) {
        console.error('Error loading user data:', error)
      }
    } finally {
      setInitialLoading(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadThread(threadId: string) {
    try {
      const threadMessages = await getThreadMessages(threadId)
      
      if (threadMessages.length > 0) {
        const loadedMessages: Message[] = threadMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }))
        
        setMessages(loadedMessages)
        setCurrentThreadId(threadId)
        setHistoryLoaded(true)
      } else {
        setMessages([])
        setCurrentThreadId(threadId)
        setHistoryLoaded(true)
      }
    } catch (error) {
      console.error('Error loading thread:', error)
    }
  }

  async function createNewThread() {
    if (!userId || !newThreadTitle.trim()) return

    try {
      const thread = await createThread(userId, newThreadTitle.trim(), newThreadTopic.trim())
      
      // Add to threads list
      setThreads(prev => [thread, ...prev])
      
      // Switch to new thread
      await loadThread(thread.id)
      
      // Reset form
      setNewThreadTitle('')
      setNewThreadTopic('')
      setShowNewThreadForm(false)
      setShowThreadDropdown(false)
    } catch (error) {
      console.error('Error creating thread:', error)
    }
  }

  async function deleteThreadAndSwitch(threadId: string) {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return
    }

    try {
      await deleteThread(threadId)
      
      // Remove from threads list
      setThreads(prev => prev.filter(t => t.id !== threadId))
      
      // If this was the current thread, switch to main conversation
      if (currentThreadId === threadId) {
        setCurrentThreadId(null)
        setMessages([])
        setHistoryLoaded(false)
      }
    } catch (error) {
      console.error('Error deleting thread:', error)
    }
  }

  async function handleSend() {
    if (!input.trim() || sendingMessage) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSendingMessage(true)

    try {
      // Get conversation history for context (last 10 messages)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      // Get user context (profile, goals, recent workouts)
      const userContext = userId ? await getUserContext(userId) : ''

      const aiResponse = await sendChatMessage(userMessage.content, conversationHistory, userContext)

      // Parse AI response for actions
      const parsed = parseAIResponse(aiResponse)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: parsed.message,
        timestamp: new Date(),
        parsedAction: parsed,
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // If AI detected an action (not just chat), set pending action
      if (parsed.action.type !== 'chat') {
        setPendingAction({
          messageId: assistantMessage.id,
          action: parsed
        })
      }

      // Save conversation to database
      if (userId) {
        if (currentThreadId) {
          // Save to specific thread
          await addMessageToThread(currentThreadId, userId, 'user', userMessage.content)
          await addMessageToThread(currentThreadId, userId, 'assistant', aiResponse)
        } else {
          // Save to main conversation history
          await saveConversation(userId, userMessage.content, aiResponse)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      let errorText = "Sorry, I'm having trouble connecting right now. Please try again in a moment."
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorText = "AI service not configured yet. Please contact support."
        } else if (error.message.includes('rate limit')) {
          errorText = "Too many requests. Please wait a moment and try again."
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorText,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setSendingMessage(false)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleMediaAnalysis(analysis: string, mediaUrl: string, mediaType: 'image' | 'video', prompt: string) {
    const timestamp = new Date()

    const userMessage: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp,
      mediaUrl,
      mediaType,
    }

    const assistantMessage: Message = {
      id: `${Date.now() + 1}`,
      role: 'assistant',
      content: analysis,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setShowMediaUpload(false)

    if (userId) {
      if (currentThreadId) {
        addMessageToThread(currentThreadId, userId, 'user', prompt).catch(console.error)
        addMessageToThread(currentThreadId, userId, 'assistant', analysis).catch(console.error)
      } else {
        saveConversation(userId, prompt, analysis).catch(console.error)
      }
    }
  }

  async function handleConfirmAction() {
    if (!pendingAction || !userId) return

    setSavingAction(true)
    
    try {
      const { action } = pendingAction.action

      let successMessage = ''

      if (action.type === 'workout') {
        const result = await saveWorkoutAction(userId, action)
        if (result.success) {
          successMessage = '✅ Workout logged! Check your dashboard and progress page to see updated stats. 💪'
        } else {
          throw new Error(result.error)
        }
      } else if (action.type === 'pr') {
        const result = await savePRAction(userId, action)
        if (result.success) {
          if (result.isNewPR) {
            successMessage = `🎉 NEW PR LOGGED! ${action.exercise} ${action.weight}${action.unit}! ${result.previousPR ? `Previous: ${result.previousPR}${action.unit}` : ''} 🏆`
          } else {
            successMessage = `Logged your ${action.exercise} workout. Keep pushing! 💪`
          }
        } else {
          throw new Error(result.error)
        }
      } else if (action.type === 'profile') {
        const result = await saveProfileAction(userId, action)
        if (result.success) {
          successMessage = '✅ Profile updated! Check your settings page to see the changes.'
        } else {
          throw new Error(result.error)
        }
      }

      // Add confirmation message
      const confirmMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: successMessage,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, confirmMessage])

      // Clear pending action
      setPendingAction(null)

      // Save confirmation to conversation
      if (currentThreadId) {
        await addMessageToThread(currentThreadId, userId, 'assistant', successMessage)
      } else {
        // For main chat, save as system message
        await saveConversation(userId, '', successMessage)
      }
    } catch (error) {
      console.error('Error saving action:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Sorry, there was an error saving that. ${error instanceof Error ? error.message : 'Please try again.'}`,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setSavingAction(false)
    }
  }

  function handleDeclineAction() {
    const declineMessage: Message = {
      id: (Date.now() + 2).toString(),
      role: 'assistant',
      content: "No problem! Let me know if you change your mind or if there's anything else I can help with. 💪",
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, declineMessage])
    setPendingAction(null)
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-dark-700/50 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-500 to-champion-500 flex items-center justify-center shadow-neon">
                <Bot className="w-6 h-6 text-dark-950" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-white">AI Coach</h1>
                <p className="text-sm text-slate-400">
                  {historyLoaded ? `${messages.length} messages in history` : 'Always ready to help'}
                </p>
              </div>
            </div>
            
            {/* Thread Dropdown */}
            <div className="relative thread-dropdown">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowThreadDropdown(!showThreadDropdown)}
                className="flex items-center space-x-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {currentThreadId ? 
                    threads.find(t => t.id === currentThreadId)?.title || 'Conversation' 
                    : 'Main Chat'
                  }
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>

              <AnimatePresence>
                {showThreadDropdown && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/20 z-[9998]"
                      onClick={() => setShowThreadDropdown(false)}
                    />
                    {/* Dropdown */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="fixed right-4 top-24 w-80 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-[9999]"
                    >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white">Conversations</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewThreadForm(true)}
                          className="text-electric-400 hover:text-electric-300"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          New
                        </Button>
                      </div>

                      {/* New Thread Form */}
                      {showNewThreadForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4 p-3 bg-dark-700 rounded-lg border border-dark-600"
                        >
                          <input
                            type="text"
                            placeholder="Conversation title..."
                            value={newThreadTitle}
                            onChange={(e) => setNewThreadTitle(e.target.value)}
                            className="w-full mb-2 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-slate-400 focus:border-electric-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Topic (optional)..."
                            value={newThreadTopic}
                            onChange={(e) => setNewThreadTopic(e.target.value)}
                            className="w-full mb-3 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-slate-400 focus:border-electric-500 focus:outline-none"
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={createNewThread}
                              disabled={!newThreadTitle.trim()}
                            >
                              Create
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowNewThreadForm(false)
                                setNewThreadTitle('')
                                setNewThreadTopic('')
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* Thread List */}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {/* Main Chat Option */}
                        <div
                          onClick={async () => {
                            setCurrentThreadId(null)
                            
                            // Load main conversation history
                            try {
                              const history = await loadConversationHistory(userId, 50)
                              
                              if (history.length > 0) {
                                const loadedMessages: Message[] = history.map((msg, idx) => ({
                                  id: `history-${idx}`,
                                  role: msg.role,
                                  content: msg.content,
                                  timestamp: new Date(msg.timestamp),
                                }))
                                setMessages(loadedMessages)
                                setHistoryLoaded(true)
                              } else {
                                setMessages([])
                                setHistoryLoaded(false)
                              }
                            } catch (error) {
                              console.error('Error loading main conversation:', error)
                              setMessages([])
                              setHistoryLoaded(false)
                            }
                            
                            setShowThreadDropdown(false)
                          }}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            !currentThreadId 
                              ? 'bg-electric-500/20 border border-electric-500/30' 
                              : 'hover:bg-dark-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white">Main Chat</p>
                              <p className="text-xs text-slate-400">General conversation</p>
                            </div>
                          </div>
                        </div>

                        {/* Thread Items */}
                        {threads.map((thread) => (
                          <div
                            key={thread.id}
                            onClick={() => {
                              loadThread(thread.id)
                              setShowThreadDropdown(false)
                            }}
                            className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                              currentThreadId === thread.id 
                                ? 'bg-electric-500/20 border border-electric-500/30' 
                                : 'hover:bg-dark-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{thread.title}</p>
                                <p className="text-xs text-slate-400">
                                  {thread.message_count} messages • {new Date(thread.updated_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteThreadAndSwitch(thread.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {threads.length === 0 && (
                          <div className="text-center py-8 text-slate-400">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No conversations yet</p>
                            <p className="text-xs">Create your first conversation above</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-3 max-w-2xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-iron-500 to-iron-600' 
                      : 'bg-gradient-to-br from-electric-500 to-electric-600 shadow-neon'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-dark-950" />
                    )}
                  </div>
                  
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-iron-600 to-iron-500 text-white'
                      : 'glass-card border-electric-500/30'
                  }`}>
                    {message.mediaUrl && (
                      <div className="mb-3">
                        <img 
                          src={message.mediaUrl} 
                          alt="Uploaded media" 
                          className="rounded-lg max-w-full max-h-64 object-contain"
                        />
                        {message.mediaType === 'video' && (
                          <p className="text-xs mt-1 opacity-70">Video frame</p>
                        )}
                      </div>
                    )}
                    <p className={`text-sm whitespace-pre-wrap ${message.role === 'assistant' ? 'text-slate-200' : ''}`}>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-white/60' : 'text-slate-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    
                    {/* Show action card if this message has a pending action */}
                    {message.role === 'assistant' && 
                     pendingAction?.messageId === message.id && 
                     pendingAction.action.action.type !== 'chat' && (
                      <ActionCard
                        action={pendingAction.action.action}
                        onConfirm={handleConfirmAction}
                        onDecline={handleDeclineAction}
                        loading={savingAction}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sendingMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex space-x-3 max-w-2xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-500 to-electric-600 flex items-center justify-center shadow-neon animate-glow">
                  <Bot className="w-4 h-4 text-dark-950" />
                </div>
                <div className="glass-card border-electric-500/30 rounded-2xl px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-electric-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-electric-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-electric-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-6 border-t border-dark-700/50 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Media Upload Section */}
          {showMediaUpload && (
            <div className="p-4 glass-card rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-300">
                  {analysisType === 'form' ? 'Upload Form Check Video/Photo' : 'Upload Progress Photo'}
                </p>
                <button
                  onClick={() => setShowMediaUpload(false)}
                  className="text-slate-400 hover:text-electric-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <MediaUpload 
                onAnalysisComplete={handleMediaAnalysis}
                analysisType={analysisType}
              />
            </div>
          )}

          {!showMediaUpload && (
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <button
                onClick={() => {
                  setAnalysisType('form')
                  setShowMediaUpload(true)
                }}
                className="px-3 py-1.5 rounded-lg border border-dark-600 hover:border-electric-500 hover:text-electric-400 transition-all"
              >
                📹 Upload Form Check
              </button>
              <button
                onClick={() => {
                  setAnalysisType('progress')
                  setShowMediaUpload(true)
                }}
                className="px-3 py-1.5 rounded-lg border border-dark-600 hover:border-champion-500 hover:text-champion-400 transition-all"
              >
                📸 Upload Progress Photo
              </button>
              <span>
                Add media plus context in one message
              </span>
            </div>
          )}

          {/* Text Input */}
          <div className="flex space-x-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your coach anything..."
              rows={1}
              className="flex-1"
              disabled={sendingMessage}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendingMessage}
              className="px-6"
            >
              {sendingMessage ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Press Enter to send, Shift+Enter for new line
            </p>
            <button
              onClick={() => setShowMediaUpload(!showMediaUpload)}
              className="text-xs text-electric-400 hover:text-electric-300 font-medium transition-colors"
            >
              {showMediaUpload ? 'Hide' : '📸 Upload Photo/Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CoachPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loading /></div>}>
      <CoachPageContent />
    </Suspense>
  )
}

