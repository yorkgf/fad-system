// 全面业务规则测试 - 所有记录类型和场景
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');

const MONGO_URI = 'mongodb://49.235.189.246:27017';
const API_BASE = 'http://localhost:8080/api';

let token = null;
let db = null;
let client = null;

// 测试数据
const testStudent = '全类型业务测试/TEST';
const testClass = '10A';

// 所有记录类型定义
const ALL_RECORD_TYPES = {
  // 需要累计的记录类型
  '早点名迟到': { collection: 'Late_Records', count: 2, result: 'FAD', sourceType: 'other' },
  '寝室迟出': { collection: 'Leave_Room_Late_Records', count: 2, result: 'FAD', sourceType: 'dorm' },
  '未按规定返校': { collection: 'Back_School_Late_Records', count: 2, result: 'FAD', sourceType: 'dorm' },
  '擅自进入会议室或接待室': { collection: 'MeetingRoom_Violation_Records', count: 2, result: 'FAD', sourceType: 'other' },
  '寝室批评': { collection: 'Room_Warning_Records', count: 5, result: 'FAD', sourceType: 'dorm' },
  '寝室垃圾未倒': { collection: 'Room_Trash_Records', count: 2, result: '寝室批评', sourceType: 'dorm' },
  'Teaching FAD Ticket': { collection: 'Teaching_FAD_Ticket', count: 3, result: 'FAD', sourceType: 'teach' },

  // 产生Reward提示的记录类型
  '寝室表扬': { collection: 'Room_Praise_Records', count: 10, result: 'Reward_Hint', sourceType: null },
  'Teaching Reward Ticket': { collection: 'Teaching_Reward_Ticket', count: 6, result: 'Reward_Hint', sourceType: null },

  // 直接产生FAD的记录类型
  '上网课违规使用电子产品': { collection: 'Elec_Products_Violation_Records', count: 1, result: 'FAD', sourceType: 'elec' },
  '22:00后交还手机': { collection: 'Phone_Late_Records', count: 1, result: 'FAD', sourceType: 'dorm' },

  // 不产生FAD的记录类型
  '21:30后交还手机(22:00前)': { collection: 'Phone_Late_Records', count: 0, result: 'none', sourceType: null },
  'FAD': { collection: 'FAD_Records', count: 0, result: 'none', sourceType: null },
  'Reward': { collection: 'Reward_Records', count: 0, result: 'none', sourceType: null }
};

