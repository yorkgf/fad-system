const { Router } = require('express')
const { ObjectId } = require('mongodb')
const { authMiddleware } = require('../utils/auth.js')
const { getCollection, Collections } = require('../utils/db.js')
const { UserGroup, COMPETITION_MANAGE_GROUPS } = require('../utils/userGroups.js')

const router = Router()

// ==================== 竞赛日历 CRUD ====================

/**
 * GET /public-events
 * 公开查询竞赛事件列表（无需登录）
 * Query params: start, end (ISO date range), category, search
 */
router.get('/public-events', async (req, res) => {
  try {
    const { start, end, category, search } = req.query
    const filter = {}

    if (start && end) {
      filter['竞赛开始日期'] = { $lte: new Date(end) }
      filter['竞赛结束日期'] = { $gte: new Date(start) }
    }

    if (category) {
      filter['竞赛类别'] = category
    }

    if (search) {
      filter['竞赛名称'] = { $regex: search, $options: 'i' }
    }

    const events = await getCollection(Collections.CompetitionEvents)
      .find(filter)
      .sort({ '竞赛开始日期': 1 })
      .toArray()

    res.json({ success: true, data: events })
  } catch (error) {
    console.error('获取竞赛事件失败:', error)
    res.status(500).json({ success: false, error: '获取竞赛事件失败' })
  }
})

/**
 * GET /events
 * 查询竞赛事件列表（需登录）
 * Query params: start, end (ISO date range), category, search
 */
router.get('/events', authMiddleware, async (req, res) => {
  try {
    const { start, end, category, search } = req.query
    const filter = {}

    // 日期范围过滤：查找与查询范围重叠的事件
    if (start && end) {
      filter['竞赛开始日期'] = { $lte: new Date(end) }
      filter['竞赛结束日期'] = { $gte: new Date(start) }
    }

    // 类别精确匹配
    if (category) {
      filter['竞赛类别'] = category
    }

    // 名称搜索（模糊匹配）
    if (search) {
      filter['竞赛名称'] = { $regex: search, $options: 'i' }
    }

    const events = await getCollection(Collections.CompetitionEvents)
      .find(filter)
      .sort({ '竞赛开始日期': 1 })
      .toArray()

    res.json({ success: true, data: events })
  } catch (error) {
    console.error('获取竞赛事件失败:', error)
    res.status(500).json({ success: false, error: '获取竞赛事件失败' })
  }
})

/**
 * POST /events
 * 创建竞赛事件
 */
router.post('/events', authMiddleware, async (req, res) => {
  try {
    // 权限检查
    if (!COMPETITION_MANAGE_GROUPS.includes(req.user.group)) {
      return res.status(403).json({ success: false, error: '没有竞赛管理权限' })
    }

    const {
      竞赛名称, 竞赛类别, 竞赛开始日期, 竞赛结束日期,
      报名开始日期, 报名截止日期, 参与对象, 地点, 报名链接, 描述
    } = req.body

    // 必填字段验证
    if (!竞赛名称 || !竞赛类别 || !竞赛开始日期 || !竞赛结束日期) {
      return res.status(400).json({ success: false, error: '竞赛名称、类别、开始日期和结束日期为必填项' })
    }

    // 日期有效性验证
    const startDate = new Date(竞赛开始日期)
    const endDate = new Date(竞赛结束日期)
    if (endDate < startDate) {
      return res.status(400).json({ success: false, error: '竞赛结束日期不能早于开始日期' })
    }

    // 报名日期验证
    if (报名开始日期 && 报名截止日期) {
      const regStart = new Date(报名开始日期)
      const regEnd = new Date(报名截止日期)
      if (regEnd < regStart) {
        return res.status(400).json({ success: false, error: '报名截止日期不能早于报名开始日期' })
      }
    }

    const now = new Date()
    const event = {
      竞赛名称,
      竞赛类别,
      竞赛开始日期: startDate,
      竞赛结束日期: endDate,
      报名开始日期: 报名开始日期 ? new Date(报名开始日期) : null,
      报名截止日期: 报名截止日期 ? new Date(报名截止日期) : null,
      参与对象: 参与对象 || null,
      地点: 地点 || null,
      报名链接: 报名链接 || null,
      描述: 描述 || null,
      创建人: req.user.name,
      创建人组别: req.user.group,
      创建时间: now,
      更新时间: now
    }

    const result = await getCollection(Collections.CompetitionEvents).insertOne(event)

    res.json({ success: true, data: { ...event, _id: result.insertedId } })
  } catch (error) {
    console.error('创建竞赛事件失败:', error)
    res.status(500).json({ success: false, error: '创建竞赛事件失败' })
  }
})

