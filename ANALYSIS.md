# FAD学生管理系统 - 完整分析报告

> 源码仓库: https://gitee.com/yorkgf/tencent-gha-fad-record

## 一、系统概述

FAD (Faculty/Academic Discipline) 是一个学生纪律与奖励管理系统，用于记录学生行为、自动累计违规/表扬、生成FAD通知单等。

## 二、数据库结构

### 数据库信息
- **数据库类型**: MongoDB
- **数据库名**: GHA
- **连接地址**: 49.235.189.246:27017

### Collections (共18个)

#### 1. Teachers (教师表)
```javascript
{
  _id: ObjectId,
  Name: String,           // 教师姓名
  email: String,          // 邮箱地址（用于登录）
  Password: String,       // 密码
  Group: String           // 权限组: "S"(管理员), "F"(普通教师), 其他
}
```

#### 2. Students (学生表)
```javascript
{
  _id: ObjectId,
  学生姓名: String,       // 学生姓名
  班级: String,           // 班级
  寝室: Number,           // 寝室号（可选）
  学生会: Boolean         // 是否为学生会成员
}
```

#### 3. All_Classes (班级表)
```javascript
{
  _id: ObjectId,
  Class: String,          // 班级名称
  HomeTeacherEmail: String // 班主任邮箱
}
```

#### 4. RecordType (记录类型权限表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // 记录类型名称
  Group: String           // 可访问此类型的权限组
}
```

#### 5. FAD_Records (FAD记录表 - 核心表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "FAD"
  记录日期: ISODate,
  学生: String,           // 学生姓名
  班级: String,
  记录老师: String,       // 记录人，如 "李老师" 或 "系统: 累计迟到触发"
  记录事由: String,
  学期: String,           // 如 "2024-2025-1"
  是否已执行或冲抵: Boolean, // FAD执行状态
  执行日期: ISODate,
  是否已冲销记录: Boolean, // 是否被Reward冲销
  "冲销记录Reward ID": Array, // 关联的Reward ID数组

  // ===== 新增字段 =====
  FAD来源类型: String,    // 枚举: "dorm"(寝室类), "teach"(教学类), "other"(其他)
  是否已发放: Boolean,    // 纸质通知单是否已发放，默认false
  发放日期: ISODate,      // 发放时间
  发放老师: String        // 发放人姓名
}
```

**FAD来源类型说明：**
| 类型 | 值 | 触发来源 |
|-----|---|---------|
| 寝室类 | `dorm` | 寝室迟出、寝室批评累计、22:00后交还手机、未按规定返校 |
| 教学类 | `teach` | Teaching FAD Ticket累计、上网课违规使用电子产品 |
| 其他 | `other` | 早点名迟到、擅自进入会议室或接待室、手动录入FAD |

**FAD发放状态说明：**
| 字段 | 类型 | 说明 |
|-----|-----|------|
| 是否已发放 | Boolean | 纸质FAD通知单是否已发给学生 |
| 发放日期 | ISODate | 发放时间戳 |
| 发放老师 | String | 发放人姓名 |

**撤回相关字段（所有记录表通用）：**
| 字段 | 类型 | 说明 |
|-----|-----|------|
| 是否已撤回 | Boolean | 记录是否已被撤回，默认false |
| 撤回日期 | ISODate | 撤回时间 |
| 撤回人 | String | 撤回操作人 |

#### 6. Reward_Records (奖励记录表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "Reward"
  记录日期: ISODate,
  学生: String,
  班级: String,
  记录老师: String,
  记录事由: String,
  学期: String,
  是否优先冲抵执行: Boolean, // 是否优先冲抵未执行的FAD
  是否已冲销记录: Boolean,
  冲销记录FAD_ID: String,

  // ===== 新增字段 =====
  是否已发放: Boolean,    // 纸质Reward通知单是否已发放，默认false
  发放日期: ISODate,      // 发放时间
  发放老师: String        // 发放人姓名
}
```

**Reward发放状态说明：**
| 字段 | 类型 | 说明 |
|-----|-----|------|
| 是否已发放 | Boolean | 纸质Reward通知单是否已发给学生 |
| 发放日期 | ISODate | 发放时间戳 |
| 发放老师 | String | 发放人姓名 |

#### 7. Late_Records (迟到记录表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "早点名迟到"
  记录日期: ISODate,
  学生: String,
  班级: String,
  记录老师: String,
  学期: String,
  是否已累计FAD: Boolean,
  "累计FAD ID": String
}
```

