# Frontend i18n Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add English language support to the FAD frontend with a language toggle in the header.

**Architecture:** Use vue-i18n for translations, integrate with Element Plus locale switching, persist language choice in localStorage. All hardcoded Chinese text converted to `$t()` calls.

**Tech Stack:** Vue 3, vue-i18n v9, Element Plus, Pinia, localStorage

**Note:** This project has no test framework. Each task includes manual verification steps instead of automated tests.

---

## Task 1: Install vue-i18n and Create i18n Setup

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/i18n/index.js`
- Create: `frontend/src/i18n/locales/zh-CN.json`
- Create: `frontend/src/i18n/locales/en.json`

**Step 1: Install vue-i18n**

```bash
cd frontend && npm install vue-i18n@9
```

**Step 2: Create i18n setup file**

Create `frontend/src/i18n/index.js`:

```js
import { createI18n } from 'vue-i18n'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'

import zhCN from './locales/zh-CN.json'
import enUS from './locales/en.json'

const LOCALE_KEY = 'fad-locale'

function getStoredLocale() {
  return localStorage.getItem(LOCALE_KEY) || 'zh-CN'
}

export const i18n = createI18n({
  legacy: false,
  locale: getStoredLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en': enUS
  }
})

export const elementLocales = {
  'zh-CN': zhCn,
  'en': en
}

export function setLocale(locale) {
  i18n.global.locale.value = locale
  localStorage.setItem(LOCALE_KEY, locale)
  document.querySelector('html').setAttribute('lang', locale === 'zh-CN' ? 'zh' : 'en')
}

export function getLocale() {
  return i18n.global.locale.value
}

