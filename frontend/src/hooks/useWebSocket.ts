'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ConversationWebSocket } from '@/lib/websocket'
import { getAccessToken } from '@/lib/api'
import type { Message, WSMessage } from '@/types'

interface UseWebSocketOptions {
  sessionId: string
  enabled?: boolean
}

interface UseWebSocketReturn {
  messages: Message[]
  streamingContent: string
  isConnected: boolean
  isLoading: boolean
  sendMessage: (content: string) => void
  clearMessages: () => void
}

export function useWebSocket({
  sessionId,
  enabled = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const wsRef = useRef<ConversationWebSocket | null>(null)
  const messageIdRef = useRef<number>(0)

  const handleMessage = useCallback((data: WSMessage) => {
    switch (data.type) {
      case 'connected':
        setIsConnected(true)
        break

      case 'stream_start':
        setIsLoading(true)
        setStreamingContent('')
        break

      case 'stream_chunk': {
        const chunk = data.chunk as string
        setStreamingContent((prev) => prev + chunk)
        break
      }

      case 'message_complete': {
        setIsLoading(false)
        setStreamingContent('')
        const completedMessage: Message = {
          id: (data.message_id as number) ?? --messageIdRef.current,
          role: 'assistant',
          content: data.content as string,
          mode: 'text',
          feedback: (data.feedback as Message['feedback']) ?? null,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, completedMessage])
        break
      }

      case 'error':
        setIsLoading(false)
        setStreamingContent('')
        console.error('[WS] Server error:', data.message)
        break

      default:
        break
    }
  }, [])

  const handleClose = useCallback(() => {
    setIsConnected(false)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!enabled || !sessionId) return

    const token = getAccessToken()
    if (!token) return

    const ws = new ConversationWebSocket(sessionId, token)
    wsRef.current = ws
    ws.connect(handleMessage, handleClose)

    return () => {
      ws.disconnect()
      wsRef.current = null
      setIsConnected(false)
    }
  }, [sessionId, enabled, handleMessage, handleClose])

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current?.isConnected) return

    const userMessage: Message = {
      id: --messageIdRef.current,
      role: 'user',
      content,
      mode: 'text',
      feedback: null,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    wsRef.current.sendText(content)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    streamingContent,
    isConnected,
    isLoading,
    sendMessage,
    clearMessages,
  }
}
