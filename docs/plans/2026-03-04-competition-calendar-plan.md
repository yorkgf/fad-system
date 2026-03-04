# Competition Calendar (竞赛日历) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a competition calendar module with two pages — a calendar view (month/week) with collapsible sidebar, and a CRUD management page — accessible to S/A/B/T/F groups with owner-based edit permissions.

**Architecture:** New backend route file (`competition.js`) with CRUD endpoints on `Competition_Events` collection in GHA database. Two new Vue views (`CompetitionCalendar.vue` and `CompetitionManage.vue`) using Element Plus components. Permission group constants added to both frontend and backend `userGroups.js`. i18n keys added to both locale files.

**Tech Stack:** Express + MongoDB (backend), Vue 3 Composition API + Element Plus + el-calendar (frontend), vue-i18n for translations.

---

### Task 1: Add Competition Collection Constant and Permission Groups (Backend)

**Files:**
- Modify: `backend/src/utils/db.js:73-92` (Collections object)
- Modify: `backend/src/utils/userGroups.js:26-32` (add new group constant)

**Step 1: Add `CompetitionEvents` to Collections in `db.js`**

In `backend/src/utils/db.js`, add to the `Collections` object (after line 91, before the closing `}`):

```javascript
  StopClassRecords: 'Stop_Class_Records',
  CompetitionEvents: 'Competition_Events'
```

**Step 2: Add competition permission groups to `backend/src/utils/userGroups.js`**

After the `ADMIN_GROUPS` constant (line 43), add:

```javascript
// 竞赛日历访问权限组 (查看日历)
const COMPETITION_ACCESS_GROUPS = [
  UserGroup.SYSTEM,
  UserGroup.ADMIN_A,
  UserGroup.ADMIN_B,
  UserGroup.TEACHER,
  UserGroup.FACULTY
]

// 竞赛管理权限组 (创建/编辑/删除)
const COMPETITION_MANAGE_GROUPS = [
  UserGroup.SYSTEM,
  UserGroup.ADMIN_B,
  UserGroup.TEACHER,
  UserGroup.FACULTY
]
```

Add helper functions after the existing helpers (after `hasFADExecutionAccess`):

```javascript
// 检查是否有竞赛日历访问权限
function hasCompetitionAccess(userGroup) {
  return COMPETITION_ACCESS_GROUPS.includes(userGroup)
}

// 检查是否有竞赛管理权限
function hasCompetitionManageAccess(userGroup) {
  return COMPETITION_MANAGE_GROUPS.includes(userGroup)
}
```

Add to the `module.exports` object:

```javascript
  COMPETITION_ACCESS_GROUPS,
  COMPETITION_MANAGE_GROUPS,
  hasCompetitionAccess,
  hasCompetitionManageAccess
```

**Step 3: Commit**

```bash
git add backend/src/utils/db.js backend/src/utils/userGroups.js
git commit -m "feat(competition): add collection constant and permission groups"
```

---

### Task 2: Create Backend Competition Routes

**Files:**
- Create: `backend/src/routes/competition.js`

**Step 1: Create the competition route file**

Create `backend/src/routes/competition.js`:

