'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, MessageSquare, Video, LogOut, User } from 'lucide-react'
import { agentsApi, authApi, clearTokens } from '@/lib/api'
import { AgentCard } from '@/components/agents/AgentCard'
import type { AIAgent, User as UserType, ConversationMode } from '@/types'

const MODES: { value: ConversationMode; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'text', label: 'Text', icon: MessageSquare, description: 'Chat-based practice' },
  { value: 'audio', label: 'Audio', icon: Mic, description: 'Voice conversation' },
  { value: 'video', label: 'Video', icon: Video, description: 'Immersive video chat' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [selectedMode, setSelectedMode] = useState<ConversationMode>('text')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, agentsData] = await Promise.all([
          authApi.getProfile(),
          agentsApi.getAgents(),
        ])
        setUser(profileData)
        setAgents(agentsData.results ?? [])
      } catch {
        setError('Failed to load data. Please try again.')
        // If unauthorized, redirect to login
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [router])

  const handleLogout = async () => {
    try {
      const refreshToken = typeof window !== 'undefined'
        ? localStorage.getItem('refresh_token')
        : null
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch {
      // Ignore logout errors
    } finally {
      clearTokens()
      router.push('/login')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-gray-900">LinguaAI</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.username ?? 'Learner'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            You&apos;re learning{' '}
            <span className="font-medium text-indigo-600 capitalize">{user?.target_language}</span>
            {' '}at level{' '}
            <span className="font-medium text-indigo-600">{user?.proficiency_level}</span>.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {/* Mode Selector */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Conversation mode
          </h2>
          <div className="flex gap-3 flex-wrap">
            {MODES.map((mode) => {
              const Icon = mode.icon
              const isSelected = selectedMode === mode.value
              return (
                <button
                  key={mode.value}
                  onClick={() => setSelectedMode(mode.value)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border font-medium text-sm transition-all ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                  aria-pressed={isSelected}
                >
                  <Icon className="w-4 h-4" />
                  {mode.label}
                  <span className={`text-xs hidden sm:inline ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {mode.description}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Agents Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Choose a tutor</h2>
            <span className="text-sm text-gray-400">{agents.length} available</span>
          </div>

          {agents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No tutors available at the moment.</p>
              <p className="text-sm text-gray-400 mt-1">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  mode={selectedMode}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
