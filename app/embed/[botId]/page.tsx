'use client'

import { useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: {
    content: string
    similarity: number
    filename?: string
  }[]
}

export default function EmbedPage({ params }: { params: { botId: string } }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    setLoading(true)

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: question }])

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: params.botId, question })
      })

      if (!response.ok) {
        throw new Error(await response.text())
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
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">
            Ask me anything! I'm here to help.
          </p>
        ) : (
          messages.map((message, i) => (
            <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-4' 
                  : 'bg-secondary text-secondary-foreground mr-4'
              }`}>
                <div 
                  className="text-sm"
                  {...(message.role === 'assistant' 
                    ? {
                        dangerouslySetInnerHTML: { 
                          __html: DOMPurify.sanitize(message.content) 
                        }
                      } 
                    : { children: message.content }
                  )}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input form */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full border-0 py-1.5 px-4 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
} 