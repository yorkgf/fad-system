# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FAD (学生纪律与奖励管理系统) - Student discipline and reward management system built with Vue 3 + Express + MongoDB, deployed on Tencent Cloud SCF (Serverless) + EdgeOne Pages.

**Integrated Systems:**
- **FAD Core**: Student discipline/reward management (GHA database)
- **Meeting Arrangement (日程管理)**: Parent-teacher conference booking system (GHS database) - Teacher portal integrated into FAD; standalone parent portal remains in `meeting arrangement/` folder

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
npm run dev        # Dev server on http://localhost:8080 (with watch)
npm run start      # Production start (no watch)
npm run deploy     # Deploy to Tencent SCF via serverless framework
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

**Note**: Frontend dev server proxies `/api` requests to the production backend by default (configured in `vite.config.js`). To point to a local backend, edit the proxy target in `vite.config.js` to `http://localhost:8080`.

## Architecture

### Tech Stack
- **Frontend**: Vue 3 (Composition API) + Element Plus + Pinia + Vue Router + Axios + Vite
- **Backend**: Express + MongoDB (native driver) + JWT + serverless-http
- **Deployment**: Tencent SCF (backend) + EdgeOne Pages (frontend)

### User Groups & Permissions
- **Group `S`** (System/Admin): Full access including FAD/Reward management, all record types, user management, all statistics
- **Group `A`**: Admin access similar to S, can access school/class stats, room management, data query, suspension management
- **Group `B`**: Can access FAD execution, electronics violations, phone violations, class stats (if 班主任)
- **Group `T`**: Can access FAD execution, electronics violations, phone violations, class stats (if 班主任)
- **Group `F`** (Faculty): Limited access - can only create records marked with `group: 'F'` in `common.js` (e.g., 早点名迟到, 寝室迟出), can access schedule features, cannot view class FAD statistics unless they are the class's 班主任
- **Group `C`** (Cleaning staff): Most limited access - only basic record insertion and password change, excluded from schedule features

See `frontend/src/router/index.js` for complete route permission matrix (lines 176-253)

### Key Architectural Patterns
- **Record accumulation**: Records in collection-specific tables (e.g., `Late_Records`) accumulate based on `ACCUMULATE_RULES` in `constants.js`, triggering FAD/Reward creation when thresholds are met
- **FAD source tracking**: Every FAD has a `FAD来源类型` field (dorm/teach/elec/other) used for analytics
- **Reward offset logic**: 2 Rewards can offset FAD execution status; 3 Rewards can offset the entire FAD record
- **Duplicate prevention**: Certain record types (寝室表扬, 寝室批评, 寝室垃圾未倒) cannot be duplicated for the same student on the same day
- **Dual database**: FAD connects to both GHA (main) and GHS (meeting arrangement) databases; see `db.js` for connection logic
- **Teacher profile sync**: GHS teacher profiles are auto-created from GHA teacher data when accessing schedule features

### Project Structure
```
frontend/src/
├── api/              # Axios wrappers (request.js has base config + interceptors)
├── stores/           # Pinia stores (user.js for auth, common.js for record types)
├── router/           # Vue Router with auth guard and permission matrix
├── layouts/          # MainLayout.vue with dashboard-style navigation
├── views/            # Feature-based page components
│   ├── records/      # Record insertion and management
│   ├── fad/          # FAD execution, delivery, statistics (school/class)
│   ├── reward/       # Reward delivery
│   ├── room/         # Room praise, cleaning, rankings
│   ├── schedule/     # Meeting arrangement management
│   ├── settings/     # Password, teacher profile
│   └── ...
├── utils/            # Utility functions
└── App.vue           # Root component

backend/src/
├── routes/           # Express routers (8 modules)
│   ├── auth.js       # Login/teachers endpoints
│   ├── students.js   # Students/classes endpoints
│   ├── records.js    # Core record management with accumulation
│   ├── fad.js        # FAD record management
│   ├── reward.js     # Reward record management
│   ├── room.js       # Room praise/warning endpoints
│   ├── schedule.js   # Meeting arrangement integration (GHS database)
│   └── other.js      # Other endpoints (electronics,停课, etc.)
├── utils/
│   ├── constants.js  # Business rules, accumulation rules, record type mappings
│   ├── db.js         # MongoDB dual connection (GHA + GHS)
│   ├── auth.js       # JWT middleware, bcrypt helpers
│   └── email.js      # Brevo API for notifications
└── index.js          # Express app entry + serverless handler export
```

