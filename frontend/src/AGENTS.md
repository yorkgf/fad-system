# Frontend Source

**Generated:** 2026-01-26T22:53:17+08:00

## OVERVIEW
Vue 3 + Element Plus + Pinia - admin panel for FAD/Reward/record management.

## STRUCTURE
```
src/
├── api/                  # Axios wrappers (auto-auth)
│   ├── request.js        # Base instance + JWT interceptor
│   ├── records.js        # 记录CRUD/撤回
│   ├── fad.js            # FAD执行/发放/统计
│   ├── reward.js         # Reward发放
│   ├── room.js           # 寝室表扬/批评
│   ├── students.js       # 学生/班级查询
│   ├── auth.js           # 登录/改密
│   └── other.js          # 违规/停课/教学票/手机
├── stores/
│   ├── user.js           # Auth token + role persistence
│   └── common.js         # allRecordTypes constant, classes
├── router/
│   └── index.js          # Auth guard ( redirectTo: '/login' )
├── views/               # 16 Vue components - see views/AGENTS.md
└── layouts/
    └── MainLayout.vue    # 侧边栏导航
```

## WHERE TO LOOK
| Task | Location |
|------|----------|
| All Vue components | views/AGENTS.md |
| 14种记录类型定义 | stores/common.js allRecordTypes |
| API认证注入 | api/request.js axios.interceptors |

## CONVENTIONS

**API调用**
- 所有 /api/* 请求自动携带 Bearer token (request.js)
- 4xx响应时 token刷新或登出 (router auth guard)

**记录类型分组**
- group='F' (Faculty): 普通教师可录入
- group='S' (System): 仅管理员可见/录入

**Vue模式**
- Composition API setup()
- Pinia stores 直接导入使用
- Element Plus 表格/表单组件

## ANTI-PATTERNS

**禁止**
- 直接绕过 axios request.js (跳过auth)
- 手动修改 allRecordTypes (需同步后端constants.js)
- FAD发放表单后可修改 (前端禁用)
