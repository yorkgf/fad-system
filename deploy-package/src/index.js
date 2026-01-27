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

// 健康检查
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

// 云函数入口 - 导出 serverless-http handler
module.exports.handler = serverless(app)

// 如果直接运行（本地开发）
const PORT = process.env.PORT || 8080
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`)
  })
}
