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
    { label: '电子产品违规', value: 'elec' },
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

  // 生成学期列表（只有春季(Spring)和秋季(Fall)）
  function generateSemesters() {
    semesters.value = ['春季(Spring)', '秋季(Fall)']
  }

  // 获取当前学期
  function getCurrentSemester() {
    const now = new Date()
    const month = now.getMonth() + 1
    // 2月-7月为春季(Spring)，9月-次年1月为秋季(Fall)
    if (month >= 2 && month <= 7) {
      return '春季(Spring)'
    } else {
      return '秋季(Fall)'
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
