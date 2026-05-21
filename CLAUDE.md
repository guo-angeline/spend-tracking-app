# Piggy Bank — Finance App

Personal finance dashboard with Plaid bank linking, AI-powered insights, and transaction categorization.

## Stack

- **Next.js 16** (App Router, `trailingSlash: true`) deployed on **Vercel**
- **Prisma 5** ORM → **Supabase** PostgreSQL in production, SQLite locally (`dev.db`)
- **Plaid** for bank linking and transaction sync (`PLAID_ENV=production`)
- **Anthropic SDK** for AI spending insights
- **Capacitor** for iOS builds (`npm run build:mobile`)
- **Sentry** for error tracking
- **Upstash Redis** for rate limiting

## Critical: Database (SQLite vs PostgreSQL)

The migration history was written for SQLite and **`migration_lock.toml` still says `sqlite`** even though the schema uses `postgresql`. This means:

- `prisma migrate deploy` **will fail** with error P3019. Do NOT add it to the build script.
- The production Supabase DB was bootstrapped via `prisma db push`, not migrations.
- To make schema changes in production: use `prisma db push` with `DIRECT_URL`, or run raw SQL via Supabase dashboard.
- New migration files (like `prisma/migrations/20260521100000_seed_spend_categories/`) are reference SQL only — they will not apply via `prisma migrate deploy`.

**The build script must stay as `next build` only.**

## Auth

- Login uses `authProviderId` (displayed as "Username" in the UI), not email.
- JWT signed with `jose`, stored in Capacitor `Preferences` under key `app_token`.
- All API routes expect `Authorization: Bearer <jwt>` header.
- Demo user: `authProviderId = demo-user-123`, password = `password` — exists locally only, not in production.

## API Routes

All routes live under `src/app/api/`. Because `trailingSlash: true` is set, always include trailing slashes when calling with curl or HTTP clients — otherwise Vercel returns a 308 redirect.

| Route | Purpose |
|---|---|
| `POST /api/auth/login/` | Login with `{ userId, password }` where userId = authProviderId |
| `POST /api/auth/register/` | Register with `{ email, username, password, name }` |
| `GET /api/transactions/` | Fetch all transactions for authed user |
| `POST /api/transactions/manual/` | Create manual transaction |
| `PATCH /api/transactions/[id]/` | Update categoryId |
| `GET /api/categories/` | List all SpendCategories |
| `POST /api/plaid/create-link-token/` | Create Plaid Link token (supports OAuth redirect_uri) |
| `POST /api/plaid/exchange-public-token/` | Exchange token after Plaid Link success |
| `POST /api/plaid/sync-transactions/` | Manually trigger Plaid transaction sync |
| `POST /api/plaid/webhook/` | Plaid webhook handler (JWT-verified) |
| `GET /api/insights/` | AI-generated spending insight for a month |

## Plaid Integration

- **Environment:** Production (`PLAID_ENV=production`). Apple Card (Goldman Sachs) and other OAuth banks require production — they don't work in development.
- **OAuth flow:** Goldman Sachs, Chase, and others redirect out of the app during linking. `PlaidLink.tsx` handles this:
  - Accepts `receivedRedirectUri?: string` prop
  - Passes it to `usePlaidLink` and auto-opens on OAuth return
  - `page.tsx` detects `oauth_state_id` in the URL after login, captures `window.location.href` as `receivedRedirectUri`, clears the param from the address bar
- **Redirect URI:** `https://project-7r7p0.vercel.app` — already registered in Plaid Dashboard.
- **Categorization:** Plaid transactions are auto-categorized via `src/lib/category-mapping.ts` which maps Plaid PFC (personal finance category) codes to internal `SpendCategory` names. If the `SpendCategory` table is empty, ALL transactions will have `categoryId = null`.

## SpendCategory (16 default categories)

These must exist in the database for Plaid sync categorization to work. If they're missing:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-categories.ts
```

To re-categorize existing null-categoryId transactions after seeding:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-categories.ts
```

Categories: Housing, Transportation, Entertainment, Utilities, Income, Groceries, Dining, Travel, Shopping, Health & Wellness, Personal Care, Education, Subscriptions, Electronics, Gifts & Donations, Services.

## Deployment

```bash
vercel --prod --yes
```

Uses `DATABASE_URL` (Supabase pooler, port 6543, `?pgbouncer=true`) for runtime and `DIRECT_URL` (port 5432) for migrations. Both must be set in Vercel env vars.

## Running Scripts

All one-off DB scripts live in `scripts/`. Run with:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/<name>.ts
```

Scripts load `.env` via `import 'dotenv/config'` at the top — they run against whichever `DATABASE_URL` is in `.env`.

## iOS Build

```bash
npm run build:mobile   # Next.js static export + capacitor sync
npx cap open ios       # open in Xcode
```

The mobile build moves `src/app/api` out of the way before building (API routes aren't needed in the static export).

## Key Files

| File | What it does |
|---|---|
| `src/lib/plaid-sync-service.ts` | Core Plaid transaction sync logic |
| `src/lib/category-mapping.ts` | Plaid PFC → internal category name map |
| `src/lib/plaid.ts` | Plaid client init |
| `src/lib/auth.ts` | JWT sign/verify, auth middleware |
| `src/lib/encryption.ts` | Plaid access token encryption at rest |
| `src/app/components/PlaidLink.tsx` | Plaid Link button + OAuth redirect handling |
| `src/app/page.tsx` | Main dashboard + auth + OAuth detection |
| `prisma/seed.ts` | Creates demo user + demo transactions (local only) |
| `scripts/seed-categories.ts` | Seeds 16 SpendCategory rows (safe to re-run) |
| `scripts/backfill-categories.ts` | Backfills categoryId on uncategorized transactions |
