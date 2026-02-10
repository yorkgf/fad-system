const { Router } = require('express')
const { ObjectId } = require('mongodb')
const { getCollection, Collections } = require('../utils/db.js')
const { authMiddleware } = require('../utils/auth.js')
const { THRESHOLDS, DB_FIELDS } = require('../utils/constants.js')

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

    // 不再插入Reward记录，只标记寝室表扬已兑换
    for (let i = 0; i < count; i++) {
      // 标记对应的寝室表扬已兑换
      const praiseIds = praises.slice(i * 10, (i + 1) * 10).map(p => p._id)
      await getCollection(Collections.RoomPraiseRecords).updateMany(
        { _id: { $in: praiseIds } },
        {
          $set: {
            是否已累计Reward: true,
            '累计Reward日期': new Date()
          }
        }
      )
    }

    // 返回兑换信息，供前端生成PDF
    res.json({
      success: true,
      message: `成功兑换 ${count} 个Reward`,
      rewardData: {
        student,
        studentClass,
        semester,
        count,
        date: new Date().toISOString(),
        teacher: req.user.name
      }
    })
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
      { $match: { uncleanedCount: { $gte: THRESHOLDS.ROOM.WARNING_CLEANABLE } } },
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

// 最佳寝室排名
router.get('/best-dorm', authMiddleware, async (req, res) => {
  try {
    const { semester, semesters } = req.query

    // 构建学期过滤条件
    const filter = {
      是否已撤回: { $ne: true }
    }

    if (semesters) {
      const semesterArray = Array.isArray(semesters) ? semesters : [semesters]
      filter.学期 = { $in: semesterArray }
    } else if (semester) {
      filter.学期 = semester
    }

    // 1. 统计每个寝室的表扬总数
    const dormPraiseData = await getCollection(Collections.RoomPraiseRecords).aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'Students',
          localField: '学生',
          foreignField: '学生姓名',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $group: {
          _id: '$studentInfo.寝室',
          praiseCount: { $sum: 1 },
          students: { $addToSet: '$学生' }
        }
      }
    ]).toArray()

    // 2. 获取每个寝室的实际学生人数
    const dormStudentCounts = await getCollection(Collections.Students).aggregate([
      {
        $group: {
          _id: '$寝室',
          studentCount: { $sum: 1 }
        }
      }
    ]).toArray()

    // 创建寝室人数映射
    const dormCountMap = new Map(
      dormStudentCounts.map(d => [d._id, d.studentCount])
    )

    // 3. 计算每个寝室的人均表扬次数
    const dormStats = dormPraiseData
      .filter(d => d._id !== null && d._id !== undefined) // 过滤无效寝室
      .map(d => {
        const dormNumber = d._id
        const studentCount = dormCountMap.get(dormNumber) || d.students.length
        const avgPraise = studentCount > 0 ? (d.praiseCount / studentCount).toFixed(2) : 0
        const floorNumber = getFloorNumber(dormNumber)

        return {
          dormNumber: dormNumber,
          praiseCount: d.praiseCount,
          studentCount: studentCount,
          avgPraise: parseFloat(avgPraise),
          floor: floorNumber
        }
      })

    // 4. 按楼层分组，每组取Top 3
    const floorMap = new Map()
    for (const dorm of dormStats) {
      const floor = dorm.floor
      if (!floorMap.has(floor)) {
        floorMap.set(floor, [])
      }
      floorMap.get(floor).push(dorm)
    }

    // 每层按人均表扬降序排序，取前3
    const bestDorms = []
    const sortedFloors = Array.from(floorMap.keys()).sort((a, b) => a - b) // 楼层升序

    for (const floor of sortedFloors) {
      const floorDorms = floorMap.get(floor)
      floorDorms.sort((a, b) => b.avgPraise - a.avgPraise)
      const top3 = floorDorms.slice(0, 3)
      bestDorms.push({
        floor: floor,
        dorms: top3
      })
    }

    res.json({
      success: true,
      data: bestDorms
    })
  } catch (error) {
    console.error('Get best dorm error:', error)
    res.status(500).json({ success: false, error: '获取最佳寝室排名失败' })
  }
})

// 辅助函数：提取楼层号（寝室号的第一个数字）
function getFloorNumber(dormNumber) {
  if (dormNumber === null || dormNumber === undefined) return 0
  const dormStr = dormNumber.toString()
  if (dormStr.length === 0) return 0
  return parseInt(dormStr.charAt(0)) || 0
}

module.exports = router
