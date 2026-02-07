<template>
  <div class="stop-class">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>约谈/停课管理</span>
          <el-select
            v-model="filters.semester"
            placeholder="选择学期"
            style="width: 180px"
            @change="fetchAllData"
          >
            <el-option
              v-for="item in semesterOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </template>

      <!-- 规则说明 -->
      <div class="rules-alert">
        <el-alert title="FAD处罚规则说明" type="warning" :closable="false">
          <div class="rules-content">
            <div class="rule-item">
              <span class="rule-count">3次</span>
              <span class="rule-desc">学生处约谈家长</span>
            </div>
            <div class="rule-item">
              <span class="rule-count warning">6次</span>
              <span class="rule-desc">视情况停课处理</span>
            </div>
            <div class="rule-item">
              <span class="rule-count danger">9次</span>
              <span class="rule-desc">劝退处理</span>
            </div>
          </div>
        </el-alert>
      </div>

      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stat-item info" v-if="stats.warning > 0">
          <span class="stat-number">{{ stats.warning }}</span>
          <span class="stat-label">待约谈</span>
        </div>
        <div class="stat-item warning" v-if="stats.stop > 0">
          <span class="stat-number">{{ stats.stop }}</span>
          <span class="stat-label">待停课</span>
        </div>
        <div class="stat-item danger" v-if="stats.dismiss > 0">
          <span class="stat-number">{{ stats.dismiss }}</span>
          <span class="stat-label">待劝退</span>
        </div>
      </div>

      <!-- 标签页 -->
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 约谈名单 -->
        <el-tab-pane label="约谈名单" name="warning">
          <div class="tab-header">
            <span class="tab-desc">FAD累计3-5次，需约谈家长</span>
          </div>
          <el-table v-loading="loading.warning" :data="warningList" stripe class="responsive-table" row-key="学生">
            <el-table-column type="expand" width="40">
              <template #default="{ row }">
                <div class="fad-details">
                  <div class="fad-details-header">
                    <el-icon><List /></el-icon>
                    <span>FAD明细记录 (共{{ row.fadDetails?.length || 0 }}条)</span>
                  </div>
                  <el-table :data="row.fadDetails" size="small" border class="details-table">
                    <el-table-column prop="记录日期" label="日期" width="100">
                      <template #default="{ row: detail }">
                        {{ formatDate(detail.记录日期) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="记录事由" label="事由" min-width="150" show-overflow-tooltip />
                    <el-table-column prop="记录老师" label="记录老师" width="100" />
                    <el-table-column prop="来源类型" label="来源" width="80">
                      <template #default="{ row: detail }">
                        <el-tag size="small" :type="getSourceTypeTag(detail.来源类型)">
                          {{ detail.来源类型 || '其他' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="学生" label="学生" min-width="80" />
            <el-table-column prop="班级" label="班级" min-width="100" class-name="hide-on-xs" />
            <el-table-column prop="fadCount" label="FAD" min-width="60">
              <template #default="{ row }">
                <el-tag type="warning" size="small">{{ row.fadCount }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="160">
              <template #default="{ row }">
                <el-button
                  v-if="!row.约谈记录"
                  type="primary"
                  size="small"
                  @click="handleWarning(row)"
                >
                  已约谈
                </el-button>
                <el-tag v-else type="success" size="small">
                  已约谈 {{ formatDate(row.约谈记录.约谈日期) }}
                </el-tag>
                <el-button
                  type="info"
                  size="small"
                  circle
                  class="print-btn"
                  @click="printFADRecords(row)"
                  title="打印FAD记录"
                >
                  <el-icon><Printer /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="warningList.length === 0 && !loading.warning" description="暂无待约谈学生" />
        </el-tab-pane>

        <!-- 停课名单 -->
        <el-tab-pane label="停课名单" name="stop">
          <div class="tab-header">
            <span class="tab-desc">FAD累计6-8次，需停课处理</span>
          </div>
          <el-table v-loading="loading.stop" :data="stopList" stripe class="responsive-table" row-key="学生">
            <el-table-column type="expand" width="40">
              <template #default="{ row }">
                <div class="fad-details">
                  <div class="fad-details-header">
                    <el-icon><List /></el-icon>
                    <span>FAD明细记录 (共{{ row.fadDetails?.length || 0 }}条)</span>
                  </div>
                  <el-table :data="row.fadDetails" size="small" border class="details-table">
                    <el-table-column prop="记录日期" label="日期" width="100">
                      <template #default="{ row: detail }">
                        {{ formatDate(detail.记录日期) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="记录事由" label="事由" min-width="150" show-overflow-tooltip />
                    <el-table-column prop="记录老师" label="记录老师" width="100" />
                    <el-table-column prop="来源类型" label="来源" width="80">
                      <template #default="{ row: detail }">
                        <el-tag size="small" :type="getSourceTypeTag(detail.来源类型)">
                          {{ detail.来源类型 || '其他' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="学生" label="学生" min-width="80" />
            <el-table-column prop="班级" label="班级" min-width="100" class-name="hide-on-xs" />
            <el-table-column prop="fadCount" label="FAD" min-width="60">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.fadCount }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="180">
              <template #default="{ row }">
                <el-button
                  v-if="!row.停课记录 || !isInStop(row.停课记录)"
                  type="danger"
                  size="small"
                  @click="handleStop(row)"
                >
                  已停课
                </el-button>
                <el-tag v-else type="danger" size="small" effect="dark">
                  停课中
                </el-tag>
                <el-button
                  type="info"
                  size="small"
                  circle
                  class="print-btn"
                  @click="printFADRecords(row)"
                  title="打印FAD记录"
                >
                  <el-icon><Printer /></el-icon>
                </el-button>
              </template>
            </el-table-column>
            <el-table-column label="历史记录" min-width="150" class-name="hide-on-sm">
              <template #default="{ row }">
                <div v-if="row.历史记录 && row.历史记录.length > 0" class="history-list">
                  <el-tag
                    v-for="(record, index) in row.历史记录"
                    :key="index"
                    :type="record.类型 === '约谈' ? 'success' : 'danger'"
                    size="small"
                    class="history-tag"
                  >
                    {{ record.类型 }} {{ formatDate(record.日期) }}
                  </el-tag>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="stopList.length === 0 && !loading.stop" description="暂无待停课学生" />
        </el-tab-pane>

        <!-- 劝退名单 -->
        <el-tab-pane label="劝退名单" name="dismiss">
          <div class="tab-header">
            <span class="tab-desc">FAD累计9次及以上，需劝退处理</span>
          </div>
          <el-table v-loading="loading.dismiss" :data="dismissList" stripe class="responsive-table" row-key="学生">
            <el-table-column type="expand" width="40">
              <template #default="{ row }">
                <div class="fad-details">
                  <div class="fad-details-header">
                    <el-icon><List /></el-icon>
                    <span>FAD明细记录 (共{{ row.fadDetails?.length || 0 }}条)</span>
                  </div>
                  <el-table :data="row.fadDetails" size="small" border class="details-table">
                    <el-table-column prop="记录日期" label="日期" width="100">
                      <template #default="{ row: detail }">
                        {{ formatDate(detail.记录日期) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="记录事由" label="事由" min-width="150" show-overflow-tooltip />
                    <el-table-column prop="记录老师" label="记录老师" width="100" />
                    <el-table-column prop="来源类型" label="来源" width="80">
                      <template #default="{ row: detail }">
                        <el-tag size="small" :type="getSourceTypeTag(detail.来源类型)">
                          {{ detail.来源类型 || '其他' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="学生" label="学生" min-width="80" />
            <el-table-column prop="班级" label="班级" min-width="100" class-name="hide-on-xs" />
            <el-table-column prop="fadCount" label="FAD" min-width="60">
              <template #default="{ row }">
                <el-tag type="danger" size="small" effect="dark">{{ row.fadCount }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="160">
              <template #default="{ row }">
                <el-button
                  v-if="!row.已劝退"
                  type="danger"
                  size="small"
                  @click="handleDismiss(row)"
                >
                  已劝退
                </el-button>
                <el-tag v-else type="info" size="small">已劝退</el-tag>
                <el-button
                  type="info"
                  size="small"
                  circle
                  class="print-btn"
                  @click="printFADRecords(row)"
                  title="打印FAD记录"
                >
                  <el-icon><Printer /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="dismissList.length === 0 && !loading.dismiss" description="暂无待劝退学生" />
        </el-tab-pane>

        <!-- 历史记录 -->
        <el-tab-pane label="历史记录" name="history">
          <div class="tab-header">
            <span class="tab-desc">所有约谈和停课记录</span>
          </div>
          <el-table v-loading="loading.history" :data="historyList" stripe class="responsive-table">
            <el-table-column prop="学生" label="学生" min-width="80" />
            <el-table-column prop="班级" label="班级" min-width="100" class-name="hide-on-xs" />
            <el-table-column prop="类型" label="类型" min-width="70">
              <template #default="{ row }">
                <el-tag :type="row.类型 === '约谈' ? 'success' : row.类型 === '停课' ? 'danger' : 'info'" size="small">
                  {{ row.类型 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="日期" label="日期" min-width="100">
              <template #default="{ row }">
                {{ formatDate(row.日期 || row.停课开始日期) }}
              </template>
            </el-table-column>
            <el-table-column prop="停课天数" label="天数" min-width="60" class-name="hide-on-xs">
              <template #default="{ row }">
                {{ row.停课天数 ? row.停课天数 + '天' : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="记录人" label="记录人" min-width="80" class-name="hide-on-sm" />
          </el-table>
          <el-empty v-if="historyList.length === 0 && !loading.history" description="暂无历史记录" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 停课对话框 -->
    <el-dialog v-model="stopDialog.visible" title="停课处理" width="400px">
      <el-form :model="stopDialog.form" label-width="100px">
        <el-form-item label="学生">
          <span>{{ stopDialog.form.student }}</span>
        </el-form-item>
        <el-form-item label="停课开始">
          <el-date-picker v-model="stopDialog.form.startDate" type="date" placeholder="选择开始日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="停课天数">
          <el-input-number v-model="stopDialog.form.days" :min="1" :max="30" label="天数" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stopDialog.visible = false">取消</el-button>
        <el-button type="danger" :loading="stopDialog.loading" @click="confirmStop">确认停课</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useCommonStore } from '@/stores/common'
import { useUserStore } from '@/stores/user'
import { getWarningList, getStopClassList, getStopClassHistory, recordWarning, recordStopClass, recordDismiss } from '@/api/other'
import { ElMessage, ElMessageBox } from 'element-plus'
import { List, Printer } from '@element-plus/icons-vue'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import dayjs from 'dayjs'

const commonStore = useCommonStore()
const userStore = useUserStore()

const activeTab = ref('warning')
const filters = reactive({
  semester: ''
})

// 学期选项
const semesterOptions = [
  { label: '春季(Spring)', value: '春季(Spring)' },
  { label: '秋季(Fall)', value: '秋季(Fall)' },
  { label: '学年', value: '学年' }
]

// 加载状态
const loading = reactive({
  warning: false,
  stop: false,
  dismiss: false,
  history: false
})

// 数据列表
const warningList = ref([])
const stopList = ref([])
const dismissList = ref([])
const historyList = ref([])

// 统计
const stats = reactive({
  warning: 0,
  stop: 0,
  dismiss: 0
})

// 停课对话框
const stopDialog = reactive({
  visible: false,
  loading: false,
  form: {
    student: '',
    studentClass: '',
    startDate: null,
    days: 3
  }
})

onMounted(() => {
  filters.semester = '学年'
  fetchAllData()
})

async function fetchAllData() {
  fetchWarningList()
  fetchStopList()
  fetchDismissList()
  fetchHistoryList()
}

// 获取约谈名单
async function fetchWarningList() {
  loading.warning = true
  try {
    const res = await getWarningList({ semester: filters.semester })
    warningList.value = res.data || []
    stats.warning = warningList.value.length
  } catch (error) {
    warningList.value = []
  } finally {
    loading.warning = false
  }
}

// 获取停课名单
async function fetchStopList() {
  loading.stop = true
  try {
    const res = await getStopClassList({ semester: filters.semester, type: 'stop' })
    stopList.value = res.data || []
    stats.stop = stopList.value.length
  } catch (error) {
    stopList.value = []
  } finally {
    loading.stop = false
  }
}

// 获取劝退名单
async function fetchDismissList() {
  loading.dismiss = true
  try {
    const res = await getStopClassList({ semester: filters.semester, type: 'dismiss' })
    dismissList.value = res.data || []
    stats.dismiss = dismissList.value.length
  } catch (error) {
    dismissList.value = []
  } finally {
    loading.dismiss = false
  }
}

// 获取历史记录
async function fetchHistoryList() {
  loading.history = true
  try {
    const res = await getStopClassHistory({ semester: filters.semester })
    historyList.value = res.data || []
  } catch (error) {
    historyList.value = []
  } finally {
    loading.history = false
  }
}

// 处理约谈
async function handleWarning(row) {
  try {
    await ElMessageBox.confirm(`确认已约谈 ${row.学生} 的家长？`, '确认约谈', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await recordWarning({
      student: row.学生,
      studentClass: row.班级,
      date: new Date(),
      teacher: userStore.username
    })

    ElMessage.success('约谈记录已保存')
    fetchWarningList()
    fetchHistoryList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('记录失败')
    }
  }
}

// 打开停课对话框
function handleStop(row) {
  stopDialog.form.student = row.学生
  stopDialog.form.studentClass = row.班级
  stopDialog.form.startDate = new Date()
  stopDialog.form.days = 3
  stopDialog.visible = true
}

// 确认停课
async function confirmStop() {
  if (!stopDialog.form.startDate) {
    ElMessage.warning('请选择停课开始日期')
    return
  }

  stopDialog.loading = true
  try {
    const endDate = dayjs(stopDialog.form.startDate).add(stopDialog.form.days, 'day').toDate()

    await recordStopClass({
      student: stopDialog.form.student,
      studentClass: stopDialog.form.studentClass,
      startDate: stopDialog.form.startDate,
      endDate: endDate,
      days: stopDialog.form.days,
      teacher: userStore.username
    })

    ElMessage.success('停课记录已保存')
    stopDialog.visible = false
    fetchStopList()
    fetchHistoryList()
  } catch (error) {
    ElMessage.error('记录失败')
  } finally {
    stopDialog.loading = false
  }
}

// 处理劝退
async function handleDismiss(row) {
  try {
    await ElMessageBox.confirm(`确认 ${row.学生} 已劝退？此操作不可撤销！`, '确认劝退', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'danger'
    })

    await recordDismiss({
      student: row.学生,
      studentClass: row.班级,
      date: new Date(),
      teacher: userStore.username
    })

    ElMessage.success('劝退记录已保存')
    fetchDismissList()
    fetchHistoryList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('记录失败')
    }
  }
}

// 检查是否在停课期间
function isInStop(record) {
  if (!record || !record.停课结束日期) return false
  return dayjs().isBefore(dayjs(record.停课结束日期))
}

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

// 获取来源类型标签样式
function getSourceTypeTag(sourceType) {
  const typeMap = {
    'dorm': 'info',
    'teach': 'warning',
    'other': ''
  }
  return typeMap[sourceType] || ''
}

// 打印FAD记录为PDF
async function printFADRecords(row) {
  try {
    if (!row.fadDetails || row.fadDetails.length === 0) {
      ElMessage.warning('该学生暂无FAD记录')
      return
    }

    ElMessage.info('正在生成PDF...')

    // 创建PDF文档
    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)

    // 添加页面
    let page = pdfDoc.addPage([595.28, 841.89]) // A4尺寸
    const { width, height } = page.getSize()

    // 加载中文字体
    let font
    try {
      const fontUrl = '/SourceHanSansSC-Regular.ttf'
      const fontResponse = await fetch(fontUrl)
      if (fontResponse.ok) {
        const fontBytes = await fontResponse.arrayBuffer()
        font = await pdfDoc.embedFont(fontBytes)
      } else {
        throw new Error('字体文件不存在')
      }
    } catch (fontError) {
      console.warn('加载中文字体失败:', fontError)
      const { StandardFonts } = await import('pdf-lib')
      font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    }

    const fontSize = 12
    const smallFontSize = 10
    const lineHeight = 20
    let y = height - 50

    // 标题
    page.drawText('FAD 纪律处罚记录单', {
      x: width / 2 - 80,
      y,
      size: 18,
      font,
      color: rgb(0.2, 0.2, 0.2)
    })
    y -= lineHeight * 2

    // 学生基本信息
    page.drawText(`学生姓名: ${row.学生}`, {
      x: 50,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0)
    })
    page.drawText(`班级: ${row.班级}`, {
      x: 250,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0)
    })
    page.drawText(`FAD累计: ${row.fadCount} 次`, {
      x: 400,
      y,
      size: fontSize,
      font,
      color: rgb(0.8, 0.2, 0.2)
    })
    y -= lineHeight * 1.5

    // 分隔线
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    })
    y -= lineHeight * 1.5

    // 表头 - 只保留日期和记录事由
    const colX = [50, 120]
    page.drawText('日期', { x: colX[0], y, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) })
    page.drawText('记录事由', { x: colX[1], y, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) })
    y -= lineHeight

    // 分隔线
    page.drawLine({
      start: { x: 50, y: y + 10 },
      end: { x: width - 50, y: y + 10 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8)
    })

    // FAD记录列表 - 动态计算每个记录需要的行数
    const maxReasonWidth = 400 // 记录事由最大宽度
    const lineSpacing = smallFontSize + 4 // 行间距
    const recordPadding = 20 // 记录上下内边距

    // 辅助函数：计算文本需要多少行（处理换行符和冒号后的换行，逗号按宽度自动换行）
    const calculateTextLines = (text, maxWidth, fontSize) => {
      // 先将文本按已有的换行符分割
      const paragraphs = text.split(/\r?\n/)
      let totalLines = 0

      for (const paragraph of paragraphs) {
        // 对每一段按冒号分割（冒号后强制换行）
        const segments = paragraph.split(/([：:])/)
        let currentLine = ''
        let lineCount = 1

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i]
          if (!segment) continue

          // 如果是冒号，添加到当前行然后换行
          if (segment === '：' || segment === ':') {
            currentLine += segment
            lineCount++
            currentLine = ''
            continue
          }

          // 处理普通文本（包含逗号），按宽度自动换行
          const chars = segment.split('')
          for (const char of chars) {
            const testLine = currentLine + char
            const textWidth = font.widthOfTextAtSize(testLine, fontSize)
            if (textWidth > maxWidth && currentLine !== '') {
              currentLine = char
              lineCount++
            } else {
              currentLine = testLine
            }
          }
        }
        totalLines += lineCount
      }

      return totalLines || 1
    }

    // 辅助函数：绘制表头
    const drawTableHeader = (currentPage, currentY) => {
      const headerY = currentY - 20
      currentPage.drawText('日期', { x: colX[0], y: headerY, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) })
      currentPage.drawText('记录事由', { x: colX[1], y: headerY, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) })
      // 分隔线
      currentPage.drawLine({
        start: { x: 50, y: headerY - 10 },
        end: { x: width - 50, y: headerY - 10 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8)
      })
      return headerY - 20
    }

    let isFirstPage = true

    for (const record of row.fadDetails) {
      // 先计算这个记录需要多少行
      const reasonText = record.记录事由 || '-'
      const textLines = calculateTextLines(reasonText, maxReasonWidth, smallFontSize)
      // 动态计算这个记录需要的总高度（最多12行）
      const actualLines = Math.min(textLines, 12)
      const recordRowHeight = actualLines * lineSpacing + recordPadding

      // 检查是否需要新页面
      if (y < recordRowHeight + 50) {
        // 创建新页面
        page = pdfDoc.addPage([595.28, 841.89])
        y = height - 50
        // 新页面需要重新绘制表头
        y = drawTableHeader(page, y)
        isFirstPage = false
      } else if (!isFirstPage && y === height - 50) {
        // 新页面但没有检查到空间不足（刚添加页面时）
        y = drawTableHeader(page, y)
      }

      // 记录起始Y位置
      const recordStartY = y

      // 日期
      page.drawText(formatDate(record.记录日期), {
        x: colX[0],
        y: y - 10,
        size: smallFontSize,
        font,
        color: rgb(0, 0, 0)
      })

      // 处理记录事由 - 根据实际行数显示（处理换行符和冒号后的换行，逗号按宽度自动换行）
      const paragraphs = reasonText.split(/\r?\n/)
      let lineY = y - 10
      let lineCount = 0
      const maxLines = 12 // 最多显示12行

      for (let p = 0; p < paragraphs.length && lineCount < maxLines; p++) {
        const paragraph = paragraphs[p]
        // 对每一段按冒号分割（冒号后强制换行）
        const segments = paragraph.split(/([：:])/)
        let currentLine = ''

        for (let i = 0; i < segments.length && lineCount < maxLines; i++) {
          const segment = segments[i]
          if (!segment) continue

          // 如果是冒号，添加到当前行然后换行
          if (segment === '：' || segment === ':') {
            currentLine += segment
            page.drawText(currentLine, {
              x: colX[1],
              y: lineY,
              size: smallFontSize,
              font,
              color: rgb(0, 0, 0)
            })
            currentLine = ''
            lineY -= lineSpacing
            lineCount++
            continue
          }

          // 处理普通文本（包含逗号），按宽度自动换行
          const chars = segment.split('')
          for (const char of chars) {
            if (lineCount >= maxLines) break
            const testLine = currentLine + char
            const textWidth = font.widthOfTextAtSize(testLine, smallFontSize)
            if (textWidth > maxReasonWidth && currentLine !== '') {
              // 绘制当前行并换行
              page.drawText(currentLine, {
                x: colX[1],
                y: lineY,
                size: smallFontSize,
                font,
                color: rgb(0, 0, 0)
              })
              currentLine = char
              lineY -= lineSpacing
              lineCount++
            } else {
              currentLine = testLine
            }
          }
        }

        // 绘制段落剩余内容
        if (currentLine && lineCount < maxLines) {
          page.drawText(currentLine, {
            x: colX[1],
            y: lineY,
            size: smallFontSize,
            font,
            color: rgb(0, 0, 0)
          })
          // 段落之间增加换行（除了最后一个段落）
          if (p < paragraphs.length - 1 && lineCount < maxLines - 1) {
            lineY -= lineSpacing
            lineCount++
          }
        }
      }

      // 动态下移（根据实际行数）
      y -= recordRowHeight

      // 在每个FAD记录之间画分隔线
      if (y > 80) {
        page.drawLine({
          start: { x: 50, y: y + 10 },
          end: { x: width - 50, y: y + 10 },
          thickness: 0.3,
          color: rgb(0.9, 0.9, 0.9)
        })
      }
    }

    // 生成并下载PDF
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `FAD记录_${row.学生}_${row.班级}_${dayjs().format('YYYYMMDD')}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success('PDF下载成功')
  } catch (error) {
    console.error('生成PDF失败:', error)
    ElMessage.error('生成PDF失败: ' + error.message)
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rules-alert {
  margin-bottom: 20px;
}

.rules-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-count {
  display: inline-block;
  min-width: 32px;
  padding: 2px 8px;
  background: #e6a23c;
  color: #fff;
  border-radius: 4px;
  font-weight: bold;
  font-size: 13px;
  text-align: center;
}

.rule-count.warning {
  background: #f56c6c;
}

.rule-count.danger {
  background: #ff4d4f;
}

.rule-desc {
  font-size: 13px;
  color: #606266;
}

/* 统计概览 */
.stats-overview {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  background: #f5f7fa;
}

.stat-item.info {
  background: #fdf6ec;
  border: 1px solid #f5dab1;
}

.stat-item.warning {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
}

.stat-item.danger {
  background: #fef0f0;
  border: 1px solid #ff4d4f;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
}

.stat-item.info .stat-number {
  color: #e6a23c;
}

.stat-item.warning .stat-number {
  color: #f56c6c;
}

.stat-item.danger .stat-number {
  color: #ff4d4f;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

/* 标签页 */
.tab-header {
  margin-bottom: 16px;
}

.tab-desc {
  color: #909399;
  font-size: 14px;
}

/* 历史记录 */
.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.history-tag {
  margin: 2px 0;
}

/* FAD明细展开样式 */
.fad-details {
  padding: 16px 24px;
  background: #f5f7fa;
  border-radius: 4px;
  margin: 8px 0;
}

.fad-details-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 500;
  color: #606266;
}

.details-table {
  background: #fff;
  border-radius: 4px;
}

:deep(.details-table .el-table__header th) {
  background: #e4e7ed;
  color: #606266;
  font-weight: 600;
}

/* 展开按钮样式 */
:deep(.el-table__expand-icon) {
  color: #409eff;
}

:deep(.el-table__expand-icon:hover) {
  color: #66b1ff;
}

/* 打印按钮样式 */
.print-btn {
  margin-left: 8px;
}

:deep(.print-btn .el-icon) {
  font-size: 14px;
}

/* 响应式 */
.responsive-table {
  width: 100%;
}

@media (max-width: 768px) {
  .rules-content {
    flex-direction: column;
    gap: 8px;
  }

  .stats-overview {
    gap: 12px;
  }

  .stat-item {
    padding: 8px 16px;
    flex: 1;
    min-width: 80px;
  }

  .stat-number {
    font-size: 20px;
  }

  :deep(.el-tabs__item) {
    font-size: 13px;
    padding: 0 12px;
  }

  :deep(.hide-on-xs) {
    display: none !important;
  }

  :deep(.el-table .el-table__cell) {
    padding: 8px 4px;
    font-size: 13px;
  }

  .fad-details {
    padding: 12px;
  }

  :deep(.details-table .el-table__header th),
  :deep(.details-table .el-table__cell) {
    padding: 6px 4px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  :deep(.hide-on-sm) {
    display: none !important;
  }

  :deep(.el-button) {
    font-size: 12px;
    padding: 6px 10px;
  }
}
</style>
