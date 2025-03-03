'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Source {
  id: string
  name: string
  type: 'pdf' | 'text' | 'markdown'
  size: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  created_at: string
}

interface SourcesListProps {
  botId: string
  onSourceDeleted?: () => void
}

export function SourcesList({ botId, onSourceDeleted }: SourcesListProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const supabase = createClientComponentClient()
  const sourcesRef = useRef(sources)
  sourcesRef.current = sources

  const fetchSources = useCallback(async () => {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSources(data || [])
    } catch (err) {
      console.error('Error fetching sources:', err)
      setError('Failed to load sources')
    } finally {
      setLoading(false)
    }
  }, [botId, supabase])

  const handleRetry = async () => {
    setLoading(true)
    setRetryCount(count => count + 1)
    await fetchSources()
  }

  const deleteSource = async (sourceId: string) => {
    try {
      const { error } = await supabase
        .from('sources')
        .delete()
        .eq('id', sourceId)
        .eq('bot_id', botId)

      if (error) throw error
      
      // Refresh the list
      await fetchSources()
      if (onSourceDeleted) {
        onSourceDeleted()
      }
    } catch (err) {
      console.error('Error deleting source:', err)
      setError('Failed to delete source')
    }
  }

  useEffect(() => {
    let mounted = true
    let pollInterval: NodeJS.Timeout | null = null
    let retryTimeout: NodeJS.Timeout | null = null
    
    const initializeSubscription = async () => {
      if (!mounted) return

      try {
        await fetchSources()
        
        // Set up real-time subscription for status updates
        const subscription = supabase
          .channel('sources_channel')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'sources',
              filter: `bot_id=eq.${botId}`,
            },
            () => {
              if (mounted) {
                fetchSources()
              }
            }
          )
          .subscribe()

        // Set up polling for processing status
        pollInterval = setInterval(() => {
          if (mounted && sourcesRef.current.some(
            source => source.status === 'pending' || source.status === 'processing'
          )) {
            fetchSources()
          }
        }, 2000)

        return subscription
      } catch (err) {
        console.error('Subscription error:', err)
        if (mounted) {
          retryTimeout = setTimeout(initializeSubscription, 1000)
        }
      }
    }

    const subscription = initializeSubscription()

    return () => {
      mounted = false
      if (pollInterval) clearInterval(pollInterval)
      if (retryTimeout) clearTimeout(retryTimeout)
      if (subscription) {
        subscription.then(sub => sub?.unsubscribe())
      }
    }
  }, [botId, fetchSources, retryCount, supabase])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusColor = (status: Source['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'processing':
        return 'text-blue-600 bg-blue-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading && !sources.length) {
    return <div className="text-sm text-muted-foreground">Loading sources...</div>
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4">
        <div className="flex flex-col items-start space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={handleRetry}
            className="text-sm text-primary hover:text-primary/90"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (sources.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No documents uploaded yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Uploaded Documents</h3>
      <div className="divide-y divide-border rounded-md border">
        {sources.map((source) => (
          <div key={source.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl">
                  {source.type === 'pdf' ? '📄' : 
                   source.type === 'markdown' ? '📝' : '📃'}
                </span>
                <div>
                  <h4 className="text-sm font-medium text-foreground">
                    {source.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(source.size)} • {
                      new Date(source.created_at).toLocaleDateString()
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    source.status
                  )}`}
                >
                  {source.status.charAt(0).toUpperCase() + source.status.slice(1)}
                </span>
                <button
                  onClick={() => deleteSource(source.id)}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={source.status === 'processing'}
                >
                  Delete
                </button>
              </div>
            </div>
            {source.error && (
              <div className="mt-2 text-sm text-red-600">
                Error: {source.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 