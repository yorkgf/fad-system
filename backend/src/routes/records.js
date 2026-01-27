const { Router } = require('express')
const { ObjectId } = require('mongodb')
const { getCollection, Collections } = require('../utils/db.js')
const { authMiddleware } = require('../utils/auth.js')
const { sendRecordNotification } = require('../utils/email.js')
const {
  ACCUMULATE_RULES,
  RECORD_TYPE_TO_COLLECTION,
  NO_EMAIL_TYPES,
  FAD_SOURCE_TYPE
} = require('../utils/constants.js')

const router = Router()

// 需要检查重复的记录类型（同一天不允许重复录入）
const DUPLICATE_CHECK_TYPES = ['寝室表扬', '寝室批评', '寝室垃圾未倒']

// 累计产生FAD的记录类型
const FAD_ACCUMULATE_TYPES = [
  'Late_Records',           // 早点名迟到
  'Teaching_FAD_Ticket',    // Teaching FAD Ticket
  'Leave_Room_Late_Records', // 寝室迟出
  'Back_School_Late_Records', // 未按规定返校
  'Room_Warning_Records',    // 寝室批评
  'MeetingRoom_Violation_Records' // 擅自进入会议室
]

// 插入记录（统一入口）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      recordType,
      date,
      student,
      studentClass,
      semester,
      teacher,
      description,
      sourceType,
      priorityOffset,
      cancelUntil
    } = req.body

    const collectionName = RECORD_TYPE_TO_COLLECTION[recordType]
    if (!collectionName) {
      return res.status(400).json({ success: false, error: '无效的记录类型' })
    }

    const recordDate = new Date(date)
    const recordTeacher = teacher || req.user.name

    // 重复记录检查（同一天不允许重复录入）
    if (DUPLICATE_CHECK_TYPES.includes(recordType)) {
      const dayStart = new Date(recordDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(recordDate)
      dayEnd.setHours(23, 59, 59, 999)

      const existing = await getCollection(collectionName).findOne({
        学生: student,
        记录日期: { $gte: dayStart, $lte: dayEnd }
      })

      if (existing) {
        return res.status(400).json({
          success: false,
          error: `今日已记录${recordType}: ${student}，请勿重复记录`
        })
      }
    }

    // 构建基础记录
    const baseRecord = {
      记录类型: recordType,
      记录日期: recordDate,
      学生: student,
      班级: studentClass,
      记录老师: recordTeacher,
      学期: semester
    }

    let insertedId = null
    let accumulatedFAD = 0
    let warningMessage = null

    // 根据记录类型处理
    if (recordType === 'FAD') {
      const fadRecord = {
        ...baseRecord,
        记录事由: description,
        FAD来源类型: sourceType || FAD_SOURCE_TYPE.OTHER,
        是否已执行或冲抵: false,
        执行日期: null,
        是否已冲销记录: false,
        '冲销记录Reward ID': [],
        是否已发放: false,
        发放日期: null,
        发放老师: ''
      }
      const result = await getCollection(Collections.FADRecords).insertOne(fadRecord)
      insertedId = result.insertedId
    } else if (recordType === 'Reward') {
      // 检查是否存在可冲抵的FAD（未执行或未冲销）
      const availableFAD = await getCollection(Collections.FADRecords).findOne({
        学生: student,
        学期: semester,
        $or: [
          { 是否已执行或冲抵: false },
          { 是否已冲销记录: false }
        ]
      })

      if (!availableFAD) {
        return res.status(400).json({
          success: false,
          error: '该学生不存在未执行或未冲销的FAD，无需录入Reward'
        })
      }

      const rewardRecord = {
        ...baseRecord,
        记录事由: description,
        是否优先冲抵执行: priorityOffset || false,
        是否已冲销记录: false,
        '冲销记录FAD ID': null
      }
      const result = await getCollection(Collections.RewardRecords).insertOne(rewardRecord)
      insertedId = result.insertedId

      // 处理Reward冲销FAD逻辑
      await handleRewardOffset(student, semester, priorityOffset)
    } else if (recordType === '上网课违规使用电子产品') {
      // 统计该学生本学期违规次数
      const violationCount = await getCollection(Collections.ElecProductsViolationRecords)
        .countDocuments({
          学生: student,
          学期: semester
        })

      let cancelInfo = ''
      let cancelToDate = '一个月'

      // 根据违规次数确定惩罚
      if (violationCount === 1) {
        // 第2次违规：取消一个月
        cancelInfo = '取消晚自习上网课资格一个月'
        const oneMonthLater = new Date(recordDate)
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)
        cancelToDate = oneMonthLater.toISOString().split('T')[0]
      } else if (violationCount >= 2) {
        // 第3次+违规：取消至学期结束
        cancelInfo = '取消本学期晚自习上网课资格'
        cancelToDate = '学期结束'
      }

      const elecRecord = {
        ...baseRecord,
        记录事由: description,
        取消上课资格至: cancelToDate
      }
      const result = await getCollection(Collections.ElecProductsViolationRecords).insertOne(elecRecord)
      insertedId = result.insertedId

      // 同时产生FAD
      await insertFAD({
        student,
        studentClass,
        semester,
        teacher: '系统: 上网课违规触发',
        description: `上网课违规使用电子产品: ${description}`,
        sourceType: FAD_SOURCE_TYPE.TEACH
      })
      accumulatedFAD = 1

      if (cancelInfo) {
        warningMessage = `本学期第${violationCount + 1}次违规\n${cancelInfo}`
      }
    } else if (recordType === '21:30后交还手机(22:00前)') {
      // 21:30后交还手机，不产生FAD
      const phoneRecord = {
        ...baseRecord,
        是否记录FAD: false
      }
      const result = await getCollection(Collections.PhoneLateRecords).insertOne(phoneRecord)
      insertedId = result.insertedId
    } else if (recordType === '22:00后交还手机') {
      const phoneRecord = {
        ...baseRecord,
        是否记录FAD: true
      }
      const result = await getCollection(Collections.PhoneLateRecords).insertOne(phoneRecord)
      insertedId = result.insertedId

      // 同时产生FAD
      await insertFAD({
        student,
        studentClass,
        semester,
        teacher: '系统: 22:00后交还手机触发',
        description: '22:00后交还手机',
        sourceType: FAD_SOURCE_TYPE.DORM
      })
      accumulatedFAD = 1
    } else {
      // 其他类型记录
      const record = { ...baseRecord }

      if (description) {
        record.记录事由 = description
      }

      // 添加累计相关字段
      const rule = ACCUMULATE_RULES[recordType]
      if (rule) {
        if (rule.result === 'FAD') {
          record.是否已累计FAD = false
          record['累计FAD ID'] = null
        } else if (rule.result === '寝室批评') {
          record.是否已累计寝室警告 = false
          record['累计寝室警告 ID'] = null
        } else if (rule.result === 'Reward_Hint') {
          record.是否已累计Reward = false
          record['累计Reward ID'] = null
        }
      }

      // 寝室批评特殊字段
      if (recordType === '寝室批评') {
        record.是否已打扫 = false
        record.打扫日期 = null
      }

      const result = await getCollection(collectionName).insertOne(record)
      insertedId = result.insertedId

      // 检查是否需要累计
      if (rule) {
        const accumulated = await checkAndAccumulate({
          recordType,
          student,
          semester,
          studentClass,
          rule
        })
        if (accumulated) {
          accumulatedFAD = 1
        }

        // 检查是否达到兑换提示阈值
        if (rule.result === 'Reward_Hint') {
          const hintResult = await checkRewardExchangeHint({
            recordType,
            student,
            semester,
            rule
          })
          if (hintResult) {
            warningMessage = hintResult
          }
        }
      }
    }

    // 发送邮件通知班主任
    if (!NO_EMAIL_TYPES.includes(recordType)) {
      const classInfo = await getCollection(Collections.AllClasses).findOne({ Class: studentClass })
      if (classInfo && classInfo.HomeTeacherEmail) {
        sendRecordNotification({
          homeTeacherEmail: classInfo.HomeTeacherEmail,
          record: { ...baseRecord, 记录事由: description }
        }).catch(console.error)
      }
    }

    res.json({
      success: true,
      insertedId,
      accumulatedFAD,
      warningMessage
    })
  } catch (error) {
    console.error('Insert record error:', error)
    res.status(500).json({ success: false, error: '插入记录失败' })
  }
})

