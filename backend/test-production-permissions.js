// 用户组权限/访问控制测试
// 验证6个用户组(S/A/B/T/F/C)的权限边界是否正确执行
// 运行: node test-production-permissions.js
const { MongoClient, ObjectId } = require('mongodb')
const axios = require('axios')

const MONGO_URI = 'mongodb://49.235.189.246:27017'
const DB_NAME = 'GHA'
const GHS_DB_NAME = 'GHS'
const API_BASE = 'http://localhost:8080/api'
const TEST_STUDENT = '权限测试/PERM'
const TEST_CLASS = '10A'
const TEMP_PASSWORD = 'PermTest123!'

let db = null
let ghsDB = null
let client = null

// Per-group tokens and info
const tokens = {}
const teacherInfo = {}
const originalPasswords = {}

const results = { passed: 0, failed: 0, skipped: 0, details: [] }
const securityFindings = []

// ==================== 辅助函数 ====================

function getCurrentSemester() {
  const m = new Date().getMonth() + 1, y = new Date().getFullYear()
  return m >= 2 && m <= 7 ? `${y}年春季` : `${y}年秋季`
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const ALL_COLLECTIONS = [
  'FAD_Records', 'Reward_Records', 'Late_Records',
  'Leave_Room_Late_Records', 'Back_School_Late_Records',
  'Room_Warning_Records', 'Room_Trash_Records', 'Room_Praise_Records',
  'MeetingRoom_Violation_Records', 'Teaching_FAD_Ticket',
  'Teaching_Reward_Ticket', 'Elec_Products_Violation_Records', 'Phone_Late_Records'
]

async function cleanup() {
  for (const c of ALL_COLLECTIONS) {
    await db.collection(c).deleteMany({ 学生: TEST_STUDENT }).catch(() => {})
  }
  // GHS cleanup
  await ghsDB.collection('sessions').deleteMany({ note: 'PERM_TEST' }).catch(() => {})
}
// Raw API call that never throws on 4xx/5xx
async function apiAsRaw(group, method, path, data) {
  const config = {
    headers: { Authorization: `Bearer ${tokens[group]}` },
    validateStatus: () => true
  }
  const url = `${API_BASE}${path}`
  if (method === 'get') return axios.get(url, config)
  if (method === 'post') return axios.post(url, data, config)
  if (method === 'put') return axios.put(url, data, config)
  if (method === 'delete') return axios.delete(url, config)
}

// Insert a record as a specific group
async function insertRecordAs(group, recordType, extra = {}) {
  const sem = getCurrentSemester()
  const date = new Date()
  if (extra.dayOffset) date.setDate(date.getDate() - extra.dayOffset)
  return apiAsRaw(group, 'post', '/records', {
    recordType, date: date.toISOString(),
    student: TEST_STUDENT, studentClass: TEST_CLASS,
    semester: sem, teacher: teacherInfo[group].name,
    ...extra
  })
}

function record(suite, name, passed, detail = '') {
  const status = passed ? 'PASS' : 'FAIL'
  if (passed) results.passed++; else results.failed++
  results.details.push({ suite, name, status, detail })
  console.log(`  ${passed ? '✅' : '❌'} ${name}${detail ? ' - ' + detail : ''}`)
}

function recordSkip(suite, name, reason) {
  results.skipped++
  results.details.push({ suite, name, status: 'SKIP', detail: reason })
  console.log(`  ⏭️  ${name} - SKIPPED: ${reason}`)
}

function securityFinding(id, description) {
  securityFindings.push({ id, description })
}

// ==================== 认证设置 ====================

async function setupAuthentication() {
  const groups = ['S', 'A', 'B', 'T', 'F', 'C']

  for (const group of groups) {
    const teacher = await db.collection('Teachers').findOne({ Group: group })
    if (!teacher) {
      console.error(`  未找到Group ${group}教师，跳过`)
      continue
    }

    // Save original password
    originalPasswords[group] = { id: teacher._id, password: teacher.Password }
    teacherInfo[group] = { name: teacher.Name, email: teacher.email }

    // Temporarily set plaintext password
    await db.collection('Teachers').updateOne(
      { _id: teacher._id },
      { $set: { Password: TEMP_PASSWORD } }
    )

    try {
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: teacher.email,
        password: TEMP_PASSWORD
      })
      tokens[group] = loginRes.data.token
      console.log(`  ${group}: ${teacher.Name} (${teacher.email}) ✅`)
    } catch (e) {
      console.error(`  ${group}: 登录失败 - ${e.response?.data?.error || e.message}`)
    }

    // Restore original password immediately (login auto-migrates to bcrypt)
    await db.collection('Teachers').updateOne(
      { _id: teacher._id },
      { $set: { Password: originalPasswords[group].password } }
    )
  }

  const loggedIn = Object.keys(tokens)
  console.log(`  已登录 ${loggedIn.length}/6 组: ${loggedIn.join(', ')}`)
  if (loggedIn.length < 6) {
    console.warn('  ⚠️  部分用户组未能登录，相关测试将跳过')
  }
}

