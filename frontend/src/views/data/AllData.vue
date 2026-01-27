<template>
  <div class="all-data">
    <el-card>
      <template #header>
        <span>数据查询</span>
      </template>

      <!-- 筛选条件 -->
      <el-form :inline="true" class="filter-form">
        <el-form-item label="记录类型">
          <el-select
            v-model="filters.collection"
            placeholder="选择记录类型"
            style="width: 180px"
            @change="fetchData"
          >
            <el-option label="FAD记录" value="FAD_Records" />
            <el-option label="Reward记录" value="Reward_Records" />
            <el-option label="迟到记录" value="Late_Records" />
            <el-option label="寝室迟出" value="Leave_Room_Late_Records" />
            <el-option label="未按规定返校" value="Back_School_Late_Records" />
            <el-option label="寝室表扬" value="Room_Praise_Records" />
            <el-option label="寝室批评" value="Room_Warning_Records" />
            <el-option label="寝室垃圾未倒" value="Room_Trash_Records" />
            <el-option label="电子产品违规" value="Elec_Products_Violation_Records" />
            <el-option label="手机迟交" value="Phone_Late_Records" />
            <el-option label="Teaching FAD Ticket" value="Teaching_FAD_Ticket" />
            <el-option label="Teaching Reward Ticket" value="Teaching_Reward_Ticket" />
          </el-select>
        </el-form-item>

        <el-form-item label="学期">
          <el-select
            v-model="filters.semester"
            placeholder="选择学期"
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

        <el-form-item label="班级">
          <el-select
            v-model="filters.studentClass"
            placeholder="选择班级"
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

        <el-form-item label="学生">
          <el-input
            v-model="filters.student"
            placeholder="输入学生姓名"
            style="width: 120px"
            clearable
            @keyup.enter="fetchData"
          />
        </el-form-item>

        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="fetchData"
          />
        </el-form-item>

        <el-form-item v-if="filters.collection === 'FAD_Records'" label="来源类型">
          <el-select
            v-model="filters.sourceType"
            placeholder="全部"
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
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="success" @click="exportData">导出</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="records" stripe border>
        <el-table-column prop="学生" label="学生" width="100" fixed />
        <el-table-column prop="班级" label="班级" width="120" />
        <el-table-column prop="记录类型" label="记录类型" width="150" v-if="showColumn('记录类型')" />
        <el-table-column prop="记录日期" label="记录日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.记录日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="记录事由" label="记录事由" min-width="180" show-overflow-tooltip v-if="showColumn('记录事由')" />
        <el-table-column prop="记录老师" label="记录老师" width="120" />
        <el-table-column prop="FAD来源类型" label="来源类型" width="100" v-if="filters.collection === 'FAD_Records'">
          <template #default="{ row }">
            <el-tag v-if="row.FAD来源类型" :type="getSourceTypeTag(row.FAD来源类型)" size="small">
              {{ getSourceTypeLabel(row.FAD来源类型) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发放状态" width="100" v-if="filters.collection === 'FAD_Records' || filters.collection === 'Reward_Records'">
          <template #default="{ row }">
            <el-tag v-if="row.是否已发放" type="success" size="small">已发放</el-tag>
            <el-tag v-else type="info" size="small">未发放</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" v-if="filters.collection === 'FAD_Records' || filters.collection === 'Room_Warning_Records' || filters.collection === 'Room_Trash_Records'">
          <template #default="{ row }">
            <template v-if="filters.collection === 'FAD_Records'">
              <el-tag v-if="row.是否已冲销记录" type="success" size="small">已冲销</el-tag>
              <el-tag v-else-if="row.是否已执行或冲抵" type="warning" size="small">已执行未冲销</el-tag>
              <el-tag v-else type="danger" size="small">未执行</el-tag>
            </template>
            <template v-else-if="filters.collection === 'Room_Warning_Records'">
              <el-tag v-if="row.是否已累计FAD" type="danger" size="small">已累计FAD</el-tag>
              <el-tag v-else type="primary" size="small">未累计FAD</el-tag>
            </template>
            <template v-else-if="filters.collection === 'Room_Trash_Records'">
              <el-tag v-if="row.是否已累计寝室批评" type="danger" size="small">已累计批评</el-tag>
              <el-tag v-else type="primary" size="small">未累计批评</el-tag>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-info">共 {{ pagination.total }} 条记录</span>
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
import { ElMessage } from 'element-plus'
import { useCommonStore } from '@/stores/common'
import { queryRecords } from '@/api/records'
import dayjs from 'dayjs'

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
    ElMessage.warning('没有数据可导出')
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

  ElMessage.success('导出成功')
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
  const map = { dorm: '寝室类', teach: '教学类', other: '其他' }
  return map[type] || type || '未分类'
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
