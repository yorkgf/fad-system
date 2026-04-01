<template>
  <div class="essay-detail">
    <div class="detail-breadcrumb">
      <el-button text @click="$router.push('/essay-examples')">
        <el-icon><ArrowLeft /></el-icon>
        {{ $t('essay.backToExamples') }}
      </el-button>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-source">{{ sourceName }}</span>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-theme">{{ themeName }}</span>
    </div>

    <div v-if="loading" class="detail-loading">
      <el-skeleton :rows="12" animated />
    </div>

    <div v-else-if="error" class="detail-error">
      <el-empty :description="error" />
    </div>

    <div v-else class="detail-content markdown-body" v-html="renderedMarkdown"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from '@element-plus/icons-vue'
import { essaySources } from '../data/essay_examples.js'
import MarkdownIt from 'markdown-it'

const { t } = useI18n()
const route = useRoute()
const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

const loading = ref(false)
const error = ref('')
const markdownRaw = ref('')

const sourceName = computed(() => {
  const src = essaySources.find(s => s.id === route.params.source)
  return src?.name || route.params.source
})

const themeName = computed(() => {
  const src = essaySources.find(s => s.id === route.params.source)
  const theme = src?.themes.find(t => t.id === route.params.theme)
  return theme?.name || route.params.theme
})

const renderedMarkdown = computed(() => {
  if (!markdownRaw.value) return ''
  return md.render(markdownRaw.value)
})

async function loadEssay() {
  const { source, theme } = route.params
  if (!source || !theme) {
    error.value = t('essay.notFound')
    return
  }

  loading.value = true
  error.value = ''
  markdownRaw.value = ''

  try {
    const url = `/essays/${source}/${theme}.md`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    markdownRaw.value = await res.text()
  } catch (e) {
    error.value = t('essay.loadError')
  } finally {
    loading.value = false
  }
}

onMounted(loadEssay)
watch(() => route.params, loadEssay)
</script>

<style scoped>
.essay-detail {
  max-width: 900px;
  margin: 0 auto;
}

.detail-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #909399;
  flex-wrap: wrap;
}

.breadcrumb-sep {
  color: #dcdfe6;
  margin: 0 4px;
}

.breadcrumb-source {
  color: #606266;
}

.breadcrumb-theme {
  color: #409eff;
  font-weight: 500;
}

.detail-loading {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
}

.detail-error {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
}

.detail-content {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* Markdown rendering styles */
.markdown-body :deep(h1) {
  font-size: 22px;
  border-bottom: 2px solid #ebeef5;
  padding-bottom: 8px;
  margin: 24px 0 16px;
  color: #303133;
}

.markdown-body :deep(h2) {
  font-size: 18px;
  color: #409eff;
  margin: 20px 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.markdown-body :deep(h3) {
  font-size: 15px;
  color: #606266;
  margin: 16px 0 8px;
}

.markdown-body :deep(p) {
  line-height: 1.9;
  color: #606266;
  margin: 8px 0;
  font-size: 14px;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding: 10px 18px;
  margin: 14px 0;
  background: #f0f7ff;
  color: #606266;
  border-radius: 0 8px 8px 0;
}

.markdown-body :deep(blockquote p) {
  margin: 4px 0;
}

.markdown-body :deep(strong) {
  color: #303133;
}

.markdown-body :deep(em) {
  color: #909399;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 2px dashed #e4e7ed;
  margin: 28px 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
  color: #606266;
}

.markdown-body :deep(li) {
  margin: 4px 0;
  line-height: 1.7;
}

.markdown-body :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .detail-content {
    padding: 20px 16px;
  }
}
</style>
