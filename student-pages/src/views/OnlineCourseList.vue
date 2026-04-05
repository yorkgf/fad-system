<template>
  <div class="online-course-list">
    <!-- 快速对比表 -->
    <div class="comparison-section">
      <h2 class="section-title">{{ $t('onlineCourses.comparison') }}</h2>
      <div class="comparison-table-wrap">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>{{ $t('onlineCourses.school') }}</th>
              <th>US News</th>
              <th>{{ $t('onlineCourses.onlineCredit') }}</th>
              <th>{{ $t('onlineCourses.forHighSchool') }}</th>
              <th>{{ $t('onlineCourses.forUndergrad') }}</th>
              <th>{{ $t('onlineCourses.costRange') }}</th>
              <th>{{ $t('onlineCourses.deadline') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in programs"
              :key="p.id"
              class="comparison-row"
              @click="$router.push(`/online-course/${p.id}`)"
            >
              <td class="school-cell">
                <img :src="`/logos/${p.logo}`" :alt="p.university" class="mini-logo" />
                <span>{{ p.universityZh }}</span>
              </td>
              <td class="rank-cell">{{ p.rankingUSNews }}</td>
              <td><el-icon color="#67c23a"><Check /></el-icon></td>
              <td>
                <el-icon v-if="p.target.includes('highSchool')" color="#67c23a"><Check /></el-icon>
                <span v-else>—</span>
              </td>
              <td>
                <el-icon v-if="p.target.includes('undergraduate')" color="#67c23a"><Check /></el-icon>
                <span v-else>—</span>
              </td>
              <td>{{ p.costRange }}</td>
              <td>
                <el-tag :type="p.deadlineType === 'rolling' ? 'success' : 'warning'" size="small">
                  {{ p.deadline }}
                </el-tag>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 按分类展示卡片 -->
    <div v-for="cat in categories" :key="cat.id" class="category-section">
      <h2 class="section-title">
        <span class="cat-badge" :class="'cat-' + cat.id">{{ categoryIcon(cat.id) }}</span>
        {{ $t(cat.labelKey) }}
      </h2>
      <div class="program-grid">
        <div
          v-for="p in getProgramsByCategory(cat.id)"
          :key="p.id"
          class="program-card"
          @click="$router.push(`/online-course/${p.id}`)"
        >
          <div class="card-logo-wrap">
            <img :src="`/logos/${p.logo}`" :alt="p.university" class="card-logo" />
          </div>
          <div class="card-body">
            <div class="card-header">
              <h3 class="card-name">{{ p.university }}</h3>
              <el-tag size="small" effect="plain">{{ p.rankingUSNews }}</el-tag>
            </div>
            <p class="card-program-name">{{ p.programNameZh }}</p>
            <div class="card-highlights">
              <el-tag
                v-for="h in p.highlights"
                :key="h"
                size="small"
                type="info"
                effect="plain"
              >{{ h }}</el-tag>
            </div>
            <div class="card-meta">
              <span class="meta-item">
                <span class="meta-label">{{ $t('onlineCourses.costRange') }}</span>
                <span class="meta-value">{{ p.costRange }}</span>
              </span>
              <span class="meta-item">
                <span class="meta-label">{{ $t('onlineCourses.deadline') }}</span>
                <el-tag :type="p.deadlineType === 'rolling' ? 'success' : 'warning'" size="small">
                  {{ p.deadline }}
                </el-tag>
              </span>
            </div>
            <div class="card-targets">
              <el-tag v-if="p.target.includes('highSchool')" size="small" type="primary" effect="light">
                {{ $t('onlineCourses.highSchool') }}
              </el-tag>
              <el-tag v-if="p.target.includes('undergraduate')" size="small" type="success" effect="light">
                {{ $t('onlineCourses.undergraduate') }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 关键决策维度 -->
    <div class="decision-section">
      <h2 class="section-title">{{ $t('onlineCourses.decisionGuide') }}</h2>
      <div class="decision-grid">
        <div class="decision-card" @click="$router.push('/online-course/nyu')">
          <div class="decision-icon">💰</div>
          <h4>{{ $t('onlineCourses.lowestCost') }}</h4>
          <p>NYU / Harvard — $4,180/4{{ $t('onlineCourses.credits') }}</p>
        </div>
        <div class="decision-card" @click="$router.push('/online-course/harvard')">
          <div class="decision-icon">🏆</div>
          <h4>{{ $t('onlineCourses.highestRank') }}</h4>
          <p>Harvard (#3)</p>
        </div>
        <div class="decision-card" @click="$router.push('/online-course/cornell')">
          <div class="decision-icon">🌍</div>
          <h4>{{ $t('onlineCourses.intlFriendly') }}</h4>
          <p>Cornell</p>
        </div>
        <div class="decision-card" @click="$router.push('/online-course/ucla')">
          <div class="decision-icon">📚</div>
          <h4>{{ $t('onlineCourses.mostCourses') }}</h4>
          <p>UCLA — 800+</p>
        </div>
        <div class="decision-card" @click="$router.push('/online-course/georgetown')">
          <div class="decision-icon">🕐</div>
          <h4>{{ $t('onlineCourses.mostFlexible') }}</h4>
          <p>Georgetown</p>
        </div>
        <div class="decision-card" @click="$router.push('/online-course/ucsd')">
          <div class="decision-icon">🚪</div>
          <h4>{{ $t('onlineCourses.lowestBar') }}</h4>
          <p>UCSD</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Check } from '@element-plus/icons-vue'
import { programs, categories, getProgramsByCategory } from '../data/online-courses.js'

function categoryIcon(catId) {
  const icons = { ivy: '🌿', private: '🏛', uc: '☀' }
  return icons[catId] || '📖'
}
</script>

<style scoped>
.online-course-list {
  max-width: 1200px;
  margin: 0 auto;
}

/* Comparison table */
.comparison-section {
  margin-bottom: 36px;
}

.section-title {
  font-size: 20px;
  color: #303133;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.comparison-table-wrap {
  overflow-x: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.comparison-table th {
  background: #f5f7fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #303133;
  border-bottom: 2px solid #ebeef5;
  white-space: nowrap;
}

.comparison-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
}

.comparison-row {
  cursor: pointer;
  transition: background 0.2s;
}

.comparison-row:hover {
  background: #f0f7ff;
}

.school-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
}

.mini-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.rank-cell {
  font-weight: 700;
  color: #409eff;
}

/* Category sections */
.category-section {
  margin-bottom: 36px;
}

.cat-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 16px;
}

.cat-ivy { background: linear-gradient(135deg, #b8860b, #daa520); }
.cat-private { background: linear-gradient(135deg, #5b9bd5, #3870a0); }
.cat-uc { background: linear-gradient(135deg, #67c23a, #529b2e); }

.program-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.program-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
}

.program-card:hover {
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

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.card-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.card-program-name {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.card-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.card-highlights .el-tag {
  font-size: 11px;
}

.card-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 10px;
  color: #c0c4cc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
}

.card-targets {
  display: flex;
  gap: 4px;
}

/* Decision guide */
.decision-section {
  margin-bottom: 36px;
}

.decision-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.decision-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
}

.decision-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border-color: #5b9bd5;
}

.decision-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.decision-card h4 {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.decision-card p {
  font-size: 13px;
  color: #909399;
}

@media (max-width: 1024px) {
  .program-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .program-grid { grid-template-columns: 1fr; }
  .decision-grid { grid-template-columns: repeat(2, 1fr); }
  .section-title { font-size: 18px; }
  .comparison-table { font-size: 13px; }
  .comparison-table th,
  .comparison-table td { padding: 8px 10px; }
}

@media (max-width: 480px) {
  .decision-grid { grid-template-columns: 1fr; }
}
</style>
