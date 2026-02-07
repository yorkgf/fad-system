```
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
```

## Project Overview

FAD (学生纪律与奖励管理系统) - Student discipline and reward management system built with Vue 3 + Express + MongoDB, deployed on Tencent Cloud SCF (Serverless) + EdgeOne Pages.

## Development Commands

### Frontend (in `frontend/`)
```bash
npm install        # Install dependencies
npm run dev        # Dev server on http://localhost:3000
npm run build      # Production build
npm run build:prod # Optimized production build
npm run preview    # Preview production build locally
```

### Backend (in `backend/`)
```bash
npm install        # Install dependencies
npm run dev        # Dev server on http://localhost:8080 (with watch)
npm run start      # Production start
npm run deploy     # Deploy to Tencent SCF
npm run logs       # View SCF logs (tail)
npm run remove     # Remove SCF deployment
```

### Local Development Setup
1. **Backend**:
   ```bash
   cd backend
   cp .env.example .env  # Copy and configure environment variables
   npm install
   npm run dev
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Frontend proxies `/api` requests to backend automatically via vite.config.js.

## Architecture

### Tech Stack
- **Frontend**: Vue 3 (Composition API) + Element Plus + Pinia + Vue Router + Axios + Vite
- **Backend**: Express + MongoDB (native driver) + JWT + serverless-http
- **Deployment**: Tencent SCF (backend) + EdgeOne Pages (frontend)

### Project Structure
```
frontend/src/
├── api/              # Axios wrappers (request.js has base config + interceptors)
├── stores/           # Pinia stores (user.js for auth, common.js for record types)
├── router/           # Vue Router with auth guard
├── layouts/          # MainLayout.vue with sidebar navigation
├── views/            # Feature-based page components
├── utils/            # Utility functions
└── App.vue           # Root component

