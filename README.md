# FAD 学生管理系统

学生纪律与奖励管理系统，用于记录学生行为、自动累计违规/表扬、生成FAD通知单等。

## 项目结构

```
FAD/
├── frontend/                 # 前端项目 (Vue 3 + Element Plus)
│   ├── src/
│   │   ├── api/             # API请求封装
│   │   ├── layouts/         # 布局组件
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # Pinia状态管理
│   │   └── views/           # 页面组件
│   ├── public/
│   │   └── logo.png         # 学校Logo（需自行放置）
│   └── package.json
│
├── backend/                  # 后端项目 (Express + MongoDB)
│   ├── src/
│   │   ├── routes/          # API路由
│   │   └── utils/           # 工具函数
│   ├── .env.example         # 环境变量示例
│   └── package.json
│
├── ANALYSIS.md              # 详细分析文档
└── README.md
```

## 快速开始

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000

### 后端

```bash
cd backend
cp .env.example .env
# 编辑 .env 配置数据库和邮件服务
npm install
npm run dev
```

API 运行在 http://localhost:8080

## 功能模块

| 模块 | 说明 |
|-----|------|
| 记录管理 | 录入各类记录、查看/撤回记录 |
| FAD管理 | FAD执行、通知单发放、统计分析 |
| Reward管理 | Reward发放、冲销FAD |
| 寝室管理 | 寝室表扬兑奖、寝室清扫确认 |
| 其他 | 电子产品违规、手机迟交、停课名单、教学票兑奖 |

## 记录类型与累计规则

| 记录类型 | 累计规则 |
|---------|---------|
| FAD | 直接记录 |
| Reward | 2个冲执行，3个冲记录 |
| 早点名迟到 | 2次 → 1个FAD |
| 寝室迟出 | 2次 → 1个FAD |
| 未按规定返校 | 2次 → 1个FAD |
| 寝室批评 | 5次 → 1个FAD |
| 寝室垃圾未倒 | 2次 → 1个寝室批评 |
| Teaching FAD Ticket | 3次 → 1个FAD |
| 寝室表扬 | 10次 → 可兑Reward |
| Teaching Reward Ticket | 6次 → 可兑Reward |

## FAD来源类型

| 类型 | 值 | 触发来源 |
|-----|---|---------|
| 寝室类 | dorm | 寝室迟出、寝室批评、22:00后交手机、未按规定返校 |
| 教学类 | teach | Teaching FAD Ticket、上网课违规 |
| 其他 | other | 早点名迟到、擅自进入会议室、手动录入 |

## 撤回功能

- 普通教师：只能撤回自己发出的记录
- 管理员(Group=S)：可撤回任何人的记录
- 限制条件：FAD/Reward未发放纸质通知单

## 环境变量

| 变量 | 说明 |
|-----|------|
| MONGO_URI | MongoDB连接地址 |
| DB_NAME | 数据库名称 |
| JWT_SECRET | JWT密钥 |
| BREVO_API_KEY | Brevo邮件API密钥 |
| SENDER_EMAIL | 发件人邮箱 |

## 部署

### 前端部署到EdgeOne Pages

```bash
cd frontend
npm run build
# 将 dist 目录部署到 EdgeOne Pages
```

### 后端部署到腾讯云函数

```bash
cd backend
npm run deploy
```

## License

MIT