// ==================== 套件1：FAD统计访问控制 ====================

async function suiteFADStatsAccess() {
  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║  套件1：FAD统计访问控制                    ║')
  console.log('╚══════════════════════════════════════════╝')
  const sem = getCurrentSemester()

  // PERM-001: S → GET /fad-records/stats → 200
  if (tokens.S) {
    const res = await apiAsRaw('S', 'get', `/fad-records/stats?semester=${sem}`)
    record('FAD统计', 'PERM-001: S访问FAD统计', res.status === 200, `status=${res.status}`)
  } else recordSkip('FAD统计', 'PERM-001', '无S组Token')

  // PERM-002: A → GET /fad-records/stats → 200
  if (tokens.A) {
    const res = await apiAsRaw('A', 'get', `/fad-records/stats?semester=${sem}`)
    record('FAD统计', 'PERM-002: A访问FAD统计', res.status === 200, `status=${res.status}`)
  } else recordSkip('FAD统计', 'PERM-002', '无A组Token')

  // PERM-003: B → depends on 班主任 status
  if (tokens.B) {
    const homeClass = await db.collection('All_Classes').findOne({
      HomeTeacherEmail: teacherInfo.B.email
    })
    const res = await apiAsRaw('B', 'get', `/fad-records/stats?semester=${sem}`)
    if (homeClass) {
      record('FAD统计', 'PERM-003: B(班主任)访问FAD统计', res.status === 200, `status=${res.status}, 班级=${homeClass.Class}`)
    } else {
      record('FAD统计', 'PERM-003: B(非班主任)访问FAD统计被拒', res.status === 403, `status=${res.status}`)
    }
  } else recordSkip('FAD统计', 'PERM-003', '无B组Token')

  // PERM-004: T → depends on 班主任 status
  if (tokens.T) {
    const homeClass = await db.collection('All_Classes').findOne({
      HomeTeacherEmail: teacherInfo.T.email
    })
    const res = await apiAsRaw('T', 'get', `/fad-records/stats?semester=${sem}`)
    if (homeClass) {
      record('FAD统计', 'PERM-004: T(班主任)访问FAD统计', res.status === 200, `status=${res.status}, 班级=${homeClass.Class}`)
    } else {
      record('FAD统计', 'PERM-004: T(非班主任)访问FAD统计被拒', res.status === 403, `status=${res.status}`)
    }
  } else recordSkip('FAD统计', 'PERM-004', '无T组Token')

  // PERM-005: F → 403
  if (tokens.F) {
    const res = await apiAsRaw('F', 'get', `/fad-records/stats?semester=${sem}`)
    record('FAD统计', 'PERM-005: F访问FAD统计被拒', res.status === 403, `status=${res.status}`)
  } else recordSkip('FAD统计', 'PERM-005', '无F组Token')

  // PERM-006: C → 403
  if (tokens.C) {
    const res = await apiAsRaw('C', 'get', `/fad-records/stats?semester=${sem}`)
    record('FAD统计', 'PERM-006: C访问FAD统计被拒', res.status === 403, `status=${res.status}`)
  } else recordSkip('FAD统计', 'PERM-006', '无C组Token')
}

