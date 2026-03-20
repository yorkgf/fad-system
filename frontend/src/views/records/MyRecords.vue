<template>
  <div class="my-records">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ userStore.isAdmin ? $t('myRecords.allRecords') : $t('myRecords.myRecords') }}</span>
          <div class="filters">
            <el-select
              v-model="filters.collection"
              :placeholder="$t('myRecords.recordType')"
              style="width: 200px"
              @change="fetchData"
            >
              <el-option
                v-for="item in availableFilterOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select
              v-if="filters.collection === 'FAD_Records'"
              v-model="filters.fadSourceType"
              :placeholder="$t('myRecords.fadSource')"
              style="width: 140px"
              clearable
              @change="updatePagination"
            >
              <el-option :label="$t('myRecords.fadSourceTeach')" value="teach" />
              <el-option :label="$t('myRecords.fadSourceDorm')" value="dorm" />
              <el-option :label="$t('myRecords.fadSourceElec')" value="elec" />
              <el-option :label="$t('myRecords.fadSourceOther')" value="other" />
              <el-option :label="$t('myRecords.fadSourceEmpty')" value="_empty" />
            </el-select>
            <el-select
              v-if="statusFilterOptions.length > 0"
              v-model="filters.status"
              :placeholder="$t('myRecords.filterStatus')"
              style="width: 140px"
              clearable
              @change="updatePagination"
            >
              <el-option
                v-for="item in statusFilterOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select
              v-model="filters.semester"
              :placeholder="$t('myRecords.selectSemester')"
              style="width: 150px"
              @change="fetchData"
            >
              <el-option
                v-for="item in localizedSemesters"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select
              v-if="userStore.isAdmin"
              v-model="filters.teacher"
              :placeholder="$t('myRecords.filterTeacher')"
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
              :placeholder="$t('myRecords.enterStudentName')"
              style="width: 120px"
              clearable
              @input="updatePagination"
            />
            <el-select
              v-model="filters.studentClass"
              :placeholder="$t('myRecords.selectClass')"
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
              :range-separator="$t('myRecords.dateTo')"
              :start-placeholder="$t('common.startDate')"
              :end-placeholder="$t('common.endDate')"
              value-format="YYYY-MM-DD"
              style="width: 240px"
              @change="updatePagination"
            />
            <el-button type="success" @click="exportData">{{ $t('myRecords.exportCsv') }}</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="paginatedRecords" stripe>
        <el-table-column prop="学生" :label="$t('myRecords.student')" width="100" />
        <el-table-column prop="班级" :label="$t('myRecords.class')" width="120" />
        <el-table-column prop="记录类型" :label="$t('myRecords.recordType')" width="150" />
        <el-table-column v-if="filters.collection === 'FAD_Records'" :label="$t('myRecords.fadSource')" width="100">
          <template #default="{ row }">
            {{ getFadSourceLabel(row.FAD来源类型) }}
          </template>
        </el-table-column>
        <el-table-column prop="记录日期" :label="$t('myRecords.recordDate')" width="120">
          <template #default="{ row }">
            {{ formatDate(row.记录日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="记录事由" :label="$t('myRecords.recordReason')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="记录老师" :label="$t('myRecords.recordTeacher')" width="120" />
        <el-table-column :label="$t('myRecords.status')" width="140">
          <template #default="{ row }">
            <template v-if="row.记录类型 === '寝室批评'">
              <el-tag v-if="row.fadStatus === '已累计FAD，已发放'" type="danger" size="small">{{ $t('myRecords.accumulatedFadDelivered') }}</el-tag>
              <el-tag v-else-if="row.fadStatus === '已累计FAD，未发放'" type="warning" size="small">{{ $t('myRecords.accumulatedFadNotDelivered') }}</el-tag>
              <el-tag v-else-if="row.fadStatus === '未累计FAD'" type="primary" size="small">{{ $t('myRecords.notAccumulatedFad') }}</el-tag>
              <el-tag v-else-if="row.是否已累计FAD" type="danger" size="small">{{ $t('myRecords.accumulatedFad') }}</el-tag>
              <el-tag v-else type="primary" size="small">{{ $t('myRecords.notAccumulatedFad') }}</el-tag>
            </template>
            <template v-else-if="row.记录类型 === '寝室表扬'">
              <el-tag v-if="row.是否已累计Reward" type="danger" size="small">{{ $t('myRecords.accumulatedReward') }}</el-tag>
              <el-tag v-else type="primary" size="small">{{ $t('myRecords.notAccumulatedReward') }}</el-tag>
            </template>
            <template v-else-if="row.记录类型 === 'Teaching Reward Ticket'">
              <el-tag v-if="row.是否已累计Reward" type="success" size="small">{{ $t('myRecords.exchangedReward') }}</el-tag>
              <el-tag v-else type="primary" size="small">{{ $t('myRecords.notExchangedReward') }}</el-tag>
            </template>
            <template v-else-if="row.记录类型 === '寝室垃圾未倒'">
              <el-tag v-if="row.是否已累计寝室批评" type="danger" size="small">{{ $t('myRecords.accumulatedCriticism') }}</el-tag>
              <el-tag v-else type="primary" size="small">{{ $t('myRecords.notAccumulatedCriticism') }}</el-tag>
            </template>
            <template v-else-if="row.记录类型 === 'FAD'">
              <el-tag v-if="row.是否已冲销记录" type="success" size="small">{{ $t('myRecords.offsetDone') }}</el-tag>
              <el-tag v-else-if="row.是否已执行或冲抵" type="warning" size="small">{{ $t('myRecords.executedNotOffset') }}</el-tag>
              <el-tag v-else type="danger" size="small">{{ $t('myRecords.notExecuted') }}</el-tag>
            </template>
            <template v-else-if="hasFADStatus(row)">
              <el-tag v-if="row.fadStatus === '已累计FAD，已发放'" type="danger" size="small">{{ $t('myRecords.accumulatedFadDelivered') }}</el-tag>
              <el-tag v-else-if="row.fadStatus === '已累计FAD，未发放'" type="warning" size="small">{{ $t('myRecords.accumulatedFadNotDelivered') }}</el-tag>
              <el-tag v-else type="primary" size="small">{{ $t('myRecords.notAccumulatedFad') }}</el-tag>
            </template>
            <template v-else>
              <el-tag type="primary" size="small">{{ $t('myRecords.valid') }}</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column :label="$t('myRecords.operation')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="filters.collection === 'FAD_Records' && userStore.userGroup === 'S'"
              type="primary"
              size="small"
              plain
              @click="handleEditSourceType(row)"
            >
              {{ $t('myRecords.editSource') }}
            </el-button>
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
                {{ $t('myRecords.withdraw') }}
              </el-button>
            </el-tooltip>
            <el-button
              v-else
              type="danger"
              size="small"
              plain
              @click="handleWithdraw(row)"
            >
              {{ $t('myRecords.withdraw') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-button type="success" @click="exportData">{{ $t('myRecords.exportCsv') }}</el-button>
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
      :title="$t('myRecords.withdrawRecord')"
      width="500px"
    >
      <div v-loading="withdrawDialog.checking">
        <template v-if="withdrawDialog.withdrawable">
          <el-alert
            :title="$t('myRecords.confirmWithdraw')"
            type="warning"
            :closable="false"
            show-icon
          />

          <div v-if="withdrawDialog.chainRecords.length > 0" class="chain-records">
            <p class="chain-title">{{ $t('myRecords.chainRecordsTitle') }}</p>
            <el-table :data="withdrawDialog.chainRecords" size="small">
              <el-table-column prop="collection" :label="$t('myRecords.recordTable')" width="180">
                <template #default="{ row }">
                  {{ getCollectionLabel(row.collection) }}
                </template>
              </el-table-column>
              <el-table-column prop="type" :label="$t('myRecords.type')" />
              <el-table-column prop="student" :label="$t('myRecords.student')" />
            </el-table>
          </div>

          <el-form label-width="80px" style="margin-top: 20px">
            <el-form-item :label="$t('myRecords.withdrawReason')">
              <el-input
                v-model="withdrawDialog.reason"
                type="textarea"
                :rows="2"
                :placeholder="$t('myRecords.withdrawReasonPlaceholder')"
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
        <el-button @click="withdrawDialog.visible = false">{{ $t('common.cancel') }}</el-button>
        <el-button
          v-if="withdrawDialog.withdrawable"
          type="danger"
          :loading="withdrawDialog.submitting"
          @click="confirmWithdraw"
        >
          {{ $t('myRecords.confirmWithdrawBtn') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 修改FAD来源类型对话框（仅S组可用） -->
    <el-dialog v-model="editSourceTypeDialog.visible" :title="$t('myRecords.editFadSourceType')" width="400px">
      <el-form label-width="100px">
        <el-form-item :label="$t('myRecords.student')">{{ editSourceTypeDialog.record?.学生 }}</el-form-item>
        <el-form-item :label="$t('myRecords.class')">{{ editSourceTypeDialog.record?.班级 }}</el-form-item>
        <el-form-item :label="$t('myRecords.sourceType')">
          <el-select v-model="editSourceTypeDialog.sourceType" style="width: 100%">
            <el-option
              v-for="item in localizedFadSourceTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editSourceTypeDialog.visible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="editSourceTypeDialog.loading" @click="submitEditSourceType">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>


<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useCommonStore } from '@/stores/common'
import { getMyRecords, checkWithdrawable, withdrawRecord } from '@/api/records'
import { updateFADSourceType } from '@/api/fad'
import dayjs from 'dayjs'

const { t } = useI18n()
const userStore = useUserStore()
const commonStore = useCommonStore()

// 记录类型到集合名的映射（与后端 constants.js 保持一致）
const recordTypeToCollection = {
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

// 集合名到 i18n key 的映射（用于筛选器显示）
const collectionToLabelKey = {
  'FAD_Records': 'myRecords.collectionFadRecords',
  'Reward_Records': 'myRecords.collectionRewardRecords',
  'Late_Records': 'myRecords.collectionLateRecords',
  'Leave_Room_Late_Records': 'myRecords.collectionLeaveRoomLate',
  'Back_School_Late_Records': 'myRecords.collectionBackSchoolLate',
  'MeetingRoom_Violation_Records': 'myRecords.collectionMeetingRoom',
  'Room_Praise_Records': 'myRecords.collectionRoomPraise',
  'Room_Warning_Records': 'myRecords.collectionRoomWarning',
  'Room_Trash_Records': 'myRecords.collectionRoomTrash',
  'Elec_Products_Violation_Records': 'myRecords.collectionElecProducts',
  'Phone_Late_Records': 'myRecords.collectionPhoneLate',
  'Teaching_FAD_Ticket': 'myRecords.collectionTeachingFadTicket',
  'Teaching_Reward_Ticket': 'myRecords.collectionTeachingRewardTicket'
}

// Localized semesters
const localizedSemesters = computed(() =>
  commonStore.semesters.map(s => ({ ...s, label: t(s.labelKey) }))
)

// Localized FAD source types
const localizedFadSourceTypes = computed(() =>
  commonStore.fadSourceTypes.map(s => ({ ...s, label: t(s.labelKey) }))
)

// 根据用户权限生成可用的筛选选项（与 InsertRecord.vue 中的 availableRecordTypes 逻辑一致）
const availableFilterOptions = computed(() => {  // C组用户只能看到寝室相关记录
  if (userStore.isCleaner) {
    return [
      { label: t('myRecords.collectionRoomPraise'), value: 'Room_Praise_Records' },
      { label: t('myRecords.collectionRoomWarning'), value: 'Room_Warning_Records' },
      { label: t('myRecords.collectionRoomTrash'), value: 'Room_Trash_Records' }
    ]
  }
  // F组用户只能看到Teaching Ticket记录
  if (userStore.isFaculty) {
    return [
      { label: t('myRecords.collectionTeachingRewardTicket'), value: 'Teaching_Reward_Ticket' },
      { label: t('myRecords.collectionTeachingFadTicket'), value: 'Teaching_FAD_Ticket' }
    ]
  }
  // 其他用户（包括B组）根据 userStore.recordTypes 生成选项
  if (userStore.recordTypes.length > 0) {
    return userStore.recordTypes.map(type => ({
      label: type.labelKey ? t(type.labelKey) : type.label,
      value: recordTypeToCollection[type.value] || type.value
    }))
  }
  // 默认显示所有记录类型（S组管理员）
  return Object.entries(collectionToLabelKey).map(([value, labelKey]) => ({
    label: t(labelKey),
    value
  }))
})

// 根据当前记录类型生成状态筛选选项
const statusFilterOptions = computed(() => {
  const collection = filters.collection
  if (collection === 'FAD_Records') {
    return [
      { label: t('myRecords.notExecuted'), value: 'notExecuted' },
      { label: t('myRecords.executedNotOffset'), value: 'executed' },
      { label: t('myRecords.offsetDone'), value: 'offset' }
    ]
  }
  if (collection === 'Room_Warning_Records') {
    return [
      { label: t('myRecords.notAccumulatedFad'), value: 'noFad' },
      { label: t('myRecords.accumulatedFadNotDelivered'), value: 'fadNotDelivered' },
      { label: t('myRecords.accumulatedFadDelivered'), value: 'fadDelivered' }
    ]
  }
  if (collection === 'Room_Praise_Records') {
    return [
      { label: t('myRecords.notAccumulatedReward'), value: 'notAccumulatedReward' },
      { label: t('myRecords.accumulatedReward'), value: 'accumulatedReward' }
    ]
  }
  if (collection === 'Teaching_Reward_Ticket') {
    return [
      { label: t('myRecords.notExchangedReward'), value: 'notExchangedReward' },
      { label: t('myRecords.exchangedReward'), value: 'exchangedReward' }
    ]
  }
  if (collection === 'Room_Trash_Records') {
    return [
      { label: t('myRecords.notAccumulatedCriticism'), value: 'notAccumulatedCriticism' },
      { label: t('myRecords.accumulatedCriticism'), value: 'accumulatedCriticism' }
    ]
  }
  if (['Late_Records', 'Teaching_FAD_Ticket', 'Leave_Room_Late_Records', 'Back_School_Late_Records', 'MeetingRoom_Violation_Records'].includes(collection)) {
    return [
      { label: t('myRecords.notAccumulatedFad'), value: 'noFad' },
      { label: t('myRecords.accumulatedFadNotDelivered'), value: 'fadNotDelivered' },
      { label: t('myRecords.accumulatedFadDelivered'), value: 'fadDelivered' }
    ]
  }
  return []
})

const loading = ref(false)
const allRecords = ref([]) // 存储所有记录
const teachers = ref([])

const filters = reactive({
  collection: 'FAD_Records', // 默认显示 FAD 记录
  fadSourceType: null, // FAD来源类型筛选
  status: '', // 状态筛选
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

  // 状态筛选
  if (filters.status) {
    result = result.filter(r => getRecordStatusKey(r) === filters.status)
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

// 修改FAD来源类型对话框（仅S组可用）
const editSourceTypeDialog = reactive({
  visible: false,
  record: null,
  sourceType: '',
  loading: false
})

onMounted(async () => {
  commonStore.generateSemesters()
  filters.semester = commonStore.getCurrentSemester()
  // 等待 recordTypes 加载完成（如果需要）
  if (userStore.recordTypes.length === 0 && !userStore.isCleaner && !userStore.isFaculty) {
    await userStore.fetchRecordTypes()
  }
  // 根据用户权限设置默认记录类型
  if (userStore.isCleaner) {
    filters.collection = 'Room_Praise_Records'
  } else if (userStore.isFaculty) {
    filters.collection = 'Teaching_Reward_Ticket'
  } else if (availableFilterOptions.value.length > 0) {
    // 使用第一个可用的记录类型作为默认值
    filters.collection = availableFilterOptions.value[0].value
  }
  await commonStore.fetchClasses()
  fetchData()
})

async function fetchData() {
  loading.value = true

  // 切换记录类型时清空FAD来源筛选和状态筛选
  if (filters.collection !== 'FAD_Records') {
    filters.fadSourceType = null
  }
  filters.status = ''

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
      withdrawDialog.error = res.reason || t('myRecords.cannotWithdraw')
    }
  } catch (error) {
    withdrawDialog.error = t('myRecords.checkWithdrawFailed')
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
    ElMessage.success(t('myRecords.withdrawSuccess'))
    withdrawDialog.visible = false
    fetchData()
  } catch (error) {
    ElMessage.error(t('myRecords.withdrawFailed'))
  } finally {
    withdrawDialog.submitting = false
  }
}

// 修改FAD来源类型（仅S组可用）
function handleEditSourceType(row) {
  editSourceTypeDialog.record = row
  editSourceTypeDialog.sourceType = row.FAD来源类型 || 'other'
  editSourceTypeDialog.visible = true
}

async function submitEditSourceType() {
  editSourceTypeDialog.loading = true
  try {
    await updateFADSourceType(editSourceTypeDialog.record._id, editSourceTypeDialog.sourceType)
    ElMessage.success(t('myRecords.fadSourceUpdateSuccess'))
    editSourceTypeDialog.visible = false
    fetchData()
  } catch (error) {
    ElMessage.error(t('myRecords.fadSourceUpdateFailed'))
  } finally {
    editSourceTypeDialog.loading = false
  }
}

function exportData() {
  if (filteredRecords.value.length === 0) {
    ElMessage.warning(t('myRecords.noDataToExport'))
    return
  }

  const headers = [t('myRecords.student'), t('myRecords.class'), t('myRecords.recordType'), t('myRecords.recordDate'), t('myRecords.recordReason'), t('myRecords.recordTeacher'), t('myRecords.status')]
  const getField = (row) => {
    let status = ''

    // Teaching Reward Ticket 特殊处理
    if (row.记录类型 === 'Teaching Reward Ticket') {
      status = row.是否已累计Reward ? t('myRecords.exchangedReward') : t('myRecords.notExchangedReward')
    }
    // 使用后端返回的 fadStatus（如果存在）
    else if (row.fadStatus === '已累计FAD，已发放') {
      status = t('myRecords.accumulatedFadDelivered')
    } else if (row.fadStatus === '已累计FAD，未发放') {
      status = t('myRecords.accumulatedFadNotDelivered')
    } else if (row.fadStatus === '未累计FAD') {
      status = t('myRecords.notAccumulatedFad')
    } else if (row.是否已发放) {
      status = t('myRecords.accumulatedFadDelivered')
    } else if (row.是否已冲销记录) {
      status = t('myRecords.offsetDone')
    } else if (row.是否已执行或冲抵) {
      status = t('myRecords.executedNotOffset')
    } else if (row.是否已累计FAD) {
      status = t('myRecords.accumulatedFad')
      status = t('myRecords.accumulatedCriticism')
    } else if (row.是否已累计Reward) {
      status = t('myRecords.accumulatedReward')
    } else {
      status = t('myRecords.valid')
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

  ElMessage.success(t('myRecords.exportSuccess'))
}

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

// 获取FAD来源类型的显示标签
function getFadSourceLabel(sourceType) {
  const map = {
    'teach': t('myRecords.fadSourceTeach'),
    'dorm': t('myRecords.fadSourceDorm'),
    'elec': t('myRecords.fadSourceElec'),
    'other': t('myRecords.fadSourceOther')
  }
  return map[sourceType] || t('myRecords.fadSourceEmpty')
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
  return t(collectionToLabelKey[collection] || 'myRecords.collectionFadRecords')
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
  // Teaching Reward Ticket 已兑换Reward的不可撤回
  if (row.记录类型 === 'Teaching Reward Ticket' && row.是否已累计Reward) {
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
    // 调试日志
    console.log('[撤回调试] 记录老师:', teacherName, '| 当前用户:', userStore.username)
    console.log('[撤回调试] 是否匹配:', teacherName === userStore.username)
    if (teacherName !== userStore.username) {
      return false
    }
  }
  return true
}

// 获取不可撤回的原因
function getWithdrawDisabledReason(row) {
  if (row.记录类型 === 'Reward') {
    return t('myRecords.rewardCannotWithdraw')
  }
  if (row.记录类型 === '寝室表扬' && row.是否已累计Reward) {
    return t('myRecords.roomPraiseRewardCannotWithdraw')
  }
  if (row.记录类型 === 'Teaching Reward Ticket' && row.是否已累计Reward) {
    return t('myRecords.teachingRewardCannotWithdraw')
  }
  if (hasFADStatus(row) && row.fadStatus === '已累计FAD，已发放') {
    return t('myRecords.fadDeliveredCannotWithdraw')
  }
  if (row.记录类型 === 'FAD') {
    if (row.是否已冲销记录) {
      return t('myRecords.fadOffsetCannotWithdraw')
    }
    if (row.是否已执行或冲抵) {
      return t('myRecords.fadExecutedCannotWithdraw')
    }
  }
  if (row.是否已发放) {
    return t('myRecords.deliveredCannotWithdraw')
  }
  if (row.记录类型 === 'FAD' && row.记录老师 && row.记录老师.startsWith('已发:')) {
    return t('myRecords.deliveredCannotWithdraw')
  }
  if (!userStore.isAdmin) {
    const teacherName = row.记录老师?.replace('系统: ', '').split(':')[0] || ''
    if (teacherName !== userStore.username) {
      return t('myRecords.onlyOwnRecordsWithdraw')
    }
  }
  return t('myRecords.cannotWithdrawGeneric')
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

// 获取记录的状态 key（用于状态筛选）
function getRecordStatusKey(row) {
  if (row.记录类型 === 'FAD') {
    if (row.是否已冲销记录) return 'offset'
    if (row.是否已执行或冲抵) return 'executed'
    return 'notExecuted'
  }
  if (row.记录类型 === '寝室批评') {
    if (row.fadStatus === '已累计FAD，已发放') return 'fadDelivered'
    if (row.fadStatus === '已累计FAD，未发放') return 'fadNotDelivered'
    if (row.fadStatus === '未累计FAD') return 'noFad'
    if (row.是否已累计FAD) return 'fadDelivered'
    return 'noFad'
  }
  if (row.记录类型 === '寝室表扬') {
    return row.是否已累计Reward ? 'accumulatedReward' : 'notAccumulatedReward'
  }
  if (row.记录类型 === 'Teaching Reward Ticket') {
    return row.是否已累计Reward ? 'exchangedReward' : 'notExchangedReward'
  }
  if (row.记录类型 === '寝室垃圾未倒') {
    return row.是否已累计寝室批评 ? 'accumulatedCriticism' : 'notAccumulatedCriticism'
  }
  if (hasFADStatus(row)) {
    if (row.fadStatus === '已累计FAD，已发放') return 'fadDelivered'
    if (row.fadStatus === '已累计FAD，未发放') return 'fadNotDelivered'
    return 'noFad'
  }
  return 'valid'
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

/* 响应式优化 */
@media (max-width: 992px) {
  .filters {
    width: 100%;
  }

  .filters .el-select,
  .filters .el-input {
    width: calc(50% - 6px) !important;
    min-width: 120px;
  }

  .filters .el-date-editor {
    width: 100% !important;
  }
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters {
    flex-direction: column;
    width: 100%;
  }

  .filters .el-select,
  .filters .el-input,
  .filters .el-date-editor {
    width: 100% !important;
  }

  .filters .el-button {
    width: 100%;
  }

  .table-footer {
    flex-direction: column;
    gap: 12px;
  }

  .table-footer .el-button {
    width: 100%;
  }

  /* 撤回对话框响应式 */
  :deep(.el-dialog) {
    width: 90% !important;
    max-width: 90% !important;
  }

  .chain-records :deep(.el-table) {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .chain-title {
    font-size: 13px;
  }
}
</style>