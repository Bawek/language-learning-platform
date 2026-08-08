'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { AudioWebSocket } from '@/lib/websocket'
import { getAccessToken } from '@/lib/api'
import type { WSMessage } from '@/types'

interface UseAudioStreamOptions {
  sessionId: string
  enabled?: boolean
  onTranscript?: (text: string) => void
  onAIResponse?: (text: string) => void
  onError?: (message: string) => void
}

interface UseAudioStreamReturn {
  isRecording: boolean
  isPlaying: boolean
  isConnected: boolean
  isProcessing: boolean
  processingStage: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  toggleRecording: () => Promise<void>
}

const AUDIO_CHUNK_INTERVAL_MS = 250
const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
]

function getSupportedMimeType(): string {
  return (
    SUPPORTED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
  )
}

export function useAudioStream({
  sessionId,
  enabled = true,
  onTranscript,
  onAIResponse,
  onError,
}: UseAudioStreamOptions): UseAudioStreamReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState<string | null>(null)

  const wsRef = useRef<AudioWebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)

  // Connect the AudioWebSocket
  useEffect(() => {
    if (!enabled || !sessionId) return

    const token = getAccessToken()
    if (!token) return

    const ws = new AudioWebSocket()
    wsRef.current = ws

    ws.onAudioChunk((chunk: ArrayBuffer) => {
      audioQueueRef.current.push(chunk)
      if (!isPlayingRef.current) {
        playNextChunk()
      }
    })

    ws.connect(sessionId, token, handleWSMessage)
    // Give WS a moment to connect
    const timer = setTimeout(() => setIsConnected(ws.isConnected), 500)

    return () => {
      clearTimeout(timer)
      ws.disconnect()
      wsRef.current = null
      setIsConnected(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, enabled])

  const handleWSMessage = useCallback((data: WSMessage) => {
    switch (data.type) {
      case 'connected':
        setIsConnected(true)
        break
      case 'recording_started':
        break
      case 'processing':
        setIsProcessing(true)
        setProcessingStage(data.stage as string)
        break
      case 'transcript':
        onTranscript?.(data.content as string)
        break
      case 'ai_response':
        onAIResponse?.(data.content as string)
        break
      case 'audio_start':
        audioQueueRef.current = []
        break
      case 'audio_end':
        setIsProcessing(false)
        setProcessingStage(null)
        break
      case 'error':
        setIsProcessing(false)
        setProcessingStage(null)
        setIsRecording(false)
        onError?.(data.message as string)
        break
      default:
        break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTranscript, onAIResponse, onError])

  const playNextChunk = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      setIsPlaying(false)
      return
    }

    isPlayingRef.current = true
    setIsPlaying(true)

    const chunk = audioQueueRef.current.shift()!

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const ctx = audioContextRef.current
      const audioBuffer = await ctx.decodeAudioData(chunk.slice(0))
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      source.onended = () => {
        playNextChunk()
      }
      source.start()
    } catch {
      // Silently skip un-decodable chunks and try the next
      playNextChunk()
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (isRecording) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      })

      streamRef.current = stream
      const mimeType = getSupportedMimeType()

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorderRef.current = recorder

      wsRef.current?.startRecording()

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.isConnected) {
          event.data.arrayBuffer().then((buffer) => {
            wsRef.current?.sendAudioChunk(buffer)
          })
        }
      }

      recorder.start(AUDIO_CHUNK_INTERVAL_MS)
      setIsRecording(true)
    } catch (err) {
      console.error('[Audio] Failed to start recording:', err)
      onError?.('Microphone access denied. Please allow microphone permissions.')
    }
  }, [isRecording, onError])

  const stopRecording = useCallback(() => {
    if (!isRecording) return

    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    mediaRecorderRef.current = null
    streamRef.current = null

    wsRef.current?.stopRecording()
    setIsRecording(false)
  }, [isRecording])

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording()
    } else {
      await startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close()
    }
  }, [])

  return {
    isRecording,
    isPlaying,
    isConnected,
    isProcessing,
    processingStage,
    startRecording,
    stopRecording,
    toggleRecording,
  }
}
