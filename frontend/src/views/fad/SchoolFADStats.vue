<template>
  <div class="fad-stats">
    <el-row :gutter="20">
      <!-- 筛选条件 -->
      <el-col :span="24">
        <el-card class="filter-card">
          <el-form :inline="false">
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12" :md="12">
                <el-form-item label="统计周期">
                  <el-select
                    v-model="filters.timePeriod"
                    placeholder="选择统计周期"
                    style="width: 100%"
                    @change="fetchStats"
                  >
                    <el-option label="春季" value="春季(Spring)" />
                    <el-option label="秋季" value="秋季(Fall)" />
                    <el-option label="学年" value="学年" />
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

      <!-- 按班级FAD总量 Top 3 -->
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
              <div class="header-actions">
                <el-tag class="header-tag" type="info" size="small">FAD总数 / 班级人数</el-tag>
                <el-button
                  type="primary"
                  size="small"
                  :icon="Download"
                  @click="exportPerClassStatsToCSV"
                  :disabled="perClassStats.length === 0"
                >
                  导出CSV
                </el-button>
              </div>
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
          <el-table :data="studentStats" stripe class="responsive-table" :expand-row-keys="expandedRows">
            <el-table-column type="expand">
              <template #default="{ row }">
                <el-card class="expanded-card">
                  <template #header>
                    <span>FAD详细记录</span>
                  </template>
                  <el-table :data="row.details" stripe size="small" class="details-table">
                    <el-table-column prop="记录日期" label="记录日期" min-width="100">
                      <template #default="{ row }">
                        {{ formatDate(row.记录日期) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="记录事由" label="记录事由" min-width="150" />
                    <el-table-column prop="记录老师" label="记录老师" min-width="80" class-name="hide-on-xs" />
                    <el-table-column prop="FAD来源类型" label="来源类型" min-width="80">
                      <template #default="{ row }">
                        <el-tag :type="getSourceTypeTag(row.FAD来源类型)" size="small">
                          {{ getSourceTypeLabel(row.FAD来源类型) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="是否已执行或冲抵" label="执行状态" min-width="80">
                      <template #default="{ row }">
                        <el-tag :type="row.是否已执行或冲抵 ? 'success' : 'danger'" size="small">
                          {{ row.是否已执行或冲抵 ? '已执行' : '未执行' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="是否已冲销记录" label="冲销状态" min-width="80" class-name="hide-on-xs">
                      <template #default="{ row }">
                        <el-tag :type="row.是否已冲销记录 ? 'info' : 'warning'" size="small">
                          {{ row.是否已冲销记录 ? '已冲销' : '未冲销' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-card>
              </template>
            </el-table-column>
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
import { Download } from '@element-plus/icons-vue'

const commonStore = useCommonStore()

const loading = ref(false)

const filters = reactive({
  timePeriod: '',
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
const expandedRows = ref([])

onMounted(async () => {
  commonStore.generateSemesters()
  const currentSemester = commonStore.getCurrentSemester()
  filters.timePeriod = currentSemester || '春季(Spring)'

  await commonStore.fetchClasses()
  fetchStats()
})

async function fetchStats() {
  loading.value = true
  try {
    const params = {
      studentClass: filters.studentClass || undefined
    }

    if (filters.timePeriod === '学年') {
      params.semesters = ['春季(Spring)', '秋季(Fall)']
    } else if (filters.timePeriod) {
      params.semesters = [filters.timePeriod]
    }

    if (filters.sourceType) {
      params.sourceType = filters.sourceType
    }

    const res = await getFADStats(params)
    const data = res.data || res

    stats.total = data.total || 0
    stats.executed = data.executed || 0
    stats.delivered = data.delivered || 0
    stats.offset = data.offset || 0

    sourceTypeStats.value = data.bySourceType || []
    classStats.value = (data.byClass || []).slice(0, 3)
    perClassStats.value = data.perClass || []
    studentStats.value = (data.byStudent || []).slice(0, 10)
  } catch (error) {
    console.error('获取FAD统计失败:', error)
  } finally {
    loading.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function getSourceTypeLabel(type) {
  const map = { dorm: '寝室类', teach: '教学类', elec: '电子产品违规', other: '其他' }
  return map[type] || type || '未分类'
}

function getSourceTypeTag(type) {
  const map = { dorm: 'warning', teach: 'danger', elec: 'primary', other: 'info' }
  return map[type] || 'info'
}

function getRankClass(rank) {
  if (rank === 1) return 'rank-first'
  if (rank === 2) return 'rank-second'
  if (rank === 3) return 'rank-third'
  return ''
}

function getAvgFADTagType(avg) {
  if (avg >= 3) return 'danger'
  if (avg >= 2) return 'warning'
  if (avg >= 1) return 'primary'
  return 'success'
}

// 导出按班级人均FAD排名为CSV
function exportPerClassStatsToCSV() {
  if (perClassStats.value.length === 0) {
    return
  }

  // CSV头部
  const headers = ['排名', '班级', 'FAD总数', '班级人数', '人均FAD']

  // CSV数据行
  const rows = perClassStats.value.map((row, index) => [
    index + 1,
    row.class,
    row.fadCount,
    row.studentCount,
    row.avgFAD
  ])

  // 构建CSV内容
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // 创建Blob对象
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })

  // 创建下载链接
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  // 生成文件名（包含当前日期）
  const date = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')
  const fileName = `班级人均FAD排名_${date}.csv`

  link.setAttribute('href', url)
  link.setAttribute('download', fileName)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

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

.responsive-table {
  width: 100%;
}

.expanded-card {
  margin: 10px;
}

.details-table {
  margin-top: 10px;
}

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
}
</style>