```javascript
const { Router } = require('express')
const { ObjectId } = require('mongodb')
const { authMiddleware } = require('../utils/auth.js')
const { getCollection, Collections } = require('../utils/db.js')
const { UserGroup, COMPETITION_MANAGE_GROUPS } = require('../utils/userGroups.js')

const router = Router()

// GET /events - 查询竞赛事件列表
// 支持: ?start=ISO&end=ISO (日期范围), ?category=学术 (类别筛选), ?search=关键词
router.get('/events', authMiddleware, async (req, res) => {
  try {
    const { start, end, category, search } = req.query
    const filter = {}

    // 日期范围筛选（基于竞赛日期）
    if (start || end) {
      filter.竞赛开始日期 = {}
      if (start) filter.竞赛开始日期.$lte = new Date(end || '2099-12-31')
      if (end) {
        filter.竞赛结束日期 = { $gte: new Date(start || '2000-01-01') }
      }
      // 事件与查询范围有重叠即返回
      // start <= 竞赛结束日期 AND end >= 竞赛开始日期
      delete filter.竞赛开始日期
      filter.$and = []
      if (start) filter.$and.push({ 竞赛结束日期: { $gte: new Date(start) } })
      if (end) filter.$and.push({ 竞赛开始日期: { $lte: new Date(end) } })
      if (filter.$and.length === 0) delete filter.$and
    }

    if (category) {
      filter.竞赛类别 = category
    }

    if (search) {
      filter.竞赛名称 = { $regex: search, $options: 'i' }
    }

    const collection = getCollection(Collections.CompetitionEvents)
    const events = await collection
      .find(filter)
      .sort({ 竞赛开始日期: 1 })
      .toArray()

    res.json({ success: true, data: events })
  } catch (error) {
    console.error('获取竞赛事件失败:', error)
    res.status(500).json({ success: false, error: '获取竞赛事件失败' })
  }
})

// POST /events - 创建竞赛事件
router.post('/events', authMiddleware, async (req, res) => {
  try {
    // 权限检查：仅 S, B, T, F 可创建
    if (!COMPETITION_MANAGE_GROUPS.includes(req.user.group)) {
      return res.status(403).json({ success: false, error: '无权限创建竞赛事件' })
    }

    const { 竞赛名称, 竞赛类别, 报名开始日期, 报名截止日期, 竞赛开始日期, 竞赛结束日期, 参与对象, 地点, 报名链接, 描述 } = req.body

    // 必填字段验证
    if (!竞赛名称 || !竞赛开始日期 || !竞赛结束日期 || !竞赛类别) {
      return res.status(400).json({ success: false, error: '竞赛名称、类别、开始日期和结束日期为必填项' })
    }

    // 日期验证
    const startDate = new Date(竞赛开始日期)
    const endDate = new Date(竞赛结束日期)
    if (endDate < startDate) {
      return res.status(400).json({ success: false, error: '竞赛结束日期不能早于开始日期' })
    }

    if (报名开始日期 && 报名截止日期) {
      const regStart = new Date(报名开始日期)
      const regEnd = new Date(报名截止日期)
      if (regEnd < regStart) {
        return res.status(400).json({ success: false, error: '报名截止日期不能早于报名开始日期' })
      }
    }

    const now = new Date()
    const event = {
      竞赛名称,
      竞赛类别,
      报名开始日期: 报名开始日期 ? new Date(报名开始日期) : null,
      报名截止日期: 报名截止日期 ? new Date(报名截止日期) : null,
      竞赛开始日期: startDate,
      竞赛结束日期: endDate,
      参与对象: 参与对象 || null,
      地点: 地点 || null,
      报名链接: 报名链接 || null,
      描述: 描述 || null,
      创建人: req.user.name,
      创建人组别: req.user.group,
      创建时间: now,
      更新时间: now
    }

    const collection = getCollection(Collections.CompetitionEvents)
    const result = await collection.insertOne(event)

    res.json({ success: true, data: { ...event, _id: result.insertedId } })
  } catch (error) {
    console.error('创建竞赛事件失败:', error)
    res.status(500).json({ success: false, error: '创建竞赛事件失败' })
  }
})

// PUT /events/:id - 更新竞赛事件
router.put('/events/:id', authMiddleware, async (req, res) => {
  try {
    // 权限检查：仅 S, B, T, F 可编辑
    if (!COMPETITION_MANAGE_GROUPS.includes(req.user.group)) {
      return res.status(403).json({ success: false, error: '无权限编辑竞赛事件' })
    }

    const { id } = req.params
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: '无效的事件ID' })
    }

    const collection = getCollection(Collections.CompetitionEvents)
    const existing = await collection.findOne({ _id: new ObjectId(id) })

    if (!existing) {
      return res.status(404).json({ success: false, error: '事件不存在' })
    }

    // 非S组只能编辑自己创建的事件
    if (req.user.group !== UserGroup.SYSTEM && existing.创建人 !== req.user.name) {
      return res.status(403).json({ success: false, error: '只能编辑自己创建的事件' })
    }

    const { 竞赛名称, 竞赛类别, 报名开始日期, 报名截止日期, 竞赛开始日期, 竞赛结束日期, 参与对象, 地点, 报名链接, 描述 } = req.body

    if (!竞赛名称 || !竞赛开始日期 || !竞赛结束日期 || !竞赛类别) {
      return res.status(400).json({ success: false, error: '竞赛名称、类别、开始日期和结束日期为必填项' })
    }

    const startDate = new Date(竞赛开始日期)
    const endDate = new Date(竞赛结束日期)
    if (endDate < startDate) {
      return res.status(400).json({ success: false, error: '竞赛结束日期不能早于开始日期' })
    }

    if (报名开始日期 && 报名截止日期) {
      if (new Date(报名截止日期) < new Date(报名开始日期)) {
        return res.status(400).json({ success: false, error: '报名截止日期不能早于报名开始日期' })
      }
    }

    const updateData = {
      竞赛名称,
      竞赛类别,
      报名开始日期: 报名开始日期 ? new Date(报名开始日期) : null,
      报名截止日期: 报名截止日期 ? new Date(报名截止日期) : null,
      竞赛开始日期: startDate,
      竞赛结束日期: endDate,
      参与对象: 参与对象 || null,
      地点: 地点 || null,
      报名链接: 报名链接 || null,
      描述: 描述 || null,
      更新时间: new Date()
    }

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    res.json({ success: true, data: { ...existing, ...updateData } })
  } catch (error) {
    console.error('更新竞赛事件失败:', error)
    res.status(500).json({ success: false, error: '更新竞赛事件失败' })
  }
})

// DELETE /events/:id - 删除竞赛事件
router.delete('/events/:id', authMiddleware, async (req, res) => {
  try {
    // 权限检查：仅 S, B, T, F 可删除
    if (!COMPETITION_MANAGE_GROUPS.includes(req.user.group)) {
      return res.status(403).json({ success: false, error: '无权限删除竞赛事件' })
    }

    const { id } = req.params
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: '无效的事件ID' })
    }

    const collection = getCollection(Collections.CompetitionEvents)
    const existing = await collection.findOne({ _id: new ObjectId(id) })

    if (!existing) {
      return res.status(404).json({ success: false, error: '事件不存在' })
    }

    // 非S组只能删除自己创建的事件
    if (req.user.group !== UserGroup.SYSTEM && existing.创建人 !== req.user.name) {
      return res.status(403).json({ success: false, error: '只能删除自己创建的事件' })
    }

    await collection.deleteOne({ _id: new ObjectId(id) })

    res.json({ success: true })
  } catch (error) {
    console.error('删除竞赛事件失败:', error)
    res.status(500).json({ success: false, error: '删除竞赛事件失败' })
  }
})

module.exports = router
```

**Step 2: Commit**

```bash
git add backend/src/routes/competition.js
git commit -m "feat(competition): add backend CRUD routes for competition events"
```

---

### Task 3: Register Competition Routes in Backend Entry

**Files:**
- Modify: `backend/src/index.js:13-20` (imports), `backend/src/index.js:82-83` (route registration)

**Step 1: Add import**

In `backend/src/index.js`, after line 20 (`const scheduleRoutes = require('./routes/schedule.js')`), add:

```javascript
const competitionRoutes = require('./routes/competition.js')
```

**Step 2: Register route**

After line 82 (`app.use('/api/schedule', scheduleRoutes)`), add:

```javascript
app.use('/api/competition', competitionRoutes)
```

**Step 3: Commit**

```bash
git add backend/src/index.js
git commit -m "feat(competition): register competition routes in backend entry"
```

---

### Task 4: Add Frontend Permission Groups

**Files:**
- Modify: `frontend/src/utils/userGroups.js:27-33` (add new group constants)

