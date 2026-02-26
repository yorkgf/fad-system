<template>
  <el-dropdown @command="handleCommand" trigger="click">
    <span class="lang-switch">
      <el-icon><Globe /></el-icon>
      <span class="lang-text">{{ currentLangLabel }}</span>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh-CN" :disabled="locale === 'zh-CN'">
          中文
        </el-dropdown-item>
        <el-dropdown-item command="en" :disabled="locale === 'en'">
          English
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Globe } from '@element-plus/icons-vue'
import { setLocale } from '@/i18n'

const { locale } = useI18n()

const currentLangLabel = computed(() => {
  return locale.value === 'zh-CN' ? '中文' : 'EN'
})

function handleCommand(lang) {
  setLocale(lang)
  // Reload to apply Element Plus locale change
  window.location.reload()
}
</script>

<style scoped>
.lang-switch {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.lang-switch:hover {
  color: var(--el-color-primary);
}

.lang-text {
  font-size: 13px;
}
</style>
