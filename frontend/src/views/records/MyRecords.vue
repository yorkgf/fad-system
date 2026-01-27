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
              style="width: 200px"
              @change="fetchData"
            >
              <el-option label="FAD记录" value="FAD_Records" />
              <el-option label="Reward记录" value="Reward_Records" />
              <el-option label="早点名迟到" value="Late_Records" />
              <el-option label="寝室迟出" value="Leave_Room_Late_Records" />
              <el-option label="未按规定返校" value="Back_School_Late_Records" />
              <el-option label="擅自进入会议室" value="MeetingRoom_Violation_Records" />
              <el-option label="寝室表扬" value="Room_Praise_Records" />
              <el-option label="寝室批评" value="Room_Warning_Records" />
              <el-option label="寝室垃圾未倒" value="Room_Trash_Records" />
              <el-option label="电子产品违规" value="Elec_Products_Violation_Records" />
              <el-option label="晚交手机" value="Phone_Late_Records" />
              <el-option label="Teaching FAD Ticket" value="Teaching_FAD_Ticket" />
              <el-option label="Teaching Reward Ticket" value="Teaching_Reward_Ticket" />
            </el-select>
            <el-select
              v-if="filters.collection === 'FAD_Records'"
              v-model="filters.fadSourceType"
              placeholder="FAD来源"
              style="width: 120px"
              clearable
              @change="updatePagination"
            >
              <el-option label="教学类" value="teach" />
              <el-option label="寝室类" value="dorm" />
              <el-option label="其他类" value="other" />
              <el-option label="未分类" value="_empty" />
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
            <el-input
              v-model="filters.student"
              placeholder="输入学生姓名"
              style="width: 120px"
              clearable
              @input="updatePagination"
            />
            <el-select
              v-model="filters.studentClass"
              placeholder="选择班级"
              style="width: 150px"
              filterable
              clearable
              @change="updatePagination"
            >
              <el-option
                v-for="item in commonStore.classes"
                :key="item.Class"
                :label="item.Class"
                :value="item.Class"
              />
            </el-select>
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 240px"
              @change="updatePagination"
            />
            <el-button type="success" @click="exportData">导出</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="paginatedRecords" stripe>
        <el-table-column prop="学生" label="学生" width="100" />
        <el-table-column prop="班级" label="班级" width="120" />
        <el-table-column prop="记录类型" label="记录类型" width="150" />
        <el-table-column v-if="filters.collection === 'FAD_Records'" label="FAD来源" width="100">
          <template #default="{ row }">
            {{ getFadSourceLabel(row.FAD来源类型) }}
          </template>
        </el-table-column>
        <el-table-column prop="记录日期" label="记录日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.记录日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="记录事由" label="记录事由" min-width="180" show-overflow-tooltip />
        <el-table-column prop="记录老师" label="记录老师" width="120" />
        <el-table-column label="状态" width="140">
          <template #default="{ row }">
            <template v-if="row.记录类型 === '寝室批评'">
              <el-tag v-if="row.fadStatus === '已累计FAD，已发放'" type="danger" size="small">已累计FAD</el-tag>
              <el-tag v-else-if="row.fadStatus === '已累计FAD，未发放'" type="warning" size="small">已累计FAD</el-tag>
              <el-tag v-else-if="row.fadStatus === '未累计FAD'" type="primary" size="small">未累计FAD</el-tag>
              <el-tag v-else-if="row.是否已累计FAD" type="danger" size="small">已累计FAD</el-tag>
              <el-tag v-else type="primary" size="small">未累计FAD</el-tag>
            </template>
            <template v-else-if="row.记录类型 === '寝室表扬'">
              <el-tag v-if="row.是否已累计Reward" type="danger" size="small">已累计Reward</el-tag>
              <el-tag v-else type="primary" size="small">未累计Reward</el-tag>
            </template>
            <template v-else-if="row.记录类型 === '寝室垃圾未倒'">
              <el-tag v-if="row.是否已累计寝室批评" type="danger" size="small">已累计批评</el-tag>
              <el-tag v-else type="primary" size="small">未累计批评</el-tag>
            </template>
            <template v-else-if="row.记录类型 === 'FAD'">
              <el-tag v-if="row.是否已冲销记录" type="success" size="small">已冲销</el-tag>
              <el-tag v-else-if="row.是否已执行或冲抵" type="warning" size="small">已执行未冲销</el-tag>
              <el-tag v-else type="danger" size="small">未执行</el-tag>
            </template>
            <template v-else-if="hasFADStatus(row)">
              <!-- 早点名迟到、Teaching FAD Ticket、寝室迟出、未按规定返校、擅自进入会议室 -->
              <el-tag v-if="row.fadStatus === '已累计FAD，已发放'" type="danger" size="small">已累计FAD，已发放</el-tag>
              <el-tag v-else-if="row.fadStatus === '已累计FAD，未发放'" type="warning" size="small">已累计FAD，未发放</el-tag>
              <el-tag v-else type="primary" size="small">未累计FAD</el-tag>
            </template>
            <template v-else>
              <!-- 其他记录类型（如电子产品违规、晚交手机等） -->
              <el-tag type="primary" size="small">有效</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-tooltip
              v-if="!isWithdrawable(row)"
              :content="getWithdrawDisabledReason(row)"
              placement="top"
            >
              <el-button
                type="info"
                size="small"
                plain
                disabled
              >
                撤回
              </el-button>
            </el-tooltip>
            <el-button
              v-else
              type="danger"
              size="small"
              plain
              @click="handleWithdraw(row)"
            >
              撤回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-button type="success" @click="exportData">导出 CSV</el-button>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useCommonStore } from '@/stores/common'
