# Piggy Bank

A personal finance tracking app with automatic bank sync via Plaid, AI spending insights, and iOS support via Capacitor.

**Live:** https://project-7r7p0.vercel.app

## Features

- Bank account connection via Plaid Link (transactions sync automatically)
- Automatic transaction categorization
- Monthly spending insights powered by Claude (Anthropic)
- Manual transaction entry
- Configurable monthly budget
- iOS app via Capacitor

## Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL via Supabase + Prisma ORM
- **Auth:** JWT (jose) + bcrypt passwords
- **Bank data:** Plaid API
- **AI insights:** Anthropic Claude (claude-haiku-4-5)
- **Rate limiting:** Upstash Redis
- **Error tracking:** Sentry
- **Deployment:** Vercel

## Local Development

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in all values:
   ```bash
   cp .env.example .env
   ```

3. Run the database migration:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for the full list. Required:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooler connection string (Transaction mode, port 6543) |
| `DIRECT_URL` | Supabase direct connection string (for migrations) |
| `JWT_SECRET` | 32-byte random hex string (`openssl rand -hex 32`) |
| `ENCRYPTION_KEY` | 32-byte random hex string for encrypting Plaid tokens |
| `PLAID_CLIENT_ID` | From Plaid dashboard |
| `PLAID_SECRET` | From Plaid dashboard |
| `PLAID_ENV` | `sandbox`, `development`, or `production` |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `UPSTASH_REDIS_REST_URL` | From Upstash console (optional, enables rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | From Upstash console (optional, enables rate limiting) |

## Deployment

Deployed on Vercel. Set all env vars in Vercel project settings, then:

```bash
vercel --prod
```

> Use the Supabase **Transaction pooler** URL (port 6543, `?pgbouncer=true`) for `DATABASE_URL` on Vercel. Direct connections do not work in serverless environments.
