<template>
  <div class="essay-examples">
    <div class="examples-header">
      <h1>{{ $t('essay.essayExamples') }}</h1>
      <el-input
        v-model="searchQuery"
        :placeholder="$t('essay.searchEssays')"
        clearable
        prefix-icon="Search"
        style="max-width: 360px;"
      />
    </div>

    <div class="source-tags">
      <el-tag
        v-for="source in essaySources"
        :key="source.id"
        :type="sourceTagType[source.id]"
        :effect="activeSource === source.id ? 'dark' : 'plain'"
        size="large"
        class="source-tag"
        @click="activeSource = source.id"
      >
        {{ source.name }} ({{ getTotalEssays(source) }})
      </el-tag>
    </div>

    <div class="themes-grid">
      <div
        v-for="theme in filteredThemes"
        :key="theme.id"
        class="theme-card"
        @click="goToTheme(theme)"
      >
        <div class="theme-header">
          <h3 class="theme-name">{{ theme.name }}</h3>
          <el-tag size="small" type="info" effect="plain">{{ theme.essays?.length || theme.essayCount || 0 }}</el-tag>
        </div>
        <div v-if="theme.essays?.length" class="theme-essays">
          <div
            v-for="essay in theme.essays.slice(0, 4)"
            :key="essay.title"
            class="mini-essay"
          >
            <span class="mini-title">{{ essay.title }}</span>
            <span class="mini-author">{{ essay.author }}</span>
          </div>
          <div v-if="theme.essays.length > 4" class="more-hint">
            +{{ theme.essays.length - 4 }} {{ $t('essay.more') }}
          </div>
        </div>
        <div v-else-if="theme.student" class="theme-info">
          <span class="student-info">{{ theme.student }}</span>
        </div>
      </div>
    </div>
    <el-empty v-if="filteredThemes.length === 0" :description="$t('essay.noResults')" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { essaySources } from '../data/essay_examples.js'

const { t } = useI18n()
const router = useRouter()

const activeSource = ref('IvyLeague')
const searchQuery = ref('')

const sourceTagType = {
  IvyLeague: '',
  HarvardIndependent: 'danger',
  UC: 'warning',
  NiuXiaoNiuwen: 'success'
}

const currentSource = computed(() =>
  essaySources.find(s => s.id === activeSource.value)
)

const filteredThemes = computed(() => {
  const source = currentSource.value
  if (!source) return []
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return source.themes
  return source.themes.filter(theme => {
    const nameMatch = theme.name.toLowerCase().includes(q)
    const essayMatch = (theme.essays || []).some(e =>
      e.title?.toLowerCase().includes(q) ||
      e.author?.toLowerCase().includes(q) ||
      e.school?.toLowerCase().includes(q)
    )
    return nameMatch || essayMatch
  })
})

function getTotalEssays(source) {
  return source.themes.reduce((sum, t) => sum + (t.essays?.length || t.essayCount || 0), 0)
}

function goToTheme(theme) {
  router.push({
    name: 'EssayDetail',
    params: { source: activeSource.value, theme: theme.id }
  })
}
</script>

<style scoped>
.essay-examples {
  max-width: 1200px;
  margin: 0 auto;
}

.examples-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.examples-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.source-tag {
  cursor: pointer;
  font-size: 14px;
  padding: 8px 18px;
  border-radius: 8px;
  transition: all 0.2s;
}

.source-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.theme-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #f0f0f0;
  height: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.theme-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  border-color: #409eff;
}

.theme-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.theme-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.theme-essays {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  overflow: hidden;
}

.mini-essay {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  padding: 4px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.mini-essay:last-child {
  border-bottom: none;
}

.mini-title {
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.mini-author {
  color: #c0c4cc;
  font-size: 12px;
  flex-shrink: 0;
}

.more-hint {
  font-size: 12px;
  color: #409eff;
  margin-top: 4px;
}

.theme-info {
  font-size: 13px;
  color: #909399;
}

@media (max-width: 1024px) {
  .themes-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .themes-grid { grid-template-columns: 1fr; }
  .examples-header { flex-direction: column; align-items: stretch; }
}
</style>
