<template>
  <div class="best-dorm-ranking">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>最佳寝室排名</span>
          <el-select
            v-model="filters.semesters"
            placeholder="选择学期（可多选）"
            multiple
            style="width: 300px"
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

      <el-alert
        title="计算方式：寝室表扬总数 ÷ 寝室人数（按楼层排名，每层Top 3）"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <div v-loading="loading">
        <el-empty v-if="!loading && bestDorms.length === 0" description="暂无数据" />

        <div v-else>
          <div
            v-for="floorData in bestDorms"
            :key="floorData.floor"
            class="floor-section"
          >
            <div class="floor-title">
              <el-icon><OfficeBuilding /></el-icon>
              <span>{{ floorData.floor }}楼</span>
            </div>

            <el-card class="floor-card" shadow="hover">
              <el-table :data="floorData.dorms" stripe>
                <el-table-column label="排名" width="80" align="center">
                  <template #default="{ $index }">
                    <span :class="getRankClass($index + 1)">{{ $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="dormNumber" label="寝室号" width="120">
                  <template #default="{ row }">
                    <el-tag type="primary">{{ row.dormNumber }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="praiseCount" label="表扬总数" width="120">
                  <template #default="{ row }">
                    <el-tag type="success">{{ row.praiseCount }} 次</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="studentCount" label="寝室人数" width="100" />
                <el-table-column prop="avgPraise" label="人均表扬" sortable>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { OfficeBuilding } from '@element-plus/icons-vue'
import { useCommonStore } from '@/stores/common'
import { getBestDorm } from '@/api/room'

const commonStore = useCommonStore()

const loading = ref(false)
const bestDorms = ref([])

const filters = reactive({
  semesters: []
})

onMounted(() => {
  commonStore.generateSemesters()
  filters.semesters = [commonStore.getCurrentSemester()]
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const params = {}
    if (filters.semesters.length > 0) {
      params.semesters = filters.semesters
    }

    const res = await getBestDorm(params)
    bestDorms.value = res.data || res
  } catch (error) {
    bestDorms.value = []
  } finally {
    loading.value = false
  }
}

// 获取排名样式类
function getRankClass(rank) {
  if (rank === 1) return 'rank-first'
  if (rank === 2) return 'rank-second'
  if (rank === 3) return 'rank-third'
  return 'rank-other'
}

// 根据人均表扬值获取标签类型
function getAvgPraiseTagType(avg) {
  if (avg >= 5) return 'danger' // 红色：人均5次及以上
  if (avg >= 3) return 'warning' // 橙色：人均3-5次
  if (avg >= 1) return 'primary' // 蓝色：人均1-3次
  return 'success' // 绿色：人均少于1次
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

/* 排名样式 */
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
</style>
