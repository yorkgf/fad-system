<template>
  <div class="fad-stats">
    <el-row :gutter="20">
      <!-- 筛选条件 -->
      <el-col :span="24">
        <el-card class="filter-card">
          <el-form :inline="true">
            <el-form-item label="学期">
              <el-select
                v-model="filters.semester"
                placeholder="选择学期"
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
            <el-form-item label="班级">
              <el-select
                v-model="filters.studentClass"
                placeholder="全部班级"
                clearable
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
            <span>按班级统计 Top 10</span>
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

      <!-- 按学生统计（FAD较多的学生） -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>FAD较多的学生 Top 20</span>
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
  semester: '',
  studentClass: ''
})

const stats = reactive({
  total: 0,
  executed: 0,
  delivered: 0,
  offset: 0
})

const sourceTypeStats = ref([])
const classStats = ref([])
const studentStats = ref([])

onMounted(async () => {
  commonStore.generateSemesters()
  filters.semester = commonStore.getCurrentSemester()
  await commonStore.fetchClasses()
  fetchStats()
})

async function fetchStats() {
  loading.value = true
  try {
    const res = await getFADStats({
      semester: filters.semester,
      studentClass: filters.studentClass || undefined
    })

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
</style>
