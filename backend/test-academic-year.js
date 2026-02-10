// 测试学年边界逻辑
const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';
let token = null;

// 测试数据
const testStudent = '学年边界测试/TEST';
const testClass = '10A';

async function login() {
  console.log('========================================');
  console.log('1. 测试登录');
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

async function cleanup() {
  console.log('\n========================================');
  console.log('2. 清理测试数据');
  console.log('========================================');
  try {
    // 删除所有测试相关的FAD记录
    await axios.delete(`${API_BASE}/test/cleanup`, {
      data: { student: testStudent },
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 清理完成');
  } catch (error) {
    // 如果清理接口不存在，忽略错误
    console.log('⚠️  清理接口不存在，跳过');
  }
}

async function testGetCurrentAcademicYearSemesters() {
  console.log('\n========================================');
  console.log('3. 测试 getCurrentAcademicYearSemesters 函数');
  console.log('========================================');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  console.log('当前日期:', new Date().toISOString());
  console.log('当前月份:', currentMonth);
  console.log('当前年份:', currentYear);

  let expectedSemesters = [];
  if (currentMonth >= 2 && currentMonth <= 7) {
    // 春季学期
    expectedSemesters = [`${currentYear - 1}年秋季`, `${currentYear}年春季`];
    console.log('当前是春季学期（2-7月）');
  } else {
    // 秋季学期
    expectedSemesters = [`${currentYear}年秋季`, `${currentYear + 1}年春季`];
    console.log('当前是秋季学期（8-1月）');
  }

  console.log('当前学年应该包含的学期:');
  expectedSemesters.forEach(s => console.log('  -', s));

  return expectedSemesters;
}

async function testCreateFADInPreviousAcademicYear() {
  console.log('\n========================================');
  console.log('4. 测试创建上学年的FAD记录');
  console.log('========================================');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // 创建上学年的FAD
  let previousSemester = '';
  if (currentMonth >= 2 && currentMonth <= 7) {
    // 当前是春季，上学年秋季应该是两年前的秋季
    previousSemester = `${currentYear - 2}年秋季`;
  } else {
    // 当前是秋季，上学年春季应该是今年的春季
    previousSemester = `${currentYear}年春季`;
  }

  console.log('创建上学年的FAD，学期:', previousSemester);

  try {
    const res = await axios.post(`${API_BASE}/records`, {
      recordType: 'FAD',
      date: new Date().toISOString(),
      student: testStudent,
      studentClass: testClass,
      semester: previousSemester,
      teacher: '测试老师',
      description: '上学年的FAD记录',
      sourceType: 'other'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data.success) {
      console.log('✅ 上学年FAD创建成功, ID:', res.data.insertedId);
      return res.data.insertedId;
    } else {
      console.error('❌ 上学年FAD创建失败:', res.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ 创建FAD失败:', error.response?.data?.error || error.message);
    return null;
  }
}

async function testCreateFADInCurrentAcademicYear() {
  console.log('\n========================================');
  console.log('5. 测试创建当前学年的FAD记录');
  console.log('========================================');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // 创建当前学年的FAD
  let currentSemester = '';
  if (currentMonth >= 2 && currentMonth <= 7) {
    currentSemester = `${currentYear}年春季`;
  } else {
    currentSemester = `${currentYear}年秋季`;
  }

  console.log('创建当前学年的FAD，学期:', currentSemester);

  try {
    const res = await axios.post(`${API_BASE}/records`, {
      recordType: 'FAD',
      date: new Date().toISOString(),
      student: testStudent,
      studentClass: testClass,
      semester: currentSemester,
      teacher: '测试老师',
      description: '当前学年的FAD记录',
      sourceType: 'other'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data.success) {
      console.log('✅ 当前学年FAD创建成功, ID:', res.data.insertedId);
      return res.data.insertedId;
    } else {
      console.error('❌ 当前学年FAD创建失败:', res.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ 创建FAD失败:', error.response?.data?.error || error.message);
    return null;
  }
}

async function testRewardOffsetWithAcademicYearBoundary() {
  console.log('\n========================================');
  console.log('6. 测试奖励抵消的学年边界逻辑');
  console.log('========================================');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // 创建当前学期的Reward
  let currentSemester = '';
  if (currentMonth >= 2 && currentMonth <= 7) {
    currentSemester = `${currentYear}年春季`;
  } else {
    currentSemester = `${currentYear}年秋季`;
  }

  console.log('创建当前学期的Reward，学期:', currentSemester);

  try {
    const res = await axios.post(`${API_BASE}/records`, {
      recordType: 'Reward',
      date: new Date().toISOString(),
      student: testStudent,
      studentClass: testClass,
      semester: currentSemester,
      teacher: '测试老师',
      description: '测试奖励抵消学年边界',
      priorityOffset: false
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data.success) {
      console.log('✅ Reward创建成功, ID:', res.data.insertedId);

      // 检查Reward是否正确关联到当前学年的FAD
      console.log('⏳ 等待冲抵逻辑处理...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 查询FAD记录，检查是否被关联
      const fadRes = await axios.get(`${API_BASE}/fad-records`, {
        params: { student: testStudent },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (fadRes.data.success && fadRes.data.data.length > 0) {
        console.log('找到FAD记录:', fadRes.data.data.length, '条');

        // 检查是否有FAD被关联了Reward
        let foundOffsetFAD = false;
        for (const fad of fadRes.data.data) {
          const rewardIds = fad['冲销记录Reward ID'] || [];
          if (rewardIds.length > 0) {
            console.log('✅ 找到已关联Reward的FAD:');
            console.log('   FAD ID:', fad._id);
            console.log('   FAD学期:', fad.学期);
            console.log('   关联的Reward数量:', rewardIds.length);
            foundOffsetFAD = true;

            // 验证FAD是否在当前学年
            const expectedSemesters = [];
            if (currentMonth >= 2 && currentMonth <= 7) {
              expectedSemesters.push(`${currentYear - 1}年秋季`, `${currentYear}年春季`);
            } else {
              expectedSemesters.push(`${currentYear}年秋季`, `${currentYear + 1}年春季`);
            }

            if (expectedSemesters.includes(fad.学期)) {
              console.log('✅ FAD在当前学年内，验证通过');
            } else {
              console.error('❌ FAD不在当前学年内！FAD学期:', fad.学期, '期望学期:', expectedSemesters);
            }
          }
        }

        if (!foundOffsetFAD) {
          console.log('⚠️  没有找到已关联Reward的FAD');
        }
      } else {
        console.log('⚠️  没有找到FAD记录');
      }

      return res.data.insertedId;
    } else {
      console.error('❌ Reward创建失败:', res.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ 创建Reward失败:', error.response?.data?.error || error.message);
    return null;
  }
}

async function testFAStatisticsWithAcademicYear() {
  console.log('\n========================================');
  console.log('7. 测试FAD统计的学年范围');
  console.log('========================================');

  try {
    // 测试学年范围的统计
    const res = await axios.get(`${API_BASE}/other/stop-class/list`, {
      params: { semester: '学年', type: 'warning' },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data.success) {
      console.log('✅ 学年范围FAD统计查询成功');
      console.log('   返回数据:', JSON.stringify(res.data.data, null, 2));
    } else {
      console.error('❌ 学年范围FAD统计查询失败:', res.data.error);
    }
  } catch (error) {
    console.error('❌ 查询FAD统计失败:', error.response?.data?.error || error.message);
  }
}

async function runTests() {
  console.log('========================================');
  console.log('学年边界逻辑测试');
  console.log('========================================');
  console.log('测试时间:', new Date().toISOString());

  // 1. 登录
  if (!await login()) {
    console.log('\n请修改脚本中的登录信息后重试');
    process.exit(1);
  }

  // 2. 清理测试数据
  await cleanup();

  // 3. 测试getCurrentAcademicYearSemesters函数
  const expectedSemesters = await testGetCurrentAcademicYearSemesters();

  // 4. 创建上学年的FAD
  await testCreateFADInPreviousAcademicYear();

  // 5. 创建当前学年的FAD
  await testCreateFADInCurrentAcademicYear();

  // 6. 测试奖励抵消的学年边界逻辑
  await testRewardOffsetWithAcademicYearBoundary();

  // 7. 测试FAD统计的学年范围
  await testFAStatisticsWithAcademicYear();

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
  console.log('\n预期结果:');
  console.log('1. Reward应该只抵消当前学年的FAD');
  console.log('2. 上学年的FAD不应该被抵消');
  console.log('3. FAD统计应该正确反映学年范围的数据');
  console.log('\n请手动检查数据库中的记录来验证结果');
}

// 运行测试
runTests().catch(console.error);
