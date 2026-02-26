import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getClasses } from '@/api/students'

export const useCommonStore = defineStore('common', () => {
  const classes = ref([])
  const semesters = ref([])
  const loading = ref(false)

  // FAD来源类型
  const fadSourceTypes = [
    { labelKey: 'fadSource.dorm', value: 'dorm' },
    { labelKey: 'fadSource.teach', value: 'teach' },
    { labelKey: 'fadSource.elec', value: 'elec' },
    { labelKey: 'fadSource.other', value: 'other' }
  ]

  // 记录类型列表
  const allRecordTypes = [
    { value: 'FAD', labelKey: 'recordTypes.FAD', group: 'S' },
    { value: 'Reward', labelKey: 'recordTypes.Reward', group: 'S' },
    { value: '早点名迟到', labelKey: 'recordTypes.morningLate', group: 'F' },
    { value: '寝室迟出', labelKey: 'recordTypes.dormLateExit', group: 'F' },
    { value: '未按规定返校', labelKey: 'recordTypes.returnViolation', group: 'F' },
    { value: '擅自进入会议室或接待室', labelKey: 'recordTypes.meetingRoomViolation', group: 'F' },
    { value: '寝室表扬', labelKey: 'recordTypes.dormPraise', group: 'F' },
    { value: '寝室批评', labelKey: 'recordTypes.dormCriticism', group: 'F' },
    { value: '寝室垃圾未倒', labelKey: 'recordTypes.dormTrashNotDumped', group: 'F' },
    { value: '上网课违规使用电子产品', labelKey: 'recordTypes.onlineClassViolation', group: 'S' },
    { value: '21:30后交还手机(22:00前)', labelKey: 'recordTypes.phoneLate2130', group: 'F' },
    { value: '22:00后交还手机', labelKey: 'recordTypes.phoneLate2200', group: 'F' },
    { value: 'Teaching FAD Ticket', labelKey: 'recordTypes.teachingFADTicket', group: 'F' },
    { value: 'Teaching Reward Ticket', labelKey: 'recordTypes.teachingRewardTicket', group: 'F' }
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
    semesters.value = [
      { value: '春季(Spring)', labelKey: 'records.springTerm' },
      { value: '秋季(Fall)', labelKey: 'records.fallTerm' }
    ]
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