#### 8. Leave_Room_Late_Records (寝室迟出记录表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "寝室迟出"
  记录日期: ISODate,
  学生: String,
  班级: String,
  记录老师: String,
  学期: String,
  是否已累计FAD: Boolean,
  "累计FAD ID": String
}
```

#### 9. Back_School_Late_Records (未按规定返校记录表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "未按规定返校"
  记录日期: ISODate,
  学生: String,
  班级: String,
  记录老师: String,
  学期: String,
  是否已累计FAD: Boolean,
  累计FAD_ID: String
}
```

#### 10. MeetingRoom_Violation_Records (会议室违规记录表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "擅自进入会议室或接待室"
  记录日期: ISODate,
  学生: String,
  班级: String,
  记录老师: String,
  学期: String,
  是否已累计FAD: Boolean,
  "累计FAD ID": String
}
```

#### 11. Room_Praise_Records (寝室表扬记录表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "寝室表扬"
  记录日期: ISODate,
  学生: String,
  班级: String,
  记录老师: String,
  学期: String,
  是否已累计Reward: Boolean,
  "累计Reward ID": String
}
```

#### 12. Room_Warning_Records (寝室批评记录表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "寝室批评"
  记录日期: ISODate,
  学生: String,
  班级: String,
  记录老师: String,
  学期: String,
  是否已累计FAD: Boolean,
  "累计FAD ID": String,
  是否已打扫: Boolean,    // 清扫状态
  打扫日期: ISODate
}
```

#### 13. Room_Trash_Records (寝室垃圾未倒记录表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "寝室垃圾未倒"
  记录日期: ISODate,
  学生: String,
  班级: String,
  记录老师: String,
  学期: String,
  是否已累计寝室警告: Boolean,
  "累计寝室警告 ID": String
}
```

#### 14. Elec_Products_Violation_Records (电子产品违规记录表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "上网课违规使用电子产品"
  记录日期: ISODate,
  学生: String,
  班级: String,
  记录老师: String,
  学期: String,
  取消上课资格至: String  // 取消资格日期或"学期结束"
}
```

#### 15. Phone_Late_Records (手机迟交记录表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "21:30后交还手机(22:00前)" 或 "22:00后交还手机"
  记录日期: ISODate,
  学生: String,
  班级: String,
  记录老师: String,
  学期: String,
  是否记录FAD: Boolean    // 22:00后需要记FAD
}
```

#### 16. Teaching_FAD_Ticket (教学FAD罚单表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "Teaching FAD Ticket"
  记录日期: ISODate,
  学生: String,
  班级: String,
  记录老师: String,
  记录事由: String,
  学期: String,
  是否已累计FAD: Boolean,
  累计FAD_ID: String
}
```

#### 17. Teaching_Reward_Ticket (教学奖励票表)
```javascript
{
  _id: ObjectId,
  记录类型: String,       // "Teaching Reward Ticket"
  记录日期: ISODate,
  学生: String,
  班级: String,
  记录老师: String,
  记录事由: String,
  学期: String,
  是否已累计Reward: Boolean,
  累计Reward_ID: String
}
```

#### 18. Stop_Class_Records (停课记录表)
```javascript
{
  _id: ObjectId,
  学生: String,
  停课开始日期: ISODate,
  停课结束日期: ISODate
}
```

---

## 三、业务逻辑

### 1. 用户认证

```
登录流程:
1. 输入邮箱地址
2. 查询Teachers表验证用户存在
3. 验证密码
4. 3次失败后自动重置密码并发送邮件
5. 登录成功后存储username到appsmith.store
```

**权限组**:
- `S`: 管理员 - 可访问所有功能
- `F`: 普通教师 - 限制访问部分功能
- 其他: 基础权限

### 2. 记录类型与自动累计规则

> **规则更新记录**:
> - 2025-09-06: "早点名迟到"规则从"从第二次开始每次触发FAD"改为"每2次换1个FAD"

| 记录类型 | 累计规则 |
|---------|---------|
| FAD | 直接记录FAD |
| Reward | 直接记录Reward，可冲销FAD（2个Reward冲执行，3个Reward冲记录） |
| 早点名迟到 | 2次累计 → 1个FAD *(2025-09-06更新)* |
| 寝室迟出 | 2次累计 → 1个FAD |
| 未按规定返校 | 2次累计 → 1个FAD |
| 擅自进入会议室或接待室 | 2次累计 → 1个FAD |
| 寝室表扬 | 10次累计 → 可兑换Reward（需人工确认） |
| 寝室批评 | 5次累计 → 1个FAD |
| 寝室垃圾未倒 | 2次累计 → 1个寝室批评 |
| 上网课违规使用电子产品 | 每次1个FAD + 第2次取消1月资格 + 第3次取消学期资格 |
| 21:30后交还手机(22:00前) | 仅记录，不触发FAD |
| 22:00后交还手机 | 每次1个FAD |
| Teaching FAD Ticket | 3次累计 → 1个FAD |
| Teaching Reward Ticket | 6次累计 → 可兑换Reward（需人工确认） |

### 3. Reward冲销FAD逻辑

```javascript
// 冲销优先级
if (是否优先冲抵执行) {
  // 先找未执行的FAD
  查找 是否已执行或冲抵=false 的FAD
} else {
  // 找未冲销的FAD
  查找 是否已冲销记录=false 的FAD
}

