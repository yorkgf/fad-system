const { Router } = require('express')
const { ObjectId } = require('mongodb')
const { getCollection, Collections } = require('../utils/db.js')
const { authMiddleware } = require('../utils/auth.js')
const dayjs = require('dayjs')

const router = Router()

// 获取被取消上课资格的学生
router.get('/elec-violations/cancelled', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query

    const filter = { 是否已撤回: { $ne: true } }

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const [records, total] = await Promise.all([
      getCollection(Collections.ElecProductsViolationRecords).find(filter).sort({ 记录日期: -1 }).skip(skip).limit(limit).toArray(),
      getCollection(Collections.ElecProductsViolationRecords).countDocuments(filter)
    ])

    res.json({ success: true, data: records, total })
  } catch (error) {
    console.error('Get elec violations error:', error)
    res.status(500).json({ success: false, error: '获取电子产品违规记录失败' })
  }
})

// 获取今日手机迟交名单
router.get('/phone-late/today', authMiddleware, async (req, res) => {
  try {
    const today = dayjs().startOf('day').toDate()
    const tomorrow = dayjs().endOf('day').toDate()

    const records = await getCollection(Collections.PhoneLateRecords)
      .find({
        记录日期: { $gte: today, $lte: tomorrow },
        是否已撤回: { $ne: true }
      })
      .sort({ 记录日期: -1 })
      .toArray()

    res.json({ success: true, data: records })
  } catch (error) {
    console.error('Get today phone late error:', error)
    res.status(500).json({ success: false, error: '获取今日手机迟交名单失败' })
  }
})

// 获取约谈学生名单（FAD 3-5次）
router.get('/stop-class/warning', authMiddleware, async (req, res) => {
  try {
    const { semester } = req.query

    const filter = {
      是否已冲销记录: { $ne: true },
      是否已撤回: { $ne: true }
    }

    if (semester && semester !== '学年') filter.学期 = semester

    const result = await getCollection(Collections.FADRecords).aggregate([
      { $match: filter },
      {
        $group: {
          _id: { student: '$学生', class: '$班级' },
          fadCount: { $sum: 1 }
        }
      },
      { $match: { fadCount: { $gte: 3, $lt: 6 } } },
      { $sort: { fadCount: -1 } }
    ]).toArray()

    // 获取约谈记录
    const studentsWithWarning = await Promise.all(
      result.map(async (r) => {
        const warningRecord = await getCollection(Collections.StopClassRecords).findOne({
          学生: r._id.student,
          类型: '约谈'
        }, { sort: { 日期: -1 } })

        // 获取历史记录（约谈和停课）
        const historyRecords = await getCollection(Collections.StopClassRecords)
          .find({ 学生: r._id.student })
          .sort({ 日期: -1 })
          .toArray()

        // 获取FAD明细记录
        const fadDetails = await getCollection(Collections.FADRecords)
          .find({
            学生: r._id.student,
            是否已冲销记录: { $ne: true },
            是否已撤回: { $ne: true }
          })
          .sort({ 记录日期: -1 })
          .toArray()

        return {
          学生: r._id.student,
          班级: r._id.class,
          fadCount: r.fadCount,
          level: 'warning',
          约谈记录: warningRecord ? {
            约谈日期: warningRecord.日期,
            记录人: warningRecord.记录人
          } : null,
          历史记录: historyRecords.map(h => ({
            类型: h.类型,
            日期: h.日期,
            记录人: h.记录人
          })),
          fadDetails: fadDetails.map(f => ({
            _id: f._id,
            记录日期: f.记录日期,
            记录事由: f.记录事由,
            记录老师: f.记录老师,
            来源类型: f.来源类型
          }))
        }
      })
    )

    res.json({ success: true, data: studentsWithWarning })
  } catch (error) {
    console.error('Get warning list error:', error)
    res.status(500).json({ success: false, error: '获取约谈名单失败' })
  }
})

