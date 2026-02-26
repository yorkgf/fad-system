<template>
  <div class="fad-stats">
    <!-- 班级信息提示 -->
    <el-alert
      v-if="myClass"
      :title="$t('fad.stats.viewingClass', { class: myClass.Class })"
      type="info"
      :closable="false"
      class="class-info-alert"
    />

    <el-row :gutter="20">
      <!-- 筛选条件 -->
      <el-col :span="24">
        <el-card class="filter-card">
          <el-form :inline="false">
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
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
              <el-col :xs="24" :sm="12">
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
          <div class="stat-label">{{ $t('fad.stats.classTotalFad') }}</div>
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
          <div class="stat-value warning">{{ stats.unexecuted }}</div>
          <div class="stat-label">{{ $t('fad.stats.unexecuted') }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card">
          <div class="stat-value offset">{{ stats.offset }}</div>
          <div class="stat-label">{{ $t('fad.stats.offset') }}</div>
        </el-card>
      </el-col>

      <!-- 本班有未执行FAD的学生列表 -->
      <el-col :span="24" v-if="unexecutedStudents.length > 0">
        <el-card class="warning-card">
          <template #header>
            <div class="card-header-flex">
              <span>{{ $t('fad.stats.unexecutedWarningList') }}</span>
              <el-tag class="header-tag" type="danger" size="small">{{ $t('fad.stats.totalCount', { count: unexecutedStudents.length }) }}</el-tag>
            </div>
          </template>
          <el-table :data="unexecutedStudents" stripe size="small" class="responsive-table">
            <el-table-column prop="student" :label="$t('fad.stats.student')" min-width="80" />
            <el-table-column prop="unexecutedCount" :label="$t('fad.stats.unexecutedCount')" min-width="100">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.unexecutedCount }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 本班有FAD的学生列表 -->
      <el-col :span="24" v-if="classStudents.length > 0">
        <el-card>
          <template #header>
            <span>{{ $t('fad.stats.classStudentList') }}</span>
          </template>
          <el-table :data="classStudents" stripe class="responsive-table" row-key="student">
            <el-table-column type="expand">
              <template #default="{ row }">
                <el-card class="expanded-card">
                  <template #header>
                    <span>{{ $t('fad.stats.studentFadDetail', { student: row.student }) }}</span>
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
            <el-table-column prop="student" :label="$t('fad.stats.student')" min-width="80" />
            <el-table-column prop="class" :label="$t('fad.stats.classCol')" min-width="80" class-name="hide-on-xs" />
            <el-table-column prop="count" :label="$t('fad.stats.fadTotal')" min-width="80" sortable>
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.count }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="executed" :label="$t('fad.stats.executed')" min-width="80" />
            <el-table-column prop="unexecuted" :label="$t('fad.stats.unexecuted')" min-width="80">
              <template #default="{ row }">
                <el-tag v-if="row.unexecuted > 0" type="danger" size="small">
                  {{ row.unexecuted }}
                </el-tag>
                <span v-else>0</span>
              </template>
            </el-table-column>
            <el-table-column prop="offset" :label="$t('fad.stats.offset')" min-width="80" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCommonStore } from '@/stores/common'
import { useUserStore } from '@/stores/user'
import { getFADStats } from '@/api/fad'
import { getMyClassAsHomeTeacher } from '@/api/students'

const { t } = useI18n()
const commonStore = useCommonStore()
const userStore = useUserStore()

const loading = ref(false)
const myClass = ref(null)

const filters = reactive({
  timePeriod: '',
  sourceType: ''
})

const stats = reactive({
  total: 0,
  executed: 0,
  delivered: 0,
  offset: 0,
  unexecuted: 0
})

const sourceTypeStats = ref([])
const classStudents = ref([])
const unexecutedStudents = ref([])

onMounted(async () => {
  commonStore.generateSemesters()
  const currentSemester = commonStore.getCurrentSemester()
  filters.timePeriod = currentSemester || '春季(Spring)'

  // 所有可能作为班主任的组别都需要获取班级信息
  if (['B', 'T', 'S', 'A'].includes(userStore.userGroup)) {
    try {
      const res = await getMyClassAsHomeTeacher()
      if (res.success) {
        myClass.value = res.data
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
      studentClass: myClass.value?.Class || undefined
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
    // 未执行 = 总数 - 已执行（已执行包含已冲抵，避免重复计算）
    stats.unexecuted = data.total - data.executed || 0

    sourceTypeStats.value = data.bySourceType || []

    // 处理学生列表数据
    classStudents.value = (data.byStudent || []).slice(0, 20).map(s => ({
      student: s.student,
      class: s.class,
      count: s.count,
      executed: s.executed,
      unexecuted: s.unexecuted,
      offset: s.offset,
      details: s.details || []
    }))

    // 过滤出有未执行FAD的学生，并提取未执行记录
    unexecutedStudents.value = classStudents.value
      .filter(s => s.unexecuted > 0)
      .map(s => ({
        ...s,
        unexecutedCount: s.unexecuted,
        unexecutedRecords: (s.details || []).filter(d => !d.是否已执行或冲抵)
      }))

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
</script>

<style scoped>
.fad-stats {
  padding: 20px;
}

.class-info-alert {
  margin-bottom: 20px;
}

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

.stat-value.warning {
  color: #e6a23c;
}
.stat-value.offset {
  color: #909399;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
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
  .fad-stats {
    padding: 10px;
  }
  .stat-value {
    font-size: 24px;
  }
}
</style>
