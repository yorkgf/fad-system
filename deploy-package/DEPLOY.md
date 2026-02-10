# FAD 后端部署指南

## 部署前准备

### 必需的环境变量配置

在腾讯云 SCF 控制台配置以下环境变量：

| 变量名 | 说明 | 示例值 | 是否必需 |
|--------|------|--------|----------|
| `MONGO_URI` | MongoDB 连接字符串 | `mongodb://...` | **必需** |
| `DB_NAME` | GHA 数据库名 | `GHA` | 可选 |
| `GHS_MONGO_URI` | GHS 数据库连接 | 同 MONGO_URI | 可选 |
| `GHS_DB_NAME` | GHS 数据库名 | `GHS` | 可选 |
| `JWT_SECRET` | 新 JWT 密钥 | 见下方生成 | **必需** |
| `JWT_SECRET_OLD` | 旧 JWT 密钥（兼容期） | `fad-secret-key-2024-production` | 可选 |
| `NODE_ENV` | 运行环境 | `production` | 推荐 |

> **注意**: CORS 已配置为允许所有域名访问，无需配置 `ALLOWED_ORIGINS`

### 生成新的 JWT 密钥

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

将生成的密钥设置为 `JWT_SECRET` 环境变量的值。

## 部署步骤

### 方式一：通过腾讯云 SCF 控制台上传

1. 登录腾讯云控制台
2. 进入「云函数」服务
3. 找到 FAD 后端函数
4. 删除旧的函数代码
5. 上传 `deploy-package` 文件夹（zip 格式）
6. 配置环境变量（见上表）
7. 保存并部署

### 方式二：使用 VS Code 插件

1. 安装「Tencent Cloud Serverless」插件
2. 右键 `deploy-package` 文件夹
3. 选择「Upload to SCF」
4. 选择地域和函数
5. 等待上传完成

### 方式三：使用 Serverless Framework（需要配置）

```bash
cd backend
npm run deploy
```

## 部署后验证

### 1. 检查函数日志

在 SCF 控制台查看函数日志，应该看到：
```
MongoDB connected: GHA and GHS
服务器运行在端口 9000
```

### 2. 测试 API

```bash
# 测试健康检查
curl https://your-scf-url/api/health

# 应返回：
# {"status":"ok","timestamp":"..."}
```

### 3. 测试登录

使用前端登录功能测试，确认：
- 登录成功
- Token 有效
- API 调用正常

## 本次更新内容

### 安全修复
1. **移除硬编码凭据** - 所有敏感信息通过环境变量配置
2. **CORS 允许所有域名** - 无需配置白名单
3. **安全响应头** - Helmet 安全头
4. **双 JWT 密钥** - 支持平滑迁移
5. **自动密码迁移** - 明文密码登录时自动升级为 bcrypt
6. **安全密码生成** - 重置密码使用加密随机数

### 功能更新
1. **登录返回密码迁移提示** - `requiresPasswordChange` 字段
2. **强制密码修改标记** - `forcePasswordChange` 字段

## 环境变量配置示例

在 SCF 控制台的「函数配置」->「环境变量」中添加：

```
MONGO_URI=mongodb://username:password@host:port
DB_NAME=GHA
GHS_MONGO_URI=mongodb://username:password@host:port
GHS_DB_NAME=GHS
JWT_SECRET=a3f8e9c2b7d4f1e8a5c2b9d4f1e8a5c2b9d4f1e8
JWT_SECRET_OLD=fad-secret-key-2024-production
NODE_ENV=production
```

## 回滚方案

如果部署后出现问题：

1. 在 SCF 控制台恢复旧版本代码
2. 或者重新上传之前的 deploy-package 备份
3. 检查环境变量是否配置正确

## 注意事项

1. **首次部署必须配置 `MONGO_URI` 和 `JWT_SECRET`**，否则函数将无法启动
2. **建议先在测试环境验证**，确认无问题后再部署到生产环境
3. **密钥迁移期**：保留 `JWT_SECRET_OLD` 7 天后可移除
4. **CORS 已开放**：所有域名均可访问 API

## 文件大小

部署包大小约：15-20 MB（包含 node_modules）
