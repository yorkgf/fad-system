# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FAD (学生纪律与奖励管理系统) - Student discipline and reward management system built with Vue 3 + Express + MongoDB, deployed on Tencent Cloud SCF (Serverless) + EdgeOne Pages.

## Development Commands

### Frontend (in `frontend/`)
```bash
npm run dev          # Dev server on http://localhost:3000
npm run build        # Production build
npm run build:prod   # Optimized production build
```

### Backend (in `backend/`)
```bash
npm run dev          # Dev server on http://localhost:8080 (with watch)
npm run start        # Production start
npm run deploy       # Deploy to Tencent SCF
npm run logs         # View SCF logs
```

### Local Development Setup
Run both terminals simultaneously:
- Terminal 1: `cd backend && npm run dev`
- Terminal 2: `cd frontend && npm run dev`

Frontend proxies `/api` requests to backend automatically via vite.config.js.

## Architecture

### Tech Stack
- **Frontend**: Vue 3 (Composition API) + Element Plus + Pinia + Vue Router + Axios + Vite
- **Backend**: Express + MongoDB (native driver) + JWT + serverless-http
- **Deployment**: Tencent SCF (backend) + EdgeOne Pages (frontend)

### Project Structure
```
frontend/src/
├── api/           # Axios wrappers (request.js has base config + interceptors)
├── stores/        # Pinia stores (user.js for auth, common.js for record types)
├── router/        # Vue Router with auth guard
├── layouts/       # MainLayout.vue with sidebar
└── views/         # Vue components organized by feature

backend/src/
├── routes/        # Express routers (7 modules)
├── utils/
│   ├── constants.js  # Business rules, accumulation rules, record type mappings
│   ├── db.js         # MongoDB singleton connection
│   ├── auth.js       # JWT middleware, bcrypt helpers
│   └── email.js      # Brevo API for notifications
└── index.js       # Express app entry + serverless handler export
```

### Key Files for Business Logic
- `backend/src/utils/constants.js` - Accumulation rules (e.g., 2 tardiness → 1 FAD), record type to collection mapping
- `backend/src/routes/records.js` - Core record insertion with accumulation checking
- `frontend/src/stores/common.js` - Record type definitions (must stay in sync with backend)

## Database

- MongoDB at `mongodb://49.235.189.246:27017`, database: `GHA`
- Collections follow `{Type}_Records` pattern (e.g., `FAD_Records`, `Late_Records`)
- System collections: `Teachers`, `Students`, `All_Classes`

## Authentication

- JWT tokens (7-day expiry) stored in Pinia `useUserStore`
- User groups: `F` (Faculty - limited permissions) and `S` (System - admin)
- Axios interceptor auto-injects `Authorization: Bearer {token}`

## Core Business Rules

**Accumulation Rules** (in `constants.js`):
- 2 早点名迟到 → 1 FAD
- 2 寝室迟出 → 1 FAD
- 5 寝室批评 → 1 FAD
- 3 Teaching FAD Tickets → 1 FAD
- 10 寝室表扬 → Reward hint

**Record Withdrawal**: Cascade deletes any generated FAD/warnings from accumulated records.

## Critical Sync Points

Changes to record types require updates in **both**:
1. `backend/src/utils/constants.js` (RECORD_TYPE_TO_COLLECTION)
2. `frontend/src/stores/common.js` (allRecordTypes)

## Environment Variables (Backend)

```
MONGO_URI=mongodb://...
DB_NAME=GHA
JWT_SECRET=your-secret
BREVO_API_KEY=your-key (for email notifications)
```

## Deployment

- **Backend**: Pre-bundled in `deploy-package/` for manual SCF upload, or use `npm run deploy`
- **Frontend**: Build with `npm run build:prod`, deploy `dist/` to EdgeOne Pages
- Production API URL configured in `frontend/.env.production`