// 查询记录
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      collection,
      semester,
      studentClass,
      student,
      dateFrom,
      dateTo,
      sourceType,
      page = 1,
      pageSize = 20
    } = req.query

    const collectionName = collection || 'FAD_Records'
    const filter = {}

    if (semester) filter.学期 = semester
    if (studentClass) filter.班级 = studentClass
    if (student) filter.学生 = { $regex: student, $options: 'i' }
    if (sourceType) filter.FAD来源类型 = sourceType

    if (dateFrom || dateTo) {
      filter.记录日期 = {}
      if (dateFrom) filter.记录日期.$gte = new Date(dateFrom)
      if (dateTo) filter.记录日期.$lte = new Date(dateTo + 'T23:59:59')
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const [records, total] = await Promise.all([
      getCollection(collectionName).find(filter).sort({ 记录日期: -1 }).skip(skip).limit(limit).toArray(),
      getCollection(collectionName).countDocuments(filter)
    ])

    // 为累计产生FAD的记录添加状态
    const recordsWithStatus = await addFADStatus(records, collectionName)

    res.json({ success: true, data: recordsWithStatus, total })
  } catch (error) {
    console.error('Query records error:', error)
    res.status(500).json({ success: false, error: '查询记录失败' })
  }
})

// 获取我的记录（返回所有记录，前端分页）
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { collection, semester, teacher } = req.query

    console.log('=== /my API ===')
    console.log('User:', req.user.name, 'Group:', req.user.group)
    console.log('Params:', { collection, semester, teacher })

    const collectionName = collection || 'FAD_Records'
    const filter = {}

    if (semester) filter.学期 = semester

    // 管理员可以查看所有人的记录，普通用户只能看自己的
    if (req.user.group === 'S' && teacher) {
      filter.记录老师 = { $regex: teacher, $options: 'i' }
    } else if (req.user.group !== 'S') {
      filter.记录老师 = { $regex: req.user.name, $options: 'i' }
    }

    console.log('Query:', { collection: collectionName, filter })

    // 返回所有记录，不分页
    const records = await getCollection(collectionName)
      .find(filter)
      .sort({ 记录日期: -1 })
      .toArray()

    console.log('Found records:', records.length)

    // 为累计产生FAD的记录添加状态
    const recordsWithStatus = await addFADStatus(records, collectionName)

    console.log('Response: success, total:', recordsWithStatus.length)
    res.json({ success: true, data: recordsWithStatus, total: recordsWithStatus.length })
  } catch (error) {
    console.error('Get my records error:', error)
    res.status(500).json({ success: false, error: '获取记录失败' })
  }
})