import { getMyRecords, checkWithdrawable, withdrawRecord } from '@/api/records'
import dayjs from 'dayjs'

const userStore = useUserStore()
const commonStore = useCommonStore()

const loading = ref(false)
const allRecords = ref([]) // 存储所有记录
const teachers = ref([])

const filters = reactive({
  collection: 'FAD_Records', // 默认显示 FAD 记录
  fadSourceType: null, // FAD来源类型筛选
  semester: '',
  teacher: '',
  student: '',
  studentClass: '',
  dateRange: null
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 前端分页：根据筛选条件过滤后再分页
const filteredRecords = computed(() => {
  let result = allRecords.value

  // FAD来源类型筛选（仅FAD记录）
  if (filters.collection === 'FAD_Records' && filters.fadSourceType !== null) {
    if (filters.fadSourceType === '_empty') {
      // 未分类：FAD来源类型为空或不存在
      result = result.filter(r => !r.FAD来源类型)
    } else {
      result = result.filter(r => r.FAD来源类型 === filters.fadSourceType)
    }
  }

  // 学生姓名筛选
  if (filters.student) {
    result = result.filter(r => r.学生 && r.学生.includes(filters.student))
  }

  // 班级筛选
  if (filters.studentClass) {
    result = result.filter(r => r.班级 === filters.studentClass)
  }

  // 日期范围筛选
  if (filters.dateRange && filters.dateRange.length === 2) {
    const [start, end] = filters.dateRange
    const startDate = new Date(start)
    const endDate = new Date(end + 'T23:59:59')
    result = result.filter(r => {
      const recordDate = new Date(r.记录日期)
      return recordDate >= startDate && recordDate <= endDate
    })
  }

  return result
})

// 计算当前页显示的记录
const paginatedRecords = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredRecords.value.slice(start, end)
})

// 监听筛选条件变化，更新 total 并重置页码
const updatePagination = () => {
  pagination.total = filteredRecords.value.length
  pagination.page = 1
}

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

onMounted(async () => {
  commonStore.generateSemesters()
  filters.semester = commonStore.getCurrentSemester()
  await commonStore.fetchClasses()
  fetchData()
})

