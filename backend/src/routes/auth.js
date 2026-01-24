const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { getCollection, Collections } = require('../utils/db.js')
const { generateToken, authMiddleware } = require('../utils/auth.js')
const { sendPasswordEmail } = require('../utils/email.js')

const router = Router()

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email) {
      return res.status(400).json({ success: false, error: '请输入邮箱地址' })
    }

    const teacher = await getCollection(Collections.Teachers).findOne({ email })

    if (!teacher) {
      return res.status(401).json({ success: false, error: '未授权用户' })
    }

    // 验证密码（支持明文和加密两种方式）
    let isValid = false
    if (teacher.Password.startsWith('$2')) {
      isValid = await bcrypt.compare(password, teacher.Password)
    } else {
      isValid = teacher.Password === password
    }

    if (!isValid) {
      return res.status(401).json({ success: false, error: '密码错误' })
    }

    const token = generateToken({ email: teacher.email, name: teacher.Name })

    res.json({
      success: true,
      token,
      name: teacher.Name,
      group: teacher.Group
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

// 重置密码
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, error: '请输入邮箱地址' })
    }

    const teacher = await getCollection(Collections.Teachers).findOne({ email })

    if (!teacher) {
      return res.status(404).json({ success: false, error: '未授权用户' })
    }

    // 生成新密码
    const newPassword = Math.random().toString(36).substring(2, 8)
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await getCollection(Collections.Teachers).updateOne(
      { email },
      { $set: { Password: hashedPassword } }
    )

    // 发送邮件
    await sendPasswordEmail({ to: email, newPassword })

    res.json({ success: true, message: '新密码已发送至邮箱' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ success: false, error: '重置密码失败' })
  }
})

// 修改密码
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: '请输入密码' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: '新密码长度不能少于6位' })
    }

    const teacher = await getCollection(Collections.Teachers).findOne({
      email: req.user.email
    })

    // 验证旧密码
    let isValid = false
    if (teacher.Password.startsWith('$2')) {
      isValid = await bcrypt.compare(oldPassword, teacher.Password)
    } else {
      isValid = teacher.Password === oldPassword
    }

    if (!isValid) {
      return res.status(401).json({ success: false, error: '当前密码错误' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await getCollection(Collections.Teachers).updateOne(
      { email: req.user.email },
      { $set: { Password: hashedPassword } }
    )

    res.json({ success: true, message: '密码修改成功' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ success: false, error: '修改密码失败' })
  }
})

// 获取当前用户信息
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    success: true,
    name: req.user.name,
    email: req.user.email,
    group: req.user.group
  })
})

// 获取当前用户可用的记录类型
router.get('/me/record-types', authMiddleware, async (req, res) => {
  try {
    const recordTypes = await getCollection(Collections.RecordType)
      .find({
        $or: [
          { Group: req.user.group },
          { Group: 'ALL' },
          ...(req.user.group === 'S' ? [{}] : [])
        ]
      })
      .toArray()

    res.json({
      success: true,
      data: recordTypes.map(r => ({
        value: r.记录类型,
        label: r.记录类型,
        group: r.Group
      }))
    })
  } catch (error) {
    console.error('Get record types error:', error)
    res.status(500).json({ success: false, error: '获取记录类型失败' })
  }
})

module.exports = router
