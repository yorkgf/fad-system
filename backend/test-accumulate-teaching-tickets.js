const { MongoClient } = require('mongodb');
const { ACCUMULATE_RULES } = require('./src/utils/constants');

async function testAccumulateTeachingTickets() {
  const client = await MongoClient.connect('mongodb://49.235.189.246:27017');
  const db = client.db('GHA');

  const rule = ACCUMULATE_RULES['Teaching FAD Ticket'];

  const student = '梁恒嘉/Josh';
  const semester = '秋季(Fall)';

  // 查询该学生未累计的Teaching FAD Ticket
  const unaccumulatedTickets = await db.collection('Teaching_FAD_Ticket').find({
    '学生': student,
    '学期': semester,
    '是否已累计FAD': { $ne: true }
  }).toArray();

  console.log(`Unaccumulated tickets for ${student} (${semester}):`, unaccumulatedTickets.length);

  if (unaccumulatedTickets.length < rule.count) {
    console.log(`Need at least ${rule.count} unaccumulated tickets to trigger FAD`);
    await client.close();
    return;
  }

  // 检查是否已存在对应的FAD
  const existingFAD = await db.collection('FAD_Records').findOne({
    '学生': student,
    '学期': semester,
    'FAD来源类型': 'teach',
    '记录老师': `系统: 累计Teaching FAD Ticket触发`
  });

  if (existingFAD) {
    console.log('FAD record already exists:', existingFAD);
    await client.close();
    return;
  }

  // 插入新的FAD
  console.log(`Inserting FAD for ${student} (${semester})...`);
  const fadResult = await db.collection('FAD_Records').insertOne({
    记录类型: 'FAD',
    记录日期: new Date(),
    学生: student,
    班级: '10A', // 暂时硬编码班级
    记录老师: `系统: 累计Teaching FAD Ticket触发`,
    记录事由: `累计${rule.count}次Teaching FAD Ticket`,
    学期: semester,
    FAD来源类型: rule.sourceType,
    是否已执行或冲抵: false,
    执行日期: null,
    是否已冲销记录: false,
    '冲销记录Reward ID': []
  });

  // 标记已累计
  const idsToMark = unaccumulatedTickets.slice(0, rule.count).map(ticket => ticket._id);
  await db.collection('Teaching_FAD_Ticket').updateMany(
    { _id: { $in: idsToMark } },
    {
      $set: {
        是否已累计FAD: true,
        '累计FAD ID': fadResult.insertedId.toString()
      }
    }
  );

  console.log('FAD created and tickets marked as accumulated');

  await client.close();
}

testAccumulateTeachingTickets().catch(err => console.error('Error:', err));