export function getElementLocale() {
  return elementLocales[getLocale()]
}
```

**Step 3: Create initial Chinese translation file**

Create `frontend/src/i18n/locales/zh-CN.json`:

```json
{
  "common": {
    "login": "登录",
    "logout": "退出登录",
    "submit": "提交",
    "cancel": "取消",
    "save": "保存",
    "delete": "删除",
    "search": "搜索",
    "reset": "重置",
    "confirm": "确认",
    "loading": "加载中...",
    "noData": "暂无数据",
    "operation": "操作",
    "view": "查看",
    "edit": "编辑",
    "back": "返回",
    "export": "导出",
    "import": "导入",
    "all": "全部",
    "yes": "是",
    "no": "否"
  },
  "nav": {
    "home": "首页",
    "records": "记录管理",
    "insertRecord": "录入记录",
    "myRecords": "我的记录",
    "fad": "FAD管理",
    "fadExecution": "FAD执行",
    "fadDeliver": "FAD通知单发放",
    "schoolFadStats": "学校FAD统计",
    "classFadStats": "班级FAD统计",
    "fadStats": "FAD统计",
    "reward": "Reward管理",
    "rewardDeliver": "Reward通知单发放",
    "room": "寝室管理",
    "praiseReward": "寝室表扬兑奖",
    "roomClean": "寝室清扫确认",
    "bestDorm": "优秀寝室排行",
    "other": "其他",
    "elecViolations": "电子产品违规",
    "phoneList": "手机迟交",
    "teachingTickets": "教学票",
    "stopClass": "停课名单",
    "data": "数据查询",
    "allData": "全部数据",
    "settings": "设置",
    "changePassword": "修改密码",
    "schedule": "日程管理"
  },
  "login": {
    "title": "FAD 学生管理系统",
    "email": "邮箱地址",
    "emailPlaceholder": "请输入邮箱地址",
    "password": "密码",
    "passwordPlaceholder": "请输入密码",
    "forgotPassword": "忘记密码？",
    "loginBtn": "登录",
    "resetPassword": "重置密码",
    "resetPasswordTip": "请输入您的邮箱地址，我们将发送重置密码的链接到您的邮箱。",
    "resetSuccess": "重置密码邮件已发送，请查收"
  },
  "records": {
    "title": "录入记录",
    "myTitle": "我的记录",
    "recordType": "记录类型",
    "student": "学生",
    "studentPlaceholder": "请选择学生",
    "class": "班级",
    "classPlaceholder": "请选择班级",
    "date": "日期",
    "semester": "学期",
    "semesterPlaceholder": "请选择学期",
    "teacher": "教师",
    "remark": "备注",
    "remarkPlaceholder": "请输入备注（可选）",
    "withdraw": "撤回",
    "withdrawConfirm": "确定要撤回这条记录吗？",
    "withdrawSuccess": "撤回成功",
    "insertSuccess": "记录添加成功",
    "accumulateHint": "该学生已累计 {count} 次{type}",
    "fadTriggered": "已自动生成FAD记录",
    "rewardHint": "该学生已累计 {count} 次{type}，可兑换Reward",
    "springTerm": "春季(Spring)",
    "fallTerm": "秋季(Fall)",
    "academicYear": "学年"
  },
  "recordTypes": {
    "FAD": "FAD",
    "Reward": "Reward",
    "morningLate": "早点名迟到",
    "dormLateExit": "寝室迟出",
    "returnViolation": "未按规定返校",
    "meetingRoomViolation": "擅自进入会议室或接待室",
    "dormPraise": "寝室表扬",
    "dormCriticism": "寝室批评",
    "dormTrashNotDumped": "寝室垃圾未倒",
    "onlineClassViolation": "上网课违规使用电子产品",
    "phoneLate2130": "21:30后交还手机(22:00前)",
    "phoneLate2200": "22:00后交还手机",
    "teachingFADTicket": "Teaching FAD Ticket",
    "teachingRewardTicket": "Teaching Reward Ticket"
  },
  "fad": {
    "execution": "FAD执行",
    "deliver": "FAD通知单发放",
    "stats": "FAD统计",
    "schoolStats": "学校FAD统计",
    "classStats": "班级FAD统计",
    "source": "FAD来源",
    "sourceType": "FAD来源类型",
    "executed": "是否已执行",
    "delivered": "是否已发放",
    "offsetByReward": "是否已冲抵",
    "execute": "执行",
    "markDelivered": "标记已发放",
    "count": "FAD数量",
    "warning": "警告",
    "suspensionRecommend": "建议停课",
    "dismissalRecommend": "建议退学"
  },
  "fadSource": {
    "dorm": "寝室类",
    "teach": "教学类",
    "elec": "电子产品违规",
    "other": "其他"
  },
  "reward": {
    "deliver": "Reward通知单发放",
    "offsetExecution": "冲抵执行",
    "offsetRecord": "冲抵记录",
    "count": "Reward数量"
  },
  "room": {
    "praise": "寝室表扬",
    "praiseReward": "寝室表扬兑奖",
    "criticism": "寝室批评",
    "clean": "寝室清扫",
    "cleanConfirm": "寝室清扫确认",
    "bestDorm": "优秀寝室排行",
    "roomNumber": "寝室号",
    "building": "楼栋"
  },
  "validation": {
    "required": "此字段为必填项",
    "emailFormat": "请输入正确的邮箱格式",
    "emailRequired": "请输入邮箱地址",
    "passwordRequired": "请输入密码",
    "selectRequired": "请选择{field}",
    "minLength": "最少需要{min}个字符",
    "maxLength": "最多允许{max}个字符"
  },
  "messages": {
    "success": "操作成功",
    "error": "操作失败",
    "loginSuccess": "登录成功",
    "logoutSuccess": "已退出登录",
    "loadError": "加载失败",
    "submitError": "提交失败",
    "networkError": "网络错误",
    "unauthorized": "未授权，请重新登录",
    "forbidden": "无权限访问",
    "notFound": "资源不存在",
    "serverError": "服务器错误"
  },
  "language": {
    "switch": "语言",
    "zh": "中文",
    "en": "English"
  }
}
```

**Step 4: Create English translation file**

Create `frontend/src/i18n/locales/en.json`:

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
    "reset": "Reset",
    "confirm": "Confirm",
    "loading": "Loading...",
    "noData": "No data",
    "operation": "Actions",
    "view": "View",
    "edit": "Edit",
    "back": "Back",
    "export": "Export",
    "import": "Import",
    "all": "All",
    "yes": "Yes",
    "no": "No"
  },
  "nav": {
    "home": "Home",
    "records": "Records",
    "insertRecord": "Insert Record",
    "myRecords": "My Records",
    "fad": "FAD",
    "fadExecution": "FAD Execution",
    "fadDeliver": "FAD Notification",
    "schoolFadStats": "School FAD Stats",
    "classFadStats": "Class FAD Stats",
    "fadStats": "FAD Stats",
    "reward": "Reward",
    "rewardDeliver": "Reward Notification",
    "room": "Dorm",
    "praiseReward": "Dorm Praise Reward",
    "roomClean": "Dorm Cleaning",
    "bestDorm": "Best Dorm Ranking",
    "other": "Other",
    "elecViolations": "Electronics Violations",
    "phoneList": "Phone Late List",
    "teachingTickets": "Teaching Tickets",
    "stopClass": "Suspension List",
    "data": "Data Query",
    "allData": "All Data",
    "settings": "Settings",
    "changePassword": "Change Password",
    "schedule": "Schedule"
  },
  "login": {
    "title": "FAD Student Management",
    "email": "Email",
    "emailPlaceholder": "Enter email address",
    "password": "Password",
    "passwordPlaceholder": "Enter password",
    "forgotPassword": "Forgot password?",
    "loginBtn": "Login",
    "resetPassword": "Reset Password",
    "resetPasswordTip": "Enter your email address and we will send you a password reset link.",
    "resetSuccess": "Password reset email sent, please check your inbox"
  },
  "records": {
    "title": "Insert Record",
    "myTitle": "My Records",
    "recordType": "Record Type",
    "student": "Student",
    "studentPlaceholder": "Select student",
    "class": "Class",
    "classPlaceholder": "Select class",
    "date": "Date",
    "semester": "Semester",
    "semesterPlaceholder": "Select semester",
    "teacher": "Teacher",
    "remark": "Remark",
    "remarkPlaceholder": "Enter remark (optional)",
    "withdraw": "Withdraw",
    "withdrawConfirm": "Are you sure you want to withdraw this record?",
    "withdrawSuccess": "Withdrawn successfully",
    "insertSuccess": "Record added successfully",
    "accumulateHint": "This student has accumulated {count} {type}",
    "fadTriggered": "FAD record auto-generated",
    "rewardHint": "This student has accumulated {count} {type}, eligible for Reward",
    "springTerm": "Spring",
    "fallTerm": "Fall",
    "academicYear": "Academic Year"
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
  "fad": {
    "execution": "FAD Execution",
    "deliver": "FAD Notification Delivery",
    "stats": "FAD Statistics",
    "schoolStats": "School FAD Statistics",
    "classStats": "Class FAD Statistics",
    "source": "FAD Source",
    "sourceType": "FAD Source Type",
    "executed": "Executed",
    "delivered": "Delivered",
    "offsetByReward": "Offset by Reward",
    "execute": "Execute",
    "markDelivered": "Mark as Delivered",
    "count": "FAD Count",
    "warning": "Warning",
    "suspensionRecommend": "Suspension Recommended",
    "dismissalRecommend": "Dismissal Recommended"
  },
  "fadSource": {
    "dorm": "Dorm",
    "teach": "Teaching",
    "elec": "Electronics Violation",
    "other": "Other"
  },
  "reward": {
    "deliver": "Reward Notification Delivery",
    "offsetExecution": "Offset Execution",
    "offsetRecord": "Offset Record",
    "count": "Reward Count"
  },
  "room": {
    "praise": "Dorm Praise",
    "praiseReward": "Dorm Praise Reward",
    "criticism": "Dorm Criticism",
    "clean": "Dorm Cleaning",
    "cleanConfirm": "Dorm Cleaning Confirmation",
    "bestDorm": "Best Dorm Ranking",
    "roomNumber": "Room Number",
    "building": "Building"
  },
  "validation": {
    "required": "This field is required",
    "emailFormat": "Please enter a valid email format",
    "emailRequired": "Please enter email address",
    "passwordRequired": "Please enter password",
    "selectRequired": "Please select {field}",
    "minLength": "Minimum {min} characters required",
    "maxLength": "Maximum {max} characters allowed"
  },
  "messages": {
    "success": "Operation successful",
    "error": "Operation failed",
    "loginSuccess": "Login successful",
    "logoutSuccess": "Logged out",
    "loadError": "Failed to load",
    "submitError": "Failed to submit",
    "networkError": "Network error",
    "unauthorized": "Unauthorized, please login again",
    "forbidden": "Access denied",
    "notFound": "Resource not found",
    "serverError": "Server error"
  },
  "language": {
    "switch": "Language",
    "zh": "中文",
    "en": "English"
  }
}
```

