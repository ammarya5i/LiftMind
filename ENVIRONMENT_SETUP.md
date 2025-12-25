# Environment Configuration

## Local Development

Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key
GEMINI_API_KEY=your_gemini_key (optional)
OPENAI_API_KEY=your_openai_key (optional)

# Rate Limiting (Optional but recommended)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Site URL (for production redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Variable Descriptions

- **`NEXT_PUBLIC_SUPABASE_URL`** - Your Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** - Supabase anonymous/public key
- **`SUPABASE_SERVICE_ROLE_KEY`** - Required on the server only (e.g. API routes) for privileged operations such as account deletion. Keep this secret!
- **`DEEPSEEK_API_KEY`** - Consumed by the server-side AI proxy at `app/api/ai-chat/route.ts`; you no longer need to expose a public DeepSeek key in the browser.
- **`GEMINI_API_KEY` / `OPENAI_API_KEY`** - Enable the vision analysis endpoint; provide at least one for image analysis features.
- **`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`** - Optional but recommended for production. Enables rate limiting on API routes.
- **`NEXT_PUBLIC_SITE_URL`** - Your site URL. Use `http://localhost:3000` for local development, or your production URL (e.g., `https://liftmind.netlify.app`) for deployment.

---

## Production Deployment (Netlify)

For Netlify deployment, add these environment variables in **Netlify Dashboard → Site settings → Environment variables**:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DEEPSEEK_API_KEY=your_deepseek_api_key
UPSTASH_REDIS_REST_URL=your_upstash_url (optional)
UPSTASH_REDIS_REST_TOKEN=your_upstash_token (optional)
NEXT_PUBLIC_SITE_URL=https://liftmind.netlify.app
```

**Important**: After setting `NEXT_PUBLIC_SITE_URL`, update Supabase redirect URLs to match your production domain.

---

## After Configuration

1. **Restart the dev server** so Next.js picks up the new configuration:
   ```bash
   npm run dev
   ```

2. **Verify configuration** by checking:
   - Can sign up/login
   - AI chat works
   - Workouts can be logged
   - Data persists after refresh