// 冲销规则
- 2个Reward → 冲抵FAD执行（是否已执行或冲抵=true）
- 3个Reward → 冲销FAD记录（是否已冲销记录=true）
```

### 4. 邮件通知

**触发条件**: 除"寝室表扬"、"Teaching Reward Ticket"和"Reward"外，其他记录都会发送邮件通知班主任

**邮件服务**: Brevo API (https://api.brevo.com/v3/smtp/email)

### 5. FAD执行流程

```
1. FAD Execution页面显示所有未执行的FAD（按学期筛选）
2. 选择FAD记录执行
3. 更新 是否已执行或冲抵=true, 执行日期=当前日期
```

### 6. 寝室清扫流程

```
1. Room Warning Clean页面显示所有有未清扫记录的学生
2. 要求至少有3条未清扫记录才能执行清扫
3. 执行清扫后更新 是否已打扫=true, 打扫日期=当前日期
```

### 7. 停课管理

```
触发条件: FAD累计达到3次且未冲销
显示信息:
- 已停课天数
- 新增停课开始日期
- 新增停课结束日期
```

### 8. FAD通知单发放流程

```
// ToNotifyFAD页面
1. 显示所有 是否已发放=false 的FAD记录（待发放的通知单）
2. 点击下载生成HTML通知单，包含：
   - 学生姓名
   - 班级
   - 学期
   - 记录日期
   - 记录老师
   - 记录事由
   - FAD来源类型（可选显示）
3. 确认发放后更新：
   - 是否已发放 = true
   - 发放日期 = 当前时间
   - 发放老师 = 当前登录用户