async function fetchData() {
  loading.value = true

  // 切换记录类型时清空FAD来源筛选
  if (filters.collection !== 'FAD_Records') {
    filters.fadSourceType = null
  }

  try {
    const params = {
      collection: filters.collection,
      semester: filters.semester
    }

    if (userStore.isAdmin && filters.teacher) {
      params.teacher = filters.teacher
    }

    console.log('Fetching records with params:', params)
    const res = await getMyRecords(params)
    console.log('API response:', res)
    console.log('res.data length:', res.data?.length)

    allRecords.value = res.data || res
    console.log('allRecords.value length:', allRecords.value.length)

    // 更新分页信息
    updatePagination()
    console.log('pagination:', pagination)

    // 提取教师列表（管理员用）
    if (userStore.isAdmin) {
      const teacherSet = new Set(allRecords.value.map(r => (r.记录老师 || '').replace('系统: ', '')))
      teachers.value = Array.from(teacherSet).filter(t => t) // 过滤空值
    }
  } catch (error) {
    console.error('获取记录失败:', error)
    allRecords.value = []
    pagination.total = 0
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
    // 根据记录类型确定 collection
    const collection = row.collection || getCollectionFromRecordType(row.记录类型)
    const res = await checkWithdrawable(collection, row._id)
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
    // 根据记录类型确定 collection
    const collection = withdrawDialog.record.collection || getCollectionFromRecordType(withdrawDialog.record.记录类型)
    await withdrawRecord(
      collection,
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

function exportData() {
  if (filteredRecords.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }

  // 确定CSV表的表头和字段映射
  const headers = ['学生', '班级', '记录类型', '记录日期', '记录事由', '记录老师', '状态']
  const getField = (row) => {
    let status = ''

    // 使用后端返回的 fadStatus（如果存在）
    if (row.fadStatus) {
      status = row.fadStatus
    }
    // 否则根据字段计算状态
    else if (row.是否已发放) {
      status = '已发放'
    } else if (row.是否已冲销记录) {
      status = '已冲销'
    } else if (row.是否已执行或冲抵) {
      status = '已执行未冲销'
    } else if (row.是否已累计FAD) {
      // 如果已累计FAD但没有 fadStatus（兼容旧数据）
      status = '已累计FAD'
    } else if (row.是否已累计寝室批评) {
      status = '已累计寝室警告'
    } else if (row.是否已累计Reward) {
      status = '已累计Reward'
    } else {
      status = '有效'
    }

    return [row.学生, row.班级, row.记录类型, formatDate(row.记录日期), row.记录事由 || '', row.记录老师, status]
  }

  const csv = [headers.join(','), ...filteredRecords.value.map(row => getField(row).map(c => `"${c}"`).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `我的记录_${filters.collection}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('导出成功')
}

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

// 获取FAD来源类型的显示标签
function getFadSourceLabel(sourceType) {
  const map = {
    'teach': '教学类',
    'dorm': '寝室类',
    'other': '其他类'
  }
  return map[sourceType] || '未分类'
}

// 根据记录类型获取对应的 collection
function getCollectionFromRecordType(recordType) {
  const map = {
    'FAD': 'FAD_Records',
    'Reward': 'Reward_Records',
    '早点名迟到': 'Late_Records',
    '寝室迟出': 'Leave_Room_Late_Records',
    '未按规定返校': 'Back_School_Late_Records',
    '擅自进入会议室或接待室': 'MeetingRoom_Violation_Records',
    '寝室表扬': 'Room_Praise_Records',
    '寝室批评': 'Room_Warning_Records',
    '寝室垃圾未倒': 'Room_Trash_Records',
    '上网课违规使用电子产品': 'Elec_Products_Violation_Records',
    '21:30后交还手机(22:00前)': 'Phone_Late_Records',
    '22:00后交还手机': 'Phone_Late_Records',
    'Teaching FAD Ticket': 'Teaching_FAD_Ticket',
    'Teaching Reward Ticket': 'Teaching_Reward_Ticket'
  }
  return map[recordType] || 'FAD_Records'
}

function getCollectionLabel(collection) {
  const map = {
    FAD_Records: 'FAD记录',
    Reward_Records: 'Reward记录',
    Late_Records: '早点名迟到',
    Leave_Room_Late_Records: '寝室迟出',
    Back_School_Late_Records: '未按规定返校',
    MeetingRoom_Violation_Records: '擅自进入会议室',
    Room_Praise_Records: '寝室表扬',
    Room_Warning_Records: '寝室批评',
    Room_Trash_Records: '寝室垃圾未倒',
    Elec_Products_Violation_Records: '电子产品违规',
    Phone_Late_Records: '晚交手机',
    Teaching_FAD_Ticket: 'Teaching FAD Ticket',
    Teaching_Reward_Ticket: 'Teaching Reward Ticket'
  }
  return map[collection] || collection
}

// 判断记录是否可撤回（前端预判断）
function isWithdrawable(row) {
  // Reward 记录不可撤回
  if (row.记录类型 === 'Reward') {
    return false
  }
  // 寝室表扬已生成Reward的不可撤回
  if (row.记录类型 === '寝室表扬' && row.是否已累计Reward) {
    return false
  }
  // 累计产生FAD的记录，检查 fadStatus
  if (hasFADStatus(row) && row.fadStatus === '已累计FAD，已发放') {
    return false
  }
  // FAD记录已执行或已冲销的不可撤回
  if (row.记录类型 === 'FAD') {
    if (row.是否已执行或冲抵) {
      return false
    }
    if (row.是否已冲销记录) {
      return false
    }
  }
  // 已发放的FAD/Reward不可撤回
  if (row.是否已发放) {
    return false
  }
  // FAD记录老师以"已发:"开头的不可撤回
  if (row.记录类型 === 'FAD' && row.记录老师 && row.记录老师.startsWith('已发:')) {
    return false
  }
  // 非管理员只能撤回自己的记录
  if (!userStore.isAdmin) {
    const teacherName = row.记录老师?.replace('系统: ', '').split(':')[0] || ''
    if (!teacherName.includes(userStore.name)) {
      return false
    }
  }
  return true
}

// 获取不可撤回的原因
function getWithdrawDisabledReason(row) {
  if (row.记录类型 === 'Reward') {
    return 'Reward记录不可撤回'
  }
  if (row.记录类型 === '寝室表扬' && row.是否已累计Reward) {
    return '该寝室表扬已生成Reward，不可撤回'
  }
  if (hasFADStatus(row) && row.fadStatus === '已累计FAD，已发放') {
    return '该记录累计产生的FAD已发放纸质通知单，无法撤回'
  }
  // FAD记录已执行或已冲销的不可撤回
  if (row.记录类型 === 'FAD') {
    if (row.是否已冲销记录) {
      return 'FAD已冲销，无法撤回'
    }
    if (row.是否已执行或冲抵) {
      return 'FAD已执行，无法撤回'
    }
  }
  if (row.是否已发放) {
    return '已发放纸质通知单，无法撤回'
  }
  if (row.记录类型 === 'FAD' && row.记录老师 && row.记录老师.startsWith('已发:')) {
    return '已发放纸质通知单，无法撤回'
  }
  if (!userStore.isAdmin) {
    const teacherName = row.记录老师?.replace('系统: ', '').split(':')[0] || ''
    if (!teacherName.includes(userStore.name)) {
      return '只能撤回自己发出的记录'
    }
  }
  return '无法撤回'
}

// 判断记录类型是否有 FAD 状态显示
function hasFADStatus(row) {
  const fadRecordTypes = [
    '早点名迟到',
    'Teaching FAD Ticket',
    '寝室迟出',
    '未按规定返校',
    '擅自进入会议室或接待室'
  ]
  return fadRecordTypes.includes(row.记录类型)
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
align-items: center;
  margin-top: 16px;
  gap: 12px;
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