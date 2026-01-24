<template>
  <div class="no-phone-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>今日未交手机名单</span>
          <el-button type="primary" @click="fetchData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-alert
        :title="`今日日期：${today}`"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="学生" label="学生" width="120" />
        <el-table-column prop="班级" label="班级" width="150" />
        <el-table-column prop="记录类型" label="迟交类型" width="200">
          <template #default="{ row }">
            <el-tag :type="row.记录类型.includes('22:00') ? 'danger' : 'warning'">
              {{ row.记录类型 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="记录老师" label="记录老师" width="120" />
        <el-table-column label="是否触发FAD" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.记录类型.includes('22:00')" type="danger">
              是
            </el-tag>
            <el-tag v-else type="info">
              否
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="records.length === 0 && !loading" description="今日暂无手机迟交记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTodayPhoneLate } from '@/api/other'
import dayjs from 'dayjs'

const loading = ref(false)
const records = ref([])

const today = computed(() => dayjs().format('YYYY-MM-DD'))

onMounted(() => {
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await getTodayPhoneLate()
    records.value = res.data || res
  } catch (error) {
    records.value = []
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