```

**原设计 vs 新设计：**
| 项目 | 原设计 | 新设计 |
|-----|-------|-------|
| 发放状态 | 记录老师字段前缀"已发:" | 独立字段 `是否已发放` |
| 查询未发放 | `记录老师: {$regex: "^系统"}` | `是否已发放: false` |
| 发放人 | 无法单独获取 | 独立字段 `发放老师` |
| 发放时间 | 无 | 独立字段 `发放日期` |

---

## 四、页面功能对照

| 页面 | 主要功能 | 涉及的Collections |
|-----|---------|------------------|
| Login | 用户登录/密码重置 | Teachers |
| Insert Record | 录入各类记录 | 所有记录表 |
| FAD Excution | FAD执行 | FAD_Records |
| Upate_Password | 修改密码 | Teachers |
| Room Praise Reward | 寝室表扬兑奖 | Room_Praise_Records |
| Room Warning Clean | 寝室清扫 | Room_Warning_Records |
| Cancel Electronic Classes | 取消电子课资格 | Elec_Products_Violation_Records |
| No Phone List | 当日未交手机名单 | Phone_Late_Records |
| Stop Class List | 停课学生名单 | FAD_Records, Stop_Class_Records |
| All Data | 数据查询 | 所有记录表 |
| ToNotifyFAD | FAD通知单发放 | FAD_Records |
| TeacherTicketReward | 教学票兑奖 | Teaching_Reward_Ticket |
| FADRecordofStudentUnion | 学生会FAD记录 | FAD_Records, Students |

---

## 五、外部依赖

### API服务
- **Brevo邮件API**: https://api.brevo.com/v3/smtp/email

### 前端JS库
- jsPDF 2.5.1 (PDF生成)
- html2canvas 1.4.1 (HTML转图片)

---

## 六、待实施的功能变更

### 新增记录撤回功能

#### 1. 撤回权限与前提条件

**普通教师撤回：**
| 条件 | 说明 |
|-----|------|
| 本人记录 | 只能撤回自己发出的记录（`记录老师` 匹配当前用户） |
| FAD未发放 | 累计产生的FAD的 `是否已发放=false` |
| Reward未发放 | 累计产生的Reward的 `是否已发放=false` |

**管理员撤回（Group="S"）：**
| 条件 | 说明 |
|-----|------|
| 任意记录 | 可以撤回任何人发出的记录，无需匹配 `记录老师` |
| FAD未发放 | 该记录（或累计产生的FAD）的 `是否已发放=false` |
| Reward未发放 | 该记录（或累计产生的Reward）的 `是否已发放=false` |

> **注意**：一旦纸质FAD或Reward通知单已发放给学生，该记录及其关联的累计记录均无法撤回。

#### 2. 撤回场景与连带操作

| 场景 | 撤回的记录类型 | 连带撤回 | 状态回滚 |
|-----|--------------|---------|---------|
| A | 直接FAD | - | - |
| B | 直接Reward | - | 恢复已冲销的FAD状态 |
| C | 早点名迟到 | 累计产生的FAD | 其他迟到记录 → 未累计 |
| D | 寝室迟出 | 累计产生的FAD | 其他寝室迟出记录 → 未累计 |
| E | 未按规定返校 | 累计产生的FAD | 其他返校记录 → 未累计 |
| F | 擅自进入会议室 | 累计产生的FAD | 其他会议室记录 → 未累计 |
| G | Teaching FAD Ticket | 累计产生的FAD | 其他Ticket → 未累计 |
| H | 寝室批评 | 累计产生的FAD | 其他寝室批评 → 未累计 |
| I | 寝室垃圾未倒 | 寝室批评 → FAD（链式） | 所有相关记录 → 未累计 |
| J | 上网课违规使用电子产品 | 同时产生的FAD | - |
| K | 22:00后交还手机 | 同时产生的FAD | - |

#### 3. 撤回字段设计（所有记录表通用）

```javascript
{
  // ===== 撤回相关字段 =====
  是否已撤回: Boolean,      // 默认false
  撤回日期: ISODate,        // 撤回时间
  撤回人: String            // 撤回操作人（通常是记录老师本人）
}
```

#### 4. 撤回逻辑详解

**场景I: 寝室垃圾未倒 链式撤回（最复杂）**

```
撤回"寝室垃圾未倒"记录
    ↓
检查该记录是否累计产生了"寝室批评"
    ↓ 是
检查该"寝室批评"是否累计产生了"FAD"
    ↓ 是
检查该FAD是否已发放
    ↓ 否（可撤回）
1. 撤回该FAD记录
2. 撤回该寝室批评记录
3. 撤回该垃圾未倒记录
4. 将同一个FAD关联的其他寝室批评 → 是否已累计FAD=false
5. 将同一个寝室批评关联的其他垃圾未倒 → 是否已累计寝室警告=false
6. 将同一个FAD关联的其他寝室批评关联的垃圾未倒 → 是否已累计寝室警告=false
```

**场景B: Reward撤回（需恢复FAD状态）**

```
撤回Reward记录
    ↓
检查该Reward是否已冲销FAD（冲销记录FAD_ID 不为空）
    ↓ 是
1. 从FAD的"冲销记录Reward ID"数组中移除该Reward ID
2. 重新计算FAD状态：
   - 如果剩余Reward数 < 2 → 是否已执行或冲抵=false
   - 如果剩余Reward数 < 3 → 是否已冲销记录=false
