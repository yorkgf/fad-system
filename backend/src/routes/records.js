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

    // 构建基础记录
    const baseRecord = {
      记录类型: recordType,
      记录日期: recordDate,
      学生: student,
      班级: studentClass,
      记录老师: recordTeacher,
      学期: semester,
      是否已撤回: false
    }

    let insertedId = null
    let accumulatedFAD = 0

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
      const rewardRecord = {
        ...baseRecord,
        记录事由: description,
        是否优先冲抵执行: priorityOffset || false,
        是否已冲销记录: false,
        冲销记录FAD_ID: null,
        是否已发放: false,
        发放日期: null,
        发放老师: ''
      }
      const result = await getCollection(Collections.RewardRecords).insertOne(rewardRecord)
      insertedId = result.insertedId

      // 处理Reward冲销FAD逻辑
      await handleRewardOffset(student, semester, priorityOffset)
    } else if (recordType === '上网课违规使用电子产品') {
      const elecRecord = {
        ...baseRecord,
        记录事由: description,
        取消上课资格至: cancelUntil || '一个月'
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
      accumulatedFAD
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
      withdrawn,
      page = 1,
      pageSize = 20
    } = req.query

    const collectionName = collection || 'FAD_Records'
    const filter = {}

    if (semester) filter.学期 = semester
    if (studentClass) filter.班级 = studentClass
    if (student) filter.学生 = { $regex: student, $options: 'i' }
    if (sourceType) filter.FAD来源类型 = sourceType
    if (withdrawn === 'false') filter.是否已撤回 = { $ne: true }

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

    res.json({ success: true, data: records, total })
  } catch (error) {
    console.error('Query records error:', error)
    res.status(500).json({ success: false, error: '查询记录失败' })
  }
})

