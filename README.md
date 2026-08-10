# 🌍 LinguaAI - Free Language Learning Platform

A modern, AI-powered language learning platform with **100% free AI services**. Learn languages through conversations with AI tutors, supporting text, voice, and video modes.

## ✨ Key Features

### 🆓 Completely Free AI Stack
- **No OpenAI credits required**
- **No GPU needed**
- **Production-ready on free hosting**
- Uses Groq (LLM + STT) and Edge TTS (completely free)

### 🤖 AI-Powered Learning
- Real-time conversations with AI tutors
- Grammar corrections and feedback
- Pronunciation guidance
- Cultural context and tips

### 🌐 Multi-Language Support
- **Spanish**: 6 specialized tutors
- **Amharic** (አማርኛ): Ethiopian language with native voice
- **Oromo** (Afaan Oromoo): Ethiopian language
- **Tigrinya** (ትግርኛ): Ethiopian language
- **Somali** (Soomaali): East African language with native voice
- Extensible to 100+ languages

### 🎭 Multiple Learning Modes
- **Text**: Chat-based practice with instant feedback
- **Audio**: Voice conversations with speech recognition
- **Video**: Coming soon - immersive video chat

### 👥 Specialized AI Tutors
Each tutor has a unique personality and teaching style:
- María - The Friendly Guide (Spanish)
- Carlos - Job Interview Coach (Spanish)
- Isabella - Pronunciation Expert (Spanish)
- Diego - Local Guide (Spanish)
- Sofía - Debate Partner (Spanish)
- Alejandro - Storyteller (Spanish)
- Alemayehu - Ethiopian Cultural Ambassador (Amharic)
- Chaltu - Oromo Language Guide (Oromo)
- Mekelle - Tigrinya Teacher (Tigrinya)
- Faadumo - Somali Conversation Partner (Somali)

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or use free hosted DB)
- Redis (or use free hosted Redis)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd language-learning-platform
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY (free from https://console.groq.com)

# Run migrations
python manage.py migrate

# Seed AI tutors
python manage.py seed_agents

# Start the server (use Daphne for WebSocket support)
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Start development server
npm run dev
```

### 4. Access the Platform
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Admin Panel: http://localhost:8000/admin

## 🔧 Configuration

### Free AI Stack Configuration

The platform uses three AI services, all **completely free**:

```env
# Groq API (FREE - get from https://console.groq.com/keys)
GROQ_API_KEY=gsk_YOUR_KEY_HERE
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_WHISPER_MODEL=whisper-large-v3-turbo

# AI Providers (ALL FREE)
STT_PROVIDER=groq      # Speech-to-Text
LLM_PROVIDER=groq      # Language Model
TTS_PROVIDER=edge      # Text-to-Speech

# Edge TTS Voice (optional)
EDGE_TTS_VOICE=en-US-AriaNeural
```

**No OpenAI API key required!** 🎉

### Available Edge TTS Voices

**English:**
- `en-US-AriaNeural` (Female, American) - Default
- `en-US-GuyNeural` (Male, American)
- `en-GB-SoniaNeural` (Female, British)

**Spanish:**
- `es-ES-ElviraNeural` (Female, Spain)
- `es-MX-DaliaNeural` (Female, Mexican)
- `es-AR-ElenaNeural` (Female, Argentinian)

**Ethiopian Languages:**
- `am-ET-MekdesNeural` (Female, Amharic)
- `am-ET-AmehaNeural` (Male, Amharic)
- `so-SO-UbaxNeural` (Female, Somali)
- `so-SO-MuuseNeural` (Male, Somali)

**List all voices:** `edge-tts --list-voices`

### 🔒 Security: API Key Management

**⚠️ CRITICAL: Never commit .env files to git!**

The `.gitignore` file is configured to exclude all sensitive files. To get a Groq API key:

1. Go to https://console.groq.com
2. Sign up (free, no credit card)
3. Navigate to API Keys
4. Create new key
5. Add to `.env` file only (never commit)

If you accidentally expose a key:
1. Immediately revoke it at https://console.groq.com/keys
2. Create a new one
3. Update your `.env`
4. Restart services

## 📊 Architecture

```
┌─────────────────────────────────────────────┐
│         LinguaAI Platform                   │
├──────────────┬──────────────┬───────────────┤
│   Frontend   │   Backend    │   AI Services │
├──────────────┼──────────────┼───────────────┤
│   Next.js    │   Django     │   Groq LLM    │
│   React      │   Channels   │   Groq STT    │
│   TailwindCSS│   DRF        │   Edge TTS    │
│   TypeScript │   PostgreSQL │   (ALL FREE)  │
└──────────────┴──────────────┴───────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- Zustand (State Management)
- WebSockets (Real-time communication)

**Backend:**
- Django 5.2
- Django Channels (WebSocket)
- Django REST Framework
- PostgreSQL (Database)
- Redis (Caching & Channels)
- Daphne (ASGI Server)

**AI Services (All Free):**
- Groq LLaMA 3.3 (70B) - Chat
- Groq Whisper Large v3 - Speech-to-Text
- Microsoft Edge TTS - Text-to-Speech

## 🎯 Use Cases

### 👨‍🎓 Students
- Practice conversations in target language
- Get instant grammar corrections
- Learn pronunciation with native voices
- Engage with cultural content

### 👩‍🏫 Teachers
- Assign conversation practice
- Monitor student progress
- Customize learning objectives
- Track session analytics

### 🏢 Language Schools
- Supplement classroom instruction
- Provide 24/7 practice opportunities
- Scale to unlimited students
- Zero additional tutor costs

### 🌍 NGOs & Non-Profits
- Provide free language education
- Deploy without budget constraints
- Support refugee language learning
- Enable global access to education

## 📁 Project Structure

```
language-learning-platform/
├── backend/
│   ├── apps/
│   │   ├── accounts/       # User authentication
│   │   ├── agents/         # AI tutor management
│   │   ├── conversations/  # Real-time chat
│   │   └── sessions/       # Learning sessions
│   ├── config/             # Django settings
│   ├── services/           # AI service providers
│   │   ├── llm_service.py  # Groq LLM
│   │   ├── stt_service.py  # Groq Whisper
│   │   └── tts_service.py  # Edge TTS
│   ├── test_free_ai.py     # Test script
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities
│   │   └── stores/       # State management
│   └── package.json
├── .gitignore             # Git ignore rules
├── README.md              # This file
└── DEPLOYMENT.md          # Deployment guide
```

## 🚀 Deployment

### Option 1: Railway (Recommended)
Free tier includes PostgreSQL and Redis. See [DEPLOYMENT.md](DEPLOYMENT.md) for complete guide.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy backend
cd backend
railway init
railway up

# Set environment variables
railway variables set GROQ_API_KEY=your_key_here
railway variables set STT_PROVIDER=groq
railway variables set LLM_PROVIDER=groq
railway variables set TTS_PROVIDER=edge
railway variables set GROQ_MODEL=llama-3.3-70b-versatile
railway variables set GROQ_WHISPER_MODEL=whisper-large-v3-turbo
railway variables set EDGE_TTS_VOICE=en-US-AriaNeural
```

### Option 2: Render
Free tier with automatic HTTPS. Configure environment variables in dashboard.

### Option 3: Docker
For local or VPS deployment. See [DEPLOYMENT.md](DEPLOYMENT.md) for docker-compose configuration.

## 🧪 Testing

### Run Free AI Test Suite
```bash
cd backend
python test_free_ai.py
```

This will verify:
- ✅ Environment variables configured correctly
- ✅ Groq LLM working (requires valid API key)
- ✅ Edge TTS working (no key needed)
- ✅ All providers initialized

Expected output when API key is valid:
```
✅ LLM: PASSED
✅ TTS: PASSED  
✅ STT: PASSED
```

### Manual Testing
1. Register a new account
2. Select a language and proficiency level
3. Choose a tutor
4. Start a text conversation
5. Try voice mode (requires microphone)

### Troubleshooting

**"Invalid API Key"**
- Get free key from https://console.groq.com/keys
- Update `GROQ_API_KEY` in `.env`
- Restart server

**"edge-tts not installed"**
```bash
pip install edge-tts==6.1.18
```

**WebSocket won't connect**
- Use Daphne, not Django dev server
- Command: `daphne -b 0.0.0.0 -p 8000 config.asgi:application`

**Railway deployment fails with "$PORT" error**
- The platform uses `start.sh` which handles PORT correctly
- Alternative: Railway will use `nixpacks.toml` if `Procfile` fails
- Check Railway logs to see which configuration it's using

## 📚 Documentation

This README contains all essential information. Additional resources:

- **DEPLOYMENT.md** - Detailed deployment instructions for Railway, Render, Docker, and VPS
- **backend/test_free_ai.py** - Automated test script for verifying AI configuration

## 🔒 Security Best Practices

### API Key Management

**Never commit these files:**
- `.env` (already in .gitignore)
- Any file containing API keys
- Database credentials

**If you accidentally expose a key:**
1. Immediately revoke at https://console.groq.com/keys
2. Create new key
3. Update `.env` only
4. Never commit the new key
5. Restart services

**Best practices:**
- Use different keys for development and production
- Rotate keys regularly
- Monitor usage at Groq dashboard
- Never share keys in chat, email, or screenshots

## 💰 Cost Analysis

### Monthly Costs for 10,000 Active Users

| Service | Free Stack | OpenAI Stack | Savings |
|---------|------------|--------------|---------|
| LLM | $0 | $5,000+ | $5,000+ |
| STT | $0 | $600+ | $600+ |
| TTS | $0 | $1,500+ | $1,500+ |
| Hosting | $0-20 | $0-20 | $0 |
| **Total** | **$0-20** | **$7,100+** | **$7,080+** |

### Why Free Works

- Groq provides free tier with generous limits
- Edge TTS is completely free (no limits)
- No GPU required (API-based inference)
- Works on free hosting tiers (Railway, Render)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Adding New Languages

1. Update `LANGUAGE_CHOICES` in `backend/apps/accounts/models.py`
2. Add tutor in `backend/apps/agents/management/commands/seed_agents.py`
3. Update frontend labels in `frontend/src/components/agents/AgentCard.tsx`
4. Run migrations and seed command

### Adding New AI Providers

1. Implement the base interface in `backend/services/ai_provider.py`
2. Add provider class in respective service file
3. Update factory function
4. Test with `test_free_ai.py`

## 🎯 Roadmap

- [ ] Video chat with AI avatars
- [ ] Pronunciation scoring
- [ ] Gamification (points, achievements)
- [ ] Mobile apps (React Native)
- [ ] Offline mode with local models
- [ ] Group learning sessions
- [ ] Custom vocabulary lists
- [ ] Progress analytics dashboard

---

## 📋 Quick Reference

### Common Commands

**Backend:**
```bash
# Activate virtual environment
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Seed AI tutors
python manage.py seed_agents

# Start server (WebSocket support)
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# Run tests
python test_free_ai.py
```

**Frontend:**
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build
npm start
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | ✅ Yes | - | Get from console.groq.com |
| `STT_PROVIDER` | No | groq | Speech-to-text provider |
| `LLM_PROVIDER` | No | groq | Language model provider |
| `TTS_PROVIDER` | No | edge | Text-to-speech provider |
| `GROQ_MODEL` | No | llama-3.3-70b-versatile | LLM model |
| `GROQ_WHISPER_MODEL` | No | whisper-large-v3-turbo | STT model |
| `EDGE_TTS_VOICE` | No | en-US-AriaNeural | TTS voice |

### URLs

- **Local Frontend:** http://localhost:3000
- **Local Backend:** http://localhost:8000
- **API:** http://localhost:8000/api
- **Admin:** http://localhost:8000/admin
- **WebSocket:** ws://localhost:8000/ws

### Useful Links

- **Groq Console:** https://console.groq.com
- **Edge TTS Voices:** Run `edge-tts --list-voices`
- **Railway Dashboard:** https://railway.app
- **Render Dashboard:** https://render.com

---

**🌟 Star this repo if you find it useful!**

**🎓 Built with ❤️ for free education worldwide.**
