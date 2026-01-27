<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-wrapper">
        <img src="/logo.png" alt="Logo" class="logo" />
      </div>
      <h1 class="title">FAD 学生管理系统</h1>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="邮箱地址" prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱地址"
            :prefix-icon="Message"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleSubmit"
          >
            登录
          </el-button>
        </el-form-item>

        <div class="forgot-password">
          <el-link type="primary" @click="handleResetPassword">
            忘记密码？
          </el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Message, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { resetPassword } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  email: '',
  password: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login(form.email, form.password)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

async function handleResetPassword() {
  if (!form.email) {
    ElMessage.warning('请先输入邮箱地址')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要重置密码吗？新密码将发送到 ${form.email}`,
      '重置密码',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    await resetPassword(form.email)
    ElMessage.success('新密码已发送至邮箱，请查收')
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器中处理
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f4f8 0%, #d0e8f2 50%, #b8dcf0 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.login-container::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(91, 155, 213, 0.15) 0%, transparent 70%);
  top: -200px;
  right: -150px;
  border-radius: 50%;
}

.login-container::after {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(56, 176, 222, 0.12) 0%, transparent 70%);
  bottom: -150px;
  left: -100px;
  border-radius: 50%;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(91, 155, 213, 0.2), 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
}

.logo-wrapper {
  text-align: center;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.logo {
  height: 100px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(91, 155, 213, 0.3));
  display: block;
  margin: 0 auto;
}

.title {
  text-align: center;
  margin-bottom: 32px;
  background: linear-gradient(135deg, #5b9bd5 0%, #38b0de 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
}

.forgot-password {
  text-align: center;
  margin-top: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #3870a0;
  font-size: 14px;
}

:deep(.el-input--large .el-input__wrapper) {
  padding: 8px 16px;
}

:deep(.el-input--large) {
  font-size: 15px;
}

/* 平板响应式 */
@media (max-width: 768px) {
  .login-card {
    padding: 36px 30px;
    border-radius: 20px;
  }

  .logo {
    height: 80px;
  }

  .title {
    font-size: 22px;
    margin-bottom: 24px;
  }
}

/* 手机响应式 */
@media (max-width: 480px) {
  .login-container {
    padding: 16px 12px;
  }

  .login-card {
    padding: 30px 24px;
    border-radius: 16px;
  }

  .logo {
    height: 70px;
  }

  .title {
    font-size: 20px;
    margin-bottom: 24px;
    letter-spacing: 0.5px;
  }

  .login-btn {
    height: 44px;
    font-size: 15px;
    letter-spacing: 1px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
  }

  :deep(.el-input--large) {
    font-size: 14px;
  }
}

/* 超小手机 */
@media (max-width: 360px) {
  .login-card {
    padding: 24px 20px;
  }

  .logo {
    height: 60px;
  }

  .title {
    font-size: 18px;
  }

  .login-btn {
    height: 40px;
    font-size: 14px;
  }
}
</style>
