# MotionAI Studio
Next.js 14 + Tailwind + Supabase. Image-to-video via a configurable provider (`lib/provider.ts`, default fal.ai queue API).

## Setup
1. `npm install`
2. Create a Supabase project, run `supabase/schema.sql` in the SQL editor.
3. `cp .env.example .env.local` and fill in FAL_KEY, FAL_MODEL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
4. `npm run dev` → http://localhost:3000
## Deploy
Push to GitHub, import in Vercel, add the same env vars, deploy. (Serverless fine: generation is queued at the provider and polled.)
## Honest limits
- No AI video API is free without limits. fal.ai gives trial credits then bills per second; Hugging Face/Gradio Spaces have free quotas but are unreliable. Set MAX_JOBS_PER_DAY to what you can afford.
- Verify FAL_MODEL and its input fields (duration, resolution, aspect_ratio) against the model's page; schemas differ per model.