**Step 1: Add competition groups**

In `frontend/src/utils/userGroups.js`, after `ADMIN_GROUPS` (line 44), add:

```javascript
// 竞赛日历访问权限组 (查看日历)
export const COMPETITION_ACCESS_GROUPS = [
  UserGroup.SYSTEM,
  UserGroup.ADMIN_A,
  UserGroup.ADMIN_B,
  UserGroup.TEACHER,
  UserGroup.FACULTY
]

// 竞赛管理权限组 (创建/编辑/删除)
export const COMPETITION_MANAGE_GROUPS = [
  UserGroup.SYSTEM,
  UserGroup.ADMIN_B,
  UserGroup.TEACHER,
  UserGroup.FACULTY
]
```

Add helper functions:

```javascript
// 检查是否有竞赛日历访问权限
export function hasCompetitionAccess(userGroup) {
  return COMPETITION_ACCESS_GROUPS.includes(userGroup)
}

// 检查是否有竞赛管理权限
export function hasCompetitionManageAccess(userGroup) {
  return COMPETITION_MANAGE_GROUPS.includes(userGroup)
}
```

**Step 2: Commit**

```bash
git add frontend/src/utils/userGroups.js
git commit -m "feat(competition): add frontend permission group constants"
```

---

### Task 5: Create Frontend API Layer

**Files:**
- Create: `frontend/src/api/competition.js`

**Step 1: Create the API file**

Create `frontend/src/api/competition.js`:

```javascript
import request from './request'

// 获取竞赛事件列表
export function getCompetitionEvents(params) {
  return request.get('/competition/events', { params })
}

// 创建竞赛事件
export function createCompetitionEvent(data) {
  return request.post('/competition/events', data)
}

// 更新竞赛事件
export function updateCompetitionEvent(id, data) {
  return request.put(`/competition/events/${id}`, data)
}

// 删除竞赛事件
export function deleteCompetitionEvent(id) {
  return request.delete(`/competition/events/${id}`)
}
```

**Step 2: Commit**

```bash
git add frontend/src/api/competition.js
git commit -m "feat(competition): add frontend API layer"
```

---

### Task 6: Add i18n Translation Keys

**Files:**
- Modify: `frontend/src/i18n/locales/zh-CN.json` (nav section + new competition section)
- Modify: `frontend/src/i18n/locales/en.json` (nav section + new competition section)

**Step 1: Add Chinese translations**

In `zh-CN.json`, add to `nav` section (after `"changePassword": "修改密码"` line 119):

```json
    "competitionCalendar": "竞赛日历",
    "competitionCalendarSubtitle": "查看竞赛日程安排",
    "competitionManage": "竞赛管理",
    "competitionManageSubtitle": "创建和管理竞赛事件"
```

Add a new `competition` section (as a top-level key, after the `nav` section):

```json
  "competition": {
    "title": "竞赛日历",
    "manageTitle": "竞赛管理",
    "eventName": "竞赛名称",
    "category": "竞赛类别",
    "registrationStart": "报名开始日期",
    "registrationEnd": "报名截止日期",
    "eventStart": "竞赛开始日期",
    "eventEnd": "竞赛结束日期",
    "participants": "参与对象",
    "location": "地点",
    "registrationLink": "报名链接",
    "description": "描述",
    "creator": "创建人",
    "createEvent": "新建竞赛",
    "editEvent": "编辑竞赛",
    "deleteEvent": "删除竞赛",
    "deleteConfirm": "确定要删除竞赛「{name}」吗？",
    "monthView": "月视图",
    "weekView": "周视图",
    "thisWeek": "本周竞赛",
    "nextWeek": "下周竞赛",
    "noEvents": "暂无竞赛",
    "sidebar": "竞赛列表",
    "categoryAcademic": "学术",
    "categorySports": "体育",
    "categoryArts": "艺术",
    "categoryTech": "科技",
    "categoryOther": "其他",
    "allCategories": "全部类别",
    "allParticipants": "全校",
    "eventDetail": "竞赛详情",
    "registrationPeriod": "报名时间",
    "eventPeriod": "竞赛时间",
    "createSuccess": "竞赛创建成功",
    "updateSuccess": "竞赛更新成功",
    "deleteSuccess": "竞赛删除成功",
    "dateRangeError": "结束日期不能早于开始日期",
    "regDateRangeError": "报名截止日期不能早于报名开始日期"
  }
```

**Step 2: Add English translations**

In `en.json`, add to `nav` section (after `"changePassword": "Change Password"` line 119):

```json
    "competitionCalendar": "Competition Calendar",
    "competitionCalendarSubtitle": "View competition schedules",
    "competitionManage": "Competition Management",
    "competitionManageSubtitle": "Create and manage competitions"
```

Add a new `competition` section:

```json
  "competition": {
    "title": "Competition Calendar",
    "manageTitle": "Competition Management",
    "eventName": "Competition Name",
    "category": "Category",
    "registrationStart": "Registration Start",
    "registrationEnd": "Registration Deadline",
    "eventStart": "Start Date",
    "eventEnd": "End Date",
    "participants": "Participants",
    "location": "Location",
    "registrationLink": "Registration Link",
    "description": "Description",
    "creator": "Created By",
    "createEvent": "New Competition",
    "editEvent": "Edit Competition",
    "deleteEvent": "Delete Competition",
    "deleteConfirm": "Are you sure you want to delete \"{name}\"?",
    "monthView": "Month",
    "weekView": "Week",
    "thisWeek": "This Week",
    "nextWeek": "Next Week",
    "noEvents": "No competitions",
    "sidebar": "Competition List",
    "categoryAcademic": "Academic",
    "categorySports": "Sports",
    "categoryArts": "Arts",
    "categoryTech": "Technology",
    "categoryOther": "Other",
    "allCategories": "All Categories",
    "allParticipants": "All Students",
    "eventDetail": "Competition Details",
    "registrationPeriod": "Registration Period",
    "eventPeriod": "Competition Period",
    "createSuccess": "Competition created",
    "updateSuccess": "Competition updated",
    "deleteSuccess": "Competition deleted",
    "dateRangeError": "End date cannot be before start date",
    "regDateRangeError": "Registration deadline cannot be before registration start"
  }
```

