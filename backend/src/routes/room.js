const { Router } = require('express')
const { ObjectId } = require('mongodb')
const { getCollection, Collections } = require('../utils/db.js')
const { authMiddleware } = require('../utils/auth.js')

const router = Router()

// 获取可兑换Reward的寝室表扬（10次可兑1个）
router.get('/rewardable', authMiddleware, async (req, res) => {
  try {
    const { semester } = req.query

    const filter = {
      是否已累计Reward: { $ne: true },
      是否已撤回: { $ne: true }
    }

    if (semester) filter.学期 = semester

    // 按学生分组统计
    const result = await getCollection(Collections.RoomPraiseRecords).aggregate([
      { $match: filter },
      {
        $group: {
          _id: { student: '$学生', class: '$班级' },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gte: 10 } } },
      { $sort: { count: -1 } }
    ]).toArray()

    res.json({
      success: true,
      data: result.map(r => ({
        学生: r._id.student,
        班级: r._id.class,
        count: r.count,
        rewardable: Math.floor(r.count / 10)
      }))
    })
  } catch (error) {
    console.error('Get rewardable praise error:', error)
    res.status(500).json({ success: false, error: '获取可兑换寝室表扬失败' })
  }
})

// 寝室表扬兑换Reward
router.post('/to-reward', authMiddleware, async (req, res) => {
  try {
    const { student, studentClass, semester, count } = req.body

    if (!student || !count || count < 1) {
      return res.status(400).json({ success: false, error: '参数错误' })
    }

    const praiseCount = count * 10

    // 查找未兑换的寝室表扬
    const praises = await getCollection(Collections.RoomPraiseRecords)
      .find({
        学生: student,
        学期: semester,
        是否已累计Reward: { $ne: true },
        是否已撤回: { $ne: true }
      })
      .limit(praiseCount)
      .toArray()

    if (praises.length < praiseCount) {
      return res.status(400).json({ success: false, error: '寝室表扬次数不足' })
    }

    // 创建Reward记录
    for (let i = 0; i < count; i++) {
      const rewardResult = await getCollection(Collections.RewardRecords).insertOne({
        记录类型: 'Reward',
        记录日期: new Date(),
        学生: student,
        班级: studentClass,
        记录老师: `系统: 寝室表扬兑换`,
        记录事由: `累计10次寝室表扬兑换`,
        学期: semester,
        是否优先冲抵执行: false,
        是否已冲销记录: false,
        冲销记录FAD_ID: null,
        是否已发放: false,
        发放日期: null,
        发放老师: '',
        是否已撤回: false
      })

      // 标记对应的寝室表扬已兑换
      const praiseIds = praises.slice(i * 10, (i + 1) * 10).map(p => p._id)
      await getCollection(Collections.RoomPraiseRecords).updateMany(
        { _id: { $in: praiseIds } },
        {
          $set: {
            是否已累计Reward: true,
            '累计Reward ID': rewardResult.insertedId.toString()
          }
        }
      )
    }

    res.json({ success: true, message: `成功兑换 ${count} 个Reward` })
  } catch (error) {
    console.error('Praise to reward error:', error)
    res.status(500).json({ success: false, error: '兑换失败' })
  }
})

// 获取可清扫的寝室批评（至少3条未清扫）
router.get('/cleanable', authMiddleware, async (req, res) => {
  try {
    const { semester } = req.query

    const filter = {
      是否已打扫: { $ne: true },
      是否已撤回: { $ne: true }
    }

    if (semester) filter.学期 = semester

    // 按学生分组统计
    const result = await getCollection(Collections.RoomWarningRecords).aggregate([
      { $match: filter },
      {
        $group: {
          _id: { student: '$学生', class: '$班级' },
          uncleanedCount: { $sum: 1 },
          latestDate: { $max: '$记录日期' }
        }
      },
      { $match: { uncleanedCount: { $gte: 3 } } },
      { $sort: { uncleanedCount: -1 } }
    ]).toArray()

    res.json({
      success: true,
      data: result.map(r => ({
        学生: r._id.student,
        班级: r._id.class,
        uncleanedCount: r.uncleanedCount,
        latestDate: r.latestDate
      }))
    })
  } catch (error) {
    console.error('Get cleanable warnings error:', error)
    res.status(500).json({ success: false, error: '获取可清扫寝室批评失败' })
  }
})

// 确认清扫
router.post('/clean', authMiddleware, async (req, res) => {
  try {
    const { student, semester } = req.body

    if (!student) {
      return res.status(400).json({ success: false, error: '请指定学生' })
    }

    const filter = {
      学生: student,
      是否已打扫: { $ne: true },
      是否已撤回: { $ne: true }
    }

    if (semester) filter.学期 = semester

    const result = await getCollection(Collections.RoomWarningRecords).updateMany(
      filter,
      {
        $set: {
          是否已打扫: true,
          打扫日期: new Date()
        }
      }
    )

    res.json({
      success: true,
      message: `已确认 ${result.modifiedCount} 条寝室批评为已清扫`
    })
  } catch (error) {
    console.error('Confirm clean error:', error)
    res.status(500).json({ success: false, error: '确认清扫失败' })
  }
})

module.exports = router