/**
 * PUT /events/:id
 * 更新竞赛事件
 */
router.put('/events/:id', authMiddleware, async (req, res) => {
  try {
    // 权限检查
    if (!COMPETITION_MANAGE_GROUPS.includes(req.user.group)) {
      return res.status(403).json({ success: false, error: '没有竞赛管理权限' })
    }

    // ObjectId 验证
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: '无效的事件ID' })
    }

    const collection = getCollection(Collections.CompetitionEvents)
    const existing = await collection.findOne({ _id: new ObjectId(req.params.id) })

    if (!existing) {
      return res.status(404).json({ success: false, error: '竞赛事件不存在' })
    }

    // 所有者检查：非系统管理员只能编辑自己创建的事件
    if (req.user.group !== UserGroup.SYSTEM && existing.创建人 !== req.user.name) {
      return res.status(403).json({ success: false, error: '只能编辑自己创建的竞赛事件' })
    }

    const {
      竞赛名称, 竞赛类别, 竞赛开始日期, 竞赛结束日期,
      报名开始日期, 报名截止日期, 参与对象, 地点, 报名链接, 描述
    } = req.body

    // 必填字段验证
    if (!竞赛名称 || !竞赛类别 || !竞赛开始日期 || !竞赛结束日期) {
      return res.status(400).json({ success: false, error: '竞赛名称、类别、开始日期和结束日期为必填项' })
    }

    // 日期有效性验证
    const startDate = new Date(竞赛开始日期)
    const endDate = new Date(竞赛结束日期)
    if (endDate < startDate) {
      return res.status(400).json({ success: false, error: '竞赛结束日期不能早于开始日期' })
    }

    // 报名日期验证
    if (报名开始日期 && 报名截止日期) {
      const regStart = new Date(报名开始日期)
      const regEnd = new Date(报名截止日期)
      if (regEnd < regStart) {
        return res.status(400).json({ success: false, error: '报名截止日期不能早于报名开始日期' })
      }
    }

    const updateData = {
      竞赛名称,
      竞赛类别,
      竞赛开始日期: startDate,
      竞赛结束日期: endDate,
      报名开始日期: 报名开始日期 ? new Date(报名开始日期) : null,
      报名截止日期: 报名截止日期 ? new Date(报名截止日期) : null,
      参与对象: 参与对象 || null,
      地点: 地点 || null,
      报名链接: 报名链接 || null,
      描述: 描述 || null,
      更新时间: new Date()
    }

    await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    )

    res.json({ success: true, data: { ...existing, ...updateData } })
  } catch (error) {
    console.error('更新竞赛事件失败:', error)
    res.status(500).json({ success: false, error: '更新竞赛事件失败' })
  }
})

/**
 * DELETE /events/:id
 * 删除竞赛事件
 */
router.delete('/events/:id', authMiddleware, async (req, res) => {
  try {
    // 权限检查
    if (!COMPETITION_MANAGE_GROUPS.includes(req.user.group)) {
      return res.status(403).json({ success: false, error: '没有竞赛管理权限' })
    }

    // ObjectId 验证
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: '无效的事件ID' })
    }

    const collection = getCollection(Collections.CompetitionEvents)
    const existing = await collection.findOne({ _id: new ObjectId(req.params.id) })

    if (!existing) {
      return res.status(404).json({ success: false, error: '竞赛事件不存在' })
    }

    // 所有者检查：非系统管理员只能删除自己创建的事件
    if (req.user.group !== UserGroup.SYSTEM && existing.创建人 !== req.user.name) {
      return res.status(403).json({ success: false, error: '只能删除自己创建的竞赛事件' })
    }

    await collection.deleteOne({ _id: new ObjectId(req.params.id) })

    res.json({ success: true })
  } catch (error) {
    console.error('删除竞赛事件失败:', error)
    res.status(500).json({ success: false, error: '删除竞赛事件失败' })
  }
})

module.exports = router
