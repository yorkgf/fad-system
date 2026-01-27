// FAD来源类型
const FAD_SOURCE_TYPE = {
  DORM: 'dorm',
  TEACH: 'teach',
  OTHER: 'other'
}

// 记录类型到FAD来源类型的映射
const RECORD_TO_FAD_SOURCE = {
  '寝室迟出': FAD_SOURCE_TYPE.DORM,
  '寝室批评': FAD_SOURCE_TYPE.DORM,
  '22:00后交还手机': FAD_SOURCE_TYPE.DORM,
  '未按规定返校': FAD_SOURCE_TYPE.DORM,
  'Teaching FAD Ticket': FAD_SOURCE_TYPE.TEACH,
  '上网课违规使用电子产品': FAD_SOURCE_TYPE.TEACH,
  '早点名迟到': FAD_SOURCE_TYPE.OTHER,
  '擅自进入会议室或接待室': FAD_SOURCE_TYPE.OTHER
}

// 累计规则
const ACCUMULATE_RULES = {
  '早点名迟到': { count: 2, result: 'FAD', sourceType: FAD_SOURCE_TYPE.OTHER },
  '寝室迟出': { count: 2, result: 'FAD', sourceType: FAD_SOURCE_TYPE.DORM },
  '未按规定返校': { count: 2, result: 'FAD', sourceType: FAD_SOURCE_TYPE.DORM },
  '擅自进入会议室或接待室': { count: 2, result: 'FAD', sourceType: FAD_SOURCE_TYPE.OTHER },
  '寝室批评': { count: 5, result: 'FAD', sourceType: FAD_SOURCE_TYPE.DORM },
  '寝室垃圾未倒': { count: 2, result: '寝室批评' },
  'Teaching FAD Ticket': { count: 3, result: 'FAD', sourceType: FAD_SOURCE_TYPE.TEACH },
  '寝室表扬': { count: 10, result: 'Reward_Hint' },
  'Teaching Reward Ticket': { count: 6, result: 'Reward_Hint' }
}

// 记录类型到集合名的映射
const RECORD_TYPE_TO_COLLECTION = {
  'FAD': 'FAD_Records',
  'Reward': 'Reward_Records',
  '早点名迟到': 'Late_Records',
  '寝室迟出': 'Leave_Room_Late_Records',
  '未按规定返校': 'Back_School_Late_Records',
  '擅自进入会议室或接待室': 'MeetingRoom_Violation_Records',
  '寝室表扬': 'Room_Praise_Records',
  '寝室批评': 'Room_Warning_Records',
  '寝室垃圾未倒': 'Room_Trash_Records',
  '上网课违规使用电子产品': 'Elec_Products_Violation_Records',
  '21:30后交还手机(22:00前)': 'Phone_Late_Records',
  '22:00后交还手机': 'Phone_Late_Records',
  'Teaching FAD Ticket': 'Teaching_FAD_Ticket',
  'Teaching Reward Ticket': 'Teaching_Reward_Ticket'
}

// 不发送邮件通知的记录类型
const NO_EMAIL_TYPES = ['寝室表扬', 'Teaching Reward Ticket', 'Reward']

module.exports = {
  FAD_SOURCE_TYPE,
  RECORD_TO_FAD_SOURCE,
  ACCUMULATE_RULES,
  RECORD_TYPE_TO_COLLECTION,
  NO_EMAIL_TYPES
}
