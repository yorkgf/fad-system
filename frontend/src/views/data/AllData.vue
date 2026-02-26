<template>
  <div class="all-data">
    <el-card>
      <template #header>
        <span>{{ $t('allData.title') }}</span>
      </template>

      <!-- 筛选条件 -->
      <el-form :inline="true" class="filter-form">
        <el-form-item :label="$t('allData.recordType')">
          <el-select
            v-model="filters.collection"
            :placeholder="$t('allData.selectRecordType')"
            style="width: 180px"
            @change="fetchData"
          >
            <el-option :label="$t('allData.fadRecords')" value="FAD_Records" />
            <el-option :label="$t('allData.rewardRecords')" value="Reward_Records" />
            <el-option :label="$t('allData.lateRecords')" value="Late_Records" />
            <el-option :label="$t('allData.leaveRoomLate')" value="Leave_Room_Late_Records" />
            <el-option :label="$t('allData.backSchoolLate')" value="Back_School_Late_Records" />
            <el-option :label="$t('allData.roomPraise')" value="Room_Praise_Records" />
            <el-option :label="$t('allData.roomWarning')" value="Room_Warning_Records" />
            <el-option :label="$t('allData.roomTrash')" value="Room_Trash_Records" />
            <el-option :label="$t('allData.elecViolation')" value="Elec_Products_Violation_Records" />
            <el-option :label="$t('allData.phoneLate')" value="Phone_Late_Records" />
            <el-option label="Teaching FAD Ticket" value="Teaching_FAD_Ticket" />
            <el-option label="Teaching Reward Ticket" value="Teaching_Reward_Ticket" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('allData.semester')">
          <el-select
            v-model="filters.semester"
            :placeholder="$t('allData.selectSemester')"
            style="width: 150px"
            clearable
            @change="fetchData"
          >
            <el-option
              v-for="item in commonStore.semesters"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('allData.class')">
          <el-select
            v-model="filters.studentClass"
            :placeholder="$t('allData.selectClass')"
            style="width: 150px"
            clearable
            filterable
            @change="fetchData"
          >
            <el-option
              v-for="item in commonStore.classes"
              :key="item.Class"
              :label="item.Class"
              :value="item.Class"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('allData.student')">
          <el-input
            v-model="filters.student"
            :placeholder="$t('allData.enterStudent')"
            style="width: 120px"
            clearable
            @keyup.enter="fetchData"
          />
        </el-form-item>

        <el-form-item :label="$t('allData.dateRange')">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            :range-separator="$t('allData.dateRangeSeparator')"
            :start-placeholder="$t('allData.startDate')"
            :end-placeholder="$t('allData.endDate')"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="fetchData"
          />
        </el-form-item>

        <el-form-item v-if="filters.collection === 'FAD_Records'" :label="$t('allData.sourceType')">
          <el-select
            v-model="filters.sourceType"
            :placeholder="$t('allData.sourceTypeAll')"
            style="width: 100px"
            clearable
            @change="fetchData"
          >
            <el-option
              v-for="item in commonStore.fadSourceTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="fetchData">{{ $t('allData.query') }}</el-button>
          <el-button @click="resetFilters">{{ $t('allData.reset') }}</el-button>
          <el-button type="success" @click="exportData">{{ $t('allData.export') }}</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="records" stripe border>
        <el-table-column prop="学生" :label="$t('allData.studentCol')" width="100" fixed />
        <el-table-column prop="班级" :label="$t('allData.classCol')" width="120" />
        <el-table-column prop="记录类型" :label="$t('allData.recordTypeCol')" width="150" v-if="showColumn('记录类型')" />
        <el-table-column prop="记录日期" :label="$t('allData.recordDateCol')" width="120">
          <template #default="{ row }">
            {{ formatDate(row.记录日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="记录事由" :label="$t('allData.recordReasonCol')" min-width="180" show-overflow-tooltip v-if="showColumn('记录事由')" />
        <el-table-column prop="记录老师" :label="$t('allData.recordTeacherCol')" width="120" />
        <el-table-column prop="FAD来源类型" :label="$t('allData.sourceTypeCol')" width="100" v-if="filters.collection === 'FAD_Records'">
          <template #default="{ row }">
            <el-tag v-if="row.FAD来源类型" :type="getSourceTypeTag(row.FAD来源类型)" size="small">
              {{ getSourceTypeLabel(row.FAD来源类型) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('allData.deliveryStatus')" width="100" v-if="filters.collection === 'FAD_Records' || filters.collection === 'Reward_Records'">
          <template #default="{ row }">
            <el-tag v-if="row.是否已发放" type="success" size="small">{{ $t('allData.delivered') }}</el-tag>
            <el-tag v-else type="info" size="small">{{ $t('allData.notDelivered') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('allData.fadStatus')" width="120" v-if="filters.collection === 'FAD_Records' || filters.collection === 'Room_Warning_Records' || filters.collection === 'Room_Trash_Records'">
          <template #default="{ row }">
            <template v-if="filters.collection === 'FAD_Records'">
              <el-tag v-if="row.是否已冲销记录" type="success" size="small">{{ $t('allData.fadOffset') }}</el-tag>
              <el-tag v-else-if="row.是否已执行或冲抵" type="warning" size="small">{{ $t('allData.fadExecutedNotOffset') }}</el-tag>
              <el-tag v-else type="danger" size="small">{{ $t('allData.fadNotExecuted') }}</el-tag>
            </template>
            <template v-else-if="filters.collection === 'Room_Warning_Records'">
              <el-tag v-if="row.是否已累计FAD" type="danger" size="small">{{ $t('allData.roomWarningAccFad') }}</el-tag>
              <el-tag v-else type="primary" size="small">{{ $t('allData.roomWarningNotAccFad') }}</el-tag>
            </template>
            <template v-else-if="filters.collection === 'Room_Trash_Records'">
              <el-tag v-if="row.是否已累计寝室批评" type="danger" size="small">{{ $t('allData.roomTrashAccCriticism') }}</el-tag>
              <el-tag v-else type="primary" size="small">{{ $t('allData.roomTrashNotAccCriticism') }}</el-tag>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-info">{{ $t('allData.totalRecords', { total: pagination.total }) }}</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100, 200]"
          layout="sizes, prev, pager, next, jumper"
          @change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useCommonStore } from '@/stores/common'
import { queryRecords } from '@/api/records'
import dayjs from 'dayjs'

const { t } = useI18n()
const commonStore = useCommonStore()

const loading = ref(false)
const records = ref([])

const filters = reactive({
  collection: 'FAD_Records',
  semester: '',
  studentClass: '',
  student: '',
  dateRange: null,
  sourceType: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

onMounted(async () => {
  commonStore.generateSemesters()
  filters.semester = commonStore.getCurrentSemester()
  await commonStore.fetchClasses()
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const params = {
      collection: filters.collection,
      semester: filters.semester || undefined,
      studentClass: filters.studentClass || undefined,
      student: filters.student || undefined,
      dateFrom: filters.dateRange?.[0] || undefined,
      dateTo: filters.dateRange?.[1] || undefined,
      sourceType: filters.sourceType || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }

    const res = await queryRecords(params)
    records.value = res.data || res
    pagination.total = res.total || records.value.length
  } catch (error) {
    records.value = []
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.semester = commonStore.getCurrentSemester()
  filters.studentClass = ''
  filters.student = ''
  filters.dateRange = null
  filters.sourceType = ''
  pagination.page = 1
  fetchData()
}

function exportData() {
  if (records.value.length === 0) {
    ElMessage.warning(t('allData.noDataExport'))
    return
  }

  // 简单CSV导出
  const headers = ['学生', '班级', '记录类型', '记录日期', '记录事由', '记录老师']
  const rows = records.value.map(r => [
    r.学生,
    r.班级,
    r.记录类型,
    formatDate(r.记录日期),
    r.记录事由 || '',
    r.记录老师
  ])

  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filters.collection}_${dayjs().format('YYYYMMDD')}.csv`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success(t('allData.exportSuccess'))
}

function showColumn(field) {
  const noDescriptionTypes = ['Late_Records', 'Leave_Room_Late_Records', 'Back_School_Late_Records', 'Room_Praise_Records', 'Phone_Late_Records']
  if (field === '记录事由' && noDescriptionTypes.includes(filters.collection)) {
    return false
  }
  return true
}

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

function getSourceTypeLabel(type) {
  const map = {
    dorm: t('allData.sourceDorm'),
    teach: t('allData.sourceTeach'),
    other: t('allData.sourceOther')
  }
  return map[type] || type || t('allData.sourceUncategorized')
}

function getSourceTypeTag(type) {
  const map = { dorm: 'warning', teach: 'danger', other: 'info' }
  return map[type] || 'info'
}
</script>

<style scoped>
.filter-form {
  margin-bottom: 20px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.total-info {
  color: #909399;
  font-size: 14px;
}

/* 响应式优化 */
@media (max-width: 768px) {
  /* 筛选表单垂直布局 */
  .filter-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .filter-form :deep(.el-form-item) {
    margin-right: 0 !important;
    margin-bottom: 0 !important;
    width: 100%;
  }

  .filter-form :deep(.el-form-item__label) {
    width: 80px !important;
    text-align: left;
  }

  .filter-form :deep(.el-form-item__content) {
    flex: 1;
  }

  .filter-form :deep(.el-select),
  .filter-form :deep(.el-input),
  .filter-form :deep(.el-date-editor) {
    width: 100% !important;
  }

  /* 按钮组 */
  .filter-form :deep(.el-form-item:last-child .el-form-item__content) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .filter-form :deep(.el-form-item:last-child .el-button) {
    flex: 1;
    min-width: 80px;
  }

  /* 表格底部 */
  .table-footer {
    flex-direction: column;
    gap: 12px;
  }

  .total-info {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .filter-form :deep(.el-form-item__label) {
    font-size: 13px !important;
  }
}
</style>