**Step 3: Commit**

```bash
git add frontend/src/i18n/locales/zh-CN.json frontend/src/i18n/locales/en.json
git commit -m "feat(competition): add i18n translation keys for competition module"
```

---

### Task 7: Add Frontend Routes and Navigation Guard

**Files:**
- Modify: `frontend/src/router/index.js:1-4` (imports), routes array, and guard logic

**Step 1: Add import**

In `frontend/src/router/index.js` line 4, add `COMPETITION_ACCESS_GROUPS, COMPETITION_MANAGE_GROUPS` to the import:

```javascript
import { UserGroup, FAD_EXECUTION_GROUPS, ADMIN_GROUPS, SCHEDULE_ACCESS_GROUPS, COMPETITION_ACCESS_GROUPS, COMPETITION_MANAGE_GROUPS } from '@/utils/userGroups'
```

**Step 2: Add routes**

After the schedule routes (before the closing `]` of the children array, after line 167), add:

```javascript
      // 竞赛日历模块
      {
        path: 'competition/calendar',
        name: 'CompetitionCalendar',
        component: () => import('@/views/competition/CompetitionCalendar.vue'),
        meta: {
          titleKey: 'nav.competitionCalendar',
          allowedGroups: ['S', 'A', 'B', 'T', 'F']
        }
      },
      {
        path: 'competition/manage',
        name: 'CompetitionManage',
        component: () => import('@/views/competition/CompetitionManage.vue'),
        meta: {
          titleKey: 'nav.competitionManage',
          allowedGroups: ['S', 'B', 'T', 'F']
        }
      }
```

**Step 3: Add F group to allowed routes and add guard**

In `limitedAllowedRoutes` (line 178), add competition calendar path:

```javascript
const limitedAllowedRoutes = ['/', '/records/insert', '/records/my', '/settings/password', '/settings/profile', '/login', '/competition/calendar']
```

Add guard logic before the schedule guard (before `} else if (to.path.startsWith('/schedule')) {` around line 244):

```javascript
  } else if (to.path.startsWith('/competition')) {
    // 竞赛模块权限检查
    if (to.path === '/competition/manage') {
      // 管理页面：S, B, T, F
      if (COMPETITION_MANAGE_GROUPS.includes(userStore.userGroup)) {
        next()
      } else {
        next('/')
      }
    } else {
      // 日历页面：S, A, B, T, F
      if (COMPETITION_ACCESS_GROUPS.includes(userStore.userGroup)) {
        next()
      } else {
        next('/')
      }
    }
```

**Step 4: Commit**

```bash
git add frontend/src/router/index.js
git commit -m "feat(competition): add frontend routes and navigation guards"
```

---

### Task 8: Add Function Cards to MainLayout

**Files:**
- Modify: `frontend/src/layouts/MainLayout.vue:230-237` (baseCards array)

**Step 1: Add two function cards**

In `MainLayout.vue`, add to the `baseCards` array (after the schedule card object, before the closing `]` of baseCards):

```javascript
    ,
    {
      titleKey: 'nav.competitionCalendar',
      subtitleKey: 'nav.competitionCalendarSubtitle',
      path: '/competition/calendar',
      icon: 'Trophy',
      color: 'linear-gradient(135deg, #ffd89b 0%, #f28410 100%)',
      groups: ['S', 'A', 'B', 'T', 'F']
    },
    {
      titleKey: 'nav.competitionManage',
      subtitleKey: 'nav.competitionManageSubtitle',
      path: '/competition/manage',
      icon: 'SetUp',
      color: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      groups: ['S', 'B', 'T', 'F']
    }
```

Also add `Trophy` and `SetUp` to the Element Plus icon imports if not already imported. Check the `<script setup>` imports — Element Plus icons are auto-registered via `component :is`, so no explicit import is needed.

**Step 2: Commit**

```bash
git add frontend/src/layouts/MainLayout.vue
git commit -m "feat(competition): add function cards to home dashboard"
```

---

### Task 9: Create Competition Management Page

**Files:**
- Create: `frontend/src/views/competition/CompetitionManage.vue`

**Step 1: Create the management page**

Create `frontend/src/views/competition/CompetitionManage.vue`:

