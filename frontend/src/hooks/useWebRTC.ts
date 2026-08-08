'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseWebRTCReturn {
  localStream: MediaStream | null
  isVideoActive: boolean
  isAudioActive: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  startVideo: () => Promise<void>
  stopVideo: () => void
  toggleMicrophone: () => void
  toggleCamera: () => void
  error: string | null
}

interface UseWebRTCOptions {
  video?: boolean
  audio?: boolean
}

export function useWebRTC({
  video = true,
  audio = true,
}: UseWebRTCOptions = {}): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isVideoActive, setIsVideoActive] = useState(false)
  const [isAudioActive, setIsAudioActive] = useState(audio)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startVideo = useCallback(async () => {
    if (streamRef.current) return

    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            }
          : false,
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 48000,
            }
          : false,
      })

      streamRef.current = stream
      setLocalStream(stream)
      setIsVideoActive(true)
      setIsAudioActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera/microphone access denied. Please grant permissions.'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'No camera or microphone found on this device.'
            : 'Failed to access camera/microphone.'
      setError(message)
      console.error('[WebRTC] getUserMedia error:', err)
    }
  }, [video, audio])

  const stopVideo = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setLocalStream(null)
    setIsVideoActive(false)
    setIsAudioActive(false)
  }, [])

  const toggleMicrophone = useCallback(() => {
    if (!streamRef.current) return
    const audioTracks = streamRef.current.getAudioTracks()
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled
    })
    setIsAudioActive((prev) => !prev)
  }, [])

  const toggleCamera = useCallback(() => {
    if (!streamRef.current) return
    const videoTracks = streamRef.current.getVideoTracks()
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled
    })
    setIsVideoActive((prev) => !prev)
  }, [])

  // Attach stream to video element whenever both are ready
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return {
    localStream,
    isVideoActive,
    isAudioActive,
    videoRef,
    startVideo,
    stopVideo,
    toggleMicrophone,
    toggleCamera,
    error,
  }
}
