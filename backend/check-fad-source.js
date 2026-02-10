const { MongoClient } = require('mongodb');

async function checkFADSource() {
  const client = await MongoClient.connect('mongodb://49.235.189.246:27017');
  const db = client.db('GHA');

  const fadRecords = await db.collection('FAD_Records').find({}, {
    '学生': 1,
    'FAD来源类型': 1,
    '记录日期': 1,
    '记录老师': 1
  }).limit(20).toArray();

  console.log('FAD Records with source type:');
  fadRecords.forEach(record => {
    const sourceType = record['FAD来源类型'];
    const teacher = record['记录老师'];
    console.log(`  ${record.学生} - 来源: ${sourceType || '未设置'}, 记录老师: ${teacher}`);
  });

  await client.close();
}

checkFADSource().catch(err => console.error('Error:', err));