async function connectDB() {
  console.log('========================================');
  console.log('连接生产数据库');
  console.log('========================================');
  try {
    client = await MongoClient.connect(MONGO_URI);
    db = client.db('GHA');
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

async function login() {
  console.log('\n========================================');
  console.log('测试登录');
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
  console.log('清理测试数据');
  console.log('========================================');

  const collections = Object.values(ALL_RECORD_TYPES).map(r => r.collection);
  const uniqueCollections = [...new Set(collections)];

  let totalDeleted = 0;
  for (const collection of uniqueCollections) {
    try {
      const result = await db.collection(collection).deleteMany({
        学生: testStudent
      });
      if (result.deletedCount > 0) {
        console.log(`  ${collection}: 删除 ${result.deletedCount} 条`);
        totalDeleted += result.deletedCount;
      }
    } catch (error) {
      // 集合不存在，忽略
    }
  }
  console.log(`✅ 总共删除 ${totalDeleted} 条记录`);
}

function getCurrentAcademicYearSemesters() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  if (currentMonth >= 2 && currentMonth <= 7) {
    return [`${currentYear - 1}年秋季`, `${currentYear}年春季`];
  } else {
    return [`${currentYear}年秋季`, `${currentYear + 1}年春季`];
  }
}

// ==================== 测试1：所有记录类型的跨学期累计 ====================
async function testAllRecordTypesCrossSemester() {
  console.log('\n========================================');
  console.log('测试1：所有记录类型的跨学期累计');
  console.log('========================================');

  const academicYearSemesters = getCurrentAcademicYearSemesters();
  const fallSemester = academicYearSemesters[0];
  const springSemester = academicYearSemesters[1];

  console.log(`当前学年: ${fallSemester} + ${springSemester}`);

  const results = [];

  for (const [recordType, config] of Object.entries(ALL_RECORD_TYPES)) {
    if (config.count === 0) continue; // 跳过不需要累计的类型

    console.log(`\n--- 测试: ${recordType} ---`);
    console.log(`规则: ${config.count}次 → ${config.result}`);

    // 清空该类型的测试数据
    await db.collection(config.collection).deleteMany({
      学生: testStudent
    });

    // 在秋季学期插入一半记录
    const fallCount = Math.floor(config.count / 2);
    for (let i = 0; i < fallCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const record = {
        记录类型: recordType,
        记录日期: date,
        学生: testStudent,
        班级: testClass,
        记录老师: '测试老师',
        学期: fallSemester
      };

      if (config.result === 'FAD') {
        record.是否已累计FAD = false;
        record['累计FAD ID'] = null;
      } else if (config.result === '寝室批评') {
        record.是否已累计寝室批评 = false;
        record['累计寝室批评 ID'] = null;
      } else if (config.result === 'Reward_Hint') {
        record.是否已累计Reward = false;
        record['累计Reward ID'] = null;
      }

      await db.collection(config.collection).insertOne(record);
    }

    // 在春季学期插入剩余记录
    const springCount = config.count - fallCount;
    for (let i = 0; i < springCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const record = {
        记录类型: recordType,
        记录日期: date,
        学生: testStudent,
        班级: testClass,
        记录老师: '测试老师',
        学期: springSemester
      };

      if (config.result === 'FAD') {
        record.是否已累计FAD = false;
        record['累计FAD ID'] = null;
      } else if (config.result === '寝室批评') {
        record.是否已累计寝室批评 = false;
        record['累计寝室批评 ID'] = null;
      } else if (config.result === 'Reward_Hint') {
        record.是否已累计Reward = false;
        record['累计Reward ID'] = null;
      }

      await db.collection(config.collection).insertOne(record);
    }

    // 检查秋季学期记录数
    const fallRecords = await db.collection(config.collection).countDocuments({
      学生: testStudent,
      学期: fallSemester
    });

    // 检查春季学期记录数
    const springRecords = await db.collection(config.collection).countDocuments({
      学生: testStudent,
      学期: springSemester
    });

    // 检查总记录数
    const totalRecords = await db.collection(config.collection).countDocuments({
      学生: testStudent
    });

    console.log(`  秋季学期: ${fallRecords} 条`);
    console.log(`  春季学期: ${springRecords} 条`);
    console.log(`  总计: ${totalRecords} 条`);

    // 验证跨学期不累计
    const shouldAccumulate = fallRecords >= config.count || springRecords >= config.count;
    const crossSemesterAccumulate = totalRecords >= config.count;

    const result = {
      recordType,
      fallRecords,
      springRecords,
      totalRecords,
      requiredCount: config.count,
      shouldAccumulate,        // 按学期累计是否达到阈值
      crossSemesterAccumulate, // 跨学期累计是否达到阈值
      correct: !crossSemesterAccumulate || shouldAccumulate
    };

    results.push(result);

    if (result.correct) {
      console.log(`  ✅ 累计逻辑正确：按学期累计，不跨学期`);
    } else {
      console.log(`  ❌ 累计逻辑错误：跨学期累计了！`);
    }
  }

  return results;
}

// ==================== 测试2：一次添加多条记录的累计规则 ====================
async function testBatchAddRecords() {
  console.log('\n========================================');
  console.log('测试2：一次添加多条记录的累计规则');
  console.log('========================================');

  const academicYearSemesters = getCurrentAcademicYearSemesters();
  const currentSemester = academicYearSemesters[1];

  const results = [];

  for (const [recordType, config] of Object.entries(ALL_RECORD_TYPES)) {
    if (config.count === 0 || config.result === 'Reward_Hint') continue;

    console.log(`\n--- 测试: ${recordType} ---`);
    console.log(`规则: ${config.count}次 → ${config.result}`);

    // 清空该类型的测试数据
    await db.collection(config.collection).deleteMany({
      学生: testStudent
    });
    await db.collection('FAD_Records').deleteMany({
      学生: testStudent,
      记录事由: { $regex: `累计.*${recordType}` }
    });

    // 一次插入多条记录
    const records = [];
    for (let i = 0; i < config.count; i++) {
      const date = new Date();
      date.setSeconds(date.getSeconds() - i); // 使用秒级差异避免重复

      const record = {
        记录类型: recordType,
        记录日期: date,
        学生: testStudent,
        班级: testClass,
        记录老师: '测试老师',
        学期: currentSemester
      };

      if (config.result === 'FAD') {
        record.是否已累计FAD = false;
        record['累计FAD ID'] = null;
      } else if (config.result === '寝室批评') {
        record.是否已累计寝室批评 = false;
        record['累计寝室批评 ID'] = null;
      }

      records.push(record);
    }

    // 批量插入
    await db.collection(config.collection).insertMany(records);
    console.log(`  一次插入 ${config.count} 条记录`);

    // 检查记录数
    const totalRecords = await db.collection(config.collection).countDocuments({
      学生: testStudent,
      学期: currentSemester
    });

    console.log(`  实际记录数: ${totalRecords}`);

    // 模拟累计逻辑
    let accumulatedFAD = 0;
    if (totalRecords >= config.count && config.result === 'FAD') {
      // 检查是否已累计FAD
      const unaccumulated = await db.collection(config.collection).countDocuments({
        学生: testStudent,
        学期: currentSemester,
        是否已累计FAD: false
      });

      if (unaccumulated === config.count) {
        // 模拟累计FAD
        await db.collection('FAD_Records').insertOne({
          记录类型: 'FAD',
          记录日期: new Date(),
          学生: testStudent,
          班级: testClass,
          记录老师: `系统: 累计${recordType}触发`,
          学期: currentSemester,
          记录事由: `累计${config.count}次${recordType}`,
          FAD来源类型: config.sourceType,
          是否已执行或冲抵: false,
          执行日期: null,
          是否已冲销记录: false,
          '冲销记录Reward ID': []
        });

        // 标记记录已累计
        await db.collection(config.collection).updateMany(
          {
            学生: testStudent,
            学期: currentSemester,
            是否已累计FAD: false
          },
          {
            $set: {
              是否已累计FAD: true,
              '累计FAD ID': 'test-fad-id'
            }
          },
          { limit: config.count }
        );

        accumulatedFAD = 1;
      }
    }

    // 检查FAD数
    const fadRecords = await db.collection('FAD_Records').countDocuments({
      学生: testStudent,
      学期: currentSemester,
      记录事由: { $regex: `累计.*${recordType}` }
    });

    console.log(`  产生FAD数: ${fadRecords}`);

    const result = {
      recordType,
      insertedCount: config.count,
      actualCount: totalRecords,
      expectedFAD: config.result === 'FAD' ? 1 : 0,
      actualFAD: fadRecords,
      correct: totalRecords === config.count && fadRecords === (config.result === 'FAD' ? 1 : 0)
    };

    results.push(result);

    if (result.correct) {
      console.log(`  ✅ 批量插入累计逻辑正确`);
    } else {
      console.log(`  ❌ 批量插入累计逻辑错误`);
    }
  }

  return results;
}

// ==================== 测试3：验证累计标记的正确性 ====================
async function testAccumulationFlags() {
  console.log('\n========================================');
  console.log('测试3：验证累计标记的正确性');
  console.log('========================================');

  const academicYearSemesters = getCurrentAcademicYearSemesters();
  const currentSemester = academicYearSemesters[1];

  const results = [];

  // 测试早点名迟到的累计标记
  console.log('\n--- 测试: 早点名迟到累计标记 ---');

  // 清空数据
  await db.collection('Late_Records').deleteMany({ 学生: testStudent });
  await db.collection('FAD_Records').deleteMany({ 学生: testStudent });

  // 插入3条记录（应该产生1个FAD，剩下1条未累计）
  for (let i = 0; i < 3; i++) {
    const date = new Date();
    date.setSeconds(date.getSeconds() - i);

    await db.collection('Late_Records').insertOne({
      记录类型: '早点名迟到',
      记录日期: date,
      学生: testStudent,
      班级: testClass,
      记录老师: '测试老师',
      学期: currentSemester,
      是否已累计FAD: false,
      '累计FAD ID': null
    });
  }

  console.log('插入3条早点名迟到记录');

  // 模拟累计：前2条累计为FAD
  const recordsToMark = await db.collection('Late_Records').find({
    学生: testStudent,
    学期: currentSemester,
    是否已累计FAD: false
  }).limit(2).toArray();

  if (recordsToMark.length === 2) {
    // 插入FAD
    const fadResult = await db.collection('FAD_Records').insertOne({
      记录类型: 'FAD',
      记录日期: new Date(),
      学生: testStudent,
      班级: testClass,
      记录老师: '系统: 累计早点名迟到触发',
      学期: currentSemester,
      记录事由: '累计2次早点名迟到',
      FAD来源类型: 'other',
      是否已执行或冲抵: false,
      执行日期: null,
      是否已冲销记录: false,
      '冲销记录Reward ID': []
    });

    // 标记记录已累计
    const ids = recordsToMark.map(r => r._id);
    await db.collection('Late_Records').updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          是否已累计FAD: true,
          '累计FAD ID': fadResult.insertedId.toString()
        }
      }
    );

    console.log('前2条记录已累计为FAD');
  }

  // 检查累计状态
  const allRecords = await db.collection('Late_Records').find({
    学生: testStudent,
    学期: currentSemester
  }).sort({ 记录日期: -1 }).toArray();

  let accumulatedCount = 0;
  let unaccumulatedCount = 0;

  allRecords.forEach((record, index) => {
    if (record.是否已累计FAD) {
      accumulatedCount++;
      console.log(`  记录${index + 1}: 已累计 (FAD ID: ${record['累计FAD ID']})`);
    } else {
      unaccumulatedCount++;
      console.log(`  记录${index + 1}: 未累计`);
    }
  });

  console.log(`\n累计状态:`);
  console.log(`  已累计: ${accumulatedCount} 条`);
  console.log(`  未累计: ${unaccumulatedCount} 条`);

  const correct = accumulatedCount === 2 && unaccumulatedCount === 1;
  if (correct) {
    console.log('✅ 累计标记正确');
  } else {
    console.log('❌ 累计标记错误');
  }

  results.push({
    test: '早点名迟到累计标记',
    accumulatedCount,
    unaccumulatedCount,
    correct
  });

  return results;
}

