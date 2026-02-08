const { Router } = require('express')
const { ObjectId } = require('mongodb')
const { authMiddleware } = require('../utils/auth.js')
const { getCollection, getGHSCollection, Collections, GHSCollections } = require('../utils/db.js')

const router = Router()

// 权限检查中间件：排除 C 组（清洁阿姨）
const scheduleAccessMiddleware = (req, res, next) => {
  const allowedGroups = ['S', 'A', 'B', 'T', 'F']
  if (!allowedGroups.includes(req.user.group)) {
    return res.status(403).json({ success: false, error: '无权限访问日程管理功能' })
  }
  next()
}

// ========== 教师信息同步/关联 ==========

// 获取当前登录教师在 GHS 中的信息（如果不存在则自动创建）
router.get('/me/ghs-profile', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    // 1. 从 GHA 获取教师详细信息
    const ghaTeacher = await getCollection(Collections.Teachers).findOne({ email: req.user.email })

    if (!ghaTeacher) {
      return res.status(404).json({ success: false, error: '教师信息不存在' })
    }

    // 2. 在 GHS 中查找或创建教师记录
    const ghsTeachers = getGHSCollection(GHSCollections.Teachers)
    let ghsTeacher = await ghsTeachers.findOne({ email: req.user.email })

    if (!ghsTeacher) {
      // 自动同步教师信息到 GHS
      const newTeacher = {
        email: req.user.email,
        name: ghaTeacher.Name,
        group: ghaTeacher.Group,
        grades: ghaTeacher.Grades || [],
        subjects: ghaTeacher.Subjects || [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = await ghsTeachers.insertOne(newTeacher)
      ghsTeacher = { ...newTeacher, _id: result.insertedId }
    }

    res.json({
      success: true,
      data: {
        ghaProfile: {
          email: ghaTeacher.email,
          name: ghaTeacher.Name,
          group: ghaTeacher.Group
        },
        ghsProfile: {
          ...ghsTeacher,
          meetingId: ghsTeacher.meetingId || '',
          meetingPassword: ghsTeacher.meetingPassword || ''
        },
        isScheduleEnabled: true
      }
    })
  } catch (error) {
    console.error('Get GHS profile error:', error)
    res.status(500).json({ success: false, error: '获取教师信息失败' })
  }
})

// 更新腾讯会议信息
router.put('/me/meeting', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    const { meetingId, meetingPassword } = req.body

    const ghsTeachers = getGHSCollection(GHSCollections.Teachers)
    await ghsTeachers.updateOne(
      { email: req.user.email },
      {
        $set: {
          meetingId: meetingId || '',
          meetingPassword: meetingPassword || '',
          updatedAt: new Date()
        }
      }
    )

    res.json({ success: true, message: '会议信息更新成功' })
  } catch (error) {
    console.error('Update meeting info error:', error)
    res.status(500).json({ success: false, error: '更新会议信息失败' })
  }
})

// 获取可预约教师列表（排除C组）
router.get('/teachers', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    const { search } = req.query

    // 从 GHA 获取符合条件的教师
    const filter = { Group: { $nin: ['C'] } }  // 排除C组
    if (search) {
      filter.$or = [
        { Name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    const teachers = await getCollection(Collections.Teachers)
      .find(filter)
      .project({ Name: 1, email: 1, Group: 1, Grades: 1, Subjects: 1 })
      .toArray()

    // 获取 GHS 中的教师日程设置
    const ghsTeachers = getGHSCollection(GHSCollections.Teachers)
    const ghsTeacherEmails = teachers.map(t => t.email)
    const ghsProfiles = await ghsTeachers
      .find({ email: { $in: ghsTeacherEmails }, isActive: true })
      .toArray()

    const activeEmails = new Set(ghsProfiles.map(p => p.email))

    res.json({
      success: true,
      data: teachers.map(t => ({
        id: t._id.toString(),
        name: t.Name,
        email: t.email,
        group: t.Group,
        grades: t.Grades || [],
        subjects: t.Subjects || [],
        isScheduleEnabled: activeEmails.has(t.email)
      }))
    })
  } catch (error) {
    console.error('Get teachers error:', error)
    res.status(500).json({ success: false, error: '获取教师列表失败' })
  }
})

// ========== 日程时段管理（Sessions）==========

// 获取教师的可预约时段
router.get('/sessions', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    const { teacherEmail, dateFrom, dateTo, includeBooked } = req.query

    const filter = {}
    if (teacherEmail) filter.teacherEmail = teacherEmail
    if (dateFrom || dateTo) {
      filter.date = {}
      if (dateFrom) filter.date.$gte = dateFrom
      if (dateTo) filter.date.$lte = dateTo
    }

    // 默认只返回可预约的时段
    if (includeBooked !== 'true') {
      filter.isActive = true
    }

    const sessions = await getGHSCollection(GHSCollections.Sessions)
      .find(filter)
      .sort({ date: 1, startTime: 1 })
      .toArray()

    res.json({ success: true, data: sessions })
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ success: false, error: '获取日程时段失败' })
  }
})

