const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 9000;

// 中间件
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// 测试路由 - 不需要数据库
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'GHA线上会议预约 API' });
});

app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API 测试成功', time: new Date().toISOString() });
});

// MongoDB 连接（延迟初始化）
let db = null;
let client = null;
let dbInitPromise = null;

async function getDB() {
    if (db) return db;
    if (dbInitPromise) return dbInitPromise;

    dbInitPromise = (async () => {
        try {
            console.log('开始连接 MongoDB...');
            client = new MongoClient('mongodb://49.235.189.246:27017', {
                serverSelectionTimeoutMS: 3000,
                socketTimeoutMS: 5000,
                connectTimeoutMS: 3000
            });

            await client.connect();
            db = client.db('GHS');
            console.log('MongoDB 连接成功!');

            // 初始化教师数据
            const count = await db.collection('teachers').countDocuments();
            if (count === 0) {
                await db.collection('teachers').insertMany([
                    { email: 'zhangsan@school.com', password: '123456', name: '张三', grades: ['Pre', 'G10'], subjects: ['语文', '数学'], meetingId: '123456789', meetingPassword: '123456' },
                    { email: 'lisi@school.com', password: '123456', name: '李四', grades: ['G10', 'G11'], subjects: ['数学', '英语'], meetingId: '987654321', meetingPassword: '654321' },
                    { email: 'wangwu@school.com', password: '123456', name: '王五', grades: ['G11', 'G12'], subjects: ['英语', '科学'], meetingId: '456789123', meetingPassword: '789123' },
                    { email: 'zhaoliu@school.com', password: '123456', name: '赵六', grades: ['Pre', 'G11'], subjects: ['语文', '美术'], meetingId: '321654987', meetingPassword: '321654' },
                    { email: 'sunqi@school.com', password: '123456', name: '孙七', grades: ['G10', 'G12'], subjects: ['数学', '音乐'], meetingId: '789123456', meetingPassword: '456789' }
                ]);
                console.log('教师数据初始化完成');
            }
            return db;
        } catch (error) {
            console.error('MongoDB 连接失败:', error.message);
            throw error;
        }
    })();

    return dbInitPromise;
}

// 响应辅助
function success(res, data, message = '操作成功') {
    res.json({ success: true, data, message });
}

function error(res, message, status = 500) {
    res.status(status).json({ success: false, message });
}

// API 路由
app.post('/api/teacher/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = await getDB();
        const teacher = await db.collection('teachers').findOne({ email, password });
        if (teacher) {
            const { password: _, ...teacherData } = teacher;
            success(res, teacherData);
        } else {
            error(res, '邮箱或密码错误', 401);
        }
    } catch (err) {
        error(res, err.message);
    }
});

app.get('/api/teachers', async (req, res) => {
    try {
        const db = await getDB();
        const teachers = await db.collection('teachers').find({}, { projection: { password: 0 } }).toArray();
        success(res, teachers);
    } catch (err) {
        error(res, err.message);
    }
});

app.get('/api/teacher/:email', async (req, res) => {
    try {
        const db = await getDB();
        const teacher = await db.collection('teachers').findOne({ email: decodeURIComponent(req.params.email) }, { projection: { password: 0 } });
        if (teacher) success(res, teacher);
        else error(res, '教师不存在', 404);
    } catch (err) {
        error(res, err.message);
    }
});

app.put('/api/teacher/meeting', async (req, res) => {
    try {
        const { email, meetingId, meetingPassword } = req.body;
        const db = await getDB();
        await db.collection('teachers').updateOne({ email }, { $set: { meetingId, meetingPassword } });
        success(res, null, '会议信息保存成功');
    } catch (err) {
        error(res, err.message);
    }
});

app.put('/api/teacher/password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        const db = await getDB();

        // 验证当前密码
        const teacher = await db.collection('teachers').findOne({ email });
        if (!teacher) {
            return error(res, '教师不存在', 404);
        }

        if (teacher.password !== currentPassword) {
            return error(res, '当前密码错误', 400);
        }

        // 更新密码
        await db.collection('teachers').updateOne({ email }, { $set: { password: newPassword } });
        success(res, null, '密码修改成功');
    } catch (err) {
        error(res, err.message);
    }
});

app.post('/api/sessions', async (req, res) => {
    try {
        const { sessions } = req.body;
        const db = await getDB();

        // 只插入新记录，不覆盖已存在的
        await db.collection('sessions').insertMany(sessions);
        success(res, null, `成功保存 ${sessions.length} 个时间段`);
    } catch (err) {
        // 如果是重复键错误
        if (err.code === 11000) {
            error(res, '部分时间段已存在，请检查后重试', 400);
        } else {
            error(res, err.message);
        }
    }
});