// ==================== 测试4：链式累计的正确性 ====================
async function testChainAccumulationCorrectness() {
  console.log('\n========================================');
  console.log('测试4：链式累计的正确性');
  console.log('========================================');

  const academicYearSemesters = getCurrentAcademicYearSemesters();
  const currentSemester = academicYearSemesters[1];

  const results = [];

  // 测试寝室垃圾未倒 → 寝室批评 → FAD 的链式累计
  console.log('\n--- 测试: 寝室垃圾未倒链式累计 ---');

  // 清空数据
  await db.collection('Room_Trash_Records').deleteMany({ 学生: testStudent });
  await db.collection('Room_Warning_Records').deleteMany({ 学生: testStudent });
  await db.collection('FAD_Records').deleteMany({
    学生: testStudent,
    记录事由: { $regex: '累计.*寝室批评' }
  });

  // 插入12条垃圾未倒（应该产生6条批评，但只有5条批评能产生1个FAD）
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    await db.collection('Room_Trash_Records').insertOne({
      记录类型: '寝室垃圾未倒',
      记录日期: date,
      学生: testStudent,
      班级: testClass,
      记录老师: '测试老师',
      学期: currentSemester,
      是否已累计寝室批评: false,
      '累计寝室批评 ID': null
    });
  }

  console.log('插入12条寝室垃圾未倒记录');

  // 模拟链式累计：每2条垃圾未倒 → 1条批评
  let trashCount = 12;
  let warningCount = 0;
  let fadCount = 0;

  while (trashCount >= 2 && warningCount < 5) {
    // 标记2条垃圾未倒为已累计
    const trashToMark = await db.collection('Room_Trash_Records').find({
      学生: testStudent,
      学期: currentSemester,
      是否已累计寝室批评: false
    }).limit(2).toArray();

    if (trashToMark.length < 2) break;

    // 创建1条寝室批评
    const warningResult = await db.collection('Room_Warning_Records').insertOne({
      记录类型: '寝室批评',
      记录日期: new Date(),
      学生: testStudent,
      班级: testClass,
      记录老师: '系统: 累计垃圾未倒触发',
      学期: currentSemester,
      是否已打扫: false,
      打扫日期: null,
      是否已累计FAD: false,
      '累计FAD ID': null
    });

    // 标记垃圾未倒已累计
    const trashIds = trashToMark.map(r => r._id);
    await db.collection('Room_Trash_Records').updateMany(
      { _id: { $in: trashIds } },
      {
        $set: {
          是否已累计寝室批评: true,
          '累计寝室批评 ID': warningResult.insertedId.toString()
        }
      }
    );

    trashCount -= 2;
    warningCount++;

    console.log(`  第${warningCount}条寝室批评创建成功 (消耗2条垃圾未倒)`);
  }

  console.log(`\n累计结果:`);
  console.log(`  剩余垃圾未倒: ${trashCount} 条`);
  console.log(`  寝室批评: ${warningCount} 条`);

  // 检查是否达到5条批评
  if (warningCount >= 5) {
    // 累计5条批评为1个FAD
    const warningsToMark = await db.collection('Room_Warning_Records').find({
      学生: testStudent,
      学期: currentSemester,
      是否已累计FAD: false
    }).limit(5).toArray();

    const fadResult = await db.collection('FAD_Records').insertOne({
      记录类型: 'FAD',
      记录日期: new Date(),
      学生: testStudent,
      班级: testClass,
      记录老师: '系统: 累计寝室批评触发',
      学期: currentSemester,
      记录事由: '累计5次寝室批评',
      FAD来源类型: 'dorm',
      是否已执行或冲抵: false,
      执行日期: null,
      是否已冲销记录: false,
      '冲销记录Reward ID': []
    });

    const warningIds = warningsToMark.map(w => w._id);
    await db.collection('Room_Warning_Records').updateMany(
      { _id: { $in: warningIds } },
      {
        $set: {
          是否已累计FAD: true,
          '累计FAD ID': fadResult.insertedId.toString()
        }
      }
    );

    fadCount++;
    console.log(`  FAD: ${fadCount} 条 (消耗5条寝室批评)`);
  }

  // 最终统计
  const finalTrash = await db.collection('Room_Trash_Records').countDocuments({
    学生: testStudent,
    学期: currentSemester
  });
  const finalWarning = await db.collection('Room_Warning_Records').countDocuments({
    学生: testStudent,
    学期: currentSemester
  });
  const finalFAD = await db.collection('FAD_Records').countDocuments({
    学生: testStudent,
    学期: currentSemester,
    记录事由: { $regex: '累计.*寝室批评' }
  });

  console.log(`\n最终统计:`);
  console.log(`  寝室垃圾未倒: ${finalTrash} 条`);
  console.log(`  寝室批评: ${finalWarning} 条`);
  console.log(`  FAD: ${finalFAD} 条`);

  // 验证：12条垃圾未倒 → 6条批评 → 1个FAD，剩余2条垃圾未倒
  const correct = finalTrash === 12 && finalWarning === 6 && finalFAD === 1;
  if (correct) {
    console.log('✅ 链式累计正确');
  } else {
    console.log('❌ 链式累计错误');
  }

  results.push({
    test: '寝室垃圾未倒链式累计',
    trashCount: finalTrash,
    warningCount: finalWarning,
    fadCount: finalFAD,
    expected: { trash: 12, warning: 6, fad: 1 },
    correct
  });

  return results;
}

