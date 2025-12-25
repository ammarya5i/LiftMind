# Free Tier Supabase Setup Guide

## ✅ Good News: Free Tier Works Perfectly for LiftMind!

Your restored Supabase project on the **free tier** will work great for your presentation. Here's what you need to know:

---

## 🆓 Free Tier Limits (What You Get)

### Database
- ✅ **500 MB database storage** - Plenty for demo/presentation
- ✅ **2 GB bandwidth** - More than enough for testing
- ✅ **Unlimited API requests** - No worries about rate limits
- ✅ **All core features** - Auth, Database, Storage (1 GB)

### Authentication
- ✅ **Unlimited users** - No user limit
- ✅ **Email auth** - Full email/password support
- ✅ **Magic links** - Passwordless login works
- ✅ **Social auth** - OAuth providers (if needed)

### What You DON'T Get (But Don't Need)
- ❌ Daily backups (only weekly on free tier)
- ❌ Point-in-time recovery
- ❌ Priority support
- ❌ Custom domains (but you can use Vercel for frontend)

**Bottom line**: Free tier is perfect for demos and presentations! 🎉

---

## 🚀 Setup Steps for Restored Project

### Step 1: Restore Your Project
1. Go to [app.supabase.com](https://app.supabase.com)
2. Find your project: `cdpupjsbzzkjrtitdlir`
3. Click **"Restore"** or **"Reactivate"**
4. Wait 1-2 minutes for it to come online

### Step 2: Verify Database Schema
After restoration, check if tables exist:

1. Go to **Table Editor** in Supabase dashboard
2. Check for these tables:
   - ✅ `users`
   - ✅ `workouts`
   - ✅ `sessions`
   - ✅ `programs`
   - ✅ `threads` (if you ran migration)
   - ✅ `thread_messages` (if you ran migration)

**If tables are missing:**
- Go to **SQL Editor**
- Run `supabase-schema.sql`
- Then run `supabase-migration-threads.sql`
- Then run `supabase-migration-add-workout-metrics.sql`

### Step 3: Check Row Level Security (RLS)
1. Go to **Authentication** → **Policies**
2. Verify RLS is enabled on all tables
3. If policies are missing, re-run the schema SQL

### Step 4: Get Your Credentials
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://cdpupjsbzzkjrtitdlir.supabase.co`
   - **anon/public key**: (starts with `eyJ...`)
   - **service_role key**: (starts with `eyJ...`)

### Step 5: Update `.env.local`
Create or update `.env.local` in your project root:

```env
# Supabase (Free Tier - Works Great!)
NEXT_PUBLIC_SUPABASE_URL=https://cdpupjsbzzkjrtitdlir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI API Keys (Required)
DEEPSEEK_API_KEY=your-deepseek-key
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key

# Optional: n8n Webhook
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-domain/webhook/powerlifting-coach
```

### Step 6: Test Everything
```bash
npm run dev
```

Test these features:
- ✅ Sign up new account
- ✅ Log in
- ✅ Log a workout
- ✅ Chat with AI coach
- ✅ View progress charts
- ✅ Update settings

---

## ⚠️ Free Tier Considerations for Presentation

### What to Watch For:

1. **Database Size**
   - Free tier: 500 MB
   - For demo: This is plenty (thousands of workouts)
   - **Action**: Delete old test data if needed

2. **Bandwidth**
   - Free tier: 2 GB/month
   - For demo: More than enough
   - **Action**: No action needed

3. **API Rate Limits**
   - Free tier: Unlimited requests
   - **Action**: No worries!

4. **Backups**
   - Free tier: Weekly backups only
   - For demo: Not an issue
   - **Action**: Export important data before presentation if needed

### Performance Tips:

1. **Indexes are already set up** ✅
   - Your schema includes indexes for fast queries
   - No performance issues expected

2. **RLS Policies are optimized** ✅
   - Row Level Security is properly configured
   - Users only see their own data

3. **Connection pooling** ✅
   - Supabase handles this automatically
   - Free tier includes connection pooling

---

## 🧹 Clean Up Old Data (Optional)

If you want a fresh start for presentation:

```sql
-- WARNING: This deletes ALL data!
-- Only run if you want to start fresh

-- Delete all data (keeps schema)
TRUNCATE workouts, sessions, programs, threads, thread_messages CASCADE;
DELETE FROM users WHERE id NOT IN (SELECT id FROM auth.users);
```

Or keep existing data - it shows the app has been used! 📊

---

## ✅ Pre-Presentation Checklist

Before your buyer presentation:

- [ ] Project restored and online
- [ ] All tables exist (check Table Editor)
- [ ] RLS policies enabled (check Authentication → Policies)
- [ ] `.env.local` updated with correct credentials
- [ ] Test account created and working
- [ ] Can sign up new user
- [ ] Can log workout
- [ ] AI coach chat works
- [ ] Progress charts load
- [ ] Settings page works
- [ ] Mobile responsive (test on phone)

---

## 🎯 Quick Commands

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Start dev server
npm run dev

# 3. Open browser
# http://localhost:3000
```

---

## 💡 Pro Tips for Free Tier Demo

1. **Show it works** - Free tier proves the app is efficient
2. **Mention scalability** - "Built on Supabase, easily scales to paid tier"
3. **Highlight cost efficiency** - "Runs on free tier, low operational costs"
4. **Data persistence** - Show data persists across sessions

---

## 🚨 If Something Doesn't Work

### "Project paused" error
→ Wait 2-3 minutes after restore, then refresh

### "Invalid API key" error
→ Get fresh keys from Settings → API

### "Table doesn't exist" error
→ Run schema SQL files in SQL Editor

### "RLS policy violation" error
→ Check Authentication → Policies are enabled

### Slow queries
→ Check Table Editor → See if indexes exist

---

## 📊 Free Tier vs Premium (For Your Knowledge)

| Feature | Free Tier | Premium | Needed for Demo? |
|---------|-----------|---------|------------------|
| Database Size | 500 MB | 8 GB+ | ✅ 500 MB is plenty |
| Bandwidth | 2 GB/month | Unlimited | ✅ More than enough |
| API Requests | Unlimited | Unlimited | ✅ Same |
| Daily Backups | ❌ | ✅ | ❌ Not needed |
| Support | Community | Priority | ❌ Not needed |

**Verdict**: Free tier is perfect for your presentation! 🎉

---

**You're all set!** Free tier Supabase will work great for your demo. The app is designed to be efficient and doesn't require premium features.

