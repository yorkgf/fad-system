<template>
  <div class="my-schedule">
    <!-- 移动端头部 -->
    <div class="mobile-header">
      <el-button circle @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <h1 class="page-title">我的日程</h1>
      <el-button type="primary" circle @click="goToScheduleManage">
        <el-icon><Plus /></el-icon>
      </el-button>
    </div>

    <!-- 桌面端头部 -->
    <div class="desktop-header">
      <div class="header-left">
        <el-button class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">我的日程</h1>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-dot active"></span>
          <span class="stat-label">开放时段</span>
          <span class="stat-value">{{ activeSessionsCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-dot closed"></span>
          <span class="stat-label">已关闭</span>
          <span class="stat-value">{{ closedSessionsCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-dot booked"></span>
          <span class="stat-label">有预约</span>
          <span class="stat-value">{{ bookedSessionsCount }}</span>
        </div>
      </div>
    </div>

    <!-- 移动端统计卡片 -->
    <div class="mobile-stats">
      <div class="stat-card">
        <span class="stat-value">{{ activeSessionsCount }}</span>
        <span class="stat-label">开放</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ closedSessionsCount }}</span>
        <span class="stat-label">已关闭</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ bookedSessionsCount }}</span>
        <span class="stat-label">有预约</span>
      </div>
    </div>

    <!-- 日历容器 -->
    <div class="calendar-container">
      <!-- 日历头部 -->
      <div class="calendar-header">
        <div class="month-navigation">
          <el-button circle size="small" @click="changeMonth(-1)">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <span class="current-month">{{ currentYear }}年 {{ currentMonth + 1 }}月</span>
          <el-button circle size="small" @click="changeMonth(1)">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <el-button type="primary" @click="goToScheduleManage" class="manage-btn desktop-only">
          <el-icon><Plus /></el-icon>
          新增时段
        </el-button>
      </div>

      <!-- 日历主体 -->
      <div class="calendar-body" v-loading="loading">
        <!-- 星期标题 -->
        <div class="week-header">
          <div v-for="day in weekDays" :key="day" class="week-day">{{ day }}</div>
        </div>

        <!-- 日期格子 -->
        <div class="days-grid">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="day-cell"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'has-sessions': day.sessions.length > 0
            }"
            @click="selectDay(day)"
          >
            <div class="day-header">
              <span class="day-number">{{ day.date }}</span>
              <span v-if="day.isToday" class="today-badge">今</span>
            </div>

            <!-- 桌面端显示时段详情 -->
            <div class="day-sessions desktop-sessions" v-if="day.sessions.length > 0">
              <div
                v-for="session in day.sessions.slice(0, 3)"
                :key="session._id"
                class="session-item"
                :class="getSessionDisplayClass(session)"
              >
                <span class="session-time">{{ session.startTime }}</span>
                <span class="session-label">
                  <template v-if="session.currentBookings > 0 || (session.bookings && session.bookings.length > 0)">
                    {{ getFirstStudentName(session) || '已预约' }}
                  </template>
                  <template v-else-if="!session.isActive">关闭</template>
                  <template v-else>开放</template>
                </span>
              </div>
              <div v-if="day.sessions.length > 3" class="more-sessions">
                +{{ day.sessions.length - 3 }} 个时段
              </div>
            </div>

            <!-- 移动端显示简化指示器 -->
            <div class="day-indicators mobile-only" v-if="day.sessions.length > 0">
              <div class="indicator-row">
                <span
                  v-for="n in Math.min(day.sessions.length, 3)"
                  :key="n"
                  class="indicator-dot"
                  :class="getSessionStatusClass(day.sessions[n-1])"
                ></span>
              </div>
              <span v-if="day.sessions.length > 3" class="indicator-more">+</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中日期详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="selectedDateTitle"
      :size="isMobile ? '100%' : '480px'"
      class="day-detail-drawer"
      :direction="isMobile ? 'btt' : 'rtl'"
    >
      <div class="day-detail-content">
        <div v-if="selectedDaySessions.length === 0" class="empty-day">
          <el-empty description="该日期没有设置可预约时段">
            <el-button type="primary" @click="goToScheduleManage">
              去设置时段
            </el-button>
          </el-empty>
        </div>

        <div v-else class="sessions-list">
          <div
            v-for="session in selectedDaySessions"
            :key="session._id"
            class="session-card"
            :class="getSessionCardClass(session)"
          >
            <!-- 学生姓名横幅 - 已预约时显示 -->
            <div v-if="getFirstStudentName(session)" class="student-banner">
              <el-icon><UserFilled /></el-icon>
              <span class="banner-name">{{ getFirstStudentName(session) }}</span>
              <span v-if="session.bookings?.length > 1 || session.currentBookings > 1" class="banner-more">
                +{{ (session.bookings?.length || session.currentBookings) - 1 }}
              </span>
            </div>

            <div class="session-card-header">
              <div class="session-time-block">
                <div class="time-range">
                  <span class="start-time">{{ session.startTime }}</span>
                  <span class="time-separator">-</span>
                  <span class="end-time">{{ session.endTime }}</span>
                </div>
                <div class="session-duration">
                  {{ calculateDuration(session.startTime, session.endTime) }}分钟
                </div>
              </div>

              <div class="session-actions">
                <el-tag
                  :type="getSessionTagType(session)"
                  size="small"
                  effect="light"
                  class="status-tag"
                >
                  {{ getSessionStatusText(session) }}
                </el-tag>
                <el-switch
                  v-model="session.isActive"
                  @change="(val) => handleToggleSession(session, val)"
                />
              </div>
            </div>

            <div class="session-card-body">
              <div class="session-info-row">
                <el-icon><Location /></el-icon>
                <span>{{ session.location || '未设置地点' }}</span>
              </div>
              <div class="session-info-row" v-if="session.note">
                <el-icon><Document /></el-icon>
                <span>{{ session.note }}</span>
              </div>
              <div class="session-info-row" v-if="session.meetingId">
                <el-icon><VideoCamera /></el-icon>
                <span>会议号: {{ session.meetingId }}</span>
              </div>
            </div>

            <!-- 预约信息直接展示 -->
            <div v-if="session.bookings?.length > 0" class="bookings-section">
              <el-divider />
              <div class="bookings-list">
                <div
                  v-for="booking in session.bookings"
                  :key="booking._id"
                  class="booking-card"
                >
                  <div class="booking-header">
                    <div class="booking-student">
                      <el-icon><User /></el-icon>
                      <span class="student-name">{{ booking.studentName || '未填写姓名' }}</span>
                    </div>
                    <el-tag :type="getStatusType(booking.status)" size="small" effect="light">
                      {{ getStatusLabel(booking.status) }}
                    </el-tag>
                  </div>
                  <div class="booking-info">
                    <div v-if="booking.studentClass" class="info-item">
                      <span class="info-label">班级:</span>
                      <span class="info-value">{{ booking.studentClass }}</span>
                    </div>
                    <div v-if="booking.parentName" class="info-item">
                      <span class="info-label">家长:</span>
                      <span class="info-value">{{ booking.parentName }}</span>
                    </div>
                    <div v-if="booking.parentPhone" class="info-item">
                      <span class="info-label">电话:</span>
                      <span class="info-value">{{ booking.parentPhone }}</span>
                    </div>
                    <div v-if="booking.purpose" class="info-item">
                      <span class="info-label">目的:</span>
                      <span class="info-value purpose">{{ booking.purpose }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 无预约时的底部 -->
            <div v-else class="session-card-footer">
              <div class="booking-status">
                <div class="booking-count">
                  <span>{{ session.currentBookings }} / {{ session.maxBookings }} 可预约</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMySessions, updateSession } from '@/api/schedule'