3. 撤回该Reward记录
```

#### 5. API设计

```
POST   /api/records/:collection/:id/withdraw    # 撤回记录
```

**请求体：**
```json
{
  "reason": "录入错误"    // 可选：撤回原因
}
```

**响应（成功）：**
```json
{
  "success": true,
  "data": {
    "withdrawnRecords": [
      { "collection": "Room_Trash_Records", "id": "xxx", "type": "寝室垃圾未倒" },
      { "collection": "Room_Warning_Records", "id": "yyy", "type": "寝室批评" },
      { "collection": "FAD_Records", "id": "zzz", "type": "FAD" }
    ],
    "resetRecords": [
      { "collection": "Room_Trash_Records", "id": "aaa", "field": "是否已累计寝室警告", "newValue": false },
      { "collection": "Room_Warning_Records", "id": "bbb", "field": "是否已累计FAD", "newValue": false }
    ]
  }
}
```

**响应（失败 - FAD已发放）：**
```json
{
  "success": false,
  "error": "无法撤回：该记录累计产生的FAD已发放纸质通知单",
  "fadId": "zzz"
}
```

**响应（失败 - Reward已发放）：**
```json
{
  "success": false,
  "error": "无法撤回：该记录累计产生的Reward已发放纸质通知单",
  "rewardId": "aaa"
}
```

**响应（失败 - 权限不足）：**
```json
{
  "success": false,
  "error": "只能撤回自己发出的记录"
}
```

> 注：管理员（Group="S"）不受"本人记录"限制，但仍受"已发放"限制。

#### 6. 云函数模块

```
functions/
├── records/
│   └── withdraw/
│       ├── index.js              # 撤回入口，权限检查
│       ├── checkWithdrawable.js  # 检查是否可撤回（含管理员判断）
│       ├── withdrawFAD.js        # 撤回FAD
│       ├── withdrawReward.js     # 撤回Reward（恢复FAD状态）
│       ├── withdrawAccumulated.js # 撤回累计类记录
│       └── withdrawChain.js      # 链式撤回（垃圾未倒→寝室批评→FAD）
```

**checkWithdrawable.js 权限检查逻辑：**
```javascript
async function checkWithdrawable(recordId, collection, currentUser) {
  const record = await db.collection(collection).findOne({ _id: recordId });
  const teacher = await db.collection('Teachers').findOne({ Name: currentUser });

  // 1. 权限检查
  const isAdmin = teacher.Group === 'S';
  const isOwner = record.记录老师.replace('系统: ', '') === currentUser;

  if (!isAdmin && !isOwner) {
    return { withdrawable: false, reason: '只能撤回自己发出的记录' };
  }

  // 2. 检查关联的FAD是否已发放
  const fadDelivered = await checkFADDelivered(record, collection);
  if (fadDelivered) {
    return { withdrawable: false, reason: '该记录累计产生的FAD已发放纸质通知单' };
  }

  // 3. 检查关联的Reward是否已发放
  const rewardDelivered = await checkRewardDelivered(record, collection);
  if (rewardDelivered) {
    return { withdrawable: false, reason: '该记录累计产生的Reward已发放纸质通知单' };
  }

  return { withdrawable: true, chainRecords: getChainRecords(record, collection) };
}
```

#### 7. 前端页面

| 页面 | 功能 |
|-----|------|
| `/records/my-records` | 查看自己的记录，带撤回按钮 |
| 撤回按钮 | 仅当记录可撤回时显示（灰色=不可撤回，显示原因） |
| 撤回确认弹窗 | 显示将被连带撤回的记录列表 |

---

### 新增FAD来源类型字段

#### 1. 数据库查询修改

**文件**: `pages/Insert Record/queries/Insert_FAD/metadata.json`

修改 `insert.documents.data`，添加新字段：

```javascript
[{记录类型: {{this.params.recordType}},
  记录日期: ISODate({{new Date(this.params.date)}}),
  学生: {{this.params.student}},
  班级: {{this.params.studentClass}},
  记录老师: {{this.params.teacher}},
  记录事由: {{this.params.description}},
  学期: {{this.params.semester}},
  是否已执行或冲抵: false,
  执行日期: null,
  是否已冲销记录: false,
  "冲销记录Reward ID": [],
  FAD来源类型: {{this.params.sourceType}},   // ← 新增
  是否已发放: false,                          // ← 新增
  发放日期: null,                             // ← 新增
  发放老师: ""                                // ← 新增
}]
```

#### 2. 代码修改点 (InsertRecordObject.js)

| 行号 | 触发来源 | FAD来源类型 | 修改说明 |
|-----|---------|------------|---------|
| 106 | 手动录入FAD | **用户选择** | 从下拉框获取 `sourceType: FADSourceType.selectedOptionValue` |
| 262 | 上网课违规使用电子产品 | `teach` | 添加参数 `sourceType: "teach"` |
| 309 | 22:00后交还手机 | `dorm` | 添加参数 `sourceType: "dorm"` |
| 394 | 累计迟到触发（早点名迟到）| `other` | 添加参数 `sourceType: "other"` |
| 416 | 累计寝室迟出触发 | `dorm` | 添加参数 `sourceType: "dorm"` |
| 438 | 累计未按规定返校触发 | `dorm` | 添加参数 `sourceType: "dorm"` |
| 462 | 累计违反课堂纪律触发 | `teach` | 添加参数 `sourceType: "teach"` |
| 486 | 累计违规进入会议室或接待室触发 | `other` | 添加参数 `sourceType: "other"` |
| 508 | 累计寝室批评触发 | `dorm` | 添加参数 `sourceType: "dorm"` |

#### 3. 前端UI修改 (Insert Record页面)

当选择记录类型为"FAD"时，显示FAD来源类型下拉框：

**新增Widget: FADSourceType (Select)**
```javascript
{
  widgetName: "FADSourceType",
  widgetType: "SELECT_WIDGET",
  label: "FAD来源类型",
  options: [
    { label: "寝室类", value: "dorm" },
    { label: "教学类", value: "teach" },
    { label: "其他", value: "other" }
  ],
  defaultOptionValue: "other",
  isVisible: "{{RecordType.selectedOptionValue === 'FAD'}}"  // 仅当选择FAD时显示
}
```

#### 4. 修改示例

**手动录入FAD (行106) - 修改后:**
```javascript
await Insert_FAD.run({recordType: this.recordType, date: this.date,
    student: this.studentName,
    studentClass: this.studentClass, semester: this.semester,
    teacher: "系统: " + this.teacher,
    description: this.description,
    sourceType: FADSourceType.selectedOptionValue})  // 从下拉框获取
