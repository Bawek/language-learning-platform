# Deployment Guide - Language Learning Platform

This guide covers deploying both the Django backend and Next.js frontend.

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended)

Railway provides free hosting with PostgreSQL, Redis, and WebSocket support.

#### Backend Deployment

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Navigate to backend
   cd backend
   
   # Initialize project
   railway init
   
   # Add PostgreSQL
   railway add --database postgresql
   
   # Add Redis
   railway add --database redis
   
   # Deploy
   railway up
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set DJANGO_SETTINGS_MODULE=config.settings.production
   railway variables set SECRET_KEY=$(openssl rand -base64 32)
   railway variables set DEBUG=False
   
   # Groq API (FREE - get from https://console.groq.com/keys)
   railway variables set GROQ_API_KEY=your_groq_api_key_here
   railway variables set GROQ_BASE_URL=https://api.groq.com/openai/v1
   railway variables set GROQ_MODEL=llama-3.3-70b-versatile
   railway variables set GROQ_WHISPER_MODEL=whisper-large-v3-turbo
   
   # AI Providers (ALL FREE)
   railway variables set STT_PROVIDER=groq
   railway variables set LLM_PROVIDER=groq
   railway variables set TTS_PROVIDER=edge
   railway variables set EDGE_TTS_VOICE=en-US-AriaNeural
   ```

4. **Get Database URLs**
   ```bash
   # Railway will automatically set:
   # - DATABASE_URL (PostgreSQL)
   # - REDIS_URL (Redis)
   ```

5. **Set CORS Origins**
   ```bash
   railway variables set CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   railway variables set ALLOWED_HOSTS=your-backend.railway.app
   ```

#### Frontend Deployment (Vercel)

1. **Deploy to Vercel**
   ```bash
   cd frontend
   
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel
   ```

2. **Set Environment Variables in Vercel Dashboard**
   - Go to your project settings
   - Add environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app
     NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
     ```

3. **Redeploy**
   ```bash
   vercel --prod
   ```

---

## Option 2: Render

### Backend on Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Connect your GitHub repo
   - Select `backend` as root directory
   - Railway will auto-detect Django and use the Procfile
   - Build Command: `pip install -r requirements.txt`
   - Start Command: Automatically uses `Procfile`

3. **Add PostgreSQL Database**
   - Create PostgreSQL database in Render
   - Copy the Internal Database URL

4. **Add Redis**
   - Create Redis instance in Render
   - Copy the Internal Redis URL

5. **Set Environment Variables** (in Render dashboard)
   ```
   DJANGO_SETTINGS_MODULE=config.settings.production
   SECRET_KEY=<generate-random-key>
   DEBUG=False
   DATABASE_URL=<from-render-postgres>
   REDIS_URL=<from-render-redis>
   
   # Groq (FREE)
   GROQ_API_KEY=<your-groq-key>
   GROQ_BASE_URL=https://api.groq.com/openai/v1
   GROQ_MODEL=llama-3.3-70b-versatile
   GROQ_WHISPER_MODEL=whisper-large-v3-turbo
   
   # AI Providers (ALL FREE)
   STT_PROVIDER=groq
   LLM_PROVIDER=groq
   TTS_PROVIDER=edge
   EDGE_TTS_VOICE=en-US-AriaNeural
   
   # Django
   ALLOWED_HOSTS=your-app.onrender.com
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```

### Frontend on Vercel (same as above)

---

## Option 3: Docker Deployment

### Build Docker Images

```bash
# Backend
cd backend
docker build -t language-learning-backend .

# Frontend
cd ../frontend
docker build -t language-learning-frontend .
```

### Docker Compose for Local/VPS

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: languagelearning
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    command: daphne -b 0.0.0.0 -p 8000 config.asgi:application
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/languagelearning
      - REDIS_URL=redis://redis:6379/0
      - DJANGO_SETTINGS_MODULE=config.settings.production
      - SECRET_KEY=your-secret-key-here
      - DEBUG=False
      - GROQ_API_KEY=your-groq-key
      - LLM_PROVIDER=groq

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_WS_URL=ws://localhost:8000
    depends_on:
      - backend

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

---

## Option 4: VPS (DigitalOcean, AWS, etc.)

### Requirements
- Ubuntu 22.04 LTS
- 2GB RAM minimum
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Nginx

### Setup Script

```bash
#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.11 python3.11-venv python3-pip postgresql redis nginx certbot python3-certbot-nginx

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Clone repository
cd /var/www
git clone <your-repo-url> language-learning
cd language-learning

# Setup Backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create production settings
cp .env.example .env
# Edit .env with production values

# Run migrations
python manage.py migrate
python manage.py seed_agents
python manage.py collectstatic --no-input

# Setup Frontend
cd ../frontend
npm install
npm run build

# Configure systemd service for backend
sudo tee /etc/systemd/system/language-backend.service << EOF
[Unit]
Description=Language Learning Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/language-learning/backend
Environment="PATH=/var/www/language-learning/backend/venv/bin"
ExecStart=/var/www/language-learning/backend/venv/bin/daphne -b 0.0.0.0 -p 8000 config.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Configure systemd service for frontend
sudo tee /etc/systemd/system/language-frontend.service << EOF
[Unit]
Description=Language Learning Frontend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/language-learning/frontend
ExecStart=/usr/bin/npm start
Restart=always
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Start services
sudo systemctl daemon-reload
sudo systemctl enable language-backend language-frontend
sudo systemctl start language-backend language-frontend

# Configure Nginx
sudo tee /etc/nginx/sites-available/language-learning << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/language-learning /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL with Let's Encrypt
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

---

## Environment Variables Reference

### Backend (.env)

```env
# Django
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=<generate-with-openssl-rand-base64-32>
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.com,api.your-domain.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379/0