// ==================== 套件2：日程访问控制 ====================

async function suiteScheduleAccess() {
  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║  套件2：日程访问控制                       ║')
  console.log('╚══════════════════════════════════════════╝')

  // PERM-007: C → GET /schedule/sessions → 403
  if (tokens.C) {
    const res = await apiAsRaw('C', 'get', '/schedule/sessions')
    record('日程访问', 'PERM-007: C访问日程列表被拒', res.status === 403, `status=${res.status}`)
  } else recordSkip('日程访问', 'PERM-007', '无C组Token')

  // PERM-008: C → POST /schedule/sessions → 403
  if (tokens.C) {
    const res = await apiAsRaw('C', 'post', '/schedule/sessions', {
      date: '2099-01-01', startTime: '09:00', endTime: '10:00', note: 'PERM_TEST'
    })
    record('日程访问', 'PERM-008: C创建日程被拒', res.status === 403, `status=${res.status}`)
  } else recordSkip('日程访问', 'PERM-008', '无C组Token')

  // PERM-009: C → GET /schedule/me/ghs-profile → 403
  if (tokens.C) {
    const res = await apiAsRaw('C', 'get', '/schedule/me/ghs-profile')
    record('日程访问', 'PERM-009: C访问GHS档案被拒', res.status === 403, `status=${res.status}`)
  } else recordSkip('日程访问', 'PERM-009', '无C组Token')

  // PERM-010: S → GET /schedule/sessions → 200
  if (tokens.S) {
    const res = await apiAsRaw('S', 'get', '/schedule/sessions')
    record('日程访问', 'PERM-010: S访问日程列表', res.status === 200, `status=${res.status}`)
  } else recordSkip('日程访问', 'PERM-010', '无S组Token')

  // PERM-011: F → GET /schedule/sessions → 200
  if (tokens.F) {
    const res = await apiAsRaw('F', 'get', '/schedule/sessions')
    record('日程访问', 'PERM-011: F访问日程列表', res.status === 200, `status=${res.status}`)
  } else recordSkip('日程访问', 'PERM-011', '无F组Token')

  // PERM-012: B → GET /schedule/sessions → 200
  if (tokens.B) {
    const res = await apiAsRaw('B', 'get', '/schedule/sessions')
    record('日程访问', 'PERM-012: B访问日程列表', res.status === 200, `status=${res.status}`)
  } else recordSkip('日程访问', 'PERM-012', '无B组Token')
}

// ==================== 套件3：日程会话所有权 ====================

