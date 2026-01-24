const jwt = require('jsonwebtoken')
const { getCollection, Collections } = require('./db.js')

const JWT_SECRET = process.env.JWT_SECRET || 'fad-secret-key-2024'
const JWT_EXPIRES_IN = '7d'

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
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
