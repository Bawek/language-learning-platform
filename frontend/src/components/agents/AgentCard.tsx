'use client'

import { useRouter } from 'next/navigation'
import { sessionsApi } from '@/lib/api'
import type { AIAgent, ConversationMode } from '@/types'

interface AgentCardProps {
  agent: AIAgent
  mode: ConversationMode
}

const ROLE_COLORS: Record<string, string> = {
  interviewer: 'bg-blue-100 text-blue-700',
  local_guide: 'bg-emerald-100 text-emerald-700',
  pronunciation_specialist: 'bg-purple-100 text-purple-700',
  general: 'bg-gray-100 text-gray-600',
  debate_partner: 'bg-orange-100 text-orange-700',
  storyteller: 'bg-pink-100 text-pink-700',
}

const AVATAR_COLORS: Record<string, string> = {
  interviewer: 'bg-blue-500',
  local_guide: 'bg-emerald-500',
  pronunciation_specialist: 'bg-purple-500',
  general: 'bg-gray-500',
  debate_partner: 'bg-orange-500',
  storyteller: 'bg-pink-500',
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  ja: 'Japanese', zh: 'Mandarin', pt: 'Portuguese', it: 'Italian',
  ko: 'Korean', ar: 'Arabic',
}

export function AgentCard({ agent, mode }: AgentCardProps) {
  const router = useRouter()

  const handleStartConversation = async () => {
    try {
      const session = await sessionsApi.createSession({
        agent: agent.id,
        mode,
      })
      router.push(`/conversation/${agent.id}?session=${session.id}&mode=${mode}`)
    } catch {
      // Fallback: navigate without pre-created session
      router.push(`/conversation/${agent.id}?mode=${mode}`)
    }
  }

  const initials = agent.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const avatarBg = AVATAR_COLORS[agent.role] ?? 'bg-indigo-500'
  const roleBadge = ROLE_COLORS[agent.role] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      {/* Card Body */}
      <div className="p-5 flex-1">
        {/* Avatar + Name */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${avatarBg}`}
            aria-hidden="true"
          >
            {agent.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agent.avatar_url}
                alt={`${agent.name} avatar`}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <span className="text-white font-bold text-base">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{agent.name}</h3>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${roleBadge}`}>
              {agent.role_display}
            </span>
          </div>
        </div>

        {/* Persona */}
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
          {agent.persona}
        </p>

        {/* Accent badge */}
        {agent.accent && (
          <p className="text-xs text-gray-400 mb-3">
            🎙 {agent.accent} accent
          </p>
        )}

        {/* Supported Languages */}
        {agent.supported_languages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agent.supported_languages.slice(0, 4).map((code) => (
              <span
                key={code}
                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
              >
                {LANGUAGE_LABELS[code] ?? code.toUpperCase()}
              </span>
            ))}
            {agent.supported_languages.length > 4 && (
              <span className="text-xs text-gray-400 px-1 py-0.5">
                +{agent.supported_languages.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          onClick={handleStartConversation}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
          aria-label={`Start ${mode} conversation with ${agent.name}`}
        >
          Start {mode} conversation
        </button>
      </div>
    </div>
  )
}
