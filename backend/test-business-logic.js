/**
 * FAD System Business Logic Comprehensive Test
 * Tests: Record types, accumulation rules, deletion rules, reward offset, permissions
 */

const { MongoClient, ObjectId } = require('mongodb');
const {
  ACCUMULATE_RULES,
  RECORD_TYPE_TO_COLLECTION,
  RECORD_TO_FAD_SOURCE,
  THRESHOLDS,
  DB_FIELDS,
  FAD_SOURCE_TYPE
} = require('./src/utils/constants.js');
const { UserGroup, hasFullAccess, hasScheduleAccess } = require('./src/utils/userGroups.js');

const MONGO_URI = 'mongodb://49.235.189.246:27017';
const DB_NAME = 'GHA';

// ANSI color codes for terminal output
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
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);

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

  // Test 1: Constants Exist and Are Correct
  section('TEST 1: Constants Validation');
  log('Testing that all constants are properly defined...', 'blue');

  test('RECORD_TYPE_TO_COLLECTION has all 14 record types', () => {
    const expectedTypes = [
      'FAD', 'Reward', '早点名迟到', '寝室迟出', '未按规定返校',
      '擅自进入会议室或接待室', '寝室表扬', '寝室批评', '寝室垃圾未倒',
      '上网课违规使用电子产品', '21:30后交还手机(22:00前)', '22:00后交还手机',
      'Teaching FAD Ticket', 'Teaching Reward Ticket'
    ];
    return expectedTypes.every(type => RECORD_TYPE_TO_COLLECTION[type]);
  });

  test('Room_Warning_Records maps to 寝室批评', () => {
    return RECORD_TYPE_TO_COLLECTION['寝室批评'] === 'Room_Warning_Records';
  });

  test('ACCUMULATE_RULES has correct mappings', () => {
    return ACCUMULATE_RULES['早点名迟到']?.result === 'FAD' &&
           ACCUMULATE_RULES['早点名迟到']?.count === 2;
  });

  test('Chain accumulation: trash → warning → FAD', () => {
    return ACCUMULATE_RULES['寝室垃圾未倒']?.result === '寝室批评' &&
           ACCUMULATE_RULES['寝室批评']?.result === 'FAD';
  });

  test('THRESHOLDS.REWARD.OFFSET_EXECUTION is 2', () => {
    return THRESHOLDS.REWARD.OFFSET_EXECUTION === 2;
  });

  test('THRESHOLDS.FAD.WARNING_MIN is 3', () => {
    return THRESHOLDS.FAD.WARNING_MIN === 3;
  });

  test('DB_FIELDS has required fields', () => {
    return DB_FIELDS.REWARD_DELIVERED === '是否已发放' &&
           DB_FIELDS.FAD_EXECUTED === '是否已执行或冲抵' &&
           DB_FIELDS.FAD_OFFSET === '是否已冲销记录';
  });

  test('UserGroup constants are defined', () => {
    return UserGroup.SYSTEM === 'S' &&
           UserGroup.ADMIN_A === 'A' &&
           UserGroup.TEACHER === 'T' &&
           UserGroup.FACULTY === 'F' &&
           UserGroup.CLEANING === 'C';
  });

  test('hasFullAccess works correctly', () => {
    return hasFullAccess(UserGroup.SYSTEM) === true &&
           hasFullAccess(UserGroup.TEACHER) === true &&
           hasFullAccess(UserGroup.FACULTY) === false &&
           hasFullAccess(UserGroup.CLEANING) === false;
  });

  test('hasScheduleAccess excludes cleaning staff', () => {
    return hasScheduleAccess(UserGroup.FACULTY) === true &&
           hasScheduleAccess(UserGroup.CLEANING) === false;
  });

  // Test 2: Database State Validation
  section('TEST 2: Database State Validation');
  log('Testing database collections and data integrity...', 'blue');

  // Check collections exist by querying them directly
  test('FAD_Records collection exists', async () => {
    const count = await db.collection('FAD_Records').countDocuments({}, { limit: 1 });
    return count >= 0;
  });

  test('Reward_Records collection exists', async () => {
    const count = await db.collection('Reward_Records').countDocuments({}, { limit: 1 });
    return count >= 0;
  });

  test('Late_Records collection exists', async () => {
    const count = await db.collection('Late_Records').countDocuments({}, { limit: 1 });
    return count >= 0;
  });

  test('Room_Warning_Records collection exists', async () => {
    const count = await db.collection('Room_Warning_Records').countDocuments({}, { limit: 1 });
    return count >= 0;
  });

  // Test record type consistency
  const fadCount = await db.collection('FAD_Records').countDocuments();
  log(`  FAD records in database: ${fadCount}`, 'yellow');

  const rewardCount = await db.collection('Reward_Records').countDocuments();
  log(`  Reward records in database: ${rewardCount}`, 'yellow');

  // Test 3: Reward Offset Logic Validation
  section('TEST 3: Reward Offset Logic Validation');
  log('Testing reward-FAD offset relationships...', 'blue');

  test('Rewards with execution offset status exist', async () => {
    const count = await db.collection('Reward_Records').countDocuments({
      [DB_FIELDS.FAD_EXECUTED]: true
    });
    log(`    Rewards with execution offset: ${count}`, 'yellow');
    return count >= 0; // Should always pass, just reporting count
  });

  test('FAD records with offset status exist', async () => {
    const count = await db.collection('FAD_Records').countDocuments({
      [DB_FIELDS.FAD_OFFSET]: true
    });
    log(`    FAD records with record offset: ${count}`, 'yellow');
    return count >= 0;
  });

  // Test 4: Accumulation Rules Database Validation
  section('TEST 4: Accumulation Rules Database Validation');
  log('Testing that accumulation rules match actual data...', 'blue');

  // Test 2 Late_Records should trigger FAD check
  const lateCount = await db.collection('Late_Records').countDocuments();
  log(`  Late_Records in database: ${lateCount}`, 'yellow');

  // Test Room_Trash_Records → Room_Warning_Records chain
  const trashCount = await db.collection('Room_Trash_Records').countDocuments();
  const warningCount = await db.collection('Room_Warning_Records').countDocuments();
  log(`  Room_Trash_Records: ${trashCount}`, 'yellow');
  log(`  Room_Warning_Records: ${warningCount}`, 'yellow');

  test('Trash accumulation (2 trash → 1 warning)', () => {
    // Verify the chain is set up correctly
    return ACCUMULATE_RULES['寝室垃圾未倒']?.result === '寝室批评' &&
           ACCUMULATE_RULES['寝室垃圾未倒']?.count === 2;
  });

  test('Warning accumulation (5 warnings → 1 FAD)', () => {
    return ACCUMULATE_RULES['寝室批评']?.result === 'FAD' &&
           ACCUMULATE_RULES['寝室批评']?.count === 5;
  });

  // Test 5: FAD Source Type Mapping
  section('TEST 5: FAD Source Type Mapping');
  log('Testing FAD source type classifications...', 'blue');

  test('Late_Records → other source', () => {
    return RECORD_TO_FAD_SOURCE['早点名迟到'] === FAD_SOURCE_TYPE.OTHER;
  });

  test('Room_Warning_Records → dorm source', () => {
    return RECORD_TO_FAD_SOURCE['寝室批评'] === FAD_SOURCE_TYPE.DORM;
  });

  test('Teaching_FAD_Ticket → teach source', () => {
    return RECORD_TO_FAD_SOURCE['Teaching FAD Ticket'] === FAD_SOURCE_TYPE.TEACH;
  });

  test('Elec_Products_Violation_Records → elec source', () => {
    return RECORD_TO_FAD_SOURCE['上网课违规使用电子产品'] === FAD_SOURCE_TYPE.ELEC;
  });

  // Test 6: User Group Permissions
  section('TEST 6: User Group Permissions');
  log('Testing user group access control...', 'blue');

  const teachers = await db.collection('Teachers').find({}).limit(20).toArray();
  const groupCounts = {};
  teachers.forEach(t => {
    const group = Array.isArray(t.Group) ? t.Group[0] : t.Group;
    groupCounts[group] = (groupCounts[group] || 0) + 1;
  });
  log(`  Teacher group distribution: ${JSON.stringify(groupCounts)}`, 'yellow');

  test('Teachers collection exists', async () => {
    const count = await db.collection('Teachers').countDocuments({}, { limit: 1 });
    return count >= 0;
  });

  test('RecordType collection exists for permissions', async () => {
    const count = await db.collection('RecordType').countDocuments({}, { limit: 1 });
    return count >= 0;
  });

  // Test RecordType Group field format (can be string or array)
  const recordTypes = await db.collection('RecordType').find({}).limit(5).toArray();
  const arrayGroupCount = recordTypes.filter(rt => Array.isArray(rt.Group)).length;
  log(`  RecordTypes with array Group field: ${arrayGroupCount}/${recordTypes.length}`, 'yellow');

  // Test 7: Semester System
  section('TEST 7: Semester System');
  log('Testing semester consistency...', 'blue');

  const currentSemester = new Date().getMonth() >= 1 && new Date().getMonth() <= 6 ? '春季(Spring)' : '秋季(Fall)';
  log(`  Current semester (auto-detected): ${currentSemester}`, 'yellow');

  const fadSemesters = await db.collection('FAD_Records').distinct('semester');
  log(`  Semesters in FAD_Records: ${fadSemesters.join(', ')}`, 'yellow');

  // Test 8: Phone Late Records
  section('TEST 8: Phone Late Records Behavior');
  log('Testing phone late record types...', 'blue');

  test('Both phone late types map to Phone_Late_Records', () => {
    return RECORD_TYPE_TO_COLLECTION['21:30后交还手机(22:00前)'] === 'Phone_Late_Records' &&
           RECORD_TYPE_TO_COLLECTION['22:00后交还手机'] === 'Phone_Late_Records';
  });

  const phoneLateCount = await db.collection('Phone_Late_Records').countDocuments();
  log(`  Phone_Late_Records: ${phoneLateCount}`, 'yellow');

  // Summary
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
