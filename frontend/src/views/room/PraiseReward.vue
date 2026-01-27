<template>
  <div class="praise-reward">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>寝室表扬兑奖</span>
          <el-select
            v-model="filters.semester"
            placeholder="选择学期"
            style="width: 180px"
            @change="fetchData"
          >
            <el-option
              v-for="item in commonStore.semesters"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </div>
      </template>

      <el-alert
        title="规则说明：累计10次寝室表扬可兑换1个Reward"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="学生" label="学生" width="120" />
        <el-table-column prop="班级" label="班级" width="150" />
        <el-table-column prop="count" label="表扬次数" width="100">
          <template #default="{ row }">
            <el-tag :type="row.count >= 10 ? 'success' : 'info'">
              {{ row.count }} 次
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rewardable" label="可兑换" width="100">
          <template #default="{ row }">
            {{ Math.floor(row.count / 10) }} 个Reward
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :disabled="row.count < 10"
              @click="handleExchange(row)"
            >
              兑换
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCommonStore } from '@/stores/common'
import { getRewardablePraise, praiseToReward } from '@/api/room'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import dayjs from 'dayjs'

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
    const res = await getRewardablePraise({ semester: filters.semester })
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
    // 加载PDF模板
    const templateUrl = '/reward-template.pdf'
    const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(templateBytes)

    // 获取第一页
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]

    // 嵌入字体
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // 获取页面尺寸
    const { width, height } = firstPage.getSize()

    // 在PDF上添加文字（根据模板位置调整坐标）
    const fontSize = 12
    const textColor = rgb(0, 0, 0)

    // 学生姓名
    firstPage.drawText(rewardData.student, {
      x: 180,
      y: height - 195,
      size: fontSize,
      font,
      color: textColor
    })

    // 班级
    firstPage.drawText(rewardData.studentClass, {
      x: 180,
      y: height - 220,
      size: fontSize,
      font,
      color: textColor
    })

    // 日期
    const dateStr = dayjs(rewardData.date).format('YYYY-MM-DD')
    firstPage.drawText(dateStr, {
      x: 180,
      y: height - 245,
      size: fontSize,
      font,
      color: textColor
    })

    // 事由
    firstPage.drawText('累计10次寝室表扬兑换', {
      x: 180,
      y: height - 270,
      size: fontSize,
      font,
      color: textColor
    })

    // 为每个Reward生成一份PDF并下载
    for (let i = 0; i < rewardData.count; i++) {
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Reward_${rewardData.student}_${dateStr}_${i + 1}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }

    return true
  } catch (error) {
    console.error('生成PDF失败:', error)
    return false
  }
}

async function handleExchange(row) {
  const rewardCount = Math.floor(row.count / 10)

  try {
    await ElMessageBox.confirm(
      `确定为 ${row.学生} 兑换 ${rewardCount} 个Reward吗？\n将消耗 ${rewardCount * 10} 次寝室表扬`,
      '确认兑换',
      {
        confirmButtonText: '确定兑换',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    loading.value = true
    const res = await praiseToReward({
      student: row.学生,
      studentClass: row.班级,
      semester: filters.semester,
      count: rewardCount
    })

    // 生成并下载PDF
    if (res.rewardData) {
      await generateRewardPDF(res.rewardData)
    }

    ElMessage.success(`成功为 ${row.学生} 兑换 ${rewardCount} 个Reward，PDF已下载`)
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('兑换失败')
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