// 获取停课/劝退学生名单（FAD >= 6）
router.get('/stop-class/list', authMiddleware, async (req, res) => {
  try {
    const { semester, type } = req.query

    const filter = {
      是否已冲销记录: { $ne: true },
      是否已撤回: { $ne: true }
    }

    if (semester && semester !== '学年') filter.学期 = semester

    // 根据type确定FAD次数范围
    let fadMatch = { $gte: 6 }
    if (type === 'stop') {
      // 停课：6-8次
      fadMatch = { $gte: 6, $lt: 9 }
    } else if (type === 'dismiss') {
      // 劝退：9次及以上
      fadMatch = { $gte: 9 }
    }

    const result = await getCollection(Collections.FADRecords).aggregate([
      { $match: filter },
      {
        $group: {
          _id: { student: '$学生', class: '$班级' },
          fadCount: { $sum: 1 }
        }
      },
      { $match: { fadCount: fadMatch } },
      { $sort: { fadCount: -1 } }
    ]).toArray()

    // 获取停课记录和历史
    const studentsWithRecords = await Promise.all(
      result.map(async (r) => {
        // 获取最新的停课记录
        const stopRecord = await getCollection(Collections.StopClassRecords).findOne({
          学生: r._id.student,
          类型: '停课'
        }, { sort: { 停课开始日期: -1 } })

        // 获取历史记录（约谈和停课）
        const historyRecords = await getCollection(Collections.StopClassRecords)
          .find({ 学生: r._id.student })
          .sort({ 日期: -1, 停课开始日期: -1 })
          .toArray()

        // 检查是否已劝退
        const dismissRecord = await getCollection(Collections.StopClassRecords).findOne({
          学生: r._id.student,
          类型: '劝退'
        })

        // 获取FAD明细记录
        const fadDetails = await getCollection(Collections.FADRecords)
          .find({
            学生: r._id.student,
            是否已冲销记录: { $ne: true },
            是否已撤回: { $ne: true }
          })
          .sort({ 记录日期: -1 })
          .toArray()

        return {
          学生: r._id.student,
          班级: r._id.class,
          fadCount: r.fadCount,
          level: r.fadCount >= 9 ? 'danger' : 'warning',
          已劝退: !!dismissRecord,
          停课记录: stopRecord ? {
            停课开始日期: stopRecord.停课开始日期,
            停课结束日期: stopRecord.停课结束日期,
            停课天数: stopRecord.停课天数,
            记录人: stopRecord.记录人
          } : null,
          历史记录: historyRecords.map(h => ({
            类型: h.类型,
            日期: h.日期 || h.停课开始日期,
            记录人: h.记录人
          })),
          fadDetails: fadDetails.map(f => ({
            _id: f._id,
            记录日期: f.记录日期,
            记录事由: f.记录事由,
            记录老师: f.记录老师,
            来源类型: f.来源类型
          }))
        }
      })
    )

    res.json({ success: true, data: studentsWithRecords })
  } catch (error) {
    console.error('Get stop class list error:', error)
    res.status(500).json({ success: false, error: '获取停课名单失败' })
  }
})

// 获取约谈/停课历史记录
router.get('/stop-class/history', authMiddleware, async (req, res) => {
  try {
    const { semester } = req.query

    const filter = {}
    if (semester && semester !== '学年') {
      // 如果指定了学期，需要根据学期过滤关联的FAD记录
      // 这里简化处理，返回所有历史记录
    }

    const records = await getCollection(Collections.StopClassRecords)
      .find(filter)
      .sort({ 日期: -1, 停课开始日期: -1 })
      .toArray()

    // 获取学生班级信息
    const studentsWithClass = await Promise.all(
      records.map(async (record) => {
        // 从Students集合获取班级信息
        const studentInfo = await getCollection(Collections.Students).findOne({
          姓名: record.学生
        })

        return {
          学生: record.学生,
          班级: studentInfo?.班级 || record.班级 || '-',
          类型: record.类型,
          日期: record.日期 || record.停课开始日期,
          停课天数: record.停课天数,
          记录人: record.记录人
        }
      })
    )

    res.json({ success: true, data: studentsWithClass })
  } catch (error) {
    console.error('Get stop class history error:', error)
    res.status(500).json({ success: false, error: '获取历史记录失败' })
  }
})

// 记录约谈
router.post('/stop-class/warning', authMiddleware, async (req, res) => {
  try {
    const { student, studentClass, date, teacher } = req.body

    if (!student || !teacher) {
      return res.status(400).json({ success: false, error: '参数错误' })
    }

    await getCollection(Collections.StopClassRecords).insertOne({
      学生: student,
      班级: studentClass,
      类型: '约谈',
      日期: new Date(date || Date.now()),
      记录人: teacher,
      创建时间: new Date()
    })

    res.json({ success: true, message: '约谈记录已保存' })
  } catch (error) {
    console.error('Record warning error:', error)
    res.status(500).json({ success: false, error: '记录约谈失败' })
  }
})

// 记录停课
router.post('/stop-class/stop', authMiddleware, async (req, res) => {
  try {
    const { student, studentClass, startDate, endDate, days, teacher } = req.body

    if (!student || !startDate || !endDate || !days || !teacher) {
      return res.status(400).json({ success: false, error: '参数错误' })
    }

    await getCollection(Collections.StopClassRecords).insertOne({
      学生: student,
      班级: studentClass,
      类型: '停课',
      停课开始日期: new Date(startDate),
      停课结束日期: new Date(endDate),
      停课天数: parseInt(days),
      日期: new Date(startDate),
      记录人: teacher,
      创建时间: new Date()
    })

    res.json({ success: true, message: '停课记录已保存' })
  } catch (error) {
    console.error('Record stop class error:', error)
    res.status(500).json({ success: false, error: '记录停课失败' })
  }
})

