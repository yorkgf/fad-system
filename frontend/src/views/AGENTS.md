# Frontend Views

**Generated:** 2026-01-26T22:53:17+08:00

## OVERVIEW
16 Vue 3 Composition API components covering all FAD/Reward management domains.

## STRUCTURE
```
views/
├── records/
│   ├── MyRecords.vue        # 586 lines: Record list view, withdrawal
│   └── InsertRecord.vue     # 547 lines: Record insertion form
├── fad/
│   ├── FADExecution.vue     # FAD execution management
│   ├── FADDeliver.vue       # 271 lines: FAD delivery form
│   └── FADStats.vue        # 401 lines: FAD statistics dashboard
├── reward/
│   └── RewardDeliver.vue    # Reward delivery form
├── room/
│   ├── PraiseReward.vue     # 寝室表扬兑换
│   ├── RoomClean.vue        # 寝室清扫确认
│   └── BestDormRanking.vue # 优秀寝室排行
├── phone/
│   └── NoPhoneList.vue      # 违规列表 (无手机学生)
├── elec/
│   └── Violations.vue       # 电子产品违规列表
├── settings/
│   └── ChangePassword.vue   # Password change form
├── data/
│   └── AllData.vue         # 311 lines: Global data view
├── TeachingTickets.vue      # 教学票管理
├── StopClass.vue           # 停课名单
└── Login.vue               # 310 lines: Staff login entry
```

## WHERE TO LOOK
| Task | Location |
|------|----------|
| 14种记录类型定义 | ../stores/common.js allRecordTypes |
| 记录表单/列表 | records/InsertRecord.vue, MyRecords.vue |
| FAD发放流程 | fad/FADDeliver.vue |
| 寝室兑换逻辑 | room/PraiseReward.vue |
| 全局数据查询 | data/AllData.vue |
| API调用模式 | ../api/*.js (auto-auth via request.js) |

## CONVENTIONS

**Vue模式**
- Composition API with `setup()` syntax
- Pinia stores 直接导入使用 (`useUserStore`, `useCommonStore`)
- Element Plus 表格/表单组件为主

**记录类型分组**
- `group='F'` (Faculty): 普通教师可录入 (早点名迟到、寝室表扬等)
- `group='S'` (System): 仅管理员可见/录入 (FAD, Reward, 上网课违规)

**表单处理**
- 使用 Element Plus `el-form` + `el-form-item`
- Validation rules defined per form
- Submit calls corresponding `../api/*.js` methods

## ANTI-PATTERNS

**禁止**
- 直接绕过 `../api/request.js` (跳过JWT认证)
- 手动修改 `allRecordTypes` 常量 (需同步后端constants.js)
- FAD发放表单后可修改 (前端需禁用)
- 绕过 Pinia stores 直接使用 localStorage

**注意**
- 所有记录类型名称必须与后端 `constants.js` 完全匹配
- 日期格式统一使用 dayjs
- 权限控制基于 `userStore.role` (Group F/S)
