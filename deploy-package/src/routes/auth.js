const { Router } = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { getCollection, Collections } = require('../utils/db.js')
const { generateToken, authMiddleware } = require('../utils/auth.js')
const { sendPasswordEmail } = require('../utils/email.js')

const router = Router()

/**
 * 自动迁移明文密码到 bcrypt
 * 当用户使用明文密码登录成功后，自动升级为 bcrypt 哈希
 * @param {Object} teacher - 教师对象
 * @param {string} plaintextPassword - 明文密码
 * @returns {Promise<boolean>} - 是否进行了迁移
 */
async function migratePasswordIfNeeded(teacher, plaintextPassword) {
  // 如果密码已经是 bcrypt 哈希（以 $2 开头），无需迁移
  if (teacher.Password.startsWith('$2')) {
    return false
  }

  console.log(`Migrating plaintext password for teacher: ${teacher.email}`)

  // 使用 bcrypt 哈希明文密码
  const hashedPassword = await bcrypt.hash(plaintextPassword, 10)

  // 更新数据库
  await getCollection(Collections.Teachers).updateOne(
    { email: teacher.email },
    { $set: { Password: hashedPassword } }
  )

  console.log(`Password migration completed for: ${teacher.email}`)
  return true
}

/**
 * 生成安全的随机密码
 * 使用 crypto.randomInt() 确保密码强度
 * @returns {string} - 16 位安全密码，包含大小写字母、数字、特殊字符
 */
function generateSecurePassword() {
  const chars = {
    upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',    // 排除 I, O 避免混淆
    lower: 'abcdefghijkmnpqrstuvwxyz',    // 排除 l, o 避免混淆
    numbers: '23456789',                  // 排除 0, 1 避免混淆
    special: '!@#$%^&*'                   // 常用特殊字符
  }

  // 确保至少包含每种类型
  let password = ''
  password += chars.upper[crypto.randomInt(chars.upper.length)]
  password += chars.lower[crypto.randomInt(chars.lower.length)]
  password += chars.numbers[crypto.randomInt(chars.numbers.length)]
  password += chars.special[crypto.randomInt(chars.special.length)]

  // 填充剩余位数到 16 位
  const allChars = chars.upper + chars.lower + chars.numbers + chars.special
  for (let i = 4; i < 16; i++) {
    password += allChars[crypto.randomInt(allChars.length)]
  }

  // 打乱密码顺序
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('')
}

/**
 * 验证密码强度
 * @param {string} password - 待验证的密码
 * @returns {{valid: boolean, errors: string[]}} - 验证结果和错误信息
 */
function validatePasswordStrength(password) {
  const errors = []

  if (password.length < 8) {
    errors.push('密码至少需要8位')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('需包含大写字母')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('需包含小写字母')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('需包含数字')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('需包含特殊字符')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

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
    let wasMigrated = false

    if (teacher.Password.startsWith('$2')) {
      // 密码已加密，使用 bcrypt 验证
      isValid = await bcrypt.compare(password, teacher.Password)
    } else {
      // 密码未加密（旧数据），明文比较
      isValid = teacher.Password === password

      // 如果验证成功且使用明文密码，自动迁移到 bcrypt
      if (isValid) {
        wasMigrated = await migratePasswordIfNeeded(teacher, password)
      }
    }

    if (!isValid) {
      return res.status(401).json({ success: false, error: '密码错误' })
    }

    const token = generateToken({ email: teacher.email, name: teacher.Name })

    res.json({
      success: true,
      token,
      name: teacher.Name,
      group: teacher.Group,
      requiresPasswordChange: wasMigrated // 如果进行了密码迁移，通知前端
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

    // 生成安全的随机密码（16位，包含大小写字母、数字、特殊字符）
    const newPassword = generateSecurePassword()
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await getCollection(Collections.Teachers).updateOne(
      { email },
      {
        $set: {
          Password: hashedPassword,
          forcePasswordChange: true  // 标记需要强制修改密码
        }
      }
    )

    console.log(`Password reset for: ${email}`)

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
      {
        $set: {
          Password: hashedPassword,
          forcePasswordChange: false  // 清除强制修改密码标记
        }
      }
    )

    console.log(`Password changed for: ${req.user.email}`)

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
    // Group字段可能是字符串或数组，需要两种查询方式
    const recordTypes = await getCollection(Collections.RecordType)
      .find({
        $or: [
          { Group: req.user.group },           // 字符串匹配
          { Group: { $in: [req.user.group] } }, // 数组包含匹配
          { Group: 'ALL' },                    // 全部用户
          ...(req.user.group === 'S' ? [{}] : []) // S组用户可访问所有
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
