<template>
  <div class="knowledge-viewer">
    <div class="kv-breadcrumb">
      <el-button text @click="$router.push('/essay-guide')">
        <el-icon><ArrowLeft /></el-icon>
        {{ $t('essay.backToGuide') }}
      </el-button>
    </div>

    <div v-if="loading" class="kv-loading">
      <el-skeleton :rows="16" animated />
    </div>

    <div v-else-if="error" class="kv-error">
      <el-empty :description="error" />
    </div>

    <div v-else class="kv-content markdown-body" v-html="renderedMarkdown"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'

const { t } = useI18n()
const route = useRoute()
const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

const loading = ref(false)
const error = ref('')
const markdownRaw = ref('')

const docFileMap = {
  profiles: 'Admitted_Student_Profiles.md',
  resonance: 'School_Values_and_Essay_Resonance.md',
  lesson: null // dynamic: lessons/{category}.md
}

const renderedMarkdown = computed(() => {
  if (!markdownRaw.value) return ''
  return md.render(markdownRaw.value)
})

async function loadDocument() {
  const doc = route.params.doc
  const category = route.params.category

  let filePath
  if (doc === 'lesson' && category) {
    filePath = `/knowledge-graph/lessons/${category}.md`
  } else if (docFileMap[doc]) {
    filePath = `/knowledge-graph/${docFileMap[doc]}`
  } else if (doc === 'profiles' || doc === 'resonance') {
    filePath = `/knowledge-graph/${docFileMap[doc]}`
  } else {
    error.value = t('essay.notFound')
    return
  }

  loading.value = true
  error.value = ''
  markdownRaw.value = ''

  try {
    const res = await fetch(filePath)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    markdownRaw.value = await res.text()
  } catch {
    error.value = t('essay.loadError')
  } finally {
    loading.value = false
  }
}

onMounted(loadDocument)
watch(() => route.params, loadDocument)
</script>

<style scoped>
.knowledge-viewer {
  max-width: 900px;
  margin: 0 auto;
}

.kv-breadcrumb {
  margin-bottom: 16px;
}

.kv-loading {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
}

.kv-error {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
}

.kv-content {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* Markdown styles */
.markdown-body :deep(h1) {
  font-size: 22px;
  border-bottom: 2px solid #ebeef5;
  padding-bottom: 8px;
  margin: 28px 0 16px;
  color: #303133;
}

.markdown-body :deep(h2) {
  font-size: 18px;
  color: #409eff;
  margin: 24px 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.markdown-body :deep(h3) {
  font-size: 15px;
  color: #606266;
  margin: 16px 0 8px;
}

.markdown-body :deep(h4) {
  font-size: 14px;
  color: #909399;
  margin: 14px 0 6px;
}

.markdown-body :deep(p) {
  line-height: 1.9;
  color: #606266;
  margin: 8px 0;
  font-size: 14px;
  text-align: justify;
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

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 13px;
}

.markdown-body :deep(th) {
  background: #f5f7fa;
  padding: 10px 12px;
  text-align: left;
  border: 1px solid #ebeef5;
  font-weight: 600;
  color: #303133;
}

.markdown-body :deep(td) {
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  color: #606266;
}

.markdown-body :deep(tr:hover td) {
  background: #f5f7fa;
}

@media (max-width: 768px) {
  .kv-content {
    padding: 20px 16px;
  }
}
</style>
