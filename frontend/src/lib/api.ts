import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type {
  User,
  AIAgent,
  LearningSession,
  Message,
  LoginCredentials,
  RegisterData,
  AuthTokens,
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create the main Axios instance
export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// ─── Request interceptor: attach JWT Bearer token ────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Track whether we're already refreshing to avoid infinite loops
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  failedQueue = []
}

// ─── Response interceptor: handle 401 → refresh token → retry ────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = typeof window !== 'undefined'
        ? localStorage.getItem('refresh_token')
        : null

      if (!refreshToken) {
        isRefreshing = false
        processQueue(error, null)
        // Redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      try {
        const response = await axios.post<{ access: string }>(
          `${API_URL}/api/auth/token/refresh/`,
          { refresh: refreshToken },
        )
        const newAccessToken = response.data.access

        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', newAccessToken)
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
        processQueue(null, newAccessToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

// ─── Token helpers ────────────────────────────────────────────────────────────
export function saveTokens(tokens: AuthTokens) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
  }
}

export function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const res = await apiClient.post<{ access: string; refresh: string; user: User }>(
      '/auth/login/',
      credentials,
    )
    return res.data
  },

  register: async (data: RegisterData) => {
    const res = await apiClient.post<{ tokens: AuthTokens; user: User }>(
      '/auth/register/',
      data,
    )
    return res.data
  },

  logout: async (refreshToken: string) => {
    await apiClient.post('/auth/logout/', { refresh: refreshToken })
  },

  getProfile: async () => {
    const res = await apiClient.get<User>('/auth/profile/')
    return res.data
  },

  updateProfile: async (data: Partial<User>) => {
    const res = await apiClient.patch<User>('/auth/profile/', data)
    return res.data
  },
}

// ─── Agents API ───────────────────────────────────────────────────────────────
export const agentsApi = {
  getAgents: async (language?: string) => {
    const params = language ? { language } : {}
    const res = await apiClient.get<{ results: AIAgent[]; count: number }>('/agents/', { params })
    return res.data
  },

  getAgent: async (id: number) => {
    const res = await apiClient.get<AIAgent>(`/agents/${id}/`)
    return res.data
  },
}

// ─── Sessions API ─────────────────────────────────────────────────────────────
export const sessionsApi = {
  createSession: async (data: {
    agent: number
    mode: string
    target_language?: string
    proficiency_level?: string
  }) => {
    const res = await apiClient.post<LearningSession>('/sessions/', data)
    return res.data
  },

  getSessions: async () => {
    const res = await apiClient.get<{ results: LearningSession[]; count: number }>('/sessions/')
    return res.data
  },

  getSession: async (id: number) => {
    const res = await apiClient.get<LearningSession>(`/sessions/${id}/`)
    return res.data
  },

  endSession: async (id: number, summary?: string) => {
    const res = await apiClient.post<LearningSession>(`/sessions/${id}/end/`, { summary })
    return res.data
  },
}

// ─── Conversations API ────────────────────────────────────────────────────────
export const conversationsApi = {
  getMessages: async (sessionId: number) => {
    const res = await apiClient.get<{ results: Message[] }>(
      `/conversations/sessions/${sessionId}/messages/`,
    )
    return res.data
  },
}

export default apiClient
