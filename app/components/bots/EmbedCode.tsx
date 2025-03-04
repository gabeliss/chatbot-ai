'use client'

import { useState } from 'react'

interface EmbedCodeProps {
  botId: string
}

export function EmbedCode({ botId }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false)

  // Get the base URL from the existing environment variable
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const iframeCode = `<iframe
  src="${baseUrl}/embed/${botId}"
  style="width: 100%; height: 600px; border: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
></iframe>`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Embed Code</h3>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="relative">
        <pre className="p-4 bg-secondary/10 rounded-lg overflow-x-auto text-xs">
          <code>{iframeCode}</code>
        </pre>
      </div>
      <p className="text-xs text-muted-foreground">
        Add this code to your website where you want the chat widget to appear.
      </p>
    </div>
  )
} 