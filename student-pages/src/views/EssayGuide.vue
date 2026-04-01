<template>
  <div class="essay-guide">
    <div class="guide-sidebar">
      <div class="kb-section">
        <div class="kb-title">{{ $t('essay.researchDocs') }}</div>
        <el-collapse v-model="activeResearchGroups" class="kb-collapse">
          <el-collapse-item name="general">
            <template #title>
              <div class="category-header">
                <span class="category-title">{{ $t('essay.generalResearch') }}</span>
                <el-badge :value="2" type="info" />
              </div>
            </template>
            <div class="kb-item" @click="$router.push('/knowledge/profiles')">
              <el-icon><User /></el-icon>
              <span>{{ $t('essay.admittedProfiles') }}</span>
            </div>
            <div class="kb-item" @click="$router.push('/knowledge/resonance')">
              <el-icon><Connection /></el-icon>
              <span>{{ $t('essay.essayResonance') }}</span>
            </div>
          </el-collapse-item>
          <el-collapse-item name="categories">
            <template #title>
              <div class="category-header">
                <span class="category-title">{{ $t('essay.categoryResearch') }}</span>
                <el-badge :value="categories.length" type="warning" />
              </div>
            </template>
            <div
              v-for="cat in categories"
              :key="cat.id"
              class="kb-item"
              @click="$router.push(`/knowledge/lesson/${cat.id}`)"
            >
              <el-tag :type="getCategoryColor(cat.id)" size="small" effect="plain" class="kb-cat-tag">{{ cat.title }}</el-tag>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
      <el-input
        v-model="searchQuery"
        :placeholder="$t('essay.searchLessons')"
        clearable
        prefix-icon="Search"
        size="default"
        class="lesson-search"
      />
      <el-collapse v-model="activeCategories" class="category-collapse">
        <el-collapse-item
          v-for="cat in filteredCategories"
          :key="cat.id"
          :name="cat.id"
        >
          <template #title>
            <div class="category-header">
              <span class="category-title">{{ cat.title }}</span>
              <el-badge :value="getCategoryLessonCount(cat.id)" :type="getCategoryColor(cat.id)" />
            </div>
          </template>
          <div
            v-for="lesson in getCategoryLessons(cat.id)"
            :key="lesson.id"
            class="lesson-item"
            :class="{ active: selectedLesson?.id === lesson.id }"
            @click="selectLesson(lesson)"
          >
            <div class="lesson-id">{{ lesson.id }}</div>
            <div class="lesson-title">{{ lesson.title }}</div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="guide-main">
      <template v-if="selectedLesson">
        <div class="lesson-detail">
          <div class="lesson-header">
            <el-tag :type="getCategoryColor(selectedLesson.category)" effect="dark" class="lesson-cat-tag">
              {{ getCategoryTitle(selectedLesson.category) }}
            </el-tag>
            <h1 class="lesson-main-title">{{ selectedLesson.title }}</h1>
          </div>

          <div class="lesson-section">
            <h3>{{ $t('essay.coreIdea') }}</h3>
            <p class="lesson-desc">{{ selectedLesson.description }}</p>
          </div>

          <div class="lesson-section">
            <h3>{{ $t('essay.detailedGuide') }}</h3>
            <p class="lesson-details">{{ selectedLesson.details }}</p>
          </div>

          <div v-if="selectedLesson.related_essay_tags?.length" class="lesson-section">
            <h3>{{ $t('essay.tags') }}</h3>
            <div class="tag-list">
              <el-tag
                v-for="tag in selectedLesson.related_essay_tags"
                :key="tag"
                size="small"
                effect="plain"
                class="lesson-tag"
              >{{ tag }}</el-tag>
            </div>
          </div>

          <div v-if="selectedLesson.related_essay_files?.length" class="lesson-section">
            <h3>{{ $t('essay.relatedEssays') }}</h3>
            <div class="related-essays">
              <div
                v-for="(essay, idx) in selectedLesson.related_essay_files"
                :key="idx"
                class="related-essay-card"
                @click="goToEssay(essay.file)"
              >
                <div class="re-title">{{ essay.title }}</div>
                <div class="re-meta">
                  <span v-if="essay.author">{{ essay.author }}</span>
                  <span v-if="essay.school" class="re-school">{{ essay.school }}</span>
                </div>
                <p class="re-why">{{ essay.why }}</p>
              </div>
            </div>
          </div>

          <div v-if="selectedLesson.sources?.length" class="lesson-section">
            <h3>{{ $t('essay.sources') }}</h3>
            <div class="source-list">
              <el-tag
                v-for="(src, idx) in selectedLesson.sources"
                :key="idx"
                size="small"
                type="info"
                effect="plain"
              >{{ src.file }}</el-tag>
            </div>
          </div>
        </div>
      </template>
      <el-empty v-else :description="$t('essay.selectLesson')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { User, Connection } from '@element-plus/icons-vue'
