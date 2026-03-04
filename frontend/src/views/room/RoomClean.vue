<template>
  <div class="room-clean">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t('room.clean.title') }}</span>
          <el-select
            v-model="filters.semester"
            :placeholder="$t('room.clean.selectSemester')"
            style="width: 180px"
            @change="fetchData"
          >
            <el-option
              v-for="item in commonStore.semesters"
              :key="item.value"
              :label="$t(item.labelKey)"
              :value="item.value"
            />
          </el-select>
        </div>
      </template>

      <el-alert
        :title="$t('room.clean.ruleInfo')"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="学生" :label="$t('room.clean.student')" width="120" />
        <el-table-column prop="班级" :label="$t('room.clean.class')" width="150" />
        <el-table-column prop="uncleanedCount" :label="$t('room.clean.uncleanedCount')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.uncleanedCount >= 3 ? 'danger' : 'warning'">
              {{ row.uncleanedCount }} 次
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="latestDate" :label="$t('room.clean.latestDate')" width="120">
          <template #default="{ row }">
            {{ formatDate(row.latestDate) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('room.clean.operation')" width="120">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :disabled="row.uncleanedCount < 3"
              @click="handleClean(row)"
            >
              {{ $t('room.clean.confirmClean') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCommonStore } from '@/stores/common'
import { getCleanableWarnings, confirmClean } from '@/api/room'
import dayjs from 'dayjs'

const { t } = useI18n()
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
      t('room.clean.confirmCleanMsg', { student: row.学生, count: row.uncleanedCount }),
      t('room.clean.confirmCleanTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'info'
      }
    )

    loading.value = true
    await confirmClean({
      student: row.学生,
      semester: filters.semester
    })

    ElMessage.success(t('room.clean.cleanSuccess', { student: row.学生 }))
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('room.clean.cleanFailed'))
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
