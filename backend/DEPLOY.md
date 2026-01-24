# 腾讯云函数手动部署指南

## 步骤一：准备部署文件

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 项目结构确认

确保目录结构如下：
```
backend/
├── scf_bootstrap          # 启动脚本（必需）
├── package.json
├── src/
│   ├── index.js           # 入口文件
│   ├── routes/
│   └── utils/
└── node_modules/          # 依赖包
```

## 步骤二：创建云函数

1. 登录 [腾讯云函数控制台](https://console.cloud.tencent.com/scf/list)

2. 点击 **新建**

3. 基础配置：
   - **创建方式**：从头开始
   - **函数类型**：Web函数
   - **函数名称**：`fad-backend`
   - **地域**：选择离你最近的（如广州）
   - **运行环境**：`Node.js 18.15`

4. 函数代码：
   - **提交方法**：本地上传文件夹
   - 点击"上传文件夹"，选择整个 `backend` 文件夹

5. 高级配置：
   - **执行超时时间**：30秒
   - **内存**：256MB

6. 点击 **完成**

## 步骤三：配置环境变量

1. 进入函数详情页

2. 点击 **函数管理** → **函数配置** → **编辑**

3. 找到 **环境变量**，添加以下变量：

| KEY | VALUE |
|-----|-------|
| MONGO_URI | mongodb://49.235.189.246:27017 |
| DB_NAME | GHA |
| JWT_SECRET | 自定义一个密钥（如：fad-secret-2024） |
| BREVO_API_KEY | 你的Brevo API密钥（可选） |
| SENDER_EMAIL | 发件人邮箱（可选） |
| SENDER_NAME | FAD管理系统 |

4. 点击 **保存**

## 步骤四：启用函数URL

1. 进入函数详情页

2. 点击 **触发管理**

3. 点击 **创建触发器**

4. 配置：
   - **触发方式**：函数URL
   - **认证类型**：免认证

5. 点击 **提交**

6. 创建成功后，复制生成的 **函数URL**，格式类似：
   ```
   https://fad-backend-xxxxxx-xxxxxxxxxx.gz.run.tcloudbase.com
   ```

## 步骤五：配置CORS（跨域）

1. 在触发管理页面，找到刚创建的函数URL触发器

2. 点击 **编辑**

3. 开启 **支持CORS**

4. 点击 **提交**

## 步骤六：验证部署

```bash
# 替换为你的函数URL
curl https://your-function-url/api/health

# 应返回
{"status":"ok","timestamp":"2025-01-24T..."}
```

## 步骤七：配置前端

### 开发环境

修改 `frontend/vite.config.js`：

```javascript
export default defineConfig({
  // ...
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://fad-backend-xxxxxx.gz.run.tcloudbase.com',  // 替换为你的函数URL
        changeOrigin: true
      }
    }
  }
})
```

### 生产环境

1. 创建 `frontend/.env.production`：
```
VITE_API_BASE_URL=https://fad-backend-xxxxxx.gz.run.tcloudbase.com
```

2. 修改 `frontend/src/api/request.js` 第5行：
```javascript
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})
```

## 更新代码

当需要更新代码时：

1. 进入函数详情 → **函数管理** → **函数代码**

2. 点击 **上传文件夹**，重新选择 `backend` 文件夹

3. 点击 **部署**

## 常见问题

### 1. 上传失败：文件太大

node_modules 太大时，可以：
- 方式A：先上传不含 node_modules 的代码，然后在在线编辑器终端执行 `npm install`
- 方式B：使用 zip 打包上传

### 2. 函数启动失败

检查 `scf_bootstrap` 文件：
- 确保文件存在
- 确保内容正确：
```bash
#!/bin/bash
node src/index.js
```

### 3. MongoDB 连接失败

- 确保 MongoDB 服务器防火墙允许外部访问
- 检查 MongoDB 端口 27017 是否开放
- 测试环境可临时设置 MongoDB 允许所有 IP

### 4. 接口返回 502

- 检查函数日志（函数详情 → 日志查询）
- 常见原因：代码错误、依赖缺失、环境变量未配置

### 5. CORS 错误

- 确保函数URL触发器已开启"支持CORS"
- 检查前端请求地址是否正确
