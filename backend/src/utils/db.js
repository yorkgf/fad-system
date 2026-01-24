const cloudbase = require('@cloudbase/node-sdk')

// CloudBase 初始化
const app = cloudbase.init({
  env: process.env.TCB_ENV || 'tnt-a8n8fw53q'
})

const db = app.database()

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

// CloudBase 集合适配器，模拟 MongoDB 风格的 API
class CollectionAdapter {
  constructor(collectionName) {
    this.collectionName = collectionName
    this._collection = db.collection(collectionName)
  }

  // 模拟 MongoDB 的 find()
  find(query = {}) {
    return new QueryBuilder(this._collection, query)
  }

  // 模拟 MongoDB 的 findOne()
  async findOne(query = {}) {
    const result = await this._collection.where(query).limit(1).get()
    return result.data && result.data.length > 0 ? result.data[0] : null
  }

  // 模拟 MongoDB 的 insertOne()
  async insertOne(doc) {
    const result = await this._collection.add(doc)
    return { insertedId: result.id }
  }

  // 模拟 MongoDB 的 updateOne()
  async updateOne(filter, update) {
    // 处理 $set 操作符
    const data = update.$set || update

    const result = await this._collection.where(filter).update(data)
    return { modifiedCount: result.updated }
  }

  // 模拟 MongoDB 的 updateMany()
  async updateMany(filter, update) {
    const data = update.$set || update
    const result = await this._collection.where(filter).update(data)
    return { modifiedCount: result.updated }
  }

  // 模拟 MongoDB 的 deleteOne()
  async deleteOne(filter) {
    const result = await this._collection.where(filter).remove()
    return { deletedCount: result.deleted }
  }

  // 模拟 MongoDB 的 countDocuments()
  async countDocuments(query = {}) {
    const result = await this._collection.where(query).count()
    return result.total
  }

  // 模拟 MongoDB 的 aggregate()
  aggregate(pipeline) {
    // CloudBase 不直接支持 aggregate，需要用 limit/skip/where/orderBy 组合
    return new AggregateBuilder(this._collection, pipeline)
  }
}

// 查询构建器
class QueryBuilder {
  constructor(collection, query = {}) {
    this._query = collection.where(query)
    this._limit = 0
    this._skip = 0
    this._sort = {}
  }

  limit(n) {
    this._limit = n
    return this
  }

  skip(n) {
    this._skip = n
    return this
  }

  sort(spec) {
    // spec 格式: { field: 1 } 或 { field: -1 }
    for (const [field, order] of Object.entries(spec)) {
      this._sort[field] = order
    }
    return this
  }

  async toArray() {
    let query = this._query

    if (this._limit > 0) {
      query = query.limit(this._limit)
    }

    if (this._skip > 0) {
      query = query.skip(this._skip)
    }

    // CloudBase orderBy 需要单独处理每个字段
    for (const [field, order] of Object.entries(this._sort)) {
      query = query.orderBy(field, order > 0 ? 'asc' : 'desc')
    }

    const result = await query.get()
    return result.data || []
  }
}

// 聚合构建器（简化版）
class AggregateBuilder {
  constructor(collection, pipeline) {
    this._collection = collection
    this._pipeline = pipeline
  }

  async toArray() {
    // 简化实现，实际需要根据 pipeline 解析
    const result = await this._collection.get()
    return result.data || []
  }
}

// 数据库连接（CloudBase 不需要显式连接）
async function connectDB() {
  // CloudBase SDK 自动处理连接
  console.log('CloudBase database initialized')
  return db
}

function getDB() {
  return db
}

function getCollection(name) {
  return new CollectionAdapter(name)
}

module.exports = {
  connectDB,
  getDB,
  getCollection,
  Collections
}
