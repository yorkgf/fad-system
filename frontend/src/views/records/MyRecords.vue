<template>
  <div class="my-records">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ userStore.isAdmin ? '所有记录' : '我的记录' }}</span>
          <div class="filters">
            <el-select
              v-model="filters.collection"
              placeholder="记录类型"
              style="width: 180px"
              @change="fetchData"
            >
              <el-option label="FAD记录" value="FAD_Records" />
              <el-option label="Reward记录" value="Reward_Records" />
              <el-option label="迟到记录" value="Late_Records" />
              <el-option label="寝室迟出" value="Leave_Room_Late_Records" />
              <el-option label="未按规定返校" value="Back_School_Late_Records" />
              <el-option label="寝室批评" value="Room_Warning_Records" />
              <el-option label="寝室垃圾未倒" value="Room_Trash_Records" />
              <el-option label="Teaching FAD Ticket" value="Teaching_FAD_Ticket" />
              <el-option label="Teaching Reward Ticket" value="Teaching_Reward_Ticket" />
            </el-select>
            <el-select
              v-model="filters.semester"
              placeholder="选择学期"
              style="width: 150px"
              @change="fetchData"
            >
              <el-option
                v-for="item in commonStore.semesters"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
            <el-select
              v-if="userStore.isAdmin"
              v-model="filters.teacher"
              placeholder="筛选老师"
              style="width: 120px"
              clearable
              filterable
              @change="fetchData"
            >
              <el-option
                v-for="item in teachers"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
            <el-checkbox
              v-model="filters.hideWithdrawn"
              @change="fetchData"
            >
              隐藏已撤回
            </el-checkbox>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="学生" label="学生" width="100" />
        <el-table-column prop="班级" label="班级" width="120" />
        <el-table-column prop="记录类型" label="记录类型" width="150" />
        <el-table-column prop="记录日期" label="记录日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.记录日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="记录事由" label="记录事由" min-width="180" show-overflow-tooltip />
        <el-table-column prop="记录老师" label="记录老师" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.是否已撤回" type="info">已撤回</el-tag>
            <el-tag v-else-if="row.是否已发放" type="success">已发放</el-tag>
            <el-tag v-else-if="row.是否已执行或冲抵" type="warning">已执行</el-tag>
            <el-tag v-else-if="row.是否已累计FAD" type="danger">已累计</el-tag>
            <el-tag v-else type="primary">有效</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.是否已撤回"
              type="danger"
              size="small"
              plain
              @click="handleWithdraw(row)"
            >
              撤回
            </el-button>
            <span v-else class="withdrawn-info">
              {{ formatDate(row.撤回日期) }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="fetchData"
        />
      </div>
    </el-card>

    <!-- 撤回确认对话框 -->
    <el-dialog
      v-model="withdrawDialog.visible"
      title="撤回记录"
      width="500px"
    >
      <div v-loading="withdrawDialog.checking">
        <template v-if="withdrawDialog.withdrawable">
          <el-alert
            title="确定要撤回这条记录吗？"
            type="warning"
            :closable="false"
            show-icon
          />

          <div v-if="withdrawDialog.chainRecords.length > 0" class="chain-records">
            <p class="chain-title">以下关联记录也将被撤回：</p>
            <el-table :data="withdrawDialog.chainRecords" size="small">
              <el-table-column prop="collection" label="记录表" width="180">
                <template #default="{ row }">
                  {{ getCollectionLabel(row.collection) }}
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" />
              <el-table-column prop="student" label="学生" />
            </el-table>
          </div>

          <el-form label-width="80px" style="margin-top: 20px">
            <el-form-item label="撤回原因">
              <el-input
                v-model="withdrawDialog.reason"
                type="textarea"
                :rows="2"
                placeholder="可选：输入撤回原因"
              />
            </el-form-item>
          </el-form>
        </template>

        <template v-else>
          <el-alert
            :title="withdrawDialog.error"
            type="error"
            :closable="false"
            show-icon
          />
        </template>
      </div>

      <template #footer>
        <el-button @click="withdrawDialog.visible = false">取消</el-button>
        <el-button
          v-if="withdrawDialog.withdrawable"
          type="danger"
          :loading="withdrawDialog.submitting"
          @click="confirmWithdraw"
        >
          确认撤回
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useCommonStore } from '@/stores/common'
import { getMyRecords, checkWithdrawable, withdrawRecord } from '@/api/records'
import dayjs from 'dayjs'

const userStore = useUserStore()
const commonStore = useCommonStore()

const loading = ref(false)
const records = ref([])
const teachers = ref([])

const filters = reactive({
  collection: 'FAD_Records',
  semester: '',
  teacher: '',
  hideWithdrawn: true
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const withdrawDialog = reactive({
  visible: false,
  checking: false,
  submitting: false,
  withdrawable: false,
  error: '',
  record: null,
  chainRecords: [],
  reason: ''
})

onMounted(() => {
  commonStore.generateSemesters()
  filters.semester = commonStore.getCurrentSemester()
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const params = {
      collection: filters.collection,
      semester: filters.semester,
      withdrawn: filters.hideWithdrawn ? false : undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }

    if (userStore.isAdmin && filters.teacher) {
      params.teacher = filters.teacher
    }

    const res = await getMyRecords(params)
    records.value = res.data || res
    pagination.total = res.total || records.value.length

    // 提取教师列表（管理员用）
    if (userStore.isAdmin) {
      const teacherSet = new Set(records.value.map(r => r.记录老师.replace('系统: ', '')))
      teachers.value = Array.from(teacherSet)
    }
  } catch (error) {
    records.value = []
  } finally {
    loading.value = false
  }
}

async function handleWithdraw(row) {
  withdrawDialog.record = row
  withdrawDialog.visible = true
  withdrawDialog.checking = true
  withdrawDialog.withdrawable = false
  withdrawDialog.error = ''
  withdrawDialog.chainRecords = []
  withdrawDialog.reason = ''

  try {
    const res = await checkWithdrawable(filters.collection, row._id)
    withdrawDialog.withdrawable = res.withdrawable
    if (res.withdrawable) {
      withdrawDialog.chainRecords = res.chainRecords || []
    } else {
      withdrawDialog.error = res.reason || '该记录无法撤回'
    }
  } catch (error) {
    withdrawDialog.error = '检查撤回条件失败'
  } finally {
    withdrawDialog.checking = false
  }
}

async function confirmWithdraw() {
  withdrawDialog.submitting = true
  try {
    await withdrawRecord(
      filters.collection,
      withdrawDialog.record._id,
      withdrawDialog.reason
    )
    ElMessage.success('撤回成功')
    withdrawDialog.visible = false
    fetchData()
  } catch (error) {
    ElMessage.error('撤回失败')
  } finally {
    withdrawDialog.submitting = false
  }
}

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

function getCollectionLabel(collection) {
  const map = {
    FAD_Records: 'FAD记录',
    Reward_Records: 'Reward记录',
    Late_Records: '迟到记录',
    Leave_Room_Late_Records: '寝室迟出',
    Back_School_Late_Records: '未按规定返校',
    Room_Warning_Records: '寝室批评',
    Room_Trash_Records: '寝室垃圾未倒',
    Teaching_FAD_Ticket: 'Teaching FAD Ticket',
    Teaching_Reward_Ticket: 'Teaching Reward Ticket'
  }
  return map[collection] || collection
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.withdrawn-info {
  color: #909399;
  font-size: 12px;
}

.chain-records {
  margin-top: 20px;
}

.chain-title {
  color: #e6a23c;
  margin-bottom: 10px;
  font-weight: bold;
}
</style>
