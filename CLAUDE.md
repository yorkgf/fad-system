# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

- **Local dev**: `cd backend && npm run dev` + `cd frontend && npm run dev`
- **Build for deploy**: `cd frontend && npm run build:prod`
- **Add record type**: Update both `backend/src/utils/constants.js` AND `frontend/src/stores/common.js`
- **Add new route**: Update `backend/src/index.js`, `deploy-package/src/index.js`, AND `deploy-package/index.js` (3 files)
- **Deploy backend**: Copy `backend/src/` to `deploy-package/src/`, upload to SCF
- **Build student portal**: `cd student-pages && npm run build` (or `build:prod` for minified)
- **Student portal dev**: `cd student-pages && npm run dev`
- **Meeting arrangement parent portal**: Static HTML in `meeting arrangement/pages/` — no build step, open directly or deploy to EdgeOne Pages

## Project Overview

FAD (学生纪律与奖励管理系统) - Student discipline and reward management system built with Vue 3 + Express + MongoDB, deployed on Tencent Cloud SCF (Serverless) + EdgeOne Pages.

**Integrated Systems:**
- **FAD Core**: Student discipline/reward management (GHA database)
- **Meeting Arrangement (日程管理)**: Parent-teacher conference booking system (GHS database) - Teacher portal integrated into FAD
- **Parent Portal**: Standalone parent-facing booking interface in `meeting arrangement/` folder — has its own SCF backend (`CFunction/scf_index.js`), static HTML pages (`pages/`), and separate `serverless.yml`. Not part of main FAD build. See `meeting arrangement/CLAUDE.md` for details.
- **Student Portal (公开展示站)**: Standalone Vue app in `student-pages/` folder — competition calendar, best-class/dorm rankings, university info (CDS data), essay guides, online courses, knowledge base. Deployed to separate EdgeOne Pages site. Public routes (`/public-*`) need no auth; other content requires access-code gate (IP-based + code verification, not JWT). See `student-pages/CLAUDE.md` for full architecture.

## Development Commands

### Frontend (in `frontend/`)
```bash
npm install        # Install dependencies
npm run dev        # Dev server on http://localhost:3000
npm run build      # Production build
npm run build:prod # Optimized production build (minified, no source maps)
npm run preview    # Preview production build locally
```

### Backend (in `backend/`)
```bash
npm install        # Install dependencies
npm run dev        # Dev server on http://localhost:8080 (with --watch)
npm run start      # Production start (no watch)
npm run deploy     # Deploy to Tencent SCF via serverless framework
npm run logs       # View SCF logs (tail)
```

