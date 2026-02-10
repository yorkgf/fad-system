const { MongoClient } = require('mongodb');
const { ACCUMULATE_RULES } = require('./src/utils/constants');

async function checkLouisTickets() {
  const client = await MongoClient.connect('mongodb://49.235.189.246:27017');
  const db = client.db('GHA');

  const student = '周羲平/Louis';
  const semester = '秋季(Fall)';

  const rule = ACCUMULATE_RULES['Teaching FAD Ticket'];

  // 查询所有Teaching FAD Ticket
  const allTickets = await db.collection('Teaching_FAD_Ticket').find({
    '学生': student,
    '学期': semester
  }).toArray();

  console.log(`All Teaching FAD Ticket for ${student} (${semester}): ${allTickets.length}`);

  // 打印每个ticket的状态
  allTickets.forEach((ticket, index) => {
    console.log(`  Ticket ${index + 1}: 是否已累计FAD=${ticket['是否已累计FAD']}`);
    if (ticket['累计FAD ID']) {
      console.log(`    - 累计FAD ID: ${ticket['累计FAD ID']}`);
    }
  });

  // 检查对应的FAD记录
  const fadRecords = await db.collection('FAD_Records').find({
    '学生': student,
    '学期': semester,
    'FAD来源类型': 'teach'
  }).toArray();

  console.log(`\nFAD records (teach source): ${fadRecords.length}`);
  fadRecords.forEach((fad, index) => {
    console.log(`  FAD ${index + 1}: ${fad.记录事由}`);
    console.log(`    - 记录老师: ${fad.记录老师}`);
    console.log(`    - FAD来源类型: ${fad['FAD来源类型']}`);
    if (fad['累计FAD ID']) {
      console.log(`    - 累计FAD ID: ${fad['累计FAD ID']}`);
    }
  });

  // 检查是否有FAD记录对应的累计ID
  for (const ticket of allTickets) {
    if (ticket['累计FAD ID']) {
      const fad = await db.collection('FAD_Records').findOne({
        _id: require('mongodb').ObjectId(ticket['累计FAD ID'])
      });
      if (!fad) {
        console.log(`\nWARNING: Ticket ${ticket._id} references missing FAD ${ticket['累计FAD ID']}`);
      }
    }
  }

  await client.close();
}

checkLouisTickets().catch(err => console.error('Error:', err));
