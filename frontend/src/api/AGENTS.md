# API MODULES

**Domain:** HTTP endpoint definitions

## OVERVIEW
Axios-based API layer organized by domain. All modules import shared `request.js` instance with auth headers.

## STRUCTURE
```
api/
├── request.js      # Axios instance with interceptors, auth, error handling
├── auth.js         # Login, password reset, current user info, record types
├── fad.js          # FAD records (list, execute, deliver, stats)
├── records.js      # Student behavior records
├── room.js         # Dormitory management
├── reward.js       # Reward system
├── students.js     # Student data
└── other.js        # Miscellaneous endpoints
```

## WHERE TO LOOK
| Feature | File | Key Functions |
|---------|------|---------------|
| Auth | `auth.js` | `login()`, `getCurrentUser()`, `getRecordTypes()` |
| FAD | `fad.js` | `getFADRecords()`, `executeFAD()`, `deliverFAD()`, `getFADStats()` |
| Records | `records.js` | (behavior record endpoints) |
| Request config | `request.js` | baseURL, timeout, token interceptor, 401 handling |

## CONVENTIONS
- **Request method**: All functions call `request.get/put/post/delete()`
- **Auth**: Auto-injects `Authorization: Bearer {token}` header
- **Error handling**: Centralized in `request.js` - 401 triggers logout
- **API base**: `/api` or `VITE_API_BASE_URL` env var
- **Timeout**: 10 seconds default

## ANTI-PATTERNS
- Do NOT use direct axios - always import from `request.js`
- Do NOT manually add auth headers - interceptor handles it
