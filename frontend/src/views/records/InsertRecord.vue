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

        <!-- 寝室选择（仅寝室相关记录类型显示） -->
        <el-form-item
          v-if="isDormRelatedRecord"
          label="寝室"
          prop="dorm"
        >
          <el-select
            v-model="form.dorm"
            placeholder="请选择寝室"
            style="width: 100%"
            filterable
            clearable
            @change="handleDormChange"
          >
            <el-option
              v-for="item in dorms"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <!-- 学生选择 -->
        <el-form-item :label="isDormRelatedRecord && form.dorm ? '寝室学生' : '学生'" prop="students">
          <el-select
            v-model="form.selectedStudents"
            :placeholder="isDormRelatedRecord && form.dorm ? '该寝室的学生' : '请输入学生姓名搜索（可多选）'"
            style="width: 100%"
            multiple
            filterable
            :remote="!isDormRelatedRecord || !form.dorm"
            reserve-keyword
            :remote-method="!isDormRelatedRecord || !form.dorm ? searchStudents : undefined"
            :loading="studentsLoading"
            @change="handleStudentsChange"
          >
            <el-option
              v-for="item in students"
              :key="item.学生姓名"
              :label="`${item.学生姓名} (${item.班级})`"
              :value="item.学生姓名"
            />
          </el-select>
        </el-form-item>

        <!-- 已选学生列表（显示班级信息） -->
        <el-form-item v-if="form.selectedStudents.length > 0" label="已选学生">
          <el-tag
            v-for="studentName in form.selectedStudents"
            :key="studentName"
            closable
            @close="removeStudent(studentName)"
            style="margin-right: 8px; margin-bottom: 8px"
          >
            {{ studentName }} ({{ getStudentClass(studentName) }})
          </el-tag>
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

        <!-- 票据数量（Reward/Teaching Reward Ticket/Teaching FAD Ticket） -->
        <el-form-item
          v-if="isTicketRecord"
          label="数量"
        >
          <el-select
            v-model="form.ticketCount"
            placeholder="请选择数量"
            style="width: 200px"
          >
            <el-option
              v-for="n in 6"
              :key="n"
              :label="`${n}张`"
              :value="n"
            />
          </el-select>
          <span class="tip">一次录入多张相同记录</span>
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
            <el-alert
              v-if="submitResult.warningMessage"
              type="warning"
              :closable="false"
              style="margin-top: 16px"
            >
              {{ submitResult.warningMessage }}
            </el-alert>
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
const dorms = ref([]) // 寝室列表
const studentClassMap = ref({}) // 学生姓名 -> 班级 的映射
const submitResult = ref(null)

const form = reactive({
  recordType: '',
  sourceType: 'other',
  semester: '',
  dorm: '', // 寝室
  ticketCount: 1, // 票据数量（Reward/Teaching Reward Ticket/Teaching FAD Ticket）
  selectedStudents: [], // 选中的学生姓名列表
  date: dayjs().format('YYYY-MM-DD'),
  description: '',
  priorityOffset: false,
  cancelUntil: '一个月'
})

// 寝室相关的记录类型
const dormRelatedTypes = ['寝室迟出', '寝室批评', '寝室表扬', '寝室垃圾未倒']

// 是否是寝室相关记录
const isDormRelatedRecord = computed(() => {
  return dormRelatedTypes.includes(form.recordType)
})

