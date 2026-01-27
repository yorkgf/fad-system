# Backend API Routes

**Generated:** 2026-01-26T22:53:17+08:00

## OVERVIEW
7 modular Express routers handling FAD/Reward record management with MongoDB.

## STRUCTURE
```
routes/
├── records.js    # Core: 884 lines, record insertion, withdrawal, accumulation logic
├── fad.js        # FAD execution, delivery, stats (374 lines)
├── reward.js     # Reward delivery
├── room.js       # 寝室表扬/批评管理 (304 lines)
├── auth.js       # Login, password operations
├── students.js   # Student/class data queries
└── other.js      # Violations list, stop class, teaching tickets, phone management
```

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Insert record logic | records.js POST / |
| Withdrawal cascade | records.js withdrawRecord() |
| Accumulation triggers | records.js (查累计规则后insert) |
| FAD execution/delivery | fad.js POST /execute, /deliver |
| Reward delivery | reward.js POST /deliver |
| 寝室兑换 | room.js POST /redeem-praise, /confirm-clean |
| All thresholds | ../utils/constants.js ACCUMULATE_RULES |

## CONVENTIONS

**Route patterns**
- All exported routers mounted as `app.use('/api/ROUTE', route模块)`
- POST /records 基于 `recordType` 分发到对应集合
- JWT middleware `verifyToken()` protects all routes except health/login

**Withdrawal logic**
- `withdrawRecord()` checks: record teacher匹配 OR Group=S权限
- `是否已发放=true` 阻止撤回
- Cascade: 撤回基础记录 → 删除生成的FAD/寝室批评

**Collection naming**
- Records: `{Type}_Records` (FAD_Records, Late_Records, Room_Praise_Records等)
- Tickets: Teaching_FAD_Ticket, Teaching_Reward_Ticket
- System: Teachers, Students, All_Classes

## ANTI-PATTERNS

**禁止**
- 撤回已发放 (是否已发放=true)
- 直接修改 FAD.冲销记录Reward ID (必须通过撤回奖励逻辑)
- 绕过累计规则插入FAD
- 在撤回时不处理级联删除

**必须**
- 所有数据库操作 await db() 获取连接
- 记录插入前先查 `ACCUMULATE_RULES`
- 撤回时处理级联删除 (FAD→基础违规, 奖励→冲销记录)
