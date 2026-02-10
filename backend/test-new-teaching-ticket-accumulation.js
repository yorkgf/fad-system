const { MongoClient } = require('mongodb');
const axios = require('axios');
const { ACCUMULATE_RULES, RECORD_TYPE_TO_COLLECTION } = require('./src/utils/constants');

async function testNewTeachingTicketAccumulation() {
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

  const testStudent = '测试学生/TEST';
  const testClass = '10A';
  const testSemester = '春季(Spring)';

  console.log(`\nTesting accumulation for ${testStudent}...`);

  // 清理之前的测试数据
  await db.collection('Teaching_FAD_Ticket').deleteMany({
    '学生': testStudent,
    '学期': testSemester
  });
  await db.collection('FAD_Records').deleteMany({
    '学生': testStudent,
    '学期': testSemester
  });

  // 添加3个Teaching FAD Ticket
  const ticketsToAdd = [];
  for (let i = 0; i < ACCUMULATE_RULES['Teaching FAD Ticket'].count; i++) {
    ticketsToAdd.push({
      记录类型: 'Teaching FAD Ticket',
      记录日期: new Date(),
      学生: testStudent,
      班级: testClass,
      记录老师: '测试老师',
      学期: testSemester,
      是否已累计FAD: false,
      '累计FAD ID': null
    });
  }

  await db.collection('Teaching_FAD_Ticket').insertMany(ticketsToAdd);
  console.log(`Added ${ticketsToAdd.length} Teaching FAD Tickets`);

  // 调用插入记录API来触发累计
  try {
    await axios.post('http://localhost:8080/api/records', {
      recordType: 'Teaching FAD Ticket',
      date: new Date().toISOString(),
      student: testStudent,
      studentClass: testClass,
      semester: testSemester,
      teacher: '测试老师',
      description: '测试教学FAD票'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('API call successful');
  } catch (error) {
    console.error(`API call failed: ${error.response?.data?.error || error.message}`);
    await cleanup(db, testStudent, testSemester);
    await client.close();
    return;
  }

  // 检查是否有FAD记录
  await new Promise(resolve => setTimeout(resolve, 2000)); // 等待API处理完成

  const fadRecords = await db.collection('FAD_Records').find({
    '学生': testStudent,
    '学期': testSemester
  }).toArray();

  console.log(`\nFAD records created: ${fadRecords.length}`);

  if (fadRecords.length > 0) {
    fadRecords.forEach(fad => {
      console.log(`FAD created: ${fad.记录事由}`);
      console.log(`Source type: ${fad['FAD来源类型']}`);

      if (fad['FAD来源类型'] === 'teach') {
        console.log('✓ FAD has correct source type (teach)');
      } else {
        console.log('✗ FAD has incorrect source type');
      }
    });

    // 检查Teaching FAD Ticket是否已标记为累计
    const unaccumulatedTickets = await db.collection('Teaching_FAD_Ticket').countDocuments({
      '学生': testStudent,
      '学期': testSemester,
      '是否已累计FAD': false
    });

    console.log(`\nUnaccumulated tickets: ${unaccumulatedTickets}`);
  } else {
    console.log('✗ No FAD records created');
  }

  // 清理测试数据
  await cleanup(db, testStudent, testSemester);

  await client.close();
}

async function cleanup(db, student, semester) {
  await db.collection('Teaching_FAD_Ticket').deleteMany({
    '学生': student,
    '学期': semester
  });
  await db.collection('FAD_Records').deleteMany({
    '学生': student,
    '学期': semester
  });
}

testNewTeachingTicketAccumulation().catch(err => console.error('Error:', err));
