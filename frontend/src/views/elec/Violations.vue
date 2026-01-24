<template>
  <div class="elec-violations">
    <el-card>
      <template #header>
        <span>电子产品违规 - 被取消上课资格学生</span>
      </template>

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="学生" label="学生" width="120" />
        <el-table-column prop="班级" label="班级" width="150" />
        <el-table-column prop="记录日期" label="违规日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.记录日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="取消上课资格至" label="取消资格至" width="150">
          <template #default="{ row }">
            <el-tag :type="isExpired(row.取消上课资格至) ? 'info' : 'danger'">
              {{ row.取消上课资格至 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="记录事由" label="违规事由" min-width="200" show-overflow-tooltip />
        <el-table-column prop="记录老师" label="记录老师" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="isExpired(row.取消上课资格至)" type="success">
              已恢复
            </el-tag>
            <el-tag v-else type="danger">
              禁止上课
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCancelledStudents } from '@/api/other'
import dayjs from 'dayjs'

const loading = ref(false)
const records = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

onMounted(() => {
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await getCancelledStudents({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    records.value = res.data || res
    pagination.total = res.total || records.value.length
  } catch (error) {
    records.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function isExpired(cancelUntil) {
  if (cancelUntil === '学期结束') {
    // 简单判断：如果已过7月或1月，认为学期结束
    const now = new Date()
    const month = now.getMonth() + 1
    return month === 7 || month === 8 || month === 1 || month === 2
  }
  // 解析日期判断
  const expireDate = dayjs(cancelUntil)
  return expireDate.isValid() && expireDate.isBefore(dayjs())
}
</script>

<style scoped>
.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