async function suiteScheduleOwnership() {
  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║  套件3：日程会话所有权                     ║')
  console.log('╚══════════════════════════════════════════╝')

  if (!tokens.B || !tokens.F || !tokens.S) {
    console.log('  ⚠️  需要B/F/S组Token，跳过此套件')
    recordSkip('日程所有权', 'PERM-013~017', '缺少必要Token')
    return
  }

  // B creates a session
  const createRes = await apiAsRaw('B', 'post', '/schedule/sessions', {
    date: '2099-12-31', startTime: '08:00', endTime: '09:00',
    location: '测试教室', note: 'PERM_TEST'
  })

  if (createRes.status !== 200 || !createRes.data?.data?._id) {
    console.log('  ⚠️  B创建日程失败，跳过所有权测试')
    recordSkip('日程所有权', 'PERM-013~017', `创建失败: status=${createRes.status}`)
    return
  }

  const sessionId = createRes.data.data._id

  // PERM-013: B edits own session → 200
  const editOwn = await apiAsRaw('B', 'put', `/schedule/sessions/${sessionId}`, {
    location: '更新教室', note: 'PERM_TEST'
  })
  record('日程所有权', 'PERM-013: B编辑自己的日程', editOwn.status === 200, `status=${editOwn.status}`)

  // PERM-014: F edits B's session → 403
  const editOther = await apiAsRaw('F', 'put', `/schedule/sessions/${sessionId}`, {
    location: 'F尝试修改', note: 'PERM_TEST'
  })
  record('日程所有权', 'PERM-014: F编辑B的日程被拒', editOther.status === 403, `status=${editOther.status}`)

  // PERM-015: S edits B's session → 200 (admin override)
  const editAdmin = await apiAsRaw('S', 'put', `/schedule/sessions/${sessionId}`, {
    location: 'S管理员修改', note: 'PERM_TEST'
  })
  record('日程所有权', 'PERM-015: S编辑B的日程(管理员)', editAdmin.status === 200, `status=${editAdmin.status}`)

  // PERM-016: F deletes B's session → 403
  const delOther = await apiAsRaw('F', 'delete', `/schedule/sessions/${sessionId}`)
  record('日程所有权', 'PERM-016: F删除B的日程被拒', delOther.status === 403, `status=${delOther.status}`)

  // PERM-017: S deletes B's session → 200 (admin override)
  const delAdmin = await apiAsRaw('S', 'delete', `/schedule/sessions/${sessionId}`)
  record('日程所有权', 'PERM-017: S删除B的日程(管理员)', delAdmin.status === 200, `status=${delAdmin.status}`)
}

// ==================== 套件4：记录撤回所有权 ====================

async function suiteWithdrawalOwnership() {
  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║  套件4：记录撤回所有权                     ║')
  console.log('╚══════════════════════════════════════════╝')

  if (!tokens.S || !tokens.B) {
    console.log('  ⚠️  需要S/B组Token，跳过此套件')
    recordSkip('撤回所有权', 'PERM-018~023', '缺少必要Token')
    return
  }

  const sem = getCurrentSemester()
  await cleanup()

  // S inserts a record (owned by S)
  const sInsert = await insertRecordAs('S', '早点名迟到')
  const sRecordOk = sInsert.status === 200
  let sRecordId = null
  if (sRecordOk) {
    const doc = await db.collection('Late_Records').findOne({
      学生: TEST_STUDENT, 记录老师: { $regex: teacherInfo.S.name }
    })
    sRecordId = doc?._id
  }

  // B inserts a record (owned by B)
  const bInsert = await insertRecordAs('B', '早点名迟到', { dayOffset: 1 })
  const bRecordOk = bInsert.status === 200
  let bRecordId = null
  if (bRecordOk) {
    const doc = await db.collection('Late_Records').findOne({
      学生: TEST_STUDENT, 记录老师: { $regex: teacherInfo.B.name }
    })
    bRecordId = doc?._id
  }

  // PERM-018: S withdraws own record → 200
  if (sRecordId) {
    const res = await apiAsRaw('S', 'post', `/records/Late_Records/${sRecordId}/withdraw`, { reason: '权限测试' })
    record('撤回所有权', 'PERM-018: S撤回自己的记录', res.status === 200, `status=${res.status}`)
  } else recordSkip('撤回所有权', 'PERM-018', 'S记录创建失败')

  // PERM-019: B tries to withdraw S's record → 403
  // Need a new S record since we just withdrew the first one
  await insertRecordAs('S', '早点名迟到', { dayOffset: 2 })
  const sDoc2 = await db.collection('Late_Records').findOne({
    学生: TEST_STUDENT, 记录老师: { $regex: teacherInfo.S.name }
  })
  if (sDoc2) {
    const res = await apiAsRaw('B', 'post', `/records/Late_Records/${sDoc2._id}/withdraw`, { reason: '权限测试' })
    record('撤回所有权', 'PERM-019: B撤回S的记录被拒', res.status === 403, `status=${res.status}`)
  } else recordSkip('撤回所有权', 'PERM-019', 'S记录创建失败')

  // PERM-020: S withdraws B's record → 200 (admin)
  if (bRecordId) {
    const res = await apiAsRaw('S', 'post', `/records/Late_Records/${bRecordId}/withdraw`, { reason: '权限测试' })
    record('撤回所有权', 'PERM-020: S撤回B的记录(管理员)', res.status === 200, `status=${res.status}`)
  } else recordSkip('撤回所有权', 'PERM-020', 'B记录创建失败')

  // PERM-021: S tries to withdraw Reward → 403
  // Insert a Reward directly via DB for testing
  const rewardResult = await db.collection('Reward_Records').insertOne({
    记录类型: 'Reward', 记录日期: new Date(), 学生: TEST_STUDENT,
    班级: TEST_CLASS, 记录老师: teacherInfo.S.name, 学期: sem,
    记录事由: '权限测试Reward'
  })
  const rewardId = rewardResult.insertedId
  const resReward = await apiAsRaw('S', 'post', `/records/Reward_Records/${rewardId}/withdraw`, { reason: '权限测试' })
  record('撤回所有权', 'PERM-021: S撤回Reward被拒', resReward.status === 403, `status=${resReward.status}`)

  // PERM-022: S tries to withdraw delivered FAD → 403
  const deliveredFAD = await db.collection('FAD_Records').insertOne({
    记录类型: 'FAD', 记录日期: new Date(), 学生: TEST_STUDENT,
    班级: TEST_CLASS, 记录老师: teacherInfo.S.name, 学期: sem,
    记录事由: '权限测试已发放FAD', 是否已发放: true
  })
  const resDelivered = await apiAsRaw('S', 'post', `/records/FAD_Records/${deliveredFAD.insertedId}/withdraw`, { reason: '权限测试' })
  record('撤回所有权', 'PERM-022: S撤回已发放FAD被拒', resDelivered.status === 403, `status=${resDelivered.status}`)

  // PERM-023: S tries to withdraw FAD with '已发:' prefix → 403
  const prefixFAD = await db.collection('FAD_Records').insertOne({
    记录类型: 'FAD', 记录日期: new Date(), 学生: TEST_STUDENT,
    班级: TEST_CLASS, 记录老师: '已发:' + teacherInfo.S.name, 学期: sem,
    记录事由: '权限测试已发前缀FAD'
  })
  const resPrefix = await apiAsRaw('S', 'post', `/records/FAD_Records/${prefixFAD.insertedId}/withdraw`, { reason: '权限测试' })
  record('撤回所有权', 'PERM-023: S撤回已发前缀FAD被拒', resPrefix.status === 403, `status=${resPrefix.status}`)
}

