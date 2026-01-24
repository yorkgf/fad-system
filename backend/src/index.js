const express = require('express')
const cors = require('cors')
const serverless = require('serverless-http')
const { connectDB } = require('./utils/db.js')

// 路由
const authRoutes = require('./routes/auth.js')
const studentsRoutes = require('./routes/students.js')
const recordsRoutes = require('./routes/records.js')
const fadRoutes = require('./routes/fad.js')
const rewardRoutes = require('./routes/reward.js')
const roomRoutes = require('./routes/room.js')
const otherRoutes = require('./routes/other.js')

const app = express()

app.use(cors())
app.use(express.json())

// 连接数据库
connectDB().catch(err => console.error('Database connection error:', err))

// 注册路由
app.use('/api/auth', authRoutes)
app.use('/api/students', studentsRoutes)
app.use('/api/classes', studentsRoutes)
app.use('/api/teachers', authRoutes)
app.use('/api/records', recordsRoutes)
app.use('/api/fad-records', fadRoutes)
app.use('/api/reward-records', rewardRoutes)
app.use('/api/room-praise', roomRoutes)
app.use('/api/room-warning', roomRoutes)
app.use('/api', otherRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '服务器错误'
  })
})

const PORT = process.env.PORT || 8080

// 本地开发时启动服务器
if (!process.env.SCF_ENVIRONMENT) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

// 云函数/Serverless Framework 入口
const handler = serverless(app)
module.exports.handler = handler
module.exports = app
