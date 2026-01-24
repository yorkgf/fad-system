<template>
  <div class="room-clean">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>寝室清扫</span>
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
        title="规则说明：至少有3条未清扫的寝室批评记录才能执行清扫"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="学生" label="学生" width="120" />
        <el-table-column prop="班级" label="班级" width="150" />
        <el-table-column prop="uncleanedCount" label="未清扫次数" width="120">
          <template #default="{ row }">
            <el-tag :type="row.uncleanedCount >= 3 ? 'danger' : 'warning'">
              {{ row.uncleanedCount }} 次
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="latestDate" label="最近一次" width="120">
          <template #default="{ row }">
            {{ formatDate(row.latestDate) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :disabled="row.uncleanedCount < 3"
              @click="handleClean(row)"
            >
              确认清扫
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCommonStore } from '@/stores/common'
import { getCleanableWarnings, confirmClean } from '@/api/room'
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
    const res = await getCleanableWarnings({ semester: filters.semester })
    records.value = res.data || res
  } catch (error) {
    records.value = []
  } finally {
    loading.value = false
  }
}

async function handleClean(row) {
  try {
    await ElMessageBox.confirm(
      `确定 ${row.学生} 已完成清扫吗？\n将标记 ${row.uncleanedCount} 条寝室批评为已清扫`,
      '确认清扫',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    loading.value = true
    await confirmClean({
      student: row.学生,
      semester: filters.semester
    })

    ElMessage.success(`已确认 ${row.学生} 完成清扫`)
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
