# Deployment Guide for LiftMind

## 🚀 Quick Start

### Step 1: Deploy to GitHub

The project is already connected to GitHub. To push updates:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

---

## 🌐 Deploy to Netlify (Current Setup)

### Prerequisites
- GitHub repository connected
- Netlify account (free tier available)

### Deployment Steps

1. **Go to [Netlify](https://app.netlify.com)**
2. **Click "Add new site" → "Import an existing project"**
3. **Connect to GitHub** and select your `LiftMind` repository
4. **Configure build settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `18` or higher
5. **Add Environment Variables** (see below)
6. **Click "Deploy site"**

### Netlify Configuration

The project includes `netlify.toml` with the correct settings:
- Framework: Next.js
- Build command: `npm run build`
- Publish directory: `.next`

### Environment Variables for Netlify

Go to **Site settings → Environment variables** and add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPSEEK_API_KEY=your_deepseek_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
UPSTASH_REDIS_REST_URL=your_upstash_url (optional)
UPSTASH_REDIS_REST_TOKEN=your_upstash_token (optional)
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
```

### Supabase Redirect URLs

After deployment, configure Supabase:
1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL** to: `https://your-site.netlify.app`
3. Add **Redirect URLs**:
   - `https://your-site.netlify.app/**`
   - `http://localhost:3000/**` (for local development)

---

## 🔄 Alternative: Deploy to Vercel

### Steps

1. **Go to [Vercel](https://vercel.com)**
2. **Import your GitHub repository**
3. **Add environment variables** (same as Netlify)
4. **Deploy!**

Vercel automatically detects Next.js and configures build settings.

---

## 📋 Required Environment Variables

Make sure these are set in your deployment platform:

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `DEEPSEEK_API_KEY` - DeepSeek API key for AI chat
- `SUPABASE_SERVICE_ROLE_KEY` - For server-side operations

### Optional (Recommended for Production)
- `UPSTASH_REDIS_REST_URL` - For rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - For rate limiting
- `NEXT_PUBLIC_SITE_URL` - Your production URL (for redirects)

---

## ✅ Post-Deployment Checklist

- [ ] Environment variables are set
- [ ] Supabase redirect URLs are configured
- [ ] Test signup/login flow
- [ ] Test password reset email
- [ ] Verify AI chat works
- [ ] Check workout logging
- [ ] Test on mobile devices

---

## 🔗 Current Deployment

- **Production URL**: `https://liftmind.netlify.app`
- **GitHub Repository**: Already connected
- **Status**: ✅ Deployed and configured


