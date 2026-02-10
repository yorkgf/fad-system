const { MongoClient } = require('mongodb');
const { FAD_SOURCE_TYPE } = require('./src/utils/constants');

async function testFADSource() {
  const client = await MongoClient.connect('mongodb://49.235.189.246:27017');
  const db = client.db('GHA');

  // Test 1: Check if field exists in any document
  const sampleFAD = await db.collection('FAD_Records').findOne({}, { 'FAD来源类型': 1 });
  console.log('Sample FAD has FAD来源类型 field:', 'FAD来源类型' in (sampleFAD || {}));

  // Test 2: Check a specific FAD that should have source type
  const elecFAD = await db.collection('FAD_Records').findOne({
    '记录老师': /上网课违规/
  }, { '学生': 1, 'FAD来源类型': 1, '记录老师': 1 });
  if (elecFAD) {
    console.log('\nElectronics violation FAD:');
    console.log(`  学生: ${elecFAD.学生}`);
    console.log(`  记录老师: ${elecFAD['记录老师']}`);
    console.log(`  FAD来源类型: ${elecFAD['FAD来源类型']}`);
  } else {
    console.log('\nNo electronics violation FAD records found');
  }

  // Test 3: Check a system-generated FAD from accumulation
  const accumulatedFAD = await db.collection('FAD_Records').findOne({
    '记录老师': /累计/
  }, { '学生': 1, 'FAD来源类型': 1, '记录老师': 1 });
  if (accumulatedFAD) {
    console.log('\nAccumulated FAD:');
    console.log(`  学生: ${accumulatedFAD.学生}`);
    console.log(`  记录老师: ${accumulatedFAD['记录老师']}`);
    console.log(`  FAD来源类型: ${accumulatedFAD['FAD来源类型']}`);
  } else {
    console.log('\nNo accumulated FAD records found');
  }

  // Test 4: Insert a new test FAD and check if field is set
  console.log('\nInserting test FAD record...');
  const testResult = await db.collection('FAD_Records').insertOne({
    记录类型: 'FAD',
    记录日期: new Date(),
    学生: '测试学生/TEST',
    班级: '10A',
    记录老师: '测试: 手动添加',
    记录事由: '测试FAD来源类型字段',
    学期: '春季(Spring)',
    FAD来源类型: FAD_SOURCE_TYPE.TEACH,
    是否已执行或冲抵: false,
    执行日期: null,
    是否已冲销记录: false,
    '冲销记录Reward ID': []
  });

  console.log(`Test FAD inserted with ID: ${testResult.insertedId}`);

  const insertedFAD = await db.collection('FAD_Records').findOne(
    { _id: testResult.insertedId },
    { 'FAD来源类型': 1 }
  );

  console.log(`Inserted FAD has FAD来源类型: ${insertedFAD['FAD来源类型']}`);

  // Clean up test document
  await db.collection('FAD_Records').deleteOne({ _id: testResult.insertedId });
  console.log('Test FAD deleted');

  // Test 5: Check if existing FAD records have the field
  const noSourceCount = await db.collection('FAD_Records').countDocuments({
    'FAD来源类型': { $exists: false }
  });

  const totalFADCount = await db.collection('FAD_Records').countDocuments();

  console.log(`\nTotal FAD records: ${totalFADCount}`);
  console.log(`FAD records without source type: ${noSourceCount}`);

  if (noSourceCount > 0) {
    console.log('This indicates the field was introduced recently');
  }

  await client.close();
}

testFADSource().catch(err => console.error('Error:', err));
