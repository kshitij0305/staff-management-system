<div align="center">

# ☀️ VK Group — Staff Management System

**An enterprise-grade staff & prospect management portal for a field sales force.**

Five-level hierarchy · role-based dashboards · prospect tracking · interactive org chart — built as a standalone SaaS-style app.

<br />

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com/)

[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Framer Motion](https://img.shields.io/badge/Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![JWT](https://img.shields.io/badge/JWT_(jose)-D63AFF?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://github.com/panva/jose)
[![Recharts](https://img.shields.io/badge/Recharts-F59E0B?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://recharts.org/)

</div>

---

## ✨ Features

- 🔐 **Authentication** — email + password, JWT (jose) in an httpOnly cookie, optional 30-day *remember me*. No public registration — accounts are created by managers.
- 🏢 **5-level hierarchy** — `Owner → National Head → CSM → ASM → CPE`, with who-can-create-whom rules enforced server-side.
- 🛡️ **RBAC scoping** — every query is filtered to the viewer's subtree via a **materialized ancestor path** (one indexed filter, no recursive traversal).
- 👥 **Employee management** — create · edit · deactivate/reactivate · **transfer** (re-parents the entire sub-team atomically) · rich profile pages with stats.
- 📋 **Prospect management** — field-visit records with a **last-3-days default view**, debounced search, status & employee filters, date-range presets, server pagination and **CSV export**.
- 📊 **Role-based dashboards** — one `/dashboard` route, different widgets per role: animated KPI cards, 30-day trend chart, status donut, leaderboards, personal streaks for CPEs.
- 🌳 **Interactive org chart** — hand-built SVG: drag to pan, wheel-zoom to cursor, expand/collapse per team, spring-animated re-layout, click-through to profiles.
- 📝 **Activity log** — every mutation recorded; scoped, filterable feed.
- 🎨 **Polished UI** — light/dark mode, **Ctrl + K command palette**, Framer Motion transitions, skeleton loaders, custom SVG empty states, fully responsive.

---

## 🛠️ Tech Stack

| Layer | Tools |
| :-- | :-- |
| **Framework** | Next.js 15 (App Router) · React 19 · TypeScript |
| **Styling** | Tailwind CSS v4 · shadcn/ui (radix-nova) · Framer Motion |
| **Data** | MongoDB Atlas · Prisma ORM |
| **Auth** | jose (JWT) · bcryptjs |
| **Viz** | Recharts · custom SVG org chart |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 20+**
- A **MongoDB Atlas** cluster (Prisma's MongoDB connector needs a replica set — the free tier works)

### 1. Clone & install
```bash
git clone https://github.com/kshitij0305/staff-management-system.git
cd staff-management-system
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and fill in:
```env
# MongoDB Atlas (Connect → Drivers), keep the /vk_staff database name
DATABASE_URL="mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/vk_staff?retryWrites=true&w=majority"

# Sign session JWTs — generate: openssl rand -base64 32
JWT_SECRET="a-long-random-string"
```

### 3. Set up the database
```bash
npm run db:push    # sync schema + indexes
npm run db:seed    # demo company: ~45 employees, ~700 prospects
```

### 4. Run
```bash
npm run dev
```
Open **http://localhost:3000** and sign in.

---

## 🔑 Demo Logins

Every seeded account uses the password `demo1234`:

| Role | Email | Sees |
| :-- | :-- | :-- |
| Owner | `owner@vkgroup.in` | Whole company, all analytics |
| National Head | `nationalhead@vkgroup.in` | Company-wide view |
| CSM | `csm@vkgroup.in` | Their circle (ASMs + CPEs) |
| ASM | `asm@vkgroup.in` | Their CPEs + team leaderboard |
| CPE | `cpe@vkgroup.in` | Personal dashboard + prospect entry |

> 💡 Try **Ctrl + K** for the command palette, the theme toggle, and dragging/zooming the org chart.

---

## 📜 Scripts

| Command | Description |
| :-- | :-- |
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run db:push` | Push Prisma schema to MongoDB |
| `npm run db:seed` | Wipe + seed the demo company |

---

## 🗂️ Project Structure

```
src/
├── app/                 # routes (pages + API) only
│   ├── login/           #   sign-in
│   ├── dashboard/       #   portal pages (employees, prospects, hierarchy, activity)
│   └── api/             #   auth · employees · prospects · activity
├── features/            # feature modules (components + schemas + queries)
│   ├── employees/  prospects/  dashboard/
│   ├── hierarchy/  activity/   auth/
├── components/          # shell (sidebar/topbar/palette) · ui (shadcn) · widgets
├── lib/                 # auth (JWT) · rbac · prisma · constants · rate-limit
└── middleware.ts        # route protection
prisma/schema.prisma     # User · Prospect · ActivityLog
scripts/seed.ts          # deterministic demo data
```

---

## 🔒 Security

- Sessions are signed JWTs in **httpOnly, SameSite cookies** (`Secure` in production)
- **Brute-force protection** — per-IP and per-account login rate limits with `Retry-After`
- **No user enumeration** — identical message *and timing* for unknown email vs wrong password
- **CSRF** — SameSite cookies + Origin checks on all mutations
- Security headers — CSP · `X-Frame-Options: DENY` · HSTS · `nosniff` · Permissions-Policy
- RBAC enforced **server-side** on every query; Zod-validated inputs; Prisma-parameterized queries
- Refuses to boot in production with the dev `JWT_SECRET`

---

<div align="center">

Built for **VK Group** · APN Solar Energy Pvt. Ltd.

</div>