# ============================================
# FREE AI CONFIGURATION (Groq + Edge TTS)
# ============================================

# Groq API (FREE - get from https://console.groq.com/keys)
GROQ_API_KEY=gsk_xxx
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_WHISPER_MODEL=whisper-large-v3-turbo

# AI Providers - ALL FREE
STT_PROVIDER=groq
LLM_PROVIDER=groq
TTS_PROVIDER=edge

# Edge TTS Voice (FREE, no API key needed)
# Popular voices:
# - English: en-US-AriaNeural, en-US-GuyNeural
# - Spanish: es-ES-ElviraNeural, es-MX-DaliaNeural
# - Amharic: am-ET-MekdesNeural
# - Somali: so-SO-UbaxNeural
EDGE_TTS_VOICE=en-US-AriaNeural

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com

# ============================================
# OPTIONAL: OpenAI (requires paid credits)
# ============================================
# Only set if you want to use OpenAI instead of free alternatives
# OPENAI_API_KEY=sk-xxx
```

### Frontend (.env.local or Vercel env vars)

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com
```

---

## Post-Deployment Checklist

### Essential Checks
- [ ] Backend is running and accessible
- [ ] Check logs: No PORT errors
- [ ] Frontend is running and accessible
- [ ] WebSocket connections work (check browser console)
- [ ] Database migrations completed successfully
- [ ] Agents seeded successfully (check /admin)
- [ ] CORS configured correctly (no CORS errors)
- [ ] SSL certificates installed (HTTPS working)
- [ ] Environment variables set correctly

### Functional Tests
- [ ] User registration works
- [ ] Login/logout works
- [ ] Can create a learning session
- [ ] Text conversations work
- [ ] AI responds with proper feedback
- [ ] Grammar corrections appear
- [ ] Voice mode works (if using audio)
- [ ] Different tutors have different styles
- [ ] Ethiopian language tutors accessible
- [ ] Spanish language tutors accessible

### Performance Checks
- [ ] Backend responds within 2 seconds
- [ ] WebSocket connects within 3 seconds
- [ ] AI responses stream smoothly
- [ ] No memory leaks (check Railway metrics)
- [ ] Database queries optimized

### Security Checks
- [ ] GROQ_API_KEY is set (not exposed in logs)
- [ ] SECRET_KEY is unique and secure
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS configured correctly
- [ ] No sensitive data in error messages

### Railway Specific
- [ ] PORT environment variable detected
- [ ] Build completes successfully
- [ ] start.sh has execute permissions
- [ ] Procfile or nixpacks.toml working
- [ ] PostgreSQL connected
- [ ] Redis connected (if using)

### Monitoring
- [ ] Check Railway logs for errors
- [ ] Monitor Groq API usage
- [ ] Check response times
- [ ] Monitor memory usage
- [ ] Set up uptime monitoring (optional)

---

## Monitoring & Maintenance

### View Logs

**Railway:**
```bash
railway logs
```

**Render:**
- Check logs in Render dashboard

**VPS:**
```bash
sudo journalctl -u language-backend -f
sudo journalctl -u language-frontend -f
```

### Database Backups

**Railway/Render:** 
- Use built-in backup features

**VPS:**
```bash
pg_dump -U postgres languagelearning > backup_$(date +%Y%m%d).sql
```

### Update Deployment

**Railway:**
```bash
railway up
```

**Vercel:**
```bash
vercel --prod
```

**VPS:**
```bash
cd /var/www/language-learning
git pull
cd backend && source venv/bin/activate && pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --no-input
sudo systemctl restart language-backend

cd ../frontend && npm install && npm run build
sudo systemctl restart language-frontend
```

---

## Troubleshooting

### WebSocket Connection Fails
- Check if Daphne is running (not runserver)
- Verify CORS settings include WebSocket origins
- Check firewall/security group rules
- Ensure SSL is configured for WSS connections

### "$PORT" Error on Railway/Render
**Problem:** `daphne: error: argument -p/--port: invalid int value: '$PORT'`

**Solution:**
The Procfile now uses `start.sh` which properly handles the PORT variable.

If you still see this error:
1. Ensure `start.sh` has execute permissions
2. Or manually set start command to: `bash start.sh`
3. Verify PORT environment variable is set by the platform

**Alternative:** Use Railway's nixpacks.toml instead:
```toml
[phases.setup]
nixPkgs = ["python311"]

[phases.install]
cmds = ["pip install -r requirements.txt"]

[start]
cmd = "daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application"
```

### Database Connection Issues
- Verify DATABASE_URL format
- Check database credentials
- Ensure database server is accessible

### Static Files Not Loading
- Run `python manage.py collectstatic`
- Check STATIC_ROOT and STATIC_URL settings
- Configure Nginx to serve /static/ and /media/

### AI Responses Not Working
- Verify GROQ_API_KEY is set
- Check LLM_PROVIDER=groq
- Monitor backend logs for API errors
- Verify Groq account has credits

---

## Support & Resources

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Groq API: https://console.groq.com
- Django Deployment: https://docs.djangoproject.com/en/stable/howto/deployment/

---

**Need help?** Check the logs first, then review this guide step-by-step.
