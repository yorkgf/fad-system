# Frontend i18n Design

**Date:** 2026-02-26
**Status:** Approved

## Overview

Add English language support to the FAD frontend using vue-i18n. Users can toggle between Chinese and English via a dropdown in the header. Language preference is persisted in localStorage.

## Requirements

- Language toggle in header (saved to localStorage)
- Full i18n including Element Plus components (date pickers, pagination, etc.)
- Default language: Chinese (zh-CN)
- Record type values stay Chinese (database keys), only display labels get translated

## Approach

Use **vue-i18n** - the standard i18n library for Vue 3. It integrates seamlessly with Element Plus and provides `$t()` syntax in templates.

## File Structure

```
frontend/src/
├── i18n/
│   ├── index.js              # i18n instance setup + Element Plus integration
│   └── locales/
│       ├── zh-CN.json        # Chinese translations
│       └── en.json           # English translations
├── components/
│   └── LangSwitch.vue        # Dropdown toggle (zh/en) in header
├── main.js                   # Import and use i18n
└── layouts/
    └── MainLayout.vue        # Add LangSwitch to header
```

## Translation Key Organization

```json
{
  "common": {
    "login": "Login",
    "logout": "Logout",
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "search": "Search",
    "loading": "Loading..."
  },
  "nav": {
    "home": "Home",
    "records": "Records",
    "insertRecord": "Insert Record",
    "myRecords": "My Records",
    "fad": "FAD",
    "fadExecution": "FAD Execution",
    "fadDeliver": "FAD Notification"
  },
  "login": {
    "title": "FAD Student Management",
    "email": "Email",
    "emailPlaceholder": "Enter email address",
    "password": "Password",
    "passwordPlaceholder": "Enter password",
    "forgotPassword": "Forgot password?"
  },
  "records": {
    "recordType": "Record Type",
    "student": "Student",
    "date": "Date",
    "semester": "Semester"
  },
  "recordTypes": {
    "FAD": "FAD",
    "Reward": "Reward",
    "morningLate": "Morning Roll Call Late",
    "dormLateExit": "Dorm Late Exit",
    "returnViolation": "Return Violation",
    "meetingRoomViolation": "Meeting Room Violation",
    "dormPraise": "Dorm Praise",
    "dormCriticism": "Dorm Criticism",
    "dormTrashNotDumped": "Dorm Trash Not Dumped",
    "onlineClassViolation": "Online Class Electronics Violation",
    "phoneLate2130": "Phone Late (21:30-22:00)",
    "phoneLate2200": "Phone Late (after 22:00)",
    "teachingFADTicket": "Teaching FAD Ticket",
    "teachingRewardTicket": "Teaching Reward Ticket"
  },
  "validation": {
    "required": "This field is required",
    "emailFormat": "Please enter a valid email format",
    "emailRequired": "Please enter email address",
    "passwordRequired": "Please enter password"
  },
  "messages": {
    "success": "Operation successful",
    "error": "Operation failed",
    "loginSuccess": "Login successful",
    "logoutSuccess": "Logged out"
  }
}
```

## Data Flow

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  LangSwitch.vue │────▶│   i18n.js    │────▶│  localStorage   │
│  (user clicks)  │     │  setLocale() │     │  'locale'='en'  │
└─────────────────┘     └──────────────┘     └─────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐   ┌────────────┐
       │  vue-i18n  │   │ Element+   │   │   <title>  │
       │  $t() calls│   │  locale    │   │  document  │
       └────────────┘   └────────────┘   └────────────┘
```

1. User clicks language toggle → calls `setLocale('en')`
2. `setLocale()` updates vue-i18n locale, Element Plus locale, and saves to localStorage
3. On app init, read localStorage and restore saved locale (default: zh-CN)
4. All `$t()` calls reactively update

## Component Refactoring Pattern

### Template Changes

**Before:**
```vue
<el-form-item label="邮箱地址" prop="email">
  <el-input placeholder="请输入邮箱地址" />
</el-form-item>
<el-button>登录</el-button>
```

**After:**
```vue
<el-form-item :label="$t('login.email')" prop="email">
  <el-input :placeholder="$t('login.emailPlaceholder')" />
</el-form-item>
<el-button>{{ $t('common.login') }}</el-button>
```

### Validation Rules

**Before:**
```js
{ required: true, message: '请输入邮箱地址', trigger: 'blur' }
```

**After:**
```js
{ required: true, message: () => t('validation.emailRequired'), trigger: 'blur' }
```

### Store Record Types

**Before (common.js):**
```js
{ value: '早点名迟到', label: '早点名迟到', group: 'F' }
```

**After:**
```js
{ value: '早点名迟到', labelKey: 'recordTypes.morningLate', group: 'F' }
```

**In components, use computed:**
```js
const localizedRecordTypes = computed(() =>
  allRecordTypes.map(r => ({ ...r, label: t(r.labelKey) }))
)
```

## Dependencies

Add to `frontend/package.json`:
```json
"vue-i18n": "^9.x"
```

## Components to Refactor

1. `Login.vue` - login form labels, placeholders, buttons, messages
2. `MainLayout.vue` - navigation menu, header, add LangSwitch
3. `InsertRecord.vue` - form labels, record type dropdown
4. `MyRecords.vue` - table headers, buttons, messages
5. `FADExecution.vue` - table headers, action buttons
6. `FADDeliver.vue` - form labels, messages
7. `FADStats.vue` / `SchoolFADStats.vue` / `ClassFADStats.vue` - stats labels
8. `RewardDeliver.vue` - form labels, messages
9. `PraiseReward.vue` - dorm praise labels
10. `RoomClean.vue` - cleaning confirmation labels
11. `BestDormRanking.vue` - ranking labels
12. `NoPhoneList.vue` - phone violation labels
13. `Violations.vue` - electronics violation labels
14. `TeachingTickets.vue` - ticket management labels
15. `StopClass.vue` - suspension list labels
16. `ChangePassword.vue` - password change form
17. `AllData.vue` - data query labels
18. `stores/common.js` - record types, FAD source types (labelKey pattern)
19. `router/index.js` - route meta titles
