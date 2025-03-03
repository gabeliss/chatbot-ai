'use client'

import { useState } from 'react'

interface SourceUploadProps {
  botId: string
  onUploadComplete?: () => void
}

export function SourceUpload({ botId, onUploadComplete }: SourceUploadProps) {
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    // Validate file types
    const validFiles = Array.from(selectedFiles).every(file => {
      const type = file.type.toLowerCase()
      return type === 'application/pdf' || 
             type === 'text/plain' || 
             type === 'text/markdown'
    })

    if (!validFiles) {
      setError('Only PDF, TXT, and Markdown files are supported')
      return
    }

    setFiles(selectedFiles)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files || files.length === 0) {
      setError('Please select at least one file')
      return
    }

    setLoading(true)
    setError(null)
    setProgress('Uploading files...')

    try {
      // Upload each file
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('botId', botId)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        // Wait a short moment to ensure the database has updated
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      setProgress('Upload complete!')
      setFiles(null)
      
      // Call onUploadComplete if provided
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred during upload')
    } finally {
      setLoading(false)
      // Keep the success message visible for a moment
      setTimeout(() => {
        setProgress(null)
      }, 2000)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Upload Knowledge Sources
          </label>
          <div className="space-y-2">
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              accept=".pdf,.txt,.md,text/plain,application/pdf,text/markdown"
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                file:cursor-pointer file:hover:opacity-90
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Supported formats: PDF, TXT, Markdown
            </p>
          </div>
        </div>

        {files && files.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {Array.from(files).map((file, i) => (
              <div key={i} className="flex items-center space-x-2">
                <span>📄</span>
                <span>{file.name}</span>
                <span className="text-xs">({Math.round(file.size / 1024)} KB)</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !files || files.length === 0}
          className="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-primary-foreground shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {progress && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{progress}</p>
        </div>
      )}
    </div>
  )
} 