### Frontend Architecture
- **MainLayout.vue**: Dashboard-style layout with function cards grid navigation on home page
- **Request interceptor**: Auto-injects JWT token from Pinia store (`useUserStore`)
- **Response interceptor**: Handles 401 (auto logout), 403, 404, 500 errors with Element Plus messages
- **Route guard**: Complex permission matrix in `router/index.js` checking user groups and special permissions (like 班主任)
- **State management**: Pinia stores for user auth and common data (classes, semesters, record types)

### Key Files for Business Logic
- `backend/src/utils/constants.js` - Accumulation rules, record type to collection mappings, FAD source types
- `backend/src/routes/records.js` - Core record insertion with accumulation checking, duplicate prevention, reward offset logic
- `frontend/src/stores/common.js` - Record type definitions (must stay in sync with backend), semester utilities
- `backend/src/utils/db.js` - Dual database connection management (GHA + GHS)
- `frontend/src/router/index.js` - Route permission matrix by user group

## Database

- MongoDB connection via `MONGO_URI` env var, database: `GHA`
- Collections follow `{Type}_Records` pattern (e.g., `FAD_Records`, `Late_Records`)
- System collections: `Teachers`, `Students`, `All_Classes`
- Special collections: `Teaching_FAD_Ticket`, `Teaching_Reward_Ticket` (no `_Records` suffix)
- Note: Both phone late types (`21:30后` and `22:00后`) share `Phone_Late_Records` collection
- Secondary database: `GHS` (Meeting Arrangement Schedule) connected via `GHS_MONGO_URI` for meeting room violations

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
- **Annual scope**: Reward offset logic operates across all semesters in an academic year, not limited to a single semester
- 2 Rewards → offset FAD execution (是否已执行或冲抵 = true)
- 3 Rewards → offset FAD record (是否已冲销记录 = true)
- `priorityOffset` flag controls whether to prioritize offsetting execution vs record
- System uses the **latest FAD** when applying reward offsets (sorted by 记录日期 descending)

### Direct FAD Triggers (no accumulation)
- 上网课违规使用电子产品 → immediate FAD (source: elec), separate collection `Elec_Products_Violation_Records`
- 22:00后交还手机 → immediate FAD (source: dorm)
- 21:30后交还手机(22:00前) → no FAD (same collection `Phone_Late_Records`, different behavior)

### Semester System
- Only two semesters: `春季(Spring)` (Feb-Jul) and `秋季(Fall)` (Sep-Jan)
- Current semester auto-detected by `getCurrentSemester()` in `common.js` based on month
- All records tagged with semester for filtering and analysis
- **Academic Year**: A full academic year consists of:
  - Fall semester (e.g., 2024年秋季) + Spring semester of the following year (e.g., 2025年春季)
  - Example: 2024-2025学年 = 2024年秋季(Fall) + 2025年春季(Spring)
- **Annual scope functions**: Some functions operate on the full academic year:
  - FAD statistics for suspension/dismissal (6+ for warning, 9+ for dismissal)
  - Reward offset logic (uses latest FAD across both semesters in the academic year)
  - Query parameter `semester=学年` triggers academic year scope aggregation

### Record Withdrawal
- Cascade deletes any generated FAD/warnings from accumulated records
- Reward records cannot be withdrawn (enforced in API)
- FAD/Reward with `是否已发放=true` or teacher starting with `已发:` cannot be withdrawn

### Duplicate Prevention
- `寝室表扬`, `寝室批评`, `寝室垃圾未倒` cannot be duplicated for the same student on the same day (enforced in `records.js:DUPLICATE_CHECK_TYPES`)

## Meeting Arrangement Integration

The meeting arrangement system (会议预约系统) is a dual-database integration:

### Architecture
```
FAD Frontend (Vue 3)
        ↓
FAD Backend (Express)
   ↓            ↓
GHA DB      GHS DB
(FAD)     (Schedule)
```

