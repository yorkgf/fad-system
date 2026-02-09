# 家长预约系统部署指南

## 部署架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         腾讯云部署                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EdgeOne Pages (前端)          云函数 SCF (后端)                 │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  pages/          │         │  CFunction/      │              │
│  │  ├── index.html  │◄───────►│  ├── scf_index.js│              │
│  │  ├── parent_     │  HTTPS  │  ├── scf_        │              │
│  │    dashboard.html│  API    │    bootstrap     │              │
│  │  └── logo.png    │         │  └── package.json│              │
│  └──────────────────┘         └──────────────────┘              │
│         │                              │                         │
│         └──────────HTTPS───────────────┘                         │
│                                        │                         │
│                              MongoDB (GHS 数据库)                │
└─────────────────────────────────────────────────────────────────┘
```

## 部署步骤

### 步骤 1: 部署后端（腾讯云函数 SCF）

1. **上传文件夹**
   - 将 `CFunction/` 文件夹打包为 ZIP 文件
   - 确保包含 `node_modules/` 文件夹

2. **创建云函数**
   - 登录腾讯云控制台
   - 进入"云函数 SCF"服务
   - 选择"Web函数"类型
   - 函数名称: `meeting-booking-parent`
   - 运行环境: Node.js 16.x 或更高
   - 上传 ZIP 包

3. **配置环境变量**
   ```
   MONGO_URI=mongodb://49.235.189.246:27017
   DB_NAME=GHS
   GHA_DB_NAME=GHA
   PORT=9000
   ```

4. **获取 API 网关地址**
   - 部署完成后，复制云函数的访问地址
   - 格式类似: `https://xxx-xxx.ap-shanghai.tencentscf.com`

5. **更新前端 API 地址**
   - 编辑 `pages/parent_dashboard.html`
   - 修改第 1282 行的 `API_BASE_URL`

### 步骤 2: 部署前端（EdgeOne Pages）

1. **创建站点**
   - 登录腾讯云控制台
   - 进入"EdgeOne Pages"服务
   - 创建新站点

2. **上传文件**
   - 将 `pages/` 文件夹中的所有文件上传
   - 文件列表:
     - `index.html` (5.2 KB) - 登录页面
     - `parent_dashboard.html` (71 KB) - 家长仪表盘
     - `logo.png` (55 KB) - Logo 图片

3. **配置访问**
   - 设置默认首页为 `index.html`
   - 启用 HTTPS
   - 获取站点访问地址

### 步骤 3: 测试部署

1. **访问前端**
   - 打开 EdgeOne Pages 提供的 URL
   - 应该看到登录页面

2. **测试登录**
   - 输入家长手机号
   - 点击"登录"

3. **测试功能**
   - 搜索学生
   - 选择教师
   - 查看日历（新的优化视图）
   - 预约时段

## 文件清单

### 前端部署文件 (pages/)

| 文件 | 大小 | 说明 |
|------|------|------|
| index.html | 5.2 KB | 家长登录页面 |
| parent_dashboard.html | 71 KB | 家长仪表盘（含日历优化）|
| logo.png | 55 KB | GHA Logo |

### 后端部署文件 (CFunction/)

| 文件 | 大小 | 说明 |
|------|------|------|
| scf_index.js | 14 KB | 云函数入口（Express API）|
| scf_bootstrap | 172 B | Web函数启动脚本 |
| package.json | 362 B | 依赖配置 |
| node_modules/ | ~20 MB | 依赖包 |

## API 端点列表

后端提供的所有 API 端点：

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | / | 健康检查 |
| GET | /api/test | API 测试 |
| GET | /api/classes | 获取班级列表 |
| GET | /api/students | 搜索学生 |
| GET | /api/teachers | 获取教师列表 |
| GET | /api/sessions/teacher/:name | 获取教师时段 |
| PUT | /api/sessions/book | 预约时段 |
| GET | /api/bookings/parent/:phone | 获取家长预约 |
| DELETE | /api/bookings/:sessionId | 取消预约 |

## 最新更新 (2024-02-09)

### 日历视图优化
- ✅ 过去日期显示为灰色且不可点击
- ✅ 有可选时段显示"可选 X/X"（绿色）
- ✅ 已约满显示"已约满"（红色）
- ✅ 无时段显示"无可选时段"（灰色）
- ✅ 今天日期有蓝色边框高亮

## 环境要求

- **Node.js**: 16.x 或更高
- **MongoDB**: 4.0 或更高
- **数据库**: GHS（会议预约） + GHA（学生信息）

## 故障排查

### 问题: API 请求失败
- 检查 `parent_dashboard.html` 中的 `API_BASE_URL` 是否正确
- 确认云函数已部署并运行

### 问题: 无法连接数据库
- 检查云函数环境变量配置
- 确认 MongoDB 服务器可访问

### 问题: 日历不显示
- 检查浏览器控制台错误
- 确认教师有时段数据
