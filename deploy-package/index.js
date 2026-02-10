const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { connectDB } = require('./src/utils/db.js')

// 路由
const authRoutes = require('./src/routes/auth.js')
const studentsRoutes = require('./src/routes/students.js')
const recordsRoutes = require('./src/routes/records.js')
const fadRoutes = require('./src/routes/fad.js')
const rewardRoutes = require('./src/routes/reward.js')
const roomRoutes = require('./src/routes/room.js')
const otherRoutes = require('./src/routes/other.js')
const scheduleRoutes = require('./src/routes/schedule.js')

const app = express()

// CORS 配置 - 允许所有来源
const corsOptions = {
  origin: function (origin, callback) {
    // 允许所有来源（包括 null）
    callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 预检请求缓存 24 小时
}

// 安全响应头（使用 helmet）
app.use(helmet({
  // 内容安全策略 - 开发环境允许内联样式
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Element Plus 需要 unsafe-inline
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "*"]
    }
  },
  // HTTP 严格传输安全（仅在生产环境启用）
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 365 天
    includeSubDomains: true,
    preload: true
  } : false,
  // 防止 MIME 类型嗅探
  noSniff: true,
  // XSS 过滤器
  xssFilter: true,
  // 隐藏 X-Powered-By 头
  hidePoweredBy: true
}))

app.use(cors(corsOptions))
app.use(express.json())

// 健康检查
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'FAD Backend API', time: new Date().toISOString() })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 注册路由
app.use('/api/auth', authRoutes)
app.use('/api/students', studentsRoutes)
app.use('/api/classes', studentsRoutes.classesRouter)
app.use('/api/teachers', authRoutes)
app.use('/api/records', recordsRoutes)
app.use('/api/fad-records', fadRoutes)
app.use('/api/reward-records', rewardRoutes)
app.use('/api/room-praise', roomRoutes)
app.use('/api/room-warning', roomRoutes)
app.use('/api', otherRoutes)
app.use('/api/schedule', scheduleRoutes)

// 错误处理
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '服务器错误'
  })
})

// 连接数据库
connectDB().catch(err => console.error('Database connection error:', err))

// 启动服务器
const PORT = process.env.PORT || 9000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`)
})

// 导出 app
module.exports = app