import dayjs from 'dayjs'
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  User,
  UserFilled,
  CircleClose,
  Location,
  Document,
  VideoCamera
} from '@element-plus/icons-vue'

const router = useRouter()

// 状态
const loading = ref(false)
const sessions = ref([])
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const drawerVisible = ref(false)
const selectedDate = ref(null)
const expandedSessionId = ref(null)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 检测移动端
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768
})

// 计算属性
const activeSessionsCount = computed(() =>
  sessions.value.filter(s => s.isActive).length
)

const closedSessionsCount = computed(() =>
  sessions.value.filter(s => !s.isActive).length
)

const bookedSessionsCount = computed(() =>
  sessions.value.filter(s => s.currentBookings > 0 || (s.bookings && s.bookings.length > 0)).length
)

const selectedDateTitle = computed(() => {
  if (!selectedDate.value) return ''
  const dateStr = dayjs(selectedDate.value).format('YYYY年MM月DD日')
  const weekDay = weekDays[dayjs(selectedDate.value).day()]
  return `${dateStr} 星期${weekDay}`
})

const selectedDaySessions = computed(() => {
  if (!selectedDate.value) return []
  const dateStr = dayjs(selectedDate.value).format('YYYY-MM-DD')
  return sessions.value
    .filter(s => s.date === dateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
})

// 日历天数计算
const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startDayOfWeek = firstDayOfMonth.getDay()

  const days = []

  // 上个月的日期
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push(createDayObject(date, false))
  }

  // 当前月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    days.push(createDayObject(date, true))
  }

  // 下个月的日期
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push(createDayObject(date, false))
  }

  return days
})

