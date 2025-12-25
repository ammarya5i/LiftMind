# Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

DEEPSEEK_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=

NEXT_PUBLIC_N8N_WEBHOOK_URL=
```

- `SUPABASE_SERVICE_ROLE_KEY` is required on the server only (e.g. API routes) for privileged operations such as account deletion.
- `DEEPSEEK_API_KEY` is consumed by the server-side AI proxy at `app/api/ai-chat/route.ts`; you no longer need to expose a public DeepSeek key in the browser.
- `GEMINI_API_KEY` / `OPENAI_API_KEY` enable the vision analysis endpoint; provide at least one.
- `NEXT_PUBLIC_N8N_WEBHOOK_URL` is optional and only needed if you want to forward messages to an external n8n workflow.

After populating the file, restart the dev server so Next.js picks up the new configuration.