// 检查是否可撤回
router.get('/:collection/:id/withdrawable', authMiddleware, async (req, res) => {
  try {
    const { collection, id } = req.params
    const record = await getCollection(collection).findOne({ _id: new ObjectId(id) })

    if (!record) {
      return res.status(404).json({ success: false, error: '记录不存在' })
    }

    // 权限检查
    const isAdmin = req.user.group === 'S'
    const teacherName = record.记录老师.replace('系统: ', '').split(':')[0]
    const isOwner = teacherName.includes(req.user.name)

    if (!isAdmin && !isOwner) {
      return res.json({
        withdrawable: false,
        reason: '只能撤回自己发出的记录'
      })
    }

    // 检查关联的FAD是否已发放
    const chainRecords = await getChainRecords(record, collection)

    for (const chain of chainRecords) {
      if (chain.collection === 'FAD_Records') {
        const fadRecord = await getCollection('FAD_Records').findOne({ _id: new ObjectId(chain.id) })
        if (fadRecord) {
          // 检查FAD是否已发放（包括记录老师以"已发:"开头的情况）
          if (fadRecord.是否已发放 || (fadRecord.记录老师 && fadRecord.记录老师.startsWith('已发:'))) {
            return res.json({
              withdrawable: false,
              reason: '该记录累计产生的FAD已发放纸质通知单'
            })
          }
        }
      }
      if (chain.collection === 'Reward_Records') {
        const rewardRecord = await getCollection('Reward_Records').findOne({ _id: new ObjectId(chain.id) })
        if (rewardRecord && rewardRecord.是否已发放) {
          return res.json({
            withdrawable: false,
            reason: '该记录累计产生的Reward已发放纸质通知单'
          })
        }
      }
    }

    // 检查当前记录本身
    if (collection === 'FAD_Records') {
      if (record.是否已发放) {
        return res.json({
          withdrawable: false,
          reason: '该FAD已发放纸质通知单'
        })
      }
      // 检查记录老师是否以"已发:"开头
      if (record.记录老师 && record.记录老师.startsWith('已发:')) {
        return res.json({
          withdrawable: false,
          reason: '该FAD已发放纸质通知单'
        })
      }
    }
    if (collection === 'Reward_Records') {
      return res.json({
        withdrawable: false,
        reason: 'Reward记录不可撤回'
      })
    }

    // 检查寝室表扬是否已累计Reward
    if (collection === 'Room_Praise_Records' && record.是否已累计Reward) {
      return res.json({
        withdrawable: false,
        reason: '该寝室表扬已生成Reward，不可撤回'
      })
    }

    if (collection === 'Reward_Records' && record.是否已发放) {
      return res.json({
        withdrawable: false,
        reason: '该Reward已发放纸质通知单'
      })
    }

    res.json({
      withdrawable: true,
      chainRecords
    })
  } catch (error) {
    console.error('Check withdrawable error:', error)
    res.status(500).json({ success: false, error: '检查撤回条件失败' })
  }
})

