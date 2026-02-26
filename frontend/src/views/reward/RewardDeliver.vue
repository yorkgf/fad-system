<template>
  <div class="reward-deliver">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t('reward.deliver.title') }}</span>
          <el-select
            v-model="filters.semester"
            :placeholder="$t('reward.deliver.selectSemester')"
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

      <el-table
        v-loading="loading"
        :data="records"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="学生" :label="$t('reward.deliver.student')" width="100" />
        <el-table-column prop="班级" :label="$t('reward.deliver.class')" width="120" />
        <el-table-column prop="记录日期" :label="$t('reward.deliver.recordDate')" width="120">
          <template #default="{ row }">
            {{ formatDate(row.记录日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="记录事由" :label="$t('reward.deliver.recordReason')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="记录老师" :label="$t('reward.deliver.recordTeacher')" width="120" />
        <el-table-column :label="$t('reward.deliver.offsetStatus')" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.是否已冲销记录" type="success">{{ $t('reward.deliver.offsetFad') }}</el-tag>
            <el-tag v-else type="info">{{ $t('reward.deliver.notOffset') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reward.deliver.operation')" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleDeliver([row])"
            >
              {{ $t('reward.deliver.confirmDeliver') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <div class="batch-actions">
          <el-button
            type="primary"
            :disabled="selectedRows.length === 0"
            @click="handleDeliver(selectedRows)"
          >
            {{ $t('reward.deliver.batchConfirmDeliver', { count: selectedRows.length }) }}
          </el-button>
        </div>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useCommonStore } from '@/stores/common'
import { getUndeliveredReward, deliverReward } from '@/api/reward'
import dayjs from 'dayjs'

const { t } = useI18n()
const userStore = useUserStore()
const commonStore = useCommonStore()

const loading = ref(false)
const records = ref([])
const selectedRows = ref([])

const filters = reactive({
  semester: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

onMounted(() => {
  commonStore.generateSemesters()
  filters.semester = commonStore.getCurrentSemester()
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await getUndeliveredReward({
      semester: filters.semester,
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

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

async function handleDeliver(rows) {
  const count = rows.length

  try {
    await ElMessageBox.confirm(
      t('reward.deliver.confirmDeliverMsg', { count }),
      t('reward.deliver.confirmDeliverTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'info'
      }
    )

    loading.value = true
    const promises = rows.map(row => deliverReward(row._id, userStore.username))
    await Promise.all(promises)

    ElMessage.success(t('reward.deliver.deliverSuccess', { count }))
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('reward.deliver.deliverFailed'))
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

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}
</style>
