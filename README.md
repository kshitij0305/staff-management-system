# VK Group Staff Management System

A standalone, enterprise-grade staff and prospect management portal for VK Group (APN Solar Energy Pvt. Ltd.). Manages a five-level sales hierarchy — **Chairman → National Head → CSM → ASM → CPE** — with role-based dashboards, prospect collection, an interactive org chart and full activity logging.

Built with **Next.js 15 · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma + MongoDB · Framer Motion · Recharts**.

## Quick start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure the database** — create a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (Prisma's MongoDB connector requires a replica set, which Atlas provides out of the box). Copy `.env.example` to `.env` and set:

   ```env
   DATABASE_URL="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/vk_staff?retryWrites=true&w=majority"
   JWT_SECRET="<openssl rand -base64 32>"
   ```

3. **Push the schema and seed demo data**

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Demo logins (after seeding)

Password for every account: `demo1234`

| Role          | Email                   | What they see                                     |
| ------------- | ----------------------- | ------------------------------------------------- |
| Chairman      | chairman@vkgroup.in     | Company analytics, top performers, full org chart |
| National Head | nationalhead@vkgroup.in | Same company-wide view                            |
| CSM           | csm@vkgroup.in          | Their circle: ASMs + CPEs, team analytics         |
| ASM           | asm@vkgroup.in          | Their CPEs, team leaderboard                      |
| CPE           | cpe@vkgroup.in          | Personal dashboard + prospect submission          |

## Features

- **Auth** — email + password, JWT (jose) in an httpOnly cookie, edge middleware protecting `/dashboard/**` and `/api/**`. No public registration; accounts are created by managers.
- **RBAC** — who-can-create-whom rules (Chairman→anyone, NH→CSM, CSM→ASM, ASM→CPE), subtree-scoped visibility on every query via a materialized `ancestorIds` path (one indexed filter, no recursive traversal).
- **Employees** — create / edit / deactivate / reactivate / **transfer** (re-parents the whole subtree atomically), searchable table, rich profile pages.
- **Prospects** — CPE submission form, table defaulting to the **last 3 days**, search, status + employee filters, date-range picker with presets, server pagination, filtered **CSV export**.
- **Dashboards** — one `/dashboard` route, role-conditional widgets: animated KPI cards, 30-day trend chart, status donut, state bars, ASM/CPE leaderboards, team performance, personal streaks for CPEs.
- **Hierarchy** — custom interactive SVG org chart: pan, wheel-zoom to cursor, expand/collapse per team, animated re-layout, click-through to profiles.
- **Activity** — every mutation logged and shown in a scoped, filterable feed.
- **UI** — light/dark theme, command palette (Ctrl+K), Framer Motion transitions, skeleton loaders, empty states, fully responsive.

## Scripts

| Command             | What it does                  |
| ------------------- | ----------------------------- |
| `npm run dev`       | Dev server (Turbopack)        |
| `npm run build`     | Production build              |
| `npm run db:push`   | Push Prisma schema to MongoDB |
| `npm run db:seed`   | Wipe + seed demo company      |
| `npm run typecheck` | TypeScript check              |

## Architecture

Feature-based layout: routes in `src/app/` are thin; domain code lives in `src/features/<feature>/` (components, schemas, queries). Shared primitives in `src/components/`, cross-cutting libs in `src/lib/` (`auth.ts`, `rbac.ts`, `prisma.ts`).

```
src/
├── app/                # routes (pages + API) only
├── features/
│   ├── auth/           # login form
│   ├── employees/      # table, dialogs, schemas
│   ├── prospects/      # table, form, query builder
│   ├── dashboard/      # role dashboards + chart widgets
│   ├── hierarchy/      # org chart (layout algorithm + canvas)
│   └── activity/       # feed + log writer
├── components/         # shell, ui (shadcn), shared widgets
└── lib/                # prisma, auth (JWT), rbac, constants
```
