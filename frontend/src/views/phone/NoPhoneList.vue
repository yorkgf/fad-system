<template>
  <div class="no-phone-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t('noPhone.title') }}</span>
          <el-button type="primary" @click="fetchData">
            <el-icon><Refresh /></el-icon>
            {{ $t('common.refresh') }}
          </el-button>
        </div>
      </template>

      <el-alert
        :title="$t('noPhone.todayDate', { date: today })"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="学生" :label="$t('noPhone.student')" width="120" />
        <el-table-column prop="班级" :label="$t('noPhone.class')" width="150" />
        <el-table-column prop="记录类型" :label="$t('noPhone.lateType')" width="200">
          <template #default="{ row }">
            <el-tag :type="row.记录类型.includes('22:00') ? 'danger' : 'warning'">
              {{ row.记录类型 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="记录老师" :label="$t('noPhone.recordTeacher')" width="120" />
        <el-table-column :label="$t('noPhone.triggerFad')" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.记录类型.includes('22:00')" type="danger">
              {{ $t('noPhone.yes') }}
            </el-tag>
            <el-tag v-else type="info">
              {{ $t('noPhone.no') }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="records.length === 0 && !loading" :description="$t('noPhone.noRecords')" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getTodayPhoneLate } from '@/api/other'
import dayjs from 'dayjs'

const { t } = useI18n()

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
