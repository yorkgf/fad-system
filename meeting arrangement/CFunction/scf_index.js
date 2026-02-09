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
    res.json({ status: 'ok', message: 'GHA线上会议预约 API (家长端)' });
});

app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API 测试成功', time: new Date().toISOString() });
});

// MongoDB 连接（延迟初始化）
let db = null;        // GHS 数据库（会议预约）
let ghaDB = null;     // GHA 数据库（学生信息）
let client = null;
let dbInitPromise = null;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://49.235.189.246:27017';
const DB_NAME = process.env.DB_NAME || 'GHS';
const GHA_DB_NAME = process.env.GHA_DB_NAME || 'GHA';  // GHA 数据库名

async function getDB() {
    if (db) return db;
    if (dbInitPromise) return dbInitPromise;

    dbInitPromise = (async () => {
        try {
            console.log('开始连接 MongoDB...');
            client = new MongoClient(MONGO_URI, {
                serverSelectionTimeoutMS: 3000,
                socketTimeoutMS: 5000,
                connectTimeoutMS: 3000
            });

            await client.connect();
            db = client.db(DB_NAME);
            ghaDB = client.db(GHA_DB_NAME);  // 同时连接GHA数据库
            console.log('MongoDB 连接成功! (GHS + GHA)');
            return db;
        } catch (error) {
            console.error('MongoDB 连接失败:', error.message);
            throw error;
        }
    })();

    return dbInitPromise;
}

// 获取GHA数据库（学生信息）
async function getGHADB() {
    await getDB();  // 确保已连接
    return ghaDB;
}

// 响应辅助
function success(res, data, message = '操作成功') {
    res.json({ success: true, data, message });
}

function error(res, message, status = 500) {
    res.status(status).json({ success: false, message });
}

// ==================== 预约冲突检测 ====================

/**
 * 将时间字符串转换为分钟数（用于时间比较）
 * @param {string} timeStr - 时间字符串，格式如 "09:00"
 * @returns {number} - 从0点开始的分钟数
 */
function parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * 检查两个时间段是否重叠
 * 使用严格不等式：09:00-09:15 和 09:15-09:30 不冲突
 * @param {string} start1 - 第一个时段的开始时间
 * @param {string} end1 - 第一个时段的结束时间
 * @param {string} start2 - 第二个时段的开始时间
 * @param {string} end2 - 第二个时段的结束时间
 * @returns {boolean} - 是否重叠
 */
function isTimeOverlap(start1, end1, start2, end2) {
    const s1 = parseTimeToMinutes(start1);
    const e1 = parseTimeToMinutes(end1);
    const s2 = parseTimeToMinutes(start2);
    const e2 = parseTimeToMinutes(end2);
    // 时间重叠的条件：s1 < e2 && e1 > s2
    return s1 < e2 && e1 > s2;
}

/**
 * 检查预约冲突
 * @param {object} db - MongoDB数据库实例
 * @param {string} parentPhone - 家长手机号
 * @param {string} teacherEmail - 教师邮箱
 * @param {string} date - 预约日期（YYYY-MM-DD格式）
 * @param {string} startTime - 开始时间
 * @param {string} endTime - 结束时间
 * @returns {Promise<object>} - { hasConflict: boolean, message: string }
 */
async function checkBookingConflicts(db, parentPhone, teacherEmail, date, startTime, endTime) {
    // 1. 检查sessions集合中同一天同一教师的预约
    const sameTeacherBooking = await db.collection('sessions').findOne({
        parentPhone,
        teacherEmail,
        date,
        bookedBy: { $exists: true, $ne: '' }
    });

    if (sameTeacherBooking) {
        return {
            hasConflict: true,
            message: `您今天已经预约了该教师`
        };
    }

    // 2. 检查sessions集合中时间冲突的预约
    const dayBookings = await db.collection('sessions').find({
        parentPhone,
        date,
        bookedBy: { $exists: true, $ne: '' }
    }).toArray();

    for (const booking of dayBookings) {
        if (isTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
            return {
                hasConflict: true,
                message: `该时段与您预约 ${booking.teacherName}老师 (${booking.startTime}-${booking.endTime}) 冲突`
            };
        }
    }

    // 3. 检查bookings集合（教师端创建的预约）中的冲突
    const dayBookingsFromAPI = await db.collection('bookings').find({
        parentPhone,
        bookingDate: date,
        status: { $nin: ['cancelled', 'completed'] }
    }).toArray();

    for (const booking of dayBookingsFromAPI) {
        // 检查同一教师
        if (booking.teacherEmail === teacherEmail) {
            return {
                hasConflict: true,
                message: `您今天已经预约了该教师`
            };
        }

        // 检查时间冲突
        if (isTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
            return {
                hasConflict: true,
                message: `该时段与您预约 ${booking.teacherName}老师 (${booking.startTime}-${booking.endTime}) 冲突`
            };
        }
    }

    return { hasConflict: false };
}

