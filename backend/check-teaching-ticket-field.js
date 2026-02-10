const { MongoClient } = require('mongodb');

async function checkTeachingTicketField() {
  const client = await MongoClient.connect('mongodb://49.235.189.246:27017');
  const db = client.db('GHA');

  // 查询Teaching FAD Ticket记录，检查是否已累计FAD字段
  const teachingTickets = await db.collection('Teaching_FAD_Ticket').find({}, {
    '学生': 1,
    '学期': 1,
    '是否已累计FAD': 1
  }).limit(20).toArray();

  console.log('Teaching FAD Ticket records:');
  teachingTickets.forEach(ticket => {
    const hasField = '是否已累计FAD' in ticket;
    const value = ticket['是否已累计FAD'];
    console.log(`  ${ticket.学生} (${ticket.学期}): hasField=${hasField}, value=${value}`);
  });

  // 统计未累计的票数
  const unaccumulatedCount = await db.collection('Teaching_FAD_Ticket').countDocuments({
    '是否已累计FAD': { $ne: true }
  });

  const totalCount = await db.collection('Teaching_FAD_Ticket').countDocuments();

  console.log(`\nTotal tickets: ${totalCount}`);
  console.log(`Unaccumulated tickets: ${unaccumulatedCount}`);

  await client.close();
}

checkTeachingTicketField().catch(err => console.error('Error:', err));