// 创建日程时段（教师设置自己的可预约时间）
router.post('/sessions', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    const { date, startTime, endTime, location, maxBookings = 1, note, meetingId, meetingPassword } = req.body

    // 验证必填字段
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ success: false, error: '日期和时间为必填项' })
    }

    // 验证时间冲突
    const existingSession = await getGHSCollection(GHSCollections.Sessions).findOne({
      teacherEmail: req.user.email,
      date: date,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    })

    if (existingSession) {
      return res.status(400).json({ success: false, error: '该时间段与现有日程冲突' })
    }

    const session = {
      teacherEmail: req.user.email,
      teacherName: req.user.name,
      date: date,
      startTime,
      endTime,
      location: location || '',
      meetingId: meetingId || '',
      meetingPassword: meetingPassword || '',
      maxBookings: parseInt(maxBookings) || 1,
      currentBookings: 0,
      note: note || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await getGHSCollection(GHSCollections.Sessions).insertOne(session)

    res.json({
      success: true,
      data: { ...session, _id: result.insertedId }
    })
  } catch (error) {
    console.error('Create session error:', error)
    res.status(500).json({ success: false, error: '创建日程时段失败' })
  }
})

// 批量创建日程时段
router.post('/sessions/batch', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    const { sessions } = req.body

    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({ success: false, error: '请至少提供一个时段' })
    }

    // 验证每个时段的数据
    for (const session of sessions) {
      if (!session.date || !session.startTime || !session.endTime) {
        return res.status(400).json({ success: false, error: '每个时段必须包含日期、开始时间和结束时间' })
      }
    }

    // 添加教师信息和默认值
    const sessionsWithMeta = sessions.map(session => ({
      teacherEmail: req.user.email,
      teacherName: req.user.name,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location || '',
      maxBookings: parseInt(session.maxBookings) || 1,
      currentBookings: 0,
      note: session.note || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    const result = await getGHSCollection(GHSCollections.Sessions).insertMany(sessionsWithMeta)

    res.json({
      success: true,
      message: `成功创建 ${result.insertedCount} 个日程时段`,
      data: { insertedCount: result.insertedCount }
    })
  } catch (error) {
    console.error('Batch create sessions error:', error)
    res.status(500).json({ success: false, error: '批量创建日程时段失败' })
  }
})

// 更新日程时段
router.put('/sessions/:id', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // 只能修改自己的时段（S组管理员除外）
    const session = await getGHSCollection(GHSCollections.Sessions).findOne({
      _id: new ObjectId(id)
    })

    if (!session) {
      return res.status(404).json({ success: false, error: '日程时段不存在' })
    }

    if (req.user.group !== 'S' && session.teacherEmail !== req.user.email) {
      return res.status(403).json({ success: false, error: '只能修改自己的日程' })
    }

    // 如果有预约，限制可修改的字段
    if (session.currentBookings > 0) {
      const allowedFields = ['note', 'location', 'meetingId', 'meetingPassword', 'isActive']
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) delete updateData[key]
      })
    }

    updateData.updatedAt = new Date()

    await getGHSCollection(GHSCollections.Sessions).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    res.json({ success: true, message: '更新成功' })
  } catch (error) {
    console.error('Update session error:', error)
    res.status(500).json({ success: false, error: '更新日程时段失败' })
  }
})

