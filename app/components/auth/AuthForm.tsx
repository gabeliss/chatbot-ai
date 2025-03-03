'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AuthFormProps {
  view: 'sign-in' | 'sign-up'
}

export function AuthForm({ view }: AuthFormProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (view === 'sign-up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setMessage('Check your email for the confirmation link.')
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        if (data.session) {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address first')
      return
    }
    
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setMessage('Check your email for the password reset link.')
    } catch (error) {
      console.error('Reset password error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
          {view === 'sign-in' ? 'Sign in to your account' : 'Create a new account'}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-foreground">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-foreground">
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={view === 'sign-in' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-primary-foreground shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            >
              {loading ? 'Loading...' : view === 'sign-in' ? 'Sign in' : 'Sign up'}
            </button>
          </div>

          {view === 'sign-in' && (
            <div className="flex items-center justify-center">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Forgot your password?
              </Link>
            </div>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {view === 'sign-in' ? "Don't have an account? " : 'Already have an account? '}
          <Link
            href={view === 'sign-in' ? '/sign-up' : '/sign-in'}
            className="font-semibold leading-6 text-primary hover:opacity-80"
          >
            {view === 'sign-in' ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  )
}
