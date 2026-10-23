# Supabase Auth and deployment

This app uses Supabase Auth for email/password accounts. Supabase stores and verifies passwords. The `public.profiles` table stores account names, student IDs, and roles. Public registration creates student profiles only; teacher access must be granted by an administrator.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com/).
2. Open **SQL Editor** and run `supabase/migrations/202610230001_profiles.sql`.
3. In **Project Settings → API**, copy the project URL and the publishable key (or legacy anon key). Never use a secret/service-role key in the browser.
4. In **Authentication → Providers → Email**, enable email/password sign-in and email confirmation if you want verified addresses.

## 2. Configure local development

Create a `.env` file in the project root with:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

The two `VITE_` values are used by the browser client. The server values let Express verify Supabase access tokens. These are public/publishable keys; do not put a Supabase secret/service-role key in this file or in the frontend.

In Supabase **Authentication → URL Configuration**, set the Site URL to your deployed service URL and add these redirect URLs:

- `http://localhost:3000/**`
- `https://YOUR-RENDER-SERVICE.onrender.com/**`

The app uses the current origin for signup confirmation and password reset links, so the local and deployed origins must be on the allowlist.

Run the app locally with `npm install` and `npm run dev`. It starts the Express server and Vite on port 3000. Restart it after changing `.env`.

## 3. Create teacher access

Register a student account first, then run this in Supabase SQL Editor, replacing the email:

```sql
update public.profiles p
set role = 'teacher'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('teacher@example.edu');
```

The Teacher Portal checks the profile role returned by Supabase; selecting that tab does not grant teacher permissions.

## 4. Deploy the full app on Render

Use a **Web Service**, not a Static Site. The Express server hosts both the built Vite app and `/api/*` routes.

1. Push this repository to GitHub, then create a Render Web Service connected to it.
2. Use these settings:
   - Runtime: **Node**
   - Build command: `npm ci && npm run build`
   - Start command: `npm start`
   - Health check path: `/api/health`
3. Add these environment variables in Render **before the first deploy**:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase publishable/anon key
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_ANON_KEY` = the same publishable/anon key
   - `GEMINI_API_KEY` = optional; only needed for Gemini-powered server grading
4. Attach a persistent disk mounted at `/opt/render/project/src/data`. The Express API writes its JSON database and backup into this directory. Without persistent storage, those app records can be lost when the service restarts or redeploys. Render persistent disks require a paid service and limit the service to one instance; see [Render persistent disk documentation](https://render.com/docs/disks).
5. Deploy. Copy the resulting `https://...onrender.com` URL into Supabase **Authentication → URL Configuration** as the Site URL and redirect URL. Trigger a redeploy if you changed environment variables after deployment.
6. Open the deployed URL, register a student account, verify the email if confirmation is enabled, then sign in. Promote a teacher account with the SQL above.

This deployment uses Supabase for authentication and a persistent disk for the app's JSON records. For a multi-instance or production classroom deployment, migrate those app records to Postgres with per-user/class Row Level Security; a shared JSON state file is intended only for a small single-instance demo.

## Notes

- The old demo accounts are not Supabase accounts. Register new accounts; old demo passwords cannot be migrated.
- `data/aak_exam_db.json` and `data/aak_exam_db.backup.json` are local/runtime records and are ignored by Git. The server creates seed data if they are absent.
- `VITE_SUPABASE_ANON_KEY` is intentionally browser-visible. Never expose Supabase secret/service-role keys or commit `.env`.
- The app includes demo seed data and sample answers. Do not use real student records until the app's shared JSON backend and answer delivery are replaced with appropriately scoped database access and server-side grading.
