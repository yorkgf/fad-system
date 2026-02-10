const { MongoClient } = require('mongodb');
const { FAD_SOURCE_TYPE } = require('./src/utils/constants');

async function migrateFADSourceTypes() {
  const client = await MongoClient.connect('mongodb://49.235.189.246:27017');
  const db = client.db('GHA');

  console.log('Starting FAD来源类型 migration...');

  // 1. Count how many records need migration
  const noSourceCount = await db.collection('FAD_Records').countDocuments({
    'FAD来源类型': { $exists: false }
  });

  console.log(`Records to migrate: ${noSourceCount}`);

  if (noSourceCount === 0) {
    console.log('No records need migration');
    await client.close();
    return;
  }

  // 2. Migration strategy: determine source type based on 记录老师
  const migrationRules = [
    {
      pattern: /上网课违规/,
      sourceType: FAD_SOURCE_TYPE.ELEC
    },
    {
      pattern: /累计.*迟到|累计.*未按规定|累计.*擅自/,
      sourceType: FAD_SOURCE_TYPE.OTHER
    },
    {
      pattern: /累计.*寝室/,
      sourceType: FAD_SOURCE_TYPE.DORM
    },
    {
      pattern: /累计.*Teaching/,
      sourceType: FAD_SOURCE_TYPE.TEACH
    },
    {
      pattern: /22:00后/,
      sourceType: FAD_SOURCE_TYPE.DORM
    }
  ];

  // 3. Migrate records
  let updatedCount = 0;
  const cursor = db.collection('FAD_Records').find({
    'FAD来源类型': { $exists: false }
  }, { '记录老师': 1, '记录事由': 1 });

  for await (const fadRecord of cursor) {
    let sourceType = null;

    // Try to determine source type from 记录老师
    for (const rule of migrationRules) {
      if (rule.pattern.test(fadRecord['记录老师'])) {
        sourceType = rule.sourceType;
        break;
      }
    }

    // If not determined from 记录老师, try from 记录事由
    if (!sourceType && fadRecord['记录事由']) {
      for (const rule of migrationRules) {
        if (rule.pattern.test(fadRecord['记录事由'])) {
          sourceType = rule.sourceType;
          break;
        }
      }
    }

    // Fallback to OTHER if no pattern matches
    if (!sourceType) {
      sourceType = FAD_SOURCE_TYPE.OTHER;
    }

    // Update the record
    await db.collection('FAD_Records').updateOne(
      { _id: fadRecord._id },
      { $set: { 'FAD来源类型': sourceType } }
    );

    updatedCount++;

    if (updatedCount % 50 === 0) {
      console.log(`Progress: ${updatedCount}/${noSourceCount}`);
    }
  }

  // 4. Verify migration
  const stillNoSourceCount = await db.collection('FAD_Records').countDocuments({
    'FAD来源类型': { $exists: false }
  });

  const sourceTypeCounts = await db.collection('FAD_Records').aggregate([
    {
      $group: {
        _id: '$FAD来源类型',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();

  console.log('\nMigration completed!');
  console.log(`Records updated: ${updatedCount}`);
  console.log(`Records still without source type: ${stillNoSourceCount}`);
  console.log('\nSource type distribution:');
  sourceTypeCounts.forEach(item => {
    console.log(`  ${item._id}: ${item.count}`);
  });

  await client.close();
}

migrateFADSourceTypes().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
