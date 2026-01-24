const { Router } = require('express')
const { ObjectId } = require('mongodb')
const { getCollection, Collections } = require('../utils/db.js')
const { authMiddleware } = require('../utils/auth.js')

const router = Router()

// 获取Reward记录
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      semester,
      delivered,
      student,
      page = 1,
      pageSize = 20
    } = req.query

    const filter = { 是否已撤回: { $ne: true } }

    if (semester) filter.学期 = semester
    if (delivered === 'true') filter.是否已发放 = true
    if (delivered === 'false') filter.是否已发放 = { $ne: true }
    if (student) filter.学生 = { $regex: student, $options: 'i' }

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const [records, total] = await Promise.all([
      getCollection(Collections.RewardRecords).find(filter).sort({ 记录日期: -1 }).skip(skip).limit(limit).toArray(),
      getCollection(Collections.RewardRecords).countDocuments(filter)
    ])

    res.json({ success: true, data: records, total })
  } catch (error) {
    console.error('Get Reward records error:', error)
    res.status(500).json({ success: false, error: '获取Reward记录失败' })
  }
})

// 获取未发放的Reward
router.get('/undelivered', authMiddleware, async (req, res) => {
  try {
    const { semester, page = 1, pageSize = 20 } = req.query

    const filter = {
      是否已发放: { $ne: true },
      是否已撤回: { $ne: true }
    }

    if (semester) filter.学期 = semester

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const [records, total] = await Promise.all([
      getCollection(Collections.RewardRecords).find(filter).sort({ 记录日期: -1 }).skip(skip).limit(limit).toArray(),
      getCollection(Collections.RewardRecords).countDocuments(filter)
    ])

    res.json({ success: true, data: records, total })
  } catch (error) {
    console.error('Get undelivered Reward error:', error)
    res.status(500).json({ success: false, error: '获取未发放Reward失败' })
  }
})

// 发放Reward通知单
router.put('/:id/deliver', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { deliverTeacher } = req.body

    const result = await getCollection(Collections.RewardRecords).updateOne(
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
      return res.status(404).json({ success: false, error: 'Reward记录不存在' })
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
    console.error('Deliver Reward error:', error)
    res.status(500).json({ success: false, error: 'Reward发放失败' })
  }
})

module.exports = router