### Database Separation
- **GHA database**: FAD core data (students, records, FAD, rewards)
- **GHS database**: Meeting arrangement data (teachers, sessions, bookings)
- Connection managed in `db.js` with `getCollection()` (GHA) and `getGHSCollection()` (GHS)

### Teacher Profile Sync
- When a teacher accesses schedule features, their profile is auto-synced from GHA to GHS
- GHS stores additional fields: `meetingId`, `meetingPassword`, `grades`, `subjects`
- Teachers excluded from schedule: Group `C` (cleaning staff)

### Schedule Management Features
The teacher portal for schedule management includes:
- **日程管理** (`/schedule`): Create/manage time slots (sessions), view all available slots
- **我的日程** (`/schedule/my`): View your own available time slots as a teacher
- **我的预约** (`/schedule/bookings`): View bookings made by parents for your sessions

### Permission Groups for Schedule
Schedule access is restricted to groups: `S`, `A`, `B`, `T`, `F` (excludes `C` - cleaning staff)

### Booking Conflict Detection
The system includes sophisticated conflict detection in `schedule.js`:
- Time overlap detection (strict non-overlapping: 09:00-09:15 and 09:15-09:30 don't conflict)
- Parent cannot book same teacher twice per day
- Parent cannot have overlapping time slots with different teachers
- Checks both `bookings` collection (teacher-created) and `sessions` collection (parent-created)

### Standalone Parent Portal
The original meeting arrangement system remains in `meeting arrangement/` folder:
- `meeting arrangement/CFunction/` - Standalone backend (SCF)
- `meeting arrangement/pages/` - Parent portal (static HTML)
- These serve parents booking conferences independently of FAD

## Critical Sync Points

Changes to record types require updates in **both**:
1. `backend/src/utils/constants.js` (`RECORD_TYPE_TO_COLLECTION`, `ACCUMULATE_RULES`, `RECORD_TO_FAD_SOURCE`)
2. `frontend/src/stores/common.js` (`allRecordTypes`)

**Important**: The `group` field in `allRecordTypes` controls which user groups can create each record type:
- Group `F` (Faculty) users can only see record types with `group: 'F'`
- Group `S` (System) users see all record types
- Currently: FAD and Reward are `group: 'S'` (admin only), 上网课违规使用电子产品 is `group: 'S'`

## Environment Variables (Backend)

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string (GHA database) |
| `DB_NAME` | Main database name (default: `GHA`) |
| `GHS_MONGO_URI` | MongoDB connection for meeting schedule DB (optional) |
| `GHS_DB_NAME` | Meeting schedule database name (default: `GHS`) |
| `JWT_SECRET` | JWT signing key |
| `JWT_EXPIRES_IN` | Token expiry (default: `7d`) |
| `BREVO_API_KEY` | Brevo email API key |
| `SENDER_EMAIL` | Notification sender email |
| `SENDER_NAME` | Notification sender name |
| `PORT` | Server port (default: `8080`) |
| `NODE_ENV` | Environment (`development` or `production`)

## Deployment

### Backend (Tencent SCF)
- **Manual upload**: Use `deploy-package/` folder (pre-bundled, ~13MB) for manual SCF upload
- **Serverless Framework**: Use `npm run deploy` (requires `serverless.yml` configuration)
- **Logs**: Use `npm run logs` to tail SCF logs

**Deploy Package Structure**:
```
deploy-package/
├── scf_bootstrap     # Entry point (sets PORT, starts node index.js)
├── index.js          # Main application (copied from backend/src/index.js)
├── src/              # Source files (mirrors backend/src/)
├── node_modules/     # Production dependencies
└── package.json      # Dependencies list
```

**SCF Configuration** (from `serverless.yml`):
- Runtime: Nodejs18.15
- Region: ap-guangzhou
- Memory: 256MB
- Timeout: 30s
- Triggers: API Gateway with CORS enabled on all paths

### Frontend (EdgeOne Pages)
```bash
cd frontend
npm run build:prod
# Deploy `dist/` folder (~1.8MB) to EdgeOne Pages
```

**Build Configuration**:
- Production API URL: Set in `frontend/.env.production` as `VITE_API_BASE_URL` (currently: `https://1300190563-l4w10rylyq.ap-shanghai.tencentscf.com/api`)
- Base path: `/` (configured in `vite.config.js`)
- Chunking: Vendor libs split into `vue-vendor`, `element-plus`, `utils` chunks
- Dev proxy: By default proxies `/api` to production backend; change `target` in `vite.config.js` for local backend

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

### Schedule Management (Meeting Arrangement)
- `GET /api/schedule/me/ghs-profile` - Get current teacher's GHS profile (auto-creates if missing)
- `PUT /api/schedule/me/meeting` - Update Tencent Meeting credentials
- `PUT /api/schedule/me/profile` - Update teacher grades/subjects
- `GET /api/schedule/teachers` - List teachers with schedule enabled
- `GET /api/schedule/sessions` - Get available time slots
- `POST /api/schedule/sessions` - Create time slot
- `POST /api/schedule/sessions/batch` - Batch create time slots
- `PUT /api/schedule/sessions/:id` - Update time slot
- `DELETE /api/schedule/sessions/:id` - Delete time slot
- `GET /api/schedule/bookings` - Get bookings list
- `POST /api/schedule/bookings` - Create booking
- `PUT /api/schedule/bookings/:id` - Update booking status
- `GET /api/schedule/my-sessions` - Get my schedule (as teacher)
- `GET /api/schedule/my-bookings` - Get my bookings (as booker)

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

## Quick Reference

### Key Symbols and Locations
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `ACCUMULATE_RULES` | const | backend/src/utils/constants.js:22-32 | Accumulation thresholds (e.g., 2 早点名迟到 → 1 FAD) |
| `RECORD_TYPE_TO_COLLECTION` | const | backend/src/utils/constants.js:35-50 | Maps record types to MongoDB collections |
| `RECORD_TO_FAD_SOURCE` | const | backend/src/utils/constants.js:10-19 | Maps record types to FAD source (dorm/teach/elec/other) |
| `DUPLICATE_CHECK_TYPES` | const | backend/src/routes/records.js:16 | Types that cannot be duplicated per day |
| `allRecordTypes` | const | frontend/src/stores/common.js:19-34 | 14 record types with `group` permissions |
| `withdrawRecord` | function | backend/src/routes/records.js | Handles record withdrawal with cascading deletes |
| `handleRewardOffset` | function | backend/src/routes/records.js | Handles reward offset logic for FAD records |
| `checkParentBookingConflicts` | function | backend/src/routes/schedule.js:47 | Booking conflict detection |

### Common Development Tasks
1. **Adding a new record type**:
   - Update `backend/src/utils/constants.js` (add to `RECORD_TYPE_TO_COLLECTION` and optionally `ACCUMULATE_RULES`, `RECORD_TO_FAD_SOURCE`)
   - Update `frontend/src/stores/common.js` (add to `allRecordTypes` with appropriate `group`)
2. **Modifying accumulation rules**: Edit `ACCUMULATE_RULES` in `backend/src/utils/constants.js`
3. **Adding route permissions**: Update `frontend/src/router/index.js` route guard (lines 180-253)
4. **Testing API endpoints**: Use tools like Postman or curl to test endpoints against SCF URL
5. **Checking SCF logs**: Run `npm run logs` in backend directory
6. **Pointing frontend to local backend**: Change `proxy.target` in `frontend/vite.config.js` to `http://localhost:8080`

### Gotchas
- `deploy-package/` contains the pre-bundled backend for SCF (~13MB) with `scf_bootstrap` entry point - modifications to source code require rebuilding the package
- To rebuild deploy package: Copy `backend/src/` to `deploy-package/src/` and reinstall dependencies
- Email notifications use Brevo API - check `NO_EMAIL_TYPES` in `email.js` for excluded record types
- Teacher login data is initialized via the "教职工" page in the "其他" module
- Frontend proxy `/api` in dev mode points to production SCF by default; change `vite.config.js` for local backend
- Phone late records (`21:30后` and `22:00后`) share the same collection `Phone_Late_Records` but have different FAD behavior
- The system uses MongoDB native driver (not Mongoose) - queries use MongoDB aggregation syntax directly
- SCF environment uses `PORT` environment variable (defaults to 9000 in `scf_bootstrap`)
- **Annual scope**: Reward offset and FAD statistics operate across all semesters, not just the current semester
- **Latest FAD priority**: When applying rewards, the system selects the most recent FAD (by 记录日期) regardless of semester