function createDayObject(date, isCurrentMonth) {
  const dateStr = dayjs(date).format('YYYY-MM-DD')
  const today = dayjs().format('YYYY-MM-DD')

  const daySessions = sessions.value.filter(s => s.date === dateStr)

  return {
    date: date.getDate(),
    fullDate: dateStr,
    isCurrentMonth,
    isToday: dateStr === today,
    sessions: daySessions
  }
}

function getSessionStatusClass(session) {
  if (!session) return ''
  // 已预约 - 红色 (优先级高于已关闭)
  if (session.currentBookings > 0 || (session.bookings && session.bookings.length > 0)) return 'booked'
  // 已关闭 - 灰色
  if (!session.isActive) return 'closed'
  // 开放 - 绿色
  return 'active'
}

function getSessionDisplayClass(session) {
  if (!session) return {}
  const hasBooking = session.currentBookings > 0 || (session.bookings && session.bookings.length > 0)
  return {
    'booked': hasBooking,      // 已预约 - 红色
    'closed': !session.isActive && !hasBooking,  // 已关闭 - 灰色 (且没有预约)
    'active': session.isActive && !hasBooking    // 开放 - 绿色
  }
}

function getSessionCardClass(session) {
  const hasBooking = session.currentBookings > 0 || (session.bookings && session.bookings.length > 0)
  return {
    'booked': hasBooking,      // 已预约卡片样式
    'closed': !session.isActive && !hasBooking   // 已关闭卡片样式
  }
}

function getSessionTagType(session) {
  const hasBooking = session.currentBookings > 0 || (session.bookings && session.bookings.length > 0)
  if (hasBooking) return 'danger'      // 已预约 - 红色
  if (!session.isActive) return 'info' // 已关闭 - 灰色
  return 'success'                     // 开放中 - 绿色
}

function getSessionStatusText(session) {
  const hasBooking = session.currentBookings > 0 || (session.bookings && session.bookings.length > 0)
  if (hasBooking) return '已预约'
  if (!session.isActive) return '已关闭'
  return '开放中'
}

function getFirstStudentName(session) {
  if (!session.bookings || session.bookings.length === 0) return ''
  const firstBooking = session.bookings[0]
  return firstBooking.studentName || firstBooking.parentName || ''
}

// 方法
async function loadMySessions() {
  loading.value = true
  try {
    const startDate = dayjs(new Date(currentYear.value, currentMonth.value - 1, 1))
      .format('YYYY-MM-DD')
    const endDate = dayjs(new Date(currentYear.value, currentMonth.value + 2, 0))
      .format('YYYY-MM-DD')

    const res = await getMySessions({
      dateFrom: startDate,
      dateTo: endDate,
      includeHistory: true  // 包含历史记录
    })
    sessions.value = res.data || []
  } catch (error) {
    ElMessage.error('获取日程失败')
  } finally {
    loading.value = false
  }
}

function changeMonth(delta) {
  let newMonth = currentMonth.value + delta
  let newYear = currentYear.value

  if (newMonth > 11) {
    newMonth = 0
    newYear++
  } else if (newMonth < 0) {
    newMonth = 11
    newYear--
  }

  currentMonth.value = newMonth
  currentYear.value = newYear
  loadMySessions()
}

function selectDay(day) {
  selectedDate.value = day.fullDate
  drawerVisible.value = true
  expandedSessionId.value = null
}

