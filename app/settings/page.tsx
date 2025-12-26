'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Loading } from '@/components/ui/Loading'
import { getCurrentUser, getUserProfile, updateUserProfile, supabase } from '@/lib/supabase'
import { Database, TRAINING_TYPES, TrainingType } from '@/types/database.types'
import { Settings as SettingsIcon, User, Save, Key, Download, Trash2, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

type UserProfile = Database['public']['Tables']['users']['Row']

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    goal: '',
    units: 'lbs' as 'kg' | 'lbs',
    experience: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    focusArea: '',
    trainingType: 'general_strength' as TrainingType,
  })
  const [successMessage, setSuccessMessage] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    try {
      const authUser = await getCurrentUser()
      if (!authUser) {
        window.location.href = '/login'
        return
      }

      const profile: UserProfile = await getUserProfile(authUser.id)
      setUser(profile)

      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        email: profile.email || authUser.email || '',
        goal: profile.preferences?.goal || '',
        units: profile.preferences?.units || 'lbs',
        experience: profile.preferences?.experience || 'intermediate',
        focusArea: profile.preferences?.focusArea || '',
        trainingType: profile.preferences?.trainingType || 'general_strength',
      })
    } catch (error) {
      // Only log non-auth errors
      if (error instanceof Error && !error.message.includes('session')) {
        console.error('Error loading user data:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!user) return

    setSaving(true)
    setSuccessMessage('')

    try {
      await updateUserProfile(user.id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        preferences: {
          goal: formData.goal,
          units: formData.units,
          experience: formData.experience,
          focusArea: formData.focusArea,
          trainingType: formData.trainingType,
        },
      })
      setSuccessMessage('Settings saved successfully!')
      toast.success('Settings saved successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields.')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.')
      return
    }

    setChangingPassword(true)
    try {
      // Update password directly - Supabase Auth handles this securely
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) {
        console.error('Supabase auth error:', error)
        throw error
      }

      setSuccessMessage('Password changed successfully!')
      setShowPasswordForm(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error changing password:', error)
      
      let errorMessage = 'Failed to change password. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.'
        } else if (error.message.includes('Invalid password')) {
          errorMessage = 'Password does not meet requirements.'
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many attempts. Please wait a moment and try again.'
        } else if (error.message.includes('session')) {
          errorMessage = 'Session expired. Please sign in again.'
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleExportData() {
    if (!user) return

    setExporting(true)
    try {
      // Get all user data
      const [workouts, sessions, programs, threads, threadMessages] = await Promise.all([
        supabase.from('workouts').select('*').eq('user_id', user.id),
        supabase.from('sessions').select('*').eq('user_id', user.id),
        supabase.from('programs').select('*').eq('user_id', user.id),
        supabase.from('threads').select('*').eq('user_id', user.id),
        supabase.from('thread_messages').select('*').eq('user_id', user.id)
      ])

      const exportData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          preferences: user.preferences,
          created_at: user.created_at
        },
        workouts: workouts.data || [],
        sessions: sessions.data || [],
        programs: programs.data || [],
        threads: threads.data || [],
        threadMessages: threadMessages.data || [],
        exported_at: new Date().toISOString()
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `liftmind-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccessMessage('Data exported successfully!')
      toast.success('Data exported successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDeleteAccount() {
    if (!user) return

    const confirmText = 'DELETE'
    const userInput = prompt(
      `⚠️ WARNING: This will permanently delete your account and ALL data.\n\n` +
      `This action cannot be undone!\n\n` +
      `Type "${confirmText}" to confirm deletion:`
    )

    if (userInput !== confirmText) {
      return
    }

    const doubleConfirm = confirm(
      'Are you absolutely sure? This will delete:\n' +
      '• All your workouts\n' +
      '• All your progress data\n' +
      '• All your AI coach conversations\n' +
      '• Your account profile\n\n' +
      'This cannot be undone!'
    )

    if (!doubleConfirm) {
      return
    }

    setDeleting(true)
    try {
      // Call our API route to delete the account
      // This will handle both database cleanup and auth account deletion
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account')
      }

      // Sign out and redirect
      await supabase.auth.signOut()
      toast.success('Account deleted successfully. Redirecting...')
      setTimeout(() => {
      window.location.href = '/login'
      }, 1500)
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account. Please try again or contact support.')
    } finally {
      setDeleting(false)
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
    <div className="min-h-screen p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="w-8 h-8 text-electric-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Settings</h1>
          </div>
          <p className="text-slate-400 text-sm md:text-base">Manage your profile and training preferences</p>
        </div>
        
        {/* Help Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 md:p-6 rounded-2xl border-electric-500/20"
        >
          <h3 className="text-sm md:text-base font-semibold text-white mb-2 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 md:w-5 md:h-5 text-electric-400" />
            Settings Guide
          </h3>
          <ul className="space-y-1.5 text-xs md:text-sm text-slate-400 list-disc list-inside">
            <li><strong>Training Type:</strong> Select your primary training style to get personalized metrics</li>
            <li><strong>Units:</strong> Choose kg or lbs for weight measurements</li>
            <li><strong>Experience Level:</strong> Helps AI coach give appropriate advice</li>
            <li><strong>Goal:</strong> Set your fitness goal to get targeted recommendations</li>
          </ul>
        </motion.div>
      </motion.div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-electric-500/10 border border-electric-500/30 rounded-xl text-electric-400"
        >
          {successMessage}
        </motion.div>
      )}

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-6 h-6 text-electric-500" />
            <h2 className="text-2xl font-bold text-white">Personal Information</h2>
          </div>

          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1234567890"
            />
          </div>
        </Card>
      </motion.div>

      {/* Training Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <h2 className="text-2xl font-bold mb-6 text-white">Training Preferences</h2>

          <div className="space-y-4">
            <Input
              label="Training Goal"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="e.g., Increase squat to 500 lbs"
            />

            <Select
              label="Experience Level"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
              options={[
                { value: 'beginner', label: 'Beginner (< 1 year)' },
                { value: 'intermediate', label: 'Intermediate (1-3 years)' },
                { value: 'advanced', label: 'Advanced (3+ years)' },
              ]}
            />

            <Select
              label="Units"
              value={formData.units}
              onChange={(e) => setFormData({ ...formData, units: e.target.value as 'kg' | 'lbs' })}
              options={[
                { value: 'lbs', label: 'Pounds (lbs)' },
                { value: 'kg', label: 'Kilograms (kg)' },
              ]}
            />

            <Input
              label="Focus Area"
              value={formData.focusArea}
              onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })}
              placeholder="e.g., Build muscle, Lose weight, Get stronger"
            />

            <Select
              label="Training Type"
              value={formData.trainingType}
              onChange={(e) => setFormData({ ...formData, trainingType: e.target.value as TrainingType })}
              options={TRAINING_TYPES.map(type => ({
                value: type.value,
                label: `${type.label} - ${type.description}`
              }))}
            />
          </div>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="w-full"
        >
          {saving ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Saving...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </span>
          )}
        </Button>
      </motion.div>

      {/* Account Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <h2 className="text-2xl font-bold mb-6 text-white">Account</h2>
          
          {/* Change Password Section */}
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-electric-400 hover:text-electric-300"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              <Key className="w-5 h-5 mr-3" />
              Change Password
            </Button>

            <AnimatePresence>
              {showPasswordForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 p-4 bg-dark-800 rounded-xl border border-dark-700"
                >
                  <div className="relative">
                    <Input
                      label="Current Password"
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                      className="absolute right-3 top-8 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      label="New Password"
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                      className="absolute right-3 top-8 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      label="Confirm New Password"
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                      className="absolute right-3 top-8 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleChangePassword}
                      className="flex-1"
                      disabled={changingPassword}
                    >
                      {changingPassword ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </span>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Export Data */}
            <Button 
              variant="ghost" 
              className="w-full justify-start text-champion-400 hover:text-champion-300"
              onClick={handleExportData}
              disabled={exporting}
            >
              <Download className="w-5 h-5 mr-3" />
              {exporting ? 'Exporting...' : 'Export Data'}
            </Button>

            {/* Delete Account */}
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-500 hover:text-red-400"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              <Trash2 className="w-5 h-5 mr-3" />
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </Card>
      </motion.div>
      </div>
    </div>
  )
}

