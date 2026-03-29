<template>
  <div class="access-gate">
    <div class="gate-card">
      <img src="/logo.png" alt="Logo" class="gate-logo" />
      <h2>{{ $t('access.title') }}</h2>
      <p class="gate-desc">{{ $t('access.description') }}</p>
      <el-input
        v-model="code"
        :placeholder="$t('access.placeholder')"
        type="password"
        show-password
        size="large"
        :class="{ shake: shaking }"
        @keyup.enter="handleSubmit"
      />
      <el-button
        type="primary"
        size="large"
        :loading="loading"
        :disabled="!code.trim()"
        class="gate-btn"
        @click="handleSubmit"
      >
        {{ $t('access.submit') }}
      </el-button>
      <p v-if="error" class="gate-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { authenticate } from '../auth.js'

const { t } = useI18n()
const router = useRouter()

const code = ref('')
const loading = ref(false)
const error = ref('')
const shaking = ref(false)

async function handleSubmit() {
  if (!code.value.trim()) return
  loading.value = true
  error.value = ''

  try {
    const success = await authenticate(code.value.trim())
    if (success) {
      const redirect = router.currentRoute.value.query.redirect || '/'
      router.replace(redirect)
    } else {
      triggerShake()
      error.value = t('access.invalid')
    }
  } catch (err) {
    triggerShake()
    error.value = err.response?.data?.error || t('access.invalid')
  } finally {
    loading.value = false
  }
}

function triggerShake() {
  shaking.value = true
  setTimeout(() => { shaking.value = false }, 500)
}
</script>

<style scoped>
.access-gate {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f7fc 0%, #e8f4f8 100%);
  z-index: 1000;
}

.gate-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.gate-logo {
  height: 48px;
  margin-bottom: 20px;
}

.gate-card h2 {
  color: #303133;
  margin-bottom: 8px;
  font-size: 22px;
}

.gate-desc {
  color: #909399;
  font-size: 14px;
  margin-bottom: 24px;
}

.gate-btn {
  width: 100%;
  margin-top: 16px;
}

.gate-error {
  color: #f56c6c;
  font-size: 13px;
  margin-top: 12px;
}

.shake {
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

@media (max-width: 480px) {
  .gate-card {
    padding: 32px 24px;
  }
}
</style>