// 撤回记录（删除）
router.post('/:collection/:id/withdraw', authMiddleware, async (req, res) => {
  try {
    const { collection, id } = req.params
    const { reason } = req.body

    const record = await getCollection(collection).findOne({ _id: new ObjectId(id) })

    if (!record) {
      return res.status(404).json({ success: false, error: '记录不存在' })
    }

    // 权限检查
    const isAdmin = req.user.group === 'S'
    const teacherName = record.记录老师.replace('系统: ', '').split(':')[0]
    const isOwner = teacherName.includes(req.user.name)

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: '只能撤回自己发出的记录' })
    }

    // Reward 记录不可撤回
    if (collection === 'Reward_Records') {
      return res.status(403).json({ success: false, error: 'Reward记录不可撤回' })
    }

    // 检查FAD是否已发放（包括记录老师以"已发:"开头的情况）
    if (collection === 'FAD_Records') {
      if (record.是否已发放 || (record.记录老师 && record.记录老师.startsWith('已发:'))) {
        return res.status(403).json({ success: false, error: '该FAD已发放纸质通知单，无法撤回' })
      }
    }

    const deletedRecords = []
    const resetRecords = []

    // 获取链式记录
    const chainRecords = await getChainRecords(record, collection)

    // 检查链式记录中的FAD是否已发放
    for (const chain of chainRecords) {
      if (chain.collection === 'FAD_Records') {
        const fadRecord = await getCollection('FAD_Records').findOne({ _id: new ObjectId(chain.id) })
        if (fadRecord && (fadRecord.是否已发放 || (fadRecord.记录老师 && fadRecord.记录老师.startsWith('已发:')))) {
          return res.status(403).json({ success: false, error: '该记录累计产生的FAD已发放纸质通知单，无法撤回' })
        }
      }
    }

    // 删除链式记录
    for (const chain of chainRecords) {
      await getCollection(chain.collection).deleteOne({ _id: new ObjectId(chain.id) })
      deletedRecords.push(chain)
    }

    // 删除当前记录
    await getCollection(collection).deleteOne({ _id: new ObjectId(id) })
    deletedRecords.push({ collection, id, type: record.记录类型 })

    // 重置关联记录的累计状态
    await resetAccumulateStatus(record, collection, resetRecords)

    // 如果撤回的是Reward，需要恢复FAD状态
    if (collection === 'Reward_Records' && record.冲销记录FAD_ID) {
      await restoreFADStatus(record)
    }

    res.json({
      success: true,
      data: { deletedRecords, resetRecords }
    })
  } catch (error) {
    console.error('Withdraw record error:', error)
    res.status(500).json({ success: false, error: '撤回失败' })
  }
})

