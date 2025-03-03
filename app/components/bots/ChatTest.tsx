'use client'

import { useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'

interface ChatTestProps {
  botId: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: {
    content: string
    similarity: number
    filename?: string
  }[]
}

export function ChatTest({ botId }: ChatTestProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    setError(null)
    setLoading(true)

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: question }])

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId, question })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      const { answer, sources } = await response.json()
      
      // Add bot response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: answer,
        sources
      }])
    } catch (err) {
      console.error('Error asking question:', err)
      setError(err instanceof Error ? err.message : 'Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg h-[400px] p-4 space-y-6 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">
            Ask a question to test your bot's knowledge.
          </p>
        ) : (
          messages.map((message, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-1">
                {message.role === 'user' ? (
                  <div className="bg-[#E5F6F6] rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-xl mt-1">👤</span>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-xl mt-1">🤖</span>
                      <div 
                        className="text-sm prose prose-sm max-w-none prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2"
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(message.content) 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                <div className="w-48 shrink-0">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <h4 className="text-sm font-medium mb-2">Sources</h4>
                    <ul className="space-y-1">
                      {Array.from(new Set(message.sources.map(s => s.filename || 'Unknown source'))).map((filename, j) => (
                        <li key={j} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {filename}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 rounded-md border-0 py-1.5 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Ask'}
          </button>
          <button
            type="button"
            onClick={() => setMessages([])}
            disabled={loading || messages.length === 0}
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-medium hover:opacity-90 disabled:opacity-50"
          >
            Reset
          </button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </form>
    </div>
  )
} 