// 获取我的记录
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const {
      collection,
      semester,
      teacher,
      withdrawn,
      page = 1,
      pageSize = 20
    } = req.query

    const collectionName = collection || 'FAD_Records'
    const filter = {}

    if (semester) filter.学期 = semester
    if (withdrawn === 'false') filter.是否已撤回 = { $ne: true }

    // 管理员可以查看所有人的记录，普通用户只能看自己的
    if (req.user.group === 'S' && teacher) {
      filter.记录老师 = { $regex: teacher, $options: 'i' }
    } else if (req.user.group !== 'S') {
      filter.记录老师 = { $regex: req.user.name, $options: 'i' }
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const [records, total] = await Promise.all([
      getCollection(collectionName).find(filter).sort({ 记录日期: -1 }).skip(skip).limit(limit).toArray(),
      getCollection(collectionName).countDocuments(filter)
    ])

    res.json({ success: true, data: records, total })
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

    // 检查是否已撤回
    if (record.是否已撤回) {
      return res.json({
        withdrawable: false,
        reason: '该记录已被撤回'
      })
    }

    // 检查关联的FAD是否已发放
    const chainRecords = await getChainRecords(record, collection)

    for (const chain of chainRecords) {
      if (chain.collection === 'FAD_Records') {
        const fadRecord = await getCollection('FAD_Records').findOne({ _id: new ObjectId(chain.id) })
        if (fadRecord && fadRecord.是否已发放) {
          return res.json({
            withdrawable: false,
            reason: '该记录累计产生的FAD已发放纸质通知单'
          })
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
    if (collection === 'FAD_Records' && record.是否已发放) {
      return res.json({
        withdrawable: false,
        reason: '该FAD已发放纸质通知单'
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

// 撤回记录
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

    const now = new Date()
    const withdrawnRecords = []
    const resetRecords = []

    // 获取链式记录
    const chainRecords = await getChainRecords(record, collection)

    // 撤回链式记录
    for (const chain of chainRecords) {
      await getCollection(chain.collection).updateOne(
        { _id: new ObjectId(chain.id) },
        {
          $set: {
            是否已撤回: true,
            撤回日期: now,
            撤回人: req.user.name,
            撤回原因: reason || '用户撤回'
          }
        }
      )
      withdrawnRecords.push(chain)
    }

    // 撤回当前记录
    await getCollection(collection).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          是否已撤回: true,
          撤回日期: now,
          撤回人: req.user.name,
          撤回原因: reason || '用户撤回'
        }
      }
    )
    withdrawnRecords.push({ collection, id, type: record.记录类型 })

    // 重置关联记录的累计状态
    await resetAccumulateStatus(record, collection, resetRecords)

    // 如果撤回的是Reward，需要恢复FAD状态
    if (collection === 'Reward_Records' && record.冲销记录FAD_ID) {
      await restoreFADStatus(record)
    }

    res.json({
      success: true,
      data: { withdrawnRecords, resetRecords }
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
    发放老师: '',
    是否已撤回: false
  }
  return await getCollection(Collections.FADRecords).insertOne(fadRecord)
}

// 辅助函数：检查并累计
async function checkAndAccumulate({ recordType, student, semester, studentClass, rule }) {
  const collectionName = RECORD_TYPE_TO_COLLECTION[recordType]
  const filter = {
    学生: student,
    学期: semester,
    是否已撤回: { $ne: true }
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
        打扫日期: null,
        是否已撤回: false
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

// 辅助函数：处理Reward冲销FAD
async function handleRewardOffset(student, semester, priorityOffset) {
  // 查找该学生未冲销的Reward
  const rewards = await getCollection(Collections.RewardRecords)
    .find({
      学生: student,
      学期: semester,
      是否已冲销记录: false,
      是否已撤回: { $ne: true }
    })
    .toArray()

  if (rewards.length < 2) return

  // 查找可冲销的FAD
  const fadFilter = {
    学生: student,
    学期: semester,
    是否已撤回: { $ne: true }
  }

  if (priorityOffset) {
    fadFilter.是否已执行或冲抵 = false
  } else {
    fadFilter.是否已冲销记录 = false
  }

  const fad = await getCollection(Collections.FADRecords).findOne(fadFilter)
  if (!fad) return

  if (rewards.length >= 3 && !fad.是否已冲销记录) {
    // 3个Reward冲销FAD记录
    const rewardsToUse = rewards.slice(0, 3)
    const rewardIds = rewardsToUse.map(r => r._id.toString())

    await getCollection(Collections.FADRecords).updateOne(
      { _id: fad._id },
      {
        $set: { 是否已冲销记录: true, 是否已执行或冲抵: true },
        $push: { '冲销记录Reward ID': { $each: rewardIds } }
      }
    )

    for (const reward of rewardsToUse) {
      await getCollection(Collections.RewardRecords).updateOne(
        { _id: reward._id },
        { $set: { 是否已冲销记录: true, 冲销记录FAD_ID: fad._id.toString() } }
      )
    }
  } else if (rewards.length >= 2 && !fad.是否已执行或冲抵) {
    // 2个Reward冲抵FAD执行
    const rewardsToUse = rewards.slice(0, 2)
    const rewardIds = rewardsToUse.map(r => r._id.toString())

    await getCollection(Collections.FADRecords).updateOne(
      { _id: fad._id },
      {
        $set: { 是否已执行或冲抵: true, 执行日期: new Date() },
        $push: { '冲销记录Reward ID': { $each: rewardIds } }
      }
    )

    for (const reward of rewardsToUse) {
      await getCollection(Collections.RewardRecords).updateOne(
        { _id: reward._id },
        { $set: { 是否已冲销记录: true, 冲销记录FAD_ID: fad._id.toString() } }
      )
    }
  }
}

// 辅助函数：获取链式记录
async function getChainRecords(record, collection) {
  const chainRecords = []

  // 如果有累计的FAD
  if (record['累计FAD ID']) {
    const fadId = record['累计FAD ID']
    const fad = await getCollection('FAD_Records').findOne({ _id: new ObjectId(fadId) })
    if (fad && !fad.是否已撤回) {
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
    if (warning && !warning.是否已撤回) {
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
        if (fad && !fad.是否已撤回) {
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
      _id: { $ne: record._id },
      是否已撤回: { $ne: true }
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
        _id: { $ne: record._id },
        是否已撤回: { $ne: true }
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

module.exports = router
