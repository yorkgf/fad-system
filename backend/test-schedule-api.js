// 测试日程管理API
const axios = require('axios')

const API_BASE = 'http://localhost:8080/api'
let token = null

async function login() {
  console.log('1. 测试登录...')
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'york@ghedu.com',
      password: 'your-password'  // 请替换为实际密码
    })
    token = res.data.token
    console.log('✅ 登录成功')
    console.log('   用户名:', res.data.name)
    console.log('   用户组:', res.data.group)
    return true
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data?.error || error.message)
    return false
  }
}

async function testGHSProfile() {
  console.log('\n2. 测试获取GHS教师资料...')
  try {
    const res = await axios.get(`${API_BASE}/schedule/me/ghs-profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✅ 获取成功')
    console.log('   GHA资料:', JSON.stringify(res.data.data.ghaProfile, null, 2))
    console.log('   GHS资料:', JSON.stringify(res.data.data.ghsProfile, null, 2))
    return true
  } catch (error) {
    console.error('❌ 获取失败:', error.response?.data?.error || error.message)
    return false
  }
}

async function testGetTeachers() {
  console.log('\n3. 测试获取教师列表...')
  try {
    const res = await axios.get(`${API_BASE}/schedule/teachers`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✅ 获取成功')
    console.log('   教师数量:', res.data.data.length)
    if (res.data.data.length > 0) {
      console.log('   示例教师:', JSON.stringify(res.data.data[0], null, 2))
    }
    return true
  } catch (error) {
    console.error('❌ 获取失败:', error.response?.data?.error || error.message)
    return false
  }
}

async function testGetSessions() {
  console.log('\n4. 测试获取日程时段...')
  try {
    const res = await axios.get(`${API_BASE}/schedule/sessions?teacherEmail=york@ghedu.com`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✅ 获取成功')
    console.log('   时段数量:', res.data.data.length)
    if (res.data.data.length > 0) {
      console.log('   示例时段:', JSON.stringify(res.data.data[0], null, 2))
    }
    return res.data.data
  } catch (error) {
    console.error('❌ 获取失败:', error.response?.data?.error || error.message)
    return []
  }
}

async function testCreateSession() {
  console.log('\n5. 测试创建日程时段...')
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    const res = await axios.post(`${API_BASE}/schedule/sessions`, {
      date: dateStr,
      startTime: '14:00',
      endTime: '14:30',
      location: '测试办公室',
      maxBookings: 1,
      note: 'API测试'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✅ 创建成功')
    console.log('   时段ID:', res.data.data._id)
    return res.data.data._id
  } catch (error) {
    console.error('❌ 创建失败:', error.response?.data?.error || error.message)
    return null
  }
}

async function testDeleteSession(sessionId) {
  console.log('\n6. 测试删除日程时段...')
  try {
    await axios.delete(`${API_BASE}/schedule/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✅ 删除成功')
    return true
  } catch (error) {
    console.error('❌ 删除失败:', error.response?.data?.error || error.message)
    return false
  }
}

async function testGetMySessions() {
  console.log('\n7. 测试获取"我的日程"...')
  try {
    const res = await axios.get(`${API_BASE}/schedule/my-sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✅ 获取成功')
    console.log('   日程数量:', res.data.data.length)
    return true
  } catch (error) {
    console.error('❌ 获取失败:', error.response?.data?.error || error.message)
    return false
  }
}

async function testGetMyBookings() {
  console.log('\n8. 测试获取"我的预约"...')
  try {
    const res = await axios.get(`${API_BASE}/schedule/my-bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('✅ 获取成功')
    console.log('   预约数量:', res.data.data.length)
    return true
  } catch (error) {
    console.error('❌ 获取失败:', error.response?.data?.error || error.message)
    return false
  }
}

async function runTests() {
  console.log('========================================')
  console.log('日程管理API测试')
  console.log('========================================')

  // 先启动服务器
  console.log('\n请先确保后端服务器已启动: npm run dev')
  console.log('按 Enter 键继续测试...')

  // 登录
  if (!await login()) {
    console.log('\n请修改脚本中的密码后重试')
    process.exit(1)
  }

  // 运行其他测试
  await testGHSProfile()
  await testGetTeachers()
  const sessions = await testGetSessions()

  // 创建并删除测试数据
  const newSessionId = await testCreateSession()
  if (newSessionId) {
    await testDeleteSession(newSessionId)
  }

  await testGetMySessions()
  await testGetMyBookings()

  console.log('\n========================================')
  console.log('API测试完成')
  console.log('========================================')
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { runTests }
