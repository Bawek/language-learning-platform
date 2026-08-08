'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Send, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { Message, MessageFeedback } from '@/types'

interface TextInterfaceProps {
  sessionId: string
  onFeedback?: (feedback: MessageFeedback | null) => void
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-enter`}>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-md'
              : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
          }`}
        >
          {message.content}
        </div>
        {/* Inline feedback for AI messages */}
        {!isUser && message.feedback?.corrections && message.feedback.corrections.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs max-w-full">
            <p className="font-semibold text-amber-700 mb-1.5">💡 Corrections</p>
            {message.feedback.corrections.map((c, i) => (
              <div key={i} className="mb-1.5 last:mb-0">
                <span className="text-red-500 line-through">{c.original}</span>
                <span className="mx-1.5 text-gray-400">→</span>
                <span className="text-green-600 font-medium">{c.corrected}</span>
                {c.explanation && (
                  <p className="text-gray-500 mt-0.5">{c.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}
        <span className="text-xs text-gray-400 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

export function TextInterface({ sessionId, onFeedback }: TextInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, streamingContent, isConnected, isLoading, sendMessage } = useWebSocket({
    sessionId,
    enabled: true,
  })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Notify parent of new feedback
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.feedback) {
      onFeedback?.(lastMessage.feedback)
    }
  }, [messages, onFeedback])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading || !isConnected) return
    sendMessage(trimmed)
    setInputValue('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-96">
      {/* Connection status */}
      <div className="flex items-center gap-1.5 mb-3 text-xs">
        {isConnected ? (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-600">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Connecting...</span>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && !streamingContent && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Start the conversation by typing a message below.</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Streaming preview */}
        {streamingContent && (
          <div className="flex justify-start message-enter">
            <div className="max-w-[80%] bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md text-sm text-gray-800 leading-relaxed">
              {streamingContent}
              <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse rounded-sm" />
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex gap-2 bg-white border border-gray-200 rounded-2xl p-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/20 transition">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
            disabled={!isConnected || isLoading}
            className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent disabled:cursor-not-allowed"
            aria-label="Message input"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || !isConnected}
            className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
