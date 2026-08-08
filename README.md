# LinguaAI — AI-Powered Real-Time Language Learning Platform

A full-stack language learning platform with real-time voice, text, and video conversations powered by AI. Built with **Django 5.2** + **Channels** on the backend and **Next.js 15.5** on the frontend.

---

## Features

- 🎙 **Voice conversations** — Real-time STT (Whisper) → LLM → TTS pipeline over WebSockets
- 💬 **Text chat** — Streaming LLM responses with inline grammar corrections
- 📹 **Video mode** — Camera + voice with animated AI avatar
- 📊 **Live feedback** — Grammar corrections, vocabulary suggestions, and pronunciation scores
- 🤖 **Multiple AI agents** — Each with a distinct persona, role, and teaching style
- 🔒 **JWT authentication** — Secure login/register with automatic token refresh
- ⚡ **Adaptive difficulty** — AI adjusts to your A1–C2 proficiency level
- 🌍 **10+ languages** — Spanish, French, German, Japanese, Mandarin, and more

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | Django 5.2 + Django REST Framework |
| Real-time | Django Channels 4 + Daphne (ASGI) |
| Database | PostgreSQL 16 |
| Cache / broker | Redis 7 |
| AI — STT | faster-whisper (local) or OpenAI Whisper |
| AI — LLM | GPT-4o (OpenAI) or Ollama (local) |
| AI — TTS | OpenAI TTS |
| Task queue | Celery |
| Frontend | Next.js 15.5 (App Router, React 19) |
| Styling | Tailwind CSS v4 |
| HTTP client | Axios |
| State | React hooks + Zustand |
| Container | Docker + Docker Compose |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- An [OpenAI API key](https://platform.openai.com/) (or configure local providers)

### 1. Clone and configure

```bash
git clone <repo-url>
cd language-learning-platform

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env and set your OPENAI_API_KEY
```

### 2. Start with Docker Compose

```bash
docker-compose up --build
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Django backend on **http://localhost:8000**
- Next.js frontend on **http://localhost:3000**

### 3. Create a superuser

```bash
docker-compose exec backend python manage.py createsuperuser
```

### 4. Seed AI agents (optional)

```bash
docker-compose exec backend python manage.py shell
```

```python
from apps.agents.models import AIAgent

AIAgent.objects.create(
    name="Sofia",
    persona="The Encouraging Friend — warm, patient, makes learning feel natural",
    role="general",
    accent="Neutral Spanish",
    supported_languages=["es", "en"],
    system_prompt_template=(
        "You are {persona}, a language tutor helping {user_name} practice "
        "{target_language} at the {proficiency_level} level. "
        "Be warm and encouraging. Stay in {target_language} as much as possible. "
        "After each response, provide feedback in a ```json block with corrections and suggestions."
    ),
)
```

---

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Start the ASGI server (with WebSocket support)
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# Or for development without WebSockets:
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register a new user |
| POST | `/api/auth/login/` | Login and get JWT tokens |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET/PATCH | `/api/auth/profile/` | Get or update profile |

### Agents

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/agents/` | List all active agents |
| GET | `/api/agents/<id>/` | Get agent details |

### Sessions

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/sessions/` | List user's sessions |
| POST | `/api/sessions/` | Create a new session |
| GET | `/api/sessions/<id>/` | Get session details |
| POST | `/api/sessions/<id>/end/` | End a session |

### Conversations

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/conversations/sessions/<id>/messages/` | List messages for a session |

### WebSocket Endpoints

| Endpoint | Description |
|---|---|
| `ws://localhost:8000/ws/conversation/<session_id>/?token=<jwt>` | Text conversation |
| `ws://localhost:8000/ws/audio/<session_id>/?token=<jwt>` | Audio streaming |

---

## WebSocket Protocol

### Text Conversation

**Client → Server:**
```json
{ "type": "text_message", "content": "Hola, ¿cómo estás?", "mode": "text" }
```

**Server → Client (streaming):**
```json
{ "type": "stream_start", "message_id": 42 }
{ "type": "stream_chunk", "chunk": "¡Hola! " }
{ "type": "stream_chunk", "chunk": "Estoy bien, " }
{ "type": "message_complete", "content": "¡Hola! Estoy bien, gracias.", "feedback": {...} }
```

### Audio Streaming

**Client → Server:**
```json
{ "type": "start_recording" }
```
Then send binary audio chunks (ArrayBuffer).
```json
{ "type": "stop_recording" }
```

**Server → Client:**
```json
{ "type": "transcript", "content": "Hola, ¿cómo estás?" }
{ "type": "ai_response", "content": "¡Hola! Estoy bien..." }
{ "type": "audio_start" }
// Binary audio chunks
{ "type": "audio_end" }
```

---

## AI Provider Configuration

Set these in `backend/.env`:

```env
# STT: 'local' (faster-whisper) or 'openai' (Whisper API)
STT_PROVIDER=local
WHISPER_MODEL_SIZE=base  # tiny, base, small, medium, large

# LLM: 'openai' (GPT-4o) or 'local' (Ollama)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# For local LLM via Ollama:
# LLM_PROVIDER=local
# LOCAL_LLM_BASE_URL=http://localhost:11434
# LOCAL_LLM_MODEL=llama3

# TTS: 'openai' or 'local'
TTS_PROVIDER=openai
```

---

## Project Structure

```
language-learning-platform/
├── backend/
│   ├── apps/
│   │   ├── accounts/      # User auth & profiles
│   │   ├── agents/        # AI agent definitions
│   │   ├── sessions/      # Learning session tracking
│   │   └── conversations/ # Messages & WebSocket consumers
│   ├── config/
│   │   ├── settings/      # Base, development, production configs
│   │   ├── asgi.py        # ASGI + Channels routing
│   │   └── middleware.py  # JWT WebSocket authentication
│   └── services/
│       ├── ai_provider.py # Abstract base classes
│       ├── stt_service.py # Speech-to-text (Whisper)
│       ├── llm_service.py # Language model (GPT-4o / Ollama)
│       └── tts_service.py # Text-to-speech
└── frontend/
    └── src/
        ├── app/           # Next.js App Router pages
        ├── components/    # React UI components
        ├── hooks/         # Custom React hooks
        ├── lib/           # API client & WebSocket manager
        └── types/         # TypeScript type definitions
```

---

## Security Notes

- All WebSocket connections require a valid JWT token passed as `?token=<access_token>`
- System prompts include guardrails to prevent prompt injection
- Production settings enforce HTTPS, HSTS, and secure cookies
- Token blacklisting prevents token reuse after logout

---

## License

MIT