// 删除日程时段
router.delete('/sessions/:id', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const session = await getGHSCollection(GHSCollections.Sessions).findOne({
      _id: new ObjectId(id)
    })

    if (!session) {
      return res.status(404).json({ success: false, error: '日程时段不存在' })
    }

    if (req.user.group !== 'S' && session.teacherEmail !== req.user.email) {
      return res.status(403).json({ success: false, error: '只能删除自己的日程' })
    }

    if (session.currentBookings > 0) {
      return res.status(400).json({ success: false, error: '已有预约的日程不能删除' })
    }

    await getGHSCollection(GHSCollections.Sessions).deleteOne({
      _id: new ObjectId(id)
    })

    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('Delete session error:', error)
    res.status(500).json({ success: false, error: '删除日程时段失败' })
  }
})

// ========== 预约管理（Bookings）==========

// 获取预约列表
router.get('/bookings', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    const { teacherEmail, studentName, dateFrom, dateTo, status } = req.query

    const filter = {}
    if (teacherEmail) filter.teacherEmail = teacherEmail
    if (studentName) filter.studentName = { $regex: studentName, $options: 'i' }
    if (status) filter.status = status
    if (dateFrom || dateTo) {
      filter.bookingDate = {}
      if (dateFrom) filter.bookingDate.$gte = dateFrom
      if (dateTo) filter.bookingDate.$lte = dateTo
    }

    const bookings = await getGHSCollection(GHSCollections.Bookings)
      .find(filter)
      .sort({ bookingDate: -1, createdAt: -1 })
      .toArray()

    res.json({ success: true, data: bookings })
  } catch (error) {
    console.error('Get bookings error:', error)
    res.status(500).json({ success: false, error: '获取预约列表失败' })
  }
})

// 创建预约
router.post('/bookings', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    const { sessionId, studentName, studentClass, purpose, note, parentPhone, parentName } = req.body

    if (!sessionId || !studentName) {
      return res.status(400).json({ success: false, error: '时段和学生姓名为必填项' })
    }

    // 获取时段信息
    const session = await getGHSCollection(GHSCollections.Sessions).findOne({
      _id: new ObjectId(sessionId),
      isActive: true
    })

    if (!session) {
      return res.status(404).json({ success: false, error: '日程时段不存在或已停用' })
    }

    // 检查是否已满
    if (session.currentBookings >= session.maxBookings) {
      return res.status(400).json({ success: false, error: '该时段预约已满' })
    }

    // 检查是否重复预约
    const existingBooking = await getGHSCollection(GHSCollections.Bookings).findOne({
      sessionId: sessionId,
      studentName: studentName,
      status: { $nin: ['cancelled', 'completed'] }
    })

    if (existingBooking) {
      return res.status(400).json({ success: false, error: '该学生已预约此时段' })
    }

    const booking = {
      sessionId: sessionId,
      teacherEmail: session.teacherEmail,
      teacherName: session.teacherName,
      meetingId: session.meetingId || '',
      meetingPassword: session.meetingPassword || '',
      bookingDate: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      studentName,
      studentClass: studentClass || '',
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      bookedBy: req.user.email,
      bookedByName: req.user.name,
      purpose: purpose || '',
      note: note || '',
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await getGHSCollection(GHSCollections.Bookings).insertOne(booking)

    // 更新时段预约数
    await getGHSCollection(GHSCollections.Sessions).updateOne(
      { _id: new ObjectId(sessionId) },
      { $inc: { currentBookings: 1 } }
    )

    res.json({
      success: true,
      data: { ...booking, _id: result.insertedId }
    })
  } catch (error) {
    console.error('Create booking error:', error)
    res.status(500).json({ success: false, error: '创建预约失败' })
  }
})

