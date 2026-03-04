<template>
  <div class="calendar-layout">
    <!-- Left: Calendar Area -->
    <div class="calendar-main">
      <!-- Toolbar -->
      <div class="calendar-toolbar">
        <div class="toolbar-left">
          <el-button-group>
            <el-button
              :type="viewMode === 'year' ? 'primary' : ''"
              @click="viewMode = 'year'"
            >
              {{ $t('competition.yearView') }}
            </el-button>
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
              :title="eventTooltip(event)"
              @click="showDetail(event)"
            >
              {{ event.竞赛名称 }}
            </div>
            <div
              v-for="event in cell.regEvents"
              :key="'reg-' + event._id"
              class="event-bar reg-bar"
              :class="'cat-' + event.竞赛类别"
              :title="eventTooltip(event)"
              @click="showDetail(event)"
            >
              {{ $t('competition.registration') }}: {{ event.竞赛名称 }}
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
              <template v-if="day.events.length > 0 || day.regEvents.length > 0">
                <div
                  v-for="event in day.events"
                  :key="event._id"
                  class="event-card"
                  :class="'cat-' + event.竞赛类别"
                  @click="showDetail(event)"
                >
                  <div class="event-card-name">{{ event.竞赛名称 }}</div>
                  <div v-if="hasRegistration(event)" class="event-card-reg">
                    {{ $t('competition.registration') }}: {{ formatRegRange(event) }}
                  </div>
                  <el-tag
                    size="small"
                    :type="categoryTagMap[event.竞赛类别] || 'info'"
                  >
                    {{ event.竞赛类别 }}
                  </el-tag>
                </div>
                <div
                  v-for="event in day.regEvents"
                  :key="'reg-' + event._id"
                  class="event-card reg-card"
                  :class="'cat-' + event.竞赛类别"
                  @click="showDetail(event)"
                >
                  <div class="event-card-name">{{ $t('competition.registration') }}: {{ event.竞赛名称 }}</div>
                  <el-tag size="small" :type="categoryTagMap[event.竞赛类别] || 'info'">{{ event.竞赛类别 }}</el-tag>
                </div>
              </template>
              <div v-else class="empty-day">{{ $t('competition.noEvents') }}</div>
            </div>
          </div>
        </div>
      </template>

      <!-- Year View -->
      <template v-if="viewMode === 'year'">
        <div class="year-grid">
          <div v-for="m in yearMonths" :key="m.month" class="year-month-card">
            <div class="year-month-title" @click="goToMonth(m.month)">
              {{ m.label }}
            </div>
            <div class="year-month-events">
              <template v-if="m.events.length > 0">
                <div
                  v-for="event in m.events"
                  :key="event._id"
                  class="year-event-item"
                  @click="showDetail(event)"
                >
                  <div class="year-event-name">{{ event.竞赛名称 }}</div>
                  <div class="year-event-tags">
                    <el-tag size="small" :type="categoryTagMap[event.竞赛类别] || 'info'">{{ event.竞赛类别 }}</el-tag>
                    <el-tag v-if="event._isCompeting" size="small" type="danger">{{ $t('competition.competing') }}</el-tag>
                    <el-tag v-if="event._isRegistering" size="small" type="warning">{{ $t('competition.registering') }}</el-tag>
                  </div>
                </div>
              </template>
              <div v-else class="year-month-empty">{{ $t('competition.noEvents') }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Right: Collapsible Sidebar -->
    <transition name="sidebar">
      <div v-if="sidebarVisible" class="sidebar">
        <!-- Today -->
        <div class="sidebar-section">
          <div class="sidebar-title">{{ $t('competition.today') }}</div>
          <template v-if="todayEvents.length > 0">
            <div
              v-for="event in todayEvents"
              :key="'today-' + event._id"
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
                <el-tag v-if="event._isCompeting" size="small" type="danger">{{ $t('competition.competing') }}</el-tag>
                <el-tag v-if="event._isRegistering" size="small" type="warning">{{ $t('competition.registering') }}</el-tag>
              </div>
              <div class="sidebar-card-date">
                {{ formatDate(event.竞赛开始日期) }} ~ {{ formatDate(event.竞赛结束日期) }}
              </div>
              <div v-if="hasRegistration(event)" class="sidebar-card-reg">
                {{ $t('competition.registration') }}: {{ formatRegRange(event) }}
              </div>
            </div>
          </template>
          <div v-else class="empty-section">{{ $t('competition.noEvents') }}</div>
        </div>

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
                <el-tag v-if="event._isCompeting" size="small" type="danger">{{ $t('competition.competing') }}</el-tag>
                <el-tag v-if="event._isRegistering" size="small" type="warning">{{ $t('competition.registering') }}</el-tag>
              </div>
              <div class="sidebar-card-date">
                {{ formatDate(event.竞赛开始日期) }} ~ {{ formatDate(event.竞赛结束日期) }}
              </div>
              <div v-if="hasRegistration(event)" class="sidebar-card-reg">
                {{ $t('competition.registration') }}: {{ formatRegRange(event) }}
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
                <el-tag v-if="event._isCompeting" size="small" type="danger">{{ $t('competition.competing') }}</el-tag>
                <el-tag v-if="event._isRegistering" size="small" type="warning">{{ $t('competition.registering') }}</el-tag>
              </div>
              <div class="sidebar-card-date">
                {{ formatDate(event.竞赛开始日期) }} ~ {{ formatDate(event.竞赛结束日期) }}
              </div>
              <div v-if="hasRegistration(event)" class="sidebar-card-reg">
                {{ $t('competition.registration') }}: {{ formatRegRange(event) }}
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
      :title="detailEvent ? detailEvent.竞赛名称 : $t('competition.eventDetail')"
      :width="isMobile ? '100%' : '520px'"
      :fullscreen="isMobile"
      destroy-on-close
    >
      <div v-if="detailEvent" class="detail-body">
        <div class="detail-cat">
          <el-tag :type="categoryTagMap[detailEvent.竞赛类别] || 'info'" size="large">
            {{ detailEvent.竞赛类别 }}
          </el-tag>
        </div>

        <div class="detail-fields">
          <div class="detail-field">
            <div class="detail-field-label">{{ $t('competition.eventPeriod') }}</div>
            <div class="detail-field-value">
              {{ formatDate(detailEvent.竞赛开始日期) }} ~ {{ formatDate(detailEvent.竞赛结束日期) }}
            </div>
          </div>

          <div v-if="detailEvent.报名开始日期 || detailEvent.报名截止日期" class="detail-field">
            <div class="detail-field-label">{{ $t('competition.registrationPeriod') }}</div>
            <div class="detail-field-value">
              {{ formatDate(detailEvent.报名开始日期) }} ~ {{ formatDate(detailEvent.报名截止日期) }}
            </div>
          </div>

          <div v-if="detailEvent.参与对象" class="detail-field">
            <div class="detail-field-label">{{ $t('competition.participants') }}</div>
            <div class="detail-field-value">{{ detailEvent.参与对象 }}</div>
          </div>

          <div v-if="detailEvent.地点" class="detail-field">
            <div class="detail-field-label">{{ $t('competition.location') }}</div>
            <div class="detail-field-value">{{ detailEvent.地点 }}</div>
          </div>

          <div v-if="detailEvent.报名方式或链接" class="detail-field">
            <div class="detail-field-label">{{ $t('competition.registrationMethod') }}</div>
            <div class="detail-field-value">
              <a
                v-if="detailEvent.报名方式或链接.startsWith('http')"
                :href="detailEvent.报名方式或链接"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ detailEvent.报名方式或链接 }}
              </a>
              <img
                v-else-if="detailEvent.报名方式或链接.startsWith('data:image')"
                :src="detailEvent.报名方式或链接"
                class="detail-qrcode"
              />
              <span v-else>{{ detailEvent.报名方式或链接 }}</span>
            </div>
          </div>

          <div v-if="detailEvent.考试范围" class="detail-field">
            <div class="detail-field-label">{{ $t('competition.examScope') }}</div>
            <div class="detail-field-value detail-field-text">{{ detailEvent.考试范围 }}</div>
          </div>

          <div v-if="detailEvent.描述" class="detail-field">
            <div class="detail-field-label">{{ $t('competition.description') }}</div>
            <div class="detail-field-value detail-field-text">{{ detailEvent.描述 }}</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Fold, Expand } from '@element-plus/icons-vue'