```

**自动触发FAD (行416) - 修改后:**
```javascript
await Insert_FAD.run({recordType: "FAD", date: Date(), student: late_student,
    studentClass: this.studentClass, teacher: "系统: 累计寝室迟出触发",
    description: FADdescription, semester: semester,
    sourceType: "dorm"})  // 固定值
```

---

## 七、重构方案 (EdgeOne Pages + 腾讯云函数)

### 技术栈

| 层级 | 技术选择 | 说明 |
|-----|---------|------|
| 前端 | Vue 3 + Vite + Element Plus | EdgeOne Pages 静态托管 |
| 后端 | 腾讯云函数 (SCF) + API Gateway | Node.js 18+ |
| 数据库 | 腾讯云MongoDB | 或继续使用现有MongoDB |
| 邮件 | Brevo API | 保持现有邮件服务 |

---

### API设计

#### 认证模块
```
POST   /api/auth/login                    # 用户登录
POST   /api/auth/reset-password           # 重置密码（发送邮件）
PUT    /api/auth/change-password          # 修改密码
```

#### 基础数据模块
```
GET    /api/students                      # 获取学生列表（支持搜索）
GET    /api/students/:id                  # 获取学生详情
GET    /api/teachers/me                   # 获取当前教师信息
GET    /api/teachers/me/record-types      # 获取当前教师可用的记录类型
GET    /api/classes                       # 获取班级列表
GET    /api/classes/:name/home-teacher    # 获取班主任邮箱
```

#### 记录模块（核心）
```
POST   /api/records                       # 插入记录（统一入口）
GET    /api/records                       # 查询记录
       ?collection=FAD_Records
       &dateFrom=2025-01-01
       &dateTo=2025-12-31
       &student=张三
       &withdrawn=false                   # 排除已撤回记录
GET    /api/records/my                    # ← 新增：获取自己的记录（管理员获取所有记录）
       ?collection=FAD_Records
       &teacher=李老师                    # 管理员可指定教师筛选
POST   /api/records/:collection/:id/withdraw  # ← 新增：撤回记录
GET    /api/records/:collection/:id/withdrawable  # ← 新增：检查是否可撤回
```

**POST /api/records 请求体示例：**
```json
{
  "recordType": "FAD",
  "date": "2025-01-24",
  "student": "张三",
  "studentClass": "高一(1)班",
  "semester": "2024-2025-2",
  "teacher": "李老师",
  "description": "违反课堂纪律",
  "sourceType": "teach"              // ← 新增：FAD来源类型
}
```

#### FAD记录模块
```
GET    /api/fad-records                   # 获取FAD记录列表
       ?semester=2024-2025-2
       &sourceType=dorm                   // 按来源类型筛选
       &executed=false
       &delivered=false                   // ← 新增：按发放状态筛选
GET    /api/fad-records/unexecuted        # 获取未执行的FAD
       ?semester=2024-2025-2
       &sourceType=dorm
GET    /api/fad-records/undelivered       # ← 新增：获取未发放的FAD
       ?semester=2024-2025-2
       &sourceType=dorm
GET    /api/fad-records/stats             # FAD统计
       ?semester=2024-2025-2
       &groupBy=sourceType                // 按来源类型分组统计
