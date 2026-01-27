# 腾讯云函数部署包

## 文件夹结构
```
deploy-package/
├── index.js              # 云函数入口（已配置 serverless-http）
├── scf_bootstrap         # Web 函数启动脚本
├── package.json          # 依赖配置
├── node_modules/         # 依赖包（约 18MB）
└── src/                 # 源代码
    ├── routes/           # API 路由
    └── utils/            # 工具函数
```

## 上传方法

### 方法 1：Web 函数（推荐）

1. 打开 [腾讯云函数控制台](https://console.cloud.tencent.com/scf)
2. 创建函数或选择现有函数
3. **函数类型**：Web 函数
4. **运行时**：Node.js 16.13.5 或更高
5. **上传方式**：选择文件夹上传
6. **选择文件夹**：`D:\Qwen Code\FAD\deploy-package`
7. **入口文件**：留空（Web 函数会自动使用 scf_bootstrap）

### 方法 2：标准运行时

1. 打开 [腾讯云函数控制台](https://console.cloud.tencent.com/scf)
2. 创建函数或选择现有函数
3. **函数类型**：事件函数
4. **运行时**：Node.js 16.13.5 或更高
5. **上传方式**：选择文件夹上传
6. **选择文件夹**：`D:\Qwen Code\FAD\deploy-package`
7. **执行方法**：`index.handler`

## 环境变量配置（必须）

在"配置"→"环境变量"中添加：

| 变量名 | 说明 | 示例 |
|---------|------|------|
| `MONGO_URI` | MongoDB 连接字符串 | `mongodb://user:pass@host:port` |
| `DB_NAME` | 数据库名称 | `GHA` |
| `JWT_SECRET` | JWT 签名密钥 | `your-secret-key` |
| `BREVO_API_KEY` | Brevo 邮件 API Key | `xkeysib-xxx` |
| `SENDER_EMAIL` | 发件人邮箱 | `noreply@school.edu` |
| `SENDER_NAME` | 发件人名称 | `FAD系统` |

## 触发器配置

- **类型**：API 网关触发器（事件函数）或无需配置（Web 函数使用默认域名）
- **请求方法**：GET, POST, PUT, DELETE
- **路径**：`/` 或 `/api/*`

## 上传提示

- **文件夹大小**：约 13 MB
- **文件数量**：约 2000 个文件
- **上传时间**：根据网络速度，可能需要 1-3 分钟
- **如果上传失败**：重试或检查网络连接

## 验证部署

部署成功后，测试 API：

```bash
# 健康检查
curl https://你的函数-url/api/health

# 测试登录（需要先在数据库创建教师账户）
curl -X POST https://你的函数-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@email.com","password":"password"}'
```

## 常见问题

### Q: 上传超时
A: 网络不稳定时可能发生，建议在稳定网络环境下重试

### Q: 提示 "Cannot find module"
A: 检查 node_modules 是否完整上传，查看部署日志

### Q: 数据库连接失败
A: 确认 MONGO_URI 格式正确，数据库可访问

### Q: 云函数日志显示错误
A: 在控制台查看"日志"→"日志查询"，定位具体错误
