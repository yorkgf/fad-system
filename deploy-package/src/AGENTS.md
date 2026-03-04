# Backend Source

**Generated:** 2026-01-26T22:53:17+08:00

## OVERVIEW
Express API routes + MongoDB utilities - serverless dual-mode (local dev + Tencent SCF).

## STRUCTURE
```
src/
├── routes/           # Modular domain endpoints - see routes/AGENTS.md
│   ├── records.js    # Core: 884 lines, insertion/withdrawal/accumulation
│   ├── fad.js        # FAD execution, delivery, stats
│   ├── reward.js     # Reward delivery
│   ├── room.js       # 寝室表扬/批评管理
│   ├── auth.js       # Login, password ops
│   ├── students.js   # 学生/班级数据
│   └── other.js      # 违规列表、停课、教学票/手机管理
└── utils/
    ├── constants.js  # Business rules: ACCUMULATE_RULES, mappings
    ├── db.js         # MongoDB singleton (GHA database)
    ├── email.js      # Brevo API notifications
    └── auth.js       # JWT verify, bcrypt hash helpers
```

## WHERE TO LOOK
| Task | Location |
|------|----------|
| All API routes | routes/AGENTS.md |
| Insert record logic | routes/records.js POST / |
| Withdrawal cascade | routes/records.js withdrawRecord() |
| Accumulation triggers | routes/records.js (查累计规则后insert) |
| All thresholds | utils/constants.js ACCUMULATE_RULES |
| JWT middleware | All routes: verifyToken() |

## CONVENTIONS

**Route patterns**
- All exports mounted as `app.use('/api/ROUTE', route模块)`
- POST /records 基于 `recordType` 分发到对应集合
- Withdrawal: 记录老师匹配 或 Group=S权限

**DB naming**
- System: Teachers, Students, All_Classes
- Records: {Type}_Records (FAD_Records, Late_Records等)
- Special: Teaching_FAD_Ticket, Teaching_Reward_Ticket

## ANTI-PATTERNS

**禁止**
- 撤回已发放 (是否已发放=true)
- 直接修改 FAD.冲销记录Reward ID
- 绕过累计规则插入FAD

**必须**
- 所有数据库操作 await db() 获取连接
- 记录插入先查 `ACCUMULATE_RULES`
