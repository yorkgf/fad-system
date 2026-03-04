<template>
  <div class="calendar-layout">
    <!-- Left: Calendar Area -->
    <div class="calendar-main">
      <!-- Toolbar -->
      <div class="calendar-toolbar">
        <div class="toolbar-left">
          <el-button-group>
            <el-button
              :type="viewMode === 'month' ? 'primary' : ''"
              @click="viewMode = 'month'"
            >
              {{ $t('competition.monthView') }}
            </el-button>
            <el-button
              :type="viewMode === 'week' ? 'primary' : ''"
              @click="viewMode = 'week'"
            >
              {{ $t('competition.weekView') }}
            </el-button>
          </el-button-group>
        </div>

        <div class="toolbar-center">
          <el-button text @click="navigatePrev">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <span class="current-label">{{ currentLabel }}</span>
          <el-button text @click="navigateNext">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>

        <div class="toolbar-right">
          <el-button @click="goToday">{{ $t('common.today') }}</el-button>
          <el-button text @click="sidebarVisible = !sidebarVisible">
            <el-icon>
              <Fold v-if="sidebarVisible" />
              <Expand v-else />
            </el-icon>
          </el-button>
        </div>
      </div>

      <!-- Month View -->
      <template v-if="viewMode === 'month'">
        <div class="weekday-header">
          <div v-for="name in weekdayNames" :key="name" class="weekday-cell">
            {{ name }}
          </div>
        </div>
        <div class="month-grid">
          <div
            v-for="(cell, idx) in monthCells"
            :key="idx"
            class="month-cell"
            :class="{
              'other-month': !cell.currentMonth,
              'today': cell.isToday
            }"
          >
            <div class="day-number">{{ cell.day }}</div>
            <div
              v-for="event in cell.events"
              :key="event._id"
              class="event-bar"
              :class="'cat-' + event.竞赛类别"
              @click="showDetail(event)"
            >
              {{ event.竞赛名称 }}
            </div>
          </div>
        </div>
      </template>

      <!-- Week View -->
      <template v-if="viewMode === 'week'">
        <div class="week-grid">
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="week-col"
            :class="{ 'today': day.isToday }"
          >
            <div class="week-col-header">
              <div class="week-day-name">{{ day.name }}</div>
              <div class="week-date-label">{{ day.dateLabel }}</div>
            </div>
            <div class="week-col-body">
              <template v-if="day.events.length > 0">
                <div
                  v-for="event in day.events"
                  :key="event._id"
                  class="event-card"
                  :class="'cat-' + event.竞赛类别"
                  @click="showDetail(event)"
                >
                  <div class="event-card-name">{{ event.竞赛名称 }}</div>
                  <el-tag
                    size="small"
                    :type="categoryTagMap[event.竞赛类别] || 'info'"
                  >
                    {{ event.竞赛类别 }}
                  </el-tag>
                </div>
              </template>
              <div v-else class="empty-day">{{ $t('competition.noEvents') }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Right: Collapsible Sidebar -->
    <transition name="sidebar">
      <div v-if="sidebarVisible" class="sidebar">
        <!-- This Week -->
        <div class="sidebar-section">
          <div class="sidebar-title">{{ $t('competition.thisWeek') }}</div>
          <template v-if="thisWeekEvents.length > 0">
            <div
              v-for="event in thisWeekEvents"
              :key="event._id"
              class="sidebar-card"
              @click="showDetail(event)"
            >
              <div class="sidebar-card-name">{{ event.竞赛名称 }}</div>
              <div class="sidebar-card-meta">
                <el-tag
                  size="small"
                  :type="categoryTagMap[event.竞赛类别] || 'info'"
                >
                  {{ event.竞赛类别 }}
                </el-tag>
                <span class="sidebar-card-date">
                  {{ formatDate(event.竞赛开始日期) }} ~ {{ formatDate(event.竞赛结束日期) }}
                </span>
              </div>
            </div>
          </template>
          <div v-else class="empty-section">{{ $t('competition.noEvents') }}</div>
        </div>

        <!-- Next Week -->
        <div class="sidebar-section">
          <div class="sidebar-title">{{ $t('competition.nextWeek') }}</div>
          <template v-if="nextWeekEvents.length > 0">
            <div
              v-for="event in nextWeekEvents"
              :key="event._id"
              class="sidebar-card"
              @click="showDetail(event)"
            >
              <div class="sidebar-card-name">{{ event.竞赛名称 }}</div>
              <div class="sidebar-card-meta">
                <el-tag
                  size="small"
                  :type="categoryTagMap[event.竞赛类别] || 'info'"
                >
                  {{ event.竞赛类别 }}
                </el-tag>
                <span class="sidebar-card-date">
                  {{ formatDate(event.竞赛开始日期) }} ~ {{ formatDate(event.竞赛结束日期) }}
                </span>
              </div>
            </div>
          </template>
          <div v-else class="empty-section">{{ $t('competition.noEvents') }}</div>
        </div>
      </div>
    </transition>

    <!-- Detail Dialog -->
    <el-dialog
      v-model="detailVisible"
      :title="$t('competition.eventDetail')"
      width="520px"
      destroy-on-close
    >
      <el-descriptions v-if="detailEvent" :column="1" border>
        <el-descriptions-item :label="$t('competition.eventName')">
          {{ detailEvent.竞赛名称 }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('competition.category')">
          <el-tag :type="categoryTagMap[detailEvent.竞赛类别] || 'info'">
            {{ detailEvent.竞赛类别 }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('competition.eventPeriod')">
          {{ formatDate(detailEvent.竞赛开始日期) }} ~ {{ formatDate(detailEvent.竞赛结束日期) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="detailEvent.报名开始日期 || detailEvent.报名截止日期"
          :label="$t('competition.registrationPeriod')"
        >
          {{ formatDate(detailEvent.报名开始日期) }} ~ {{ formatDate(detailEvent.报名截止日期) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="detailEvent.参与对象"
          :label="$t('competition.participants')"
        >
          {{ detailEvent.参与对象 }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="detailEvent.地点"
          :label="$t('competition.location')"
        >
          {{ detailEvent.地点 }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="detailEvent.报名链接"
          :label="$t('competition.registrationLink')"
        >
          <a :href="detailEvent.报名链接" target="_blank" rel="noopener noreferrer">
            {{ detailEvent.报名链接 }}
          </a>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="detailEvent.描述"
          :label="$t('competition.description')"
        >
          {{ detailEvent.描述 }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const { t } = useI18n()

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

// --- Constants ---
const categoryTagMap = {
  '学术': '',
  '体育': 'success',
  '艺术': 'warning',
  '科技': 'danger',
  '其他': 'info'
}

// --- State ---
const events = ref([])
const viewMode = ref('month')
const currentDate = ref(new Date())
const sidebarVisible = ref(true)
const detailVisible = ref(false)
const detailEvent = ref(null)

// --- Helpers ---
function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = (day + 6) % 7
  date.setDate(date.getDate() - diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d, n) {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

function toDateStr(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

function eventOnDay(event, date) {
  const dateStr = toDateStr(date)
  const start = (event.竞赛开始日期 || '').slice(0, 10)
  const end = (event.竞赛结束日期 || '').slice(0, 10)
  return dateStr >= start && dateStr <= end
}

function eventsOverlapRange(event, rangeStart, rangeEnd) {
  const start = (event.竞赛开始日期 || '').slice(0, 10)
  const end = (event.竞赛结束日期 || '').slice(0, 10)
  const rs = toDateStr(rangeStart)
  const re = toDateStr(rangeEnd)
  return start <= re && end >= rs
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.slice(0, 10)
}

// --- Computed ---
const weekdayNames = computed(() => [
  t('common.monday'),
  t('common.tuesday'),
  t('common.wednesday'),
  t('common.thursday'),
  t('common.friday'),
  t('common.saturday'),
  t('common.sunday')
])

const currentLabel = computed(() => {
  const d = currentDate.value
  if (viewMode.value === 'month') {
    return `${d.getFullYear()}${t('common.year')}${d.getMonth() + 1}${t('common.month')}`
  } else {
    const monday = getMonday(d)
    const sunday = addDays(monday, 6)
    return `${toDateStr(monday)} ~ ${toDateStr(sunday)}`
  }
})

const monthCells = computed(() => {
  const d = currentDate.value
  const year = d.getFullYear()
  const month = d.getMonth()

  const firstDay = new Date(year, month, 1)
  const firstDow = (firstDay.getDay() + 6) % 7
  const startDate = addDays(firstDay, -firstDow)

  const today = new Date()
  const cells = []
  for (let i = 0; i < 42; i++) {
    const cellDate = addDays(startDate, i)
    const isCurrentMonth = cellDate.getMonth() === month
    const isToday = isSameDay(cellDate, today)
    const dayEvents = events.value.filter(e => eventOnDay(e, cellDate))
    cells.push({
      date: cellDate,
      day: cellDate.getDate(),
      currentMonth: isCurrentMonth,
      isToday,
      events: dayEvents
    })
  }
  return cells
})

const weekDays = computed(() => {
  const monday = getMonday(currentDate.value)
  const today = new Date()
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i)
    const dayEvents = events.value.filter(e => eventOnDay(e, d))
    days.push({
      date: toDateStr(d),
      name: weekdayNames.value[i],
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      isToday: isSameDay(d, today),
      events: dayEvents
    })
  }
  return days
})

const thisWeekEvents = computed(() => {
  const today = new Date()
  const monday = getMonday(today)
  const sunday = addDays(monday, 6)
  return events.value.filter(e => eventsOverlapRange(e, monday, sunday))
})

const nextWeekEvents = computed(() => {
  const today = new Date()
  const monday = getMonday(today)
  const nextMonday = addDays(monday, 7)
  const nextSunday = addDays(nextMonday, 6)
  return events.value.filter(e => eventsOverlapRange(e, nextMonday, nextSunday))
})

// --- Navigation ---
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

// --- Detail Dialog ---
function showDetail(event) {
  detailEvent.value = event
  detailVisible.value = true
}

// --- Data Loading ---
async function loadEvents() {
  try {
    const res = await axios.get(`${API_BASE}/competition/public-events`)
    events.value = res.data?.data || []
  } catch {
    ElMessage.error(t('common.failed'))
  }
}

// --- Init ---
onMounted(() => {
  loadEvents()
  if (window.innerWidth < 768) {
    sidebarVisible.value = false
  }
})
</script>

<style scoped>
.calendar-layout {
  display: flex;
  gap: 16px;
  min-height: 0;
}

.calendar-main {
  flex: 1;
  min-width: 0;
}

/* Toolbar */
.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-label {
  font-size: 18px;
  font-weight: bold;
  color: #3870a0;
  min-width: 180px;
  text-align: center;
  user-select: none;
}

/* Month View - Weekday Header */
.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 600;
  color: #606266;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.weekday-cell {
  padding: 4px 0;
}

/* Month View - Grid */
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.month-cell {
  min-height: 80px;
  border: 1px solid #ebeef5;
  border-top: none;
  padding: 4px;
  background: #fff;
  overflow: hidden;
}

.month-cell.other-month {
  background: #f5f7fa;
  color: #c0c4cc;
}

.month-cell.today {
  background: #ecf5ff;
}

.day-number {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
}

/* Event Bar (Month View) */
.event-bar {
  font-size: 11px;
  line-height: 18px;
  padding: 0 4px;
  margin-bottom: 2px;
  border-radius: 3px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.event-bar:hover {
  opacity: 0.85;
}

.event-bar.cat-\5B66\672F { background: #409eff; }
.event-bar.cat-\4F53\80B2 { background: #67c23a; }
.event-bar.cat-\827A\672F { background: #9b59b6; }
.event-bar.cat-\79D1\6280 { background: #e6a23c; }
.event-bar.cat-\5176\4ED6 { background: #909399; }

/* Week View */
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  min-height: 400px;
}

.week-col {
  border: 1px solid #ebeef5;
  border-left: none;
  display: flex;
  flex-direction: column;
}

.week-col:first-child {
  border-left: 1px solid #ebeef5;
}

.week-col.today {
  background: #ecf5ff;
}

.week-col-header {
  text-align: center;
  padding: 8px 4px;
  border-bottom: 1px solid #ebeef5;
  font-weight: 600;
  color: #606266;
}

.week-day-name {
  font-size: 13px;
}

.week-date-label {
  font-size: 12px;
  color: #909399;
}

.week-col-body {
  flex: 1;
  padding: 4px;
  overflow-y: auto;
}

/* Event Card (Week View) */
.event-card {
  padding: 6px 8px;
  margin-bottom: 6px;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
}

.event-card:hover {
  opacity: 0.85;
}

.event-card.cat-\5B66\672F { background: #409eff; }
.event-card.cat-\4F53\80B2 { background: #67c23a; }
.event-card.cat-\827A\672F { background: #9b59b6; }
.event-card.cat-\79D1\6280 { background: #e6a23c; }
.event-card.cat-\5176\4ED6 { background: #909399; }

.event-card-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  word-break: break-all;
}

.empty-day {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
  padding: 12px 0;
}

/* Sidebar */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  padding: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 160px);
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
  padding-bottom: 8px;
  border-bottom: 2px solid #3870a0;
  margin-bottom: 10px;
}

.sidebar-card {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.sidebar-card:hover {
  background: #ecf5ff;
}

.sidebar-card:last-child {
  margin-bottom: 0;
}

.sidebar-card-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
}

.sidebar-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sidebar-card-date {
  font-size: 12px;
  color: #909399;
}

.empty-section {
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
  padding: 16px 0;
}

/* Sidebar Transition */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: width 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
  overflow: hidden;
}

.sidebar-enter-from,
.sidebar-leave-to {
  width: 0;
  opacity: 0;
  padding: 0;
  border: none;
}

/* Detail Dialog Link */
.el-descriptions a {
  color: #409eff;
  text-decoration: none;
}

.el-descriptions a:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .calendar-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: none;
  }

  .current-label {
    font-size: 15px;
    min-width: 140px;
  }

  .month-cell {
    min-height: 60px;
  }

  .calendar-toolbar {
    justify-content: center;
  }
}
</style>
