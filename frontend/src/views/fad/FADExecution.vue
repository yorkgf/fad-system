<template>
  <div class="fad-execution">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t('fad.execution.title') }}</span>
          <div class="filters">
            <el-select
              v-model="filters.semester"
              :placeholder="$t('fad.execution.selectSemester')"
              style="width: 180px"
              @change="fetchData"
            >
              <el-option
                v-for="item in commonStore.semesters"
                :key="item.value"
                :label="$t(item.labelKey)"
                :value="item.value"
              />
            </el-select>
            <el-select
              v-model="filters.sourceType"
              :placeholder="$t('fad.execution.fadSourceType')"
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
        <el-table-column prop="学生" :label="$t('fad.execution.student')" width="100" />
        <el-table-column prop="班级" :label="$t('fad.execution.class')" width="120" />
        <el-table-column prop="记录日期" :label="$t('fad.execution.recordDate')" width="120">
          <template #default="{ row }">
            {{ formatDate(row.记录日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="记录事由" :label="$t('fad.execution.recordReason')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="记录老师" :label="$t('fad.execution.recordTeacher')" width="120" />
        <el-table-column prop="FAD来源类型" :label="$t('fad.execution.sourceType')" width="100">
          <template #default="{ row }">
            <el-tag :type="getSourceTypeTag(row.FAD来源类型)">
              {{ getSourceTypeLabel(row.FAD来源类型) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('fad.execution.operation')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleExecute([row])"
            >
              {{ $t('fad.execution.execute') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <div class="batch-actions">
          <el-button
            type="primary"
            :disabled="selectedRows.length === 0"
            @click="handleExecute(selectedRows)"
          >
            {{ $t('fad.execution.batchExecute', { count: selectedRows.length }) }}
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
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCommonStore } from '@/stores/common'
import { getUnexecutedFAD, executeFAD } from '@/api/fad'
import dayjs from 'dayjs'

const { t } = useI18n()
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
    const res = await getUnexecutedFAD({
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

async function handleExecute(rows) {
  const count = rows.length
  const studentNames = rows.map(r => r.学生).join('、')

  try {
    await ElMessageBox.confirm(
      t('fad.execution.confirmExecute', { count, students: studentNames }),
      t('fad.execution.confirmExecuteTitle'),
      {
        confirmButtonText: t('fad.execution.confirmExecuteBtn'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    loading.value = true
    const promises = rows.map(row => executeFAD(row._id))
    await Promise.all(promises)

    ElMessage.success(t('fad.execution.executeSuccess', { count }))
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('fad.execution.executeFailed'))
    }
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function getSourceTypeLabel(type) {
  const map = {
    dorm: t('fad.execution.sourceDorm'),
    teach: t('fad.execution.sourceTeach'),
    elec: t('fad.execution.sourceElec'),
    other: t('fad.execution.sourceOther')
  }
  return map[type] || type || t('fad.execution.sourceUncategorized')
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

/* 响应式优化 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .filters {
    width: 100%;
    flex-direction: column;
  }

  .filters .el-select {
    width: 100% !important;
  }

  .table-footer {
    flex-direction: column;
    gap: 12px;
  }

  .batch-actions {
    width: 100%;
  }

  .batch-actions .el-button {
    width: 100%;
  }

  /* 移动端隐藏部分列 */
  :deep(.el-table) .hide-mobile {
    display: none;
  }
}
</style>
