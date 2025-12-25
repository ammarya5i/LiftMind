# Deployment to GitHub

## Quick Start

### Option 1: Use Cursor's Built-in Git (Easiest)

1. **Open Source Control** in Cursor (Ctrl+Shift+G)
2. **Initialize Repository** (if not already done)
3. **Stage All Files** (click the `+` next to "Changes")
4. **Commit** with message: "Initial commit - Ready for deployment"
5. **Publish Branch** → Choose "GitHub" → Create new repository
6. Name it `LiftMind` (or your preferred name)
7. Make it **Public** or **Private** as needed
8. Click **Publish**

### Option 2: Install Git and Use Terminal

1. **Install Git for Windows**: https://git-scm.com/download/win
2. **Restart Cursor** after installation
3. Run these commands in terminal:

```bash
cd "C:\Users\ammar\OneDrive\Desktop\LiftMind"
git init
git add .
git commit -m "Initial commit - Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/LiftMind.git
git push -u origin main
```

**Note**: Replace `YOUR_USERNAME` with your GitHub username. Create the repo on GitHub first if needed.

### Option 3: Use GitHub Desktop

1. **Download GitHub Desktop**: https://desktop.github.com/
2. **Sign in** with your GitHub account
3. **File → Add Local Repository** → Select `LiftMind` folder
4. **Publish repository** → Create on GitHub
5. **Commit and push**

## After Deployment

1. **Add environment variables** to your deployment platform (Vercel, etc.)
2. **Deploy to Vercel**:
   - Connect your GitHub repo
   - Add environment variables
   - Deploy!

## Required Environment Variables

Make sure these are set in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DEEPSEEK_API_KEY`
- `UPSTASH_REDIS_REST_URL` (optional)
- `UPSTASH_REDIS_REST_TOKEN` (optional)


