<template>
  <div class="my-bookings">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的预约</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>

      <el-alert
        title="以下是您为学生创建的所有预约记录"
        type="info"
        show-icon
        :closable="false"
        class="mb-4"
      />

      <!-- 筛选 -->
      <el-form :inline="true" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部状态" clearable @change="loadBookings">
            <el-option label="已确认" value="confirmed" />
            <el-option label="待确认" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filter.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="loadBookings"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadBookings">刷新</el-button>
        </el-form-item>
      </el-form>

      <!-- 预约列表 -->
      <el-table v-loading="loading" :data="bookings" stripe border>
        <el-table-column label="预约时间" width="180">
          <template #default="{ row }">
            <div>{{ formatDate(row.bookingDate) }}</div>
            <div class="time-range">{{ row.startTime }} - {{ row.endTime }}</div>
          </template>
        </el-table-column>

        <el-table-column label="被预约教师" width="120">
          <template #default="{ row }">
            <div>{{ row.teacherName }}</div>
          </template>
        </el-table-column>

        <el-table-column label="学生信息" min-width="200">
          <template #default="{ row }">
            <div><strong>{{ row.studentName }}</strong></div>
            <div v-if="row.studentClass" class="text-secondary">{{ row.studentClass }}</div>
          </template>
        </el-table-column>

        <el-table-column label="家长信息" width="180">
          <template #default="{ row }">
            <div v-if="row.parentName">{{ row.parentName }}</div>
            <div v-if="row.parentPhone" class="text-secondary">{{ row.parentPhone }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="purpose" label="预约目的" width="120" />

        <el-table-column prop="note" label="备注" min-width="150" show-overflow-tooltip />

        <el-table-column label="状态" width="100" fixed="right">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'cancelled' && row.status !== 'completed'"
              type="danger"
              size="small"
              @click="cancelBooking(row)"
            >
              取消
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 会议信息提示 -->
      <el-alert
        v-if="hasUpcomingMeetings"
        title="即将到来的会议"
        type="success"
        :closable="false"
        class="mt-4"
      >
        <div v-for="booking in upcomingMeetings" :key="booking._id" class="meeting-item">
          <strong>{{ formatDate(booking.bookingDate) }} {{ booking.startTime }}</strong>
          - {{ booking.teacherName }} ({{ booking.studentName }})
          <span v-if="booking.meetingId">
            | 会议号: {{ booking.meetingId }}
            <span v-if="booking.meetingPassword">(密码: {{ booking.meetingPassword }})</span>
          </span>
        </div>
      </el-alert>

      <div v-if="!bookings.length && !loading" class="empty-bookings">
        <el-empty description="暂无预约记录" />
        <el-button type="primary" @click="goToScheduleManage">
          去创建预约
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyBookings, updateBooking } from '@/api/schedule'
import dayjs from 'dayjs'

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
    ElMessage.error('获取预约列表失败')
  } finally {
    loading.value = false
  }
}

async function cancelBooking(booking) {
  try {
    await ElMessageBox.confirm(
      `确定要取消 ${booking.studentName} 的预约吗？`,
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await updateBooking(booking._id, { status: 'cancelled' })
    ElMessage.success('预约已取消')
    loadBookings()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
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
    'confirmed': '已确认',
    'pending': '待确认',
    'cancelled': '已取消',
    'completed': '已完成'
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
