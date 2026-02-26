<template>
  <div class="fad-stats">
    <el-row :gutter="20">
      <!-- 筛选条件 -->
      <el-col :span="24">
        <el-card class="filter-card">
          <el-form :inline="false">
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12" :md="12">
                <el-form-item :label="$t('fad.stats.statPeriod')">
                  <el-select
                    v-model="filters.timePeriod"
                    :placeholder="$t('fad.stats.selectStatPeriod')"
                    style="width: 100%"
                    @change="fetchStats"
                  >
                    <el-option :label="$t('fad.stats.spring')" value="春季(Spring)" />
                    <el-option :label="$t('fad.stats.fall')" value="秋季(Fall)" />
                    <el-option :label="$t('fad.stats.academicYear')" value="学年" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" v-if="canSelectClass">
                <el-form-item :label="$t('fad.stats.class')">
                  <el-select
                    v-model="filters.studentClass"
                    :placeholder="$t('fad.stats.allClasses')"
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
                <el-form-item :label="$t('fad.stats.source')">
                  <el-select
                    v-model="filters.sourceType"
                    :placeholder="$t('fad.stats.all')"
                    clearable
                    style="width: 100%"
                    @change="fetchStats"
                  >
                    <el-option :label="$t('fad.stats.all')" value="" />
                    <el-option :label="$t('fad.stats.sourceDorm')" value="dorm" />
                    <el-option :label="$t('fad.stats.sourceTeach')" value="teach" />
                    <el-option :label="$t('fad.stats.sourceElec')" value="elec" />
                    <el-option :label="$t('fad.stats.sourceOther')" value="other" />
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
          <div class="stat-label">{{ $t('fad.stats.totalFad') }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card">
          <div class="stat-value executed">{{ stats.executed }}</div>
          <div class="stat-label">{{ $t('fad.stats.executed') }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card">
          <div class="stat-value delivered">{{ stats.delivered }}</div>
          <div class="stat-label">{{ $t('fad.stats.delivered') }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card">
          <div class="stat-value offset">{{ stats.offset }}</div>
          <div class="stat-label">{{ $t('fad.stats.offset') }}</div>
        </el-card>
      </el-col>

      <!-- 按来源类型统计 -->
      <el-col :xs="24" :sm="24" :md="12">
        <el-card>
          <template #header>
            <span>{{ $t('fad.stats.bySourceType') }}</span>
          </template>
          <el-table :data="sourceTypeStats" stripe class="responsive-table">
            <el-table-column prop="type" :label="$t('fad.stats.sourceTypeCol')" min-width="90">
              <template #default="{ row }">
                <el-tag :type="getSourceTypeTag(row.type)" size="small">
                  {{ getSourceTypeLabel(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="count" :label="$t('fad.stats.count')" min-width="60" />
            <el-table-column prop="executed" :label="$t('fad.stats.executed')" min-width="60" />
            <el-table-column prop="delivered" :label="$t('fad.stats.delivered')" min-width="60" class-name="hide-on-xs" />
            <el-table-column prop="offset" :label="$t('fad.stats.offset')" min-width="60" class-name="hide-on-xs" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 本班有未执行FAD学生名单 -->
      <el-col :span="24" v-if="unexecutedStudentStats.length > 0">
        <el-card>
          <template #header>
            <div class="card-header-flex">
              <span>{{ $t('fad.stats.unexecutedStudentList') }}</span>
              <el-tag class="header-tag" type="danger" size="small">{{ $t('fad.stats.totalCount', { count: unexecutedStudentStats.length }) }}</el-tag>
            </div>
          </template>
          <el-table :data="unexecutedStudentStats" stripe class="responsive-table">
            <el-table-column prop="student" :label="$t('fad.stats.student')" min-width="70" />
            <el-table-column prop="class" :label="$t('fad.stats.class')" min-width="80" class-name="hide-on-xs" />
            <el-table-column prop="unexecutedCount" :label="$t('fad.stats.unexecutedFadCount')" min-width="100" sortable>
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.unexecutedCount }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('fad.stats.fadDetails')" min-width="200">
              <template #default="{ row }">
                <div class="fad-details-list">
                  <el-tag
                    v-for="(record, index) in row.records.slice(0, 3)"
                    :key="index"
                    type="warning"
                    size="small"
                    class="fad-detail-tag"
                  >
                    {{ formatDate(record.记录日期) }}: {{ record.记录事由?.substring(0, 10) || $t('fad.stats.noRecord') }}
                  </el-tag>
                  <span v-if="row.records.length > 3" class="more-tag">{{ $t('fad.stats.more', { count: row.records.length - 3 }) }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 按学生统计（FAD较多的学生） -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>{{ $t('fad.stats.topStudentsTitle') }}</span>
          </template>
          <el-table :data="studentStats" stripe class="responsive-table" :expand-row-keys="expandedRows">
            <el-table-column type="expand">
              <template #default="{ row }">
                <el-card class="expanded-card">
                  <template #header>
                    <span>{{ $t('fad.stats.fadDetailRecords') }}</span>
                  </template>
                  <el-table :data="row.details" stripe size="small" class="details-table">
                    <el-table-column prop="记录日期" :label="$t('fad.stats.recordDate')" min-width="100">
                      <template #default="{ row }">
                        {{ formatDate(row.记录日期) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="记录事由" :label="$t('fad.stats.recordReason')" min-width="150" />
                    <el-table-column prop="记录老师" :label="$t('fad.stats.recordTeacher')" min-width="80" class-name="hide-on-xs" />
                    <el-table-column prop="FAD来源类型" :label="$t('fad.stats.sourceTypeCol')" min-width="80">
                      <template #default="{ row }">
                        <el-tag :type="getSourceTypeTag(row.FAD来源类型)" size="small">
                          {{ getSourceTypeLabel(row.FAD来源类型) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="是否已执行或冲抵" :label="$t('fad.stats.executionStatus')" min-width="80">
                      <template #default="{ row }">
                        <el-tag :type="row.是否已执行或冲抵 ? 'success' : 'danger'" size="small">
                          {{ row.是否已执行或冲抵 ? $t('fad.stats.executedStatus') : $t('fad.stats.notExecutedStatus') }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="是否已冲销记录" :label="$t('fad.stats.offsetStatus')" min-width="80" class-name="hide-on-xs">
                      <template #default="{ row }">
                        <el-tag :type="row.是否已冲销记录 ? 'info' : 'warning'" size="small">
                          {{ row.是否已冲销记录 ? $t('fad.stats.offsetDone') : $t('fad.stats.notOffset') }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-card>
              </template>
            </el-table-column>
            <el-table-column prop="student" :label="$t('fad.stats.student')" min-width="70" />
            <el-table-column prop="class" :label="$t('fad.stats.class')" min-width="80" class-name="hide-on-xs" />
            <el-table-column prop="count" :label="$t('fad.stats.fadTotal')" min-width="65" sortable />
            <el-table-column prop="executed" :label="$t('fad.stats.executed')" min-width="60" class-name="hide-on-xs" />
            <el-table-column prop="unexecuted" :label="$t('fad.stats.unexecuted')" min-width="60">
              <template #default="{ row }">
                <el-tag v-if="row.unexecuted > 0" type="danger" size="small">
                  {{ row.unexecuted }}
                </el-tag>
                <span v-else>0</span>
              </template>
            </el-table-column>
            <el-table-column prop="offset" :label="$t('fad.stats.offset')" min-width="60" class-name="hide-on-sm" />
            <el-table-column :label="$t('fad.stats.sourceDistribution')" min-width="150" class-name="hide-on-sm">
              <template #default="{ row }">
                <div class="source-tags">
                  <el-tag v-if="row.dorm" type="warning" size="small" class="source-tag">
                    {{ $t('fad.stats.dormPrefix') }}{{ row.dorm }}
                  </el-tag>
                  <el-tag v-if="row.teach" type="danger" size="small" class="source-tag">
                    {{ $t('fad.stats.teachPrefix') }}{{ row.teach }}
                  </el-tag>
                  <el-tag v-if="row.elec" type="primary" size="small" class="source-tag">
                    {{ $t('fad.stats.elecPrefix') }}{{ row.elec }}
                  </el-tag>
                  <el-tag v-if="row.other" type="info" size="small" class="source-tag">
                    {{ $t('fad.stats.otherPrefix') }}{{ row.other }}
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCommonStore } from '@/stores/common'
import { useUserStore } from '@/stores/user'
import { getFADStats } from '@/api/fad'
import { getMyClassAsHomeTeacher } from '@/api/students'

const { t } = useI18n()
const commonStore = useCommonStore()
const userStore = useUserStore()

const loading = ref(false)
const myClass = ref(null) // 存储当前用户作为班主任的班级信息

const filters = reactive({
  timePeriod: '', // 统计周期：春季(Spring) / 秋季(Fall) / 学年
  studentClass: '',
  sourceType: ''
})

// 判断是否可以选择班级（只有S和A组用户可以选择）
const canSelectClass = computed(() => ['S', 'A'].includes(userStore.userGroup))

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
const expandedRows = ref([]) // 用于记录展开的行
const unexecutedStudentStats = ref([]) // 本班有未执行FAD学生名单

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(async () => {
  commonStore.generateSemesters()
  // 默认选择当前学期
  const currentSemester = commonStore.getCurrentSemester()
  filters.timePeriod = currentSemester || '春季(Spring)'

  // 对于 B 和 T 组的用户，获取其作为班主任的班级信息
  if (['B', 'T'].includes(userStore.userGroup)) {
    try {
      const res = await getMyClassAsHomeTeacher()
      if (res.success) {
        myClass.value = res.data
        filters.studentClass = res.data.Class // 自动设置班级筛选条件
      }
    } catch (error) {
      console.error('获取班主任班级信息失败:', error)
    }
  }

  await commonStore.fetchClasses()
  fetchStats()
})

async function fetchStats() {
  loading.value = true
  try {
    const params = {
      studentClass: filters.studentClass || undefined
    }

    // 根据统计周期设置学期参数
    if (filters.timePeriod === '学年') {
      // 学年包括春季和秋季
      params.semesters = ['春季(Spring)', '秋季(Fall)']
    } else if (filters.timePeriod) {
      // 单个学期
      params.semesters = [filters.timePeriod]
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

    // 本班有未执行FAD学生名单
    unexecutedStudentStats.value = data.unexecutedStudents || []
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
  const map = {
    dorm: t('fad.stats.sourceDorm'),
    teach: t('fad.stats.sourceTeach'),
    elec: t('fad.stats.sourceElec'),
    other: t('fad.stats.sourceOther')
  }
  return map[type] || type || t('fad.stats.sourceUncategorized')
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