// ==================== 套件5：我的记录可见性 ====================

async function suiteMyRecordsVisibility() {
  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║  套件5：我的记录可见性                     ║')
  console.log('╚══════════════════════════════════════════╝')

  if (!tokens.S || !tokens.B) {
    console.log('  ⚠️  需要S/B组Token，跳过此套件')
    recordSkip('记录可见性', 'PERM-024~027', '缺少必要Token')
    return
  }

  const sem = getCurrentSemester()
  await cleanup()

  // Insert records as S and B
  await insertRecordAs('S', '早点名迟到')
  await insertRecordAs('B', '早点名迟到', { dayOffset: 1 })
  await sleep(300)

  // PERM-024: S queries /records/my (no teacher filter) → sees all records
  const resS = await apiAsRaw('S', 'get', `/records/my?collection=Late_Records&semester=${sem}`)
  const sData = resS.data?.data || []
  const sTestRecords = sData.filter(r => r.学生 === TEST_STUDENT)
  record('记录可见性', 'PERM-024: S查看所有记录(无过滤)', sTestRecords.length >= 2, `找到${sTestRecords.length}条测试记录`)

  // PERM-025: S queries with teacher=B's name → sees only B's records
  const resSFiltered = await apiAsRaw('S', 'get', `/records/my?collection=Late_Records&semester=${sem}&teacher=${encodeURIComponent(teacherInfo.B.name)}`)
  const sFilteredData = resSFiltered.data?.data || []
  const sFilteredTest = sFilteredData.filter(r => r.学生 === TEST_STUDENT)
  const allByB = sFilteredTest.every(r => r.记录老师.includes(teacherInfo.B.name))
  record('记录可见性', 'PERM-025: S按B过滤只看B的记录', sFilteredTest.length >= 1 && allByB, `找到${sFilteredTest.length}条, 全是B的=${allByB}`)

  // PERM-026: B queries /records/my → sees only own records
  const resB = await apiAsRaw('B', 'get', `/records/my?collection=Late_Records&semester=${sem}`)
  const bData = resB.data?.data || []
  const bTestRecords = bData.filter(r => r.学生 === TEST_STUDENT)
  const allByBOwn = bTestRecords.every(r => r.记录老师.includes(teacherInfo.B.name))
  record('记录可见性', 'PERM-026: B只看到自己的记录', bTestRecords.length >= 1 && allByBOwn, `找到${bTestRecords.length}条, 全是自己的=${allByBOwn}`)

  // PERM-027: B queries with teacher=S's name → still sees only own records
  const resBFiltered = await apiAsRaw('B', 'get', `/records/my?collection=Late_Records&semester=${sem}&teacher=${encodeURIComponent(teacherInfo.S.name)}`)
  const bFilteredData = resBFiltered.data?.data || []
  const bFilteredTest = bFilteredData.filter(r => r.学生 === TEST_STUDENT)
  const stillOwnOnly = bFilteredTest.every(r => r.记录老师.includes(teacherInfo.B.name))
  record('记录可见性', 'PERM-027: B传S名字仍只看自己的', stillOwnOnly, `找到${bFilteredTest.length}条, 全是自己的=${stillOwnOnly}`)
}

