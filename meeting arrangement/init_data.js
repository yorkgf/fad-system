const { MongoClient } = require('mongodb');

async function initData() {
    const client = new MongoClient('mongodb://49.235.189.246:27017', {
        serverSelectionTimeoutMS: 5000
    });

    try {
        await client.connect();
        const db = client.db('GHS');
        console.log('已连接到数据库');

        // 清空现有数据（可选）
        // await db.collection('teachers').deleteMany({});
        // await db.collection('sessions').deleteMany({});
        // console.log('已清空现有数据');

        // 初始化教师数据
        const teachers = [
            {
                email: 'zhangsan@gha.edu',
                password: '123456',
                name: '张三',
                grades: ['Pre', 'G10'],
                subjects: ['语文', '数学'],
                meetingId: '888123456',
                meetingPassword: '123456'
            },
            {
                email: 'lisi@gha.edu',
                password: '123456',
                name: '李四',
                grades: ['G10', 'G11'],
                subjects: ['数学', '英语'],
                meetingId: '888654321',
                meetingPassword: '654321'
            },
            {
                email: 'wangwu@gha.edu',
                password: '123456',
                name: '王五',
                grades: ['G11', 'G12'],
                subjects: ['英语', '物理'],
                meetingId: '888789123',
                meetingPassword: '789123'
            },
            {
                email: 'zhaoliu@gha.edu',
                password: '123456',
                name: '赵六',
                grades: ['Pre', 'G11'],
                subjects: ['语文', '化学'],
                meetingId: '888321654',
                meetingPassword: '321654'
            },
            {
                email: 'sunqi@gha.edu',
                password: '123456',
                name: '孙七',
                grades: ['G10', 'G12'],
                subjects: ['数学', '生物'],
                meetingId: '888987456',
                meetingPassword: '456789'
            },
            {
                email: 'zhouba@gha.edu',
                password: '123456',
                name: '周八',
                grades: ['Pre', 'G12'],
                subjects: ['英语', '历史'],
                meetingId: '888456789',
                meetingPassword: '987654'
            }
        ];

        // 检查教师是否已存在
        const existingTeacherCount = await db.collection('teachers').countDocuments();
        if (existingTeacherCount === 0) {
            await db.collection('teachers').insertMany(teachers);
            console.log(`✓ 已插入 ${teachers.length} 位教师`);
        } else {
            console.log(`○ 教师数据已存在（${existingTeacherCount} 位），跳过初始化`);
        }

        // 生成测试用的时间段（未来7天）
        const sessions = [];
        const today = new Date();

        for (let day = 1; day <= 7; day++) {
            const date = new Date(today);
            date.setDate(today.getDate() + day);
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

            teachers.forEach(teacher => {
                // 上午时段 9:00-11:00，每15分钟一个
                let hour = 9;
                let minute = 0;
                while (hour < 11) {
                    const start = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    minute += 15;
                    if (minute >= 60) {
                        minute = 0;
                        hour++;
                    }
                    const end = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    sessions.push({
                        teacherName: teacher.name,
                        date: dateStr,
                        startTime: start,
                        endTime: end
                    });
                }

                // 下午时段 14:00-17:00，每15分钟一个
                hour = 14;
                minute = 0;
                while (hour < 17) {
                    const start = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    minute += 15;
                    if (minute >= 60) {
                        minute = 0;
                        hour++;
                    }
                    const end = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    sessions.push({
                        teacherName: teacher.name,
                        date: dateStr,
                        startTime: start,
                        endTime: end
                    });
                }
            });
        }

        // 检查时段是否已存在
        const existingSessionCount = await db.collection('sessions').countDocuments();
        if (existingSessionCount === 0) {
            await db.collection('sessions').insertMany(sessions);
            console.log(`✓ 已插入 ${sessions.length} 个可用时间段（未来7天）`);
        } else {
            console.log(`○ 时段数据已存在（${existingSessionCount} 个），跳过初始化`);
        }

        console.log('\n初始化完成！');
        console.log('\n教师账号信息：');
        teachers.forEach(t => {
            console.log(`  ${t.name}: ${t.email} / ${t.password}`);
            console.log(`    年级: ${t.grades.join(', ')} | 科目: ${t.subjects.join(', ')}`);
        });

    } catch (error) {
        console.error('初始化失败:', error);
    } finally {
        await client.close();
        console.log('\n已断开数据库连接');
    }
}

initData();
