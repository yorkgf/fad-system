# 腾讯云 Serverless 应用部署指南

## 前置准备

1. 安装 Serverless Framework
```bash
npm install -g serverless
```

2. 配置腾讯云凭证
```bash
serverless config credentials \
  --provider tencent \
  --key 你的腾讯云SecretId \
  --secret 你的腾讯云SecretKey
```

> 获取密钥：https://console.cloud.tencent.com/cam/capi

## 一键部署

```bash
cd backend
npm install
serverless deploy
```

部署成功后会输出 API 网关地址，类似：
```
https://service-xxxxx-xxx.gz.apigw.tencentcs.com/release/
```

## 环境变量配置

在腾讯云控制台配置环境变量，或在本地 `.env` 文件中配置：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| MONGO_URI | MongoDB连接地址 | mongodb://49.235.189.246:27017 |
| DB_NAME | 数据库名 | GHA |
| JWT_SECRET | JWT密钥 | your-secret-key-here |
| BREVO_API_KEY | Brevo邮件密钥 | (可选) |
| SENDER_EMAIL | 发件人邮箱 | (可选) |

## 常用命令

```bash
serverless deploy    # 部署
serverless info      # 查看信息
serverless logs      # 查看日志
serverless remove    # 删除服务
```

## 前端配置

部署后，修改 `frontend/vite.config.js` 中的代理地址为你的 API 网关地址。

## 常见问题

### 1. 部署失败：权限不足
确保账号有 SCF 和 API 网关的权限。

### 2. 函数超时
在 `serverless.yml` 中增加 `timeout: 60`

### 3. 需要配置环境变量
部署后在腾讯云 SCF 控制台手动添加环境变量
