# FAD 学生管理系统

**Generated:** 2026-01-26T22:53:17+08:00
**Commit:** 7566e2f
**Branch:** main

## OVERVIEW
Faculty/Academic Discipline 学生纪律与奖励管理系统 - Vue 3 + Express 双栈应用，部署在腾讯云 SCF + EdgeOne Pages。

## STRUCTURE
```
./
├── backend/                 # Express API routes + MongoDB utils (12 files, 6k lines)
│   └── src/
│       ├── routes/          # 7 modular routers (4.4k lines) - see routes/AGENTS.md
│       └── utils/           # Constants, DB, email, JWT helpers
├── frontend/               # Vue 3 + Element Plus UI (30 files, 7.7k lines)
│   └── src/
│       ├── api/             # Axios wrappers (8 files)
│       ├── stores/          # Pinia state management (2 files)
│       ├── views/           # 16 Vue components - see views/AGENTS.md
│       └── router/          # Vue Router config
├── deploy-package/         # SCF bundled upload package
├── sample project/         # Legacy meeting system (separate, 255 files)
└── tencent-gha-fad-record/ # Tencent GHA low-code app (255 files, pages/widgets)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| All API routes | `backend/src/routes/AGENTS.md` | 7 routers: records, fad, reward, room, auth, students, other |
| Frontend views | `frontend/src/views/AGENTS.md` | 16 components by domain |
| 累计规则 | `backend/src/utils/constants.js` | ACCUMULATE_RULES 定义所有阈值 |
| 记录插入逻辑 | `backend/src/routes/records.js` | 884行核心文件，处理撤回/冲销 |
| 记录类型集合映射 | `backend/src/utils/constants.js` | RECORD_TYPE_TO_COLLECTION |
| API配置 | `frontend/src/api/request.js` | Axios base URL + auth header |
| 环境变量 | `backend/.env` (local) / SCF Console | MONGO_URI, JWT_SECRET, BREVO_API_KEY |

## CODE MAP

| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| ACCUMULATE_RULES | const | backend/src/utils/constants.js | - | 累计规则: 早点名迟到2→FAD, 教学票3→FAD |
| RECORD_TYPE_TO_COLLECTION | const | backend/src/utils/constants.js | - | 记录类型→MongoDB集合映射 |
| allRecordTypes | const | frontend/src/stores/common.js | - | 14种记录类型分组 (S/F) |
| withdrawRecord | function | backend/src/routes/records.js | - | 撤回+级联处理+奖励冲销 |

## CONVENTIONS

**命名规范**
- 后端路由: 集合映射到对应数据库表集合 (Late_Records, Room_Praise_Records等)
- 前端: Vue组件PascalCase (MyRecords.vue, InsertRecord.vue)

**API结构**
- 统一入口: `POST /api/records` 基于 recordType 分发到对应集合
- 认证: JWT Bearer token (stores/user.js 持久化)

**数据库集合命名**
- 系统表: `Teachers`, `Students`, `All_Classes`
- 记录表: `{Type}_Records` (FAD_Records, Reward_Records, Late_Records等)
- 特殊表: `Teaching_FAD_Ticket`, `Teaching_Reward_Ticket`

**FAD来源类型 (FAD_SOURCE_TYPE)**
- `dorm`: 寝室类 (寝室迟出、寝室批评、22:00后交手机)
- `teach`: 教学类 (Teaching FAD Ticket、上网课违规)
- `other`: 其他 (早点名迟到、擅自进入会议室、手动FAD录入)

## ANTI-PATTERNS (THIS PROJECT)

**禁止**
- 在撤回已发放的FAD/Reward: `是否已发放=true` 阻止撤回
- 直接修改 `冲销记录Reward ID` 数组: 必须通过撤回奖励逻辑处理
- 绕过累计规则直接插入FAD: 违规类型应触发自动累计

**注意**
- "22:00后交还手机" 和 "21:30后交还手机(22:00前)" 都映射到 `Phone_Late_Records` 集合
- 技术端录入的FAD/Reward (group='S') 只有管理员可撤回
- 前端 `allRecordTypes` 和后端 `constants.js` 需保持同步

## UNIQUE STYLES

**记录类型分类**
- F组 (学生记录): 普通教师可录入 (早点名迟到、寝室表扬等)
- S组 (系统记录): 仅管理员录入 (FAD, Reward, 上网课违规)

**累计链式触发**
- 基础违规 → 触发FAD → FAD累计可能再次触发 (当前未实现)
- 撤回基础记录 → 级联删除生成的FAD/寝室批评

**双模式部署**
- 本地: `npm run dev` (backend 8080, frontend 3000)
- 生产: SCF Function URL + EdgeOne Pages静态托管

## COMMANDS

```bash
# Backend dev (port 8080)
cd backend && npm run dev

# Frontend dev (port 3000)
cd frontend && npm run dev

# Production build
cd frontend && npm run build:prod

# Deploy to SCF (requires serverless config)
cd backend && npm run deploy
```

## NOTES

**Gotchas**
- `deploy-package/` 是部署包 (包含 bundled node_modules)，修改代码需重新上传
- 邮件通知使用 Brevo API: `NO_EMAIL_TYPES` 配置不发送的记录类型
- 教师登录通过 `其他` → `教职工" 页面初始化数据
- 前端代理 `/api` 到 SCF URL 仅在 dev 模式生效

**累计规则速查**
| 记录类型 | 阈值 | 结果 |
|---------|-----|------|
| 早点名迟到 | 2 | FAD |
| 寝室迟出 | 2 | FAD |
| 未按规定返校 | 2 | FAD |
| 寝室批评 | 5 | FAD |
| 寝室垃圾未倒 | 2 | 寝室批评 |
| Teaching FAD Ticket | 3 | FAD |
| Reward | 2→冲执行, 3→冲记录 | Offsets FAD |
