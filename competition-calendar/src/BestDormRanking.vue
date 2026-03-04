<template>
  <div class="best-dorm-ranking">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">{{ $t('bestDorm.title') }}</span>
          <el-select
            v-model="selectedSemesters"
            :placeholder="$t('bestDorm.selectSemester')"
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
        :title="$t('bestDorm.ruleInfo')"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <div v-loading="loading">
        <el-empty v-if="!loading && bestDorms.length === 0" :description="$t('bestDorm.noData')" />

        <div v-else>
          <div
            v-for="floorData in bestDorms"
            :key="floorData.floor"
            class="floor-section"
          >
            <div class="floor-title">
              <el-icon><OfficeBuilding /></el-icon>
              <span>{{ $t('bestDorm.floor', { floor: floorData.floor }) }}</span>
            </div>

            <el-card class="floor-card" shadow="hover">
              <el-table :data="floorData.dorms" stripe>
                <el-table-column :label="$t('bestDorm.rank')" width="80" align="center">
                  <template #default="{ $index }">
                    <span :class="getRankClass($index + 1)">{{ $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="dormNumber" :label="$t('bestDorm.dormNumber')" width="120">
                  <template #default="{ row }">
                    <el-tag type="primary">{{ row.dormNumber }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="praiseCount" :label="$t('bestDorm.praiseCount')" width="120">
                  <template #default="{ row }">
                    <el-tag type="success">{{ row.praiseCount }} {{ $t('bestDorm.times') }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="studentCount" :label="$t('bestDorm.studentCount')" width="100" />
                <el-table-column prop="avgPraise" :label="$t('bestDorm.avgPraise')" sortable>
                  <template #default="{ row }">
                    <el-tag
                      :type="getAvgPraiseTagType(row.avgPraise)"
                      size="large"
                    >
                      {{ row.avgPraise }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { OfficeBuilding } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const { t } = useI18n()

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const loading = ref(false)
const bestDorms = ref([])

const semesters = [
  { value: '春季(Spring)', labelKey: 'bestDorm.spring' },
  { value: '秋季(Fall)', labelKey: 'bestDorm.fall' }
]

// Auto-detect current semester
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
    const res = await axios.get(`${API_BASE}/room-praise/public-best-dorm`, { params })
    bestDorms.value = res.data?.data || []
  } catch {
    bestDorms.value = []
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

function getAvgPraiseTagType(avg) {
  if (avg >= 5) return 'danger'
  if (avg >= 3) return 'warning'
  if (avg >= 1) return 'primary'
  return 'success'
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

.floor-section {
  margin-bottom: 30px;
}

.floor-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.floor-card {
  border: 2px solid #e4e7ed;
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
