# 腾讯云云函数 (SCF) 部署指南

> **注意**：API 网关触发器将于 2025 年 6 月 30 日停止服务，本指南使用**函数 URL**替代。

## 项目文件结构

```
project/
├── scf_index.js          # 云函数入口文件（重要）
├── serverless.yml        # Serverless配置文件（已配置函数URL）
├── package.json          # 依赖配置
├── index.html            # 登录页面
├── teacher_dashboard.html # 教师管理页面
├── parent_dashboard.html  # 家长预约页面
└── DEPLOY.md             # 部署文档（本文件）
```

---

## 部署方式一：使用 Serverless Framework（推荐）

### 1. 安装 Serverless Framework

```bash
npm install -g serverless
npm install -g serverless-tencent-scf
```

### 2. 配置腾讯云密钥

创建 `~/.tencentcloudecrets` 文件：

```yaml
tencent_app_id: "你的AppID"
tencent_secret_id: "你的SecretId"
tencent_secret_key: "你的SecretKey"
```

或设置环境变量：

```bash
export TENCENT_APP_ID="你的AppID"
export TENCENT_SECRET_ID="你的SecretId"
export TENCENT_SECRET_KEY="你的SecretKey"
```

### 3. 部署云函数

在项目目录执行：

```bash
serverless deploy
```

部署完成后会显示函数URL访问地址，例如：
```
https://scf-xxx.ap-guangzhou.tencentcs.com/
```

---

## 部署方式二：腾讯云控制台手动部署

### 1. 登录腾讯云控制台

访问：https://console.cloud.tencent.com/scf

### 2. 创建云函数

- **地域**：选择离你 MongoDB 最近的地域
- **函数名称**：`meeting-booking-api`
- **运行环境**：Node.js 16.13
- **内存**：256 MB
- **超时时间**：30 秒

### 3. 上传代码

将以下文件打包成 zip：
- `scf_index.js`
- `node_modules/mongodb`

上传方式：选择「本地文件夹上传」或「在线编辑」

### 4. 配置环境变量（可选）

如果需要使用其他 MongoDB 地址，可添加环境变量：

| 变量名 | 值 |
|--------|-----|
| MONGO_URL | mongodb://49.235.189.246:27017 |
| DB_NAME | GHS |

### 5. 启用函数 URL（替代API网关）

**重要步骤：**

1. 在云函数详情页，点击左侧「触发器管理」
2. 点击「创建触发器」
3. 触发器类型选择：「**函数 URL**」
4. 配置如下：
   - **认证类型**：免鉴权
   - **允许的方法**：GET、POST、PUT、DELETE、OPTIONS
5. 点击「提交」

5. 创建后会获得一个函数 URL，例如：
   ```
   https://scf-xxx-xxx.ap-guangzhou.tencentcs.com/
   ```

---

## 部署前端到 EdgeOne Pages

### 1. 修改 API 地址

部署云函数后，需要修改前端页面的 API 地址。

在每个 HTML 文件中找到这一行：
```javascript
const API_BASE_URL = 'http://localhost:3000';
```

修改为你的函数 URL 地址：
```javascript
const API_BASE_URL = 'https://scf-xxx-xxx.ap-guangzhou.tencentcs.com';
```

需要修改的文件：
- `index.html` (第182行)
- `teacher_dashboard.html` (第358行)
- `parent_dashboard.html` (第428行)

### 2. 部署到 EdgeOne Pages

1. 登录 EdgeOne 控制台
2. 创建静态网站
3. 上传以下文件：
   - `index.html`
   - `teacher_dashboard.html`
   - `parent_dashboard.html`
4. 配置域名访问

---

## 函数 URL vs API 网关

| 特性 | 函数 URL | API 网关 |
|------|----------|----------|
| 配置难度 | 简单 | 复杂 |
| 访问地址 | 单个URL | 需要配置路径 |
| 认证方式 | 免鉴权/JWT | 多种认证 |
| 路由配置 | 代码内处理 | 网关配置 |
| 状态 | ✅ 推荐 | ⚠️ 2025年下线 |

**函数 URL优势：**
- 一键启用，无需复杂配置
- 独立的访问地址
- 更低成本
- 路由逻辑在代码中管理，更灵活

---

## 本地测试

在部署前可以本地测试云函数代码：

```bash
# 安装依赖
npm install

# 本地运行（使用 Express 模拟云函数环境）
npm run local
```

访问 http://localhost:3000 进行测试。

---

## 默认教师账号

| 邮箱 | 密码 | 姓名 |
|------|------|------|
| zhangsan@school.com | 123456 | 张三 |
| lisi@school.com | 123456 | 李四 |
| wangwu@school.com | 123456 | 王五 |
| zhaoliu@school.com | 123456 | 赵六 |
| sunqi@school.com | 123456 | 孙七 |

---

## 常见问题

### Q1: 云函数连接 MongoDB 超时
**A**: 检查 MongoDB 是否开启外网访问，或配置云函数 VPC

### Q2: 函数 URL 返回 404
**A**: 检查函数 URL 的请求路径是否与前端请求路径一致，函数URL会转发所有请求到云函数

### Q3: 前端无法调用 API
**A**: 检查 API_BASE_URL 是否正确配置（不需要额外路径），查看浏览器控制台的网络请求

### Q4: CORS 跨域问题
**A**: 云函数代码已处理 CORS，如仍有问题，检查函数 URL 是否配置了 CORS

### Q5: 如何配置自定义域名？
**A**: 可以在函数 URL 配置中添加自定义域名，或在 EdgeOne 中配置域名转发

---

## 费用说明

- 云函数 SCF：有免费额度，每月免费 100 万次调用
- 函数 URL：**免费使用**
- EdgeOne Pages：静态网站托管通常免费
- MongoDB：使用你自己已有的数据库

---

## 架构说明

```
用户浏览器
    ↓
EdgeOne Pages (前端静态页面)
    ↓
函数 URL (https://scf-xxx.tencentcs.com)
    ↓
云函数 SCF (处理业务逻辑)
    ↓
MongoDB (49.235.189.246:27017)
```

---

## 技术支持

如有问题，请检查：
1. 云函数日志（控制台 -> 函数管理 -> 日志查询）
2. 浏览器控制台（F12 -> Console / Network）
