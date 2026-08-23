# Ramat — Echo Systems AI Assistant

Ramat is the AI customer-service and sales agent for [Echo Systems](https://echosystems.ng).
It answers visitor questions about Echo Systems' services, qualifies sales conversations,
captures leads, and opens support tickets for requests that need a senior executive.

This repository contains:

- **The chat widget** — a floating chat button + panel that replaces the WhatsApp button on echosystems.ng.
- **The backend** — conversation persistence, AI integration, ticket creation, lead capture.
- **The admin dashboard** — login-protected views for conversations, tickets, leads, and performance reports.
- **An embeddable script** — drop a single `<script>` tag on any page to load Ramat.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Drizzle ORM**, and
**Vercel Postgres (Neon)**. AI responses are powered by **Longcat**.

---

## Quick Start

### Prerequisites

- Node.js 18+
- A Vercel account (for deployment + Vercel Postgres)
- A Longcat API endpoint + key

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the values (see [Environment Variables](#environment-variables) below).

### 3. Set up the database

Push the schema to your Vercel Postgres database:

```bash
npm run db:push
```

This creates the tables for conversations, messages, tickets, leads, and activity logs.

### 4. Set up admin access

Admin passwords are stored as bcrypt hashes in `ADMIN_PASSWORD_HASHES`. Generate a hash:

```bash
node -e "const b=require('bcryptjs'); b.hash('YOUR_PASSWORD',10).then(h=>console.log(h))"
```

Then set in `.env.local`:

```
ADMIN_EMAILS="admin@echosystems.ng"
ADMIN_PASSWORD_HASHES='{"admin@echosystems.ng":"<the-hash>"}'
```

### 5. Run locally

```bash
npm run dev
```

- Landing page: http://localhost:3000
- Full-page chat: http://localhost:3000/chat
- Admin dashboard: http://localhost:3000/admin

---

## Project Structure

```
.
├── public/
│   └── embed.js              # Embeddable widget (drop-in script)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/         # POST  /api/chat       (streamed AI response)
│   │   │   ├── tickets/      # POST  /api/tickets    (create ticket)
│   │   │   ├── leads/        # POST  /api/leads      (create lead)
│   │   │   └── admin/        # stats, conversations, session, login
│   │   ├── admin/            # Dashboard (login-protected)
│   │   ├── chat/             # Full-page chat view
│   │   ├── page.tsx          # Landing page + embed instructions
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── RamatChat.tsx     # Floating widget React component
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── client.ts     # Longcat streaming client
│   │   │   ├── index.ts      # Ramat AI runtime + system prompt
│   │   │   └── knowledge.ts  # Echo Systems services knowledge base
│   │   ├── db/
│   │   │   ├── index.ts      # Drizzle + Neon client
│   │   │   ├── schema.ts     # Tables: conversations, messages, tickets, leads, logs
│   │   │   └── script.ts     # One-off script helper
│   │   ├── auth.ts           # Admin auth helpers
│   │   └── utils.ts          # Shared utilities
│   └── middleware.ts         # Admin route guard
├── drizzle.config.ts
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## Key Features

### Chat widget (`/api/chat`)
- Streaming SSE responses from Longcat
- Automatic conversation creation / resumption
- Full message persistence with token usage + latency tracking
- Built-in escalation detection (offers ticket creation)
- Inline lead capture when escalation happens

### Ticket creation (`/api/tickets`)
- Creates tickets tied to a conversation
- Auto-generates human-friendly ticket numbers (`ECHO-2026-XXXXX`)
- Priority + status tracking

### Lead capture (`/api/leads`)
- Captures visitor contact details + service interest
- Sales pipeline with statuses: new → contacted → qualified → proposal → won/lost

### Admin dashboard (`/admin`)
- Login-protected (email + bcrypt password, session cookie)
- Overview with KPIs: conversations, messages, leads, tickets, escalation rate, avg response time
- 30-day conversation trend chart
- Conversation browser with full message viewer
- Ticket manager
- Lead pipeline manager
- Reports: response quality, conversion funnel, ticket/lead breakdowns

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Ramat chatbot"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Create the Vercel project

- Import the repo at [vercel.com/new](https://vercel.com/new).
- Framework preset: **Next.js**.
- Build command: `next build` (default). Output: default.

### 3. Add Vercel Postgres

- In the Vercel project dashboard → **Storage** → **Create Database** → **Postgres** (Neon).
- Connect it to the project. This automatically injects `DATABASE_URL`.

### 4. Set environment variables

In the Vercel dashboard → **Settings** → **Environment Variables**, add all variables
from `.env.example` (set `NEXT_PUBLIC_APP_URL` to your real deployment URL).

### 5. Deploy

Push to main — Vercel builds and deploys automatically.

### 6. Run the database push

Once the database exists, push the schema. Locally (with `DATABASE_URL` pointed at your
Vercel Postgres):

```bash
npm run db:push
```

Or use `npx drizzle-kit push` with the production connection string.

---

## Embedding on echosystems.ng

Replace the current WhatsApp chat button with this single snippet, placed just before
the closing `</body>` tag:

```html
<script
  src="https://ramat.echosystems.ng/embed.js"
  data-api="https://ramat.echosystems.ng"
  async
></script>
```

Optional `data-*` attributes:

| Attribute        | Purpose                                   |
|------------------|-------------------------------------------|
| `data-api`       | Base URL of the Ramat deployment          |
| `data-title`     | Chat panel title (default: Ramat)         |
| `data-greeting`  | Custom first message                      |
| `data-name`      | Pre-fill visitor name                     |
| `data-email`     | Pre-fill visitor email                    |
| `data-phone`     | Pre-fill visitor phone                    |

The `embed.js` script is a self-contained vanilla-JS widget — no framework needed on the host site.

---

## Environment Variables

| Variable                  | Required | Description |
|---------------------------|----------|-------------|
| `DATABASE_URL`            | Yes      | Vercel Postgres / Neon connection string |
| `LONGCAT_BASE_URL`        | Yes      | Longcat API base URL |
| `LONGCAT_API_KEY`         | Yes      | Longcat API key |
| `LONGCAT_MODEL`           | No       | Model id (default: `longcat-2.0`) |
| `ADMIN_EMAILS`            | Yes      | Comma-separated admin emails |
| `ADMIN_PASSWORD_HASHES`   | Yes      | JSON map of email → bcrypt hash |
| `AUTH_SECRET`             | Yes      | Random secret for signing session cookies |
| `NEXT_PUBLIC_APP_URL`     | Yes      | Public URL of this deployment |
| `NEXT_PUBLIC_SITE_URL`    | No       | Echo Systems website URL |

---

## Customizing the Knowledge Base

Ramat's knowledge about Echo Systems lives in `src/lib/ai/knowledge.ts`:

- `COMPANY_INFO` — company description, approach, values, process
- `SERVICES` — array of services with features, deliverables, timelines
- `SYSTEM_PROMPT` — Ramat's persona, rules, and ticket trigger phrases

Edit those, redeploy, and Ramat immediately reflects the new information — no training or
fine-tuning required.

---

## Roadmap / Ideas

- Email notifications when a ticket or lead is created
- Real-time executive assignment + SLA tracking
- Conversation export (CSV / PDF)
- Multi-language support
- Analytics: top questions, unanswered queries, CSAT

---

Built for [Echo Systems](https://echosystems.ng).