```vue
<template>
  <div class="competition-manage">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filterCategory" :placeholder="t('competition.allCategories')" clearable style="width: 140px">
        <el-option v-for="cat in categories" :key="cat.value" :label="t(cat.labelKey)" :value="cat.value" />
      </el-select>
      <el-input v-model="searchText" :placeholder="t('common.search')" clearable style="width: 200px" @keyup.enter="loadEvents">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">{{ t('competition.createEvent') }}</el-button>
    </div>

    <!-- 事件列表 -->
    <el-table :data="filteredEvents" stripe v-loading="loading" style="width: 100%">
      <el-table-column prop="竞赛名称" :label="t('competition.eventName')" min-width="160" />
      <el-table-column :label="t('competition.category')" width="100">
        <template #default="{ row }">
          <el-tag :type="categoryTagType(row.竞赛类别)" size="small">{{ categoryLabel(row.竞赛类别) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('competition.eventPeriod')" min-width="180">
        <template #default="{ row }">
          {{ formatDate(row.竞赛开始日期) }} ~ {{ formatDate(row.竞赛结束日期) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('competition.registrationEnd')" width="120">
        <template #default="{ row }">
          {{ row.报名截止日期 ? formatDate(row.报名截止日期) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="参与对象" :label="t('competition.participants')" width="100" />
      <el-table-column prop="创建人" :label="t('competition.creator')" width="100" />
      <el-table-column :label="t('common.actions')" width="140" fixed="right">
        <template #default="{ row }">
          <template v-if="canEdit(row)">
            <el-button link type="primary" size="small" @click="openEditDialog(row)">{{ t('common.edit') }}</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">{{ t('common.delete') }}</el-button>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? t('competition.editEvent') : t('competition.createEvent')" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item :label="t('competition.eventName')" prop="竞赛名称">
          <el-input v-model="formData.竞赛名称" />
        </el-form-item>
        <el-form-item :label="t('competition.category')" prop="竞赛类别">
          <el-select v-model="formData.竞赛类别" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.value" :label="t(cat.labelKey)" :value="cat.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('competition.eventPeriod')" prop="竞赛开始日期">
          <el-date-picker v-model="eventDateRange" type="daterange" :start-placeholder="t('common.startDate')" :end-placeholder="t('common.endDate')" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item :label="t('competition.registrationPeriod')">
          <el-date-picker v-model="regDateRange" type="daterange" :start-placeholder="t('common.startDate')" :end-placeholder="t('common.endDate')" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item :label="t('competition.participants')">
          <el-input v-model="formData.参与对象" :placeholder="t('competition.allParticipants')" />
        </el-form-item>
        <el-form-item :label="t('competition.location')">
          <el-input v-model="formData.地点" />
        </el-form-item>
        <el-form-item :label="t('competition.registrationLink')">
          <el-input v-model="formData.报名链接" placeholder="https://" />
        </el-form-item>
        <el-form-item :label="t('competition.description')">
          <el-input v-model="formData.描述" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { getCompetitionEvents, createCompetitionEvent, updateCompetitionEvent, deleteCompetitionEvent } from '@/api/competition'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

const { t } = useI18n()
const userStore = useUserStore()

// 竞赛类别
const categories = [
  { value: '学术', labelKey: 'competition.categoryAcademic' },
  { value: '体育', labelKey: 'competition.categorySports' },
  { value: '艺术', labelKey: 'competition.categoryArts' },
  { value: '科技', labelKey: 'competition.categoryTech' },
  { value: '其他', labelKey: 'competition.categoryOther' }
]

const categoryTagMap = { '学术': '', '体育': 'success', '艺术': 'warning', '科技': 'danger', '其他': 'info' }

function categoryTagType(cat) { return categoryTagMap[cat] || 'info' }
function categoryLabel(cat) {
  const found = categories.find(c => c.value === cat)
  return found ? t(found.labelKey) : cat
}

// 状态
const loading = ref(false)
const submitting = ref(false)
const events = ref([])
const filterCategory = ref('')
const searchText = ref('')
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const formRef = ref(null)

const formData = ref({
  竞赛名称: '',
  竞赛类别: '',
  参与对象: '',
  地点: '',
  报名链接: '',
  描述: ''
})

const eventDateRange = ref(null)
const regDateRange = ref(null)

const formRules = {
  竞赛名称: [{ required: true, message: () => t('validation.required'), trigger: 'blur' }],
  竞赛类别: [{ required: true, message: () => t('validation.required'), trigger: 'change' }],
  竞赛开始日期: [{ required: true, validator: (rule, value, callback) => {
    if (!eventDateRange.value || !eventDateRange.value[0]) {
      callback(new Error(t('validation.required')))
    } else {
      callback()
    }
  }, trigger: 'change' }]
}

// 过滤后的事件列表
const filteredEvents = computed(() => {
  let result = events.value
  if (filterCategory.value) {
    result = result.filter(e => e.竞赛类别 === filterCategory.value)
  }
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(e => e.竞赛名称.toLowerCase().includes(keyword))
  }
  return result
})

// 权限判断：S组可编辑所有，其他组只能编辑自己创建的
function canEdit(row) {
  return userStore.userGroup === 'S' || row.创建人 === userStore.username
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 加载事件
async function loadEvents() {
  loading.value = true
  try {
    const res = await getCompetitionEvents()
    events.value = res.data || []
  } catch (error) {
    ElMessage.error(t('common.failed'))
  } finally {
    loading.value = false
  }
}

// 打开创建对话框
function openCreateDialog() {
  isEditing.value = false
  editingId.value = null
  formData.value = { 竞赛名称: '', 竞赛类别: '', 参与对象: '', 地点: '', 报名链接: '', 描述: '' }
  eventDateRange.value = null
  regDateRange.value = null
  dialogVisible.value = true
}

// 打开编辑对话框
function openEditDialog(row) {
  isEditing.value = true
  editingId.value = row._id
  formData.value = {
    竞赛名称: row.竞赛名称,
    竞赛类别: row.竞赛类别,
    参与对象: row.参与对象 || '',
    地点: row.地点 || '',
    报名链接: row.报名链接 || '',
    描述: row.描述 || ''
  }
  eventDateRange.value = [formatDate(row.竞赛开始日期), formatDate(row.竞赛结束日期)]
  regDateRange.value = row.报名开始日期 && row.报名截止日期
    ? [formatDate(row.报名开始日期), formatDate(row.报名截止日期)]
    : null
  dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()

  submitting.value = true
  try {
    const payload = {
      ...formData.value,
      竞赛开始日期: eventDateRange.value[0],
      竞赛结束日期: eventDateRange.value[1],
      报名开始日期: regDateRange.value ? regDateRange.value[0] : null,
      报名截止日期: regDateRange.value ? regDateRange.value[1] : null,
      报名链接: formData.value.报名链接 || null
    }

    if (isEditing.value) {
      await updateCompetitionEvent(editingId.value, payload)
      ElMessage.success(t('competition.updateSuccess'))
    } else {
      await createCompetitionEvent(payload)
      ElMessage.success(t('competition.createSuccess'))
    }

    dialogVisible.value = false
    loadEvents()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || t('common.failed'))
  } finally {
    submitting.value = false
  }
}

// 删除事件
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      t('competition.deleteConfirm', { name: row.竞赛名称 }),
      t('common.warning'),
      { confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'), type: 'warning' }
    )
    await deleteCompetitionEvent(row._id)
    ElMessage.success(t('competition.deleteSuccess'))
    loadEvents()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || t('common.failed'))
    }
  }
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}
</style>
```

