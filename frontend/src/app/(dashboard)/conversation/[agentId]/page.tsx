'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Mic, MessageSquare, Video } from 'lucide-react'
import { agentsApi, sessionsApi } from '@/lib/api'
import { TextInterface } from '@/components/conversation/TextInterface'
import { AudioInterface } from '@/components/conversation/AudioInterface'
import { VideoInterface } from '@/components/conversation/VideoInterface'
import { FeedbackOverlay } from '@/components/conversation/FeedbackOverlay'
import type { AIAgent, LearningSession, ConversationMode, MessageFeedback } from '@/types'

const MODES: { value: ConversationMode; label: string; icon: React.ElementType }[] = [
  { value: 'text', label: 'Text', icon: MessageSquare },
  { value: 'audio', label: 'Audio', icon: Mic },
  { value: 'video', label: 'Video', icon: Video },
]

export default function ConversationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const agentId = Number(params.agentId)
  const sessionIdParam = searchParams.get('session')
  const modeParam = (searchParams.get('mode') as ConversationMode) ?? 'text'

  const [agent, setAgent] = useState<AIAgent | null>(null)
  const [session, setSession] = useState<LearningSession | null>(null)
  const [activeMode, setActiveMode] = useState<ConversationMode>(modeParam)
  const [feedback, setFeedback] = useState<MessageFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Load agent + create/load session
  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true)
        setError('')

        // Fetch agent details
        const agentData = await agentsApi.getAgent(agentId)
        setAgent(agentData)

        // Use existing session or create a new one
        if (sessionIdParam) {
          const sessionData = await sessionsApi.getSession(Number(sessionIdParam))
          setSession(sessionData)
          setActiveMode(sessionData.mode)
        } else {
          const newSession = await sessionsApi.createSession({
            agent: agentId,
            mode: activeMode,
          })
          setSession(newSession)
          // Update URL with session id (without reload)
          const url = new URL(window.location.href)
          url.searchParams.set('session', String(newSession.id))
          window.history.replaceState(null, '', url.toString())
        }
      } catch {
        setError('Failed to load conversation. Please go back and try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (agentId) {
      loadSession()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId])

  const handleFeedback = useCallback((fb: MessageFeedback | null) => {
    if (fb && (
      (fb.corrections && fb.corrections.length > 0) ||
      (fb.suggestions && fb.suggestions.length > 0) ||
      fb.pronunciation_score != null
    )) {
      setFeedback(fb)
    }
  }, [])

  const handleEndSession = async () => {
    if (session) {
      try {
        await sessionsApi.endSession(session.id)
      } catch {
        // Ignore errors on end
      }
    }
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Setting up your conversation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h2 className="font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Back + Agent name */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleEndSession}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              aria-label="End conversation and go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {agent && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {agent.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{agent.name}</p>
                  <p className="text-xs text-gray-400 leading-tight">{agent.persona.slice(0, 40)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Mode tabs */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            {MODES.map((mode) => {
              const Icon = mode.icon
              const isActive = activeMode === mode.value
              return (
                <button
                  key={mode.value}
                  onClick={() => setActiveMode(mode.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-label={`Switch to ${mode.label} mode`}
                  aria-pressed={isActive}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main conversation area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {session && (
          <>
            {activeMode === 'text' && (
              <TextInterface
                sessionId={String(session.id)}
                onFeedback={handleFeedback}
              />
            )}
            {activeMode === 'audio' && (
              <AudioInterface
                sessionId={String(session.id)}
                onFeedback={handleFeedback}
              />
            )}
            {activeMode === 'video' && (
              <VideoInterface
                sessionId={String(session.id)}
                agent={agent}
                onFeedback={handleFeedback}
              />
            )}
          </>
        )}
      </main>

      {/* Non-intrusive feedback overlay */}
      {feedback && (
        <FeedbackOverlay
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
          autoDismissMs={8000}
        />
      )}
    </div>
  )
}
