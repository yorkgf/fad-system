<template>
  <div class="fad-stats">
    <el-row :gutter="20">
      <!-- 筛选条件 -->
      <el-col :span="24">
        <el-card class="filter-card">
          <el-form :inline="false">
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12" :md="12">
                <el-form-item label="学期（可多选）">
                  <el-select
                    v-model="filters.semesters"
                    placeholder="选择学期"
                    multiple
                    style="width: 100%"
                    @change="fetchStats"
                  >
                    <el-option
                      v-for="item in commonStore.semesters"
                      :key="item"
                      :label="item"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="班级">
                  <el-select
                    v-model="filters.studentClass"
                    placeholder="全部班级"
                    filterable
                    clearable
                    style="width: 100%"
                    @change="fetchStats"
                  >
                    <el-option
                      v-for="item in commonStore.classes"
                      :key="item.Class"
                      :label="item.Class"
                      :value="item.Class"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="4">
                <el-form-item label="来源">
                  <el-select
                    v-model="filters.sourceType"
                    placeholder="全部"
                    clearable
                    style="width: 100%"
                    @change="fetchStats"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="寝室类" value="dorm" />
                    <el-option label="教学类" value="teach" />
                    <el-option label="电子产品违规" value="elec" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
      </el-col>

      <!-- 统计卡片 -->
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">FAD总数</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card">
          <div class="stat-value executed">{{ stats.executed }}</div>
          <div class="stat-label">已执行</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card">
          <div class="stat-value delivered">{{ stats.delivered }}</div>
          <div class="stat-label">已发放</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card">
          <div class="stat-value offset">{{ stats.offset }}</div>
          <div class="stat-label">已冲销</div>
        </el-card>
      </el-col>

      <!-- 按来源类型统计 -->
      <el-col :xs="24" :sm="24" :md="12">
        <el-card>
          <template #header>
            <span>按来源类型统计</span>
          </template>
          <el-table :data="sourceTypeStats" stripe class="responsive-table">
            <el-table-column prop="type" label="来源类型" min-width="90">
              <template #default="{ row }">
                <el-tag :type="getSourceTypeTag(row.type)" size="small">
                  {{ getSourceTypeLabel(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" min-width="60" />
            <el-table-column prop="executed" label="已执行" min-width="60" />
            <el-table-column prop="delivered" label="已发放" min-width="60" class-name="hide-on-xs" />
            <el-table-column prop="offset" label="已冲销" min-width="60" class-name="hide-on-xs" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 按班级统计 -->
      <el-col :xs="24" :sm="24" :md="12">
        <el-card>
          <template #header>
            <span>按班级FAD总量 Top 3</span>
          </template>
          <el-table :data="classStats" stripe class="responsive-table">
            <el-table-column prop="class" label="班级" min-width="80" />
            <el-table-column prop="count" label="FAD数量" min-width="70" sortable />
            <el-table-column prop="executed" label="已执行" min-width="60" />
            <el-table-column prop="unexecuted" label="未执行" min-width="60">
              <template #default="{ row }">
                <el-tag v-if="row.unexecuted > 0" type="danger" size="small">
                  {{ row.unexecuted }}
                </el-tag>
                <span v-else>0</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 按班级人均FAD统计 -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header-flex">
              <span>按班级人均FAD排名</span>
              <el-tag class="header-tag" type="info" size="small">FAD总数 / 班级人数</el-tag>
            </div>
          </template>
          <el-table :data="perClassStats" stripe class="responsive-table">
            <el-table-column label="排名" width="60" align="center">
              <template #default="{ $index }">
                <span :class="getRankClass($index + 1)">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="class" label="班级" min-width="80" />
            <el-table-column prop="fadCount" label="FAD总数" min-width="70" sortable />
            <el-table-column prop="studentCount" label="班级人数" min-width="70" class-name="hide-on-xs" />
            <el-table-column prop="avgFAD" label="人均FAD" min-width="80" sortable>
              <template #default="{ row }">
                <el-tag
                  :type="getAvgFADTagType(row.avgFAD)"
                  size="small"
                >
                  {{ row.avgFAD }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 按学生统计（FAD较多的学生） -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>FAD较多的学生 Top 10</span>
          </template>
          <el-table :data="studentStats" stripe class="responsive-table">
            <el-table-column prop="student" label="学生" min-width="70" />
            <el-table-column prop="class" label="班级" min-width="80" class-name="hide-on-xs" />
            <el-table-column prop="count" label="FAD总数" min-width="65" sortable />
            <el-table-column prop="executed" label="已执行" min-width="60" class-name="hide-on-xs" />
            <el-table-column prop="unexecuted" label="未执行" min-width="60">
              <template #default="{ row }">
                <el-tag v-if="row.unexecuted > 0" type="danger" size="small">
                  {{ row.unexecuted }}
                </el-tag>
                <span v-else>0</span>
              </template>
            </el-table-column>
            <el-table-column prop="offset" label="已冲销" min-width="60" class-name="hide-on-sm" />
            <el-table-column label="来源分布" min-width="150" class-name="hide-on-sm">
              <template #default="{ row }">
                <div class="source-tags">
                  <el-tag v-if="row.dorm" type="warning" size="small" class="source-tag">
                    寝室: {{ row.dorm }}
                  </el-tag>
                  <el-tag v-if="row.teach" type="danger" size="small" class="source-tag">
                    教学: {{ row.teach }}
                  </el-tag>
                  <el-tag v-if="row.elec" type="primary" size="small" class="source-tag">
                    电子: {{ row.elec }}
                  </el-tag>
                  <el-tag v-if="row.other" type="info" size="small" class="source-tag">
                    其他: {{ row.other }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useCommonStore } from '@/stores/common'
import { getFADStats } from '@/api/fad'

const commonStore = useCommonStore()

const loading = ref(false)

const filters = reactive({
  semesters: [],
  studentClass: '',
  sourceType: ''
})

const stats = reactive({
  total: 0,
  executed: 0,
  delivered: 0,
  offset: 0
})

const sourceTypeStats = ref([])
const classStats = ref([])
const perClassStats = ref([])
const studentStats = ref([])

onMounted(async () => {
  commonStore.generateSemesters()
  filters.semesters = [commonStore.getCurrentSemester()]
  await commonStore.fetchClasses()
  fetchStats()
})

async function fetchStats() {
  loading.value = true
  try {
    const params = {
      studentClass: filters.studentClass || undefined
    }

    // 学期参数：如果选择了多个学期，传递数组
    if (filters.semesters.length > 0) {
      params.semesters = filters.semesters
    }

    // 来源类型筛选
    if (filters.sourceType) {
      params.sourceType = filters.sourceType
    }

    const res = await getFADStats(params)

    const data = res.data || res

    // 总体统计
    stats.total = data.total || 0
    stats.executed = data.executed || 0
    stats.delivered = data.delivered || 0
    stats.offset = data.offset || 0

    // 按来源类型统计
    sourceTypeStats.value = data.bySourceType || []

    // 按班级统计
    classStats.value = (data.byClass || []).slice(0, 10)

    // 按班级人均FAD统计
    perClassStats.value = data.perClass || []

    // 按学生统计
    studentStats.value = (data.byStudent || []).slice(0, 20)
  } catch (error) {
    // 使用模拟数据
    stats.total = 0
    stats.executed = 0
    stats.delivered = 0
    stats.offset = 0
    sourceTypeStats.value = []
    classStats.value = []
    studentStats.value = []
  } finally {
    loading.value = false
  }
}

function getSourceTypeLabel(type) {
  const map = { dorm: '寝室类', teach: '教学类', elec: '电子产品违规', other: '其他' }
  return map[type] || type || '未分类'
}

function getSourceTypeTag(type) {
  const map = { dorm: 'warning', teach: 'danger', elec: 'primary', other: 'info' }
  return map[type] || 'info'
}

// 获取排名样式类
function getRankClass(rank) {
  if (rank === 1) return 'rank-first'
  if (rank === 2) return 'rank-second'
  if (rank === 3) return 'rank-third'
  return ''
}

// 根据人均FAD值获取标签类型
function getAvgFADTagType(avg) {
  if (avg >= 3) return 'danger' // 红色：人均3个及以上
  if (avg >= 2) return 'warning' // 橙色：人均2-3个
  if (avg >= 1) return 'primary' // 蓝色：人均1-2个
  return 'success' // 绿色：人均少于1个
}
</script>

<style scoped>
.filter-card {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  margin-bottom: 20px;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #303133;
}

.stat-value.executed {
  color: #67c23a;
}

.stat-value.delivered {
  color: #409eff;
}

.stat-value.offset {
  color: #909399;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.source-tag {
  margin: 2px 0;
}

.el-card {
  margin-bottom: 20px;
}

.card-header-flex {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.header-tag {
  flex-shrink: 0;
}

/* 排名样式 */
.rank-first {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8B4513;
  border-radius: 4px;
  font-weight: bold;
  font-size: 12px;
}

.rank-second {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #555;
  border-radius: 4px;
  font-weight: bold;
  font-size: 12px;
}

.rank-third {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background: linear-gradient(135deg, #cd7f32, #dda15e);
  color: #fff;
  border-radius: 4px;
  font-weight: bold;
  font-size: 12px;
}

/* 响应式表格 */
.responsive-table {
  width: 100%;
}

/* ========== 响应式优化 ========== */

/* 平板及以下 */
@media (max-width: 992px) {
  .stat-value {
    font-size: 28px;
  }

  .stat-label {
    font-size: 13px;
  }
}

/* 手机端 */
@media (max-width: 768px) {
  .stat-value {
    font-size: 24px;
  }

  .stat-label {
    font-size: 12px;
  }

  .stat-card {
    margin-bottom: 12px;
  }

  .el-card {
    margin-bottom: 12px;
  }

  /* 表单项间距 */
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  /* 卡片头部 */
  :deep(.el-card__header) {
    padding: 12px 16px;
  }

  /* 卡片内容 */
  :deep(.el-card__body) {
    padding: 12px;
  }

  /* 表格紧凑 */
  :deep(.el-table .el-table__cell) {
    padding: 8px 4px;
    font-size: 13px;
  }

  :deep(.el-table th.el-table__cell) {
    padding: 10px 4px;
    font-size: 13px;
  }

  /* 隐藏次要列 */
  :deep(.hide-on-sm) {
    display: none !important;
  }
}

/* 超小屏幕 */
@media (max-width: 480px) {
  .stat-value {
    font-size: 22px;
  }

  .stat-label {
    font-size: 11px;
  }

  :deep(.el-table .el-table__cell) {
    padding: 6px 2px;
    font-size: 12px;
  }

  :deep(.el-table th.el-table__cell) {
    padding: 8px 2px;
    font-size: 12px;
  }

  /* 隐藏更多次要列 */
  :deep(.hide-on-xs) {
    display: none !important;
  }

  /* 标签更小 */
  :deep(.el-tag) {
    font-size: 11px;
    padding: 0 4px;
    height: 20px;
    line-height: 18px;
  }

  .rank-first,
  .rank-second,
  .rank-third {
    width: 20px;
    height: 20px;
    line-height: 20px;
    font-size: 11px;
  }

  .card-header-flex {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
