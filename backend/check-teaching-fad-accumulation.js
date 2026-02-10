const { MongoClient } = require('mongodb');

async function checkTeachingFADAccumulation() {
  const client = await MongoClient.connect('mongodb://49.235.189.246:27017');
  const db = client.db('GHA');

  // 查询有Teaching FAD Ticket的学生
  const studentsWithTickets = await db.collection('Teaching_FAD_Ticket').aggregate([
    { $group: { _id: '$学生', count: { $sum: 1 } } },
    { $match: { count: { $gte: 2 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]).toArray();

  console.log('Students with Teaching FAD Tickets:');
  for (const student of studentsWithTickets) {
    console.log(`  ${student._id}: ${student.count} tickets`);

    // 查询该学生的FAD记录
    const fadRecords = await db.collection('FAD_Records').find({
      '学生': student._id,
      'FAD来源类型': 'teach'
    }).toArray();

    console.log(`    → ${fadRecords.length} FAD records (teach source)`);

    // 如果没有teach来源的FAD，检查其他来源
    if (fadRecords.length === 0) {
      const allFADs = await db.collection('FAD_Records').find({ '学生': student._id }).toArray();
      console.log(`    → ${allFADs.length} total FAD records`);

      if (allFADs.length > 0) {
        const sources = {};
        allFADs.forEach(fad => {
          const source = fad['FAD来源类型'] || '未设置';
          sources[source] = (sources[source] || 0) + 1;
        });
        console.log(`    → Source distribution: ${JSON.stringify(sources, null, 2)}`);
      }
    }
  }

  // 检查ACCUMULATE_RULES配置
  console.log('\nACCUMULATE_RULES for Teaching FAD Ticket:');
  const { ACCUMULATE_RULES } = require('./src/utils/constants');
  console.log(ACCUMULATE_RULES['Teaching FAD Ticket']);

  await client.close();
}

checkTeachingFADAccumulation().catch(err => console.error('Error:', err));
