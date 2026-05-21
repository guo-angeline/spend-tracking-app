# Finance Coach — AI-Powered Spend Tracker

Link your bank. Auto-sync transactions. Get monthly AI roasts of your spending habits.

Finance Coach connects to real bank accounts via Plaid, categorizes every transaction, tracks your budget, and uses OpenAI to deliver brutally honest monthly financial insights.

## Features

- **Bank linking** — Connect accounts via Plaid Link (sandbox + production)
- **Auto-sync** — Real-time transaction sync via Plaid `transactionsSync` API
- **Encrypted tokens** — AES-256-GCM encryption for Plaid access tokens at rest
- **Smart refund netting** — Refunds are matched to original expenses and netted out
- **Category mapping** — Plaid `personal_finance_category` mapped to internal categories
- **Monthly overview** — Budget tracking ($4,500/month default), category distribution charts, income vs. spending bar charts
- **AI Monthly Roast** — OpenAI-powered blunt financial insights, cached in DB
- **Manual entry** — Add transactions by hand when needed
- **User auth** — Simple email/password authentication
- **Account deletion** — Full data removal on request
- **iOS app** — Capacitor-wrapped mobile build

## Tech Stack

- **Framework:** Next.js 16 + React 19
- **Database:** Prisma + SQLite
- **Banking:** Plaid API
- **AI:** OpenAI API
- **Charts:** Recharts
- **Styling:** Tailwind CSS 4
- **Mobile:** Capacitor (iOS)
- **Icons:** Lucide

## Getting Started

### Prerequisites

- Node.js 18+
- Plaid account (sandbox works for testing)
- OpenAI API key

### Environment Variables

```env
DATABASE_URL=                   # Prisma SQLite URL (e.g., file:./dev.db)
PLAID_CLIENT_ID=               # Plaid client ID
PLAID_SECRET=                  # Plaid secret
PLAID_ENV=                     # sandbox | development | production
OPENAI_API_KEY=                # OpenAI API key
ENCRYPTION_KEY=                # 32-byte hex key for AES-256-GCM token encryption
```

### Install & Run

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### iOS Build

```bash
npm run build:mobile    # Static export + Capacitor sync
npm run cap:open        # Open in Xcode
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Main dashboard
│   ├── components/                       # 21 components
│   │   ├── PlaidLink.tsx                 # Bank account linking
│   │   ├── InsightBox.tsx               # AI roast display
│   │   ├── TransactionModal.tsx         # Add/edit transactions
│   │   ├── MonthlyFinancialsChart.tsx   # Income vs. spending
│   │   ├── CategoryDistributionChart.tsx # Category breakdown
│   │   ├── SummaryCard.tsx              # Budget overview cards
│   │   ├── MonthSelector.tsx            # Month navigation
│   │   └── ProfileDropdown.tsx          # User menu
│   └── api/                              # 11 API routes
│       ├── auth/                         # Login / register
│       ├── transactions/                 # CRUD + sync
│       ├── categories/                   # Category mapping
│       ├── plaid/                        # Exchange, sync, webhook
│       ├── insights/                     # AI roast generation
│       └── user/                         # Account deletion
├── lib/
│   ├── plaid.ts                         # Plaid client config
│   ├── prisma.ts                        # Prisma client singleton
│   ├── encryption.ts                    # AES-256-GCM helpers
│   ├── plaid-sync-service.ts            # Transaction sync logic
│   └── category-mapping.ts             # Plaid → internal categories
├── prisma/
│   └── schema.prisma                    # 6 models: User, BankItem, Account, SpendCategory, Transaction, Insight
├── scripts/                              # 30+ debug / cleanup utilities
└── ios/                                  # Capacitor iOS project
```

## License

MIT