**Step 2: Commit**

```bash
git add frontend/src/views/competition/CompetitionManage.vue
git commit -m "feat(competition): create competition management page"
```

---

### Task 10: Create Competition Calendar Page

**Files:**
- Create: `frontend/src/views/competition/CompetitionCalendar.vue`

**Step 1: Create the calendar page**

Create `frontend/src/views/competition/CompetitionCalendar.vue`:

```vue
<template>
  <div class="competition-calendar">
    <div class="calendar-layout">
      <!-- 左侧：日历区 -->
      <div class="calendar-area">
        <!-- 工具栏 -->
        <div class="calendar-toolbar">
          <div class="toolbar-left">
            <el-button-group>
              <el-button :type="viewMode === 'month' ? 'primary' : ''" size="small" @click="viewMode = 'month'">{{ t('competition.monthView') }}</el-button>
              <el-button :type="viewMode === 'week' ? 'primary' : ''" size="small" @click="viewMode = 'week'">{{ t('competition.weekView') }}</el-button>
            </el-button-group>
          </div>
          <div class="toolbar-center">
            <el-button :icon="ArrowLeft" text @click="navigatePrev" />
            <span class="current-label">{{ currentLabel }}</span>
            <el-button :icon="ArrowRight" text @click="navigateNext" />
          </div>
          <div class="toolbar-right">
            <el-button size="small" @click="goToday">{{ t('common.today') }}</el-button>
            <el-button :icon="sidebarVisible ? Fold : Expand" text @click="sidebarVisible = !sidebarVisible" />
          </div>
        </div>

        <!-- 月视图 -->
        <div v-if="viewMode === 'month'" class="month-view">
          <div class="weekday-header">
            <div v-for="day in weekdayNames" :key="day" class="weekday-cell">{{ day }}</div>
          </div>
          <div class="month-grid">
            <div
              v-for="(cell, idx) in monthCells"
              :key="idx"
              class="month-cell"
              :class="{ 'other-month': !cell.currentMonth, 'today': cell.isToday }"
            >
              <div class="cell-date">{{ cell.day }}</div>
              <div class="cell-events">
                <div
                  v-for="event in cell.events"
                  :key="event._id"
                  class="event-bar"
                  :class="'cat-' + event.竞赛类别"
                  :title="event.竞赛名称"
                  @click="showDetail(event)"
                >
                  {{ event.竞赛名称 }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 周视图 -->
        <div v-else class="week-view">
          <div class="weekday-header">
            <div v-for="(day, idx) in weekDays" :key="idx" class="weekday-cell" :class="{ 'today': day.isToday }">
              <div class="week-day-name">{{ day.name }}</div>
              <div class="week-day-date">{{ day.dateLabel }}</div>
            </div>
          </div>
          <div class="week-grid">
            <div v-for="(day, idx) in weekDays" :key="idx" class="week-col" :class="{ 'today': day.isToday }">
              <div
                v-for="event in day.events"
                :key="event._id"
                class="event-card"
                :class="'cat-' + event.竞赛类别"
                @click="showDetail(event)"
              >
                <div class="event-card-name">{{ event.竞赛名称 }}</div>
                <div class="event-card-meta">
                  <el-tag :type="categoryTagType(event.竞赛类别)" size="small">{{ categoryLabel(event.竞赛类别) }}</el-tag>
                </div>
              </div>
              <div v-if="day.events.length === 0" class="no-events">{{ t('competition.noEvents') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：可折叠侧边栏 -->
      <transition name="sidebar">
        <div v-show="sidebarVisible" class="sidebar">
          <!-- 本周竞赛 -->
          <div class="sidebar-section">
            <h3 class="sidebar-title">{{ t('competition.thisWeek') }}</h3>
            <div v-if="thisWeekEvents.length === 0" class="empty-hint">{{ t('competition.noEvents') }}</div>
            <div v-for="event in thisWeekEvents" :key="event._id" class="sidebar-card" @click="showDetail(event)">
              <div class="sidebar-card-name">{{ event.竞赛名称 }}</div>
              <div class="sidebar-card-meta">
                <el-tag :type="categoryTagType(event.竞赛类别)" size="small">{{ categoryLabel(event.竞赛类别) }}</el-tag>
                <span class="sidebar-card-date">{{ formatDate(event.竞赛开始日期) }} ~ {{ formatDate(event.竞赛结束日期) }}</span>
              </div>
            </div>
          </div>

          <!-- 下周竞赛 -->
          <div class="sidebar-section">
            <h3 class="sidebar-title">{{ t('competition.nextWeek') }}</h3>
            <div v-if="nextWeekEvents.length === 0" class="empty-hint">{{ t('competition.noEvents') }}</div>
            <div v-for="event in nextWeekEvents" :key="event._id" class="sidebar-card" @click="showDetail(event)">
              <div class="sidebar-card-name">{{ event.竞赛名称 }}</div>
              <div class="sidebar-card-meta">
                <el-tag :type="categoryTagType(event.竞赛类别)" size="small">{{ categoryLabel(event.竞赛类别) }}</el-tag>
                <span class="sidebar-card-date">{{ formatDate(event.竞赛开始日期) }} ~ {{ formatDate(event.竞赛结束日期) }}</span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="t('competition.eventDetail')" width="480px">
      <template v-if="detailEvent">
        <el-descriptions :column="1" border>
          <el-descriptions-item :label="t('competition.eventName')">{{ detailEvent.竞赛名称 }}</el-descriptions-item>
          <el-descriptions-item :label="t('competition.category')">
            <el-tag :type="categoryTagType(detailEvent.竞赛类别)" size="small">{{ categoryLabel(detailEvent.竞赛类别) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('competition.eventPeriod')">{{ formatDate(detailEvent.竞赛开始日期) }} ~ {{ formatDate(detailEvent.竞赛结束日期) }}</el-descriptions-item>
          <el-descriptions-item v-if="detailEvent.报名开始日期" :label="t('competition.registrationPeriod')">{{ formatDate(detailEvent.报名开始日期) }} ~ {{ formatDate(detailEvent.报名截止日期) }}</el-descriptions-item>
          <el-descriptions-item v-if="detailEvent.参与对象" :label="t('competition.participants')">{{ detailEvent.参与对象 }}</el-descriptions-item>
          <el-descriptions-item v-if="detailEvent.地点" :label="t('competition.location')">{{ detailEvent.地点 }}</el-descriptions-item>
          <el-descriptions-item v-if="detailEvent.报名链接" :label="t('competition.registrationLink')">
            <a :href="detailEvent.报名链接" target="_blank" rel="noopener">{{ detailEvent.报名链接 }}</a>
          </el-descriptions-item>
          <el-descriptions-item v-if="detailEvent.描述" :label="t('competition.description')">{{ detailEvent.描述 }}</el-descriptions-item>
          <el-descriptions-item :label="t('competition.creator')">{{ detailEvent.创建人 }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCompetitionEvents } from '@/api/competition'
import { ArrowLeft, ArrowRight, Fold, Expand } from '@element-plus/icons-vue'

const { t } = useI18n()

// 类别配置
const categories = [
  { value: '学术', labelKey: 'competition.categoryAcademic' },
  { value: '体育', labelKey: 'competition.categorySports' },
  { value: '艺术', labelKey: 'competition.categoryArts' },
  { value: '科技', labelKey: 'competition.categoryTech' },
  { value: '其他', labelKey: 'competition.categoryOther' }
]
const categoryTagMap = { '学术': '', '体育': 'success', '艺术': 'warning', '科技': 'danger', '其他': 'info' }
function categoryTagType(cat) { return categoryTagMap[cat] || 'info' }
function categoryLabel(cat) {
  const found = categories.find(c => c.value === cat)
  return found ? t(found.labelKey) : cat
}

// 状态
const viewMode = ref('month')
const currentDate = ref(new Date())
const events = ref([])
const sidebarVisible = ref(true)
const detailVisible = ref(false)
const detailEvent = ref(null)

// 工具函数
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d, n) {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

// 事件是否在某天有重叠
function eventOnDay(event, date) {
  const start = new Date(event.竞赛开始日期)
  const end = new Date(event.竞赛结束日期)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)
  return start <= dayEnd && end >= dayStart
}

// 当前标签
const currentLabel = computed(() => {
  const d = currentDate.value
  if (viewMode.value === 'month') {
    return `${d.getFullYear()}年${d.getMonth() + 1}月`
  }
  const monday = getMonday(d)
  const sunday = addDays(monday, 6)
  return `${formatDate(monday)} ~ ${formatDate(sunday)}`
})

// 星期名称
const weekdayNames = computed(() => {
  return [t('common.monday') || '一', t('common.tuesday') || '二', t('common.wednesday') || '三', t('common.thursday') || '四', t('common.friday') || '五', t('common.saturday') || '六', t('common.sunday') || '日']
})

// 月视图网格
const monthCells = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const today = new Date()

  // 找到月份第一天是星期几 (Monday=0)
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells = []
  const startDate = addDays(firstDay, -startDow)

  // 6行 x 7列 = 42 个格子
  for (let i = 0; i < 42; i++) {
    const cellDate = addDays(startDate, i)
    cells.push({
      date: cellDate,
      day: cellDate.getDate(),
      currentMonth: cellDate.getMonth() === month,
      isToday: isSameDay(cellDate, today),
      events: events.value.filter(e => eventOnDay(e, cellDate))
    })
  }
  return cells
})

// 周视图数据
const weekDays = computed(() => {
  const monday = getMonday(currentDate.value)
  const today = new Date()
  const dayLabels = weekdayNames.value
  const days = []

  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i)
    days.push({
      date: d,
      name: dayLabels[i],
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      isToday: isSameDay(d, today),
      events: events.value.filter(e => eventOnDay(e, d))
    })
  }
  return days
})

// 本周和下周事件
const thisWeekEvents = computed(() => {
  const monday = getMonday(new Date())
  const sunday = addDays(monday, 6)
  return events.value.filter(e => {
    const start = new Date(e.竞赛开始日期)
    const end = new Date(e.竞赛结束日期)
    return start <= sunday && end >= monday
  })
})

const nextWeekEvents = computed(() => {
  const nextMonday = addDays(getMonday(new Date()), 7)
  const nextSunday = addDays(nextMonday, 6)
  return events.value.filter(e => {
    const start = new Date(e.竞赛开始日期)
    const end = new Date(e.竞赛结束日期)
    return start <= nextSunday && end >= nextMonday
  })
})

// 导航
function navigatePrev() {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    d.setMonth(d.getMonth() - 1)
  } else {
    d.setDate(d.getDate() - 7)
  }
  currentDate.value = d
}

function navigateNext() {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    d.setMonth(d.getMonth() + 1)
  } else {
    d.setDate(d.getDate() + 7)
  }
  currentDate.value = d
}

function goToday() {
  currentDate.value = new Date()
}

function showDetail(event) {
  detailEvent.value = event
  detailVisible.value = true
}

// 加载事件数据
async function loadEvents() {
  try {
    const res = await getCompetitionEvents()
    events.value = res.data || []
  } catch (error) {
    console.error('加载竞赛事件失败:', error)
  }
}

watch(viewMode, () => {
  // 切换视图时不需要重新加载，数据已在内存
})

onMounted(() => {
  loadEvents()
  // 小屏默认收起侧边栏
  if (window.innerWidth < 768) {
    sidebarVisible.value = false
  }
})
</script>

<style scoped>
.calendar-layout {
  display: flex;
  gap: 16px;
  min-height: 600px;
}

.calendar-area {
  flex: 1;
  min-width: 0;
}

/* 工具栏 */
.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-label {
  font-size: 18px;
  font-weight: 600;
  color: #3870a0;
  min-width: 200px;
  text-align: center;
}

/* 月视图 */
.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f5f7fa;
  border-radius: 8px 8px 0 0;
}

.weekday-cell {
  text-align: center;
  padding: 8px;
  font-weight: 600;
  color: #606266;
  font-size: 13px;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid #ebeef5;
  border-radius: 0 0 8px 8px;
}

.month-cell {
  min-height: 80px;
  border: 1px solid #ebeef5;
  padding: 4px;
  background: #fff;
  overflow: hidden;
}

.month-cell.other-month {
  background: #fafafa;
}

.month-cell.other-month .cell-date {
  color: #c0c4cc;
}

.month-cell.today {
  background: #ecf5ff;
}

.month-cell.today .cell-date {
  color: #409eff;
  font-weight: 700;
}

.cell-date {
  font-size: 12px;
  color: #606266;
  margin-bottom: 2px;
}

.cell-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-bar {
  font-size: 11px;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  color: #fff;
}

.event-bar.cat-学术 { background: #409eff; }
.event-bar.cat-体育 { background: #67c23a; }
.event-bar.cat-艺术 { background: #9b59b6; }
.event-bar.cat-科技 { background: #e6a23c; }
.event-bar.cat-其他 { background: #909399; }

/* 周视图 */
.week-view .weekday-header {
  border-radius: 8px 8px 0 0;
}

.week-view .weekday-cell.today {
  background: #ecf5ff;
  color: #409eff;
}

.week-day-name {
  font-size: 13px;
}

.week-day-date {
  font-size: 11px;
  color: #909399;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid #ebeef5;
  border-radius: 0 0 8px 8px;
  min-height: 400px;
}

.week-col {
  border-right: 1px solid #ebeef5;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #fff;
}

.week-col:last-child {
  border-right: none;
}

.week-col.today {
  background: #ecf5ff;
}

.event-card {
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #fff;
  font-size: 12px;
}

.event-card.cat-学术 { background: #409eff; }
.event-card.cat-体育 { background: #67c23a; }
.event-card.cat-艺术 { background: #9b59b6; }
.event-card.cat-科技 { background: #e6a23c; }
.event-card.cat-其他 { background: #909399; }

.event-card-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.no-events {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
  padding: 12px 0;
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  padding: 16px;
  overflow-y: auto;
  max-height: 700px;
}

.sidebar-section {
  margin-bottom: 20px;
}

.sidebar-section:last-child {
  margin-bottom: 0;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: #3870a0;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #ecf5ff;
}

.empty-hint {
  color: #c0c4cc;
  font-size: 13px;
  text-align: center;
  padding: 12px 0;
}

.sidebar-card {
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #f5f7fa;
  cursor: pointer;
  transition: background 0.2s;
}

.sidebar-card:hover {
  background: #ecf5ff;
}

.sidebar-card-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
  font-size: 14px;
}

.sidebar-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.sidebar-card-date {
  color: #909399;
}

/* 侧边栏过渡动画 */
.sidebar-enter-active, .sidebar-leave-active {
  transition: all 0.3s ease;
}

.sidebar-enter-from, .sidebar-leave-to {
  width: 0;
  opacity: 0;
  padding: 0;
  overflow: hidden;
}

/* 响应式 */
@media (max-width: 768px) {
  .calendar-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: 300px;
  }

  .current-label {
    font-size: 14px;
    min-width: auto;
  }

  .month-cell {
    min-height: 50px;
  }

  .event-bar {
    font-size: 10px;
  }
}
</style>
```

