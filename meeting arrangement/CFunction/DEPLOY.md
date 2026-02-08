# 家长预约系统后端部署说明

## 文件清单

部署前请确保以下文件已准备就绪：

```
CFunction/
├── scf_index.js          # 主入口文件（必需）
├── scf_bootstrap         # SCF启动脚本（必需）
├── package.json          # 依赖配置（必需）
├── node_modules/         # 依赖包（必需）
├── .env.example          # 环境变量示例（参考）
└── DEPLOY.md            # 本部署说明
```

## 部署方式

### 方式一：腾讯云控制台手动上传（推荐）

1. **登录腾讯云控制台**
   - 访问 https://console.cloud.tencent.com/scf
   - 使用微信或腾讯云账号登录

2. **创建函数（如尚未创建）**
   - 点击【新建】
   - 选择【从头开始】
   - 函数名称：`meeting-booking-api`
   - 运行环境：Node.js 16.13
   - 提交创建

3. **上传代码**
   - 进入函数详情页
   - 点击【函数代码】标签
   - 选择【上传】→【本地上传文件夹】
   - 选择 `CFunction` 文件夹
   - 点击【保存】

4. **配置启动命令（如需要）**
   - 在【函数代码】页面
   - 确认执行方法为：`scf_index.handler`

### 方式二：Serverless Framework 部署

1. **安装 Serverless Framework**
```bash
npm install -g serverless
```

2. **配置腾讯云凭证**
```bash
# 在 CFunction 父目录（meeting arrangement）中
# 确保已有 serverless.yml 文件

# 配置密钥
export TENCENT_SECRET_ID=your_secret_id
export TENCENT_SECRET_KEY=your_secret_key
```

3. **执行部署**
```bash
cd "meeting arrangement"
serverless deploy
```

## 环境变量配置（可选）

如果 MongoDB 地址与代码中默认值不同，需要配置环境变量：

1. 在函数详情页点击【函数配置】
2. 点击【编辑】环境变量
3. 添加以下变量（按需）：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `MONGO_URI` | MongoDB连接地址 | `mongodb://192.168.1.100:27017` |
| `DB_NAME` | GHS数据库名 | `GHS` |
| `GHA_DB_NAME` | GHA数据库名 | `GHA` |
| `PORT` | 服务端口 | `9000` |

## 部署后验证

部署完成后，测试以下接口确保正常运行：

### 1. 测试基础接口
```bash
curl https://your-api-url/api/test
```

### 2. 测试学生搜索
```bash
# 搜索G10A班级的学生
# 注意：实际部署后URL会变化
curl "https://your-api-url/api/students?class=G10A&search=张"
```

### 3. 测试教师列表
```bash
curl https://your-api-url/api/teachers
```

## 常见问题

### Q1: 部署后提示 "Cannot find module"
**解决**：确保 `node_modules` 文件夹已正确上传。

### Q2: 数据库连接失败
**解决**：
1. 检查 MongoDB 地址是否正确
2. 确认云函数有访问 MongoDB 的网络权限
3. 检查环境变量配置

### Q3: 前端无法调用API
**解决**：
1. 确认云函数已启用公网访问
2. 检查 CORS 配置（代码中已配置 `Access-Control-Allow-Origin: *`）
3. 确认前端 `API_BASE_URL` 正确

## 技术支持

如有问题，请检查：
1. 腾讯云 SCF 日志（控制台 → 函数详情 → 日志）
2. 网络连通性（MongoDB 是否可访问）
3. 代码上传完整性
