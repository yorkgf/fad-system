<template>
  <div class="teaching-tickets">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t('teachingTickets.title') }}</span>
          <el-select
            v-model="filters.semester"
            :placeholder="$t('teachingTickets.selectSemester')"
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
        </div>
      </template>

      <el-alert
        :title="$t('teachingTickets.ruleInfo')"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="学生" :label="$t('teachingTickets.student')" width="120" />
        <el-table-column prop="班级" :label="$t('teachingTickets.class')" width="150" />
        <el-table-column prop="count" :label="$t('teachingTickets.ticketCount')" width="130">
          <template #default="{ row }">
            <el-tag :type="row.count >= 6 ? 'success' : 'info'">
              {{ $t('teachingTickets.ticketCountUnit', { count: row.count }) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rewardable" :label="$t('teachingTickets.redeemable')" width="120">
          <template #default="{ row }">
            {{ $t('teachingTickets.redeemableCount', { count: Math.floor(row.count / 6) }) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('teachingTickets.operation')" width="220">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :disabled="row.count < 6"
              @click="handlePrintReward(row)"
            >
              {{ $t('teachingTickets.printReward') }}
            </el-button>
            <el-button
              type="success"
              size="small"
              :disabled="row.count < 6"
              @click="handleMarkExchanged(row)"
            >
              {{ $t('teachingTickets.markExchanged') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="records.length === 0 && !loading" :description="$t('teachingTickets.noRecords')" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCommonStore } from '@/stores/common'
import { getTeachingRewardTickets, teachingTicketToReward } from '@/api/other'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import dayjs from 'dayjs'

const { t } = useI18n()
const commonStore = useCommonStore()

const loading = ref(false)
const records = ref([])

const filters = reactive({
  semester: ''
})

onMounted(() => {
  commonStore.generateSemesters()
  filters.semester = commonStore.getCurrentSemester()
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await getTeachingRewardTickets({ semester: filters.semester })
    records.value = res.data || res
  } catch (error) {
    records.value = []
  } finally {
    loading.value = false
  }
}

// 生成Reward PDF
async function generateRewardPDF(rewardData) {
  try {
    console.log('开始生成PDF, rewardData:', rewardData)

    // 加载PDF模板
    const templateUrl = '/reward-template.pdf'
    console.log('加载PDF模板:', templateUrl)

    const response = await fetch(templateUrl)
    if (!response.ok) {
      throw new Error(`加载PDF模板失败: ${response.status}`)
    }

    const templateBytes = await response.arrayBuffer()
    console.log('PDF模板加载成功, 大小:', templateBytes.byteLength)

    const pdfDoc = await PDFDocument.load(templateBytes)

    // 注册 fontkit 以支持自定义字体
    pdfDoc.registerFontkit(fontkit)
    console.log('PDF文档解析成功')

    // 加载中文字体
    const fontUrl = '/SourceHanSansSC-Regular.ttf'
    let font
    try {
      const fontResponse = await fetch(fontUrl)
      if (fontResponse.ok) {
        const fontBytes = await fontResponse.arrayBuffer()
        font = await pdfDoc.embedFont(fontBytes)
        console.log('中文字体加载成功')
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

    // 获取页面尺寸 (A4: 595 x 842 点)
    const { width, height } = firstPage.getSize()
    console.log('页面尺寸:', width, height)

    // 在PDF上添加文字
    const fontSize = 14
    const textColor = rgb(0, 0, 0)

    // 学生姓名 - Name (左上)
    firstPage.drawText(rewardData.student, {
      x: 180,
      y: 580,
      size: fontSize,
      font,
      color: textColor
    })

    // 班级 - Class (右上)
    firstPage.drawText(rewardData.studentClass, {
      x: 410,
      y: 580,
      size: fontSize,
      font,
      color: textColor
    })

    // 奖励原因 - Reason
    const reasonText = '累计6张Teaching Reward Ticket兑换'
    firstPage.drawText(reasonText, {
      x: 180,
      y: 530,
      size: fontSize,
      font,
      color: textColor
    })

    // 日期 - Date
    const dateStr = dayjs(rewardData.date).format('YYYY-MM-DD')
    firstPage.drawText(dateStr, {
      x: 385,
      y: 350,
      size: fontSize,
      font,
      color: textColor
    })

    // 为每个Reward生成一份PDF并下载
    for (let i = 0; i < rewardData.count; i++) {
      const pdfBytes = await pdfDoc.save()
      console.log('PDF生成成功, 大小:', pdfBytes.byteLength)

      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Reward_${rewardData.student}_${dateStr}_${i + 1}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      console.log('PDF下载触发:', a.download)
    }

    return true
  } catch (error) {
    console.error('生成PDF失败:', error)
    ElMessage.error(t('teachingTickets.generatePdfFailed', { msg: error.message }))
    return false
  }
}

async function handlePrintReward(row) {
  const rewardCount = Math.floor(row.count / 6)

  try {
    await ElMessageBox.confirm(
      t('teachingTickets.confirmPrint', { student: row.学生, count: rewardCount }),
      t('teachingTickets.confirmPrintTitle'),
      {
        confirmButtonText: t('teachingTickets.confirmPrintBtn'),
        cancelButtonText: t('common.cancel'),
        type: 'info'
      }
    )

    const rewardData = {
      student: row.学生,
      studentClass: row.班级,
      count: rewardCount,
      date: new Date()
    }

    await generateRewardPDF(rewardData)
    ElMessage.success(t('teachingTickets.printSuccess', { student: row.学生, count: rewardCount }))
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('teachingTickets.printFailed', { msg: error.message || '' }))
    }
  }
}

async function handleMarkExchanged(row) {
  const rewardCount = Math.floor(row.count / 6)

  try {
    await ElMessageBox.confirm(
      t('teachingTickets.confirmExchange', { student: row.学生, count: rewardCount, ticketCount: rewardCount * 6 }),
      t('teachingTickets.confirmExchangeTitle'),
      {
        confirmButtonText: t('teachingTickets.confirmExchangeBtn'),
        cancelButtonText: t('common.cancel'),
        type: 'info'
      }
    )

    loading.value = true
    await teachingTicketToReward({
      student: row.学生,
      studentClass: row.班级,
      semester: filters.semester,
      count: rewardCount
    })

    ElMessage.success(t('teachingTickets.exchangeSuccess', { student: row.学生, count: rewardCount }))
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('teachingTickets.exchangeFailed'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
