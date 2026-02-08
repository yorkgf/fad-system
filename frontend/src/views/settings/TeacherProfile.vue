<template>
  <div class="teacher-profile">
    <!-- 腾讯会议信息卡片 -->
    <el-card class="info-card">
      <template #header>
        <div class="section-header">
          <el-icon class="section-icon"><VideoCamera /></el-icon>
          <span>腾讯会议信息</span>
          <el-button
            v-if="!editingMeeting"
            type="primary"
            link
            size="small"
            @click="startEditMeeting"
          >
            修改
          </el-button>
        </div>
      </template>

      <div v-if="!editingMeeting" class="info-display">
        <div class="info-row">
          <span class="info-label">会议号:</span>
          <span class="info-value">{{ teacherMeeting.meetingId || '未设置' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">会议密码:</span>
          <span class="info-value">{{ teacherMeeting.meetingPassword || '未设置' }}</span>
        </div>
      </div>

      <div v-else class="info-edit">
        <el-form label-position="top" class="mobile-form">
          <el-form-item label="会议号">
            <el-input v-model="meetingForm.meetingId" placeholder="请输入腾讯会议号" />
          </el-form-item>
          <el-form-item label="会议密码">
            <el-input v-model="meetingForm.meetingPassword" placeholder="请输入会议密码" />
          </el-form-item>
          <div class="form-actions">
            <el-button type="primary" @click="saveMeetingInfo">保存</el-button>
            <el-button @click="cancelEditMeeting">取消</el-button>
          </div>
        </el-form>
      </div>
    </el-card>

    <!-- 教师个人信息卡片 -->
    <el-card class="info-card">
      <template #header>
        <div class="section-header">
          <el-icon class="section-icon"><User /></el-icon>
          <span>教学信息</span>
          <el-button
            v-if="!editingProfile"
            type="primary"
            link
            size="small"
            @click="startEditProfile"
          >
            修改
          </el-button>
        </div>
      </template>

      <div v-if="!editingProfile" class="info-display">
        <div class="info-row">
          <span class="info-label">所教年级:</span>
          <span class="info-value">
            <el-tag v-for="grade in teacherProfile.grades" :key="grade" size="small" class="tag-item">
              {{ grade }}
            </el-tag>
            <span v-if="!teacherProfile.grades?.length" class="empty-text">未设置</span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">所教课程:</span>
          <span class="info-value">
            <el-tag v-for="subject in teacherProfile.subjects" :key="subject" size="small" type="success" class="tag-item">
              {{ subject }}
            </el-tag>
            <span v-if="!teacherProfile.subjects?.length" class="empty-text">未设置</span>
          </span>
        </div>
      </div>

      <div v-else class="info-edit">
        <el-form label-position="top" class="mobile-form">
          <el-form-item label="所教年级">
            <el-checkbox-group v-model="profileForm.grades" class="grade-checkbox-group">
              <el-checkbox label="Pre" />
              <el-checkbox label="G10" />
              <el-checkbox label="G11" />
              <el-checkbox label="G12" />
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="所教课程">
            <div class="subject-input-row">
              <el-input
                v-model="subjectInput"
                placeholder="输入课程名称，点击添加"
                class="subject-input"
                @keyup.enter="addSubject"
              />
              <el-button type="primary" @click="addSubject">添加</el-button>
            </div>
            <div class="subject-tags">
              <el-tag
                v-for="(subject, index) in profileForm.subjects"
                :key="index"
                closable
                type="success"
                @close="removeSubject(index)"
              >
                {{ subject }}
              </el-tag>
              <span v-if="!profileForm.subjects.length" class="empty-hint">暂无课程，请添加</span>
            </div>
          </el-form-item>
          <div class="form-actions">
            <el-button type="primary" @click="saveProfile">保存</el-button>
            <el-button @click="cancelEditProfile">取消</el-button>
          </div>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getMyGHSProfile,
  updateMeetingInfo,
  updateTeacherProfile
} from '@/api/schedule'
import { User, VideoCamera } from '@element-plus/icons-vue'

// 腾讯会议信息
const teacherMeeting = ref({
  meetingId: '',
  meetingPassword: ''
})
const editingMeeting = ref(false)
const meetingForm = ref({
  meetingId: '',
  meetingPassword: ''
})

// 教师个人信息
const teacherProfile = ref({
  grades: [],
  subjects: []
})
const editingProfile = ref(false)
const profileForm = ref({
  grades: [],
  subjects: []
})
const subjectInput = ref('')

async function loadTeacherInfo() {
  try {
    const res = await getMyGHSProfile()
    if (res.data?.ghsProfile) {
      teacherMeeting.value = {
        meetingId: res.data.ghsProfile.meetingId || '',
        meetingPassword: res.data.ghsProfile.meetingPassword || ''
      }
      teacherProfile.value = {
        grades: res.data.ghsProfile.grades || res.data.ghaProfile?.grades || [],
        subjects: res.data.ghsProfile.subjects || res.data.ghaProfile?.subjects || []
      }
    }
  } catch (error) {
    console.error('获取教师信息失败:', error)
    ElMessage.error('获取教师信息失败')
  }
}

// 腾讯会议信息编辑
function startEditMeeting() {
  meetingForm.value = {
    meetingId: teacherMeeting.value.meetingId,
    meetingPassword: teacherMeeting.value.meetingPassword
  }
  editingMeeting.value = true
}

function cancelEditMeeting() {
  editingMeeting.value = false
  meetingForm.value = {
    meetingId: teacherMeeting.value.meetingId,
    meetingPassword: teacherMeeting.value.meetingPassword
  }
}

async function saveMeetingInfo() {
  try {
    await updateMeetingInfo({
      meetingId: meetingForm.value.meetingId,
      meetingPassword: meetingForm.value.meetingPassword
    })
    teacherMeeting.value = {
      meetingId: meetingForm.value.meetingId,
      meetingPassword: meetingForm.value.meetingPassword
    }
    editingMeeting.value = false
    ElMessage.success('会议信息保存成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '保存失败')
  }
}

// 教师个人信息编辑
function startEditProfile() {
  profileForm.value = {
    grades: [...teacherProfile.value.grades],
    subjects: [...teacherProfile.value.subjects]
  }
  subjectInput.value = ''
  editingProfile.value = true
}

function cancelEditProfile() {
  editingProfile.value = false
  profileForm.value = {
    grades: [...teacherProfile.value.grades],
    subjects: [...teacherProfile.value.subjects]
  }
  subjectInput.value = ''
}

function addSubject() {
  const subject = subjectInput.value.trim()
  if (!subject) {
    ElMessage.warning('请输入课程名称')
    return
  }
  if (profileForm.value.subjects.includes(subject)) {
    ElMessage.warning('该课程已添加')
    return
  }
  profileForm.value.subjects.push(subject)
  subjectInput.value = ''
}

function removeSubject(index) {
  profileForm.value.subjects.splice(index, 1)
}

async function saveProfile() {
  try {
    await updateTeacherProfile({
      grades: profileForm.value.grades,
      subjects: profileForm.value.subjects
    })
    teacherProfile.value = {
      grades: [...profileForm.value.grades],
      subjects: [...profileForm.value.subjects]
    }
    editingProfile.value = false
    ElMessage.success('个人信息保存成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '保存失败')
  }
}

onMounted(() => {
  loadTeacherInfo()
})
</script>

<style scoped>
.teacher-profile {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.info-card {
  margin-bottom: 20px;
}

.info-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.section-icon {
  color: #409eff;
}

.info-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  font-size: 14px;
}

.info-label {
  color: #909399;
  min-width: 70px;
  flex-shrink: 0;
}

.info-value {
  color: #303133;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-weight: 500;
  font-family: monospace;
  font-size: 15px;
}

.tag-item {
  margin-right: 0;
}

.empty-text {
  color: #c0c4cc;
  font-style: italic;
}

.info-edit {
  padding: 8px 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed #dcdfe6;
}

.grade-checkbox-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.subject-input-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.subject-input {
  flex: 1;
}

.subject-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.empty-hint {
  color: #909399;
  font-size: 14px;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .teacher-profile {
    padding: 0;
  }

  .info-card {
    margin: 0 0 12px 0;
    border-radius: 0;
    box-shadow: none;
    border: none;
    border-bottom: 8px solid #f5f7fa;
  }

  .info-card :deep(.el-card__header) {
    padding: 16px;
  }

  .info-card :deep(.el-card__body) {
    padding: 16px;
  }

  .info-row {
    flex-direction: column;
    gap: 8px;
  }

  .info-value {
    width: 100%;
  }

  .grade-checkbox-group {
    gap: 12px;
  }

  .subject-input-row {
    flex-direction: column;
    gap: 8px;
  }

  .subject-input-row .el-button {
    width: 100%;
  }

  .form-actions {
    flex-direction: column;
    gap: 12px;
  }

  .form-actions .el-button {
    width: 100%;
    margin: 0;
  }
}
</style>
