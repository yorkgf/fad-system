<template>
  <div class="elec-violations">
    <el-card>
      <template #header>
        <span>{{ $t('elec.title') }}</span>
      </template>

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="学生" :label="$t('elec.student')" width="120" />
        <el-table-column prop="班级" :label="$t('elec.class')" width="150" />
        <el-table-column prop="记录日期" :label="$t('elec.violationDate')" width="120">
          <template #default="{ row }">
            {{ formatDate(row.记录日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="取消上课资格至" :label="$t('elec.cancelUntil')" width="150">
          <template #default="{ row }">
            <el-tag :type="isExpired(row.取消上课资格至) ? 'info' : 'danger'">
              {{ row.取消上课资格至 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="记录事由" :label="$t('elec.violationReason')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="记录老师" :label="$t('elec.recordTeacher')" width="120" />
        <el-table-column :label="$t('elec.status')" width="100">
          <template #default="{ row }">
            <el-tag v-if="isExpired(row.取消上课资格至)" type="success">
              {{ $t('elec.restored') }}
            </el-tag>
            <el-tag v-else type="danger">
              {{ $t('elec.suspended') }}
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
import { useI18n } from 'vue-i18n'
import { getCancelledStudents } from '@/api/other'
import dayjs from 'dayjs'

const { t } = useI18n()

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