async function handleToggleSession(session, isActive) {
  if (!isActive && session.currentBookings > 0) {
    try {
      await ElMessageBox.confirm(
        `该时段已有 ${session.currentBookings} 个预约，关闭后新用户将无法预约，但已有预约仍然有效。是否继续？`,
        '确认关闭',
        {
          confirmButtonText: '确认关闭',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch (error) {
      session.isActive = true
      return
    }
  }

  try {
    await updateSession(session._id, { isActive })
    ElMessage.success(isActive ? '时段已开放' : '时段已关闭')

    const sessionIndex = sessions.value.findIndex(s => s._id === session._id)
    if (sessionIndex !== -1) {
      sessions.value[sessionIndex].isActive = isActive
    }
  } catch (error) {
    ElMessage.error('操作失败')
    session.isActive = !isActive
  }
}

function showBookings(session) {
  if (expandedSessionId.value === session._id) {
    expandedSessionId.value = null
  } else {
    expandedSessionId.value = session._id
  }
}

function calculateDuration(startTime, endTime) {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  return (endH * 60 + endM) - (startH * 60 + startM)
}

function getStatusType(status) {
  const types = {
    'confirmed': 'success',
    'pending': 'warning',
    'cancelled': 'info',
    'completed': 'primary'
  }
  return types[status] || 'info'
}

function getStatusLabel(status) {
  const labels = {
    'confirmed': '已确认',
    'pending': '待确认',
    'cancelled': '已取消',
    'completed': '已完成'
  }
  return labels[status] || status
}

function goBack() {
  router.back()
}

function goToScheduleManage() {
  router.push('/schedule')
}

onMounted(() => {
  loadMySessions()
})
</script>

<style scoped>
.my-schedule {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  max-width: 1400px;
  margin: 0 auto;
}

/* 移动端元素默认隐藏 */
.mobile-header,
.mobile-stats,
.mobile-only {
  display: none;
}

/* 桌面端头部 */
.desktop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 20px 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  letter-spacing: -0.5px;
}

.header-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.stat-dot.active { background: #67c23a; }
.stat-dot.booked { background: #f56c6c; }  /* 已预约 - 红色 */
.stat-dot.closed { background: #909399; }  /* 已关闭 - 灰色 */

.stat-label { color: #606266; }
.stat-value { font-weight: 600; color: #1a1a2e; }

/* 日历容器 */
.calendar-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 日历头部 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.month-navigation {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-month {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  min-width: 140px;
  text-align: center;
}

.manage-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 日历主体 */
.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #fafbfc;
  border-bottom: 1px solid #f0f0f0;
}

.week-day {
  padding: 16px 8px;
  text-align: center;
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

/* 日期网格 */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  min-height: 600px;
}

.day-cell {
  min-height: 100px;
  padding: 12px;
  border-right: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.day-cell:nth-child(7n) { border-right: none; }
.day-cell:hover { background: #f5f7fa; }
.day-cell.other-month { background: #fafbfc; color: #c0c4cc; }
.day-cell.today { background: #ecf5ff; }

.day-cell.today .day-number {
  background: #409eff;
  color: white;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.day-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.other-month .day-number { color: #c0c4cc; }

.today-badge {
  font-size: 11px;
  color: #409eff;
  font-weight: 500;
}

/* 日期内的时段 */
.day-sessions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s;
}

.session-item.active { background: #f0f9eb; color: #67c23a; }
.session-item.booked { background: #fef0f0; color: #f56c6c; }  /* 已预约 - 红色 */
.session-item.closed { background: #f4f4f5; color: #909399; }  /* 已关闭 - 灰色 */

.session-time { font-weight: 500; min-width: 36px; }

.session-label {
  font-size: 11px;
  font-weight: 500;
  flex: 1;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70px;
}

.session-status { font-size: 11px; }

.more-sessions {
  font-size: 11px;
  color: #909399;
  text-align: center;
  padding: 2px;
}

/* 抽屉样式 */
.day-detail-content {
  padding: 20px;
}

.empty-day {
  padding: 40px 0;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.session-card {
  background: #fafbfc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #ebeef5;
  transition: all 0.2s;
}

.session-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.session-card.booked {
  background: #fef0f0;
  border-color: #fde2e2;
}

.session-card.closed {
  background: #f4f4f5;
  border-color: #e4e7ed;
  opacity: 0.8;
}

/* 学生姓名横幅 */
.student-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #f56c6c 0%, #e53935 100%);
  color: white;
  padding: 8px 12px;
  margin: -16px -16px 12px -16px;
  border-radius: 12px 12px 0 0;
  font-weight: 600;
}

.student-banner .el-icon {
  font-size: 16px;
}

.banner-name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-more {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
}

.session-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.session-time-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.time-separator {
  color: #909399;
  font-weight: 400;
}

.session-duration {
  font-size: 12px;
  color: #909399;
}

.session-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.session-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.session-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.session-info-row .el-icon {
  color: #909399;
  font-size: 14px;
}

.session-card-footer {
  padding-top: 12px;
  border-top: 1px dashed #dcdfe6;
}

.booking-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.booking-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.booking-count .el-icon { color: #409eff; }
.booking-count .full { color: #f56c6c; font-weight: 500; }

/* 预约详情直接展示 */
.bookings-section {
  margin-top: 12px;
}

.bookings-section :deep(.el-divider) {
  margin: 12px 0;
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.booking-card {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e4e7ed;
}

.booking-student {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.booking-student .el-icon {
  color: #409eff;
  font-size: 16px;
}

.booking-student .student-name {
  font-size: 15px;
  color: #1a1a2e;
}

.booking-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.info-label {
  color: #909399;
  min-width: 40px;
}

.info-value {
  color: #606266;
  font-weight: 500;
}

.info-value.purpose {
  color: #303133;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  flex: 1;
}

/* 旧样式兼容 */
.booking-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.booking-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.student-name {
  font-weight: 500;
  color: #1a1a2e;
}

.student-class {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.booking-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #606266;
}

/* ==================== 移动端适配 ==================== */
@media (max-width: 768px) {
  .my-schedule {
    padding: 0;
    background: white;
  }

  /* 显示移动端元素 */
  .mobile-header,
  .mobile-stats,
  .mobile-only {
    display: flex;
  }

  .desktop-header,
  .desktop-only,
  .desktop-sessions {
    display: none !important;
  }

  /* 移动端头部 */
  .mobile-header {
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: white;
    border-bottom: 1px solid #e4e7ed;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .mobile-header .page-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #303133;
  }

  /* 移动端统计 */
  .mobile-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 16px;
    background: #f5f7fa;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .stat-card .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #409eff;
  }

  .stat-card .stat-label {
    font-size: 12px;
    color: #909399;
  }

  /* 日历容器 */
  .calendar-container {
    border-radius: 0;
    box-shadow: none;
  }

  .calendar-header {
    padding: 12px 16px;
  }

  .current-month {
    font-size: 16px;
    min-width: auto;
  }

  /* 日历网格 */
  .week-header {
    background: white;
    border-bottom: 1px solid #e4e7ed;
  }

  .week-day {
    padding: 10px 4px;
    font-size: 12px;
    color: #909399;
  }

  .days-grid {
    min-height: auto;
  }

  .day-cell {
    min-height: 60px;
    padding: 4px;
    gap: 2px;
    align-items: center;
    justify-content: flex-start;
  }

  .day-header {
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .day-number {
    font-size: 14px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .today-badge {
    display: none;
  }

  /* 移动端指示器 */
  .day-indicators {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .indicator-row {
    display: flex;
    gap: 3px;
  }

  .indicator-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #dcdfe6;
  }

  .indicator-dot.active { background: #67c23a; }
  .indicator-dot.booked { background: #f56c6c; }  /* 已预约 - 红色 */
  .indicator-dot.closed { background: #c0c4cc; }  /* 已关闭 - 灰色 */

  .indicator-more {
    font-size: 10px;
    color: #909399;
    line-height: 1;
  }

  /* 抽屉 */
  .day-detail-content {
    padding: 16px;
  }

  .session-card {
    padding: 12px;
  }

  .student-banner {
    margin: -12px -12px 12px -12px;
    padding: 6px 12px;
    border-radius: 12px 12px 0 0;
  }

  .banner-name {
    font-size: 13px;
  }

  .session-card-header {
    flex-direction: column;
    gap: 12px;
  }

  .time-range {
    font-size: 16px;
  }

  .session-actions {
    width: 100%;
    justify-content: space-between;
  }

  .status-tag {
    flex: 1;
    text-align: center;
  }

  .booking-main {
    gap: 8px;
  }

  .student-name {
    font-size: 14px;
  }

  .booking-sub {
    gap: 8px;
    font-size: 11px;
  }

  .booking-card {
    padding: 10px;
  }

  .booking-header {
    margin-bottom: 8px;
    padding-bottom: 6px;
  }

  .booking-student .student-name {
    font-size: 14px;
  }

  .info-item {
    font-size: 12px;
    gap: 6px;
  }

  .info-label {
    min-width: 36px;
  }
}

/* 小屏幕手机 */
@media (max-width: 375px) {
  .day-cell {
    min-height: 50px;
  }

  .day-number {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .indicator-dot {
    width: 5px;
    height: 5px;
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .my-schedule {
    padding: 16px;
  }

  .days-grid {
    min-height: 500px;
  }

  .day-cell {
    min-height: 80px;
    padding: 8px;
  }
}
</style>
