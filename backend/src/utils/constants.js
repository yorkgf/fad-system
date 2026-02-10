// FAD来源类型
const FAD_SOURCE_TYPE = {
  DORM: 'dorm',
  TEACH: 'teach',
  ELEC: 'elec',
  OTHER: 'other'
}

// 记录类型到FAD来源类型的映射
const RECORD_TO_FAD_SOURCE = {
  '寝室迟出': FAD_SOURCE_TYPE.DORM,
  '寝室批评': FAD_SOURCE_TYPE.DORM,
  '22:00后交还手机': FAD_SOURCE_TYPE.DORM,
  '未按规定返校': FAD_SOURCE_TYPE.DORM,
  'Teaching FAD Ticket': FAD_SOURCE_TYPE.TEACH,
  '上网课违规使用电子产品': FAD_SOURCE_TYPE.ELEC,
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

// FAD/Reward 业务阈值常量
const THRESHOLDS = {
  REWARD: {
    OFFSET_EXECUTION: 2,    // 2个奖励抵消执行状态
    OFFSET_RECORD: 3,       // 3个奖励冲销记录
  },
  FAD: {
    WARNING_MIN: 3,         // 3个FAD发出警告
    STOP_CLASS_MIN: 6,      // 6个FAD建议停课
    DISMISS_MIN: 9,         // 9个FAD建议退学
  },
  ROOM: {
    PRAISE_REWARD: 10,      // 10次寝室表扬获得奖励提示
    WARNING_CLEANABLE: 3,   // 3个以下警告可清除
  },
  TEACHING: {
    REWARD_EXCHANGE: 6,     // 6个教学奖励票可兑换奖励
  }
}

// 数据库字段名常量
const DB_FIELDS = {
  REWARD_DELIVERED: '是否已发放',
  REWARD_EXECUTED: '是否已执行或冲抵',
  REWARD_OFFSET: '是否已冲销记录',
  FAD_EXECUTED: '是否已执行或冲抵',
  FAD_OFFSET: '是否已冲销记录',
  WITHDRAWN: '是否已撤回',
  STUDENT: '学生',
  SEMESTER: '学期',
  RECORD_DATE: '记录日期',
  CLASS: '班级',
  TEACHER: '记录老师',
  FAD_SOURCE_TYPE: 'FAD来源类型',
  REWARD_ID_LIST: '冲销记录Reward ID',
  FAD_ID: '冲销记录FAD ID',
  ACCUMULATED_FAD_ID: '累计FAD ID',
  ACCUMULATED_WARNING_ID: '累计寝室批评 ID',
  CLEANED: '是否已打扫'
}

module.exports = {
  FAD_SOURCE_TYPE,
  RECORD_TO_FAD_SOURCE,
  ACCUMULATE_RULES,
  RECORD_TYPE_TO_COLLECTION,
  NO_EMAIL_TYPES,
  THRESHOLDS,
  DB_FIELDS
}