PUT    /api/fad-records/:id/execute       # 执行FAD
PUT    /api/fad-records/:id/deliver       # 发放FAD通知单
GET    /api/fad-records/student-union     # 学生会FAD记录
```

**PUT /api/fad-records/:id/deliver 请求体：**
```json
{
  "deliverTeacher": "李老师"    // 发放老师姓名
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "是否已发放": true,
    "发放日期": "2025-01-24T10:30:00Z",
    "发放老师": "李老师"
  }
}
```

#### Reward记录模块
```
GET    /api/reward-records                # 获取Reward记录
       ?semester=2024-2025-2
       &delivered=false                   # 按发放状态筛选
POST   /api/reward-records                # 插入Reward（自动冲销FAD）
GET    /api/reward-records/undelivered    # 获取未发放的Reward
PUT    /api/reward-records/:id/deliver    # 发放Reward通知单
```

**PUT /api/reward-records/:id/deliver 请求体：**
```json
{
  "deliverTeacher": "李老师"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "是否已发放": true,
    "发放日期": "2025-01-24T10:30:00Z",
    "发放老师": "李老师"
  }
}
```

#### 寝室模块
```
GET    /api/room-praise/rewardable        # 可兑换Reward的寝室表扬
POST   /api/room-praise/to-reward         # 寝室表扬兑换Reward
GET    /api/room-warning/cleanable        # 可清扫的寝室批评
POST   /api/room-warning/clean            # 确认清扫
```

#### 其他模块
```
GET    /api/elec-violations/cancelled     # 被取消上课资格的学生
GET    /api/phone-late/today              # 今日手机迟交名单
GET    /api/stop-class/list               # 停课学生名单
GET    /api/teaching-tickets/fad          # 教学FAD票待累计
GET    /api/teaching-tickets/reward       # 教学Reward票待兑换
POST   /api/email/notify                  # 发送邮件通知
```

---

### 云函数模块结构

```
functions/
├── auth/
│   ├── login.js              # 登录验证
│   ├── resetPassword.js      # 重置密码
│   └── changePassword.js     # 修改密码
│
├── students/
│   └── index.js              # 学生CRUD
│
├── teachers/
│   └── index.js              # 教师信息、权限
│
├── records/
│   ├── index.js              # 记录插入统一入口
│   ├── query.js              # 记录查询
│   ├── myRecords.js          # ← 新增：获取自己的记录
│   ├── accumulate/           # 自动累计逻辑
│   │   ├── index.js          # 累计调度器
│   │   ├── lateToFAD.js      # 迟到累计FAD
│   │   ├── dormToFAD.js      # 寝室行为累计FAD
│   │   ├── teachToFAD.js     # 教学行为累计FAD
│   │   └── trashToWarning.js # 垃圾未倒累计寝室批评
│   └── withdraw/             # ← 新增：撤回逻辑
│       ├── index.js          # 撤回入口，权限检查
│       ├── checkWithdrawable.js  # 检查是否可撤回
│       ├── withdrawFAD.js    # 撤回FAD
│       ├── withdrawReward.js # 撤回Reward（恢复FAD状态）
│       ├── withdrawAccumulated.js # 撤回累计类记录
│       └── withdrawChain.js  # 链式撤回（垃圾未倒→批评→FAD）
│
├── fad/
│   ├── list.js               # FAD列表查询
│   ├── stats.js              # ← 新增：FAD统计（按来源类型）
│   ├── execute.js            # FAD执行
│   ├── deliver.js            # FAD通知单发放
│   ├── hedge.js              # Reward冲销FAD
│   └── studentUnion.js       # 学生会FAD
│
├── reward/
│   ├── list.js               # Reward列表
│   ├── insert.js             # 插入Reward（触发冲销）
│   └── deliver.js            # Reward通知单发放
│
├── room/
│   ├── praiseToReward.js     # 寝室表扬兑换
│   └── clean.js              # 寝室清扫确认
│
├── elec/
│   └── cancelClass.js        # 电子产品违规处理
│
├── phone/
│   └── todayList.js          # 今日手机迟交
│
├── stopClass/
│   └── list.js               # 停课名单
│
├── email/
│   └── send.js               # 邮件发送（Brevo）
│
└── utils/
    ├── db.js                 # MongoDB连接池
    ├── auth.js               # JWT验证
    ├── brevo.js              # Brevo邮件SDK
    └── constants.js          # 常量定义（FAD来源类型等）