import { essayData } from '../data/essay_lessons.js'

const { t } = useI18n()
const router = useRouter()

const { lessons, categories } = essayData
const searchQuery = ref('')
const activeResearchGroups = ref(['general', 'categories'])
const activeCategories = ref([categories[0]?.id])
const selectedLesson = ref(lessons[0] || null)

const categoryColorMap = {
  core_principle: '',
  topic_selection: 'success',
  structure_technique: 'warning',
  writing_style: 'danger',
  content_depth: 'info',
  common_mistakes: 'danger',
  topic_specific: 'success',
  revision_polish: '',
  supplemental: 'warning',
  differentiation: 'info'
}

function getCategoryColor(catId) {
  return categoryColorMap[catId] || ''
}

function getCategoryTitle(catId) {
  return categories.find(c => c.id === catId)?.title || catId
}

function getCategoryLessons(catId) {
  const q = searchQuery.value.trim().toLowerCase()
  return lessons.filter(l => {
    if (l.category !== catId) return false
    if (!q) return true
    return l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      (l.related_essay_tags || []).some(tag => tag.toLowerCase().includes(q))
  })
}

function getCategoryLessonCount(catId) {
  return getCategoryLessons(catId).length
}

const filteredCategories = computed(() => {
  return categories.filter(cat => getCategoryLessonCount(cat.id) > 0)
})

function selectLesson(lesson) {
  selectedLesson.value = lesson
}

function goToEssay(file) {
  const parts = file.split('/')
  if (parts.length >= 2) {
    router.push({ name: 'EssayDetail', params: { source: parts[0], theme: parts[1].replace('.md', '') } })
  }
}
</script>

<style scoped>
.essay-guide {
  display: flex;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 120px);
}

.guide-sidebar {
  width: 320px;
  flex-shrink: 0;
}

.kb-section {
  margin-bottom: 16px;
}

.kb-title {
  font-size: 15px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
  padding-left: 4px;
}

.kb-collapse {
  border: none;
}

.kb-collapse :deep(.el-collapse-item__header) {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 0 12px;
  margin-bottom: 4px;
  border: none;
  height: 44px;
}

.kb-collapse :deep(.el-collapse-item__wrap) {
  border: none;
}

.kb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  transition: all 0.2s;
}

.kb-item:hover {
  background: #ecf5ff;
  color: #409eff;
}

.kb-cat-tag {
  cursor: pointer;
}

.lesson-search {
  margin-bottom: 12px;
}

.category-collapse {
  border: none;
}

.category-collapse :deep(.el-collapse-item__header) {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 0 12px;
  margin-bottom: 4px;
  border: none;
  height: 44px;
}

.category-collapse :deep(.el-collapse-item__wrap) {
  border: none;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.lesson-item:hover {
  background: #ecf5ff;
}

.lesson-item.active {
  background: #409eff;
  color: #fff;
}

.lesson-item.active .lesson-id {
  background: rgba(255,255,255,0.2);
  color: #fff;
}

.lesson-id {
  font-size: 11px;
  font-weight: 700;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.lesson-title {
  font-size: 13px;
  line-height: 1.4;
  color: #606266;
}

.lesson-item.active .lesson-title {
  color: #fff;
}

.guide-main {
  flex: 1;
  min-width: 0;
}

.lesson-detail {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.lesson-header {
  margin-bottom: 24px;
}

.lesson-cat-tag {
  margin-bottom: 10px;
}

.lesson-main-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  line-height: 1.4;
}

.lesson-section {
  margin-bottom: 24px;
}

.lesson-section h3 {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 2px solid #f0f0f0;
}

.lesson-desc {
  font-size: 15px;
  color: #606266;
  line-height: 1.8;
  background: #f5f7fa;
  padding: 14px 18px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.lesson-details {
  font-size: 14px;
  color: #606266;
  line-height: 2;
  text-align: justify;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lesson-tag {
  cursor: default;
}

.related-essays {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.related-essay-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #f0f0f0;
}

.related-essay-card:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.re-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.re-meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
  display: flex;
  gap: 8px;
}

.re-school {
  color: #409eff;
}

.re-why {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.source-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

@media (max-width: 900px) {
  .essay-guide {
    flex-direction: column;
  }
  .guide-sidebar {
    width: 100%;
  }
}
</style>
