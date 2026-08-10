# 🚀 Deployment Checklist

Use this checklist to ensure your deployment is complete and working correctly.

## 📝 Pre-Deployment

### Code Updates
- [x] Fixed Railway PORT configuration (start.sh, Procfile)
- [x] Updated psycopg version (3.2.4 → 3.3.4)
- [x] Updated Next.js version (15.5.0 → 15.5.1)
- [x] Created .gitignore file
- [x] Added free AI configuration (Groq + Edge TTS)
- [ ] **Push changes to GitHub:**
  ```bash
  git add .
  git commit -m "Production ready with security patches"
  git push origin master
  ```

### Environment Files
- [x] backend/.env configured
- [x] backend/.env.example created
- [x] frontend/.env configured
- [x] Added to .gitignore
- [ ] Verified secrets NOT committed to git

## 🔧 Backend Deployment (Railway/Render)

### Railway Setup
- [ ] Account created at railway.app
- [ ] Project created from GitHub repo
- [ ] PostgreSQL database added
- [ ] Redis added (optional)
- [ ] **Environment variables set:**
  ```
  DJANGO_SETTINGS_MODULE=config.settings.production
  SECRET_KEY=<random-key>
  DEBUG=False
  ALLOWED_HOSTS=${{RAILWAY_PUBLIC_DOMAIN}}
  GROQ_API_KEY=<your-key>
  GROQ_BASE_URL=https://api.groq.com/openai/v1
  GROQ_MODEL=llama-3.3-70b-versatile
  GROQ_WHISPER_MODEL=whisper-large-v3-turbo
  STT_PROVIDER=groq
  LLM_PROVIDER=groq
  TTS_PROVIDER=edge
  EDGE_TTS_VOICE=en-US-AriaNeural
  CORS_ALLOWED_ORIGINS=<vercel-url>
  ```
- [ ] Deployment successful
- [ ] Migrations ran automatically
- [ ] Agents seeded (check logs)
- [ ] Backend URL obtained: `https://_____.railway.app`

### Verify Backend
- [ ] Visit backend URL - should see API message
- [ ] Check `/api/` endpoint works
- [ ] Check `/admin/` loads
- [ ] Review deployment logs for errors
- [ ] No PORT errors in logs

## 🌐 Frontend Deployment (Vercel)

### Vercel Setup
- [ ] Account created at vercel.com
- [ ] Project created from GitHub repo
- [ ] **Environment variables set:**
  ```
  NEXT_PUBLIC_API_URL=https://your-backend.railway.app
  NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
  ```
- [ ] Deployment successful
- [ ] No security warnings
- [ ] Frontend URL obtained: `https://_____.vercel.app`

### Update Backend CORS
- [ ] Add Vercel URL to backend CORS_ALLOWED_ORIGINS
- [ ] Redeploy backend if needed

### Verify Frontend
- [ ] Visit frontend URL
- [ ] All pages load correctly:
  - [ ] `/` (home)
  - [ ] `/login`
  - [ ] `/register`
  - [ ] `/dashboard`
- [ ] No console errors
- [ ] Assets loading correctly

## ✅ Functional Testing

### Authentication
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Can logout
- [ ] Profile shows correct data
- [ ] JWT token refresh works

### Tutors & Sessions
- [ ] Dashboard shows available tutors
- [ ] Can see Spanish tutors (6)
- [ ] Can see Ethiopian language tutors (4)
- [ ] Can create a learning session
- [ ] Session appears in list

### Conversations
- [ ] Can navigate to conversation page
- [ ] Text input works
- [ ] Can send messages
- [ ] AI responds (check Groq API key)
- [ ] Grammar feedback appears
- [ ] Corrections shown
- [ ] Streaming works smoothly

### Voice Mode (if implemented)
- [ ] Can switch to audio mode
- [ ] Microphone permission requested
- [ ] Can record audio
- [ ] STT transcribes correctly (Groq Whisper)
- [ ] TTS plays response (Edge TTS)
- [ ] Different language voices work

## 🔒 Security Checks

### Secrets Management
- [ ] No API keys in git history
- [ ] .env files in .gitignore
- [ ] Different keys for dev/prod
- [ ] GROQ_API_KEY set securely
- [ ] Django SECRET_KEY is strong
- [ ] DEBUG=False in production

### CORS & Permissions
- [ ] CORS allows only your frontend URL
- [ ] Backend rejects unauthorized requests
- [ ] JWT tokens expire correctly
- [ ] Refresh token mechanism works

### SSL/HTTPS
- [ ] Backend uses HTTPS
- [ ] Frontend uses HTTPS
- [ ] WebSockets use WSS
- [ ] No mixed content warnings

## 📊 Performance & Monitoring

### Response Times
- [ ] Backend responds < 2 seconds
- [ ] Frontend loads < 3 seconds
- [ ] AI responses stream smoothly
- [ ] No obvious lag

### Resource Usage
- [ ] Check Railway/Render metrics
- [ ] Memory usage reasonable
- [ ] No memory leaks
- [ ] CPU usage acceptable

### API Limits
- [ ] Check Groq API usage
- [ ] Monitor rate limits
- [ ] No quota exceeded errors

## 🐛 Common Issues to Check

### Backend Issues
- [ ] No "PORT" errors
- [ ] psycopg version correct (3.3.4)
- [ ] Migrations applied
- [ ] Static files served
- [ ] Agents exist in database

### Frontend Issues
- [ ] Next.js version 15.5.1+
- [ ] Environment variables set
- [ ] API URLs correct (https://)
- [ ] WebSocket URLs correct (wss://)
- [ ] CORS allows requests

### Integration Issues
- [ ] Backend accepts frontend requests
- [ ] JWT tokens work
- [ ] Error messages clear
- [ ] Loading states work

## 📚 Documentation

- [x] README.md complete
- [x] DEPLOYMENT.md available
- [x] API_CONFIGURATION.md created
- [ ] Environment variables documented
- [ ] Team members can deploy

## 🎉 Final Steps

### Go Live
- [ ] Share app URL with users
- [ ] Monitor error logs
- [ ] Watch for issues
- [ ] Collect feedback

### Post-Launch
- [ ] Set up error tracking (optional: Sentry)
- [ ] Set up uptime monitoring (optional: UptimeRobot)
- [ ] Plan for scaling if needed
- [ ] Document known issues

## 📞 Support Resources

**If something doesn't work:**

1. **Check logs:**
   - Railway: `railway logs`
   - Vercel: Check dashboard
   
2. **Common fixes:**
   - Redeploy: `git push`
   - Clear cache: Vercel → Clear Cache
   - Restart: Railway → Restart service

3. **Documentation:**
   - README.md
   - DEPLOYMENT.md
   - API_CONFIGURATION.md

4. **External resources:**
   - Railway docs: https://docs.railway.app
   - Vercel docs: https://vercel.com/docs
   - Groq docs: https://console.groq.com/docs

---

**✅ When all checkboxes are ticked, your deployment is complete!**

**🚀 Congratulations on deploying your free AI language learning platform!**
