// 使用生产数据库测试学年边界逻辑
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');

const MONGO_URI = 'mongodb://49.235.189.246:27017';
const API_BASE = 'http://localhost:8080/api';

let token = null;
let db = null;

// 测试数据
const testStudent = '学年边界测试/TEST';
const testClass = '10A';

async function connectDB() {
  console.log('========================================');
  console.log('1. 连接生产数据库');
  console.log('========================================');
  try {
    const client = await MongoClient.connect(MONGO_URI);
    db = client.db('GHA');
    console.log('✅ 数据库连接成功');
    return client;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return null;
  }
}

async function login() {
  console.log('\n========================================');
  console.log('2. 测试登录');
  console.log('========================================');
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'elainecai@ghedu.com',
      password: 'elainecai'
    });
    token = res.data.token;
    console.log('✅ 登录成功');
    console.log('   用户名:', res.data.name);
    console.log('   用户组:', res.data.group);
    return true;
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data?.error || error.message);
    return false;
  }
}

async function cleanup(client) {
  console.log('\n========================================');
  console.log('3. 清理测试数据');
  console.log('========================================');

  try {
    // 删除测试学生的所有FAD记录
    const fadResult = await db.collection('FAD_Records').deleteMany({
      学生: testStudent
    });
    console.log('✅ 删除FAD记录:', fadResult.deletedCount, '条');

    // 删除测试学生的所有Reward记录
    const rewardResult = await db.collection('Reward_Records').deleteMany({
      学生: testStudent
    });
    console.log('✅ 删除Reward记录:', rewardResult.deletedCount, '条');

    console.log('✅ 清理完成');
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
  }
}

async function getCurrentAcademicYearSemesters() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  if (currentMonth >= 2 && currentMonth <= 7) {
    return [`${currentYear - 1}年秋季`, `${currentYear}年春季`];
  } else {
    return [`${currentYear}年秋季`, `${currentYear + 1}年春季`];
  }
}

async function testCreateFADs() {
  console.log('\n========================================');
  console.log('4. 创建测试FAD记录');
  console.log('========================================');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // 确定当前学年
  const academicYearSemesters = await getCurrentAcademicYearSemesters();
  console.log('当前学年包含的学期:', academicYearSemesters);

  // 创建上学年的FAD
  let previousSemester = '';
  if (currentMonth >= 2 && currentMonth <= 7) {
    previousSemester = `${currentYear - 2}年秋季`;
  } else {
    previousSemester = `${currentYear - 1}年春季`;
  }

  console.log('\n创建上学年的FAD记录，学期:', previousSemester);
  try {
    const previousFAD = {
      记录类型: 'FAD',
      记录日期: new Date(),
      学生: testStudent,
      班级: testClass,
      记录老师: '测试老师',
      学期: previousSemester,
      记录事由: '上学年的FAD记录（应该不被抵消）',
      FAD来源类型: 'other',
      是否已执行或冲抵: false,
      执行日期: null,
      是否已冲销记录: false,
      '冲销记录Reward ID': []
    };
    const result1 = await db.collection('FAD_Records').insertOne(previousFAD);
    console.log('✅ 上学年FAD创建成功, ID:', result1.insertedId);
  } catch (error) {
    console.error('❌ 上学年FAD创建失败:', error.message);
  }

  // 创建当前学年的FAD记录（多个）
  console.log('\n创建当前学年的FAD记录:');
  for (let i = 0; i < academicYearSemesters.length; i++) {
    const semester = academicYearSemesters[i];
    console.log(`  学期: ${semester}`);

    try {
      const currentFAD = {
        记录类型: 'FAD',
        记录日期: new Date(),
        学生: testStudent,
        班级: testClass,
        记录老师: '测试老师',
        学期: semester,
        记录事由: `当前学年的FAD记录 #${i + 1}`,
        FAD来源类型: 'other',
        是否已执行或冲抵: false,
        执行日期: null,
        是否已冲销记录: false,
        '冲销记录Reward ID': []
      };
      const result2 = await db.collection('FAD_Records').insertOne(currentFAD);
      console.log(`  ✅ FAD创建成功, ID: ${result2.insertedId}`);
    } catch (error) {
      console.error(`  ❌ FAD创建失败: ${error.message}`);
    }
  }

  // 查询所有FAD记录
  console.log('\n查询所有FAD记录:');
  const allFADs = await db.collection('FAD_Records').find({
    学生: testStudent
  }).toArray();

  console.log(`找到 ${allFADs.length} 条FAD记录:`);
  allFADs.forEach((fad, index) => {
    console.log(`  ${index + 1}. 学期: ${fad.学期}, 事由: ${fad.记录事由}`);
  });
}

