const { MongoClient } = require('mongodb');

// MongoDB连接配置
const url = 'mongodb://49.235.189.246:27017';
const dbName = 'GHS';

// 教师测试数据
const teachers = [
    {
        email: 'zhangsan@school.com',
        password: '123456',
        name: '张三',
        grades: ['一年级', '二年级'],
        subjects: ['语文', '数学'],
        meetingId: '123456789',
        meetingPassword: '123456'
    },
    {
        email: 'lisi@school.com',
        password: '123456',
        name: '李四',
        grades: ['三年级', '四年级'],
        subjects: ['数学', '英语'],
        meetingId: '987654321',
        meetingPassword: '654321'
    },
    {
        email: 'wangwu@school.com',
        password: '123456',
        name: '王五',
        grades: ['五年级', '六年级'],
        subjects: ['英语', '科学'],
        meetingId: '456789123',
        meetingPassword: '789123'
    },
    {
        email: 'zhaoliu@school.com',
        password: '123456',
        name: '赵六',
        grades: ['一年级', '三年级'],
        subjects: ['语文', '美术'],
        meetingId: '321654987',
        meetingPassword: '321654'
    },
    {
        email: 'sunqi@school.com',
        password: '123456',
        name: '孙七',
        grades: ['二年级', '四年级'],
        subjects: ['数学', '音乐'],
        meetingId: '789123456',
        meetingPassword: '456789'
    }
];

// 示例可用时间段（明天和后天的时段）
function generateSampleSessions() {
    const sessions = [];
    const teacherNames = ['张三', '李四', '王五', '赵六', '孙七'];

    // 生成未来3天的时段
    for (let day = 1; day <= 3; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];

        teacherNames.forEach(teacherName => {
            // 每个老师每天添加4个时段
            const timeSlots = [
                { start: '09:00', end: '09:15' },
                { start: '09:15', end: '09:30' },
                { start: '14:00', end: '14:15' },
                { start: '14:15', end: '14:30' }
            ];

            timeSlots.forEach(slot => {
                sessions.push({
                    teacherName,
                    date: dateStr,
                    startTime: slot.start,
                    endTime: slot.end
                });
            });
        });
    }

    return sessions;
}

// 示例预约记录
function generateSampleBookings() {
    return [
        {
            sessionId: null, // 将在插入后填充
            teacherName: '张三',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '09:15',
            bookedBy: '小明的家长',
            parentPhone: '13800138000',
            studentName: '小明'
        },
        {
            sessionId: null,
            teacherName: '李四',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            startTime: '14:00',
            endTime: '14:15',
            bookedBy: '小红的家长',
            parentPhone: '13900139000',
            studentName: '小红'
        }
    ];
}

async function initDatabase() {
    let client;

    try {
        console.log('正在连接 MongoDB...');
        client = new MongoClient(url);
        await client.connect();
        const db = client.db(dbName);

        // 初始化教师数据
        console.log('\n初始化教师数据...');
        const teachersCount = await db.collection('teachers').countDocuments();

        if (teachersCount === 0) {
            await db.collection('teachers').insertMany(teachers);
            console.log(`✓ 插入 ${teachers.length} 位教师`);
        } else {
            console.log(`✓ 教师数据已存在 (${teachersCount} 位)`);
        }

        // 初始化可用时段
        console.log('\n初始化可用时段...');
        const sessionsCount = await db.collection('sessions').countDocuments();

        if (sessionsCount === 0) {
            const sessions = generateSampleSessions();
            const result = await db.collection('sessions').insertMany(sessions);
            console.log(`✓ 插入 ${sessions.length} 个可用时段`);
        } else {
            console.log(`✓ 时段数据已存在 (${sessionsCount} 个)`);
        }

        // 显示教师列表
        console.log('\n教师账号列表：');
        console.log('─'.repeat(60));
        teachers.forEach(t => {
            console.log(`  ${t.name.padEnd(8)} | ${t.email.padEnd(25)} | 密码: ${t.password}`);
        });
        console.log('─'.repeat(60));

        // 显示数据统计
        const stats = {
            teachers: await db.collection('teachers').countDocuments(),
            sessions: await db.collection('sessions').countDocuments(),
            booked: await db.collection('sessions').countDocuments({ bookedBy: { $exists: true, $ne: '' } })
        };

        console.log('\n数据库统计：');
        console.log(`  教师数量: ${stats.teachers}`);
        console.log(`  可用时段: ${stats.sessions}`);
        console.log(`  已预约: ${stats.booked}`);
        console.log(`  可预约: ${stats.sessions - stats.booked}`);

        console.log('\n✓ 数据库初始化完成！');

    } catch (error) {
        console.error('初始化失败:', error);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

// 运行初始化
initDatabase();