backend/src/
├── routes/           # Express routers (7 modules)
│   ├── auth.js       # Login/teachers endpoints
│   ├── students.js   # Students/classes endpoints
│   ├── records.js    # Core record management with accumulation
│   ├── fad.js        # FAD record management
│   ├── reward.js     # Reward record management
│   ├── room.js       # Room praise/warning endpoints
│   └── other.js      # Other endpoints (electronics,停课, etc.)
├── utils/
│   ├── constants.js  # Business rules, accumulation rules, record type mappings
│   ├── db.js         # MongoDB singleton connection
│   ├── auth.js       # JWT middleware, bcrypt helpers
│   └── email.js      # Brevo API for notifications
└── index.js          # Express app entry + serverless handler export
```

### Key Files for Business Logic
- `backend/src/utils/constants.js` - Accumulation rules, record type to collection mappings
- `backend/src/routes/records.js` - Core record insertion with accumulation checking
- `frontend/src/stores/common.js` - Record type definitions (must stay in sync with backend)

## Database

- MongoDB connection via `MONGO_URI` env var, database: `GHA`
- Collections follow `{Type}_Records` pattern (e.g., `FAD_Records`, `Late_Records`)
- System collections: `Teachers`, `Students`, `All_Classes`
- Special collections: `Teaching_FAD_Ticket`, `Teaching_Reward_Ticket` (no `_Records` suffix)
- Note: Both phone late types (`21:30后` and `22:00后`) share `Phone_Late_Records` collection

## Authentication

- JWT tokens (7-day expiry) stored in Pinia `useUserStore`
- User groups: `F` (Faculty - limited permissions) and `S` (System - admin)
- Axios interceptor auto-injects `Authorization: Bearer {token}`

## Core Business Rules

### Accumulation Rules (constants.js)
- 2 早点名迟到 → 1 FAD (source: other)
- 2 寝室迟出 → 1 FAD (source: dorm)
- 2 未按规定返校 → 1 FAD (source: dorm)
- 2 擅自进入会议室或接待室 → 1 FAD (source: other)
- 5 寝室批评 → 1 FAD (source: dorm)
- 2 寝室垃圾未倒 → 1 寝室批评 (chains to FAD via 寝室批评 rule)
- 3 Teaching FAD Tickets → 1 FAD (source: teach)
- 10 寝室表扬 → Reward hint (frontend notification only)
- 6 Teaching Reward Tickets → Reward hint (frontend notification only)

### Reward Offset Rules (records.js:handleRewardOffset)
- 2 Rewards → offset FAD execution (是否已执行或冲抵 = true)
- 3 Rewards → offset FAD record (是否已冲销记录 = true)
- `priorityOffset` flag controls whether to prioritize offsetting execution vs record

### Direct FAD Triggers (no accumulation)
- 上网课违规使用电子产品 → immediate FAD (source: elec)
- 22:00后交还手机 → immediate FAD (source: dorm)
- 21:30后交还手机(22:00前) → no FAD (same collection, different behavior)

### Record Withdrawal
- Cascade deletes any generated FAD/warnings from accumulated records
- Reward records cannot be withdrawn (enforced in API)
- FAD/Reward with `是否已发放=true` or teacher starting with `已发:` cannot be withdrawn

## Critical Sync Points

Changes to record types require updates in **both**:
1. `backend/src/utils/constants.js` (RECORD_TYPE_TO_COLLECTION, ACCUMULATE_RULES)
2. `frontend/src/stores/common.js` (allRecordTypes)

FAD source type mappings are defined in `backend/src/utils/constants.js` (RECORD_TO_FAD_SOURCE).

## Environment Variables (Backend)

```
MONGO_URI=mongodb://...
DB_NAME=GHA
JWT_SECRET=your-secret
BREVO_API_KEY=your-key (for email notifications)
SENDER_EMAIL=sender@example.com
SENDER_NAME=FAD系统
```

## Deployment

- **Backend**: Pre-bundled in `deploy-package/` for manual SCF upload, or use `npm run deploy`
- **Frontend**: Build with `npm run build:prod`, deploy `dist/` to EdgeOne Pages
- Production API URL configured in `frontend/.env.production`

## API Routes

### Authentication
- `POST /api/auth/login` - Teacher login
- `GET /api/auth/teachers` - Get teachers list
- `PUT /api/auth/teachers/:id` - Update teacher
- `POST /api/auth/teachers` - Create teacher

### Students
- `GET /api/students` - Get all students
- `GET /api/classes` - Get all classes
- `GET /api/classes/:classId/students` - Get students in class

### Records
- `POST /api/records` - Create record with accumulation
- `GET /api/records` - Get records (with filters)
- `GET /api/records/student/:studentId` - Get student's records
- `DELETE /api/records/:id` - Withdraw record

### FAD Management
- `GET /api/fad-records` - Get FAD records (with filters)
- `GET /api/fad-records/student/:studentId` - Get student's FAD records
- `PUT /api/fad-records/:id` - Update FAD record
- `PUT /api/fad-records/` - Batch update FAD records
- `DELETE /api/fad-records/:id` - Delete FAD record
- `GET /api/fad-records/analysis/total` - Total FAD analysis

### Reward Management
- `GET /api/reward-records` - Get Reward records
- `GET /api/reward-records/student/:studentId` - Get student's Reward records
- `PUT /api/reward-records/:id` - Update Reward record
- `PUT /api/reward-records/` - Batch update Reward records
- `DELETE /api/reward-records/:id` - Delete Reward record

### Room Management
- `GET /api/room-praise` - Get room praise records
- `PUT /api/room-praise/:id` - Update room praise record
- `GET /api/room-warning` - Get room warning records
- `PUT /api/room-warning/:id` - Update room warning record

### Other Endpoints
- `GET /api/health` - Health check
- `POST /api/elec-violations` - Electronics violations
- `GET /api/elec-violations` - Get electronics violations
- `PUT /api/elec-violations/:id` - Update electronics violation
- `POST /api/suspension` - Create suspension record
- `GET /api/suspension` - Get suspension records
- `GET /api/suspension/current` - Get current suspension list
- `PUT /api/suspension/:id` - Update suspension record
- `POST /api/teaching-reward/convert` - Convert teaching reward tickets
