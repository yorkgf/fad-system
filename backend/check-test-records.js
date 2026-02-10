const { MongoClient } = require('mongodb');

async function checkTestRecords() {
  const client = await MongoClient.connect('mongodb://49.235.189.246:27017');
  const db = client.db('GHA');

  const testStudent = '链式撤销测试/TEST';
  const testClass = '10A';
  const testSemester = '春季(Spring)';

  // 查找测试学生的所有记录
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

  console.log('Trash records:');
  trashRecords.forEach((record, index) => {
    console.log(`  ${index + 1}: ${record._id} - ${record.记录日期}`);
  });

  console.log('\nWarning records:');
  warningRecords.forEach((record, index) => {
    console.log(`  ${index + 1}: ${record._id} - ${record.记录日期}`);
  });

  console.log('\nFAD records:');
  fadRecords.forEach((record, index) => {
    console.log(`  ${index + 1}: ${record._id} - ${record.记录日期}`);
  });

  await client.close();
}

checkTestRecords().catch(err => console.error('Error:', err));
