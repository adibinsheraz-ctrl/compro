# Kips College — Chance & Fine Tracker

Mobile-first class tracker: each student gets a configurable number of free chances (default **1**). After that, every logged miss adds a fine (default **Rs 50**). Chances never regenerate except via an explicit, confirmed undo of a mistaken log.

## Stack

- **Next.js** (App Router) — UI + secured API routes
- **Supabase** (Postgres) — data store with RLS locked down
- **Custom auth** — bcrypt password hash + httpOnly session cookie + `sessions` table

## Setup

### 1. Create a Supabase project

1. Open [supabase.com](https://supabase.com) and create a project.
2. Go to **SQL Editor**, paste and run everything in `supabase/schema.sql`.
3. Copy **Project URL** and **service_role** key from **Settings → API**.

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Use the **service role** key only on the server. The anon key is intentionally unused for app data — RLS revokes public access.

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Admin login

| Field    | Value        |
|----------|--------------|
| Username | `kips@7777`  |
| Password | `kips@8888`  |

The password is stored only as a bcrypt hash in `admins`. Plaintext is never saved.

## How chance / fine logic works

Implemented atomically in Postgres (`log_student_incident`):

1. Lock student + settings rows.
2. If `chances_used < chances_allowed` → increment `chances_used`, insert incident type `chance_used`, amount `0`.
3. Else → add `fine_amount` to `total_fine`, insert incident type `fine`.

No client-side counting. Undo is behind a confirmation on the student detail screen and only reverses the latest incident.

## Security notes

- Every API route checks a valid row in `sessions` server-side.
- Session cookie: `httpOnly`, `SameSite=Lax`, `Secure` in production.
- Sessions expire after 12 hours.
- Login attempts are rate-limited (8 failures / 15 min / IP).
- RLS enabled; `anon` / `authenticated` roles have no table grants.

## Deploy

Deploy to Vercel (or similar). Set the same env vars in the host dashboard. Use HTTPS so the Secure cookie flag applies.

## Credit

**Adi Bin Sheraz** — adi.binsheraz@gmail.com — Instagram [@adibinsheraz](https://instagram.com/adibinsheraz)

- https://adi3d.vercel.app/
- https://adisocial.vercel.app/
