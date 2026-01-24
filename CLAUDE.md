# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FAD (Faculty/Academic Discipline) 学生纪律与奖励管理系统，从 Appsmith 重构为 Vue 3 + Express 独立应用。

## 项目结构

```
FAD/
├── frontend/                 # 前端 (Vue 3 + Vite + Element Plus)
│   ├── src/
│   │   ├── api/             # API请求封装（按模块划分）
│   │   ├── layouts/         # 布局组件
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # Pinia状态管理
│   │   └── views/           # 页面组件（按功能模块组织）
│   └── vite.config.js       # Vite配置（含代理到云函数）
├── backend/                  # 后端 (Express + MongoDB)
│   ├── src/
│   │   ├── routes/          # API路由（按业务模块划分）
│   │   └── utils/           # 工具函数（数据库、认证、邮件、常量）
│   ├── serverless.yml       # 腾讯云函数部署配置
│   └── .env.example         # 环境变量示例
├── tencent-gha-fad-record/  # 原Appsmith Git-sync导出（参考用）
├── ANALYSIS.md              # 详细业务逻辑分析
└── README.md                # 项目说明
```

## 技术栈

| 层级 | 技术 |
|-----|------|
| 前端 | Vue 3 + Vite + Element Plus + Pinia + Vue Router |
| 后端 | Express + MongoDB Driver (原生) + serverless-http |
| 部署 | 腾讯云函数 SCF + 函数URL (无API网关) |
| 数据库 | MongoDB (腾讯云MongoDB) |
| 邮件 | Brevo API |

## 开发命令

### 前端
```bash
cd frontend
npm install
npm run dev      # 开发服务器 http://localhost:3000
npm run build    # 构建生产版本（输出到 dist/）
```

### 后端
```bash
cd backend
npm install
npm run dev      # 开发服务器 http://localhost:8080
npm run deploy   # 部署到腾讯云函数
npm run logs     # 查看云函数日志
npm run remove   # 移除云函数部署
```

## 架构设计

### 后端架构
- **单一入口**: `src/index.js` 通过 `serverless-http` 同时支持本地Express和云函数环境
- **云函数检测**: 通过 `process.env.SCF_ENVIRONMENT` 区分运行环境
- **路由组织**: 按业务模块划分路由文件（auth.js, records.js, fad.js, reward.js, room.js, other.js）
- **常量管理**: `src/utils/constants.js` 定义记录类型映射、累计规则、FAD来源类型等核心常量

### 前端架构
- **模块化API**: `src/api/` 下按业务模块划分API文件（auth.js, records.js, fad.js等）
- **状态管理**: Pinia stores分为 `user.js`（用户认证状态）和 `common.js`（共享数据）
- **路由守卫**: 在 `router/index.js` 中统一处理认证检查
- **代理配置**: Vite开发时代理 `/api` 到云函数地址

### 核心常量定义
位于 `backend/src/utils/constants.js`:

```javascript
// FAD来源类型
FAD_SOURCE_TYPE = { DORM: 'dorm', TEACH: 'teach', OTHER: 'other' }

// 累计规则 - 定义各记录类型的累计触发条件
ACCUMULATE_RULES = {
  '早点名迟到': { count: 2, result: 'FAD', sourceType: 'other' },
  '寝室迟出': { count: 2, result: 'FAD', sourceType: 'dorm' },
  // ...
}

// 记录类型到集合名的映射
RECORD_TYPE_TO_COLLECTION = {
  'FAD': 'FAD_Records',
  'Reward': 'Reward_Records',
  '早点名迟到': 'Late_Records',
  // ...
}
```

## 核心业务逻辑

### 记录插入流程
所有记录通过 `POST /api/records` 统一插入，根据 `recordType` 路由到不同集合：
1. 直接FAD/Reward: 直接插入，Reward触发自动冲销逻辑
2. 违规类(上网课/手机): 同时产生FAD记录
3. 累计类: 检查是否达到累计阈值，自动生成FAD或寝室批评

### 记录类型与累计规则
- 早点名迟到/寝室迟出/未按规定返校：2次 → 1个FAD
- 寝室批评：5次 → 1个FAD
- 寝室垃圾未倒：2次 → 1个寝室批评（可能链式触发FAD）
- Teaching FAD Ticket：3次 → 1个FAD
- Reward：2个冲执行，3个冲记录

### FAD来源类型
- `dorm`：寝室类（寝室迟出、寝室批评、22:00后交手机、未按规定返校）
- `teach`：教学类（Teaching FAD Ticket、上网课违规）
- `other`：其他（早点名迟到、擅自进入会议室、手动录入FAD）

### 撤回权限
- 普通教师：只能撤回自己的记录
- 管理员(Group=S)：可撤回任何人的记录
- 条件：FAD/Reward未发放纸质通知单（检查 `是否已发放` 字段）

### 撤回链式处理
撤回记录时需要处理关联的累计记录：
- 基础记录撤回 → 累计产生的FAD撤回
- 寝室垃圾未倒撤回 → 寝室批评撤回 → FAD撤回（三连）
- Reward撤回 → 恢复已冲销的FAD状态

## 数据库

- **连接地址**: `mongodb://49.235.189.246:27017`
- **数据库名**: `GHA`
- **主要集合**: FAD_Records, Reward_Records, Teachers, Students, All_Classes 等18个
- **连接管理**: `src/utils/db.js` 使用MongoClient单例模式

## API路由

| 路径 | 功能 | 文件 |
|-----|------|------|
| /api/auth/login | 登录认证 | routes/auth.js |
| /api/records | 记录CRUD、撤回检查、撤回操作 | routes/records.js |
| /api/fad-records | FAD执行、发放、统计 | routes/fad.js |
| /api/reward-records | Reward管理 | routes/reward.js |
| /api/room-praise | 寝室表扬兑奖 | routes/room.js |
| /api/room-warning | 寝室清扫 | routes/room.js |

## 部署

### 腾讯云函数配置
- **配置文件**: `backend/serverless.yml`
- **区域**: ap-guangzhou
- **运行时**: Nodejs18.15
- **启用函数URL**: 替代API网关，CORS已配置
- **环境变量**: 通过 `${env:VAR_NAME}` 引用本地环境变量

### 部署前准备
1. 复制 `.env.example` 为 `.env`
2. 配置 `JWT_SECRET`, `BREVO_API_KEY`, `SENDER_EMAIL`
3. 运行 `npm run deploy`

## 注意事项

1. 前端需要在 `frontend/public/` 放置 `logo.png` 学校Logo
2. 后端需要复制 `.env.example` 为 `.env` 并配置环境变量
3. 云函数使用函数URL（非API网关），前端代理配置需指向函数URL地址
4. 详细业务逻辑参见 `ANALYSIS.md`