// 更新预约状态
router.put('/bookings/:id', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { status, note } = req.body

    const booking = await getGHSCollection(GHSCollections.Bookings).findOne({
      _id: new ObjectId(id)
    })

    if (!booking) {
      return res.status(404).json({ success: false, error: '预约不存在' })
    }

    // 权限检查：预约创建者、对应教师或管理员可以修改
    const canModify =
      req.user.group === 'S' ||
      booking.bookedBy === req.user.email ||
      booking.teacherEmail === req.user.email

    if (!canModify) {
      return res.status(403).json({ success: false, error: '无权限修改此预约' })
    }

    const updateData = { updatedAt: new Date() }
    if (status) updateData.status = status
    if (note !== undefined) updateData.note = note

    await getGHSCollection(GHSCollections.Bookings).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    // 如果取消预约，减少时段预约数
    if (status === 'cancelled' && booking.status !== 'cancelled') {
      await getGHSCollection(GHSCollections.Sessions).updateOne(
        { _id: new ObjectId(booking.sessionId) },
        { $inc: { currentBookings: -1 } }
      )
    }

    res.json({ success: true, message: '更新成功' })
  } catch (error) {
    console.error('Update booking error:', error)
    res.status(500).json({ success: false, error: '更新预约失败' })
  }
})

// 获取"我的日程"（作为被预约教师）
router.get('/my-sessions', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    const { dateFrom, dateTo, includeHistory } = req.query

    // 从 GHA 获取当前教师信息
    const ghaTeacher = await getCollection(Collections.Teachers).findOne({ email: req.user.email })
    const teacherName = ghaTeacher?.Name || req.user.name

    // 查询条件：同时按 teacherEmail 和 teacherName 查询（兼容历史数据）
    const dateFilter = {}
    if (dateFrom || dateTo) {
      dateFilter.date = {}
      if (dateFrom) dateFilter.date.$gte = dateFrom
      if (dateTo) dateFilter.date.$lte = dateTo
    }

    const filter = {
      $and: [
        dateFilter,
        {
          $or: [
            { teacherEmail: req.user.email },
            { teacherName: teacherName }
          ]
        }
      ]
    }

    const sessions = await getGHSCollection(GHSCollections.Sessions)
      .find(filter)
      .sort({ date: 1, startTime: 1 })
      .toArray()

    let filteredSessions = sessions

    // 如果不包含历史记录，过滤掉已经过去的时段
    if (includeHistory !== 'true') {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')

      filteredSessions = sessions.filter(session => {
        // 如果日期早于今天，过滤掉
        if (session.date < today) return false
        // 如果是今天且结束时间早于当前时间，过滤掉
        if (session.date === today && session.endTime < currentTime) return false
        return true
      })
    }

    // 获取每个时段的预约详情
    const sessionsWithBookings = await Promise.all(
      filteredSessions.map(async (session) => {
        // 1. 先从 Bookings 集合查询（新数据）
        let bookings = await getGHSCollection(GHSCollections.Bookings)
          .find({ sessionId: session._id.toString(), status: { $ne: 'cancelled' } })
          .toArray()

        // 2. 如果没有 bookings 记录，但有 bookedBy 字段（历史数据），构建预约信息
        if (bookings.length === 0 && session.bookedBy && session.bookedBy.trim() !== '' && session.bookedBy !== '老师关闭') {
          bookings = [{
            _id: 'legacy_' + session._id,
            sessionId: session._id.toString(),
            teacherEmail: session.teacherEmail || req.user.email,
            teacherName: session.teacherName,
            bookingDate: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
            location: session.location,
            studentName: session.studentName || '',
            parentName: session.bookedBy,
            parentPhone: session.parentPhone || '',
            status: 'confirmed',
            note: session.note || '',
            isLegacy: true  // 标记为历史数据
          }]
        }

        return { ...session, bookings }
      })
    )

    res.json({ success: true, data: sessionsWithBookings })
  } catch (error) {
    console.error('Get my sessions error:', error)
    res.status(500).json({ success: false, error: '获取我的日程失败' })
  }
})

// 获取"我的预约"（作为预约创建者）
router.get('/my-bookings', authMiddleware, scheduleAccessMiddleware, async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query

    const filter = { bookedBy: req.user.email }
    if (status) filter.status = status
    if (dateFrom || dateTo) {
      filter.bookingDate = {}
      if (dateFrom) filter.bookingDate.$gte = dateFrom
      if (dateTo) filter.bookingDate.$lte = dateTo
    }

    const bookings = await getGHSCollection(GHSCollections.Bookings)
      .find(filter)
      .sort({ bookingDate: -1, startTime: 1 })
      .toArray()

    res.json({ success: true, data: bookings })
  } catch (error) {
    console.error('Get my bookings error:', error)
    res.status(500).json({ success: false, error: '获取我的预约失败' })
  }
})

module.exports = router
