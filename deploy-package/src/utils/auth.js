const jwt = require('jsonwebtoken')
const { getCollection, Collections } = require('./db.js')

// JWT 配置 - 支持新旧密钥平滑迁移
const JWT_SECRET = process.env.JWT_SECRET
const JWT_SECRET_OLD = process.env.JWT_SECRET_OLD // 用于迁移期兼容旧 token
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

/**
 * 生成 JWT token
 * 优先使用新密钥，如果没有则使用旧密钥
 */
function generateToken(payload) {
  const secret = JWT_SECRET || JWT_SECRET_OLD
  if (!secret) {
    throw new Error('JWT_SECRET or JWT_SECRET_OLD must be configured in environment variables')
  }
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * 验证 JWT token
 * 先尝试新密钥，失败则尝试旧密钥（兼容期）
 * 迁移期结束后可移除 JWT_SECRET_OLD 相关代码
 */
function verifyToken(token) {
  // 尝试使用新密钥验证
  if (JWT_SECRET) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (e) {
      // 继续尝试旧密钥
    }
  }

  // 尝试使用旧密钥验证（迁移期兼容）
  if (JWT_SECRET_OLD) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET_OLD)
      // 记录警告，便于追踪仍在使用旧 token 的情况
      console.warn('Token verified with old JWT_SECRET - consider user re-login')
      return decoded
    } catch (e) {
      // 旧密钥也失败
    }
  }

  // 两种密钥都失败
  return null
}

// 认证中间件
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未登录' })
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ success: false, error: '登录已过期' })
  }

  // 获取用户信息
  const teacher = await getCollection(Collections.Teachers).findOne({
    email: decoded.email
  })

  if (!teacher) {
    return res.status(401).json({ success: false, error: '用户不存在' })
  }

  req.user = {
    email: teacher.email,
    name: teacher.Name,
    group: teacher.Group
  }

  next()
}

// 管理员权限中间件
function adminMiddleware(req, res, next) {
  if (req.user.group !== 'S') {
    return res.status(403).json({ success: false, error: '需要管理员权限' })
  }
  next()
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  adminMiddleware
}