// 是否是票据类记录（需要数量选择）
const ticketRelatedTypes = ['Reward', 'Teaching Reward Ticket', 'Teaching FAD Ticket']
const isTicketRecord = computed(() => {
  return ticketRelatedTypes.includes(form.recordType)
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
  selectedStudents: [{ required: true, message: '请选择学生', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  sourceType: [{ required: true, message: '请选择FAD来源类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入记录事由', trigger: 'blur' }]
}

onMounted(async () => {
  commonStore.generateSemesters()
  form.semester = commonStore.getCurrentSemester()
  // 初始化时加载所有寝室列表
  await fetchDormList()
})

// 获取寝室列表
async function fetchDormList() {
  try {
    // 不传任何参数，获取所有学生
    const res = await getStudents({})
    const allStudents = res.data || res
    console.log('获取到学生数量:', allStudents.length)
    // 提取所有寝室并去重（寝室是数字类型）
    const dormSet = new Set()
    allStudents.forEach(student => {
      if (student.寝室) {
        dormSet.add(student.寝室)
      }
    })
    // 转换为数组并按数字排序
    dorms.value = Array.from(dormSet)
      .map(d => Number(d))
      .sort((a, b) => a - b)
      .map(d => String(d))
    console.log('获取到寝室列表:', dorms.value)
  } catch (error) {
    console.error('获取寝室列表失败:', error)
  }
}

function handleRecordTypeChange() {
  // 重置特定字段
  form.description = ''
  form.priorityOffset = false
  form.cancelUntil = '一个月'
  form.sourceType = 'other'
  form.ticketCount = 1 // 重置票据数量
  // 如果不是寝室相关记录，清空寝室选择
  if (!isDormRelatedRecord.value) {
    form.dorm = ''
  }
  // 重置学生选择
  form.selectedStudents = []
  students.value = []
  studentClassMap.value = {}
}

// 处理寝室选择变化
async function handleDormChange() {
  // 重置学生选择
  form.selectedStudents = []
  students.value = []
  studentClassMap.value = {}

  if (!form.dorm) return

  studentsLoading.value = true
  try {
    // 直接查询该寝室的学生
    console.log('查询寝室学生, 寝室:', form.dorm)
    const res = await getStudents({ dorm: form.dorm })
    console.log('寝室学生查询结果:', res)
    students.value = res.data || res
    console.log('设置后的学生列表:', students.value)
  } catch (error) {
    console.error('获取寝室学生失败:', error)
    students.value = []
  } finally {
    studentsLoading.value = false
  }
}

// 远程搜索学生（非寝室记录或未选择寝室时）
async function searchStudents(query) {
  if (!query || query.trim().length === 0) {
    students.value = []
    return
  }

  studentsLoading.value = true
  try {
    const res = await getStudents({ search: query.trim() })
    students.value = res.data || res
  } catch (error) {
    students.value = []
  } finally {
    studentsLoading.value = false
  }
}

// 处理学生选择变化
function handleStudentsChange(selectedNames) {
  // 更新学生 -> 班级映射
  const newStudentClassMap = { ...studentClassMap.value }

  // 移除未选中的学生
  Object.keys(newStudentClassMap).forEach(name => {
    if (!selectedNames.includes(name)) {
      delete newStudentClassMap[name]
    }
  })

  // 添加新选中的学生
  selectedNames.forEach(name => {
    if (!newStudentClassMap[name]) {
      const student = students.value.find(s => s.学生姓名 === name)
      if (student) {
        newStudentClassMap[name] = student.班级
      }
    }
  })

  studentClassMap.value = newStudentClassMap
}

// 获取学生班级
function getStudentClass(studentName) {
  return studentClassMap.value[studentName] || '未知班级'
}

// 移除学生
function removeStudent(studentName) {
  const index = form.selectedStudents.indexOf(studentName)
  if (index > -1) {
    form.selectedStudents.splice(index, 1)
    handleStudentsChange(form.selectedStudents)
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
    // 构建记录提交列表
    const recordPromises = []

    // 根据记录类型和学生数量构建提交记录
    form.selectedStudents.forEach(studentName => {
      const recordCount = isTicketRecord.value ? form.ticketCount : 1

      // 为每个学生创建 recordCount 条记录
      for (let i = 0; i < recordCount; i++) {
        recordPromises.push(
          insertRecord({
            recordType: form.recordType,
            date: form.date,
            student: studentName,
            studentClass: getStudentClass(studentName),
            semester: form.semester,
            teacher: userStore.username,
            description: form.description || form.recordType,
            sourceType: form.recordType === 'FAD' ? form.sourceType : undefined,
            priorityOffset: form.recordType === 'Reward' ? form.priorityOffset : undefined,
            cancelUntil: form.recordType === '上网课违规使用电子产品' ? form.cancelUntil : undefined
          })
        )
      }
    })

    const results = await Promise.allSettled(recordPromises)
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failedCount = results.filter(r => r.status === 'rejected').length
    const accumulatedFAD = results
      .filter(r => r.status === 'fulfilled' && r.value?.accumulatedFAD)
      .reduce((sum, r) => sum + (r.value.accumulatedFAD || 0), 0)

    // 收集所有警告消息（去重）
    const warningMessages = new Set()
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value?.warningMessage) {
        warningMessages.add(r.value.warningMessage)
      }
    })

    if (failedCount === 0) {
      submitResult.value = {
        success: true,
        count: successCount,
        accumulatedFAD,
        warningMessage: Array.from(warningMessages).join('\n') || null
      }
      // 重置学生选择
      form.selectedStudents = []
      studentClassMap.value = {}
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
  form.dorm = ''
  form.ticketCount = 1
  form.selectedStudents = []
  students.value = []
  studentClassMap.value = {}
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