**Step 2: Commit**

```bash
git add frontend/src/views/competition/CompetitionCalendar.vue
git commit -m "feat(competition): create competition calendar page with month/week views and sidebar"
```

---

### Task 11: Add Missing i18n Weekday Keys

**Files:**
- Modify: `frontend/src/i18n/locales/zh-CN.json` (common section)
- Modify: `frontend/src/i18n/locales/en.json` (common section)

The calendar uses weekday names from i18n. Check if `common.monday` etc. exist. If not, add them.

**Step 1: Add weekday keys to zh-CN.json `common` section**

```json
    "monday": "周一",
    "tuesday": "周二",
    "wednesday": "周三",
    "thursday": "周四",
    "friday": "周五",
    "saturday": "周六",
    "sunday": "周日"
```

**Step 2: Add weekday keys to en.json `common` section**

```json
    "monday": "Mon",
    "tuesday": "Tue",
    "wednesday": "Wed",
    "thursday": "Thu",
    "friday": "Fri",
    "saturday": "Sat",
    "sunday": "Sun"
```

**Step 3: Commit**

```bash
git add frontend/src/i18n/locales/zh-CN.json frontend/src/i18n/locales/en.json
git commit -m "feat(competition): add weekday i18n keys for calendar"
```

---

### Task 12: Manual Smoke Test

**Step 1: Start backend**

Run: `cd backend && npm run dev`
Expected: Server running on port 8080, MongoDB connected

**Step 2: Start frontend**

Run: `cd frontend && npm run dev`
Expected: Dev server on http://localhost:3000

**Step 3: Verify routes and UI**

1. Login as S group user → verify two new function cards on home
2. Navigate to `/competition/calendar` → verify month view renders, sidebar shows
3. Switch to week view → verify week grid
4. Navigate to `/competition/manage` → verify empty table, "新建竞赛" button
5. Create a competition event via the dialog
6. Return to calendar → verify event appears on correct dates
7. Verify sidebar shows event in "本周竞赛" or "下周竞赛" as appropriate
8. Edit and delete the event
9. Login as F group user → verify calendar card visible, manage card NOT visible
10. Login as A group user → verify calendar card visible, manage card NOT visible

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(competition): address smoke test issues"
```
