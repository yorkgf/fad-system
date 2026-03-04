<template>
  <div class="best-class-ranking">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">{{ $t('bestClass.title') }}</span>
          <el-select
            v-model="selectedSemesters"
            :placeholder="$t('bestClass.selectSemester')"
            multiple
            style="width: 300px"
            @change="fetchData"
          >
            <el-option
              v-for="item in semesters"
              :key="item.value"
              :label="$t(item.labelKey)"
              :value="item.value"
            />
          </el-select>
        </div>
      </template>

      <el-alert
        :title="$t('bestClass.ruleInfo')"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <div v-loading="loading">
        <el-empty v-if="!loading && classData.length === 0" :description="$t('bestClass.noData')" />

        <el-table v-else :data="classData" stripe>
          <el-table-column :label="$t('bestClass.rank')" width="80" align="center">
            <template #default="{ $index }">
              <span :class="getRankClass($index + 1)">{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="class" :label="$t('bestClass.className')" width="160">
            <template #default="{ row }">
              <el-tag type="primary">{{ row.class }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fadCount" :label="$t('bestClass.fadCount')" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.fadCount === 0 ? 'success' : 'danger'">{{ row.fadCount }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="studentCount" :label="$t('bestClass.studentCount')" width="120" align="center" />
          <el-table-column prop="avgFAD" :label="$t('bestClass.avgFAD')" sortable>
            <template #default="{ row }">
              <el-tag
                :type="getAvgFADTagType(row.avgFAD)"
                size="large"
              >
                {{ row.avgFAD }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const { t } = useI18n()

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const loading = ref(false)
const classData = ref([])

const semesters = [
  { value: '春季(Spring)', labelKey: 'bestClass.spring' },
  { value: '秋季(Fall)', labelKey: 'bestClass.fall' }
]

function getCurrentSemester() {
  const month = new Date().getMonth() + 1
  return month >= 2 && month <= 7 ? '春季(Spring)' : '秋季(Fall)'
}

const selectedSemesters = ref([getCurrentSemester()])

onMounted(() => {
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const params = {}
    if (selectedSemesters.value.length > 0) {
      params.semesters = selectedSemesters.value
    }
    const res = await axios.get(`${API_BASE}/fad-records/public-best-class`, { params })
    classData.value = res.data?.data || []
  } catch {
    classData.value = []
    ElMessage.error(t('common.failed'))
  } finally {
    loading.value = false
  }
}

function getRankClass(rank) {
  if (rank === 1) return 'rank-first'
  if (rank === 2) return 'rank-second'
  if (rank === 3) return 'rank-third'
  return 'rank-other'
}

function getAvgFADTagType(avg) {
  if (avg === 0) return 'success'
  if (avg < 0.5) return 'primary'
  if (avg < 1) return 'warning'
  return 'danger'
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #3870a0;
}

/* Rank styles */
.rank-first {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8B4513;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}

.rank-second {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #555;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(192, 192, 192, 0.4);
}

.rank-third {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  background: linear-gradient(135deg, #cd7f32, #dda15e);
  color: #fff;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(205, 127, 50, 0.4);
}

.rank-other {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  background: #f5f7fa;
  color: #909399;
  border-radius: 6px;
  font-weight: bold;
  font-size: 14px;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