**Step 5: Verify files created**

```bash
ls -la frontend/src/i18n/
ls -la frontend/src/i18n/locales/
```

Expected: `index.js`, `locales/zh-CN.json`, `locales/en.json`

**Step 6: Commit**

```bash
git add frontend/package.json frontend/src/i18n/
git commit -m "feat(i18n): add vue-i18n setup and translation files

- Install vue-i18n v9
- Create i18n setup with Element Plus integration
- Add zh-CN and en translation files"
```

---

## Task 2: Integrate i18n with Vue App and Element Plus

**Files:**
- Modify: `frontend/src/main.js`
- Create: `frontend/src/components/LangSwitch.vue`

**Step 1: Update main.js to use i18n**

Read current `frontend/src/main.js` first, then modify to add i18n:

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { i18n, getElementLocale } from './i18n'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus, {
  locale: getElementLocale()
})

// Register all icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
```

**Step 2: Create LangSwitch component**

Create `frontend/src/components/LangSwitch.vue`:

```vue
<template>
  <el-dropdown @command="handleCommand" trigger="click">
    <span class="lang-switch">
      <el-icon><Globe /></el-icon>
      <span class="lang-text">{{ currentLangLabel }}</span>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh-CN" :disabled="locale === 'zh-CN'">
          中文
        </el-dropdown-item>
        <el-dropdown-item command="en" :disabled="locale === 'en'">
          English
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Globe } from '@element-plus/icons-vue'
import { setLocale, getLocale } from '@/i18n'

