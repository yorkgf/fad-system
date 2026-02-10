const { MongoClient } = require('mongodb')

// GHA 数据库配置（FAD系统主数据库）
// 注意: MONGO_URI 必须在环境变量中配置，不允许使用默认值
const MONGO_URI = process.env.MONGO_URI
const DB_NAME = process.env.DB_NAME || 'GHA'

// GHS 数据库配置（Meeting Arrangement日程系统数据库）
const GHS_MONGO_URI = process.env.GHS_MONGO_URI || MONGO_URI
const GHS_DB_NAME = process.env.GHS_DB_NAME || 'GHS'

let db = null      // GHA 数据库实例
let ghsDB = null   // GHS 数据库实例
let client = null

async function connectDB() {
  if (db && ghsDB) return { db, ghsDB }

  // 验证必需的环境变量
  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is required. Please configure it in SCF console or .env file.')
  }

  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()

    // 连接 GHA（FAD主数据库）
    db = client.db(DB_NAME)

    // 连接 GHS（Meeting Arrangement数据库）
    // 如果 GHS 在同一服务器，复用连接
    if (GHS_MONGO_URI === MONGO_URI) {
      ghsDB = client.db(GHS_DB_NAME)
    } else {
      // 如果 GHS 在不同服务器，需要额外连接
      const ghsClient = new MongoClient(GHS_MONGO_URI)
      await ghsClient.connect()
      ghsDB = ghsClient.db(GHS_DB_NAME)
    }

    console.log('MongoDB connected: GHA and GHS')
    return { db, ghsDB }
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

function getDB() {
  if (!db) {
    throw new Error('GHA Database not connected')
  }
  return db
}

function getGHSDB() {
  if (!ghsDB) {
    throw new Error('GHS Database not connected')
  }
  return ghsDB
}

function getCollection(name) {
  return getDB().collection(name)
}

function getGHSCollection(name) {
  return getGHSDB().collection(name)
}

// GHA 集合名称常量（FAD系统）
const Collections = {
  Teachers: 'Teachers',
  Students: 'Students',
  AllClasses: 'All_Classes',
  RecordType: 'RecordType',
  FADRecords: 'FAD_Records',
  RewardRecords: 'Reward_Records',
  LateRecords: 'Late_Records',
  LeaveRoomLateRecords: 'Leave_Room_Late_Records',
  BackSchoolLateRecords: 'Back_School_Late_Records',
  MeetingRoomViolationRecords: 'MeetingRoom_Violation_Records',
  RoomPraiseRecords: 'Room_Praise_Records',
  RoomWarningRecords: 'Room_Warning_Records',
  RoomTrashRecords: 'Room_Trash_Records',
  ElecProductsViolationRecords: 'Elec_Products_Violation_Records',
  PhoneLateRecords: 'Phone_Late_Records',
  TeachingFADTicket: 'Teaching_FAD_Ticket',
  TeachingRewardTicket: 'Teaching_Reward_Ticket',
  StopClassRecords: 'Stop_Class_Records'
}

// GHS 集合名称常量（日程管理系统）
const GHSCollections = {
  Teachers: 'teachers',           // GHS教师信息（使用小写，与现有系统保持一致）
  Sessions: 'sessions',           // 日程时段（使用小写，与现有系统保持一致）
  Bookings: 'bookings'            // 预约记录（使用小写，与现有系统保持一致）
}

module.exports = {
  connectDB,
  getDB,
  getGHSDB,
  getCollection,
  getGHSCollection,
  Collections,
  GHSCollections
}