// 辅助函数：插入FAD
async function insertFAD({ student, studentClass, semester, teacher, description, sourceType }) {
  const fadRecord = {
    记录类型: 'FAD',
    记录日期: new Date(),
    学生: student,
    班级: studentClass,
    记录老师: teacher,
    记录事由: description,
    学期: semester,
    FAD来源类型: sourceType,
    是否已执行或冲抵: false,
    执行日期: null,
    是否已冲销记录: false,
    '冲销记录Reward ID': [],
    是否已发放: false,
    发放日期: null,
    发放老师: ''
  }
  return await getCollection(Collections.FADRecords).insertOne(fadRecord)
}

// 辅助函数：检查并累计
async function checkAndAccumulate({ recordType, student, semester, studentClass, rule }) {
  const collectionName = RECORD_TYPE_TO_COLLECTION[recordType]
  const filter = {
    学生: student,
    学期: semester
  }

  if (rule.result === 'FAD') {
    filter.是否已累计FAD = { $ne: true }
  } else if (rule.result === '寝室批评') {
    filter.是否已累计寝室警告 = { $ne: true }
  }

  const count = await getCollection(collectionName).countDocuments(filter)

  if (count >= rule.count) {
    // 获取要标记的记录
    const recordsToMark = await getCollection(collectionName)
      .find(filter)
      .limit(rule.count)
      .toArray()

    if (rule.result === 'FAD') {
      // 插入FAD
      const fadResult = await insertFAD({
        student,
        studentClass,
        semester,
        teacher: `系统: 累计${recordType}触发`,
        description: `累计${rule.count}次${recordType}`,
        sourceType: rule.sourceType
      })

      // 标记已累计
      const ids = recordsToMark.map(r => r._id)
      await getCollection(collectionName).updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            是否已累计FAD: true,
            '累计FAD ID': fadResult.insertedId.toString()
          }
        }
      )

      return true
    } else if (rule.result === '寝室批评') {
      // 插入寝室批评
      const warningResult = await getCollection(Collections.RoomWarningRecords).insertOne({
        记录类型: '寝室批评',
        记录日期: new Date(),
        学生: student,
        班级: studentClass,
        记录老师: '系统: 累计垃圾未倒触发',
        学期: semester,
        是否已累计FAD: false,
        '累计FAD ID': null,
        是否已打扫: false,
        打扫日期: null
      })

      // 标记已累计
      const ids = recordsToMark.map(r => r._id)
      await getCollection(collectionName).updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            是否已累计寝室警告: true,
            '累计寝室警告 ID': warningResult.insertedId.toString()
          }
        }
      )

      // 递归检查寝室批评是否累计FAD
      const warningRule = ACCUMULATE_RULES['寝室批评']
      await checkAndAccumulate({
        recordType: '寝室批评',
        student,
        semester,
        studentClass,
        rule: warningRule
      })

      return true
    }
  }

  return false
}

