import type { WSMessage } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

// ─── Conversation WebSocket (text mode) ──────────────────────────────────────
export class ConversationWebSocket {
  private ws: WebSocket | null = null
  private readonly token: string
  private readonly sessionId: string
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private onMessageCallback: ((data: WSMessage) => void) | null = null
  private onCloseCallback: (() => void) | null = null
  private isManualClose = false

  constructor(sessionId: string, token: string) {
    this.sessionId = sessionId
    this.token = token
  }

  connect(
    onMessage: (data: WSMessage) => void,
    onClose?: () => void,
  ): void {
    this.onMessageCallback = onMessage
    this.onCloseCallback = onClose ?? null
    this.isManualClose = false
    this._connect()
  }

  private _connect(): void {
    const url = `${WS_URL}/ws/conversation/${this.sessionId}/?token=${this.token}`
    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      console.log('[ConversationWS] Connected to session:', this.sessionId)
    }

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data: WSMessage = JSON.parse(event.data as string)
        this.onMessageCallback?.(data)
      } catch {
        console.error('[ConversationWS] Failed to parse message:', event.data)
      }
    }

    this.ws.onerror = (event) => {
      console.error('[ConversationWS] Error:', event)
    }

    this.ws.onclose = (event) => {
      console.log('[ConversationWS] Closed:', event.code, event.reason)
      if (!this.isManualClose) {
        this._scheduleReconnect()
      } else {
        this.onCloseCallback?.()
      }
    }
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[ConversationWS] Max reconnect attempts reached.')
      this.onCloseCallback?.()
      return
    }
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000)
    console.log(`[ConversationWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this._connect()
    }, delay)
  }

  sendText(content: string): void {
    this._send({ type: 'text_message', content, mode: 'text' })
  }

  sendJson(data: object): void {
    this._send(data)
  }

  private _send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('[ConversationWS] Cannot send — WebSocket not open.')
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  disconnect(): void {
    this.isManualClose = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
  }
}

// ─── Audio WebSocket (binary streaming) ──────────────────────────────────────
export class AudioWebSocket {
  private ws: WebSocket | null = null
  private sessionId: string | null = null
  private token: string | null = null
  private onAudioChunkCallback: ((chunk: ArrayBuffer) => void) | null = null
  private onMessageCallback: ((data: WSMessage) => void) | null = null
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 3
  private isManualClose = false

  connect(
    sessionId: string,
    token: string,
    onMessage?: (data: WSMessage) => void,
  ): void {
    this.sessionId = sessionId
    this.token = token
    this.onMessageCallback = onMessage ?? null
    this.isManualClose = false
    this._connect()
  }

  private _connect(): void {
    const url = `${WS_URL}/ws/audio/${this.sessionId}/?token=${this.token}`
    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      console.log('[AudioWS] Connected to session:', this.sessionId)
    }

    this.ws.onmessage = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        // Binary audio chunk
        this.onAudioChunkCallback?.(event.data)
      } else {
        // Text control message
        try {
          const data: WSMessage = JSON.parse(event.data as string)
          this.onMessageCallback?.(data)
        } catch {
          console.error('[AudioWS] Failed to parse message:', event.data)
        }
      }
    }

    this.ws.onerror = (event) => {
      console.error('[AudioWS] Error:', event)
    }

    this.ws.onclose = (event) => {
      console.log('[AudioWS] Closed:', event.code)
      if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = 1000 * (this.reconnectAttempts + 1)
        setTimeout(() => {
          this.reconnectAttempts++
          this._connect()
        }, delay)
      }
    }
  }

  startRecording(): void {
    this._sendJson({ type: 'start_recording' })
  }

  stopRecording(): void {
    this._sendJson({ type: 'stop_recording' })
  }

  sendAudioChunk(chunk: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(chunk)
    }
  }

  onAudioChunk(callback: (chunk: ArrayBuffer) => void): void {
    this.onAudioChunkCallback = callback
  }

  private _sendJson(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  disconnect(): void {
    this.isManualClose = true
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
  }
}