// 记录劝退
router.post('/stop-class/dismiss', authMiddleware, async (req, res) => {
  try {
    const { student, studentClass, date, teacher } = req.body

    if (!student || !teacher) {
      return res.status(400).json({ success: false, error: '参数错误' })
    }

    await getCollection(Collections.StopClassRecords).insertOne({
      学生: student,
      班级: studentClass,
      类型: '劝退',
      日期: new Date(date || Date.now()),
      记录人: teacher,
      创建时间: new Date()
    })

    res.json({ success: true, message: '劝退记录已保存' })
  } catch (error) {
    console.error('Record dismiss error:', error)
    res.status(500).json({ success: false, error: '记录劝退失败' })
  }
})

// 获取教学FAD票待累计
router.get('/teaching-tickets/fad', authMiddleware, async (req, res) => {
  try {
    const { semester } = req.query

    const filter = {
      是否已累计FAD: { $ne: true },
      是否已撤回: { $ne: true }
    }

    if (semester) filter.学期 = semester

    // 按学生分组统计
    const result = await getCollection(Collections.TeachingFADTicket).aggregate([
      { $match: filter },
      {
        $group: {
          _id: { student: '$学生', class: '$班级' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray()

    res.json({
      success: true,
      data: result.map(r => ({
        学生: r._id.student,
        班级: r._id.class,
        count: r.count
      }))
    })
  } catch (error) {
    console.error('Get teaching FAD tickets error:', error)
    res.status(500).json({ success: false, error: '获取教学FAD票失败' })
  }
})

// 获取教学Reward票待兑换（6张可兑1个Reward）
router.get('/teaching-tickets/reward', authMiddleware, async (req, res) => {
  try {
    const { semester } = req.query

    const filter = {
      是否已累计Reward: { $ne: true },
      是否已撤回: { $ne: true }
    }

    if (semester) filter.学期 = semester

    // 按学生分组统计
    const result = await getCollection(Collections.TeachingRewardTicket).aggregate([
      { $match: filter },
      {
        $group: {
          _id: { student: '$学生', class: '$班级' },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gte: 6 } } },
      { $sort: { count: -1 } }
    ]).toArray()

    res.json({
      success: true,
      data: result.map(r => ({
        学生: r._id.student,
        班级: r._id.class,
        count: r.count,
        rewardable: Math.floor(r.count / 6)
      }))
    })
  } catch (error) {
    console.error('Get teaching reward tickets error:', error)
    res.status(500).json({ success: false, error: '获取教学Reward票失败' })
  }
})

// 教学Reward票兑换
router.post('/teaching-tickets/reward/exchange', authMiddleware, async (req, res) => {
  try {
    const { student, studentClass, semester, count } = req.body

    if (!student || !count || count < 1) {
      return res.status(400).json({ success: false, error: '参数错误' })
    }

    const ticketCount = count * 6

    // 查找未兑换的教学Reward票
    const tickets = await getCollection(Collections.TeachingRewardTicket)
      .find({
        学生: student,
        学期: semester,
        是否已累计Reward: { $ne: true },
        是否已撤回: { $ne: true }
      })
      .limit(ticketCount)
      .toArray()

    if (tickets.length < ticketCount) {
      return res.status(400).json({ success: false, error: '教学Reward票数量不足' })
    }

    // 创建Reward记录
    for (let i = 0; i < count; i++) {
      const rewardResult = await getCollection(Collections.RewardRecords).insertOne({
        记录类型: 'Reward',
        记录日期: new Date(),
        学生: student,
        班级: studentClass,
        记录老师: `系统: 教学Reward票兑换`,
        记录事由: `累计6张Teaching Reward Ticket兑换`,
        学期: semester,
        是否优先冲抵执行: false,
        是否已冲销记录: false,
        冲销记录FAD_ID: null,
        是否已发放: false,
        发放日期: null,
        发放老师: '',
        是否已撤回: false
      })

      // 标记对应的教学Reward票已兑换
      const ticketIds = tickets.slice(i * 6, (i + 1) * 6).map(t => t._id)
      await getCollection(Collections.TeachingRewardTicket).updateMany(
        { _id: { $in: ticketIds } },
        {
          $set: {
            是否已累计Reward: true,
            累计Reward_ID: rewardResult.insertedId.toString()
          }
        }
      )
    }

    res.json({ success: true, message: `成功兑换 ${count} 个Reward` })
  } catch (error) {
    console.error('Teaching ticket to reward error:', error)
    res.status(500).json({ success: false, error: '兑换失败' })
  }
})

module.exports = router