// 辅助函数：检查是否达到兑换提示阈值
async function checkRewardExchangeHint({ recordType, student, semester }) {
  const collectionName = RECORD_TYPE_TO_COLLECTION[recordType]
  const filter = {
    学生: student,
    学期: semester,
    是否已累计Reward: { $ne: true }
  }

  const count = await getCollection(collectionName).countDocuments(filter)

  if (recordType === '寝室表扬' && count >= 10) {
    return `该学生已有${count}次寝室表扬，可兑换${Math.floor(count / 10)}个Reward`
  }
  if (recordType === 'Teaching Reward Ticket' && count >= 6) {
    return `该学生已有${count}张Teaching Reward Ticket，可兑换${Math.floor(count / 6)}个Reward`
  }

  return null
}

// 辅助函数：处理Reward冲销FAD
async function handleRewardOffset(student, semester, priorityOffset) {
  // 步骤1：查找该学生未冲销的Reward
  const rewards = await getCollection(Collections.RewardRecords)
    .find({
      学生: student,
      学期: semester,
      是否已冲销记录: false
    })
    .sort({ 记录日期: -1 })
    .toArray()

  // 没有未冲销的Reward，不触发冲抵
  if (rewards.length === 0) {
    console.log('没有未冲销的Reward，不触发冲抵')
    return
  }

  console.log(`找到 ${rewards.length} 个未冲销的Reward，priorityOffset=${priorityOffset}`)

  // 步骤2：根据 priorityOffset 决定查找哪种FAD
  let targetFAD = null

  if (priorityOffset) {
    // 优先冲抵执行：按优先级查找未执行的FAD
    console.log('优先冲抵执行模式，按优先级查找未执行的FAD')

    // 优先级1：查找已关联1张Reward的未执行FAD
    targetFAD = await getCollection(Collections.FADRecords).findOne(
      {
        学生: student,
        学期: semester,
        是否已执行或冲抵: false,
        '冲销记录Reward ID': { $size: 1 }
      },
      { sort: { 记录日期: -1 } }
    )
    if (targetFAD) {
      console.log('找到已关联1张Reward的未执行FAD')
    }

    // 优先级2：查找任意未执行的FAD
    if (!targetFAD) {
      targetFAD = await getCollection(Collections.FADRecords).findOne(
        {
          学生: student,
          学期: semester,
          是否已执行或冲抵: false
        },
        { sort: { 记录日期: -1 } }
      )
      if (targetFAD) {
        console.log('找到未执行的FAD')
      }
    }

    // 如果没有未执行的FAD，按优先级查找未冲销的FAD进行冲销
    if (!targetFAD) {
      console.log('没有未执行的FAD，按优先级查找未冲销的FAD')

      // 优先级1：查找已关联2张Reward的未冲销FAD
      targetFAD = await getCollection(Collections.FADRecords).findOne(
        {
          学生: student,
          学期: semester,
          是否已冲销记录: false,
          '冲销记录Reward ID': { $size: 2 }
        },
        { sort: { 记录日期: -1 } }
      )
      if (targetFAD) {
        console.log('找到已关联2张Reward的FAD')
      }

      // 优先级2：查找已关联1张Reward的未冲销FAD
      if (!targetFAD) {
        targetFAD = await getCollection(Collections.FADRecords).findOne(
          {
            学生: student,
            学期: semester,
            是否已冲销记录: false,
            '冲销记录Reward ID': { $size: 1 }
          },
          { sort: { 记录日期: -1 } }
        )
        if (targetFAD) {
          console.log('找到已关联1张Reward的FAD')
        }
      }

      // 优先级3：查找任意未冲销的FAD
      if (!targetFAD) {
        targetFAD = await getCollection(Collections.FADRecords).findOne(
          {
            学生: student,
            学期: semester,
            是否已冲销记录: false
          },
          { sort: { 记录日期: -1 } }
        )
        if (targetFAD) {
          console.log('找到未冲销的FAD')
        }
      }
    }
  } else {
    // 优先冲销记录：按优先级查找未冲销的FAD
    console.log('优先冲销记录模式，按优先级查找未冲销的FAD')

    // 优先级1：查找已关联2张Reward的未冲销FAD
    targetFAD = await getCollection(Collections.FADRecords).findOne(
      {
        学生: student,
        学期: semester,
        是否已冲销记录: false,
        '冲销记录Reward ID': { $size: 2 }
      },
      { sort: { 记录日期: -1 } }
    )
    if (targetFAD) {
      console.log('找到已关联2张Reward的FAD')
    }

    // 优先级2：查找已关联1张Reward的未冲销FAD
    if (!targetFAD) {
      targetFAD = await getCollection(Collections.FADRecords).findOne(
        {
          学生: student,
          学期: semester,
          是否已冲销记录: false,
          '冲销记录Reward ID': { $size: 1 }
        },
        { sort: { 记录日期: -1 } }
      )
      if (targetFAD) {
        console.log('找到已关联1张Reward的FAD')
      }
    }

    // 优先级3：查找任意未冲销的FAD
    if (!targetFAD) {
      targetFAD = await getCollection(Collections.FADRecords).findOne(
        {
          学生: student,
          学期: semester,
          是否已冲销记录: false
        },
        { sort: { 记录日期: -1 } }
      )
      if (targetFAD) {
        console.log('找到未冲销的FAD')
      }
    }
  }

  // 没有找到符合条件的FAD
  if (!targetFAD) {
    console.log('没有找到符合条件的FAD，不进行冲抵')
    return
  }

  // 步骤3：关联Reward到FAD，根据关联数量决定是否更新状态
  const rewardToUse = rewards[0]
  const rewardId = rewardToUse._id.toString()

  // 获取当前FAD已关联的Reward数量
  const currentRewardIds = targetFAD['冲销记录Reward ID'] || []
  const newRewardCount = currentRewardIds.length + 1

  console.log(`FAD当前关联${currentRewardIds.length}张Reward，关联后将有${newRewardCount}张`)

  // 构建FAD更新操作
  const fadUpdate = {
    $push: { '冲销记录Reward ID': rewardId }
  }

  // 根据关联数量决定是否更新状态字段
  if (newRewardCount === 2) {
    // 满2张Reward，设置"是否已执行或冲抵"为true
    console.log('关联满2张Reward，设置是否已执行或冲抵为true')
    fadUpdate.$set = {
      是否已执行或冲抵: true,
      执行日期: new Date()
    }
  } else if (newRewardCount === 3) {
    // 满3张Reward，设置"是否已冲销记录"为true
    console.log('关联满3张Reward，设置是否已冲销记录为true')
    fadUpdate.$set = {
      是否已冲销记录: true
    }
  } else {
    // 只有1张Reward，不更新状态字段
    console.log('只关联1张Reward，不更新FAD状态字段')
  }

  // 更新FAD
  await getCollection(Collections.FADRecords).updateOne(
    { _id: targetFAD._id },
    fadUpdate
  )

  // 更新Reward
  await getCollection(Collections.RewardRecords).updateOne(
    { _id: rewardToUse._id },
    {
      $set: {
        是否已冲销记录: true,
        '冲销记录FAD ID': targetFAD._id.toString()
      }
    }
  )

  console.log('Reward关联FAD完成')
}

