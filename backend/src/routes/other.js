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

// 获取约谈学生名单（FAD >= 3）
router.get('/stop-class/warning', authMiddleware, async (req, res) => {
  try {
    const { semester } = req.query

    const filter = {
      是否已冲销记录: { $ne: true },
      是否已撤回: { $ne: true }
    }

    if (semester) filter.学期 = semester

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

    res.json({ success: true, data: result.map(r => ({
      学生: r._id.student,
      班级: r._id.class,
      fadCount: r.fadCount,
      level: r.fadCount >= 3 ? 'warning' : 'normal'
    })) })
  } catch (error) {
    console.error('Get warning list error:', error)
    res.status(500).json({ success: false, error: '获取约谈名单失败' })
  }
})

// 获取停课学生名单（FAD >= 6）
router.get('/stop-class/list', authMiddleware, async (req, res) => {
  try {
    const { semester } = req.query

    const filter = {
      是否已冲销记录: { $ne: true },
      是否已撤回: { $ne: true }
    }

    if (semester) filter.学期 = semester

    const result = await getCollection(Collections.FADRecords).aggregate([
      { $match: filter },
      {
        $group: {
          _id: { student: '$学生', class: '$班级' },
          fadCount: { $sum: 1 }
        }
      },
      { $match: { fadCount: { $gte: 6 } } },
      { $sort: { fadCount: -1 } }
    ]).toArray()

    // 获取停课记录
    const studentsWithStopClass = await Promise.all(
      result.map(async (r) => {
        const stopRecord = await getCollection(Collections.StopClassRecords).findOne({
          学生: r._id.student
        })

        return {
          学生: r._id.student,
          班级: r._id.class,
          fadCount: r.fadCount,
          level: r.fadCount >= 9 ? 'danger' : 'warning', // 9次及以上为劝退级别
          停课开始日期: stopRecord?.停课开始日期 || null,
          停课结束日期: stopRecord?.停课结束日期 || null,
          stopDays: stopRecord ? dayjs(stopRecord.停课结束日期).diff(dayjs(stopRecord.停课开始日期), 'day') : 0
        }
      })
    )

    res.json({ success: true, data: studentsWithStopClass })
  } catch (error) {
    console.error('Get stop class list error:', error)
    res.status(500).json({ success: false, error: '获取停课名单失败' })
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