// ==================== 套件6：记录类型插入 — 无后端权限检查 ====================

async function suiteRecordInsertionNoEnforcement() {
  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║  套件6：记录插入无后端权限检查(安全发现)    ║')
  console.log('╚══════════════════════════════════════════╝')

  await cleanup()
  const sem = getCurrentSemester()

  // PERM-028: C inserts FAD (group:'S' type) → 200 (no backend enforcement)
  if (tokens.C) {
    const res = await apiAsRaw('C', 'post', '/records', {
      recordType: 'FAD', date: new Date().toISOString(),
      student: TEST_STUDENT, studentClass: TEST_CLASS,
      semester: sem, teacher: teacherInfo.C.name,
      description: '权限测试-C组插入FAD', sourceType: 'other'
    })
    const passed = res.status === 200
    record('插入无检查', 'PERM-028: C插入FAD(应为S专属)成功', passed, `status=${res.status}`)
    if (passed) {
      securityFinding('PERM-028', 'C组(清洁人员)可通过API直接插入FAD记录，前端限制可被绕过')
    }
  } else recordSkip('插入无检查', 'PERM-028', '无C组Token')

  // PERM-029: F inserts FAD (group:'S' type) → 200 (no backend enforcement)
  if (tokens.F) {
    const res = await apiAsRaw('F', 'post', '/records', {
      recordType: 'FAD', date: new Date().toISOString(),
      student: TEST_STUDENT, studentClass: TEST_CLASS,
      semester: sem, teacher: teacherInfo.F.name,
      description: '权限测试-F组插入FAD', sourceType: 'other'
    })
    const passed = res.status === 200
    record('插入无检查', 'PERM-029: F插入FAD(应为S专属)成功', passed, `status=${res.status}`)
    if (passed) {
      securityFinding('PERM-029', 'F组(教职员工)可通过API直接插入FAD记录，前端限制可被绕过')
    }
  } else recordSkip('插入无检查', 'PERM-029', '无F组Token')

  // PERM-030: C inserts 上网课违规使用电子产品 (group:'S' type) → 200
  if (tokens.C) {
    const res = await apiAsRaw('C', 'post', '/records', {
      recordType: '上网课违规使用电子产品', date: new Date().toISOString(),
      student: TEST_STUDENT, studentClass: TEST_CLASS,
      semester: sem, teacher: teacherInfo.C.name
    })
    const passed = res.status === 200
    record('插入无检查', 'PERM-030: C插入电子产品违规(应为S专属)成功', passed, `status=${res.status}`)
    if (passed) {
      securityFinding('PERM-030', 'C组可通过API插入上网课违规使用电子产品记录(直接触发FAD)，前端限制可被绕过')
    }
  } else recordSkip('插入无检查', 'PERM-030', '无C组Token')
}