// 辅助函数：获取链式记录
async function getChainRecords(record, collection) {
  const chainRecords = []

  // 如果有累计的FAD
  if (record['累计FAD ID']) {
    const fadId = record['累计FAD ID']
    const fad = await getCollection('FAD_Records').findOne({ _id: new ObjectId(fadId) })
    if (fad) {
      chainRecords.push({
        collection: 'FAD_Records',
        id: fadId,
        type: 'FAD',
        student: fad.学生
      })
    }
  }

  // 如果有累计的寝室警告
  if (record['累计寝室警告 ID']) {
    const warningId = record['累计寝室警告 ID']
    const warning = await getCollection('Room_Warning_Records').findOne({ _id: new ObjectId(warningId) })
    if (warning) {
      chainRecords.push({
        collection: 'Room_Warning_Records',
        id: warningId,
        type: '寝室批评',
        student: warning.学生
      })

      // 如果寝室警告也累计了FAD
      if (warning['累计FAD ID']) {
        const fadId = warning['累计FAD ID']
        const fad = await getCollection('FAD_Records').findOne({ _id: new ObjectId(fadId) })
        if (fad) {
          chainRecords.push({
            collection: 'FAD_Records',
            id: fadId,
            type: 'FAD',
            student: fad.学生
          })
        }
      }
    }
  }

  return chainRecords
}