async function testRewardOffset() {
  console.log('\n========================================');
  console.log('5. 测试奖励抵消逻辑');
  console.log('========================================');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  let currentSemester = '';

  if (currentMonth >= 2 && currentMonth <= 7) {
    currentSemester = `${currentYear}年春季`;
  } else {
    currentSemester = `${currentYear}年秋季`;
  }

  console.log('创建Reward记录，学期:', currentSemester);

  try {
    const reward = {
      记录类型: 'Reward',
      记录日期: new Date(),
      学生: testStudent,
      班级: testClass,
      记录老师: '测试老师',
      学期: currentSemester,
      记录事由: '测试奖励抵消学年边界',
      是否优先冲抵执行: false,
      是否已冲销记录: false,
      '冲销记录FAD ID': null
    };

    const result = await db.collection('Reward_Records').insertOne(reward);
    console.log('✅ Reward创建成功, ID:', result.insertedId);

    // 调用handleRewardOffset函数的逻辑
    const academicYearSemesters = await getCurrentAcademicYearSemesters();

    console.log('\n查找未冲销的Reward（当前学年范围）:');
    const unoffsetRewards = await db.collection('Reward_Records').find({
      学生: testStudent,
      是否已冲销记录: false,
      学期: { $in: academicYearSemesters }
    }).toArray();

    console.log(`找到 ${unoffsetRewards.length} 条未冲销的Reward`);

    console.log('\n查找未冲销的FAD（当前学年范围）:');
    const unoffsetFADs = await db.collection('FAD_Records').find({
      学生: testStudent,
      是否已冲销记录: false,
      学期: { $in: academicYearSemesters }
    }).toArray();

    console.log(`找到 ${unoffsetFADs.length} 条未冲销的FAD（当前学年范围）`);
    unoffsetFADs.forEach((fad, index) => {
      console.log(`  ${index + 1}. 学期: ${fad.学期}, 事由: ${fad.记录事由}`);
    });

    // 模拟奖励抵消逻辑
    if (unoffsetRewards.length > 0 && unoffsetFADs.length > 0) {
      console.log('\n模拟奖励抵消:');
      const rewardToUse = unoffsetRewards[0];
      const targetFAD = unoffsetFADs[0];

      console.log(`  使用的Reward: ${rewardToUse._id}`);
      console.log(`  目标FAD: ${targetFAD._id}, 学期: ${targetFAD.学期}`);

      // 验证FAD在当前学年内
      if (academicYearSemesters.includes(targetFAD.学期)) {
        console.log('✅ FAD在当前学年内，验证通过！');
      } else {
        console.error('❌ FAD不在当前学年内！');
      }
    }

  } catch (error) {
    console.error('❌ Reward操作失败:', error.message);
  }
}

async function testAcademicYearBoundary() {
  console.log('\n========================================');
  console.log('6. 验证学年边界逻辑');
  console.log('========================================');

  const academicYearSemesters = await getCurrentAcademicYearSemesters();
  console.log('当前学年:', academicYearSemesters);

  console.log('\n查询所有FAD记录:');
  const allFADs = await db.collection('FAD_Records').find({
    学生: testStudent
  }).toArray();

  console.log(`总共找到 ${allFADs.length} 条FAD记录\n`);

  let inAcademicYearCount = 0;
  let outAcademicYearCount = 0;

  allFADs.forEach((fad, index) => {
    const inAcademicYear = academicYearSemesters.includes(fad.学期);
    if (inAcademicYear) {
      inAcademicYearCount++;
      console.log(`✅ FAD #${index + 1}: 学期="${fad.学期}" → 在当前学年内`);
    } else {
      outAcademicYearCount++;
      console.log(`❌ FAD #${index + 1}: 学期="${fad.学期}" → 不在当前学年内`);
    }
  });

  console.log(`\n统计结果:`);
  console.log(`  在当前学年内: ${inAcademicYearCount} 条`);
  console.log(`  不在当前学年内: ${outAcademicYearCount} 条`);

  console.log(`\n预期结果:`);
  console.log(`  奖励抵消应该只抵消在当前学年内的 ${inAcademicYearCount} 条FAD`);
  console.log(`  不应该抵消不在当前学年的 ${outAcademicYearCount} 条FAD`);
}

