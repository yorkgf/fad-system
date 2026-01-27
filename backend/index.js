const express = require('express')
const cors = require('cors')
const { connectDB } = require('./src/utils/db.js')

// 路由
const authRoutes = require('./src/routes/auth.js')
const studentsRoutes = require('./src/routes/students.js')
const recordsRoutes = require('./src/routes/records.js')
const fadRoutes = require('./src/routes/fad.js')
const rewardRoutes = require('./src/routes/reward.js')
const roomRoutes = require('./src/routes/room.js')
const otherRoutes = require('./src/routes/other.js')

const app = express()

// 中间件
app.use(cors())
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
