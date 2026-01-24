const { MongoClient } = require('mongodb')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://49.235.189.246:27017'
const DB_NAME = process.env.DB_NAME || 'GHA'

let db = null
let client = null

async function connectDB() {
  if (db) return db

  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db(DB_NAME)
    console.log('MongoDB connected successfully')
    return db
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not connected')
  }
  return db
}

function getCollection(name) {
  return getDB().collection(name)
}

// 集合名称常量
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

module.exports = {
  connectDB,
  getDB,
  getCollection,
  Collections
}