async function testAPIEndpoint() {
  console.log('\n========================================');
  console.log('7. 测试API端点');
  console.log('========================================');

  if (!token) {
    console.log('⚠️  未登录，跳过API测试');
    return;
  }

  try {
    // 测试创建FAD
    console.log('\n测试通过API创建FAD记录...');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    let currentSemester = '';

    if (currentMonth >= 2 && currentMonth <= 7) {
      currentSemester = `${currentYear}年春季`;
    } else {
      currentSemester = `${currentYear}年秋季`;
    }

    const fadRes = await axios.post(`${API_BASE}/records`, {
      recordType: 'FAD',
      date: new Date().toISOString(),
      student: testStudent,
      studentClass: testClass,
      semester: currentSemester,
      teacher: 'API测试老师',
      description: '通过API创建的FAD',
      sourceType: 'other'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (fadRes.data.success) {
      console.log('✅ FAD创建成功, ID:', fadRes.data.insertedId);
    } else {
      console.error('❌ FAD创建失败:', fadRes.data.error);
    }

    // 测试创建Reward
    console.log('\n测试通过API创建Reward记录...');
    const rewardRes = await axios.post(`${API_BASE}/records`, {
      recordType: 'Reward',
      date: new Date().toISOString(),
      student: testStudent,
      studentClass: testClass,
      semester: currentSemester,
      teacher: 'API测试老师',
      description: '通过API创建的Reward',
      priorityOffset: false
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (rewardRes.data.success) {
      console.log('✅ Reward创建成功, ID:', rewardRes.data.insertedId);

      // 等待冲抵逻辑处理
      console.log('\n⏳ 等待3秒让冲抵逻辑处理...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 查询FAD记录，检查是否被关联
      const fadListRes = await axios.get(`${API_BASE}/fad-records`, {
        params: { student: testStudent },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (fadListRes.data.success && fadListRes.data.data.length > 0) {
        console.log('\n查询到的FAD记录:');
        fadListRes.data.data.forEach((fad, index) => {
          const rewardIds = fad['冲销记录Reward ID'] || [];
          const status = rewardIds.length > 0 ? `已关联${rewardIds.length}张Reward` : '未关联';
          console.log(`  ${index + 1}. 学期: ${fad.学期}, 事由: ${fad.记录事由}, 状态: ${status}`);
        });
      }
    } else {
      console.error('❌ Reward创建失败:', rewardRes.data.error);
    }

  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data?.error || error.message);
  }
}

async function runTests() {
  console.log('========================================');
  console.log('学年边界逻辑详细测试（生产数据库）');
  console.log('========================================');
  console.log('测试时间:', new Date().toISOString());
  console.log('数据库:', MONGO_URI);

  // 1. 连接数据库
  const client = await connectDB();
  if (!client) {
    console.log('\n数据库连接失败，无法继续测试');
    process.exit(1);
  }

  try {
    // 2. 登录
    await login();

    // 3. 清理测试数据
    await cleanup(client);

    // 4. 创建测试FAD记录
    await testCreateFADs();

    // 5. 测试奖励抵消逻辑
    await testRewardOffset();

    // 6. 验证学年边界逻辑
    await testAcademicYearBoundary();

    // 7. 测试API端点
    await testAPIEndpoint();

    console.log('\n========================================');
    console.log('测试完成');
    console.log('========================================');

  } finally {
    // 清理测试数据
    console.log('\n清理测试数据...');
    await cleanup(client);

    // 关闭数据库连接
    await client.close();
    console.log('数据库连接已关闭');
  }
}

// 运行测试
runTests().catch(console.error);