// 检查重复的时间段
app.post('/api/sessions/check-duplicates', async (req, res) => {
    try {
        const { sessions } = req.body;
        const db = await getDB();

        const duplicates = [];
        for (const session of sessions) {
            const existing = await db.collection('sessions').findOne({
                teacherName: session.teacherName,
                date: session.date,
                startTime: session.startTime,
                endTime: session.endTime
            });
            if (existing) {
                duplicates.push(session);
            }
        }

        success(res, { duplicates, total: sessions.length });
    } catch (err) {
        error(res, err.message);
    }
});

app.get('/api/sessions', async (req, res) => {
    try {
        const db = await getDB();
        const sessions = await db.collection('sessions').find({}).toArray();
        success(res, sessions);
    } catch (err) {
        error(res, err.message);
    }
});

app.get('/api/sessions/teacher/:teacherName', async (req, res) => {
    try {
        const db = await getDB();
        // 只返回未被预约的时段
        const sessions = await db.collection('sessions').find({
            teacherName: decodeURIComponent(req.params.teacherName),
            $or: [
                { bookedBy: { $exists: false } },
                { bookedBy: '' }
            ]
        }).toArray();
        success(res, sessions);
    } catch (err) {
        error(res, err.message);
    }
});

app.put('/api/sessions/book', async (req, res) => {
    try {
        const { sessionId, bookedBy, parentPhone, studentName } = req.body;
        const db = await getDB();

        // 转换字符串ID为ObjectId
        const objId = new ObjectId(sessionId);

        // 使用原子操作：检查未被预约且更新，避免并发冲突
        const result = await db.collection('sessions').updateOne(
            {
                _id: objId,
                $or: [
                    { bookedBy: { $exists: false } },
                    { bookedBy: '' }
                ]
            },
            { $set: { bookedBy, parentPhone, studentName } }
        );

        if (result.matchedCount === 0) {
            // 需要区分：时段不存在 vs 已被预约
            const exists = await db.collection('sessions').findOne({ _id: objId });
            if (!exists) {
                return error(res, '时段不存在', 404);
            }
            return error(res, '该时段已被预约', 400);
        }

        success(res, null, '预约成功');
    } catch (err) {
        console.error('预约失败:', err);
        error(res, err.message);
    }
});

app.get('/api/bookings/parent/:phone', async (req, res) => {
    try {
        const phone = decodeURIComponent(req.params.phone);
        const db = await getDB();

        // 获取该家长的所有预约记录
        const bookings = await db.collection('sessions').find({ parentPhone: phone }).toArray();

        // 为每条记录添加老师的完整信息
        const bookingsWithTeacherInfo = await Promise.all(bookings.map(async (booking) => {
            const teacher = await db.collection('teachers').findOne(
                { name: booking.teacherName },
                { projection: { password: 0 } }
            );
            return {
                _id: booking._id,
                teacherName: booking.teacherName,
                teacherEmail: teacher ? teacher.email : '',
                subjects: teacher ? teacher.subjects : [],
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                meetingId: teacher ? teacher.meetingId : '',
                meetingPassword: teacher ? teacher.meetingPassword : '',
                bookedBy: booking.bookedBy,
                parentPhone: booking.parentPhone,
                studentName: booking.studentName
            };
        }));

        success(res, bookingsWithTeacherInfo);
    } catch (err) {
        error(res, err.message);
    }
});

app.get('/api/bookings/teacher/:teacherName', async (req, res) => {
    try {
        const db = await getDB();
        // 返回该教师的所有时段（包括已预约和未预约）
        const sessions = await db.collection('sessions').find({ teacherName: decodeURIComponent(req.params.teacherName) }).toArray();
        success(res, sessions);
    } catch (err) {
        error(res, err.message);
    }
});

// 删除预约
app.delete('/api/bookings/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const db = await getDB();

        // 转换字符串ID为ObjectId
        const objId = new ObjectId(sessionId);

        // 清空预约信息，保留session记录
        const result = await db.collection('sessions').updateOne(
            { _id: objId },
            { $unset: { bookedBy: '', parentPhone: '', studentName: '' } }
        );

        if (result.matchedCount === 0) {
            return error(res, '预约记录不存在', 404);
        }

        success(res, null, '预约已取消');
    } catch (err) {
        console.error('取消预约失败:', err);
        error(res, err.message);
    }
});

// 删除教师的所有可用时段
app.delete('/api/sessions/teacher/:teacherName', async (req, res) => {
    try {
        const { teacherName } = req.params;
        const { deleteAll } = req.query; // 是否删除所有（包括已预约的）
        const db = await getDB();

        const filter = { teacherName: decodeURIComponent(teacherName) };

        // 如果不是删除全部，只删除未预约的时段
        if (deleteAll !== 'true') {
            filter.bookedBy = { $in: [null, '', undefined] };
        }

        const result = await db.collection('sessions').deleteMany(filter);

        const message = deleteAll === 'true'
            ? `已删除 ${result.deletedCount} 个时段（包括已预约的）`
            : `已删除 ${result.deletedCount} 个未预约的时段`;

        success(res, { deletedCount: result.deletedCount }, message);
    } catch (err) {
        console.error('删除时段失败:', err);
        error(res, err.message);
    }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;
