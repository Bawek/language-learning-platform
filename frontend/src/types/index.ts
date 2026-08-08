export interface User {
  id: number
  email: string
  username: string
  full_name: string
  first_name: string
  last_name: string
  target_language: string
  native_language: string
  proficiency_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  avatar?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface AIAgent {
  id: number
  name: string
  persona: string
  role: 'interviewer' | 'local_guide' | 'pronunciation_specialist' | 'general' | 'debate_partner' | 'storyteller'
  role_display: string
  accent: string
  dialect: string
  supported_languages: string[]
  difficulty_scaling: boolean
  is_active: boolean
  avatar_url?: string
}

export type ConversationMode = 'audio' | 'text' | 'video'

export interface MessageFeedback {
  corrections?: Array<{
    original: string
    corrected: string
    explanation: string
  }>
  suggestions?: string[]
  pronunciation_score?: number | null
}

export interface Message {
  id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  audio_url?: string
  mode: ConversationMode
  feedback?: MessageFeedback | null
  timestamp: string
}

export interface LearningSession {
  id: number
  user: number
  user_username: string
  agent: number
  agent_detail: AIAgent
  mode: ConversationMode
  target_language: string
  proficiency_level: string
  started_at: string
  ended_at?: string | null
  is_active: boolean
  grammar_mistakes: unknown[]
  new_vocabulary: unknown[]
  pronunciation_scores: Record<string, number>
  total_messages: number
  summary: string
  duration_minutes: number | null
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password_confirm: string
  target_language: string
  native_language: string
  proficiency_level: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status?: number
}

// WebSocket message types from backend
export type WSMessageType =
  | 'connected'
  | 'stream_start'
  | 'stream_chunk'
  | 'message_complete'
  | 'session_ended'
  | 'error'
  | 'pong'
  | 'transcript'
  | 'ai_response'
  | 'audio_start'
  | 'audio_end'
  | 'processing'
  | 'recording_started'

export interface WSMessage {
  type: WSMessageType
  [key: string]: unknown
}
