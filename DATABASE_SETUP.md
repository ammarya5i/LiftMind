# Database Setup Guide for LiftMind

## 🎯 Quick Answer: **Yes, you need a database to start**

For your presentation, I recommend **creating a NEW Supabase project** for a clean, professional setup.

---

## Option 1: Create New Supabase Project (Recommended for Presentation)

### Step 1: Create Supabase Account/Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `LiftMind` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for demo/presentation

### Step 2: Get Your Credentials
Once project is created:
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

### Step 3: Set Up Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Open `supabase-schema.sql` from this project
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **Run** (or press Ctrl+Enter)

This creates:
- ✅ `users` table
- ✅ `workouts` table  
- ✅ `sessions` table
- ✅ `programs` table
- ✅ `threads` and `thread_messages` tables (if migration files exist)
- ✅ Row Level Security (RLS) policies
- ✅ Auto-user creation trigger

### Step 4: Run Additional Migrations (if needed)
If you have migration files:
1. Run `supabase-migration-threads.sql` (for chat threads feature)
2. Run `supabase-migration-add-workout-metrics.sql` (for workout metrics)

### Step 5: Configure Environment Variables
Create `.env.local` in project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI API Keys
DEEPSEEK_API_KEY=your-deepseek-key
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key

# Optional: n8n Webhook (if using external workflow)
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-domain/webhook/ai-coach
```

### Step 6: Test Connection
```bash
npm run dev
```

Visit `http://localhost:3000` and try:
- Sign up a test account
- Log in
- Check if data saves correctly

---

## Option 2: Reactivate Existing Supabase Project

If your old project (`https://cdpupjsbzzkjrtitdlir.supabase.co`) is just paused:

1. Log into [Supabase Dashboard](https://app.supabase.com)
2. Find your project
3. Click **"Restore"** or **"Reactivate"**
4. Wait for project to come back online
5. Verify schema is still intact (check Tables in dashboard)
6. Update `.env.local` with the credentials

**Note**: If the project was deleted or data is corrupted, use Option 1 instead.

---

## 🚨 Important for Presentation

### Before Your Demo:
1. ✅ **Test signup/login** - Create a test account
2. ✅ **Test workout logging** - Log a sample workout
3. ✅ **Test AI coach chat** - Send a test message
4. ✅ **Check progress page** - Verify charts load
5. ✅ **Test on mobile** - Ensure responsive design works

### Environment Checklist:
- [ ] `.env.local` file exists with all keys
- [ ] Supabase project is active
- [ ] Database schema is applied
- [ ] RLS policies are enabled
- [ ] Test user can sign up and log in
- [ ] Data persists after page refresh

---

## 🔧 Troubleshooting

### "Invalid API key" error
→ Check `.env.local` has correct keys (no extra spaces)

### "Table doesn't exist" error  
→ Run `supabase-schema.sql` in SQL Editor

### "RLS policy violation" error
→ Check RLS policies in Supabase dashboard → Authentication → Policies

### Can't sign up
→ Check Supabase Auth settings → Email templates are configured

---

## 📊 Database Tables Overview

| Table | Purpose |
|-------|---------|
| `users` | User profiles and preferences |
| `workouts` | Workout sessions with lifts |
| `sessions` | AI coach interaction logs |
| `programs` | Training programs |
| `threads` | Chat conversation threads |
| `thread_messages` | Individual chat messages |

---

## 🎯 Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local (see Step 5 above)

# 3. Start dev server
npm run dev

# 4. Open browser
# http://localhost:3000
```

---

**Ready to present?** Make sure all ✅ items above are checked!