```

---

### 核心常量定义

**utils/constants.js**
```javascript
// FAD来源类型
export const FAD_SOURCE_TYPE = {
  DORM: 'dorm',     // 寝室类
  TEACH: 'teach',   // 教学类
  OTHER: 'other'    // 其他
};

// FAD来源类型中文映射
export const FAD_SOURCE_TYPE_LABEL = {
  'dorm': '寝室类',
  'teach': '教学类',
  'other': '其他'
};

// 记录类型到FAD来源类型的映射
export const RECORD_TO_FAD_SOURCE = {
  '寝室迟出': FAD_SOURCE_TYPE.DORM,
  '寝室批评': FAD_SOURCE_TYPE.DORM,
  '22:00后交还手机': FAD_SOURCE_TYPE.DORM,
  '未按规定返校': FAD_SOURCE_TYPE.DORM,
  'Teaching FAD Ticket': FAD_SOURCE_TYPE.TEACH,
  '上网课违规使用电子产品': FAD_SOURCE_TYPE.TEACH,
  '早点名迟到': FAD_SOURCE_TYPE.OTHER,
  '擅自进入会议室或接待室': FAD_SOURCE_TYPE.OTHER,
  'FAD': null  // 手动录入，由用户选择
};

// 累计规则
export const ACCUMULATE_RULES = {
  '早点名迟到': { count: 2, result: 'FAD', sourceType: FAD_SOURCE_TYPE.OTHER },
  '寝室迟出': { count: 2, result: 'FAD', sourceType: FAD_SOURCE_TYPE.DORM },
  '未按规定返校': { count: 2, result: 'FAD', sourceType: FAD_SOURCE_TYPE.DORM },
  '擅自进入会议室或接待室': { count: 2, result: 'FAD', sourceType: FAD_SOURCE_TYPE.OTHER },
  '寝室批评': { count: 5, result: 'FAD', sourceType: FAD_SOURCE_TYPE.DORM },
  '寝室垃圾未倒': { count: 2, result: '寝室批评' },
  'Teaching FAD Ticket': { count: 3, result: 'FAD', sourceType: FAD_SOURCE_TYPE.TEACH },
  '寝室表扬': { count: 10, result: 'Reward_Hint' },
  'Teaching Reward Ticket': { count: 6, result: 'Reward_Hint' }
};
```

---

### 前端页面规划

| 页面路由 | 页面名称 | 功能 |
|---------|---------|-----|
| `/login` | 登录 | 用户登录 |
| `/records/insert` | 录入记录 | 录入各类记录（含FAD来源类型选择） |
| `/records/my` | 我的记录 | ← 新增：查看/撤回自己的记录（管理员可查看并撤回所有人的记录） |
| `/fad/execution` | FAD执行 | 执行FAD，支持按来源类型筛选 |
| `/fad/deliver` | FAD通知单发放 | 发放FAD通知单，显示未发放列表 |
| `/reward/deliver` | Reward通知单发放 | 发放Reward通知单，显示未发放列表 |
| `/fad/stats` | FAD统计 | 按来源类型/发放状态统计 |
| `/room/praise-reward` | 寝室表扬兑奖 | 寝室表扬兑换Reward |
| `/room/clean` | 寝室清扫 | 寝室清扫确认 |
| `/elec/violations` | 电子产品违规 | 取消上课资格管理 |
| `/phone/no-phone-list` | 未交手机名单 | 当日未交手机名单 |
| `/stop-class` | 停课名单 | 停课学生管理 |
| `/data/all` | 数据查询 | 全部数据查询（支持发放/撤回状态筛选） |
| `/settings/password` | 修改密码 | 修改密码 |

---

### 数据迁移注意事项

重构时需要迁移现有数据，处理"记录老师"字段中的发放状态：

```javascript
// 迁移脚本逻辑
db.FAD_Records.find({}).forEach(doc => {
  const teacher = doc.记录老师 || '';
  const isDelivered = teacher.startsWith('已发:');

  db.FAD_Records.updateOne(
    { _id: doc._id },
    {
      $set: {
        是否已发放: isDelivered,
        发放日期: isDelivered ? doc.记录日期 : null,  // 无精确时间，用记录日期近似
        发放老师: isDelivered ? teacher.replace('已发:', '').trim() : '',
        记录老师: isDelivered ? teacher.replace('已发:', '').trim() : teacher,
        FAD来源类型: 'other'  // 默认值，需人工或规则补充
      }
    }
  );
});
```
