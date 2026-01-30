# Resend + Supabase: Email sign-up confirmation

Supabase sends confirmation emails when users sign up. To send them through **Resend** (and use your domain), configure Supabase to use Resend’s SMTP.

## 1. Resend setup

1. Create an API key at [Resend → API Keys](https://resend.com/api-keys) (you can use the one in `.env` as `RESEND_API_KEY`).
2. [Verify your domain](https://resend.com/domains) in Resend so you can send from e.g. `noreply@yourdomain.com` or `hello@yourdomain.com`.

## 2. Supabase SMTP (Resend)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Providers** → **Email**, or **Project Settings** → **Auth** → **SMTP Settings**.
3. Enable **Custom SMTP** and use:

   | Field        | Value              |
   |-------------|--------------------|
   | **Host**    | `smtp.resend.com`  |
   | **Port**    | `465` (or `587`)   |
   | **Username** | `resend`           |
   | **Password** | Your Resend API key (same as `RESEND_API_KEY` in `.env`) |

4. Set **Sender email** to an address on your verified Resend domain (e.g. `noreply@yourdomain.com`).
5. Set **Sender name** (e.g. `WhatsNum`).
6. Save.

After this, sign-up confirmation and magic-link emails from Supabase Auth will be sent via Resend.

## 3. Security

- Keep `RESEND_API_KEY` only in `.env` (do not commit it).
- If the key was ever shared or exposed, create a new key in Resend and update Supabase SMTP and `.env`.
