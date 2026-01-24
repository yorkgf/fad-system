<template>
  <div class="insert-record">
    <el-card>
      <template #header>
        <span>录入记录</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        @submit.prevent="handleSubmit"
      >
        <!-- 记录类型 -->
        <el-form-item label="记录类型" prop="recordType">
          <el-select
            v-model="form.recordType"
            placeholder="请选择记录类型"
            style="width: 100%"
            @change="handleRecordTypeChange"
          >
            <el-option
              v-for="item in availableRecordTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <!-- FAD来源类型（仅当选择FAD时显示） -->
        <el-form-item
          v-if="form.recordType === 'FAD'"
          label="FAD来源类型"
          prop="sourceType"
        >
          <el-radio-group v-model="form.sourceType">
            <el-radio
              v-for="item in commonStore.fadSourceTypes"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 学期 -->
        <el-form-item label="学期" prop="semester">
          <el-select
            v-model="form.semester"
            placeholder="请选择学期"
            style="width: 100%"
          >
            <el-option
              v-for="item in commonStore.semesters"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <!-- 班级 -->
        <el-form-item label="班级" prop="studentClass">
          <el-select
            v-model="form.studentClass"
            placeholder="请选择班级"
            style="width: 100%"
            filterable
            @change="handleClassChange"
          >
            <el-option
              v-for="item in commonStore.classes"
              :key="item.Class"
              :label="item.Class"
              :value="item.Class"
            />
          </el-select>
        </el-form-item>

        <!-- 学生选择（支持多选） -->
        <el-form-item label="学生" prop="students">
          <el-select
            v-model="form.students"
            placeholder="请选择学生（可多选）"
            style="width: 100%"
            multiple
            filterable
            :loading="studentsLoading"
          >
            <el-option
              v-for="item in students"
              :key="item.学生姓名"
              :label="item.学生姓名"
              :value="item.学生姓名"
            />
          </el-select>
        </el-form-item>

        <!-- 记录日期 -->
        <el-form-item label="记录日期" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="请选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <!-- 记录事由（部分类型需要） -->
        <el-form-item
          v-if="needsDescription"
          label="记录事由"
          prop="description"
        >
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入记录事由"
          />
        </el-form-item>

        <!-- 是否优先冲抵执行（仅Reward） -->
        <el-form-item
          v-if="form.recordType === 'Reward'"
          label="优先冲抵执行"
        >
          <el-switch v-model="form.priorityOffset" />
          <span class="tip">开启后优先冲抵未执行的FAD</span>
        </el-form-item>

        <!-- 取消上课资格至（仅电子产品违规） -->
        <el-form-item
          v-if="form.recordType === '上网课违规使用电子产品'"
          label="取消资格至"
        >
          <el-radio-group v-model="form.cancelUntil">
            <el-radio value="一个月">一个月后</el-radio>
            <el-radio value="学期结束">学期结束</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            提交记录
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 提交结果 -->
    <el-card v-if="submitResult" class="result-card">
      <template #header>
        <span>提交结果</span>
      </template>
      <el-result
        :icon="submitResult.success ? 'success' : 'error'"
        :title="submitResult.success ? '提交成功' : '提交失败'"
      >
        <template #sub-title>
          <div v-if="submitResult.success">
            <p>成功为 {{ submitResult.count }} 名学生创建了 {{ form.recordType }} 记录</p>
            <p v-if="submitResult.accumulatedFAD">
              已触发 {{ submitResult.accumulatedFAD }} 条FAD累计
            </p>
          </div>
          <div v-else>
            <p>{{ submitResult.error }}</p>
          </div>
        </template>
        <template #extra>
          <el-button type="primary" @click="submitResult = null">
            继续录入
          </el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useCommonStore } from '@/stores/common'
import { getStudents } from '@/api/students'
import { insertRecord } from '@/api/records'
import dayjs from 'dayjs'

const userStore = useUserStore()
const commonStore = useCommonStore()

const formRef = ref()
const submitting = ref(false)
const studentsLoading = ref(false)
const students = ref([])
const submitResult = ref(null)

const form = reactive({
  recordType: '',
  sourceType: 'other',
  semester: '',
  studentClass: '',
  students: [],
  date: dayjs().format('YYYY-MM-DD'),
  description: '',
  priorityOffset: false,
  cancelUntil: '一个月'
})

// 需要填写事由的记录类型
const descriptionTypes = ['FAD', 'Reward', 'Teaching FAD Ticket', 'Teaching Reward Ticket', '上网课违规使用电子产品']
const needsDescription = computed(() => descriptionTypes.includes(form.recordType))

// 可用的记录类型（根据用户权限）
const availableRecordTypes = computed(() => {
  if (userStore.recordTypes.length > 0) {
    return userStore.recordTypes
  }
  // 默认根据用户组过滤
  return commonStore.allRecordTypes.filter(item => {
    if (userStore.isAdmin) return true
    return item.group !== 'S'
  })
})

const rules = {
  recordType: [{ required: true, message: '请选择记录类型', trigger: 'change' }],
  semester: [{ required: true, message: '请选择学期', trigger: 'change' }],
  studentClass: [{ required: true, message: '请选择班级', trigger: 'change' }],
  students: [{ required: true, message: '请选择学生', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  sourceType: [{ required: true, message: '请选择FAD来源类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入记录事由', trigger: 'blur' }]
}

onMounted(async () => {
  commonStore.generateSemesters()
  form.semester = commonStore.getCurrentSemester()
  await commonStore.fetchClasses()
})

function handleRecordTypeChange() {
  // 重置特定字段
  form.description = ''
  form.priorityOffset = false
  form.cancelUntil = '一个月'
  form.sourceType = 'other'
}

async function handleClassChange() {
  form.students = []
  if (!form.studentClass) {
    students.value = []
    return
  }

  studentsLoading.value = true
  try {
    const res = await getStudents({ class: form.studentClass })
    students.value = res.data || res
  } catch (error) {
    students.value = []
  } finally {
    studentsLoading.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // 检查事由是否必填
  if (needsDescription.value && !form.description) {
    ElMessage.warning('请输入记录事由')
    return
  }

  submitting.value = true
  try {
    const promises = form.students.map(student =>
      insertRecord({
        recordType: form.recordType,
        date: form.date,
        student: student,
        studentClass: form.studentClass,
        semester: form.semester,
        teacher: userStore.username,
        description: form.description || form.recordType,
        sourceType: form.recordType === 'FAD' ? form.sourceType : undefined,
        priorityOffset: form.recordType === 'Reward' ? form.priorityOffset : undefined,
        cancelUntil: form.recordType === '上网课违规使用电子产品' ? form.cancelUntil : undefined
      })
    )

    const results = await Promise.allSettled(promises)
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failedCount = results.filter(r => r.status === 'rejected').length
    const accumulatedFAD = results
      .filter(r => r.status === 'fulfilled' && r.value?.accumulatedFAD)
      .reduce((sum, r) => sum + (r.value.accumulatedFAD || 0), 0)

    if (failedCount === 0) {
      submitResult.value = {
        success: true,
        count: successCount,
        accumulatedFAD
      }
      // 重置学生选择
      form.students = []
    } else {
      submitResult.value = {
        success: false,
        error: `${successCount} 条成功，${failedCount} 条失败`
      }
    }
  } catch (error) {
    submitResult.value = {
      success: false,
      error: '提交失败，请重试'
    }
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  formRef.value.resetFields()
  form.students = []
  students.value = []
  submitResult.value = null
}
</script>

<style scoped>
.insert-record {
  max-width: 800px;
}

.result-card {
  margin-top: 20px;
}

.tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>
