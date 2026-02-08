// 测试数据库连接脚本
const { connectDB, getDB, getGHSDB, getCollection, getGHSCollection, Collections, GHSCollections } = require('./src/utils/db.js')

async function testConnection() {
  console.log('========================================')
  console.log('数据库连接测试')
  console.log('========================================\n')

  try {
    // 1. 测试连接
    console.log('1. 测试数据库连接...')
    const { db, ghsDB } = await connectDB()
    console.log('✅ GHA 数据库连接成功')
    console.log('✅ GHS 数据库连接成功\n')

    // 2. 测试 GHA 数据库
    console.log('2. 测试 GHA 数据库 (DB_NAME: ' + process.env.DB_NAME || 'GHA' + ')')
    const ghaCollections = await db.listCollections().toArray()
    console.log('   集合列表:')
    ghaCollections.forEach(col => {
      console.log('   - ' + col.name)
    })
    console.log('')

    // 3. 测试 GHS 数据库
    console.log('3. 测试 GHS 数据库 (GHS_DB_NAME: ' + process.env.GHS_DB_NAME || 'GHS' + ')')
    const ghsCollections = await ghsDB.listCollections().toArray()
    console.log('   集合列表:')
    if (ghsCollections.length === 0) {
      console.log('   (暂无集合，数据库为空)')
    } else {
      ghsCollections.forEach(col => {
        console.log('   - ' + col.name)
      })
    }
    console.log('')

    // 4. 测试 GHA Teachers 集合读取
    console.log('4. 测试 GHA Teachers 集合读取...')
    const teachers = getCollection(Collections.Teachers)
    const teacherCount = await teachers.countDocuments()
    console.log('   Teachers 集合文档数: ' + teacherCount)

    if (teacherCount > 0) {
      const sampleTeacher = await teachers.findOne({}, { projection: { Name: 1, email: 1, Group: 1 } })
      console.log('   示例教师: ' + JSON.stringify(sampleTeacher))
    }
    console.log('')

    // 5. 测试 GHS 集合操作（如果集合不存在则创建）
    console.log('5. 测试 GHS 集合操作...')

    // 测试 Sessions 集合
    const sessions = getGHSCollection(GHSCollections.Sessions)
    const sessionsCount = await sessions.countDocuments()
    console.log('   Sessions 集合文档数: ' + sessionsCount)

    // 测试插入一条测试数据
    console.log('   插入测试数据...')
    const testResult = await sessions.insertOne({
      teacherEmail: 'test@example.com',
      teacherName: '测试教师',
      date: new Date(),
      startTime: '09:00',
      endTime: '09:30',
      isTest: true,
      createdAt: new Date()
    })
    console.log('   ✅ 测试数据插入成功，ID: ' + testResult.insertedId)

    // 删除测试数据
    await sessions.deleteOne({ _id: testResult.insertedId })
    console.log('   ✅ 测试数据已清理\n')

    // 6. 总结
    console.log('========================================')
    console.log('✅ 所有测试通过！')
    console.log('========================================')
    console.log('\n数据库连接配置:')
    console.log('  GHA: ' + (process.env.MONGO_URI || 'mongodb://49.235.189.246:27017') + '/' + (process.env.DB_NAME || 'GHA'))
    console.log('  GHS: ' + (process.env.GHS_MONGO_URI || process.env.MONGO_URI || 'mongodb://49.235.189.246:27017') + '/' + (process.env.GHS_DB_NAME || 'GHS'))

    process.exit(0)
  } catch (error) {
    console.error('\n❌ 测试失败:')
    console.error(error.message)
    console.error('\n堆栈信息:')
    console.error(error.stack)
    process.exit(1)
  }
}

testConnection()
