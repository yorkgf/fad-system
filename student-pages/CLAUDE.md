# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Student-pages is a standalone public-facing Vue 3 app deployed to Tencent EdgeOne Pages, separate from the main FAD system. It serves as a student resource portal with competition calendar, rankings, university info, and essay guidance. It has **no Pinia, no auth tokens** — protected routes use a simple access code verified against the FAD backend.

## Commands

```bash
npm run dev          # Dev server on http://localhost:3001
npm run build        # Production build to dist/
npm run build:prod   # Minified production build (terser, no source maps)
npm run preview      # Preview production build
```

No test framework, linter, or formatter is configured.

## Architecture

### Tech Stack
- Vue 3 (Composition API, `<script setup>`) + Vue Router + vue-i18n v9
- Element Plus (UI library)
- Vite (dev server on port 3001, proxies `/api` to `localhost:8080`)
- markdown-it (renders `.md` files from `public/` and `src/data/` at runtime)
- ES Modules throughout (`"type": "module"` in package.json)

### Route Structure (`src/router.js`)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `CompetitionCalendar.vue` | Month/week/year calendar views |
| `/best-dorm` | `BestDormRanking.vue` | Dorm ranking display |
| `/best-class` | `BestClassRanking.vue` | Class ranking display |
| `/universities` | `views/UniversityList.vue` | University cards with CDS stats |
| `/university/:id` | `views/UniversityDetail.vue` | Per-university CDS data (rendered from markdown) |
| `/essay-guide` | `views/EssayGuide.vue` | Essay writing knowledge base |
| `/essay-examples` | `views/EssayExamples.vue` | Essay examples index |
| `/essay-detail/:source/:theme` | `views/EssayDetail.vue` | Individual essay theme with full text |
| `/knowledge/:doc` | `views/KnowledgeBaseViewer.vue` | Generic markdown viewer |
| `/knowledge/:doc/:category` | `views/KnowledgeBaseViewer.vue` | Category-based lesson viewer |
| `/login` | `components/AccessGate.vue` | Access code entry (only public route) |

### Authentication

Simple access-code gate (`src/auth.js`), not JWT:
- User enters a code, verified via `POST /api/verify-student-access`
- On success, stores `{ timestamp }` in `localStorage` key `student-pages-auth`
- Expires after 30 days (client-side check only)
- Router guard redirects unauthenticated users to `/login` (except `meta: { public: true }` routes)
- **IP re-verification**: `checkIPAccess()` runs on every navigation via router guard, calling `GET /api/check-student-access` to prevent access-code-only bypass

### API Endpoints Used

All API calls go to the FAD backend (`VITE_API_BASE_URL` or `/api` proxy in dev). **No JWT required**:

| Endpoint | Method | Used By |
|----------|--------|---------|
| `/api/verify-student-access` | POST | AccessGate (login) |
| `/api/check-student-access` | GET | Router guard (IP re-verification) |
| `/api/competition/public-events` | GET | CompetitionCalendar |
| `/api/room-praise/public-best-dorm` | GET | BestDormRanking |
| `/api/fad-records/public-best-class` | GET | BestClassRanking |

### Data Sources & Loading Patterns

| Pattern | Used By | Example |
|---------|---------|---------|
| **Static JS imports** | UniversityList, EssayGuide, EssayExamples | `schools.js`, `essay_lessons.js`, `essay_examples.js` |
| **`import.meta.glob()` with `?raw`** | UniversityDetail | `../data/university-info/*.md` — compile-time resolved, safe from path injection |
| **Runtime `fetch()`** | EssayDetail, KnowledgeBaseViewer | `/essays/{source}/{theme}.md`, `/knowledge-graph/*.md` |
| **Axios API calls** | CompetitionCalendar, Rankings, Auth | Backend public endpoints |

Key data files:
- `src/data/schools.js` — 30+ universities with tier classification, admission stats, logo refs. Exports `getSchoolsByTier()` and `getSchoolById()`.
- `src/data/essay_lessons.js` — Auto-generated from `Essay_Knowledge_Graph/essay_lessons.json`. Knowledge graph of essay writing principles.
- `src/data/essay_examples.js` — Auto-generated index pointing to markdown files in `public/essays/{source}/{theme}.md`. Sources: IvyLeague, HarvardIndependent, UC, NiuXiaoNiuwen.
- `src/data/university-info/*.md` — Per-school CDS markdown files rendered by UniversityDetail via markdown-it.
- `public/knowledge-graph/*.md` — Research docs fetched at runtime by KnowledgeBaseViewer.

### i18n

- Locale files: `src/i18n/zh-CN.json` and `src/i18n/en.json`
- Locale key in localStorage: `competition-calendar-locale` (default: `zh-CN`)
- Language switch reloads the page (`window.location.reload()`) — workaround for Element Plus locale not being reactive
- Fallback locale: `zh-CN`
- University data uses both `name` (English) and `nameZh` (Chinese) fields; tier labels use `labelKey` for i18n

### Sync Points with Main FAD App

- `CompetitionCalendar.vue` mirrors `frontend/src/views/competition/CompetitionCalendar.vue` — changes to calendar logic/UI should be applied to both
- i18n keys should stay in sync with `frontend/src/i18n/locales/` for shared terminology
- Public API endpoints must exist in the backend without `authMiddleware`

## Key Patterns

- **Markdown rendering**: All markdown rendered with `markdown-it` (`html: false` for XSS prevention). Views use `:deep()` CSS to style rendered output (headings, tables, blockquotes).
- **Category colors** (competition calendar CSS): Uses Unicode escapes for Chinese class names (e.g., `.cat-\6570\5B66` for 数学). Colors: 数学=#409eff, 理科=#2ecc71, 文科=#e74c3c, 体育=#67c23a, 艺术=#9b59b6, 科技=#e6a23c, 其他=#909399. Also mapped to Element Plus tag types in `categoryTagMap`.
- **Calendar views**: Month (7-col grid with event bars), Week (7-col with cards), Year (4x3 month cards). Solid borders = competition period, dashed = registration-only.
- **Semester detection**: `getCurrentSemester()` in BestClassRanking auto-selects based on month (Feb-Jul = Spring, Sep-Jan = Fall).
- **State management**: Pure Vue refs (no Pinia). All component state is local reactive refs + computed properties.
- **Essay file convention**: `/public/essays/{source}/{theme}.md` — themes use underscores (e.g., `Academic_Passion`, `Books_Literature`).

## Edge Functions

EdgeOne Pages edge functions for IP-based access control are configured in the EdgeOne deployment (not in this repo). They check `context.env.ALLOWED_IPS` (comma-separated) and return 403 for unlisted IPs. Empty/unset means open access.

## Deployment

Build `dist/` and deploy to EdgeOne Pages. Configure `ALLOWED_IPS` environment variable in EdgeOne if IP restriction is needed. Production API URL is set in `.env.production`.
