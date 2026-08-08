'use client'

import { useState } from 'react'
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react'
import { useAudioStream } from '@/hooks/useAudioStream'
import type { MessageFeedback } from '@/types'

interface AudioInterfaceProps {
  sessionId: string
  onFeedback?: (feedback: MessageFeedback | null) => void
}

interface ConversationTurn {
  id: number
  type: 'user' | 'ai'
  text: string
  timestamp: Date
}

const STAGE_LABELS: Record<string, string> = {
  stt: 'Transcribing audio...',
  llm: 'Generating response...',
  tts: 'Preparing audio...',
}

export function AudioInterface({ sessionId, onFeedback: _onFeedback }: AudioInterfaceProps) {
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [turnIdRef] = useState({ current: 0 })

  const {
    isRecording,
    isPlaying,
    isConnected,
    isProcessing,
    processingStage,
    toggleRecording,
  } = useAudioStream({
    sessionId,
    onTranscript: (text) => {
      setTurns((prev) => [
        ...prev,
        { id: turnIdRef.current++, type: 'user', text, timestamp: new Date() },
      ])
    },
    onAIResponse: (text) => {
      setTurns((prev) => [
        ...prev,
        { id: turnIdRef.current++, type: 'ai', text, timestamp: new Date() },
      ])
    },
    onError: (message) => {
      console.error('[AudioInterface]', message)
    },
  })

  const getStatusText = () => {
    if (!isConnected) return 'Connecting...'
    if (isProcessing && processingStage) return STAGE_LABELS[processingStage] ?? 'Processing...'
    if (isPlaying) return 'AI is speaking...'
    if (isRecording) return 'Listening...'
    return 'Press to speak'
  }

  const getMicButtonClass = () => {
    if (isRecording) {
      return 'bg-red-500 hover:bg-red-600 shadow-xl shadow-red-200 scale-105'
    }
    if (isProcessing || isPlaying) {
      return 'bg-gray-200 cursor-not-allowed'
    }
    return 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200'
  }

  return (
    <div className="flex flex-col items-center h-[calc(100vh-220px)] min-h-96">
      {/* Transcript history */}
      <div className="w-full flex-1 overflow-y-auto mb-8 space-y-3">
        {turns.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Your conversation will appear here
          </div>
        )}
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={`flex ${turn.type === 'user' ? 'justify-end' : 'justify-start'} message-enter`}
          >
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                turn.type === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
              }`}
            >
              {turn.text}
            </div>
          </div>
        ))}
      </div>

      {/* Status */}
      <p className="text-sm text-gray-500 mb-6 h-5 text-center">{getStatusText()}</p>

      {/* Waveform when recording */}
      {isRecording && (
        <div className="flex items-end gap-1 h-8 mb-6" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={i}
              className="wave-bar bg-red-400"
              style={{ height: `${Math.floor(Math.random() * 100) + 20}%` }}
            />
          ))}
        </div>
      )}

      {/* Speaking indicator */}
      {isPlaying && !isRecording && (
        <div className="flex items-center gap-2 mb-6 text-indigo-600" aria-live="polite" aria-label="AI is speaking">
          <Volume2 className="w-5 h-5 animate-pulse" />
          <div className="flex items-end gap-1 h-6">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="wave-bar bg-indigo-400" />
            ))}
          </div>
        </div>
      )}

      {/* Processing spinner */}
      {isProcessing && !isPlaying && (
        <div className="flex items-center gap-2 mb-6 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}

      {/* Microphone button */}
      <button
        onClick={toggleRecording}
        disabled={!isConnected || isProcessing || isPlaying}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${getMicButtonClass()}`}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        aria-pressed={isRecording}
      >
        {isRecording ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : isProcessing ? (
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </button>

      <p className="text-xs text-gray-400 mt-4">
        {isRecording ? 'Tap to stop recording' : 'Tap the microphone to start speaking'}
      </p>
    </div>
  )
}
