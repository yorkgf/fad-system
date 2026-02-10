const { MongoClient } = require('mongodb');
const { ACCUMULATE_RULES } = require('./src/utils/constants');

async function checkUnaccumulatedTeachingTickets() {
  const client = await MongoClient.connect('mongodb://49.235.189.246:27017');
  const db = client.db('GHA');

  const rule = ACCUMULATE_RULES['Teaching FAD Ticket'];
  if (!rule || rule.result !== 'FAD') {
    console.log('Teaching FAD Ticket accumulation rule not configured');
    await client.close();
    return;
  }

  console.log(`Teaching FAD Ticket accumulation rule: ${rule.count} tickets → 1 FAD`);

  // 查询学生未累计的Teaching FAD Ticket数
  const unaccumulatedCounts = await db.collection('Teaching_FAD_Ticket').aggregate([
    { $match: { '是否已累计FAD': { $ne: true } } },
    { $group: { _id: { student: '$学生', semester: '$学期' }, count: { $sum: 1 } } },
    { $match: { count: { $gte: rule.count } } }, // 找到应该累计的学生
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).toArray();

  console.log(`\nStudents with ≥${rule.count} unaccumulated tickets:`);
  for (const item of unaccumulatedCounts) {
    const { student, semester } = item._id;
    console.log(`  ${student} (${semester}): ${item.count} tickets`);

    // 检查该学生是否有对应的teach来源FAD
    const existingFADCount = await db.collection('FAD_Records').countDocuments({
      '学生': student,
      '学期': semester,
      'FAD来源类型': 'teach'
    });

    const expectedFADCount = Math.floor(item.count / rule.count);
    console.log(`    → Expected FAD: ${expectedFADCount}, Actual: ${existingFADCount}`);

    if (existingFADCount < expectedFADCount) {
      console.log(`    → FAD accumulation needed!`);
    }
  }

  await client.close();
}

checkUnaccumulatedTeachingTickets().catch(err => console.error('Error:', err));