import axios from 'axios'

const { t } = useI18n()

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

// --- Constants ---
const categoryTagMap = {
  '数学': '',
  '理科': 'success',
  '文科': 'danger',
  '体育': 'success',
  '艺术': 'warning',
  '科技': 'warning',
  '其他': 'info'
}

// --- State ---
const events = ref([])
const viewMode = ref('month')
const currentDate = ref(new Date())
const sidebarVisible = ref(true)
const detailVisible = ref(false)
const detailEvent = ref(null)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 640
}

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

function hasRegistration(event) {
  return event.报名开始日期 || event.报名截止日期
}

function formatRegRange(event) {
  if (!event.报名开始日期 && !event.报名截止日期) return ''
  return `${formatDate(event.报名开始日期)} ~ ${formatDate(event.报名截止日期)}`
}

function regOnDay(event, date) {
  if (!event.报名开始日期 && !event.报名截止日期) return false
  const dateStr = toDateStr(date)
  const start = (event.报名开始日期 || event.报名截止日期 || '').slice(0, 10)
  const end = (event.报名截止日期 || event.报名开始日期 || '').slice(0, 10)
  return dateStr >= start && dateStr <= end
}

function regOverlapRange(event, rangeStart, rangeEnd) {
  if (!event.报名开始日期 && !event.报名截止日期) return false
  const start = (event.报名开始日期 || event.报名截止日期 || '').slice(0, 10)
  const end = (event.报名截止日期 || event.报名开始日期 || '').slice(0, 10)
  const rs = toDateStr(rangeStart)
  const re = toDateStr(rangeEnd)
  return start <= re && end >= rs
}

