'use client'

import { useEffect } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2 } from 'lucide-react'
import { useWebRTC } from '@/hooks/useWebRTC'
import { useAudioStream } from '@/hooks/useAudioStream'
import type { AIAgent, MessageFeedback } from '@/types'

interface VideoInterfaceProps {
  sessionId: string
  agent: AIAgent | null
  onFeedback?: (feedback: MessageFeedback | null) => void
}

export function VideoInterface({ sessionId, agent, onFeedback: _onFeedback }: VideoInterfaceProps) {
  const {
    isVideoActive,
    isAudioActive,
    videoRef,
    startVideo,
    stopVideo,
    toggleMicrophone,
    toggleCamera,
    error: videoError,
  } = useWebRTC({ video: true, audio: true })

  const {
    isRecording,
    isPlaying,
    isProcessing,
    toggleRecording,
  } = useAudioStream({
    sessionId,
    enabled: isVideoActive,
  })

  // Auto-start video on mount
  useEffect(() => {
    startVideo()
    return () => {
      stopVideo()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const agentInitials = agent?.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'AI'

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-96">
      {videoError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {videoError}
        </div>
      )}

      {/* Main video area */}
      <div className="relative flex-1 bg-gray-900 rounded-2xl overflow-hidden">
        {/* AI "Video" — animated avatar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Agent avatar circle */}
            <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl">
              <span className="text-white text-4xl font-bold">{agentInitials}</span>
            </div>

            {/* Speaking animation rings */}
            {isPlaying && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-400/50 animate-ping" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-indigo-300/30 animate-ping"
                  style={{ animationDelay: '0.2s' }}
                />
              </>
            )}

            {/* Speaking icon */}
            {isPlaying && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-white text-sm">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span>Speaking</span>
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && !isPlaying && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-gray-400 text-sm">
                Thinking...
              </div>
            )}
          </div>
        </div>

        {/* Agent name overlay */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
          <p className="text-white text-sm font-medium">{agent?.name ?? 'AI Tutor'}</p>
          {agent?.accent && (
            <p className="text-gray-300 text-xs">{agent.accent} accent</p>
          )}
        </div>

        {/* Listening indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">Recording</span>
          </div>
        )}

        {/* Local camera preview */}
        <div className="absolute bottom-4 right-4 w-36 h-24 bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
          {isVideoActive ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
              aria-label="Your camera preview"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <VideoOff className="w-6 h-6 text-gray-500" />
            </div>
          )}
          {/* Local user name */}
          <div className="absolute bottom-1 left-1 right-1 text-center">
            <span className="text-white text-xs bg-black/50 px-1.5 py-0.5 rounded">You</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pt-5">
        {/* Microphone */}
        <button
          onClick={() => {
            toggleMicrophone()
            if (!isRecording) toggleRecording()
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isAudioActive
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-red-100 hover:bg-red-200 text-red-600'
          }`}
          aria-label={isAudioActive ? 'Mute microphone' : 'Unmute microphone'}
          aria-pressed={!isAudioActive}
        >
          {isAudioActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Push-to-talk */}
        <button
          onClick={toggleRecording}
          disabled={isProcessing || isPlaying}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 scale-105'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={isRecording ? 'Stop speaking' : 'Start speaking'}
          aria-pressed={isRecording}
        >
          <Mic className="w-6 h-6 text-white" />
        </button>

        {/* Camera */}
        <button
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isVideoActive
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-red-100 hover:bg-red-200 text-red-600'
          }`}
          aria-label={isVideoActive ? 'Turn off camera' : 'Turn on camera'}
          aria-pressed={!isVideoActive}
        >
          {isVideoActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* End call */}
        <button
          onClick={stopVideo}
          className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
          aria-label="End video call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
