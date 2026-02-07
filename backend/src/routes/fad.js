const { Router } = require('express')
const { ObjectId } = require('mongodb')
const { getCollection, Collections } = require('../utils/db.js')
const { authMiddleware } = require('../utils/auth.js')

const router = Router()

// 获取FAD记录列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      semester,
      sourceType,
      executed,
      delivered,
      student,
      page = 1,
      pageSize = 20
    } = req.query

    const filter = { 是否已撤回: { $ne: true } }

    if (semester) filter.学期 = semester
    if (sourceType) filter.FAD来源类型 = sourceType
    if (executed === 'true') filter.是否已执行或冲抵 = true
    if (executed === 'false') filter.是否已执行或冲抵 = false
    if (delivered === 'true') filter.是否已发放 = true
    if (delivered === 'false') filter.是否已发放 = { $ne: true }
    if (student) filter.学生 = { $regex: student, $options: 'i' }

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const [records, total] = await Promise.all([
      getCollection(Collections.FADRecords).find(filter).sort({ 记录日期: -1 }).skip(skip).limit(limit).toArray(),
      getCollection(Collections.FADRecords).countDocuments(filter)
    ])

    res.json({ success: true, data: records, total })
  } catch (error) {
    console.error('Get FAD records error:', error)
    res.status(500).json({ success: false, error: '获取FAD记录失败' })
  }
})

// 获取未执行的FAD
router.get('/unexecuted', authMiddleware, async (req, res) => {
  try {
    const { semester, sourceType, page = 1, pageSize = 20 } = req.query

    const filter = {
      是否已执行或冲抵: false,
      是否已撤回: { $ne: true }
    }

    if (semester) filter.学期 = semester
    if (sourceType) filter.FAD来源类型 = sourceType

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const [records, total] = await Promise.all([
      getCollection(Collections.FADRecords).find(filter).sort({ 记录日期: -1 }).skip(skip).limit(limit).toArray(),
      getCollection(Collections.FADRecords).countDocuments(filter)
    ])

    res.json({ success: true, data: records, total })
  } catch (error) {
    console.error('Get unexecuted FAD error:', error)
    res.status(500).json({ success: false, error: '获取未执行FAD失败' })
  }
})

// 获取未发放的FAD
router.get('/undelivered', authMiddleware, async (req, res) => {
  try {
    const { semester, sourceType, page = 1, pageSize = 20 } = req.query

    const filter = {
      是否已发放: { $ne: true },
      是否已撤回: { $ne: true },
      记录老师: { $not: /^已发:/ }
    }

    if (semester) filter.学期 = semester
    if (sourceType) filter.FAD来源类型 = sourceType

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const [records, total] = await Promise.all([
      getCollection(Collections.FADRecords).find(filter).sort({ 记录日期: -1 }).skip(skip).limit(limit).toArray(),
      getCollection(Collections.FADRecords).countDocuments(filter)
    ])

    res.json({ success: true, data: records, total })
  } catch (error) {
    console.error('Get undelivered FAD error:', error)
    res.status(500).json({ success: false, error: '获取未发放FAD失败' })
  }
})

