'use client'

import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { CreateBotForm } from '@/components/bots/CreateBotForm'
import { Modal } from '@/components/ui/Modal'
import { useEffect, useState, useCallback } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [bots, setBots] = useState<any[]>([])
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; botId: string | null }>({
    isOpen: false,
    botId: null,
  })

  const fetchBots = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('bots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setBots(data || [])
  }, [userId, supabase])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/sign-in')
      } else {
        setUserId(user.id)
      }
    }
    checkUser()
  }, [router, supabase])

  useEffect(() => {
    fetchBots()
  }, [fetchBots])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteBot = async (botId: string) => {
    setDeleteModal({ isOpen: true, botId })
  }

  const confirmDelete = async () => {
    if (!deleteModal.botId) return

    setDeleteLoading(deleteModal.botId)
    try {
      const { error } = await supabase
        .from('bots')
        .delete()
        .eq('id', deleteModal.botId)
        .eq('user_id', userId)

      if (error) throw error
      await fetchBots()
    } catch (error) {
      console.error('Error deleting bot:', error)
      alert('Failed to delete bot. Please try again.')
    } finally {
      setDeleteLoading(null)
      setDeleteModal({ isOpen: false, botId: null })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <button
          onClick={handleSignOut}
          className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          Sign Out
        </button>
      </div>

      <div className="space-y-8">
        <div>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage your AI chatbots here.
          </p>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Create a New Bot</h2>
          {userId && <CreateBotForm userId={userId} onBotCreated={fetchBots} />}
        </div>

        {bots.length > 0 && (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Your Bots</h2>
            </div>
            <ul className="divide-y divide-border">
              {bots.map((bot) => (
                <li key={bot.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{bot.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Created on {new Date(bot.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          bot.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {bot.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleDeleteBot(bot.id)}
                        disabled={deleteLoading === bot.id}
                        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {deleteLoading === bot.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, botId: null })}
          onConfirm={confirmDelete}
          title="Delete Bot"
          message="Are you sure you want to delete this bot? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive={true}
        />
      </div>
    </div>
  )
}
