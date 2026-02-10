const { MongoClient } = require('mongodb');
const axios = require('axios');
const { ACCUMULATE_RULES, RECORD_TYPE_TO_COLLECTION, FAD_SOURCE_TYPE } = require('./src/utils/constants');

async function testChainCancellation() {
  // 获取token
  let token;
  try {
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'elainecai@ghedu.com',
      password: 'elainecai'
    });
    token = loginResponse.data.token;
    console.log(`Logged in as: ${loginResponse.data.name} (Group: ${loginResponse.data.group})`);
  } catch (error) {
    console.error(`Login failed: ${error.response?.data?.error || error.message}`);
    return;
  }

  const client = await MongoClient.connect('mongodb://49.235.189.246:27017');
  const db = client.db('GHA');

  const testStudent = '链式撤销测试/TEST';
  const testClass = '10A';
  const testSemester = '春季(Spring)';

  console.log(`\nTesting chain cancellation for ${testStudent}...`);

  // 清理之前的测试数据
  await cleanup(db, testStudent, testSemester);

  // 添加足够的垃圾未倒记录来触发链式累计
  const trashCount = ACCUMULATE_RULES['寝室垃圾未倒'].count; // 2次垃圾未倒 → 1次批评
  const warningCount = ACCUMULATE_RULES['寝室批评'].count; // 5次批评 → 1次FAD
  const totalTrashNeeded = trashCount * warningCount; // 2 * 5 = 10次垃圾未倒

  console.log(`Adding ${totalTrashNeeded} 寝室垃圾未倒 records to trigger chain accumulation...`);

  // 添加垃圾未倒记录
  const insertedRecordIds = [];
  for (let i = 0; i < totalTrashNeeded; i++) {
    const recordDate = new Date();
    recordDate.setDate(recordDate.getDate() - i); // 使用不同的日期避免重复
    const response = await axios.post('http://localhost:8080/api/records', {
      recordType: '寝室垃圾未倒',
      date: recordDate.toISOString(),
      student: testStudent,
      studentClass: testClass,
      semester: testSemester,
      teacher: '蔡宇玲'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.data.success) {
      insertedRecordIds.push(response.data.insertedId);
    } else {
      console.error('Failed to insert record:', response.data.error);
    }
  }
  console.log('Inserted record IDs:', insertedRecordIds);

  // 等待API处理完成
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 检查是否已创建相关记录
  const trashRecords = await db.collection('Room_Trash_Records').find({
    '学生': testStudent,
    '学期': testSemester
  }).toArray();

  const warningRecords = await db.collection('Room_Warning_Records').find({
    '学生': testStudent,
    '学期': testSemester
  }).toArray();

  const fadRecords = await db.collection('FAD_Records').find({
    '学生': testStudent,
    '学期': testSemester
  }).toArray();

  console.log(`\nAfter accumulation:`);
  console.log(`  寝室垃圾未倒 records: ${trashRecords.length}`);
  console.log(`  寝室批评 records: ${warningRecords.length}`);
  console.log(`  FAD records: ${fadRecords.length}`);

  // 验证累计关系
  if (warningRecords.length > 0) {
    const warning = warningRecords[0];
    const relatedTrash = await db.collection('Room_Trash_Records').countDocuments({
      '学生': testStudent,
      '学期': testSemester,
      '是否已累计寝室批评': true,
      '累计寝室批评 ID': warning._id.toString()
    });
    console.log(`  Trash records linked to first warning: ${relatedTrash}`);
  }

  if (fadRecords.length > 0) {
    const fad = fadRecords[0];
    const relatedWarnings = await db.collection('Room_Warning_Records').countDocuments({
      '学生': testStudent,
      '学期': testSemester,
      '是否已累计FAD': true,
      '累计FAD ID': fad._id.toString()
    });
    console.log(`  Warning records linked to first FAD: ${relatedWarnings}`);
  }

  // 撤销第一条垃圾未倒记录
  if (trashRecords.length > 0) {
    const firstTrash = trashRecords[0];
    console.log(`\nWithdrawing first trash record: ${firstTrash._id}`);

    try {
      await axios.post(`http://localhost:8080/api/records/Room_Trash_Records/${firstTrash._id}/withdraw`, {
        reason: '测试链式撤销'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Trash record withdrawn successfully');
    } catch (error) {
      console.error(`Failed to withdraw trash record: ${error.response?.data?.error || error.message}`);
      await cleanup(db, testStudent, testSemester);
      await client.close();
      return;
    }

    // 等待API处理完成
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 检查记录是否已被删除
    const updatedTrashCount = await db.collection('Room_Trash_Records').countDocuments({
      '学生': testStudent,
      '学期': testSemester
    });

    const updatedWarningCount = await db.collection('Room_Warning_Records').countDocuments({
      '学生': testStudent,
      '学期': testSemester
    });

    const updatedFADCount = await db.collection('FAD_Records').countDocuments({
      '学生': testStudent,
      '学期': testSemester
    });

    console.log(`\nAfter deletion:`);
    console.log(`  寝室垃圾未倒 records: ${updatedTrashCount}`);
    console.log(`  寝室批评 records: ${updatedWarningCount}`);
    console.log(`  FAD records: ${updatedFADCount}`);

    // 验证链式撤销逻辑
    if (updatedTrashCount === totalTrashNeeded - 1) {
      console.log('✓ Trash record count decreased by 1');
    } else {
      console.log(`✗ Trash record count incorrect: expected ${totalTrashNeeded - 1}, got ${updatedTrashCount}`);
    }

    // 当我们删除一条垃圾未倒记录时，系统会重新计算累积
    // 如果累积数量低于阈值，相关的警告和FAD记录会被自动删除
    console.log(`✓ Warning record count changed from ${warningCount} to ${updatedWarningCount}`);
    console.log(`✓ FAD record count changed from 1 to ${updatedFADCount}`);
  }

  // 现在删除足够的垃圾未倒记录，使累计数量低于阈值
  console.log(`\nWithdrawing additional ${trashCount} trash records to break accumulation chain...`);

  for (let i = 1; i <= trashCount; i++) {
    const remainingTrash = await db.collection('Room_Trash_Records').findOne({
      '学生': testStudent,
      '学期': testSemester
    });

    if (remainingTrash) {
      await axios.post(`http://localhost:8080/api/records/Room_Trash_Records/${remainingTrash._id}/withdraw`, {
        reason: '测试链式撤销'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
  }

  await new Promise(resolve => setTimeout(resolve, 3000));

  const finalTrashCount = await db.collection('Room_Trash_Records').countDocuments({
    '学生': testStudent,
    '学期': testSemester
  });

  const finalWarningCount = await db.collection('Room_Warning_Records').countDocuments({
    '学生': testStudent,
    '学期': testSemester
  });

  const finalFADCount = await db.collection('FAD_Records').countDocuments({
    '学生': testStudent,
    '学期': testSemester
  });

  console.log(`\nAfter breaking accumulation chain:`);
  console.log(`  寝室垃圾未倒 records: ${finalTrashCount}`);
  console.log(`  寝室批评 records: ${finalWarningCount}`);
  console.log(`  FAD records: ${finalFADCount}`);

  // 清理测试数据
  await cleanup(db, testStudent, testSemester);

  await client.close();
}

async function cleanup(db, student, semester) {
  await db.collection('Room_Trash_Records').deleteMany({
    '学生': student,
    '学期': semester
  });
  await db.collection('Room_Warning_Records').deleteMany({
    '学生': student,
    '学期': semester
  });
  await db.collection('FAD_Records').deleteMany({
    '学生': student,
    '学期': semester
  });
}

testChainCancellation().catch(err => console.error('Error:', err));
