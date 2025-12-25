'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { getCurrentUser } from '@/lib/supabase'
import { getUserThreads, createThread, deleteThread } from '@/lib/threads'
import { MessageSquare, Plus, Trash2, ChevronRight, Dumbbell, Apple, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const TOPIC_ICONS = {
  general: MessageSquare,
  form: Dumbbell,
  nutrition: Apple,
  programming: BookOpen,
}

const TOPIC_COLORS = {
  general: 'bg-slate-500',
  form: 'bg-primary',
  nutrition: 'bg-emerald-500',
  programming: 'bg-accent',
}

export default function ThreadsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [threads, setThreads] = useState<any[]>([])
  const [userId, setUserId] = useState<string>('')
  const [showNewThreadModal, setShowNewThreadModal] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [newThreadTopic, setNewThreadTopic] = useState('general')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadThreads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadThreads() {
    try {
      const authUser = await getCurrentUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      setUserId(authUser.id)
      const userThreads = await getUserThreads(authUser.id)
      setThreads(userThreads)
    } catch (error) {
      console.error('Error loading threads:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateThread() {
    if (!newThreadTitle.trim() || !userId) return

    setCreating(true)
    try {
      const thread = await createThread(userId, newThreadTitle.trim(), newThreadTopic)
      router.push(`/coach?thread=${thread.id}`)
    } catch (error) {
      console.error('Error creating thread:', error)
      toast.error('Failed to create thread')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteThread(threadId: string) {
    if (!confirm('Delete this conversation? This cannot be undone.')) return

    try {
      await deleteThread(threadId)
      setThreads(prev => prev.filter(t => t.id !== threadId))
      toast.success('Thread deleted successfully')
    } catch (error) {
      console.error('Error deleting thread:', error)
      toast.error('Failed to delete thread')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Conversations</h1>
          <p className="text-slate-600 mt-2">Organize your coaching topics</p>
        </div>
        <Button onClick={() => setShowNewThreadModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Quick Access Default Chat */}
      <Card className="p-6 border-2 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Main Coach Chat</h3>
              <p className="text-sm text-slate-600">Your default conversation</p>
            </div>
          </div>
          <Link href="/coach">
            <Button variant="primary">
              Continue Chat
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Thread List */}
      {threads.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Topics</h2>
          <div className="space-y-3">
            {threads.map((thread, idx) => {
              const Icon = TOPIC_ICONS[thread.topic as keyof typeof TOPIC_ICONS] || MessageSquare
              const colorClass = TOPIC_COLORS[thread.topic as keyof typeof TOPIC_COLORS] || 'bg-slate-500'

              return (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{thread.title}</h3>
                          <p className="text-sm text-slate-600">
                            {thread.message_count} messages • {new Date(thread.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/coach?thread=${thread.id}`}>
                          <Button variant="ghost" size="sm">
                            Open
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                        <button
                          onClick={() => handleDeleteThread(thread.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">New Conversation</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Topic
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'general', label: 'General', icon: MessageSquare },
                      { value: 'form', label: 'Form & Technique', icon: Dumbbell },
                      { value: 'nutrition', label: 'Nutrition', icon: Apple },
                      { value: 'programming', label: 'Programming', icon: BookOpen },
                    ].map(topic => {
                      const Icon = topic.icon
                      const isSelected = newThreadTopic === topic.value
                      return (
                        <button
                          key={topic.value}
                          onClick={() => setNewThreadTopic(topic.value)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                          <p className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
                            {topic.label}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    placeholder="e.g., Squat Form Check, Bulking Diet, Meet Prep Program"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    autoFocus
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowNewThreadModal(false)
                      setNewThreadTitle('')
                      setNewThreadTopic('general')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateThread}
                    disabled={!newThreadTitle.trim() || creating}
                    className="flex-1"
                  >
                    {creating ? 'Creating...' : 'Create & Start Chat'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Empty State */}
      {threads.length === 0 && (
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No organized chats yet</h3>
          <p className="text-slate-600 mb-6">
            Create topic-based conversations to keep your coaching organized
          </p>
          <Button onClick={() => setShowNewThreadModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Topic
          </Button>
        </Card>
      )}
    </div>
  )
}

