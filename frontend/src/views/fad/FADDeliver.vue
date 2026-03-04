<template>
  <div class="fad-deliver">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t('fad.deliver.title') }}</span>
          <div class="filters">
            <el-select
              v-model="filters.semester"
              :placeholder="$t('fad.deliver.selectSemester')"
              style="width: 180px"
              @change="fetchData"
            >
              <el-option
                v-for="item in commonStore.semesters"
                :key="item.value"
                :label="$t(item.labelKey)"
                :value="item.value"
              />
            </el-select>
            <el-select
              v-model="filters.sourceType"
              :placeholder="$t('fad.deliver.fadSourceType')"
              style="width: 120px"
              clearable
              @change="fetchData"
            >
              <el-option
                v-for="item in commonStore.fadSourceTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="records"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="学生" :label="$t('fad.deliver.student')" width="100" />
        <el-table-column prop="班级" :label="$t('fad.deliver.class')" width="120" />
        <el-table-column prop="记录日期" :label="$t('fad.deliver.recordDate')" width="120">
          <template #default="{ row }">
            {{ formatDate(row.记录日期) }}
          </template>
        </el-table-column>
        <el-table-column prop="记录事由" :label="$t('fad.deliver.recordReason')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="记录老师" :label="$t('fad.deliver.recordTeacher')" width="120" />
        <el-table-column prop="FAD来源类型" :label="$t('fad.deliver.sourceType')" width="100">
          <template #default="{ row }">
            <el-tag :type="getSourceTypeTag(row.FAD来源类型)">
              {{ getSourceTypeLabel(row.FAD来源类型) }}
            </el-tag>
          </template>
        </el-table-column>
         <el-table-column :label="$t('fad.deliver.fadStatus')" width="120">
           <template #default="{ row }">
             <el-tag v-if="row.是否已冲销记录" type="success" size="small">{{ $t('fad.deliver.offsetDone') }}</el-tag>
             <el-tag v-else-if="row.是否已执行或冲抵" type="warning" size="small">{{ $t('fad.deliver.executedNotOffset') }}</el-tag>
             <el-tag v-else type="danger" size="small">{{ $t('fad.deliver.notExecuted') }}</el-tag>
           </template>
         </el-table-column>
        <el-table-column :label="$t('fad.deliver.operation')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleDownload(row)">
              {{ $t('fad.deliver.downloadNotice') }}
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleDeliver([row])"
            >
              {{ $t('fad.deliver.confirmDeliver') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <div class="batch-actions">
          <el-button
            type="primary"
            :disabled="selectedRows.length === 0"
            @click="handleDeliver(selectedRows)"
          >
            {{ $t('fad.deliver.batchConfirmDeliver', { count: selectedRows.length }) }}
          </el-button>
        </div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useCommonStore } from '@/stores/common'
import { getUndeliveredFAD, deliverFAD } from '@/api/fad'
import dayjs from 'dayjs'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

const { t } = useI18n()
const userStore = useUserStore()
const commonStore = useCommonStore()

const loading = ref(false)
const records = ref([])
const selectedRows = ref([])

const filters = reactive({
  semester: '',
  sourceType: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

onMounted(() => {
  commonStore.generateSemesters()
  filters.semester = commonStore.getCurrentSemester()
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await getUndeliveredFAD({
      semester: filters.semester,
      sourceType: filters.sourceType || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    records.value = res.data || res
    pagination.total = res.total || records.value.length
  } catch (error) {
    records.value = []
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

async function handleDownload(row) {
  try {
    // 加载PDF模板
    const templateUrl = '/FAD Form.pdf'
    const response = await fetch(templateUrl)
    if (!response.ok) {
      throw new Error(`加载PDF模板失败: ${response.status}`)
    }

    const templateBytes = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(templateBytes)

    // 注册 fontkit 以支持自定义字体
    pdfDoc.registerFontkit(fontkit)

    // 加载中文字体
    const fontUrl = '/SourceHanSansSC-Regular.ttf'
    let font
    try {
      const fontResponse = await fetch(fontUrl)
      if (fontResponse.ok) {
        const fontBytes = await fontResponse.arrayBuffer()
        font = await pdfDoc.embedFont(fontBytes)
      } else {
        throw new Error('字体文件不存在')
      }
    } catch (fontError) {
      console.warn('加载中文字体失败，尝试使用备用方案:', fontError)
      const { StandardFonts } = await import('pdf-lib')
      font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    }

    // 获取第一页
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]

    // 获取页面尺寸
    const { width, height } = firstPage.getSize()
    const fontSize = 14
    const textColor = rgb(0, 0, 0)

    // 在PDF上添加文字
    // PDF坐标系：原点在左下角，y轴向上
    // 根据FAD Form.pdf的实际布局调整坐标

    // 学生姓名 - Student's Name
    firstPage.drawText(row.学生, {
      x: 180,
      y: 580,
      size: fontSize,
      font,
      color: textColor
    })

    // 班级 - Class
    firstPage.drawText(row.班级, {
      x: 420,
      y: 580,
      size: fontSize,
      font,
      color: textColor
    })

    // 记录日期 - Date of Violation
    firstPage.drawText(formatDate(row.记录日期), {
      x: 180,
      y: 520,
      size: fontSize,
      font,
      color: textColor
    })

    // 记录老师 - Teacher's Name
    firstPage.drawText(row.记录老师, {
      x: 180,
      y: 640,
      size: fontSize,
      font,
      color: textColor
    })

    // 记录事由 - Reason for Disciplinary Action
    firstPage.drawText(row.记录事由.replace(/,\n/g, ', '), {
      x: 170,
      y: 420,
      size: fontSize - 4,
      font,
      color: textColor,
      maxWidth: 350,
      lineHeight: 16
    })

    // 保存PDF
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${row.学生}FAD记录.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('生成PDF失败:', error)
    ElMessage.error(t('fad.deliver.generatePdfFailed', { msg: error.message }))
  }
}

async function handleDeliver(rows) {
  const count = rows.length

  try {
    await ElMessageBox.confirm(
      t('fad.deliver.confirmDeliverMsg', { count }),
      t('fad.deliver.confirmDeliverTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'info'
      }
    )

    loading.value = true
    const promises = rows.map(row => deliverFAD(row._id, userStore.username))
    await Promise.all(promises)

    ElMessage.success(t('fad.deliver.deliverSuccess', { count }))
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('fad.deliver.deliverFailed'))
    }
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function getSourceTypeLabel(type) {
  const map = {
    dorm: t('fad.deliver.sourceDorm'),
    teach: t('fad.deliver.sourceTeach'),
    elec: t('fad.deliver.sourceElec'),
    other: t('fad.deliver.sourceOther')
  }
  return map[type] || type || t('fad.deliver.sourceUncategorized')
}

function getSourceTypeTag(type) {
  const map = { dorm: 'warning', teach: 'danger', other: 'info' }
  return map[type] || 'info'
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  gap: 12px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}
</style>