// FAD统计
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { semester, semesters, studentClass, sourceType } = req.query

    const baseFilter = { 是否已撤回: { $ne: true } }

    // 权限过滤逻辑
    // C和F组：完全不能访问
    if (req.user.group === 'C' || req.user.group === 'F') {
      return res.status(403).json({ success: false, error: '没有权限访问此功能' })
    }

    // B和T组：只能查看自己班级的统计
    if (req.user.group === 'B' || req.user.group === 'T') {
      // 获取用户作为班主任的班级
      const homeTeacherClass = await getCollection(Collections.AllClasses).findOne({
        HomeTeacherEmail: req.user.email
      })

      // 如果不是班主任，不能访问
      if (!homeTeacherClass) {
        return res.status(403).json({ success: false, error: '没有权限访问此功能' })
      }

      // 只能查看自己班级的统计
      baseFilter.班级 = homeTeacherClass.Class
    }

    // A和S组：可以查看所有班级的统计

    // 学期过滤：支持单选和多选
    if (semesters) {
      // 处理不同格式的数组参数
      let semesterArray = []
      if (Array.isArray(semesters)) {
        semesterArray = semesters
      } else if (typeof semesters === 'string') {
        // 处理带索引后缀的格式，如 "秋季(Fall):1"
        const cleaned = semesters.replace(/:\d+$/, '')
        semesterArray = [cleaned]
      }

      if (semesterArray.length > 0) {
        baseFilter.学期 = { $in: semesterArray }
      }
    } else if (semester) {
      baseFilter.学期 = semester
    }

    // 来源类型筛选
    if (sourceType) {
      baseFilter.FAD来源类型 = sourceType
    }

    // 班级过滤
    if (studentClass) baseFilter.班级 = studentClass

    // 总体统计
    const [total, executed, delivered, offset] = await Promise.all([
      getCollection(Collections.FADRecords).countDocuments(baseFilter),
      getCollection(Collections.FADRecords).countDocuments({ ...baseFilter, 是否已执行或冲抵: true }),
      getCollection(Collections.FADRecords).countDocuments({ ...baseFilter, 是否已发放: true }),
      getCollection(Collections.FADRecords).countDocuments({ ...baseFilter, 是否已冲销记录: true })
    ])

    // 按来源类型统计
    const bySourceType = await getCollection(Collections.FADRecords).aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$FAD来源类型',
          count: { $sum: 1 },
          executed: { $sum: { $cond: ['$是否已执行或冲抵', 1, 0] } },
          delivered: { $sum: { $cond: ['$是否已发放', 1, 0] } },
          offset: { $sum: { $cond: ['$是否已冲销记录', 1, 0] } }
        }
      }
    ]).toArray()

    // 按班级统计
    const byClass = await getCollection(Collections.FADRecords).aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$班级',
          count: { $sum: 1 },
          executed: { $sum: { $cond: ['$是否已执行或冲抵', 1, 0] } },
          unexecuted: { $sum: { $cond: ['$是否已执行或冲抵', 0, 1] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]).toArray()

    // 按班级人均FAD统计
    const classFADData = await getCollection(Collections.FADRecords).aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$班级',
          fadCount: { $sum: 1 }
        }
      }
    ]).toArray()

    // 获取每个班级的学生人数
    const classStudentCount = await getCollection(Collections.Students).aggregate([
      {
        $group: {
          _id: '$班级',
          studentCount: { $sum: 1 }
        }
      }
    ]).toArray()

    // 合并数据并计算人均FAD
    const classStudentMap = new Map(
      classStudentCount.map(c => [c._id, c.studentCount])
    )

    const perClassStats = classFADData
      .map(c => {
        const studentCount = classStudentMap.get(c._id) || 0
        const avgFAD = studentCount > 0 ? (c.fadCount / studentCount).toFixed(2) : 0
        return {
          class: c._id,
          fadCount: c.fadCount,
          studentCount: studentCount,
          avgFAD: parseFloat(avgFAD)
        }
      })
      .sort((a, b) => b.avgFAD - a.avgFAD)
      .slice(0, 20) // Top 20

    // 按学生统计
    let studentFilter = { ...baseFilter }

    // 按来源类型筛选（只影响学生统计，不影响总体）
    if (sourceType) {
      studentFilter['FAD来源类型'] = sourceType
    }

    const byStudent = await getCollection(Collections.FADRecords).aggregate([
      { $match: studentFilter },
      {
        $group: {
          _id: { student: '$学生', class: '$班级' },
          count: { $sum: 1 },
          executed: { $sum: { $cond: ['$是否已执行或冲抵', 1, 0] } },
          unexecuted: { $sum: { $cond: ['$是否已执行或冲抵', 0, 1] } },
          offset: { $sum: { $cond: ['$是否已冲销记录', 1, 0] } },
          dorm: { $sum: { $cond: [{ $eq: ['$FAD来源类型', 'dorm'] }, 1, 0] } },
          teach: { $sum: { $cond: [{ $eq: ['$FAD来源类型', 'teach'] }, 1, 0] } },
          other: { $sum: { $cond: [{ $eq: ['$FAD来源类型', 'other'] }, 1, 0] } },
          details: { $push: '$$ROOT' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]).toArray()

    // 获取有未执行FAD的学生名单（只包含未执行的FAD记录）
    const unexecutedStudentFilter = {
      ...baseFilter,
      是否已执行或冲抵: false,
      是否已冲销记录: { $ne: true },
      是否已撤回: { $ne: true }
    }

    const unexecutedStudents = await getCollection(Collections.FADRecords).aggregate([
      { $match: unexecutedStudentFilter },
      {
        $group: {
          _id: { student: '$学生', class: '$班级' },
          unexecutedCount: { $sum: 1 },
          records: { $push: '$$ROOT' }
        }
      },
      { $sort: { unexecutedCount: -1 } }
    ]).toArray()

    res.json({
      success: true,
      data: {
        total,
        executed,
        delivered,
        offset,
        bySourceType: bySourceType.map(s => ({
          type: s._id || 'other',
          count: s.count,
          executed: s.executed,
          delivered: s.delivered,
          offset: s.offset
        })),
        byClass: byClass.map(c => ({
          class: c._id,
          count: c.count,
          executed: c.executed,
          unexecuted: c.unexecuted
        })),
        perClass: perClassStats,
        byStudent: byStudent.map(s => ({
          student: s._id.student,
          class: s._id.class,
          count: s.count,
          executed: s.executed,
          unexecuted: s.unexecuted,
          offset: s.offset,
          dorm: s.dorm,
          teach: s.teach,
          other: s.other,
          details: s.details || []
        })),
        unexecutedStudents: unexecutedStudents.map(s => ({
          student: s._id.student,
          class: s._id.class,
          unexecutedCount: s.unexecutedCount,
          records: s.records
        }))
      }
    })
  } catch (error) {
    console.error('Get FAD stats error:', error)
    res.status(500).json({ success: false, error: '获取FAD统计失败' })
  }
})

