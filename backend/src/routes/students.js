const { Router } = require('express')
const { ObjectId } = require('mongodb')
const { getCollection, Collections } = require('../utils/db.js')
const { authMiddleware } = require('../utils/auth.js')

const router = Router()

// 获取学生列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { class: studentClass, search, dorm } = req.query
    const filter = {}

    if (studentClass) {
      filter.班级 = studentClass
    }

    if (search) {
      filter.学生姓名 = { $regex: search, $options: 'i' }
    }

    if (dorm) {
      // 寝室是Int32类型，需要转换为数字
      filter.寝室 = parseInt(dorm)
    }

    const students = await getCollection(Collections.Students)
      .find(filter)
      .sort({ 学生姓名: 1 })
      .toArray()

    res.json({
      success: true,
      data: students
    })
  } catch (error) {
    console.error('Get students error:', error)
    res.status(500).json({ success: false, error: '获取学生列表失败' })
  }
})

// 获取学生详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const student = await getCollection(Collections.Students).findOne({
      _id: new ObjectId(req.params.id)
    })

    if (!student) {
      return res.status(404).json({ success: false, error: '学生不存在' })
    }

    res.json({ success: true, data: student })
  } catch (error) {
    console.error('Get student error:', error)
    res.status(500).json({ success: false, error: '获取学生信息失败' })
  }
})

// 获取班级列表
router.get('/classes', authMiddleware, async (req, res) => {
  try {
    const classes = await getCollection(Collections.AllClasses)
      .find({})
      .sort({ Class: 1 })
      .toArray()

    res.json({ success: true, data: classes })
  } catch (error) {
    console.error('Get classes error:', error)
    res.status(500).json({ success: false, error: '获取班级列表失败' })
  }
})

// 获取班主任邮箱
router.get('/classes/:name/home-teacher', authMiddleware, async (req, res) => {
  try {
    const classInfo = await getCollection(Collections.AllClasses).findOne({
      Class: decodeURIComponent(req.params.name)
    })

    if (!classInfo) {
      return res.status(404).json({ success: false, error: '班级不存在' })
    }

    res.json({
      success: true,
      data: { email: classInfo.HomeTeacherEmail }
    })
  } catch (error) {
    console.error('Get home teacher error:', error)
    res.status(500).json({ success: false, error: '获取班主任信息失败' })
  }
})

// 导出班级路由（用于 /api/classes）
const classesRouter = Router()
classesRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const classes = await getCollection(Collections.AllClasses)
      .find({})
      .sort({ Class: 1 })
      .toArray()

    res.json({ success: true, data: classes })
  } catch (error) {
    console.error('Get classes error:', error)
    res.status(500).json({ success: false, error: '获取班级列表失败' })
  }
})

// 获取当前用户作为班主任的班级信息
classesRouter.get('/my-home-class', authMiddleware, async (req, res) => {
  try {
    const classInfo = await getCollection(Collections.AllClasses).findOne({
      HomeTeacherEmail: req.user.email
    })

    if (!classInfo) {
      // 非班主任用户返回isHomeTeacher: false，而不是404错误
      return res.json({ success: true, data: null, isHomeTeacher: false })
    }

    res.json({ success: true, data: classInfo, isHomeTeacher: true })
  } catch (error) {
    console.error('Get home teacher class error:', error)
    res.status(500).json({ success: false, error: '获取班主任班级信息失败' })
  }
})

classesRouter.get('/:name/home-teacher', authMiddleware, async (req, res) => {
  try {
    const classInfo = await getCollection(Collections.AllClasses).findOne({
      Class: decodeURIComponent(req.params.name)
    })

    if (!classInfo) {
      return res.status(404).json({ success: false, error: '班级不存在' })
    }

    res.json({
      success: true,
      data: { email: classInfo.HomeTeacherEmail }
    })
  } catch (error) {
    console.error('Get home teacher error:', error)
    res.status(500).json({ success: false, error: '获取班主任信息失败' })
  }
})

module.exports = router
module.exports.classesRouter = classesRouter