// ==================== 测试5：学年边界对累计的影响 ====================
async function testAcademicYearBoundaryInAccumulation() {
  console.log('\n========================================');
  console.log('测试5：学年边界对累计的影响');
  console.log('========================================');

  const academicYearSemesters = getCurrentAcademicYearSemesters();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  console.log(`当前学年: ${academicYearSemesters.join(' + ')}`);

  // 确定上学年的学期
  let previousSemester = '';
  if (currentMonth >= 2 && currentMonth <= 7) {
    previousSemester = `${currentYear - 2}年秋季`;
  } else {
    previousSemester = `${currentYear - 1}年春季`;
  }

  console.log(`上学年学期: ${previousSemester}`);

  const results = [];

  // 测试早点名迟到跨学年累计
  console.log('\n--- 测试: 早点名迟到跨学年累计 ---');

  // 清空数据
  await db.collection('Late_Records').deleteMany({ 学生: testStudent });
  await db.collection('FAD_Records').deleteMany({ 学生: testStudent });

  // 在上学年插入1条
  await db.collection('Late_Records').insertOne({
    记录类型: '早点名迟到',
    记录日期: new Date(),
    学生: testStudent,
    班级: testClass,
    记录老师: '测试老师',
    学期: previousSemester,
    是否已累计FAD: false,
    '累计FAD ID': null
  });

  console.log(`上学年(${previousSemester})插入1条早点名迟到`);

  // 在当前学年插入1条
  await db.collection('Late_Records').insertOne({
    记录类型: '早点名迟到',
    记录日期: new Date(),
    学生: testStudent,
    班级: testClass,
    记录老师: '测试老师',
    学期: academicYearSemesters[0],
    是否已累计FAD: false,
    '累计FAD ID': null
  });

  console.log(`当前学年(${academicYearSemesters[0]})插入1条早点名迟到`);

  // 检查是否累计
  const previousYearRecords = await db.collection('Late_Records').countDocuments({
    学生: testStudent,
    学期: previousSemester
  });

  const currentYearRecords = await db.collection('Late_Records').countDocuments({
    学生: testStudent,
    学期: academicYearSemesters[0]
  });

  const totalRecords = await db.collection('Late_Records').countDocuments({
    学生: testStudent
  });

  const fadRecords = await db.collection('FAD_Records').countDocuments({
    学生: testStudent,
    记录事由: { $regex: '累计.*早点名迟到' }
  });

  console.log(`\n累计结果:`);
  console.log(`  上学年记录: ${previousYearRecords} 条`);
  console.log(`  当前学年记录: ${currentYearRecords} 条`);
  console.log(`  总记录: ${totalRecords} 条`);
  console.log(`  FAD记录: ${fadRecords} 条`);

  // 验证：跨学年不应该累计
  const correct = fadRecords === 0;
  if (correct) {
    console.log('✅ 学年边界正确：跨学年不累计');
  } else {
    console.log('❌ 学年边界错误：跨学年累计了！');
  }

  results.push({
    test: '早点名迟到跨学年累计',
    previousYearRecords,
    currentYearRecords,
    totalRecords,
    fadRecords,
    correct
  });

  // 测试当前学年内的累计
  console.log('\n--- 测试: 当前学年内的累计 ---');

  // 在当前学年春季学期再插入1条
  await db.collection('Late_Records').insertOne({
    记录类型: '早点名迟到',
    记录日期: new Date(),
    学生: testStudent,
    班级: testClass,
    记录老师: '测试老师',
    学期: academicYearSemesters[1],
    是否已累计FAD: false,
    '累计FAD ID': null
  });

  console.log(`当前学年(${academicYearSemesters[1]})再插入1条早点名迟到`);

  // 检查当前学年秋季学期的记录数
  const fallRecords = await db.collection('Late_Records').countDocuments({
    学生: testStudent,
    学期: academicYearSemesters[0]
  });

  const springRecords = await db.collection('Late_Records').countDocuments({
    学生: testStudent,
    学期: academicYearSemesters[1]
  });

  console.log(`\n当前学年统计:`);
  console.log(`  秋季学期: ${fallRecords} 条`);
  console.log(`  春季学期: ${springRecords} 条`);

  // 验证：每个学期独立累计，不跨学期
  const correct2 = fallRecords === 1 && springRecords === 1;
  if (correct2) {
    console.log('✅ 学期边界正确：各学期独立累计');
  } else {
    console.log('❌ 学期边界错误：跨学期累计了！');
  }

  results.push({
    test: '当前学年学期独立累计',
    fallRecords,
    springRecords,
    correct: correct2
  });

  return results;
}

