'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          AI Customer Support Chatbot Builder
        </h1>
        <p className="text-center text-lg mb-8">
          Build and deploy AI-powered customer support chatbots with ease.
        </p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => router.push('/sign-up')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            Get Started
          </button>
          <button
            onClick={() => router.push('/sign-in')}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
