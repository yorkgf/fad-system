# Competition Calendar (竞赛日历) Design

**Date:** 2026-03-04

**Goal:** Add a competition calendar module that allows S/B/T/F group teachers to create and manage competition events, with a calendar view (month/week) and a collapsible sidebar showing this week's and next week's competitions.

## Data Model

MongoDB collection: `Competition_Events` (GHA database)

```
{
  _id: ObjectId,
  竞赛名称: String,              // required
  竞赛类别: String,              // "学术" | "体育" | "艺术" | "科技" | "其他"
  报名开始日期: Date,            // optional (no registration phase → null)
  报名截止日期: Date,            // optional
  竞赛开始日期: Date,            // required
  竞赛结束日期: Date,            // required (same as start for single-day)
  参与对象: String,              // e.g. "全校" / "高一" / "高二" / free text
  地点: String,                  // optional
  描述: String,                  // optional
  创建人: String,                // req.user.username
  创建人组别: String,            // req.user.group (S/B/T/F)
  创建时间: Date,
  更新时间: Date
}
```

## Routes & Permissions

### Frontend Routes

| Route | Component | Purpose | Allowed Groups |
|-------|-----------|---------|---------------|
| `/competition/calendar` | `CompetitionCalendar.vue` | Calendar view (month/week) + collapsible sidebar | S, A, B, T, F |
| `/competition/manage` | `CompetitionManage.vue` | CRUD list page + create/edit dialog | S, B, T, F |

### Backend API (`/api/competition`)

| Method | Path | Purpose | Permission |
|--------|------|---------|-----------|
| GET | `/events` | List events (supports date range, category filter) | S, A, B, T, F |
| POST | `/events` | Create event | S, B, T, F |
| PUT | `/events/:id` | Update event | S (any) or creator only |
| DELETE | `/events/:id` | Delete event | S (any) or creator only |

### Permission Rules

- **S group**: Full access — can view, create, edit, and delete any event
- **B, T, F groups**: Can view all events, create new events, edit/delete only their own events
- **A group**: View-only access (calendar page, no manage page entry or write API access)

### Home Function Cards

- 竞赛日历 → `/competition/calendar`, groups: `['S', 'A', 'B', 'T', 'F']`
- 竞赛管理 → `/competition/manage`, groups: `['S', 'B', 'T', 'F']`

## UI Design

### Page 1: Competition Calendar (`CompetitionCalendar.vue`)

**Layout:** Left calendar area (~70%) + right collapsible sidebar (~30%)

**Calendar area:**
- Top toolbar: month/week view toggle (el-radio-group) + prev/next navigation + current month/week label
- Month view: Based on el-calendar, custom cell rendering with colored event blocks by category
- Week view: Custom 7-column grid, each column shows one day's event cards
- Click event block/card → detail popup (read-only)

**Collapsible sidebar:**
- Toggle button to collapse/expand; collapsed by default on small screens
- "本周竞赛" card list: competition name, category tag, date range
- "下周竞赛" card list: same format
- Empty state: "暂无竞赛" placeholder

### Page 2: Competition Manage (`CompetitionManage.vue`)

**Layout:** Standard list page

- Top: Filter bar (category dropdown, date range picker, search input) + "新建竞赛" button
- Middle: el-table with columns: 竞赛名称, 类别, 竞赛日期, 报名截止, 参与对象, 创建人, 操作
- Action column: edit/delete buttons (shown only for events user has permission to modify)
- Create/edit via el-dialog with form validation

## Category Color Mapping

| Category | Color |
|----------|-------|
| 学术 | Blue (#409EFF) |
| 体育 | Green (#67C23A) |
| 艺术 | Purple (#9B59B6) |
| 科技 | Orange (#E6A23C) |
| 其他 | Gray (#909399) |

## Files to Create/Modify

### New Files
- `backend/src/routes/competition.js` — Backend CRUD routes
- `frontend/src/api/competition.js` — Frontend API layer
- `frontend/src/views/competition/CompetitionCalendar.vue` — Calendar view
- `frontend/src/views/competition/CompetitionManage.vue` — Management list page

### Modified Files
- `backend/src/index.js` — Register `/api/competition` routes
- `backend/src/utils/userGroups.js` — Add `COMPETITION_MANAGE_GROUPS` constant
- `frontend/src/router/index.js` — Add 2 competition routes
- `frontend/src/layouts/MainLayout.vue` — Add 2 function cards
- `frontend/src/i18n/locales/zh-CN.json` — Add competition translation keys
- `frontend/src/i18n/locales/en.json` — Add competition translation keys
