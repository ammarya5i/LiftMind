'use client'

import { useState, useRef } from 'react'
import { Button } from './ui/Button'
import { Image, Video, X, Upload, Loader } from 'lucide-react'
import { fileToDataURL, validateMediaFile, analyzeImage } from '@/lib/vision'
import toast from 'react-hot-toast'

interface MediaUploadProps {
  onAnalysisComplete: (analysis: string, mediaUrl: string, mediaType: 'image' | 'video', userPrompt: string) => void
  analysisType: 'form' | 'progress'
}

export function MediaUpload({ onAnalysisComplete, analysisType }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [mediaDataUrl, setMediaDataUrl] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const defaultPrompts = {
    form: 'Please analyze my form in this exercise. Highlight what I am doing well and give specific cues to improve.',
    progress: 'Please evaluate my physique progress. What stands out and what should I focus on?'
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateMediaFile(file)
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file')
      return
    }

    setError(null)
    const isImage = file.type.startsWith('image')
    const isVideo = file.type.startsWith('video')
    const previewObjectUrl = isVideo ? URL.createObjectURL(file) : null

    setMediaType(isImage ? 'image' : 'video')
    setPreviewType(isImage ? 'image' : 'video')

    try {
      let dataURL: string

      if (isVideo) {
        // For videos: convert to base64 for Gemini video analysis
        // Also extract a frame for preview fallback
        dataURL = await fileToDataURL(file)
        setPreviewUrl(previewObjectUrl)
      } else {
        dataURL = await fileToDataURL(file)
        setPreviewUrl(dataURL)
      }

      setMediaDataUrl(dataURL)
    } catch (err) {
      console.error('Error preparing media:', err)
      setError('Failed to process media. Please try a different file.')
      resetState()
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
    }
  }

  async function handleAnalyze() {
    if (!mediaDataUrl || !mediaType || !previewUrl) return

    const promptToUse = prompt.trim() || defaultPrompts[analysisType]

    setUploading(true)
    setError(null)

    try {
      const analysis = await analyzeImage(mediaDataUrl, promptToUse, analysisType, mediaType)
      // Use previewUrl for display (video object URL or image data URL)
      // Use mediaDataUrl for analysis (full video or image data URL)
      const displayUrl = previewType === 'image' ? previewUrl : mediaDataUrl
      onAnalysisComplete(analysis, displayUrl, mediaType, promptToUse)
      resetState()
    } catch (err: any) {
      console.error('Error processing media:', err)
      const message = typeof err?.message === 'string' ? err.message : 'Failed to analyze media. Please try again.'
      setError(message)
    } finally {
      setUploading(false)
    }
  }

  function resetState() {
    if (previewUrl && previewType === 'video') {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setPreviewType(null)
    setMediaType(null)
    setMediaDataUrl(null)
    setPrompt('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {/* File Input */}
      <input
        ref={fileInputRef}
        id="media-upload-input"
        name="media-file"
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
        aria-label="Upload media file"
      />

      {/* Upload Buttons */}
      {!previewUrl && !uploading && (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Image className="w-4 h-4 mr-2" />
            Photo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Video className="w-4 h-4 mr-2" />
            Video
          </Button>
        </div>
      )}

      {/* Preview & Status */}
      {(previewUrl || uploading) && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          {error && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 text-sm text-red-600">
              {error}
            </div>
          )}

          {previewUrl && !uploading && (
            <div className="relative">
              {previewType === 'video' ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full rounded-lg max-h-64 object-contain"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full rounded-lg max-h-64 object-contain"
                />
              )}
              <button
                onClick={resetState}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {uploading && (
            <div className="flex items-center justify-center py-8 space-x-3">
              <Loader className="w-6 h-6 text-primary animate-spin" />
              <div className="text-center">
                <p className="font-medium text-slate-900">
                  {mediaType === 'video' ? 'Processing video...' : 'Analyzing image...'}
                </p>
                <p className="text-sm text-slate-600">
                  {mediaType === 'video' && 'Extracting frame for analysis...'}
                  {mediaType === 'image' && 'AI is reviewing your form...'}
                </p>
              </div>
            </div>
          )}

          {!uploading && previewUrl && (
            <div className="space-y-3 mt-4">
              <label htmlFor="media-prompt" className="block text-sm font-medium text-slate-700">
                What should the coach focus on?
              </label>
              <textarea
                id="media-prompt"
                name="media-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={defaultPrompts[analysisType]}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  The coach will see both your note and the media.
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Analyze
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

