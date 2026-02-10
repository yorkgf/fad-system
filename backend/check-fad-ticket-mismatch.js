const { MongoClient, ObjectId } = require('mongodb');

async function checkFADTicketMismatch() {
  const client = await MongoClient.connect('mongodb://49.235.189.246:27017');
  const db = client.db('GHA');

  // 查找有累计FAD ID的Teaching FAD Ticket记录
  const ticketsWithFAD = await db.collection('Teaching_FAD_Ticket').find({
    '累计FAD ID': { $exists: true, $ne: null }
  }, { '学生': 1, '累计FAD ID': 1, '学期': 1 }).toArray();

  console.log('Teaching FAD Ticket records with 累计FAD ID:', ticketsWithFAD.length);

  let mismatchCount = 0;

  for (const ticket of ticketsWithFAD.slice(0, 20)) {
    try {
      const fad = await db.collection('FAD_Records').findOne({
        _id: new ObjectId(ticket['累计FAD ID'])
      }, { 'FAD来源类型': 1, '学生': 1 });

      if (fad) {
        if (fad['FAD来源类型'] !== 'teach') {
          mismatchCount++;
          console.log(`Mismatch - ${ticket.学生}: FAD source is ${fad['FAD来源类型']}`);
        }
      }
    } catch (err) {
      console.error('Error checking ticket:', err);
    }
  }

  console.log(`Mismatch count (source != teach): ${mismatchCount}`);

  await client.close();
}

checkFADTicketMismatch().catch(err => console.error('Error:', err));
