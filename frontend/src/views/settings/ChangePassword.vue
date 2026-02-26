<template>
  <div class="change-password">
    <el-card style="max-width: 500px">
      <template #header>
        <span>{{ $t('changePassword.title') }}</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item :label="$t('changePassword.currentPassword')" prop="oldPassword">
          <el-input
            v-model="form.oldPassword"
            type="password"
            :placeholder="$t('changePassword.currentPasswordPlaceholder')"
            show-password
          />
        </el-form-item>

        <el-form-item :label="$t('changePassword.newPassword')" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            :placeholder="$t('changePassword.newPasswordPlaceholder')"
            show-password
          />
        </el-form-item>

        <el-form-item :label="$t('changePassword.confirmPassword')" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            :placeholder="$t('changePassword.confirmPasswordPlaceholder')"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            {{ $t('changePassword.confirmChange') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { changePassword } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error(t('changePassword.passwordMismatch')))
  } else {
    callback()
  }
}

const rules = computed(() => ({
  oldPassword: [
    { required: true, message: t('changePassword.currentPasswordRequired'), trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: t('changePassword.newPasswordRequired'), trigger: 'blur' },
    { min: 6, message: t('changePassword.newPasswordMinLength'), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: t('changePassword.confirmPasswordRequired'), trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}))

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    })

    ElMessage.success(t('changePassword.changeSuccess'))
    userStore.logout()
    router.push('/login')
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.change-password {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}
</style>
