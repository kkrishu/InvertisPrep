# 🎓 InvertisPrep

> Previous-Year-Question (PYQ) paper management platform for **Invertis University**.
> Students browse, view, and contribute verified question papers; admins/super-admins
> curate and verify content.

A monorepo with a **Next.js** client, an **Express + MongoDB** server, and a
**Kotlin WebView** Android app that wraps the webapp with a Google OAuth deep-link flow.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Features](#features)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [PDF / Cloudinary Storage](#pdf--cloudinary-storage)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [npm Scripts](#npm-scripts)
- [Deployment](#deployment)
- [Android WebView App](#android-webview-app)
- [Roadmap](#roadmap)
- [Known Issues & Security Notes](#known-issues--security-notes)

---

## Overview

InvertisPrep lets students find previous-year question papers organized by
**department → branch → semester → session → exam type**. Students log in with
Google; papers uploaded by students must be **verified by a super-admin** before
they appear publicly. The platform also includes social features (follow/public
profiles) and a content-reporting/moderation workflow.

---

## Tech Stack

### Client (`/client`)
| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) |
| UI | **React 19**, **Tailwind CSS v4**, **shadcn/ui** (Radix primitives), `lucide-react` |
| Auth | **next-auth v4** (Google OAuth) + custom JWT in `localStorage` |
| HTTP | **axios** with request/response interceptors |
| State | React Context (`AuthContext`) — no Redux/Zustand |
| Theming | `next-themes` (dark/light) |
| Notifications | `sonner` toasts |
| Language | **TypeScript** |

### Server (`/server`)
| Layer | Technology |
|---|---|
| Runtime | **Node.js** (ESM, `"type": "module"`) |
| Framework | **Express 5** |
| Database | **MongoDB** via **Mongoose 8** |
| Auth | **jsonwebtoken** (JWT) + **bcryptjs** (admin passwords) + **google-auth-library** (token verification) |
| File storage | **Cloudinary** (raw PDF uploads) + **multer** (multipart parsing) |
| Security | `helmet`, `cors`, `morgan`, `cookie-parser` |
| Language | **JavaScript (ESM)** |

---

## Architecture

```
┌────────────────────────┐        JWT (Authorization: Bearer)         ┌────────────────────────┐
│                        │ ◄─────────────── /api/* ──────────────────► │                        │
│   Next.js Client       │                                            │   Express + MongoDB    │
│   (Vercel)             │                                            │   Server (Render/VPS)  │
│   invertisprepv2       │                                            │                        │
│   .vercel.app          │                                            │   ┌──────────────────┐ │
│                        │     Google idToken  ─── verify ──────────►  │   │ google-auth-lib  │ │
└───────────┬────────────┘                                            │   └──────────────────┘ │
            │                                                         │   ┌──────────────────┐ │
            │ NextAuth (Google OAuth)                                 │   │   Cloudinary     │ │
            ▼                                                         │   │   (PDF storage)  │ │
┌────────────────────────┐                                            │   └──────────────────┘ │
│  Google Identity       │                                            └───────────┬────────────┘
└────────────────────────┘                                                        │
                                                                                  ▼
┌────────────────────────┐  deep link: invertisprep://auth/callback      ┌────────────────────────┐
│   Android WebView App  │ ◄─────────────────────────────────────────►   │   Webapp (same as      │
│   (Kotlin)             │     JWT injected into WebView localStorage    │   client above)        │
└────────────────────────┘                                            └────────────────────────┘
```

The Android app is a thin WebView shell: it loads the webapp, delegates Google login to a Chrome Custom Tab, receives a JWT via deep link, and injects it into the WebView's `localStorage`.

---

## Monorepo Structure

```
InvertisPrep/
├── client/                      # Next.js frontend
│   ├── app/
│   │   ├── (public pages)/      # /, /about, /contact, /our-team, /privacy-policy, …
│   │   ├── login/               # Main login (Google OAuth + admin password + WebView flow)
│   │   ├── auth/signin/         # Mobile sign-in shim
│   │   ├── api/auth/[...nextauth]/route.ts   # NextAuth handler
│   │   ├── pyq/                 # Student PYQ browsing + upload
│   │   │   ├── page.tsx
│   │   │   ├── [departmentId]/page.tsx
│   │   │   └── upload/page.tsx
│   │   ├── resources/syllabus/  # Syllabus PDFs
│   │   ├── profile/[userId]/    # Public profiles
│   │   ├── admin/               # Protected admin area
│   │   │   ├── dashboard/ departments/ branches/ sessions/
│   │   │   ├── upload/ papers/ syllabus/ reports/
│   │   └── quizz0/              # "Coming Soon" placeholder
│   ├── components/              # Navbar, ProtectedRoute, layout/*, ui/* (shadcn)
│   ├── contexts/AuthContext.tsx
│   ├── lib/api.ts               # axios instance + domain API modules
│   ├── types/index.ts           # shared TS types
│   └── public/                  # sitemap.xml, robots.txt, team photos
│
├── server/                      # Express + MongoDB backend
│   └── src/
│       ├── server.js            # bootstrap, middleware, route mounts
│       ├── config/              # database.js, cloudinary.js
│       ├── models/              # User, PYQPaper, Department, Branch, Session, Report, Syllabus
│       ├── controllers/         # business logic per resource
│       ├── routes/              # Express routers per resource
│       ├── middleware/          # auth.js (JWT + role guards), upload.js (multer), errorHandler.js
│       ├── services/            # cloudinaryService.js, googleAuthService.js
│       ├── utils/seedSuperAdmin.js
│       └── types/index.js       # JSDoc typedefs
│
├── guide.md                     # Android WebView integration guide
├── PLAN.txt                     # project planning notes
└── README.md                    # this file
```

> The Kotlin Android app lives in a **separate repo** (`../flutter-app` on the
> author's machine). See [Android WebView App](#android-webview-app).

---

## Features

### ✅ Implemented
- **Google OAuth login** for students (auto-creates account on first login).
- **Email/password login** for admins/super-admins.
- **Role-based access**: `student` | `admin` | `super-admin`.
- **PYQ browsing** by department → branch → semester → session → exam type, with search.
- **Admin PYQ upload** (immediately eligible) and **student upload** (requires verification, rate-limited to **10/day** in IST).
- **Verification workflow** — super-admin verifies student uploads before they go public.
- **Syllabus PDFs** browsable by department/year.
- **Social graph** — follow/unfollow users, public profiles showing their last 10 verified papers.
- **Content reporting & moderation** — report papers for wrong file/quality/metadata; admin triage UI.
- **Analytics** — per-paper view & download counters.
- **Soft deletes** across all entities (`isActive: false`).
- **Dark/light theme**, responsive design, SEO assets (sitemap, robots, webmanifest).

### 🚧 Coming Soon (UI placeholders, no backend yet)
- **Quizzo** — quiz/mock-test platform (`/quizz0`).
- **Leaderboard** (disabled nav button).
- **Student dashboard**, **Academic Progress**, **QC Wallet** (nav links exist but routes are not implemented).

---

## Data Models

All in `server/src/models/`. Key relationships: **Department 1→N Branch**; **PYQPaper** references Department, Branch, Session, and User; **Report** references a paper and a user.

### User
`googleId` · `email` (unique) · `password` (select:false) · `name` · `picture` · `studentId` · `phoneNumber` · `course` · `followers[]` · `following[]` · `role` (`student`|`admin`|`super-admin`) · `lastLogin` · `isActive`

### PYQPaper (core entity)
`title` (auto: `subjectName examType year`) · `subjectCode` · `subjectName` · `departmentId` · `branchId` · `semester` (1–10) · `sessionId` · `examType` (`mid-term`|`end-term`|`sessional`) · **`cloudinaryUrl`** · `cloudinaryPublicId` · `fileName` · `fileSize` · `year` · `uploadedBy` · `views` · `downloads` · `verified` · `isActive`

> ⚠️ `cloudinaryUrl` is currently a **public, unsigned, non-expiring** URL returned to clients. See [PDF / Cloudinary Storage](#pdf--cloudinary-storage).

### Department
`id` (unique slug, e.g. `btech`) · `name` · `displayName` · `icon` · `description` · `isActive`

### Branch
`id` (slug, e.g. `cse`) · `name` · `departmentId` · `semesters[]` · `isActive` · compound-unique `(departmentId, id)`

### Session
`id` (e.g. `2023-2024`) · `name` · `startYear` · `endYear` · `isActive`

### Report
`paperId` · `reportedBy` · `reason` (`wrong_file`|`poor_quality`|`wrong_metadata`|`other`) · `description` · `status` (`pending`|`resolved`|`dismissed`) · compound-unique `(paperId, reportedBy)` (one report per user per paper)

### Syllabus
`name` · `fileName` · `fileSize` · `department` · `year` · `cloudinaryPublicId` · `cloudinaryUrl` · `uploadedBy` · `isActive`

---

## API Reference

Base path: `/api`. Auth legend: 🔓 public · 🔑 JWT required · 👑 admin · 👑👑 super-admin.

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | 🔓 | Email/password login (admins) → JWT + user |
| POST | `/auth/google-login` | 🔓 | Verify Google ID token, upsert student → JWT |
| GET | `/auth/me` | 🔑 | Current user |
| PUT | `/auth/profile` | 🔑 | Update profile (name/studentId/phone/course) |
| POST | `/auth/logout` | 🔓 | Stateless no-op (client clears token) |

### PYQ — `/api/pyq`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/pyq` | 🔓 | Public list (only `verified:true, isActive:true`); filters: department/branch/session/semester/examType/subjectCode/search |
| GET | `/pyq/upload-count` | 🔑 | Today's student upload count + 10/day limit (IST) |
| POST | `/pyq/upload` | 👑 | Admin upload |
| POST | `/pyq/upload-public` | 🔑 | Student upload (10/day IST) |
| GET | `/pyq/all` | 👑 | Paginated admin list |
| POST | `/pyq/:id/download` | 🔓 | Increment download counter |
| POST | `/pyq/:id/view` | 🔓 | Increment view counter |
| PATCH | `/pyq/:id/verify` | 👑👑 | Verify a paper |
| PUT | `/pyq/:id` | 👑 | Update metadata |
| DELETE | `/pyq/:id` | 👑 | Soft-delete + Cloudinary cleanup |

### Other resources
- **Departments** `/api/departments` — list (🔓), CRUD (👑)
- **Branches** `/api/branches` — all (👑)
- **Sessions** `/api/sessions` — list (🔓), CRUD (👑)
- **Syllabus** `/api/syllabus` — list (🔓), upload/delete (👑)
- **Users** `/api/users` — public profile + follow/unfollow (🔑)
- **Reports** `/api/reports` — create (🔑), list/update (👑)
- **Health** `GET /health` (🔓)

---

## Authentication

The app uses **two coexisting mechanisms**, unified under a single JWT.

### Students — Google OAuth (two-tier)
1. Client uses **NextAuth.js** (Google provider, JWT strategy, 7-day session) to get a Google `id_token`.
2. The login page POSTs that `id_token` to `/api/auth/google-login`.
3. Server verifies it with `google-auth-library` against `GOOGLE_CLIENT_ID`; auto-creates a `student` account if new.
4. Server mints the app's own **JWT** (`{ id, email, role }`, signed with `JWT_SECRET`, expires `JWT_EXPIRES_IN`).
5. The NextAuth session is discarded (`signOut`); the app JWT is stored in `localStorage` and sent as `Authorization: Bearer <token>`.

### Admins — email/password
- Compared against `bcryptjs` hashes; only admins/super-admins have passwords. Google users have none.

### Client state
- `AuthContext` hydrates from `localStorage` on mount and re-validates via `/auth/me`.
- The axios response interceptor wipes storage and redirects to `/admin/login` on any `401`.
- `ProtectedRoute` guards `/admin/*` (admin/super-admin only).

### Role guards (server middleware)
`authenticateJWT` → `isAdmin` (admin or super-admin) → `isSuperAdmin` (super-admin only, used for paper verification).

### Super-admin bootstrap
`npm run seed` (`server/src/utils/seedSuperAdmin.js`) creates `superadmin@invertis.edu.in` / `super123`. **Change this password in production.**

---

## PDF / Cloudinary Storage

### Current state ⚠️
PYQ and syllabus PDFs are uploaded to **Cloudinary with `resource_type: 'raw'`** (`server/src/services/cloudinaryService.js`). The stored `secure_url` is a **public, unsigned, non-expiring** URL, and it is **returned verbatim to clients** in the public `/api/pyq` list.

On the client, papers are opened with `window.open(paper.cloudinaryUrl, '_blank')` — relying on the **browser's native PDF viewer**, which always exposes Download/Print buttons.

**Consequences:**
- URLs are freely shareable/leechable forever.
- No access logging per user.
- **PDFs do not render in the Android WebView** — the native WebView has no PDF plugin, so `window.open()` to a `.pdf` shows nothing.

### Planned: protected in-app PDF viewer
The goal: display papers in a custom viewer so they can be read but not casually downloaded, and work inside the Android WebView. Candidate approaches:

| Approach | What it does | Protection | Effort |
|---|---|---|---|
| **A. pdf.js viewer** (`react-pdf`/`pdfjs-dist`) | Render pages to `<canvas>` in our own UI; block right-click/selection/Ctrl+S | Blocks casual download; bytes still reachable via DevTools | Low |
| **B. Authenticated server proxy** `GET /api/pyq/:id/pdf` | Require JWT, stream PDF or return short-lived signed URL; stop leaking `cloudinaryUrl` | Non-shareable URLs, per-user access logs, revocable | Medium |
| **C. Server-side page→image rendering** | Serve only images; no PDF bytes reach client | Strong (screenshot still possible) | Medium-High |
| **D. Per-user watermark** | Stamp viewer's email/name on each page (`pdf-lib` or Cloudinary overlays) | Deters sharing — leaks are traceable | Medium |

**Recommended:** **A + B + D** — pdf.js viewer fed by an authenticated proxy, with per-user watermarks. Works in WebView, removes obvious download buttons, makes URLs non-shareable, and traces leaks.

---

## Environment Variables

### Server (`server/.env`)
| Key | Purpose | Used in |
|---|---|---|
| `PORT` | Express port (default 5000) | `server.js` |
| `NODE_ENV` | `development`/`production` | error stacks, debug |
| `MONGODB_URI` | MongoDB connection string | `config/database.js` |
| `JWT_SECRET` | JWT signing secret | `middleware/auth.js`, `authController.js` |
| `JWT_EXPIRES_IN` | JWT lifetime, e.g. `7d` | `authController.js` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud | `config/cloudinary.js` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `config/cloudinary.js` |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | `config/cloudinary.js` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `googleAuthService.js` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `googleAuthService.js` |
| `CLIENT_URL` | Frontend origin (OAuth redirect + CORS) | `server.js`, `googleAuthService.js` |

### Client (`client/.env`)
| Key | Purpose |
|---|---|
| `NEXTAUTH_URL` | App base URL for NextAuth |
| `NEXT_PUBLIC_API_URL` | Backend base (exposed to browser, e.g. `http://localhost:5000/api`) |
| `NEXTAUTH_SECRET` | NextAuth JWT encryption secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

> 🔒 Do **not** commit real secrets. Both `.env` files are gitignored; provide `.env.example` templates for collaborators.

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- A Google OAuth client ID/secret (with your redirect URIs allowed)

### 1. Server
```bash
cd server
cp .env.example .env      # then fill in real values
npm install
npm run seed              # create the super-admin account
npm run dev               # http://localhost:5000
```

### 2. Client
```bash
cd client
cp .env.example .env      # then fill in (create one from the table above if missing)
npm install
npm run dev               # http://localhost:3000
```

Make sure `NEXT_PUBLIC_API_URL` in `client/.env` points at the server (`http://localhost:5000/api`) and `CLIENT_URL` in `server/.env` allows `http://localhost:3000` in CORS.

---

## npm Scripts

### Client
| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Dev server (Turbopack) on :3000 |
| `build` | `next build` | Production build |
| `start` | `next start` | Run production build |
| `lint` | `eslint` | Lint |

### Server
| Script | Command | Description |
|---|---|---|
| `dev` | `node --watch src/server.js` | Dev with native file-watch |
| `start` | `node src/server.js` | Production start |
| `seed` | `node src/utils/seedSuperAdmin.js` | Seed/refresh super-admin |

---

## Deployment

No deployment config files are committed yet (no `vercel.json`, `Dockerfile`, or CI workflows). Inferred targets:

- **Client** → **Vercel**. The server CORS allow-list explicitly permits `https://invertisprep.vercel.app` and `https://invertisprepv2.vercel.app`. Current production URL: `https://invertisprepv2.vercel.app`.
  - Build command: `npm run build`, output handled by Next.js.
  - Set all [client env vars](#environment-variables) in the Vercel dashboard.
- **Server** → a long-running host (**Render / Railway / VPS**). It is **not** serverless-compatible as-is (long-lived Express process).
  - Start command: `npm run start`.
  - Set all [server env vars](#environment-variables), pointing `CLIENT_URL` at the Vercel deployment.

---

## Android WebView App

A separate **Kotlin** project wraps the webapp in a native `WebView`, with Google login bridged via a deep link because WebViews can't do OAuth directly (separate cookie/localStorage stores from the browser).

### Flow
1. WebView detects an auth-required URL → opens the webapp's `/auth/signin` in a **Chrome Custom Tab**.
2. User signs in with Google; the webapp exchanges the Google `id_token` for the app JWT at `/api/auth/google-login`.
3. The webapp redirects to the deep link: `invertisprep://auth/callback?token=<JWT>&user=<base64-json>`.
4. The app catches the deep link, persists `token` + `user` in `SharedPreferences`, and **injects them into the WebView's `localStorage`** via a JS bridge (the webapp reads auth from `localStorage`, not cookies).
5. On cold start, the app re-injects persisted credentials if the WebView's `localStorage` is missing them.

### Key files (in the Kotlin project)
- `MainActivity.kt` — WebView setup, deep-link handling, localStorage injection bridge, cold-start re-injection.
- `AuthHelper.kt` — Custom Tab launcher + deep-link parser (token takes precedence over `session`).
- `AuthStorage.kt` — `SharedPreferences` wrapper for persisted credentials.
- `CookieSyncHelper.kt` — cookie manager config (legacy; auth now uses localStorage).
- `AndroidManifest.xml` — `invertisprep://` intent-filter.

### Why a JS bridge into localStorage (not cookies)
The webapp authenticates with a JWT stored in `localStorage` (`client/contexts/AuthContext.tsx`), sent as `Authorization: Bearer` on every API call. The browser (Custom Tab) and the WebView have **separate localStorage scopes**, so the JWT must be explicitly injected — there is no cookie to sync.

---

## Roadmap

- [ ] **Protected PDF viewer** (pdf.js + authenticated proxy + watermark) — see [PDF / Cloudinary Storage](#pdf--cloudinary-storage).
- [ ] Quizzo quiz engine backend.
- [ ] Leaderboard.
- [ ] Student dashboard / Academic Progress / QC Wallet routes.
- [ ] Per-user download/view analytics dashboard.
- [ ] Transactional email (verification, reports).

---

## Known Issues & Security Notes

- 🔴 **PDFs are public and downloadable.** Cloudinary raw URLs are unsigned/non-expiring and leaked in API responses. Prioritize the protected viewer.
- 🟠 **Hardcoded super-admin password** in `seedSuperAdmin.js` (`super123`) — change before production.
- 🟠 **`NEXTAUTH_SECRET` / Google credentials** should be rotated and kept out of version control.
- 🟡 **View/download counter endpoints are unauthenticated** (`POST /pyq/:id/view|download`) — counters can be inflated. Add `authenticateJWT` if accurate analytics matter.
- 🟡 **Client TS types** declare `viewCount`/`downloadCount` that the server model does not have (`client/types/index.ts`) — use `views`/`downloads`.
- 🟡 **Dead nav links**: `/dashboard`, `/academic-progress`, `/qc-wallet` are linked in the Navbar but not implemented.

---

*Made with ❤️ by Ahqaf and Team — Invertis University*