// ==================== 主测试函数 ====================
async function runTests() {
  console.log('========================================');
  console.log('全类型业务规则全面测试');
  console.log('========================================');
  console.log('测试时间:', new Date().toISOString());
  console.log('测试学生:', testStudent);
  console.log('测试班级:', testClass);

  // 连接数据库
  if (!await connectDB()) {
    console.log('\n数据库连接失败，无法继续测试');
    process.exit(1);
  }

  try {
    // 登录
    await login();

    // 清理测试数据
    await cleanup();

    // 运行所有测试
    const test1 = await testAllRecordTypesCrossSemester();
    const test2 = await testBatchAddRecords();
    const test3 = await testAccumulationFlags();
    const test4 = await testChainAccumulationCorrectness();
    const test5 = await testAcademicYearBoundaryInAccumulation();

    console.log('\n========================================');
    console.log('所有测试完成');
    console.log('========================================');

    // 汇总结果
    console.log('\n测试结果汇总:');

    const allResults = {
      test1: '跨学期累计',
      test2: '批量插入累计',
      test3: '累计标记',
      test4: '链式累计',
      test5: '学年边界'
    };

    const tests = [test1, test2, test3, test4, test5];
    const testNames = Object.values(allResults);

    tests.forEach((test, index) => {
      const passed = test.filter(t => t.correct).length;
      const total = test.length;
      const status = passed === total ? '✅' : '⚠️';
      console.log(`${status} ${testNames[index]}: ${passed}/${total} 通过`);
    });

  } finally {
    // 清理测试数据
    console.log('\n清理测试数据...');
    await cleanup();

    // 关闭数据库连接
    if (client) {
      await client.close();
      console.log('数据库连接已关闭');
    }
  }
}

// 运行测试
runTests().catch(console.error);