// API 路由 - 家长端专用

// 获取班级列表（从GHA数据库）
app.get('/api/classes', async (req, res) => {
    try {
        const ghaDB = await getGHADB();
        const classes = await ghaDB.collection('All_Classes')
            .find({}, { projection: { Class: 1 } })
            .sort({ Class: 1 })
            .toArray();
        success(res, classes.map(c => c.Class).filter(Boolean));
    } catch (err) {
        console.error('获取班级列表失败:', err);
        error(res, '获取班级列表失败');
    }
});

// 获取学生列表（从GHA数据库，支持搜索）
app.get('/api/students', async (req, res) => {
    try {
        const { search, class: studentClass } = req.query;
        const ghaDB = await getGHADB();

        const filter = {};

        // 如果指定了班级，按班级筛选
        if (studentClass) {
            filter.班级 = studentClass;
        }

        // 如果提供了搜索关键词，按姓名模糊匹配
        if (search && search.trim()) {
            filter.学生姓名 = { $regex: search.trim(), $options: 'i' };
        }

        const students = await ghaDB.collection('Students')
            .find(filter, { projection: { 学生姓名: 1, 班级: 1 } })
            .sort({ 学生姓名: 1 })
            .limit(20)  // 限制返回数量
            .toArray();

        success(res, students.map(s => ({
            name: s.学生姓名,
            class: s.班级
        })));
    } catch (err) {
        console.error('获取学生列表失败:', err);
        error(res, '获取学生列表失败');
    }
});

// 获取教师列表（家长浏览用）
app.get('/api/teachers', async (req, res) => {
    try {
        const db = await getDB();
        // 只返回公开信息，排除密码等敏感字段
        const teachers = await db.collection('teachers')
            .find({}, { projection: { password: 0, email: 0 } })
            .toArray();
        success(res, teachers);
    } catch (err) {
        error(res, err.message);
    }
});

// 获取单个教师详情（家长查看用）
app.get('/api/teacher/:email', async (req, res) => {
    try {
        const db = await getDB();
        const teacher = await db.collection('teachers').findOne(
            { email: decodeURIComponent(req.params.email) },
            { projection: { password: 0, email: 0 } }
        );
        if (teacher) success(res, teacher);
        else error(res, '教师不存在', 404);
    } catch (err) {
        error(res, err.message);
    }
});

// 获取教师的可预约时段（家长查看用）
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

// 预约时段（家长使用）
app.put('/api/sessions/book', async (req, res) => {
    try {
        const { sessionId, bookedBy, parentPhone, studentName } = req.body;
        const db = await getDB();

        // 验证必填参数
        if (!sessionId || !parentPhone || !studentName) {
            return error(res, '缺少必要参数', 400);
        }

        // 转换字符串ID为ObjectId
        const objId = new ObjectId(sessionId);

        // 获取时段信息用于冲突检测
        const session = await db.collection('sessions').findOne({ _id: objId });
        if (!session) {
            return error(res, '时段不存在', 404);
        }

        // 验证时段是否已过期
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
                           now.getMinutes().toString().padStart(2, '0');

        // 如果日期早于今天
        if (session.date < today) {
            return error(res, '该时段已过期，无法预约', 400);
        }
        // 如果是今天且结束时间早于当前时间
        if (session.date === today && session.endTime < currentTime) {
            return error(res, '该时段已过期，无法预约', 400);
        }

        // 检查时段是否已被预约
        if (session.bookedBy && session.bookedBy !== '') {
            return error(res, '该时段已被预约', 400);
        }

        // 执行冲突检测
        const conflictCheck = await checkBookingConflicts(
            db,
            parentPhone,
            session.teacherEmail || '',
            session.date,
            session.startTime,
            session.endTime
        );

        if (conflictCheck.hasConflict) {
            return error(res, conflictCheck.message, 409);
        }

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
            return error(res, '该时段已被预约', 400);
        }

        success(res, null, '预约成功');
    } catch (err) {
        console.error('预约失败:', err);
        error(res, err.message);
    }
});

// 获取家长的预约记录
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
                location: booking.location || '',  // 添加 location 字段
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

// 取消预约（家长使用）
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

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;
