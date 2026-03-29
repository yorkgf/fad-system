<template>
  <div v-if="school" class="university-detail">
    <div class="detail-header">
      <el-button text @click="$router.push('/universities')">
        <el-icon><ArrowLeft /></el-icon>
        {{ $t('universities.backToList') }}
      </el-button>
    </div>

    <div class="detail-hero">
      <img :src="`/logos/${school.logo}`" :alt="school.name" class="hero-logo" />
      <div class="hero-info">
        <h1>{{ school.name }}</h1>
        <p class="hero-name-zh">{{ school.nameZh }}</p>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat-label">{{ $t('universities.admissionRate') }}</span>
            <span class="hero-stat-value">{{ school.admissionRate }}</span>
          </div>
          <div v-if="school.satRange !== 'N/A'" class="hero-stat">
            <span class="hero-stat-label">SAT</span>
            <span class="hero-stat-value">{{ school.satRange }}</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-label">{{ $t('universities.intl') }}</span>
            <span class="hero-stat-value">{{ school.intlPercent }}</span>
          </div>
        </div>
        <div class="hero-tags">
          <el-tag v-for="val in school.keyValues" :key="val" effect="plain">{{ val }}</el-tag>
        </div>
      </div>
    </div>

    <div class="detail-content markdown-body" v-html="renderedMarkdown"></div>
  </div>

  <el-empty v-else :description="$t('universities.notFound')" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getSchoolById } from '../data/schools.js'
import MarkdownIt from 'markdown-it'

const { t } = useI18n()
const route = useRoute()
const md = new MarkdownIt()

const school = computed(() => getSchoolById(route.params.id))
const markdownRaw = ref('')

// Import all CDS markdown files
const cdsFiles = import.meta.glob('../data/university-info/*.md', { query: '?raw', import: 'default' })

onMounted(async () => {
  if (!school.value) return
  const filePath = `../data/university-info/${school.value.cdsFile}`
  const loader = cdsFiles[filePath]
  if (loader) {
    markdownRaw.value = await loader()
  }
})

const renderedMarkdown = computed(() => {
  if (!markdownRaw.value) return ''
  return md.render(markdownRaw.value)
})
</script>

<style scoped>
.university-detail {
  max-width: 900px;
  margin: 0 auto;
}

.detail-header {
  margin-bottom: 16px;
}

.detail-hero {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.hero-logo {
  width: 100px;
  height: 100px;
  object-fit: contain;
  flex-shrink: 0;
}

.hero-info h1 {
  font-size: 22px;
  color: #303133;
  margin-bottom: 2px;
}

.hero-name-zh {
  color: #909399;
  font-size: 14px;
  margin-bottom: 12px;
}

.hero-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-stat-label {
  font-size: 11px;
  color: #c0c4cc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hero-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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
}

.markdown-body :deep(h3) {
  font-size: 15px;
  color: #606266;
  margin: 16px 0 8px;
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

.markdown-body :deep(strong) {
  color: #303133;
}

.markdown-body :deep(p) {
  line-height: 1.7;
  color: #606266;
  margin: 8px 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
  color: #606266;
}

.markdown-body :deep(li) {
  margin: 4px 0;
  line-height: 1.6;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding: 8px 16px;
  margin: 12px 0;
  background: #f0f7ff;
  color: #606266;
}

.markdown-body :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #ebeef5;
  margin: 20px 0;
}

.markdown-body :deep(img) {
  max-width: 200px;
  height: auto;
}

@media (max-width: 768px) {
  .detail-hero {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px;
  }

  .hero-logo {
    width: 72px;
    height: 72px;
  }

  .hero-stats {
    justify-content: center;
  }

  .hero-tags {
    justify-content: center;
  }

  .detail-content {
    padding: 20px 16px;
  }

  .markdown-body :deep(table) {
    font-size: 12px;
  }

  .markdown-body :deep(th),
  .markdown-body :deep(td) {
    padding: 6px 8px;
  }
}
</style>
