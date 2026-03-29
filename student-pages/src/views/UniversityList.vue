<template>
  <div class="university-list">
    <div class="search-bar">
      <el-input
        v-model="search"
        :placeholder="$t('universities.searchPlaceholder')"
        clearable
        prefix-icon="Search"
        size="large"
      />
    </div>

    <div v-for="tier in tiers" :key="tier.id" class="tier-section">
      <h2 class="tier-title">
        <span class="tier-badge" :class="'tier-' + tier.id">{{ tier.id }}</span>
        {{ $t(tier.labelKey) }}
        <span class="tier-count">{{ filteredByTier(tier.id).length }}</span>
      </h2>
      <div class="school-grid">
        <div
          v-for="school in filteredByTier(tier.id)"
          :key="school.id"
          class="school-card"
          @click="$router.push(`/university/${school.id}`)"
        >
          <div class="card-logo-wrap">
            <img :src="`/logos/${school.logo}`" :alt="school.name" class="card-logo" />
          </div>
          <div class="card-body">
            <h3 class="card-name">{{ school.name }}</h3>
            <p class="card-name-zh">{{ school.nameZh }}</p>
            <div class="card-stats">
              <span class="stat">
                <span class="stat-label">{{ $t('universities.admissionRate') }}</span>
                <span class="stat-value">{{ school.admissionRate }}</span>
              </span>
              <span v-if="school.satRange !== 'N/A'" class="stat">
                <span class="stat-label">SAT</span>
                <span class="stat-value">{{ school.satRange }}</span>
              </span>
              <span class="stat">
                <span class="stat-label">{{ $t('universities.intl') }}</span>
                <span class="stat-value">{{ school.intlPercent }}</span>
              </span>
            </div>
            <div class="card-tags">
              <el-tag
                v-for="val in school.keyValues.slice(0, 3)"
                :key="val"
                size="small"
                type="info"
                effect="plain"
              >{{ val }}</el-tag>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-if="filteredByTier(tier.id).length === 0" :description="$t('universities.noResults')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { schools, tiers } from '../data/schools.js'

const { t } = useI18n()
const search = ref('')

const filteredSchools = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return schools
  return schools.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.nameZh.includes(q) ||
    s.id.includes(q)
  )
})

function filteredByTier(tierId) {
  return filteredSchools.value.filter(s => s.tier === tierId)
}
</script>

<style scoped>
.university-list {
  max-width: 1200px;
  margin: 0 auto;
}

.search-bar {
  margin-bottom: 24px;
  max-width: 480px;
}

.tier-section {
  margin-bottom: 36px;
}

.tier-title {
  font-size: 20px;
  color: #303133;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tier-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.tier-1 { background: linear-gradient(135deg, #b8860b, #daa520); }
.tier-2 { background: linear-gradient(135deg, #5b9bd5, #3870a0); }
.tier-3 { background: linear-gradient(135deg, #67c23a, #529b2e); }

.tier-count {
  font-size: 14px;
  color: #909399;
  font-weight: 400;
}

.school-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.school-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
}

.school-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #5b9bd5;
}

.card-logo-wrap {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  padding: 12px;
}

.card-logo {
  max-height: 56px;
  max-width: 80%;
  object-fit: contain;
}

.card-body {
  padding: 12px 16px 16px;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.3;
  margin-bottom: 2px;
}

.card-name-zh {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.card-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.stat-label {
  font-size: 10px;
  color: #c0c4cc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-tags .el-tag {
  font-size: 11px;
}

@media (max-width: 1024px) {
  .school-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .school-grid { grid-template-columns: repeat(2, 1fr); }
  .tier-title { font-size: 18px; }
}

@media (max-width: 480px) {
  .school-grid { grid-template-columns: 1fr; }
  .card-logo-wrap { height: 64px; }
}
</style>
