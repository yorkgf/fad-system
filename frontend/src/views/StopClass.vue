<template>
  <div class="stop-class">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>停课名单</span>
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

      <el-alert
        title="规则说明：FAD累计达到3次且未冲销将触发停课"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="学生" label="学生" width="120" />
        <el-table-column prop="班级" label="班级" width="150" />
        <el-table-column prop="fadCount" label="FAD数量" width="100">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.fadCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="停课开始日期" label="停课开始" width="120">
          <template #default="{ row }">
            {{ formatDate(row.停课开始日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="停课结束日期" label="停课结束" width="120">
          <template #default="{ row }">
            {{ formatDate(row.停课结束日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="stopDays" label="停课天数" width="100">
          <template #default="{ row }">
            {{ row.stopDays }} 天
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="isInStop(row)" type="danger">停课中</el-tag>
            <el-tag v-else type="success">已结束</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="records.length === 0 && !loading" description="暂无停课学生" />
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
  } catch (error) {
    records.value = []
  } finally {
    loading.value = false
  }
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
</style>
