import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getClasses } from '@/api/students'

export const useCommonStore = defineStore('common', () => {
  const classes = ref([])
  const semesters = ref([])
  const loading = ref(false)

  // FAD来源类型
  const fadSourceTypes = [
    { label: '寝室类', value: 'dorm' },
    { label: '教学类', value: 'teach' },
    { label: '其他', value: 'other' }
  ]

  // 记录类型列表
  const allRecordTypes = [
    { value: 'FAD', label: 'FAD', group: 'S' },
    { value: 'Reward', label: 'Reward', group: 'S' },
    { value: '早点名迟到', label: '早点名迟到', group: 'F' },
    { value: '寝室迟出', label: '寝室迟出', group: 'F' },
    { value: '未按规定返校', label: '未按规定返校', group: 'F' },
    { value: '擅自进入会议室或接待室', label: '擅自进入会议室或接待室', group: 'F' },
    { value: '寝室表扬', label: '寝室表扬', group: 'F' },
    { value: '寝室批评', label: '寝室批评', group: 'F' },
    { value: '寝室垃圾未倒', label: '寝室垃圾未倒', group: 'F' },
    { value: '上网课违规使用电子产品', label: '上网课违规使用电子产品', group: 'S' },
    { value: '21:30后交还手机(22:00前)', label: '21:30后交还手机(22:00前)', group: 'F' },
    { value: '22:00后交还手机', label: '22:00后交还手机', group: 'F' },
    { value: 'Teaching FAD Ticket', label: 'Teaching FAD Ticket', group: 'F' },
    { value: 'Teaching Reward Ticket', label: 'Teaching Reward Ticket', group: 'F' }
  ]

  async function fetchClasses() {
    loading.value = true
    try {
      const res = await getClasses()
      classes.value = res.data || res
    } finally {
      loading.value = false
    }
  }

  // 生成学期列表（当前年份前后）
  function generateSemesters() {
    const currentYear = new Date().getFullYear()
    const result = []
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      result.push(`${year}-${year + 1}-1`)
      result.push(`${year}-${year + 1}-2`)
    }
    semesters.value = result.reverse()
  }

  // 获取当前学期
  function getCurrentSemester() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    // 9月-次年1月为第一学期，2月-7月为第二学期
    if (month >= 9 || month === 1) {
      const startYear = month >= 9 ? year : year - 1
      return `${startYear}-${startYear + 1}-1`
    } else {
      return `${year - 1}-${year}-2`
    }
  }

  return {
    classes,
    semesters,
    loading,
    fadSourceTypes,
    allRecordTypes,
    fetchClasses,
    generateSemesters,
    getCurrentSemester
  }
})