### Meeting Arrangement (in `meeting arrangement/`)
Standalone parent-facing booking system with its own SCF backend (separate from main FAD backend):
- **Parent pages**: Static HTML in `pages/` (index.html, parent_dashboard.html) — no build step, deploy directly
- **Backend**: `CFunction/scf_index.js` — parent-only API server, deployed as separate SCF function via its own `serverless.yml`
- **Database**: Uses GHS database (shared with FAD's schedule module)
- See `meeting arrangement/CLAUDE.md` and `meeting arrangement/DEPLOY.md` for deployment details

### Local Development Setup
1. Backend: `cd backend && cp .env.example .env` (configure env vars), then `npm install && npm run dev`
2. Frontend: `cd frontend && npm install && npm run dev`

**No test framework or linting/formatting tools are configured.** There are no unit tests, no ESLint, no Prettier. Ad-hoc validation scripts exist in `backend/` root for manual testing and data migration:
- `test-*.js` - Manual API/feature testing scripts
- `check-*.js` - Data validation and consistency checks
- `migrate-*.js` - Database migration utilities
- `fix-*.js` - One-off data repair scripts

**Note**: Root `package.json` exists but is not used for workspace management. Each subproject (`frontend/`, `backend/`, `student-pages/`, `meeting arrangement/`) manages its own dependencies independently.

### Dev Proxy
Frontend dev server proxies `/api` to `http://localhost:8080` by default (configured in `frontend/vite.config.js`). To proxy to the production SCF backend instead, comment out the localhost target and uncomment the SCF URL in the proxy config.

## Architecture

### Tech Stack
- **Frontend**: Vue 3 (Composition API) + Element Plus + Pinia + Vue Router + Axios + Vite (ES Modules) + pdf-lib (client-side PDF generation for FAD notices and teaching tickets)
- **Backend**: Express + MongoDB (native driver, not Mongoose) + JWT + serverless-http (CommonJS)
- **Deployment**: Tencent SCF (backend) + EdgeOne Pages (frontend)

### API Route Paths (registered in `backend/src/index.js`)
| Path Prefix | Router File | Domain |
|-------------|------------|--------|
| `/api/auth` | `auth.js` | Login, logout, user info |
| `/api/teachers` | `auth.js` | Teacher management (shared router) |
| `/api/students` | `students.js` | Student queries |
| `/api/classes` | `students.js` (classesRouter) | Class queries (sub-router) |
| `/api/records` | `records.js` | Record CRUD, withdrawal, accumulation |
| `/api/fad-records` | `fad.js` | FAD queries, execution, delivery |
| `/api/reward-records` | `reward.js` | Reward operations |
| `/api/room-praise` | `room.js` | Dorm praise/warning (shared router) |
| `/api/room-warning` | `room.js` | Dorm praise/warning (shared router) |
| `/api/schedule` | `schedule.js` | Meeting scheduling (GHS) |
| `/api/competition` | `competition.js` | Competition calendar CRUD |
| `/api` | `other.js` | Elec violations, phone lists, tickets |
| `/api/health` | inline | Health check endpoint |

### User Groups & Permissions
Six user groups defined in `backend/src/utils/userGroups.js`:

| Group | Role | Access Level |
|-------|------|-------------|
| `S` | System/Admin | Full access: all record types, user management, all statistics |
| `A` | Admin | School/class stats, room management, data query, suspension management |
| `B` | Admin B | FAD execution, electronics/phone violations, class stats (if 班主任) |
| `T` | Teacher | Same as B |
| `F` | Faculty | Limited: only `group: 'F'` record types, schedule features, class stats only if 班主任 |
| `C` | Cleaning | Most limited: basic record insertion and password change only, no schedule access |

See `frontend/src/router/index.js` for the complete route permission matrix.

**Notable permission detail**: Admin A (`'A'`) is excluded from `COMPETITION_MANAGE_GROUPS` — all non-C groups except A can manage competitions. This is intentional: A has school-level admin focus, while S/B/T/F handle competition CRUD.

### Key Architectural Patterns
- **Unified record insertion**: `POST /api/records` is a single endpoint that dispatches to different MongoDB collections based on the `recordType` field in the request body (mapped via `RECORD_TYPE_TO_COLLECTION` in `constants.js`)
- **Record accumulation**: Records accumulate per `ACCUMULATE_RULES` in `constants.js`, auto-triggering FAD/Reward creation at thresholds (see "Core Business Rules" for full table)
- **FAD source tracking**: Every FAD has a `FAD来源类型` field — four source types: `dorm` (寝室), `teach` (教学), `elec` (电子产品), `other` (其他) — for analytics
- **Reward offset logic**: 2 Rewards offset FAD execution; 3 Rewards offset the entire FAD record. Operates on **academic year** scope (Fall + following Spring), not single semester
- **Duplicate prevention**: `寝室表扬`, `寝室批评`, `寝室垃圾未倒` cannot be duplicated for same student on same day
- **Dual database**: GHA (main FAD data) + GHS (meeting arrangement); see `db.js` for `getCollection()` vs `getGHSCollection()`
- **Teacher profile sync**: GHS teacher profiles auto-created from GHA data when accessing schedule features
- **Frontend API mirroring**: `frontend/src/api/` files mirror backend route files 1:1 (auth.js, records.js, fad.js, reward.js, room.js, students.js, other.js, schedule.js, competition.js), with `request.js` as the shared Axios instance

### Key Files for Business Logic
- `backend/src/utils/constants.js` - Accumulation rules, record type→collection mappings, FAD source types, threshold constants, `DB_FIELDS` for standardized field names
- `backend/src/utils/userGroups.js` - User group definitions and permission helper functions
- `backend/src/utils/pagination.js` - Shared pagination helper for paginated queries
- `backend/src/routes/records.js` - Core record insertion with accumulation, duplicate prevention, reward offset logic (~1100 lines, largest route file)
- `frontend/src/stores/common.js` - Record type definitions (must stay in sync with backend), semester utilities
- `frontend/src/router/index.js` - Route permission matrix by user group
- `frontend/src/api/request.js` - Axios instance with auth interceptor and error handling (401→auto logout)
- `frontend/src/utils/userGroups.js` - Mirror of backend's `userGroups.js` (used by router for client-side permission checks)

### Client-Side PDF Generation
`pdf-lib` + `@pdf-lib/fontkit` generate PDF documents in the browser (no server-side rendering). Used in:
- `FADDeliver.vue` - FAD notice slips (`fad-form.pdf` template)
- `TeachingTickets.vue` - Teaching tickets (`reward-template.pdf` template)
- `PraiseReward.vue` - Praise/reward certificates (`reward-template.pdf` template)

PDF templates in `public/`: `fad-form.pdf` and `reward-template.pdf` — loaded at runtime, filled with student/record data.

### AI Navigation Files

**Note**: AGENTS.md files were generated 2026-01-26 and have stale line counts and directory references. Trust the code, not the AGENTS.md counts.

- `AGENTS.md` (root) - Top-level project map with code symbols and conventions
- `backend/src/AGENTS.md` - Backend source structure overview
- `backend/src/routes/AGENTS.md` - Detailed backend route documentation
- `frontend/AGENTS.md` - Frontend-specific guidance
- `frontend/src/AGENTS.md` - Frontend source structure
- `frontend/src/views/AGENTS.md` - Frontend view component documentation
- `frontend/src/api/AGENTS.md` - API wrapper documentation
- `meeting arrangement/CLAUDE.md` - Parent portal architecture and deployment
- `student-pages/CLAUDE.md` - Student portal architecture, auth, data files, and deployment
- `deploy-package/CLAUDE.md` - Deploy package guidance
- `deploy-package/DEPLOY.md` - SCF deployment instructions for the backend package
- `docs/user-guides/` - Per-role user guides (系统管理员, 班主任, 任课老师, Foreign Faculty, 保洁阿姨, etc.)
- `docs/plans/` - Implementation plans (i18n, competition calendar) for historical context

**DB_FIELDS Usage**: Use constants from `DB_FIELDS` (e.g., `DB_FIELDS.STUDENT`, `DB_FIELDS.SEMESTER`, `DB_FIELDS.WITHDRAWN`) instead of hardcoding Chinese field names in queries to ensure consistency.

## Database

- MongoDB native driver (not Mongoose) - queries use MongoDB aggregation syntax directly
- Main database: `GHA` via `MONGO_URI`; secondary: `GHS` via `GHS_MONGO_URI`
- Collections follow `{Type}_Records` pattern (e.g., `FAD_Records`, `Late_Records`)
- System collections: `Teachers`, `Students`, `All_Classes`
- Special collections without `_Records` suffix: `Teaching_FAD_Ticket`, `Teaching_Reward_Ticket`
- Both phone late types (`21:30后` and `22:00后`) share `Phone_Late_Records` collection

## Core Business Rules

### Accumulation Rules (constants.js)
| Record Type | Threshold | Result |
|------------|-----------|--------|
| 早点名迟到 | 2 | FAD (source: other) |
| 寝室迟出 | 2 | FAD (source: dorm) |
| 未按规定返校 | 2 | FAD (source: dorm) |
| 擅自进入会议室或接待室 | 2 | FAD (source: other) |
| 寝室批评 | 5 | FAD (source: dorm) |
| 寝室垃圾未倒 | 2 | 寝室批评 (chains to FAD via 寝室批评 rule) |
| Teaching FAD Ticket | 3 | FAD (source: teach) |
| 寝室表扬 | 10 | Reward hint (frontend notification only) |
| Teaching Reward Ticket | 6 | Reward hint (frontend notification only) |

### Direct FAD Triggers (no accumulation)
- `上网课违规使用电子产品` → immediate FAD (source: elec)
- `22:00后交还手机` → immediate FAD (source: dorm)
- `21:30后交还手机(22:00前)` → no FAD (same collection, different behavior)

### Reward Offset Rules (records.js:handleRewardOffset)
- **Annual scope**: Operates across all semesters in an academic year, not limited to single semester
- 2 Rewards → offset FAD execution (`是否已执行或冲抵 = true`)
- 3 Rewards → offset FAD record (`是否已冲销记录 = true`)
- `priorityOffset` flag controls whether to prioritize offsetting execution vs record
- Uses the **latest FAD** (sorted by `记录日期` descending)

### FAD Thresholds (constants.js:THRESHOLDS)
- 3+ FAD → warning
- 6+ FAD → suspension recommendation
- 9+ FAD → dismissal recommendation
- These operate on **academic year** scope (Fall + following Spring)

### Semester System
- Two semesters: `春季(Spring)` (Feb-Jul) and `秋季(Fall)` (Sep-Jan)
- Auto-detected by `getCurrentSemester()` in `common.js`
- **Academic Year**: Fall semester + following Spring (e.g., 2024-2025学年 = 2024年秋季 + 2025年春季)
- Query parameter `semester=学年` triggers academic year scope aggregation

### Record Withdrawal
- Cascade deletes any generated FAD/warnings from accumulated records
- Reward records cannot be withdrawn
- FAD/Reward with `是否已发放=true` or teacher starting with `已发:` cannot be withdrawn

## Critical Sync Points

Changes to record types require updates in **both**:
1. `backend/src/utils/constants.js` (`RECORD_TYPE_TO_COLLECTION`, optionally `ACCUMULATE_RULES`, `RECORD_TO_FAD_SOURCE`)
2. `frontend/src/stores/common.js` (`allRecordTypes`)

The `group` field in `allRecordTypes` controls which user groups can create each record type:
- Group `F` users only see record types with `group: 'F'`
- Group `S` users see all record types
- FAD, Reward, and `上网课违规使用电子产品` are `group: 'S'` (admin only)

## Anti-Patterns

- Never allow withdrawal of delivered FAD/Reward (`是否已发放=true`)
- Never directly modify `冲销记录Reward ID` arrays - must go through reward withdrawal logic
- Never bypass accumulation rules to directly insert FAD for accumulation-based record types
- Group `S` records can only be withdrawn by admins

## Environment Variables (Backend)

See `backend/.env.example` for all variables. Key ones:
- `MONGO_URI` / `DB_NAME` - Main GHA database connection
- `GHS_MONGO_URI` / `GHS_DB_NAME` - Meeting arrangement GHS database (optional)
- `JWT_SECRET` / `JWT_EXPIRES_IN` (default: `7d`) - Authentication
- `JWT_SECRET_OLD` - Previous JWT secret for dual-key migration (see `auth.js`). During migration, tokens signed with the old key are still accepted. Remove after all old tokens expire.
- `BREVO_API_KEY` / `SENDER_EMAIL` / `SENDER_NAME` - Email notifications
- `PORT` (default: `8080`) / `NODE_ENV`

## Deployment

### Backend (Tencent SCF)
- **Manual upload**: Use `deploy-package/` folder (pre-bundled with node_modules, ~13MB) for SCF upload
- **Serverless Framework**: `npm run deploy` (requires `serverless.yml`)
- SCF config: Nodejs18.15, ap-guangzhou, 256MB memory, 30s timeout

### Frontend (EdgeOne Pages)
```bash
cd frontend && npm run build:prod
# Deploy dist/ folder (~1.8MB) to EdgeOne Pages
```
- Production API URL configured in `frontend/.env.production` as `VITE_API_BASE_URL`

### Student Portal (EdgeOne Pages)
```bash
cd student-pages && npm run build
# Deploy dist/ folder to a separate EdgeOne Pages site
```
- Production API URL in `student-pages/.env.production`
- i18n files at `student-pages/src/i18n/{zh-CN,en}.json` — must be kept in sync with `frontend/src/i18n/locales/` for shared keys

### Deploy Package Rebuild
After modifying backend source: copy `backend/src/` to `deploy-package/src/` and reinstall production dependencies in `deploy-package/`.

## Internationalization (i18n)

The frontend supports bilingual UI (Chinese/English) via `vue-i18n` v9. Configuration in `frontend/src/i18n/index.js`, translations in `frontend/src/i18n/locales/{zh-CN,en}.json`.

### i18n Patterns
- **Record types** use `labelKey` in `stores/common.js` (e.g., `'recordTypes.morningLate'`) instead of hardcoded Chinese labels; computed properties resolve these to translated strings
- **Route titles** use `meta.titleKey` instead of `meta.title`
- Translation keys are organized by section: `common`, `nav`, `login`, `records`, `recordTypes`, `validation`, `messages`, `fadSource`, etc.
- Fallback locale is `zh-CN` — missing English keys fall back to Chinese
- Language switch reloads the page (`window.location.reload()`) to fully apply Element Plus locale changes

### Adding Translations
When adding new UI text, add keys to **both** `zh-CN.json` and `en.json`. Use `$t('section.key')` in templates or `t('section.key')` from `useI18n()` in script setup.

## Competition Calendar

`frontend/src/views/competition/CompetitionCalendar.vue` (FAD main) and `student-pages/src/CompetitionCalendar.vue` (standalone) implement the same calendar UI (month/week/year views + sidebar). **When modifying one calendar file, apply the same changes to the other to keep them in sync.**

The standalone `student-pages/` app uses public API endpoints (`/public-events`, `/public-best-dorm`, `/public-best-class`) that require no JWT. See `student-pages/CLAUDE.md` for full architecture.

## Gotchas

- `deploy-package/` is a pre-bundled SCF package - source changes require manual rebuild (see above)
- `deploy-package/index.js` (root) is the **actual SCF entry point** (via `scf_bootstrap`), separate from `deploy-package/src/index.js` (which is a copy of `backend/src/index.js`). When adding new routes, update **three files**: `backend/src/index.js`, `deploy-package/src/index.js`, and `deploy-package/index.js` — the root entry point uses `./src/routes/*` paths and registers routes independently
- `commonStore.semesters` contains objects `{ value, labelKey }`, not plain strings. Use `item.value` for `:key`/`:value` and `$t(item.labelKey)` for `:label` in `<el-option>`
- When creating public-facing standalone sites, add `/public-*` route variants without `authMiddleware` (e.g., `/public-events`, `/public-best-dorm`)
- `student-pages/` has its own access-code auth gate (IP check + access code, not JWT) — only the `/login` route is truly public; all other routes require passing the auth guard. Backend endpoints: `POST /api/verify-student-access`, `GET /api/check-student-access` (in `other.js`, no `authMiddleware`)
- Backend uses `dotenv` in dev mode (`index.js`) but it's not in `backend/package.json` - it relies on a hoisted install or must be installed separately
- Email notifications use Brevo API - `NO_EMAIL_TYPES` in `constants.js` lists excluded record types (`寝室表扬`, `Teaching Reward Ticket`, `Reward`)
- Teacher login data is initialized via the "教职工" page in the "其他" module
- Phone late records (`21:30后` and `22:00后`) share `Phone_Late_Records` collection but have different FAD behavior
- SCF `scf_bootstrap` sets PORT to 9000 (differs from local dev default of 8080)
- Frontend uses `@` alias for `src/` directory (configured in `vite.config.js`)
- JWT tokens have 7-day expiry; Axios interceptor auto-injects `Authorization: Bearer {token}` from Pinia `useUserStore`
- Response interceptor handles 401 (auto logout), 403, 404, 500 with Element Plus messages
- Backend is CommonJS (`require`), frontend is ES Modules (`import`/`export`) - don't mix module syntax when editing