// 辅助函数：重置累计状态
async function resetAccumulateStatus(record, collection, resetRecords) {
  // 如果撤回的记录累计产生了FAD，需要重置同批次的其他记录
  if (record['累计FAD ID']) {
    const fadId = record['累计FAD ID']

    // 查找同一个FAD关联的其他记录
    const filter = {
      '累计FAD ID': fadId,
      _id: { $ne: record._id }
    }

    await getCollection(collection).updateMany(filter, {
      $set: { 是否已累计FAD: false, '累计FAD ID': null }
    })
  }

  if (record['累计寝室警告 ID']) {
    const warningId = record['累计寝室警告 ID']

    await getCollection(collection).updateMany(
      {
        '累计寝室警告 ID': warningId,
        _id: { $ne: record._id }
      },
      { $set: { 是否已累计寝室警告: false, '累计寝室警告 ID': null } }
    )
  }
}

// 辅助函数：恢复FAD状态（撤回Reward时）
async function restoreFADStatus(rewardRecord) {
  const fadId = rewardRecord.冲销记录FAD_ID
  if (!fadId) return

  const fad = await getCollection('FAD_Records').findOne({ _id: new ObjectId(fadId) })
  if (!fad) return

  // 从FAD的冲销记录中移除该Reward
  const rewardIdStr = rewardRecord._id.toString()
  const remainingRewards = (fad['冲销记录Reward ID'] || []).filter(id => id !== rewardIdStr)

  const update = {
    $set: { '冲销记录Reward ID': remainingRewards }
  }

  // 根据剩余Reward数量恢复状态
  if (remainingRewards.length < 2) {
    update.$set.是否已执行或冲抵 = false
    update.$set.执行日期 = null
  }
  if (remainingRewards.length < 3) {
    update.$set.是否已冲销记录 = false
  }

  await getCollection('FAD_Records').updateOne({ _id: new ObjectId(fadId) }, update)
}

// 辅助函数：为累计产生FAD的记录添加状态
async function addFADStatus(records, collectionName) {
  // 只有累计产生FAD的记录类型才需要计算状态
  if (!FAD_ACCUMULATE_TYPES.includes(collectionName)) {
    return records
  }

  const recordsWithStatus = []

  for (const record of records) {
    let fadStatus = '未累计FAD'
    let fadRecord = null

    // 检查记录是否已累计FAD
    if (record.是否已累计FAD && record['累计FAD ID']) {
      // 获取关联的FAD记录
      fadRecord = await getCollection('FAD_Records').findOne({ _id: new ObjectId(record['累计FAD ID']) })

      // 检查FAD是否已发放
      if (fadRecord) {
        const fadIssued = fadRecord.是否已发放 || (fadRecord.记录老师 && fadRecord.记录老师.startsWith('已发:'))
        if (fadIssued) {
          fadStatus = '已累计FAD，已发放'
        } else {
          fadStatus = '已累计FAD，未发放'
        }
      }
    }

    recordsWithStatus.push({
      ...record,
      fadStatus,
      fadRecord // 添加FAD记录详情，前端可能需要
    })
  }

  return recordsWithStatus
}

module.exports = router
