<template>
  <div>
    <!-- Filter bar -->
    <div class="filter-bar">
      <el-select
        v-model="filterCategory"
        :placeholder="$t('competition.allCategories')"
        clearable
        style="width: 160px"
      >
        <el-option
          v-for="cat in categories"
          :key="cat.value"
          :label="$t(cat.labelKey)"
          :value="cat.value"
        />
      </el-select>
      <el-select
        v-model="sortBy"
        :placeholder="$t('competition.sortBy')"
        style="width: 180px"
      >
        <el-option :label="$t('competition.sortByEventDate')" value="event" />
        <el-option :label="$t('competition.sortByRegDate')" value="reg" />
      </el-select>
      <el-input
        v-model="searchKeyword"
        :placeholder="$t('common.search')"
        clearable
        style="width: 220px"
        @keyup.enter="loadEvents"
      />
      <el-button type="primary" @click="openCreateDialog">
        {{ $t('competition.createEvent') }}
      </el-button>
    </div>

    <!-- Table -->
    <el-table :data="filteredEvents" stripe v-loading="loading">
      <el-table-column prop="竞赛名称" :label="$t('competition.eventName')" min-width="160" />
      <el-table-column prop="竞赛类别" :label="$t('competition.category')" width="100">
        <template #default="{ row }">
          <el-tag :type="categoryTagMap[row.竞赛类别] || 'info'">
            {{ row.竞赛类别 }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('competition.eventPeriod')" min-width="180">
        <template #default="{ row }">
          {{ formatDate(row.竞赛开始日期) }} ~ {{ formatDate(row.竞赛结束日期) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('competition.registrationEnd')" width="120">
        <template #default="{ row }">
          {{ formatDate(row.报名截止日期) }}
        </template>
      </el-table-column>
      <el-table-column prop="参与对象" :label="$t('competition.participants')" width="100">
        <template #default="{ row }">
          {{ row.参与对象 || $t('competition.allParticipants') }}
        </template>
      </el-table-column>
      <el-table-column prop="创建人" :label="$t('competition.creator')" width="100" />
      <el-table-column :label="$t('common.operation')" width="150" fixed="right">
        <template #default="{ row }">
          <template v-if="canEdit(row)">
            <el-button type="primary" size="small" link @click="openEditDialog(row)">
              {{ $t('common.edit') }}
            </el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">
              {{ $t('common.delete') }}
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- Create / Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? $t('competition.editEvent') : $t('competition.createEvent')"
      width="560px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item :label="$t('competition.eventName')" prop="竞赛名称">
          <el-input v-model="form.竞赛名称" />
        </el-form-item>
        <el-form-item :label="$t('competition.category')" prop="竞赛类别">
          <el-select v-model="form.竞赛类别" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.value"
              :label="$t(cat.labelKey)"
              :value="cat.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('competition.eventPeriod')" prop="eventDateRange">
          <el-date-picker
            v-model="eventDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('competition.registrationPeriod')">
          <el-date-picker
            v-model="regDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('competition.participants')">
          <el-input v-model="form.参与对象" :placeholder="$t('competition.allParticipants')" />
        </el-form-item>
        <el-form-item :label="$t('competition.location')">
          <el-input v-model="form.地点" />
        </el-form-item>
        <el-form-item :label="$t('competition.registrationMethod')">
          <el-radio-group v-model="registrationMode" style="margin-bottom: 8px">
            <el-radio value="text">{{ $t('competition.registrationModeText') }}</el-radio>
            <el-radio value="link">{{ $t('competition.registrationModeLink') }}</el-radio>
            <el-radio value="image">{{ $t('competition.registrationModeImage') }}</el-radio>
          </el-radio-group>
          <el-input
            v-if="registrationMode === 'text'"
            v-model="form.报名方式或链接"
          />
          <el-input
            v-else-if="registrationMode === 'link'"
            v-model="form.报名方式或链接"
            placeholder="https://"
          />
          <div v-else>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="handleImageUpload"
            >
              <el-button type="primary" size="small">{{ $t('competition.registrationModeImage') }}</el-button>
            </el-upload>
            <img
              v-if="form.报名方式或链接 && form.报名方式或链接.startsWith('data:image')"
              :src="form.报名方式或链接"
              style="max-width: 200px; max-height: 200px; margin-top: 8px; border: 1px solid #ebeef5; border-radius: 4px;"
            />
          </div>
        </el-form-item>
        <el-form-item :label="$t('competition.examScope')">
          <el-input v-model="form.考试范围" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('competition.description')">
          <el-input v-model="form.描述" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getCompetitionEvents,
  createCompetitionEvent,
  updateCompetitionEvent,
  deleteCompetitionEvent
} from '@/api/competition'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const userStore = useUserStore()

// --- Constants ---
const categories = [
  { value: '数学', labelKey: 'competition.categoryMath' },
  { value: '理科', labelKey: 'competition.categoryScience' },
  { value: '文科', labelKey: 'competition.categoryLiberalArts' },
  { value: '体育', labelKey: 'competition.categorySports' },
  { value: '艺术', labelKey: 'competition.categoryArts' },
  { value: '科技', labelKey: 'competition.categoryTech' },
  { value: '其他', labelKey: 'competition.categoryOther' }
]

const categoryTagMap = {
  '数学': '',
  '理科': 'success',
  '文科': 'danger',
  '体育': 'success',
  '艺术': 'warning',
  '科技': 'warning',
  '其他': 'info'
}

// --- State ---
const loading = ref(false)
const events = ref([])
const filterCategory = ref('')
const searchKeyword = ref('')
const sortBy = ref('event')

const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formRef = ref(null)
const eventDateRange = ref(null)
const regDateRange = ref(null)
const registrationMode = ref('text')

const form = ref({
  竞赛名称: '',
  竞赛类别: '',
  参与对象: '',
  地点: '',
  报名方式或链接: '',
  考试范围: '',
  描述: ''
})

// --- Validation ---
const formRules = computed(() => ({
  竞赛名称: [
    { required: true, message: t('competition.eventName'), trigger: 'blur' }
  ],
  竞赛类别: [
    { required: true, message: t('competition.category'), trigger: 'change' }
  ],
  eventDateRange: [
    {
      required: true,
      validator: (_rule, _value, callback) => {
        if (!eventDateRange.value || eventDateRange.value.length < 2) {
          callback(new Error(t('competition.eventPeriod')))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}))

// --- Computed ---
const filteredEvents = computed(() => {
  let list = events.value
  if (filterCategory.value) {
    list = list.filter(e => e.竞赛类别 === filterCategory.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(e =>
      (e.竞赛名称 || '').toLowerCase().includes(kw) ||
      (e.参与对象 || '').toLowerCase().includes(kw)
    )
  }
  const field = sortBy.value === 'reg' ? '报名截止日期' : '竞赛开始日期'
  return [...list].sort((a, b) => (a[field] || '').localeCompare(b[field] || ''))
})

// --- Helpers ---
function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.slice(0, 10)
}

function canEdit(row) {
  return userStore.userGroup === 'S' || row.创建人 === userStore.username
}

// --- Data loading ---
async function loadEvents() {
  loading.value = true
  try {
    const res = await getCompetitionEvents()
    events.value = res.data || res || []
  } catch {
    ElMessage.error(t('common.failed'))
  } finally {
    loading.value = false
  }
}

// --- Dialog ---
function resetForm() {
  form.value = {
    竞赛名称: '',
    竞赛类别: '',
    参与对象: '',
    地点: '',
    报名方式或链接: '',
    考试范围: '',
    描述: ''
  }
  eventDateRange.value = null
  regDateRange.value = null
  registrationMode.value = 'text'
  editingId.value = null
  isEdit.value = false
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editingId.value = row._id
  form.value = {
    竞赛名称: row.竞赛名称 || '',
    竞赛类别: row.竞赛类别 || '',
    参与对象: row.参与对象 || '',
    地点: row.地点 || '',
    报名方式或链接: row.报名方式或链接 || '',
    考试范围: row.考试范围 || '',
    描述: row.描述 || ''
  }
  // Auto-detect registration mode from existing data
  const regValue = row.报名方式或链接 || ''
  if (regValue.startsWith('data:image')) {
    registrationMode.value = 'image'
  } else if (regValue.startsWith('http')) {
    registrationMode.value = 'link'
  } else {
    registrationMode.value = 'text'
  }
  eventDateRange.value = (row.竞赛开始日期 && row.竞赛结束日期)
    ? [row.竞赛开始日期, row.竞赛结束日期]
    : null
  regDateRange.value = (row.报名开始日期 && row.报名截止日期)
    ? [row.报名开始日期, row.报名截止日期]
    : null
  dialogVisible.value = true
}

function handleImageUpload(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.报名方式或链接 = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const payload = {
    ...form.value,
    竞赛开始日期: eventDateRange.value[0],
    竞赛结束日期: eventDateRange.value[1]
  }
  if (regDateRange.value && regDateRange.value.length === 2) {
    payload.报名开始日期 = regDateRange.value[0]
    payload.报名截止日期 = regDateRange.value[1]
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await updateCompetitionEvent(editingId.value, payload)
      ElMessage.success(t('competition.updateSuccess'))
    } else {
      await createCompetitionEvent(payload)
      ElMessage.success(t('competition.createSuccess'))
    }
    dialogVisible.value = false
    loadEvents()
  } catch {
    ElMessage.error(t('common.failed'))
  } finally {
    submitting.value = false
  }
}

// --- Delete ---
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      t('competition.deleteConfirm', { name: row.竞赛名称 }),
      t('competition.deleteEvent'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )
    await deleteCompetitionEvent(row._id)
    ElMessage.success(t('competition.deleteSuccess'))
    loadEvents()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(t('common.failed'))
    }
  }
}

// --- Init ---
onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
</style>
