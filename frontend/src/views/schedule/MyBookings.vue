<template>
  <div class="my-bookings">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t('schedule.myBookings.title') }}</span>
          <el-button @click="goBack">{{ $t('schedule.myBookings.back') }}</el-button>
        </div>
      </template>

      <el-alert
        :title="$t('schedule.myBookings.description')"
        type="info"
        show-icon
        :closable="false"
        class="mb-4"
      />

      <!-- 筛选 -->
      <el-form :inline="true" class="filter-form">
        <el-form-item :label="$t('schedule.myBookings.filterStatus')">
          <el-select v-model="filter.status" :placeholder="$t('schedule.myBookings.filterStatusAll')" clearable @change="loadBookings">
            <el-option :label="$t('schedule.myBookings.statusConfirmed')" value="confirmed" />
            <el-option :label="$t('schedule.myBookings.statusPending')" value="pending" />
            <el-option :label="$t('schedule.myBookings.statusCompleted')" value="completed" />
            <el-option :label="$t('schedule.myBookings.statusCancelled')" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('schedule.myBookings.filterDateRange')">
          <el-date-picker
            v-model="filter.dateRange"
            type="daterange"
            :range-separator="$t('schedule.myBookings.filterDateSeparator')"
            :start-placeholder="$t('schedule.myBookings.filterStartDate')"
            :end-placeholder="$t('schedule.myBookings.filterEndDate')"
            value-format="YYYY-MM-DD"
            @change="loadBookings"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadBookings">{{ $t('schedule.myBookings.refresh') }}</el-button>
        </el-form-item>
      </el-form>

      <!-- 预约列表 -->
      <el-table v-loading="loading" :data="bookings" stripe border>
        <el-table-column :label="$t('schedule.myBookings.colBookingTime')" width="180">
          <template #default="{ row }">
            <div>{{ formatDate(row.bookingDate) }}</div>
            <div class="time-range">{{ row.startTime }} - {{ row.endTime }}</div>
          </template>
        </el-table-column>

        <el-table-column :label="$t('schedule.myBookings.colTeacher')" width="120">
          <template #default="{ row }">
            <div>{{ row.teacherName }}</div>
          </template>
        </el-table-column>

        <el-table-column :label="$t('schedule.myBookings.colStudent')" min-width="200">
          <template #default="{ row }">
            <div><strong>{{ row.studentName }}</strong></div>
            <div v-if="row.studentClass" class="text-secondary">{{ row.studentClass }}</div>
          </template>
        </el-table-column>

        <el-table-column :label="$t('schedule.myBookings.colParent')" width="180">
          <template #default="{ row }">
            <div v-if="row.parentName">{{ row.parentName }}</div>
            <div v-if="row.parentPhone" class="text-secondary">{{ row.parentPhone }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="purpose" :label="$t('schedule.myBookings.colPurpose')" width="120" />

        <el-table-column prop="note" :label="$t('schedule.myBookings.colNote')" min-width="150" show-overflow-tooltip />

        <el-table-column :label="$t('schedule.myBookings.colStatus')" width="100" fixed="right">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('schedule.myBookings.colOperation')" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'cancelled' && row.status !== 'completed'"
              type="danger"
              size="small"
              @click="cancelBooking(row)"
            >
              {{ $t('schedule.myBookings.cancel') }}
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 会议信息提示 -->
      <el-alert
        v-if="hasUpcomingMeetings"
        :title="$t('schedule.myBookings.upcomingTitle')"
        type="success"
        :closable="false"
        class="mt-4"
      >
        <div v-for="booking in upcomingMeetings" :key="booking._id" class="meeting-item">
          <strong>{{ formatDate(booking.bookingDate) }} {{ booking.startTime }}</strong>
          - {{ booking.teacherName }} ({{ booking.studentName }})
          <span v-if="booking.meetingId">
            | {{ $t('schedule.myBookings.meetingId', { id: booking.meetingId }) }}
            <span v-if="booking.meetingPassword">{{ $t('schedule.myBookings.meetingPassword', { pwd: booking.meetingPassword }) }}</span>
          </span>
        </div>
      </el-alert>

      <div v-if="!bookings.length && !loading" class="empty-bookings">
        <el-empty :description="$t('schedule.myBookings.noBookings')" />
        <el-button type="primary" @click="goToScheduleManage">
          {{ $t('schedule.myBookings.goCreate') }}
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
import { getMyBookings, updateBooking } from '@/api/schedule'
import dayjs from 'dayjs'

const { t } = useI18n()
const router = useRouter()

const loading = ref(false)
const bookings = ref([])
const filter = ref({
  status: '',
  dateRange: []
})

// 即将到来的会议（今天及以后）
const upcomingMeetings = computed(() => {
  const today = dayjs().startOf('day')
  return bookings.value.filter(b =>
    b.status === 'confirmed' &&
    dayjs(b.bookingDate).isAfter(today.subtract(1, 'day'))
  ).slice(0, 5) // 最多显示5条
})

const hasUpcomingMeetings = computed(() => upcomingMeetings.value.length > 0)

async function loadBookings() {
  loading.value = true
  try {
    const params = {}
    if (filter.value.status) {
      params.status = filter.value.status
    }
    if (filter.value.dateRange?.length === 2) {
      params.dateFrom = filter.value.dateRange[0]
      params.dateTo = filter.value.dateRange[1]
    }
    const res = await getMyBookings(params)
    bookings.value = res.data || []
  } catch (error) {
    ElMessage.error(t('schedule.myBookings.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function cancelBooking(booking) {
  try {
    await ElMessageBox.confirm(
      t('schedule.myBookings.confirmCancel', { student: booking.studentName }),
      t('schedule.myBookings.confirmCancelTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )
    await updateBooking(booking._id, { status: 'cancelled' })
    ElMessage.success(t('schedule.myBookings.cancelSuccess'))
    loadBookings()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('schedule.myBookings.cancelFailed'))
    }
  }
}

function goBack() {
  router.back()
}

function goToScheduleManage() {
  router.push('/schedule')
}

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
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
    'confirmed': t('schedule.myBookings.statusConfirmed'),
    'pending': t('schedule.myBookings.statusPending'),
    'cancelled': t('schedule.myBookings.statusCancelled'),
    'completed': t('schedule.myBookings.statusCompleted')
  }
  return labels[status] || status
}

onMounted(() => {
  loadBookings()
})
</script>

<style scoped>
.my-bookings {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  margin-bottom: 20px;
}

.time-range {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.text-secondary {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.meeting-item {
  margin: 8px 0;
  padding: 8px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.empty-bookings {
  text-align: center;
  padding: 40px;
}

.empty-bookings .el-button {
  margin-top: 20px;
}

.mb-4 {
  margin-bottom: 20px;
}

.mt-4 {
  margin-top: 20px;
}
</style>
