<template>
  <div class="stop-class">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>停课/劝退名单</span>
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
        </div>
      </template>

      <div class="rules-alert">
        <el-alert
          title="FAD处罚规则说明"
          type="warning"
          :closable="false"
        >
          <div class="rules-content">
            <div class="rule-item">
              <span class="rule-count">3次</span>
              <span class="rule-desc">学生处约谈家长</span>
            </div>
            <div class="rule-item">
              <span class="rule-count warning">6次</span>
              <span class="rule-desc">视情况停课处理</span>
            </div>
            <div class="rule-item">
              <span class="rule-count danger">9次</span>
              <span class="rule-desc">劝退处理</span>
            </div>
          </div>
        </el-alert>
      </div>

      <!-- 统计概览 -->
      <div class="stats-overview" v-if="stats.total > 0">
        <div class="stat-item danger" v-if="stats.danger > 0">
          <span class="stat-number">{{ stats.danger }}</span>
          <span class="stat-label">劝退</span>
        </div>
        <div class="stat-item warning" v-if="stats.warning > 0">
          <span class="stat-number">{{ stats.warning }}</span>
          <span class="stat-label">停课</span>
        </div>
      </div>

      <el-table v-loading="loading" :data="records" stripe class="responsive-table">
        <el-table-column prop="学生" label="学生" min-width="80" />
        <el-table-column prop="班级" label="班级" min-width="100" class-name="hide-on-xs" />
        <el-table-column prop="fadCount" label="FAD" min-width="70">
          <template #default="{ row }">
            <el-tag :type="getFADTagType(row.fadCount)" size="small">{{ row.fadCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="级别" min-width="70">
          <template #default="{ row }">
            <el-tag v-if="row.fadCount >= 9" type="danger" size="small" effect="dark">劝退</el-tag>
            <el-tag v-else-if="row.fadCount >= 6" type="warning" size="small">停课</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="停课开始日期" label="停课开始" min-width="100" class-name="hide-on-xs">
          <template #default="{ row }">
            {{ formatDate(row.停课开始日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="停课结束日期" label="停课结束" min-width="100" class-name="hide-on-xs">
          <template #default="{ row }">
            {{ formatDate(row.停课结束日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="stopDays" label="天数" min-width="60" class-name="hide-on-sm">
          <template #default="{ row }">
            {{ row.stopDays > 0 ? row.stopDays + '天' : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="70" class-name="hide-on-xs">
          <template #default="{ row }">
            <el-tag v-if="isInStop(row)" type="danger" size="small">停课中</el-tag>
            <el-tag v-else-if="row.停课开始日期" type="success" size="small">已结束</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="records.length === 0 && !loading" description="暂无停课/劝退学生" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useCommonStore } from '@/stores/common'
import { getStopClassList } from '@/api/other'
import dayjs from 'dayjs'

const commonStore = useCommonStore()

const loading = ref(false)
const records = ref([])
const stats = reactive({
  total: 0,
  warning: 0,
  danger: 0
})

const filters = reactive({
  semester: ''
})

onMounted(() => {
  commonStore.generateSemesters()
  filters.semester = commonStore.getCurrentSemester()
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await getStopClassList({ semester: filters.semester })
    records.value = res.data || res

    // 统计各级别人数
    stats.total = records.value.length
    stats.warning = records.value.filter(r => r.fadCount >= 6 && r.fadCount < 9).length
    stats.danger = records.value.filter(r => r.fadCount >= 9).length
  } catch (error) {
    records.value = []
    stats.total = 0
    stats.warning = 0
    stats.danger = 0
  } finally {
    loading.value = false
  }
}

// 根据FAD数量获取标签类型
function getFADTagType(count) {
  if (count >= 9) return 'danger'
  if (count >= 6) return 'warning'
  return 'info'
}

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

function isInStop(row) {
  if (!row.停课结束日期) return true
  return dayjs().isBefore(dayjs(row.停课结束日期))
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rules-alert {
  margin-bottom: 20px;
}

.rules-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-count {
  display: inline-block;
  min-width: 32px;
  padding: 2px 8px;
  background: #e6a23c;
  color: #fff;
  border-radius: 4px;
  font-weight: bold;
  font-size: 13px;
  text-align: center;
}

.rule-count.warning {
  background: #f56c6c;
}

.rule-count.danger {
  background: #ff4d4f;
}

.rule-desc {
  font-size: 13px;
  color: #606266;
}

/* 统计概览 */
.stats-overview {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  background: #f5f7fa;
}

.stat-item.warning {
  background: #fdf6ec;
  border: 1px solid #f5dab1;
}

.stat-item.danger {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
}

.stat-item.warning .stat-number {
  color: #e6a23c;
}

.stat-item.danger .stat-number {
  color: #f56c6c;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

/* 响应式表格 */
.responsive-table {
  width: 100%;
}

/* ========== 响应式优化 ========== */
@media (max-width: 768px) {
  .rules-content {
    flex-direction: column;
    gap: 8px;
  }

  .rule-item {
    font-size: 13px;
  }

  .stats-overview {
    gap: 12px;
  }

  .stat-item {
    padding: 8px 16px;
    flex: 1;
    min-width: 100px;
  }

  .stat-number {
    font-size: 20px;
  }

  .stat-label {
    font-size: 12px;
  }

  :deep(.el-table .el-table__cell) {
    padding: 8px 4px;
    font-size: 13px;
  }

  :deep(.el-table th.el-table__cell) {
    padding: 10px 4px;
    font-size: 13px;
  }

  :deep(.hide-on-xs) {
    display: none !important;
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  :deep(.el-table .el-table__cell) {
    padding: 6px 2px;
    font-size: 12px;
  }

  :deep(.hide-on-sm) {
    display: none !important;
  }

  :deep(.el-tag) {
    font-size: 11px;
    padding: 0 4px;
    height: 20px;
    line-height: 18px;
  }
}
</style>
