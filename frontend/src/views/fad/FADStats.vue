<template>
  <div class="fad-stats">
    <el-row :gutter="20">
      <!-- 筛选条件 -->
      <el-col :span="24">
        <el-card class="filter-card">
          <el-form :inline="false">
            <el-row :gutter="16">
              <el-col :span="12">
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
              <el-col :span="8">
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
              <el-col :span="4">
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
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
      </el-col>

      <!-- 统计卡片 -->
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">FAD总数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value executed">{{ stats.executed }}</div>
          <div class="stat-label">已执行</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value delivered">{{ stats.delivered }}</div>
          <div class="stat-label">已发放</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value offset">{{ stats.offset }}</div>
          <div class="stat-label">已冲销</div>
        </el-card>
      </el-col>

      <!-- 按来源类型统计 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>按来源类型统计</span>
          </template>
          <el-table :data="sourceTypeStats" stripe>
            <el-table-column prop="type" label="来源类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getSourceTypeTag(row.type)">
                  {{ getSourceTypeLabel(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" />
            <el-table-column prop="executed" label="已执行" />
            <el-table-column prop="delivered" label="已发放" />
            <el-table-column prop="offset" label="已冲销" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 按班级统计 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>按班级FAD总量 Top 3</span>
          </template>
          <el-table :data="classStats" stripe>
            <el-table-column prop="class" label="班级" />
            <el-table-column prop="count" label="FAD数量" sortable />
            <el-table-column prop="executed" label="已执行" />
            <el-table-column prop="unexecuted" label="未执行">
              <template #default="{ row }">
                <el-tag v-if="row.unexecuted > 0" type="danger">
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
            <span>按班级人均FAD排名</span>
            <el-tag style="margin-left: 10px" type="info">FAD总数 / 班级人数</el-tag>
          </template>
          <el-table :data="perClassStats" stripe>
            <el-table-column label="排名" width="80" align="center">
              <template #default="{ $index }">
                <span :class="getRankClass($index + 1)">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="class" label="班级" width="120" />
            <el-table-column prop="fadCount" label="FAD总数" width="100" sortable />
            <el-table-column prop="studentCount" label="班级人数" width="100" />
            <el-table-column prop="avgFAD" label="人均FAD" width="120" sortable>
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
          <el-table :data="studentStats" stripe>
            <el-table-column prop="student" label="学生" width="120" />
            <el-table-column prop="class" label="班级" width="150" />
            <el-table-column prop="count" label="FAD总数" width="100" sortable />
            <el-table-column prop="executed" label="已执行" width="100" />
            <el-table-column prop="unexecuted" label="未执行" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.unexecuted > 0" type="danger">
                  {{ row.unexecuted }}
                </el-tag>
                <span v-else>0</span>
              </template>
            </el-table-column>
            <el-table-column prop="offset" label="已冲销" width="100" />
            <el-table-column label="来源分布" min-width="200">
              <template #default="{ row }">
                <el-tag v-if="row.dorm" type="warning" class="source-tag">
                  寝室: {{ row.dorm }}
                </el-tag>
                <el-tag v-if="row.teach" type="danger" class="source-tag">
                  教学: {{ row.teach }}
                </el-tag>
                <el-tag v-if="row.other" type="info" class="source-tag">
                  其他: {{ row.other }}
                </el-tag>
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
  const map = { dorm: '寝室类', teach: '教学类', other: '其他' }
  return map[type] || type || '未分类'
}

function getSourceTypeTag(type) {
  const map = { dorm: 'warning', teach: 'danger', other: 'info' }
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

.source-tag {
  margin-right: 6px;
}

.el-card {
  margin-bottom: 20px;
}

/* 排名样式 */
.rank-first {
  display: inline-block;
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8B4513;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
}

.rank-second {
  display: inline-block;
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #555;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
}

.rank-third {
  display: inline-block;
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  background: linear-gradient(135deg, #cd7f32, #dda15e);
  color: #fff;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
}
</style>