function eventTooltip(event) {
  let tip = event.竞赛名称
  if (hasRegistration(event)) {
    tip += `\n${t('competition.registration')}: ${formatRegRange(event)}`
  }
  return tip
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
  if (viewMode.value === 'year') {
    return `${d.getFullYear()}${t('common.year')}`
  } else if (viewMode.value === 'month') {
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
    const dayRegEvents = events.value.filter(e => regOnDay(e, cellDate) && !eventOnDay(e, cellDate))
    cells.push({
      date: cellDate,
      day: cellDate.getDate(),
      currentMonth: isCurrentMonth,
      isToday,
      events: dayEvents,
      regEvents: dayRegEvents
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
    const dayRegEvents = events.value.filter(e => regOnDay(e, d) && !eventOnDay(e, d))
    days.push({
      date: toDateStr(d),
      name: weekdayNames.value[i],
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      isToday: isSameDay(d, today),
      events: dayEvents,
      regEvents: dayRegEvents
    })
  }
  return days
})

const todayEvents = computed(() => {
  const today = new Date()
  return events.value
    .filter(e => eventOnDay(e, today) || regOnDay(e, today))
    .map(e => ({
      ...e,
      _isCompeting: eventOnDay(e, today),
      _isRegistering: regOnDay(e, today)
    }))
})

const thisWeekEvents = computed(() => {
  const today = new Date()
  const monday = getMonday(today)
  const sunday = addDays(monday, 6)
  return events.value
    .filter(e => eventsOverlapRange(e, monday, sunday) || regOverlapRange(e, monday, sunday))
    .map(e => ({
      ...e,
      _isCompeting: eventsOverlapRange(e, monday, sunday),
      _isRegistering: regOverlapRange(e, monday, sunday)
    }))
})

const nextWeekEvents = computed(() => {
  const today = new Date()
  const monday = getMonday(today)
  const nextMonday = addDays(monday, 7)
  const nextSunday = addDays(nextMonday, 6)
  return events.value
    .filter(e => eventsOverlapRange(e, nextMonday, nextSunday) || regOverlapRange(e, nextMonday, nextSunday))
    .map(e => ({
      ...e,
      _isCompeting: eventsOverlapRange(e, nextMonday, nextSunday),
      _isRegistering: regOverlapRange(e, nextMonday, nextSunday)
    }))
})

const yearMonths = computed(() => {
  const year = currentDate.value.getFullYear()
  const months = []
  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(year, m, 1)
    const monthEnd = new Date(year, m + 1, 0)
    const monthEvents = events.value
      .filter(e => eventsOverlapRange(e, monthStart, monthEnd) || regOverlapRange(e, monthStart, monthEnd))
      .map(e => ({
        ...e,
        _isCompeting: eventsOverlapRange(e, monthStart, monthEnd),
        _isRegistering: regOverlapRange(e, monthStart, monthEnd)
      }))
    months.push({ month: m, label: `${m + 1}${t('common.month')}`, events: monthEvents })
  }
  return months
})

