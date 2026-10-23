# Real account login setup

The app now uses Supabase Auth for email/password signup, verification, login, session restoration, and logout. Supabase stores password hashes; the app never writes a password to its own tables. Student/teacher roles and display names live in `public.profiles`.

## One-time Supabase setup

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. In **SQL Editor**, run `supabase/migrations/202610230001_profiles.sql`.
3. In **Project Settings → API**, copy the Project URL and the publishable/anon key. These are safe for browser use when Row Level Security is enabled; never put a `service_role` key in this app.
4. Add these values to a local `.env` file for Vite, and to the Vercel project's Environment Variables for Production/Preview/Development:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```

   Redeploy the Vercel app after saving the values. `.env.example` shows the required names.
5. In Supabase **Authentication → URL Configuration**, set the site URL to your deployed app and add the local and deployed app URLs to the redirect allowlist. Configure SMTP/email confirmation if you want users to verify their email before logging in.

## First teacher account

Public registration intentionally creates student accounts only. Create the teacher account in **Authentication → Users** (or register it through the app), then promote that account using SQL Editor. Replace the email with the teacher's actual account email:

```sql
update public.profiles p
set role = 'teacher'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('teacher@example.edu');
```

The Teacher Portal tab is for signing in to an already-promoted teacher account; it does not grant teacher access.

## Server/API configuration

If you run the Express API in `server.ts`, also set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in that server's environment. The API validates Supabase access tokens before serving `/api/*` routes. Vercel currently builds this repo as a Vite frontend; it does not automatically run `server.ts`. The login itself can use Supabase directly, but the existing JSON-file app data API needs a persistent database and a Vercel-compatible API deployment before its data can be safely shared across deployed instances.

The previous demo accounts are not Supabase accounts. Register new accounts or create them in Supabase Auth; assigning a profile the same email does not migrate or reveal any old password.