// ==================== 主函数 ====================

async function main() {
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║  FAD 用户组权限/访问控制测试                  ║')
  console.log('║  测试学生: ' + TEST_STUDENT.padEnd(33) + '║')
  console.log('╚══════════════════════════════════════════════╝')

  // 1. Connect to MongoDB (GHA + GHS)
  console.log('\n[1/4] 连接MongoDB...')
  client = new MongoClient(MONGO_URI)
  await client.connect()
  db = client.db(DB_NAME)
  ghsDB = client.db(GHS_DB_NAME)
  console.log('  MongoDB连接成功 (GHA + GHS)')

  // 2. Authenticate all 6 groups
  console.log('\n[2/4] 登录所有用户组...')
  await setupAuthentication()

  // 3. Initial cleanup
  console.log('\n[3/4] 初始清理测试数据...')
  await cleanup()
  console.log('  清理完成')

  // 4. Run test suites
  console.log('\n[4/4] 运行测试套件...')

  const suites = [
    { name: '套件1: FAD统计访问控制', fn: suiteFADStatsAccess },
    { name: '套件2: 日程访问控制', fn: suiteScheduleAccess },
    { name: '套件3: 日程会话所有权', fn: suiteScheduleOwnership },
    { name: '套件4: 记录撤回所有权', fn: suiteWithdrawalOwnership },
    { name: '套件5: 我的记录可见性', fn: suiteMyRecordsVisibility },
    { name: '套件6: 记录插入无后端检查', fn: suiteRecordInsertionNoEnforcement },
  ]

  for (const suite of suites) {
    try {
      await suite.fn()
    } catch (e) {
      console.error(`\n  ❌ ${suite.name} 异常: ${e.message}`)
      results.failed++
      results.details.push({ suite: suite.name, name: '套件异常', status: 'FAIL', detail: e.message })
    }
  }

  // Final cleanup
  console.log('\n清理测试数据...')
  await cleanup()
  console.log('  清理完成')

  // Print summary
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║                 测试结果汇总                  ║')
  console.log('╠══════════════════════════════════════════════╣')
  console.log(`║  ✅ 通过: ${String(results.passed).padEnd(5)} ❌ 失败: ${String(results.failed).padEnd(5)} ⏭️  跳过: ${String(results.skipped).padEnd(4)}║`)
  console.log('╚══════════════════════════════════════════════╝')

  if (results.failed > 0) {
    console.log('\n失败的测试:')
    results.details.filter(d => d.status === 'FAIL').forEach(d => {
      console.log(`  ❌ [${d.suite}] ${d.name} - ${d.detail}`)
    })
  }

  if (securityFindings.length > 0) {
    console.log('\n╔══════════════════════════════════════════════╗')
    console.log('║              安全发现 (Security Findings)     ║')
    console.log('╠══════════════════════════════════════════════╣')
    securityFindings.forEach(f => {
      console.log(`║  ⚠️  ${f.id}: ${f.description}`)
    })
    console.log('╠══════════════════════════════════════════════╣')
    console.log('║  说明: 记录类型的权限限制仅在前端实现，        ║')
    console.log('║  后端API对任何已认证用户均不做记录类型检查。    ║')
    console.log('║  建议: 在 records.js POST / 路由中添加         ║')
    console.log('║  req.user.group 检查以匹配前端权限矩阵。      ║')
    console.log('╚══════════════════════════════════════════════╝')
  }

  await client.close()
  console.log('\nMongoDB连接已关闭')
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(e => {
  console.error('测试执行失败:', e)
  if (client) client.close().catch(() => {})
  process.exit(1)
})
