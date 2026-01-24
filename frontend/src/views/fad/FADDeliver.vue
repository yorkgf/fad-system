<template>
  <div class="fad-deliver">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>FAD通知单发放</span>
          <div class="filters">
            <el-select
              v-model="filters.semester"
              placeholder="选择学期"
              style="width: 180px"
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
              v-model="filters.sourceType"
              placeholder="FAD来源类型"
              style="width: 120px"
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
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="records"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="学生" label="学生" width="100" />
        <el-table-column prop="班级" label="班级" width="120" />
        <el-table-column prop="记录日期" label="记录日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.记录日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="记录事由" label="记录事由" min-width="200" show-overflow-tooltip />
        <el-table-column prop="记录老师" label="记录老师" width="120" />
        <el-table-column prop="FAD来源类型" label="来源类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getSourceTypeTag(row.FAD来源类型)">
              {{ getSourceTypeLabel(row.FAD来源类型) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleDownload(row)">
              下载通知单
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleDeliver([row])"
            >
              确认发放
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <div class="batch-actions">
          <el-button
            type="primary"
            :disabled="selectedRows.length === 0"
            @click="handleDeliver(selectedRows)"
          >
            批量确认发放 ({{ selectedRows.length }})
          </el-button>
        </div>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useCommonStore } from '@/stores/common'
import { getUndeliveredFAD, deliverFAD } from '@/api/fad'
import dayjs from 'dayjs'

const userStore = useUserStore()
const commonStore = useCommonStore()

const loading = ref(false)
const records = ref([])
const selectedRows = ref([])

const filters = reactive({
  semester: '',
  sourceType: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

onMounted(() => {
  commonStore.generateSemesters()
  filters.semester = commonStore.getCurrentSemester()
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await getUndeliveredFAD({
      semester: filters.semester,
      sourceType: filters.sourceType || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    records.value = res.data || res
    pagination.total = res.total || records.value.length
  } catch (error) {
    records.value = []
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function handleDownload(row) {
  const htmlContent = generateNoticeHTML(row)
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${row.学生}FAD记录.html`
  a.click()
  URL.revokeObjectURL(url)
}

function generateNoticeHTML(row) {
  const sourceTypeLabel = getSourceTypeLabel(row.FAD来源类型)
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>FAD 通知</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { width: 200px; height: 200px; margin-bottom: 15px; }
        h1 { font-size: 24px; margin: 0; }
        .content { max-width: 600px; margin: 0 auto; }
        .field { margin: 15px 0; font-size: 16px; }
        .label { font-weight: bold; display: inline-block; width: 100px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="logo.png" alt="Logo" class="logo" />
        <h1>FAD 通知</h1>
    </div>
    <div class="content">
        <div class="field"><span class="label">姓名：</span>${row.学生}</div>
        <div class="field"><span class="label">班级：</span>${row.班级}</div>
        <div class="field"><span class="label">学期：</span>${row.学期}</div>
        <div class="field"><span class="label">日期：</span>${formatDate(row.记录日期)}</div>
        <div class="field"><span class="label">记录老师：</span>${row.记录老师}</div>
        <div class="field"><span class="label">来源类型：</span>${sourceTypeLabel}</div>
        <div class="field"><span class="label">事由：</span>${row.记录事由}</div>
    </div>
</body>
</html>`
}

async function handleDeliver(rows) {
  const count = rows.length

  try {
    await ElMessageBox.confirm(
      `确定要确认发放 ${count} 条FAD通知单吗？`,
      '确认发放',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    loading.value = true
    const promises = rows.map(row => deliverFAD(row._id, userStore.username))
    await Promise.all(promises)

    ElMessage.success(`成功确认发放 ${count} 条FAD通知单`)
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发放确认失败')
    }
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
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
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  gap: 12px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}
</style>
