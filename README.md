

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Deploy to Netlify

The project is configured for [Netlify](https://netlify.com) via `netlify.toml`:

- **Build command:** `pnpm run build`
- **Publish directory:** `dist`
- **SPA redirect:** All routes serve `index.html` so client-side routing works.

**Steps:**

1. Push the repo to GitHub/GitLab/Bitbucket and [connect it to Netlify](https://docs.netlify.com/get-started/).
2. Netlify will use the repo’s `netlify.toml`; no extra build settings needed.
3. In **Site settings → Environment variables**, add:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon key  
   (Required for auth and data; build will still succeed without them, but the app will run in demo mode.)

4. Trigger a new deploy. The site will be available at your Netlify URL.

## Supabase

The app uses [Supabase](https://supabase.com) for backend (auth and database). The client is in `src/app/lib/supabase.ts` and is `null` until env vars are set.

1. Copy `.env.example` to `.env` (or edit `.env`).
2. In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings → API**, copy **Project URL** and **anon public** key.
3. Set in `.env`:
   - `VITE_SUPABASE_URL=` your project URL
   - `VITE_SUPABASE_ANON_KEY=` your anon key

## Supabase MCP (Cursor)

Supabase is connected via [Model Context Protocol](https://supabase.com/docs/guides/getting-started/mcp) so Cursor can use your project (e.g. query DB, run SQL).

- Config: `.cursor/mcp.json` (points to `https://mcp.supabase.com/mcp`).
- **First time:** Cursor will prompt you to sign in to Supabase and grant access. Restart Cursor after auth.
- **Check:** Settings → Cursor Settings → Tools & MCP; confirm the Supabase server is connected.
- **Test:** Ask Cursor to list tables or run a query and mention using MCP tools.

To scope MCP to one project or use read-only mode, see [Supabase MCP docs](https://supabase.com/docs/guides/getting-started/mcp).

## Resend (email sign-up confirmation)

Sign-up confirmation and magic-link emails are sent via [Resend](https://resend.com). The API key is in `.env` as `RESEND_API_KEY`. To have Supabase send auth emails through Resend, configure **Custom SMTP** in the Supabase Dashboard using Resend’s SMTP. Step-by-step: [docs/resend-supabase-smtp.md](docs/resend-supabase-smtp.md).
