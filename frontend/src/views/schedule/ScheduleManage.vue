<template>
  <div class="schedule-manage">
    <!-- 移动端头部 -->
    <div class="mobile-header">
      <el-button circle @click="showMySchedule">
        <el-icon><Calendar /></el-icon>
      </el-button>
      <h1 class="page-title">{{ $t('schedule.manage.title') }}</h1>
      <el-button type="primary" circle @click="scrollToForm">
        <el-icon><Plus /></el-icon>
      </el-button>
    </div>

    <!-- 桌面端头部 -->
    <el-card class="desktop-header">
      <template #header>
        <div class="card-header">
          <span>{{ $t('schedule.manage.title') }}</span>
          <div class="header-actions">
            <el-button type="primary" @click="showMySchedule">
              <el-icon><Calendar /></el-icon>
              {{ $t('schedule.manage.mySchedule') }}
            </el-button>
          </div>
        </div>
      </template>
    </el-card>

    <!-- 创建时段表单 -->
    <el-card id="create-form" class="create-card">
      <template #header>
        <div class="section-header">
          <el-icon class="section-icon"><Plus /></el-icon>
          <span>{{ $t('schedule.manage.batchCreateTitle') }}</span>
        </div>
      </template>

      <el-alert
        :title="$t('schedule.manage.batchCreateHint')"
        type="info"
        show-icon
        :closable="false"
        class="mobile-alert"
      />

      <el-form :model="batchForm" label-position="top" class="mobile-form">
        <!-- 选择日期 -->
        <el-form-item :label="$t('schedule.manage.selectDates')">
          <el-date-picker
            v-model="batchForm.dates"
            type="dates"
            :placeholder="$t('schedule.manage.selectMultipleDates')"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            class="full-width"
          />
        </el-form-item>

        <!-- 时间设置 -->
        <div class="time-sections">
          <!-- 上午时段 -->
          <div class="time-section" :class="{ active: batchForm.enableMorning }">
            <div class="time-section-header">
              <el-checkbox v-model="batchForm.enableMorning" size="large">
                {{ $t('schedule.manage.morning') }}
              </el-checkbox>
            </div>
            <div class="time-pickers" v-show="batchForm.enableMorning">
              <el-time-picker
                v-model="batchForm.morningStart"
                :placeholder="$t('schedule.manage.startPlaceholder')"
                format="HH:mm"
                value-format="HH:mm"
                class="time-picker"
              />
              <span class="time-to">{{ $t('schedule.manage.timeTo') }}</span>
              <el-time-picker
                v-model="batchForm.morningEnd"
                :placeholder="$t('schedule.manage.endPlaceholder')"
                format="HH:mm"
                value-format="HH:mm"
                class="time-picker"
              />
            </div>
          </div>

          <!-- 下午时段 -->
          <div class="time-section" :class="{ active: batchForm.enableAfternoon }">
            <div class="time-section-header">
              <el-checkbox v-model="batchForm.enableAfternoon" size="large">
                {{ $t('schedule.manage.afternoon') }}
              </el-checkbox>
            </div>
            <div class="time-pickers" v-show="batchForm.enableAfternoon">
              <el-time-picker
                v-model="batchForm.afternoonStart"
                :placeholder="$t('schedule.manage.startPlaceholder')"
                format="HH:mm"
                value-format="HH:mm"
                class="time-picker"
              />
              <span class="time-to">{{ $t('schedule.manage.timeTo') }}</span>
              <el-time-picker
                v-model="batchForm.afternoonEnd"
                :placeholder="$t('schedule.manage.endPlaceholder')"
                format="HH:mm"
                value-format="HH:mm"
                class="time-picker"
              />
            </div>
          </div>
        </div>

        <!-- 时间分割 -->
        <el-form-item :label="$t('schedule.manage.timeSplit')">
          <el-radio-group v-model="batchForm.segmentDuration" class="segment-radio">
            <el-radio-button :label="10">10分</el-radio-button>
            <el-radio-button :label="15">15分</el-radio-button>
            <el-radio-button :label="20">20分</el-radio-button>
            <el-radio-button :label="30">30分</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 地点（必选） -->
        <el-form-item :label="$t('schedule.manage.location')" required>
          <el-select v-model="batchForm.location" :placeholder="$t('schedule.manage.selectLocation')" class="full-width">
            <el-option :label="$t('schedule.manage.locationOffline')" value="线下" />
            <el-option :label="$t('schedule.manage.locationOnline')" value="腾讯会议" />
          </el-select>
        </el-form-item>

        <!-- 备注 -->
        <el-form-item :label="$t('schedule.manage.note')">
          <el-input
            v-model="batchForm.note"
            type="textarea"
            :rows="2"
            :placeholder="$t('schedule.manage.notePlaceholder')"
            class="full-width"
          />
        </el-form-item>

        <el-form-item class="form-actions">
          <el-button type="primary" :loading="creating" @click="createBatchSessions" class="submit-btn">
            {{ $t('schedule.manage.createBtn') }}
          </el-button>
          <el-button @click="clearForm" class="reset-btn">{{ $t('schedule.manage.clearBtn') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 我的时段列表 -->
    <el-card class="sessions-card">
      <template #header>
        <div class="section-header">
          <el-icon class="section-icon"><List /></el-icon>
          <span>{{ $t('schedule.manage.mySessionsTitle') }}</span>
          <el-tag type="info" size="small" class="count-tag">{{ mySessions.length }}</el-tag>
        </div>
      </template>

      <!-- 桌面端表格 -->
      <div class="desktop-table">
        <el-table v-loading="mySessionsLoading" :data="mySessions" stripe>
          <el-table-column prop="date" :label="$t('schedule.manage.date')" width="120">
            <template #default="{ row }">
              {{ formatDate(row.date) }}
            </template>
          </el-table-column>
          <el-table-column prop="startTime" :label="$t('schedule.manage.start')" width="80" />
          <el-table-column prop="endTime" :label="$t('schedule.manage.end')" width="80" />
          <el-table-column prop="location" :label="$t('schedule.manage.locationCol')" min-width="120" />
          <el-table-column :label="$t('schedule.manage.bookingStatus')" width="120">
            <template #default="{ row }">
              <el-tag :type="row.currentBookings > 0 ? 'success' : 'info'">
                {{ row.currentBookings }} / {{ row.maxBookings }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('schedule.manage.operation')" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.currentBookings === 0"
                type="danger"
                size="small"
                @click="handleDeleteSession(row._id)"
              >
                {{ $t('schedule.manage.delete') }}
              </el-button>
              <el-tag v-else type="info" size="small">{{ $t('schedule.manage.hasBooking') }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 移动端卡片列表 -->
      <div class="mobile-list">
        <div v-if="mySessions.length === 0" class="empty-state">
          <el-empty :description="$t('schedule.manage.noSessions')">
            <template #image>
              <el-icon :size="60" color="#dcdfe6"><Calendar /></el-icon>
            </template>
          </el-empty>
        </div>

        <div v-else class="session-items">
          <div
            v-for="session in mySessions"
            :key="session._id"
            class="session-list-item"
            :class="{ 'has-booking': session.currentBookings > 0 }"
          >
            <div class="item-main">
              <div class="item-date-time">
                <span class="item-date">{{ formatDate(session.date) }}</span>
                <span class="item-time">{{ session.startTime }} - {{ session.endTime }}</span>
              </div>
              <div class="item-status">
                <el-tag
                  :type="session.currentBookings > 0 ? 'success' : 'info'"
                  size="small"
                  effect="light"
                >
                  {{ session.currentBookings }}/{{ session.maxBookings }}
                </el-tag>
              </div>
            </div>
            <div class="item-location" v-if="session.location">
              <el-icon><Location /></el-icon>
              <span>{{ session.location }}</span>
            </div>
            <div class="item-actions">
              <el-button
                v-if="session.currentBookings === 0"
                type="danger"
                size="small"
                text
                @click="handleDeleteSession(session._id)"
              >
                <el-icon><Delete /></el-icon>
                {{ $t('schedule.manage.delete') }}
              </el-button>
              <span v-else class="booked-hint">
                <el-icon><UserFilled /></el-icon>
                {{ $t('schedule.manage.bookedHint', { count: session.currentBookings }) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 批量删除按钮 -->
      <div class="batch-actions" v-if="mySessions.length > 0">
        <el-button
          type="danger"
          text
          size="small"
          @click="deleteAllSessions"
          class="delete-all-btn"
        >
          <el-icon><Delete /></el-icon>
          {{ $t('schedule.manage.deleteAllUnbooked') }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createSessionsBatch,
  deleteSession as deleteSessionAPI,
  getMySessions
} from '@/api/schedule'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import { Calendar, Plus, List, Location, Delete, UserFilled } from '@element-plus/icons-vue'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

// 当前激活的标签页
const activeTab = ref('my')

// 批量创建表单
const batchForm = ref({
  dates: [],
  morningStart: '09:00',
  morningEnd: '12:00',
  enableMorning: true,
  afternoonStart: '14:00',
  afternoonEnd: '17:00',
  enableAfternoon: true,
  segmentDuration: 15,
  location: '',
  maxBookings: 1,
  note: ''
})
const creating = ref(false)

// 我的时段列表
const mySessions = ref([])
const mySessionsLoading = ref(false)

// 判断当前用户是否为教师
const isTeacher = computed(() => {
  const teacherGroups = ['S', 'A', 'B', 'T', 'F']
  return teacherGroups.includes(userStore.userGroup)
})

function scrollToForm() {
  document.getElementById('create-form')?.scrollIntoView({ behavior: 'smooth' })
}

function generateTimeSlots(startTime, endTime, duration) {
  const slots = []
  let current = parseTime(startTime)
  const end = parseTime(endTime)

  while (current + duration <= end) {
    const slotStart = formatTime(current)
    const slotEnd = formatTime(current + duration)
    slots.push({
      startTime: slotStart,
      endTime: slotEnd
    })
    current += duration
  }

  return slots
}

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function checkTimeConflict(date, startTime, endTime, existingSessions) {
  const parseTimeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  const newStart = parseTimeToMinutes(startTime)
  const newEnd = parseTimeToMinutes(endTime)

  for (const existing of existingSessions) {
    if (existing.date !== date) continue

    const existingStart = parseTimeToMinutes(existing.startTime)
    const existingEnd = parseTimeToMinutes(existing.endTime)

    if (newStart < existingEnd && newEnd > existingStart) {
      return {
        hasConflict: true,
        conflictSession: existing
      }
    }
  }

  return { hasConflict: false }
}

async function createBatchSessions() {
  if (!batchForm.value.dates?.length) {
    ElMessage.warning(t('schedule.manage.selectDateRequired'))
    return
  }

  if (!batchForm.value.enableMorning && !batchForm.value.enableAfternoon) {
    ElMessage.warning(t('schedule.manage.selectTimeRequired'))
    return
  }

  if (!batchForm.value.location) {
    ElMessage.warning(t('schedule.manage.selectLocationRequired'))
    return
  }

  creating.value = true

  try {
    const sessions = []
    const duration = batchForm.value.segmentDuration
    const conflicts = []

    for (const date of batchForm.value.dates) {
      if (batchForm.value.enableMorning) {
        const morningSlots = generateTimeSlots(
          batchForm.value.morningStart,
          batchForm.value.morningEnd,
          duration
        )
        morningSlots.forEach(slot => {
          const conflictCheck = checkTimeConflict(date, slot.startTime, slot.endTime, mySessions.value)
          if (conflictCheck.hasConflict) {
            conflicts.push({
              date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              conflictWith: conflictCheck.conflictSession
            })
          } else {
            sessions.push({
              date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              location: batchForm.value.location,
              maxBookings: batchForm.value.maxBookings,
              note: batchForm.value.note
            })
          }
        })
      }

      if (batchForm.value.enableAfternoon) {
        const afternoonSlots = generateTimeSlots(
          batchForm.value.afternoonStart,
          batchForm.value.afternoonEnd,
          duration
        )
        afternoonSlots.forEach(slot => {
          const conflictCheck = checkTimeConflict(date, slot.startTime, slot.endTime, mySessions.value)
          if (conflictCheck.hasConflict) {
            conflicts.push({
              date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              conflictWith: conflictCheck.conflictSession
            })
          } else {
            sessions.push({
              date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              location: batchForm.value.location,
              maxBookings: batchForm.value.maxBookings,
              note: batchForm.value.note
            })
          }
        })
      }
    }

    // 如果有冲突，显示警告并停止创建
    if (conflicts.length > 0) {
      const conflictMessages = conflicts.slice(0, 3).map(c =>
        t('schedule.manage.conflictDetail', {
          date: c.date,
          start: c.startTime,
          end: c.endTime,
          existStart: c.conflictWith.startTime,
          existEnd: c.conflictWith.endTime
        })
      )
      let message = t('schedule.manage.conflictError', { count: conflicts.length })
      if (conflicts.length > 3) {
        message += t('schedule.manage.conflictMore', { details: conflictMessages.join('\n') })
      } else {
        message += conflictMessages.join('\n')
      }
      ElMessage.error(message)
      creating.value = false
      return
    }

    if (sessions.length === 0) {
      ElMessage.warning(t('schedule.manage.noSlotsGenerated'))
      return
    }

    await createSessionsBatch({ sessions })
    ElMessage.success(t('schedule.manage.createSuccess', { count: sessions.length }))

    batchForm.value.dates = []
    batchForm.value.location = ''
    batchForm.value.note = ''

    loadMySessions()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || t('schedule.manage.createFailed'))
  } finally {
    creating.value = false
  }
}

async function loadMySessions() {
  mySessionsLoading.value = true
  try {
    const res = await getMySessions({ includeHistory: false })
    mySessions.value = res.data || []
  } catch (error) {
    ElMessage.error(t('schedule.manage.loadFailed'))
  } finally {
    mySessionsLoading.value = false
  }
}

async function handleDeleteSession(id) {
  try {
    await ElMessageBox.confirm(
      t('schedule.manage.confirmDelete'),
      t('schedule.manage.confirmDeleteTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )
    await deleteSessionAPI(id)
    ElMessage.success(t('schedule.manage.deleteSuccess'))
    loadMySessions()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || t('schedule.manage.deleteFailed'))
    }
  }
}

async function deleteAllSessions() {
  try {
    await ElMessageBox.confirm(
      t('schedule.manage.confirmDeleteAll'),
      t('schedule.manage.confirmDeleteAllTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )
    const unbookedSessions = mySessions.value.filter(s => s.currentBookings === 0)
    for (const session of unbookedSessions) {
      await deleteSessionAPI(session._id)
    }
    ElMessage.success(t('schedule.manage.deleteSuccess'))
    loadMySessions()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('schedule.manage.deleteFailed'))
    }
  }
}

function showMySchedule() {
  router.push('/schedule/my')
}

function clearForm() {
  batchForm.value.dates = []
  batchForm.value.location = ''
  batchForm.value.note = ''
  batchForm.value.enableMorning = true
  batchForm.value.enableAfternoon = true
}

function disabledDate(date) {
  return date < new Date(new Date().setHours(0, 0, 0, 0))
}

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('MM-DD')
}

onMounted(() => {
  if (isTeacher.value) {
    loadMySessions()
  }
})
</script>

<style scoped>
.schedule-manage {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 移动端头部 */
.mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  margin: -16px -16px 16px -16px;
  border-bottom: 1px solid #e4e7ed;
}

.mobile-header .page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

/* 桌面端头部 */
.desktop-header {
  margin-bottom: 20px;
}

.desktop-header :deep(.el-card__header) {
  padding: 16px 20px;
}

.desktop-header :deep(.el-card__body) {
  display: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 通用卡片样式 */
.create-card,
.sessions-card {
  margin-bottom: 20px;
}

.create-card :deep(.el-card__header),
.sessions-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.section-icon {
  color: #409eff;
}

.count-tag {
  margin-left: auto;
}

/* 表单样式 */
.mobile-alert {
  margin-bottom: 20px;
}

.mobile-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

.full-width {
  width: 100%;
}

/* 时间设置区域 */
.time-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.time-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.time-section.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.time-section-header {
  margin-bottom: 12px;
}

.time-pickers {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-picker {
  flex: 1;
}

.time-picker :deep(.el-input__wrapper) {
  width: 100%;
}

.time-to {
  color: #909399;
  font-size: 14px;
}

/* 分割选择 */
.segment-radio {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.segment-radio :deep(.el-radio-button__inner) {
  padding: 8px 16px;
}

/* 表单操作 */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed #dcdfe6;
}

.submit-btn {
  flex: 1;
}

.reset-btn {
  flex: 0.5;
}

/* 桌面端表格 */
.desktop-table {
  display: block;
}

/* 移动端列表 */
.mobile-list {
  display: none;
}

.empty-state {
  padding: 40px 0;
}

.session-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-list-item {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.session-list-item.has-booking {
  background: #f0f9eb;
  border-color: #b3e19d;
}

.item-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-date-time {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-date {
  font-size: 14px;
  color: #909399;
}

.item-time {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.item-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
}

.item-location .el-icon {
  color: #909399;
}

.item-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px dashed #dcdfe6;
}

.booked-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #67c23a;
}

/* 批量操作 */
.batch-actions {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.delete-all-btn {
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .schedule-manage {
    padding: 0;
    background: white;
  }

  .mobile-header {
    display: flex;
  }

  .desktop-header {
    display: none;
  }

  .create-card,
  .sessions-card {
    margin: 0 0 12px 0;
    border-radius: 0;
    box-shadow: none;
    border: none;
    border-bottom: 8px solid #f5f7fa;
  }

  .create-card :deep(.el-card__header),
  .sessions-card :deep(.el-card__header) {
    padding: 16px;
  }

  .create-card :deep(.el-card__body),
  .sessions-card :deep(.el-card__body) {
    padding: 16px;
  }

  .mobile-form :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  .time-sections {
    gap: 12px;
  }

  .time-section {
    padding: 12px;
  }

  .time-pickers {
    flex-direction: column;
    gap: 8px;
  }

  .time-picker {
    width: 100%;
  }

  .time-to {
    display: none;
  }

  .segment-radio {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }

  .segment-radio :deep(.el-radio-button) {
    flex: 1;
  }

  .segment-radio :deep(.el-radio-button__inner) {
    width: 100%;
    padding: 10px 0;
    text-align: center;
  }

  .form-actions {
    flex-direction: column;
    gap: 12px;
  }

  .submit-btn,
  .reset-btn {
    width: 100%;
    flex: none;
  }

  .desktop-table {
    display: none;
  }

  .mobile-list {
    display: block;
  }
}

@media (min-width: 769px) {
  .schedule-manage {
    padding: 24px;
  }

  .mobile-form :deep(.el-form-item__label) {
    padding-bottom: 8px;
  }
}
</style>
