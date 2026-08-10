# Frontend API Configuration Guide

This document explains how the frontend communicates with the backend API.

## 📡 How It Works

### 1. Environment Variables

The frontend uses **Next.js environment variables** that start with `NEXT_PUBLIC_` to configure API endpoints:

**File: `frontend/.env` or `frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

**Important:**
- Variables MUST start with `NEXT_PUBLIC_` to be accessible in the browser
- These are embedded at **build time**, not runtime
- For production, set these in Vercel/Netlify dashboard

### 2. API Client Configuration

**File: `frontend/src/lib/api.ts`**

```typescript
// Line 12: Read environment variable with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Line 15-16: Create Axios instance with base URL
export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,  // Adds /api prefix
  headers: {
    'Content-Type': 'application/json',
  },
})
```

### 3. How API Calls Work

When you make an API call:

```typescript
// In your component or page
import { authApi } from '@/lib/api'

const user = await authApi.login({ username: 'john', password: 'pass123' })
```

**What happens:**
1. `authApi.login()` calls `apiClient.post('/auth/login/', data)`
2. Axios combines: `baseURL + endpoint`
3. Final URL: `http://localhost:8000/api/auth/login/`
4. Request is sent with JWT token (if logged in)

### 4. Automatic Token Handling

The API client automatically:

**Attaches JWT token to every request:**
```typescript
// Line 24: Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**Refreshes expired tokens:**
```typescript
// Line 56: Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      // Retry original request with new token
    }
  }
)
```

## 🌐 Environment Setup

### Development (Local)

**File: `frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

**Usage:**
- Backend runs on `localhost:8000`
- Frontend runs on `localhost:3000`
- CORS allows localhost

### Production (Deployed)

#### Option 1: Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
   ```
3. Redeploy: `vercel --prod`

#### Option 2: .env.production (Not Recommended)

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
```

⚠️ **Warning:** Don't commit production URLs to git!

## 🔌 API Endpoints Available

All endpoints automatically use `${API_URL}/api` prefix:

### Auth
- `POST /api/auth/login/` - Login
- `POST /api/auth/register/` - Register
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/profile/` - Get user profile
- `PATCH /api/auth/profile/` - Update profile
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Agents
- `GET /api/agents/` - List all AI tutors
- `GET /api/agents/:id/` - Get specific tutor

### Sessions
- `POST /api/sessions/` - Create learning session
- `GET /api/sessions/` - List user's sessions
- `GET /api/sessions/:id/` - Get specific session
- `POST /api/sessions/:id/end/` - End session

### Conversations
- `GET /api/conversations/sessions/:id/messages/` - Get chat history

## 🔌 WebSocket Configuration

**File: `frontend/.env.local`**
```env
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

**Usage (if implementing WebSocket):**
```typescript
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
const ws = new WebSocket(`${wsUrl}/ws/conversation/${sessionId}/`)
```

**Production:**
```env
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
```

Note: Use `wss://` (secure WebSocket) in production!

## 🛠️ Configuration Examples

### Example 1: Railway Backend + Vercel Frontend

**Backend (Railway):**
- URL: `https://language-learning.railway.app`

**Frontend (Vercel) - Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://language-learning.railway.app
NEXT_PUBLIC_WS_URL=wss://language-learning.railway.app
```

**Backend CORS Settings:**
```env
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Example 2: Render Backend + Vercel Frontend

**Backend (Render):**
- URL: `https://language-learning.onrender.com`

**Frontend (Vercel):**
```env
NEXT_PUBLIC_API_URL=https://language-learning.onrender.com
NEXT_PUBLIC_WS_URL=wss://language-learning.onrender.com
```

### Example 3: Custom Domain

**Backend:**
- URL: `https://api.linguaai.com`

**Frontend:**
- URL: `https://linguaai.com`
- Environment:
  ```env
  NEXT_PUBLIC_API_URL=https://api.linguaai.com
  NEXT_PUBLIC_WS_URL=wss://api.linguaai.com
  ```

## 🐛 Troubleshooting

### "Network Error" / "Failed to fetch"

**Problem:** Frontend can't reach backend

**Check:**
1. Is backend URL correct?
   ```bash
   curl https://your-backend.railway.app/api/
   ```
2. Are environment variables set in Vercel?
3. Did you redeploy after changing env vars?

### "CORS Error"

**Problem:** Backend rejects frontend requests

**Solution:** Update backend CORS settings
```env
# Backend .env
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### "401 Unauthorized"

**Problem:** Token missing or expired

**Check:**
1. Is user logged in?
2. Is token in localStorage?
   ```javascript
   localStorage.getItem('access_token')
   ```
3. Token interceptor working?

### Environment Variables Not Working

**Problem:** Changes to .env not reflected

**Solution:**
1. Restart dev server:
   ```bash
   npm run dev
   ```
2. For production, rebuild:
   ```bash
   vercel --prod
   ```

**Note:** Environment variables are embedded at build time!

## 🔒 Security Best Practices

### 1. Never Commit Secrets
```gitignore
# .gitignore
.env
.env.local
.env.production
```

### 2. Use Different URLs Per Environment

**Development:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Production:**
```env
NEXT_PUBLIC_API_URL=https://api.production.com
```

### 3. Validate Backend URL

In `api.ts`, add validation:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set')
}

if (!API_URL.startsWith('http')) {
  throw new Error('NEXT_PUBLIC_API_URL must start with http:// or https://')
}
```

## 📚 Quick Reference

### Check Current Configuration

```bash
# In your browser console (when app is running)
console.log(process.env.NEXT_PUBLIC_API_URL)
console.log(process.env.NEXT_PUBLIC_WS_URL)
```

### Test API Connection

```bash
# Test from command line
curl https://your-backend.railway.app/api/

# Should return: {"message": "API is running"}
```

### Common Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

---

**Need help?** Check the main README.md or DEPLOYMENT.md for more information.