const { locale } = useI18n()

const currentLangLabel = computed(() => {
  return locale.value === 'zh-CN' ? '中文' : 'EN'
})

function handleCommand(lang) {
  setLocale(lang)
  // Reload to apply Element Plus locale change
  window.location.reload()
}
</script>

<style scoped>
.lang-switch {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.lang-switch:hover {
  color: var(--el-color-primary);
}

.lang-text {
  font-size: 13px;
}
</style>
```

**Step 3: Verify dev server starts**

```bash
cd frontend && npm run dev
```

Expected: Server starts without errors on http://localhost:3000

**Step 4: Commit**

```bash
git add frontend/src/main.js frontend/src/components/LangSwitch.vue
git commit -m "feat(i18n): integrate vue-i18n with app and add LangSwitch component

- Configure main.js with i18n and Element Plus locale
- Create LangSwitch dropdown component for header"
```

---

## Task 3: Add LangSwitch to MainLayout Header

**Files:**
- Modify: `frontend/src/layouts/MainLayout.vue`

**Step 1: Read current MainLayout.vue**

Read `frontend/src/layouts/MainLayout.vue` to understand current structure.

**Step 2: Add LangSwitch to header**

Import and add `<LangSwitch />` component to the header area (typically near the user menu/logout button).

Add import:
```js
import LangSwitch from '@/components/LangSwitch.vue'
```

Add to template in header section:
```vue
<LangSwitch />
```

**Step 3: Verify language switch appears**

Open http://localhost:3000, verify LangSwitch appears in header.

**Step 4: Commit**

```bash
git add frontend/src/layouts/MainLayout.vue
git commit -m "feat(i18n): add language switch to main layout header"
```

---

## Task 4: Refactor Login.vue for i18n

**Files:**
- Modify: `frontend/src/views/Login.vue`

**Step 1: Read current Login.vue**

Read `frontend/src/views/Login.vue` to see all hardcoded Chinese text.

**Step 2: Replace hardcoded text with $t() calls**

Update template:
- `"FAD 学生管理系统"` → `{{ $t('login.title') }}`
- `label="邮箱地址"` → `:label="$t('login.email')"`
- `placeholder="请输入邮箱地址"` → `:placeholder="$t('login.emailPlaceholder')"`
- `label="密码"` → `:label="$t('login.password')"`
- `placeholder="请输入密码"` → `:placeholder="$t('login.passwordPlaceholder')"`
- `登录` button → `{{ $t('common.login') }}`
- `忘记密码？` → `{{ $t('login.forgotPassword') }}`

Update script validation rules:
```js
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const rules = {
  email: [
    { required: true, message: () => t('validation.emailRequired'), trigger: 'blur' },
    { type: 'email', message: () => t('validation.emailFormat'), trigger: 'blur' }
  ],
  password: [
    { required: true, message: () => t('validation.passwordRequired'), trigger: 'blur' }
  ]
}
```

Update ElMessage calls:
- `ElMessage.success('登录成功')` → `ElMessage.success(t('messages.loginSuccess'))`

**Step 3: Verify login page displays correctly in both languages**

1. Open http://localhost:3000/login
2. Verify Chinese displays correctly
3. Switch to English using LangSwitch
4. Verify English displays correctly

**Step 4: Commit**

```bash
git add frontend/src/views/Login.vue
git commit -m "feat(i18n): refactor Login.vue for internationalization"
```

---

## Task 5: Refactor common.js Store for i18n

**Files:**
- Modify: `frontend/src/stores/common.js`

**Step 1: Read current common.js**

Read `frontend/src/stores/common.js` to see record types and FAD source types.

**Step 2: Update record types with labelKey**

Change from:
```js
{ value: '早点名迟到', label: '早点名迟到', group: 'F' }
```

To:
```js
{ value: '早点名迟到', labelKey: 'recordTypes.morningLate', group: 'F' }
```

Update all 14 record types:
```js
const allRecordTypes = [
  { value: 'FAD', labelKey: 'recordTypes.FAD', group: 'S' },
  { value: 'Reward', labelKey: 'recordTypes.Reward', group: 'S' },
  { value: '早点名迟到', labelKey: 'recordTypes.morningLate', group: 'F' },
  { value: '寝室迟出', labelKey: 'recordTypes.dormLateExit', group: 'F' },
  { value: '未按规定返校', labelKey: 'recordTypes.returnViolation', group: 'F' },
  { value: '擅自进入会议室或接待室', labelKey: 'recordTypes.meetingRoomViolation', group: 'F' },
  { value: '寝室表扬', labelKey: 'recordTypes.dormPraise', group: 'F' },
  { value: '寝室批评', labelKey: 'recordTypes.dormCriticism', group: 'F' },
  { value: '寝室垃圾未倒', labelKey: 'recordTypes.dormTrashNotDumped', group: 'F' },
  { value: '上网课违规使用电子产品', labelKey: 'recordTypes.onlineClassViolation', group: 'S' },
  { value: '21:30后交还手机(22:00前)', labelKey: 'recordTypes.phoneLate2130', group: 'F' },
  { value: '22:00后交还手机', labelKey: 'recordTypes.phoneLate2200', group: 'F' },
  { value: 'Teaching FAD Ticket', labelKey: 'recordTypes.teachingFADTicket', group: 'F' },
  { value: 'Teaching Reward Ticket', labelKey: 'recordTypes.teachingRewardTicket', group: 'F' }
]
```

**Step 3: Update FAD source types with labelKey**

```js
const fadSourceTypes = [
  { labelKey: 'fadSource.dorm', value: 'dorm' },
  { labelKey: 'fadSource.teach', value: 'teach' },
  { labelKey: 'fadSource.elec', value: 'elec' },
  { labelKey: 'fadSource.other', value: 'other' }
]
```

**Step 4: Update semesters**

```js
function generateSemesters() {
  semesters.value = [
    { value: '春季(Spring)', labelKey: 'records.springTerm' },
    { value: '秋季(Fall)', labelKey: 'records.fallTerm' }
  ]
}
```

**Step 5: Commit**

```bash
git add frontend/src/stores/common.js
git commit -m "feat(i18n): update common store with i18n labelKeys

- Add labelKey to all record types (value stays Chinese for DB)
- Add labelKey to FAD source types
- Update semester generation with labelKeys"
```

---

## Task 6: Refactor MainLayout.vue Navigation for i18n

**Files:**
- Modify: `frontend/src/layouts/MainLayout.vue`

**Step 1: Read current MainLayout.vue**

Understand the navigation menu structure.

**Step 2: Replace navigation labels with $t() calls**

Replace all hardcoded Chinese navigation labels with i18n keys:
- `首页` → `$t('nav.home')`
- `记录管理` → `$t('nav.records')`
- `录入记录` → `$t('nav.insertRecord')`
- etc.

**Step 3: Update logout and other header text**

- `退出登录` → `$t('common.logout')`

**Step 4: Verify navigation displays in both languages**

**Step 5: Commit**

```bash
git add frontend/src/layouts/MainLayout.vue
git commit -m "feat(i18n): refactor MainLayout navigation for i18n"
```

---

## Task 7: Refactor InsertRecord.vue for i18n

**Files:**
- Modify: `frontend/src/views/records/InsertRecord.vue`

**Step 1: Read current InsertRecord.vue**

**Step 2: Add useI18n and update template**

Add to script:
```js
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
```

Create computed for localized record types:
```js
import { useCommonStore } from '@/stores/common'
const commonStore = useCommonStore()

const localizedRecordTypes = computed(() =>
  commonStore.allRecordTypes.map(r => ({ ...r, label: t(r.labelKey) }))
)
```

Replace all Chinese text with `$t()` calls.

**Step 3: Update validation rules**

**Step 4: Verify form displays correctly**

**Step 5: Commit**

```bash
git add frontend/src/views/records/InsertRecord.vue
git commit -m "feat(i18n): refactor InsertRecord.vue for i18n"
```

---

## Task 8: Refactor MyRecords.vue for i18n

**Files:**
- Modify: `frontend/src/views/records/MyRecords.vue`

**Step 1: Read and refactor**

Replace all table headers, buttons, messages with i18n calls.

**Step 2: Commit**

```bash
git add frontend/src/views/records/MyRecords.vue
git commit -m "feat(i18n): refactor MyRecords.vue for i18n"
```

---

## Task 9: Refactor FAD Module Views for i18n

**Files:**
- Modify: `frontend/src/views/fad/FADExecution.vue`
- Modify: `frontend/src/views/fad/FADDeliver.vue`
- Modify: `frontend/src/views/fad/FADStats.vue`
- Modify: `frontend/src/views/fad/SchoolFADStats.vue`
- Modify: `frontend/src/views/fad/ClassFADStats.vue`

**Step 1: Refactor each file**

For each file, replace Chinese text with i18n calls.

**Step 2: Commit**

```bash
git add frontend/src/views/fad/
git commit -m "feat(i18n): refactor FAD module views for i18n"
```

---

## Task 10: Refactor Reward Module for i18n

**Files:**
- Modify: `frontend/src/views/reward/RewardDeliver.vue`

**Step 1: Refactor**

**Step 2: Commit**

```bash
git add frontend/src/views/reward/
git commit -m "feat(i18n): refactor Reward module for i18n"
```

---

## Task 11: Refactor Room Module for i18n

**Files:**
- Modify: `frontend/src/views/room/PraiseReward.vue`
- Modify: `frontend/src/views/room/RoomClean.vue`
- Modify: `frontend/src/views/room/BestDormRanking.vue`

**Step 1: Refactor each file**

**Step 2: Commit**

```bash
git add frontend/src/views/room/
git commit -m "feat(i18n): refactor Room module views for i18n"
```

---

## Task 12: Refactor Other Views for i18n

**Files:**
- Modify: `frontend/src/views/phone/NoPhoneList.vue`
- Modify: `frontend/src/views/elec/Violations.vue`
- Modify: `frontend/src/views/TeachingTickets.vue`
- Modify: `frontend/src/views/StopClass.vue`
- Modify: `frontend/src/views/data/AllData.vue`
- Modify: `frontend/src/views/settings/ChangePassword.vue`

**Step 1: Refactor each file**

**Step 2: Commit**

```bash
git add frontend/src/views/
git commit -m "feat(i18n): refactor remaining views for i18n"
```

---

## Task 13: Update Router Meta Titles for i18n

**Files:**
- Modify: `frontend/src/router/index.js`

**Step 1: Read router config**

**Step 2: Change meta.title to use i18n keys**

Change from:
```js
meta: { title: '首页' }
```

To:
```js
meta: { titleKey: 'nav.home' }
```

**Step 3: Update document.title logic (if any) to use i18n**

**Step 4: Commit**

```bash
git add frontend/src/router/index.js
git commit -m "feat(i18n): update router meta titles with i18n keys"
```

---

## Task 14: Final Testing and Cleanup

**Step 1: Full app testing**

1. Start dev server: `cd frontend && npm run dev`
2. Test login page in both languages
3. Test all navigation items
4. Test record insertion form
5. Test FAD/Reward delivery forms
6. Test all statistics views
7. Verify Element Plus components (date picker, pagination) switch languages

**Step 2: Build production**

```bash
cd frontend && npm run build:prod
```

Expected: Build succeeds without errors

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(i18n): complete frontend internationalization

- Add vue-i18n with zh-CN and en locales
- Add language switch in header
- Refactor all views for i18n
- Update stores and router for i18n support"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Install vue-i18n, create setup and translation files | package.json, i18n/ |
| 2 | Integrate with Vue app, create LangSwitch | main.js, LangSwitch.vue |
| 3 | Add LangSwitch to header | MainLayout.vue |
| 4 | Refactor Login.vue | Login.vue |
| 5 | Update common store with labelKeys | common.js |
| 6 | Refactor navigation | MainLayout.vue |
| 7 | Refactor InsertRecord | InsertRecord.vue |
| 8 | Refactor MyRecords | MyRecords.vue |
| 9 | Refactor FAD views | fad/*.vue |
| 10 | Refactor Reward views | reward/*.vue |
| 11 | Refactor Room views | room/*.vue |
| 12 | Refactor other views | phone/, elec/, etc. |
| 13 | Update router titles | router/index.js |
| 14 | Final testing | - |
