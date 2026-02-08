# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Parent-Teacher Meeting Booking System (GHA线上会议预约) - A bilingual (Chinese/English) web application for scheduling parent-teacher conferences via Tencent Meeting.

**Tech Stack:** Express.js backend + MongoDB + static HTML/JS frontend, deployed to Tencent Cloud SCF (Serverless Cloud Function).

## Development Commands

```bash
# Install dependencies
npm install

# Start local server (port 9000)
npm start

# Initialize database with seed data
node init_data.js

# Deploy to Tencent Cloud SCF
serverless deploy
```

## Architecture

```
Static Frontend (EdgeOne Pages)
        ↓
   Function URL
        ↓
Express.js API (scf_index.js)
        ↓
MongoDB (database: GHS)
```

**Key files:**
- `scf_index.js` - Main API server with all REST endpoints
- `config.js` - API base URL configuration
- `index.html` - Login page (parent phone / teacher email+password)
- `teacher_dashboard.html` - Teacher: set meeting credentials, manage time slots
- `parent_dashboard.html` - Parent: browse teachers by grade, book slots

**Database collections:**
- `teachers` - Teacher accounts with grades, subjects, Tencent Meeting credentials
- `sessions` - Available time slots with booking status

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/teacher/login` | Teacher authentication |
| GET | `/api/teachers` | List all teachers |
| PUT | `/api/teacher/meeting` | Update meeting credentials |
| POST | `/api/sessions` | Create available time slots |
| GET | `/api/sessions/teacher/:name` | Get teacher's available slots |
| PUT | `/api/sessions/book` | Book a session |
| GET | `/api/bookings/parent/:phone` | Get parent's bookings |
| DELETE | `/api/bookings/:sessionId` | Cancel a booking |

## Deployment

Uses Serverless Framework targeting Tencent Cloud SCF. See `DEPLOY.md` for detailed instructions including:
- Serverless Framework setup with Tencent credentials
- Manual console deployment option
- EdgeOne Pages static hosting
- Troubleshooting common issues

## Business Logic Notes

- Parents login with phone number only (no password)
- Teachers login with email + password
- One booking per parent per teacher enforced
- Time slots are 10 or 15 minute segments
- Meeting credentials (Tencent Meeting) shown to parents after booking
