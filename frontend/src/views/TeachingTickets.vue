<template>
  <div class="teaching-tickets">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>教学票兑奖</span>
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
        title="规则说明：累计6张Teaching Reward Ticket可兑换1个Reward"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="学生" label="学生" width="120" />
        <el-table-column prop="班级" label="班级" width="150" />
        <el-table-column prop="count" label="Reward票数量" width="130">
          <template #default="{ row }">
            <el-tag :type="row.count >= 6 ? 'success' : 'info'">
              {{ row.count }} 张
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rewardable" label="可兑换" width="120">
          <template #default="{ row }">
            {{ Math.floor(row.count / 6) }} 个Reward
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :disabled="row.count < 6"
              @click="handleExchange(row)"
            >
              兑换
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="records.length === 0 && !loading" description="暂无可兑换的教学票" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCommonStore } from '@/stores/common'
import { getTeachingRewardTickets, teachingTicketToReward } from '@/api/other'

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
    const res = await getTeachingRewardTickets({ semester: filters.semester })
    records.value = res.data || res
  } catch (error) {
    records.value = []
  } finally {
    loading.value = false
  }
}

async function handleExchange(row) {
  const rewardCount = Math.floor(row.count / 6)

  try {
    await ElMessageBox.confirm(
      `确定为 ${row.学生} 兑换 ${rewardCount} 个Reward吗？\n将消耗 ${rewardCount * 6} 张Teaching Reward Ticket`,
      '确认兑换',
      {
        confirmButtonText: '确定兑换',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    loading.value = true
    await teachingTicketToReward({
      student: row.学生,
      studentClass: row.班级,
      semester: filters.semester,
      count: rewardCount
    })

    ElMessage.success(`成功为 ${row.学生} 兑换 ${rewardCount} 个Reward`)
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('兑换失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