// --- Navigation ---
function navigatePrev() {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'year') {
    d.setFullYear(d.getFullYear() - 1)
  } else if (viewMode.value === 'month') {
    d.setMonth(d.getMonth() - 1)
  } else {
    d.setDate(d.getDate() - 7)
  }
  currentDate.value = d
}

function navigateNext() {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'year') {
    d.setFullYear(d.getFullYear() + 1)
  } else if (viewMode.value === 'month') {
    d.setMonth(d.getMonth() + 1)
  } else {
    d.setDate(d.getDate() + 7)
  }
  currentDate.value = d
}

function goToday() {
  currentDate.value = new Date()
}

function goToMonth(month) {
  const d = new Date(currentDate.value)
  d.setMonth(month)
  currentDate.value = d
  viewMode.value = 'month'
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
  checkMobile()
  window.addEventListener('resize', checkMobile)
  if (isMobile.value) {
    sidebarVisible.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
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

.event-bar.cat-\6570\5B66 { background: #409eff; }
.event-bar.cat-\7406\79D1 { background: #2ecc71; }
.event-bar.cat-\6587\79D1 { background: #e74c3c; }
.event-bar.cat-\4F53\80B2 { background: #67c23a; }
.event-bar.cat-\827A\672F { background: #9b59b6; }
.event-bar.cat-\79D1\6280 { background: #e6a23c; }
.event-bar.cat-\5176\4ED6 { background: #909399; }

/* Registration Bar (Month View) - dashed outline */
.event-bar.reg-bar {
  background: transparent !important;
  color: #606266;
  border: 1.5px dashed;
}
.event-bar.reg-bar.cat-\6570\5B66 { border-color: #409eff; }
.event-bar.reg-bar.cat-\7406\79D1 { border-color: #2ecc71; }
.event-bar.reg-bar.cat-\6587\79D1 { border-color: #e74c3c; }
.event-bar.reg-bar.cat-\4F53\80B2 { border-color: #67c23a; }
.event-bar.reg-bar.cat-\827A\672F { border-color: #9b59b6; }
.event-bar.reg-bar.cat-\79D1\6280 { border-color: #e6a23c; }
.event-bar.reg-bar.cat-\5176\4ED6 { border-color: #909399; }

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

.event-card.cat-\6570\5B66 { background: #409eff; }
.event-card.cat-\7406\79D1 { background: #2ecc71; }
.event-card.cat-\6587\79D1 { background: #e74c3c; }
.event-card.cat-\4F53\80B2 { background: #67c23a; }
.event-card.cat-\827A\672F { background: #9b59b6; }
.event-card.cat-\79D1\6280 { background: #e6a23c; }
.event-card.cat-\5176\4ED6 { background: #909399; }

/* Registration Card (Week View) - dashed outline */
.event-card.reg-card {
  background: transparent !important;
  color: #606266;
  border: 1.5px dashed;
}
.event-card.reg-card.cat-\6570\5B66 { border-color: #409eff; }
.event-card.reg-card.cat-\7406\79D1 { border-color: #2ecc71; }
.event-card.reg-card.cat-\6587\79D1 { border-color: #e74c3c; }
.event-card.reg-card.cat-\4F53\80B2 { border-color: #67c23a; }
.event-card.reg-card.cat-\827A\672F { border-color: #9b59b6; }
.event-card.reg-card.cat-\79D1\6280 { border-color: #e6a23c; }
.event-card.reg-card.cat-\5176\4ED6 { border-color: #909399; }

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
  margin-top: 4px;
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

/* Detail Dialog */
.detail-body {
  padding: 0 4px;
}

.detail-cat {
  margin-bottom: 20px;
}

.detail-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-field {
  background: #f8f9fc;
  border-radius: 10px;
  padding: 12px 16px;
}

.detail-field-label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  margin-bottom: 6px;
}

.detail-field-value {
  font-size: 15px;
  color: #303133;
  line-height: 1.5;
  word-break: break-word;
  overflow-wrap: break-word;
}

.detail-field-text {
  white-space: pre-wrap;
}

.detail-field-value a {
  color: #409eff;
  text-decoration: none;
  word-break: break-all;
}

.detail-field-value a:hover {
  text-decoration: underline;
}

.detail-qrcode {
  max-width: 200px;
  max-height: 200px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

/* Registration date in week card */
.event-card-reg {
  font-size: 11px;
  opacity: 0.85;
  margin-bottom: 4px;
}

/* Registration date in sidebar */
.sidebar-card-reg {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* Year View */
.year-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.year-month-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 8px;
  background: #fff;
}

.year-month-title {
  font-size: 14px;
  font-weight: 600;
  color: #3870a0;
  text-align: center;
  padding: 4px 0 8px;
  cursor: pointer;
}

.year-month-title:hover {
  text-decoration: underline;
}

.year-month-events {
  padding: 4px 0;
}

.year-event-item {
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  background: #f5f7fa;
  cursor: pointer;
  transition: background 0.2s;
}

.year-event-item:hover {
  background: #ecf5ff;
}

.year-event-item:last-child {
  margin-bottom: 0;
}

.year-event-name {
  font-size: 12px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  word-break: break-all;
}

.year-event-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.year-month-empty {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
  padding: 8px 0;
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

  .year-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
}

@media (max-width: 640px) {
  .calendar-toolbar {
    gap: 6px;
  }

  .current-label {
    font-size: 14px;
    min-width: 120px;
  }

  .weekday-cell {
    font-size: 12px;
  }

  .month-cell {
    min-height: 48px;
    padding: 2px;
  }

  .day-number {
    font-size: 11px;
  }

  /* Event bars become thin colored lines on mobile (text unreadable at this width) */
  .event-bar {
    font-size: 0;
    height: 4px;
    line-height: 4px;
    padding: 0;
    margin-bottom: 1px;
    border-radius: 2px;
  }

  /* Week view: vertical stack instead of 7 columns */
  .week-grid {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .week-col {
    border-left: 1px solid #ebeef5;
  }

  .week-col-header {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    padding: 10px 12px;
  }

  .week-col-body {
    padding: 4px 12px 8px;
  }

  .detail-qrcode {
    max-width: 160px;
    max-height: 160px;
  }
}

@media (max-width: 480px) {
  .year-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

@media (max-width: 380px) {
  .current-label {
    font-size: 13px;
    min-width: 90px;
  }

  .month-cell {
    min-height: 40px;
  }
}
</style>