// 执行FAD
router.put('/:id/execute', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const result = await getCollection(Collections.FADRecords).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          是否已执行或冲抵: true,
          执行日期: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'FAD记录不存在' })
    }

    res.json({ success: true, message: 'FAD执行成功' })
  } catch (error) {
    console.error('Execute FAD error:', error)
    res.status(500).json({ success: false, error: 'FAD执行失败' })
  }
})

// 发放FAD通知单
router.put('/:id/deliver', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { deliverTeacher } = req.body

    const result = await getCollection(Collections.FADRecords).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          是否已发放: true,
          发放日期: new Date(),
          发放老师: deliverTeacher || req.user.name
        }
      }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'FAD记录不存在' })
    }

    res.json({
      success: true,
      data: {
        是否已发放: true,
        发放日期: new Date(),
        发放老师: deliverTeacher || req.user.name
      }
    })
  } catch (error) {
    console.error('Deliver FAD error:', error)
    res.status(500).json({ success: false, error: 'FAD发放失败' })
  }
})

// 学生会FAD记录
router.get('/student-union', authMiddleware, async (req, res) => {
  try {
    const { semester, page = 1, pageSize = 20 } = req.query

    // 先获取学生会成员
    const studentUnionMembers = await getCollection(Collections.Students)
      .find({ 学生会: true })
      .toArray()

    const memberNames = studentUnionMembers.map(s => s.学生姓名)

    const filter = {
      学生: { $in: memberNames },
      是否已撤回: { $ne: true }
    }

    if (semester) filter.学期 = semester

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const [records, total] = await Promise.all([
      getCollection(Collections.FADRecords).find(filter).sort({ 记录日期: -1 }).skip(skip).limit(limit).toArray(),
      getCollection(Collections.FADRecords).countDocuments(filter)
    ])

    res.json({ success: true, data: records, total })
  } catch (error) {
    console.error('Get student union FAD error:', error)
    res.status(500).json({ success: false, error: '获取学生会FAD记录失败' })
  }
})

module.exports = router
