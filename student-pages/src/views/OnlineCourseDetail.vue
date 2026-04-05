<template>
  <div v-if="program" class="course-detail">
    <div class="detail-header">
      <el-button text @click="$router.push('/online-courses')">
        <el-icon><ArrowLeft /></el-icon>
        {{ $t('onlineCourses.backToList') }}
      </el-button>
    </div>

    <div class="detail-hero">
      <img :src="`/logos/${program.logo}`" :alt="program.university" class="hero-logo" />
      <div class="hero-info">
        <h1>{{ program.university }}</h1>
        <p class="hero-name-zh">{{ program.universityZh }}</p>
        <p class="hero-program">{{ program.programNameZh }}</p>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat-label">US News</span>
            <span class="hero-stat-value">{{ program.rankingUSNews }}</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-label">{{ $t('onlineCourses.costRange') }}</span>
            <span class="hero-stat-value cost">{{ program.costRange }}</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-label">{{ $t('onlineCourses.deadline') }}</span>
            <el-tag :type="program.deadlineType === 'rolling' ? 'success' : 'warning'" size="small">
              {{ program.deadline }}
            </el-tag>
          </div>
        </div>
        <div class="hero-tags">
          <el-tag v-if="program.target.includes('highSchool')" type="primary" effect="light">
            {{ $t('onlineCourses.highSchool') }}
          </el-tag>
          <el-tag v-if="program.target.includes('undergraduate')" type="success" effect="light">
            {{ $t('onlineCourses.undergraduate') }}
          </el-tag>
          <el-tag v-for="h in program.highlights" :key="h" effect="plain" type="info">{{ h }}</el-tag>
        </div>
        <a :href="program.url" target="_blank" rel="noopener noreferrer" class="official-link">
          {{ $t('onlineCourses.officialSite') }} ↗
        </a>
      </div>
    </div>

    <div class="detail-content markdown-body" v-html="renderedMarkdown"></div>
  </div>

  <el-empty v-else :description="$t('onlineCourses.notFound')" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getProgramById } from '../data/online-courses.js'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const md = new MarkdownIt({ html: false })

const program = computed(() => getProgramById(route.params.id))
const markdownRaw = ref('')

const mdFiles = import.meta.glob('../data/online-courses/*.md', { query: '?raw', import: 'default' })

onMounted(async () => {
  if (!program.value) return
  const filePath = `../data/online-courses/${program.value.mdFile}`
  const loader = mdFiles[filePath]
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
.course-detail {
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
  margin-bottom: 2px;
}

.hero-program {
  color: #606266;
  font-size: 15px;
  font-weight: 500;
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

.hero-stat-value.cost {
  font-size: 15px;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.official-link {
  display: inline-block;
  color: #409eff;
  font-size: 14px;
  text-decoration: none;
  font-weight: 500;
}

.official-link:hover {
  text-decoration: underline;
}

.detail-content {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* Markdown rendering styles — same as UniversityDetail */
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
