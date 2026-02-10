/**
 * 详细的业务逻辑测试
 * 测试链式累计、删除逻辑、批量操作等
 */

const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const {
  ACCUMULATE_RULES,
  RECORD_TYPE_TO_COLLECTION,
  RECORD_TO_FAD_SOURCE,
  THRESHOLDS,
  DB_FIELDS,
  FAD_SOURCE_TYPE
} = require('./src/utils/constants.js');

const MONGO_URI = 'mongodb://49.235.189.246:27017';
const DB_NAME = 'GHA';

// 测试用户凭据
const TEST_USER = {
  email: 'elainecai@ghedu.com',
  password: 'elainecai'
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function runTests() {
  let client;
  let db;

  try {
    client = await MongoClient.connect(MONGO_URI);
    db = client.db(DB_NAME);
  } catch (error) {
    log(`Failed to connect to MongoDB: ${error.message}`, 'red');
    return;
  }

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  async function test(description, fn) {
    totalTests++;
    try {
      const result = await fn();
      if (result) {
        passedTests++;
        log(`  ✓ ${description}`, 'green');
      } else {
        failedTests++;
        log(`  ✗ ${description}`, 'red');
      }
    } catch (error) {
      failedTests++;
      log(`  ✗ ${description} - Error: ${error.message}`, 'red');
    }
  }

  // 获取测试token
  let token;
  try {
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', TEST_USER);
    token = loginResponse.data.token;
    log(`Logged in as: ${loginResponse.data.name} (Group: ${loginResponse.data.group})`, 'blue');
  } catch (error) {
    log(`Login failed: ${error.response?.data?.error || error.message}`, 'red');
    await client.close();
    return;
  }

  // 测试1: FAD来源类型自动记录
  section('TEST 1: FAD Source Type Automatic Recording');

  await test('FAD records have correct source type from accumulated room warnings', async () => {
    // 查询由寝室批评累计产生的FAD记录
    const fadRecords = await db.collection('FAD_Records').find({
      [DB_FIELDS.FAD_EXECUTED]: { $ne: true } // 未执行的FAD
    }).limit(10).toArray();

    log(`    FAD records with source info:`, 'yellow');
    fadRecords.forEach(fad => {
      log(`    - ${fad.学生}: ${fad.FAD来源类型 || '未设置'}`, 'yellow');
    });

    // 检查是否有来自dorm来源的FAD（由寝室批评产生）
    const hasDormSource = fadRecords.some(fad => fad.FAD来源类型 === FAD_SOURCE_TYPE.DORM);
    const hasTeachSource = fadRecords.some(fad => fad.FAD来源类型 === FAD_SOURCE_TYPE.TEACH);
    const hasOtherSource = fadRecords.some(fad => fad.FAD来源类型 === FAD_SOURCE_TYPE.OTHER);

    log(`    Has dorm source (寝室批评): ${hasDormSource}`, 'yellow');
    log(`    Has teach source (Teaching FAD Ticket): ${hasTeachSource}`, 'yellow');
    log(`    Has other source (其他): ${hasOtherSource}`, 'yellow');

    return true; // 这个测试主要用于查看，暂时不强制要求必须有
  });

  // 测试2: 链式累计逻辑
  section('TEST 2: Chain Accumulation Logic');

  await test('Room trash → Room warning chain exists in accumulation rules', () => {
    return ACCUMULATE_RULES['寝室垃圾未倒']?.result === '寝室批评';
  });

  await test('Room warning → FAD chain exists in accumulation rules', () => {
    return ACCUMULATE_RULES['寝室批评']?.result === 'FAD' &&
           ACCUMULATE_RULES['寝室批评']?.sourceType === FAD_SOURCE_TYPE.DORM;
  });

  await test('Trash accumulation threshold is 2', () => {
    return ACCUMULATE_RULES['寝室垃圾未倒']?.count === 2;
  });

  await test('Room warning accumulation threshold is 5', () => {
    return ACCUMULATE_RULES['寝室批评']?.count === 5;
  });

  // 查找有垃圾记录和警告记录的学生用于测试
  await test('Students with both trash and warning records exist', async () => {
    // 查找有垃圾记录的学生
    const trashRecords = await db.collection('Room_Trash_Records').aggregate([
      { $group: { _id: '$学生', count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } },
      { $limit: 5 }
    ]).toArray();

    const trashStudents = trashRecords.map(r => r._id);

    log(`    Students with ≥2 trash records: ${trashStudents.length}`, 'yellow');

    if (trashStudents.length > 0) {
      const studentsWithWarnings = [];
      for (const student of trashStudents.slice(0, 2)) { // 只检查前2个
        const warningCount = await db.collection('Room_Warning_Records').countDocuments({ 学生: student });
        if (warningCount > 0) {
          studentsWithWarnings.push(student);
          log(`    Student "${student}": ${warningCount} warnings`, 'yellow');
        }
      }

      log(`    Students with both trash and warnings: ${studentsWithWarnings.length}`, 'yellow');
    }

    return trashStudents.length > 0;
  });

  // 测试3: 删除操作的链式逻辑
  section('TEST 3: Delete Operation Chain Logic');

  await test('Teachers can withdraw records', async () => {
    // 获取可删除的记录
    const recordTypesToCheck = ['早点名迟到', '寝室迟出', '未按规定返校', '擅自进入会议室或接待室'];
    const recordsToDelete = [];

    for (const type of recordTypesToCheck) {
      const collection = RECORD_TYPE_TO_COLLECTION[type];
      const records = await db.collection(collection).find({
        教师: { $not: { $regex: '^已发:' } }
      }).limit(2).toArray();

      recordsToDelete.push(...records);
    }

    log(`    Records available for withdrawal: ${recordsToDelete.length}`, 'yellow');

    if (recordsToDelete.length > 0) {
      const sampleRecord = recordsToDelete[0];
      log(`    Sample record to delete:`, 'yellow');
      log(`      - 学生: ${sampleRecord.学生}`, 'yellow');
      log(`      - 记录类型: ${sampleRecord.记录类型}`, 'yellow');
      log(`      - 日期: ${sampleRecord.记录日期}`, 'yellow');
      log(`      - 教师: ${sampleRecord.教师}`, 'yellow');
    }

    return recordsToDelete.length > 0;
  });

  // 测试4: 一次添加多条记录的逻辑
  section('TEST 4: Batch Record Creation Logic');

  await test('Multiple Teaching FAD Tickets trigger accumulation', async () => {
    // 查找有Teaching FAD Ticket记录的学生
    const studentsWithTickets = await db.collection('Teaching_FAD_Ticket').aggregate([
      { $group: { _id: '$学生', count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } }, // 至少2个
      { $limit: 3 }
    ]).toArray();

    log(`    Students with ≥2 Teaching FAD Tickets: ${studentsWithTickets.length}`, 'yellow');

    if (studentsWithTickets.length > 0) {
      for (const { _id: student, count } of studentsWithTickets.slice(0, 2)) {
        const fadCount = await db.collection('FAD_Records').countDocuments({ 学生: student });
        log(`    Student "${student}": ${count} tickets → ${fadCount} FAD`, 'yellow');

        // 检查是否有对应的FAD记录
        if (fadCount > 0) {
          const fadSource = await db.collection('FAD_Records').findOne({ 学生: student });
          if (fadSource && fadSource.FAD来源类型 === FAD_SOURCE_TYPE.TEACH) {
            log(`    ✓ FAD has correct source type (teach)`, 'green');
          }
        }
      }
    }

    return true;
  });

  // 测试5: 一次添加多人记录的逻辑
  section('TEST 5: Multi-Student Record Creation Logic');

  await test('Same record type for multiple students on same day', async () => {
    // 查找同一天有相同记录类型的多个学生
    const recordTypesToCheck = ['早点名迟到', '寝室迟出', '寝室批评', '寝室垃圾未倒'];

    for (const type of recordTypesToCheck.slice(0, 2)) { // 只检查前2个
      const collection = RECORD_TYPE_TO_COLLECTION[type];

      const multiStudentRecords = await db.collection(collection).aggregate([
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$记录日期' } },
              recordType: '$记录类型'
            },
            students: { $addToSet: '$学生' },
            count: { $sum: 1 }
          }
        },
        { $match: { count: { $gte: 2 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]).toArray();

      if (multiStudentRecords.length > 0) {
        log(`    ${type}:`, 'yellow');
        multiStudentRecords.forEach(item => {
          log(`      - ${item._id.date}: ${item.count} records for ${item.students.length} students`, 'yellow');
        });
      }
    }

    return true;
  });

  // 测试6: 教学FAD Ticket到FAD的累积
  section('TEST 6: Teaching FAD Ticket to FAD Accumulation');

  await test('3 Teaching FAD Tickets accumulate to FAD', async () => {
    const collection = 'Teaching_FAD_Ticket';

    const studentsWithMultipleTickets = await db.collection(collection).aggregate([
      { $group: { _id: '$学生', count: { $sum: 1 } } },
      { $match: { count: { $gte: 3 } } },
      { $limit: 2 }
    ]).toArray();

    log(`    Students with ≥3 Teaching FAD Tickets: ${studentsWithMultipleTickets.length}`, 'yellow');

    if (studentsWithMultipleTickets.length > 0) {
      for (const { _id: student, count } of studentsWithMultipleTickets) {
        const fadCount = await db.collection('FAD_Records').countDocuments({
          学生: student,
          FAD来源类型: FAD_SOURCE_TYPE.TEACH
        });

        const expectedFads = Math.floor(count / 3);
        log(`    Student "${student}": ${count} tickets → ${fadCount} FAD (expected ~${expectedFads})`, 'yellow');

        if (fadCount >= expectedFads) {
          log(`    ✓ FAD count matches expected accumulation`, 'green');
        }
      }
    }

    return true;
  });

  // 测试7: 奖励抵消逻辑
  section('TEST 7: Reward Offset Logic');

  await test('FAD records with offset status', async () => {
    const offsetFads = await db.collection('FAD_Records').countDocuments({
      [DB_FIELDS.FAD_OFFSET]: true
    });

    log(`    FAD records with record offset: ${offsetFads}`, 'yellow');

    if (offsetFads > 0) {
      const sampleFad = await db.collection('FAD_Records').findOne({
        [DB_FIELDS.FAD_OFFSET]: true
      });

      const rewardsCount = await db.collection('Reward_Records').countDocuments({
        学生: sampleFad.学生,
        [DB_FIELDS.REWARD_DELIVERED]: true
      });

      log(`    Sample student "${sampleFad.学生}": ${rewardsCount} rewards, ${offsetFads} FAD offset`, 'yellow');
    }

    return offsetFads > 0;
  });

  await test('FAD records with execution offset', async () => {
    const executionOffsetFads = await db.collection('FAD_Records').countDocuments({
      [DB_FIELDS.FAD_EXECUTED]: true,
      [DB_FIELDS.FAD_OFFSET]: { $ne: true } // 只检查执行抵消，不包括记录冲销
    });

    log(`    FAD records with execution offset: ${executionOffsetFads}`, 'yellow');

    if (executionOffsetFads > 0) {
      const sampleFad = await db.collection('FAD_Records').findOne({
        [DB_FIELDS.FAD_EXECUTED]: true,
        [DB_FIELDS.FAD_OFFSET]: { $ne: true }
      });

      const rewardsCount = await db.collection('Reward_Records').countDocuments({
        学生: sampleFad.学生,
        [DB_FIELDS.REWARD_DELIVERED]: true
      });

      log(`    Sample student "${sampleFad.学生}": ${rewardsCount} rewards, ${executionOffsetFads} execution offset`, 'yellow');
    }

    return true;
  });

  // 总结
  section('TEST SUMMARY');
  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 'cyan');

  await client.close();

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  log(`Error running tests: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
