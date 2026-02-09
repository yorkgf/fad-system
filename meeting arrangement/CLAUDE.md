# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Parent-Teacher Meeting Booking System (GHA线上会议预约) - Parent portal for scheduling parent-teacher conferences via Tencent Meeting.

**Important:** Teacher portal has been integrated into the main FAD system. This standalone system now only serves **parent portal** functionality.

**Tech Stack:** Express.js backend + MongoDB + static HTML/JS frontend, deployed to Tencent Cloud SCF (Serverless Cloud Function).

## Recent Updates

### Calendar View (日历视图)
- Added calendar view for selecting available time slots
- Month navigation (previous/next month)
- Visual indicators for dates with available slots
- Click date to view available time slots for that day
- Date format normalization for consistent display

## Development Commands

```bash
# Install dependencies
npm install

# Start local server (port 9000)
npm start

# Deploy to Tencent Cloud SCF
serverless deploy
```

## Architecture

```
Parent Portal (EdgeOne Pages)
        ↓
   Function URL
        ↓
Express.js API (scf_index.js) - Parent-only APIs
        ↓
MongoDB (database: GHS)
        ↑
FAD Backend (teacher APIs)
```

**Key files:**
- `CFunction/scf_index.js` - Parent-only API server
- `pages/index.html` - Parent login (phone only)
- `pages/parent_dashboard.html` - Parent: browse teachers, book slots (with calendar view)

**Teacher portal:** Now integrated into FAD system at `frontend/src/views/schedule/`

**Database collections:**
- `teachers` - Teacher accounts with grades, subjects, Tencent Meeting credentials
- `sessions` - Available time slots with booking status

**Note:** Both this standalone parent portal and the FAD system's schedule module share the same GHS database.

## API Endpoints (Parent-Only)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/teachers` | List all teachers (public info only) |
| GET | `/api/teacher/:email` | Get teacher details (public info only) |
| GET | `/api/sessions/teacher/:name` | Get teacher's available (unbooked) slots |
| PUT | `/api/sessions/book` | Book a session |
| GET | `/api/bookings/parent/:phone` | Get parent's bookings |
| DELETE | `/api/bookings/:sessionId` | Cancel a booking |

**Removed endpoints** (now handled by FAD system):
- `POST /api/teacher/login` - Teacher authentication
- `PUT /api/teacher/meeting` - Update meeting credentials
- `PUT /api/teacher/password` - Change password
- `POST /api/sessions` - Create time slots
- `GET /api/bookings/teacher/:name` - Get teacher's bookings
- `DELETE /api/sessions/teacher/:name` - Delete time slots

## Environment Variables

```bash
MONGO_URI=mongodb://...      # MongoDB connection string
DB_NAME=GHS                  # Database name (default: GHS)
PORT=9000                    # Server port
```

## Deployment

Uses Serverless Framework targeting Tencent Cloud SCF. See `DEPLOY.md` for detailed instructions.

## Business Logic Notes

- Parents login with phone number only (no password)
- Teachers manage their schedules through the FAD system (not this standalone system)
- One booking per parent per teacher enforced at frontend
- Meeting credentials (Tencent Meeting) shown to parents after booking
- Both parent portal and FAD teacher portal share the same GHS database

## Calendar View Notes

- Calendar displays current month by default
- Dates with available slots are highlighted in green
- Clicking a date opens a list of available time slots for that day
- Month navigation allows browsing to future months
- Date format normalization ensures consistent display across different date formats
