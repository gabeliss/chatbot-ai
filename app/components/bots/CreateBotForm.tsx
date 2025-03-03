'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface CreateBotFormProps {
  userId: string
  onSuccess?: () => void
  onBotCreated?: () => void
}

export function CreateBotForm({ userId, onSuccess, onBotCreated }: CreateBotFormProps) {
  const supabase = createClientComponentClient()
  const [name, setName] = useState('')
  const [defaultLanguage, setDefaultLanguage] = useState('en')
  const [greeting, setGreeting] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: createError } = await supabase
        .from('bots')
        .insert([
          {
            name,
            user_id: userId,
            default_language: defaultLanguage,
            greeting: greeting || null,
            is_active: true,
          },
        ])

      if (createError) throw createError
      
      // Call both callbacks
      onSuccess?.()
      onBotCreated?.()
      
      // Reset form
      setName('')
      setDefaultLanguage('en')
      setGreeting('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Bot Name
          </label>
          <div className="mt-2">
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              placeholder="My Support Bot"
            />
          </div>
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-foreground">
            Default Language
          </label>
          <div className="mt-2">
            <select
              id="language"
              name="language"
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="greeting" className="block text-sm font-medium text-foreground">
            Welcome Message (Optional)
          </label>
          <div className="mt-2">
            <textarea
              id="greeting"
              name="greeting"
              rows={3}
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              placeholder="Hi! I'm here to help. How can I assist you today?"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-primary-foreground shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Bot'}
          </button>
        </div>
      </form>
    </div>
  )
}
