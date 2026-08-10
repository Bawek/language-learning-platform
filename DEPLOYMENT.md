# Deployment Guide - Language Learning Platform

This guide covers deploying the Django backend and Next.js frontend. **Railway is the recommended platform** for easy, free deployment.

## 🚀 Railway Deployment (Recommended)

Railway provides free hosting with PostgreSQL, Redis, and automatic HTTPS.

### Backend Deployment

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub (free)

2. **Deploy Backend from GitHub**
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

3. **Create New Project in Railway**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect Django

4. **Add PostgreSQL Database**
   - In your project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway automatically sets `DATABASE_URL`

5. **Add Redis (Optional)**
   - Click "New" → "Database" → "Redis"
   - Railway automatically sets `REDIS_URL`

6. **Set Environment Variables**
   
   In Railway dashboard, go to your backend service → Variables:
   
   ```env
   # Django
   DJANGO_SETTINGS_MODULE=config.settings.production
   SECRET_KEY=<generate-random-key>
   DEBUG=False
   ALLOWED_HOSTS=${{RAILWAY_PUBLIC_DOMAIN}}
   
   # Groq API (FREE)
   GROQ_API_KEY=your_groq_key_here
   GROQ_BASE_URL=https://api.groq.com/openai/v1
   GROQ_MODEL=llama-3.3-70b-versatile
   GROQ_WHISPER_MODEL=whisper-large-v3-turbo
   
   # AI Providers (ALL FREE)
   STT_PROVIDER=groq
   LLM_PROVIDER=groq
   TTS_PROVIDER=edge
   EDGE_TTS_VOICE=en-US-AriaNeural
   
   # CORS (update after frontend deployment)
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```

7. **Deploy**
   - Railway deploys automatically
   - Check logs for any errors
   - Migrations run automatically via Procfile

8. **Get Your Backend URL**
   - Click "Settings" → "Generate Domain"
   - Copy the URL (e.g., `https://your-app.railway.app`)

### Frontend Deployment (Vercel)

1. **Deploy to Vercel**
   ```bash
   cd frontend
   npm install -g vercel
   vercel
   ```

2. **Set Environment Variables**
   
   In Vercel dashboard → Settings → Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
   ```

3. **Redeploy**
   ```bash
   vercel --prod
   ```

4. **Update Backend CORS**
   - Go back to Railway
   - Update `CORS_ALLOWED_ORIGINS` with your Vercel URL
   - Redeploy backend

---

## 🔧 Alternative: Docker (Local/VPS)

### Docker Compose Setup

Create `docker-compose.yml` in project root:

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
    command: bash start.sh
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
      - STT_PROVIDER=groq
      - LLM_PROVIDER=groq
      - TTS_PROVIDER=edge

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

## 📋 Environment Variables Reference

### Backend (.env)

```env
# Django
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=<generate-with-openssl-rand-base64-32>
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.com

# Database (provided by Railway)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis (provided by Railway)
REDIS_URL=redis://host:6379/0

# Groq API (FREE)
GROQ_API_KEY=gsk_xxx
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_WHISPER_MODEL=whisper-large-v3-turbo

# AI Providers (ALL FREE)
STT_PROVIDER=groq
LLM_PROVIDER=groq
TTS_PROVIDER=edge
EDGE_TTS_VOICE=en-US-AriaNeural

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
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
- Vercel Docs: https://vercel.com/docs
- Groq API: https://console.groq.com
- Django Deployment: https://docs.djangoproject.com/en/stable/howto/deployment/

---

## Appendix: Render Deployment (Optional Alternative)

If you prefer Render over Railway, here's a minimal setup guide:

### Render Backend

1. **Create Render Account** at https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Settings**:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `bash start.sh`
4. **Add Database**: New → PostgreSQL (copy internal URL)
5. **Environment Variables** (same as Railway, see reference above)
6. **Deploy**

The `start.sh` script works for both Railway and Render.

---

**Need help?** Check the logs first, then review this guide step-by-step.
