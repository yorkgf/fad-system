# 部署检查清单 - 预约冲突检测系统

## 部署前检查

### 1. 后端云函数 (CFunction 文件夹)

**必要文件：**
- ✅ scf_index.js - 主入口文件（已包含冲突检测逻辑）
- ✅ package.json - 依赖配置
- ✅ scf_bootstrap - 启动脚本
- ✅ node_modules/ - 依赖包（已安装）

**冲突检测功能已添加：**
- ✅ parseTimeToMinutes() - 时间转换函数
- ✅ isTimeOverlap() - 时间重叠判断
- ✅ checkBookingConflicts() - 综合冲突检查
- ✅ PUT /api/sessions/book - 已集成冲突检测（返回 409 状态码）

### 2. 前端静态页面 (pages 文件夹)

**必要文件：**
- ✅ index.html - 家长登录页面
- ✅ parent_dashboard.html - 家长仪表盘（已包含前端冲突检测）
- ✅ logo.png - Logo 图片

**前端冲突检测功能已添加：**
- ✅ parseTimeToMinutes() - 时间转换函数
- ✅ isTimeOverlap() - 时间重叠判断
- ✅ checkFrontendConflicts() - 前端预检查
- ✅ bookSession() - 已集成前端冲突检测

## 部署步骤

### 腾讯云函数 SCF（后端）

1. **登录腾讯云控制台** → 云函数
2. **新建函数** → Web 函数
3. **上传代码**：
   - 方式一：直接上传 `CFunction` 文件夹
   - 方式二：打包为 zip 后上传
4. **配置环境变量**：
   ```
   MONGO_URI=mongodb://...
   DB_NAME=GHS
   GHA_DB_NAME=GHA
   ```
5. **配置启动命令**：`bash scf_bootstrap`
6. **测试 API**：
   ```bash
   # 获取教师列表
   GET https://your-function-url/api/teachers

   # 测试预约（带冲突检测）
   PUT https://your-function-url/api/sessions/book
   ```

### 腾讯云 EdgeOne Pages（前端）

1. **登录 EdgeOne 控制台**
2. **创建站点** 或选择已有站点
3. **上传静态文件**：
   - 将 `pages` 文件夹中的所有文件上传
   - 或使用 git/pipeline 部署
4. **配置 API 地址**：
   - 编辑 `pages/parent_dashboard.html` 第 1227 行
   - 将 `API_BASE_URL` 改为你的云函数 URL
5. **测试访问**：
   - 访问家长登录页面
   - 测试预约冲突检测

## 冲突检测测试场景

### 测试用例

| 场景 | 操作 | 预期结果 |
|------|------|----------|
| 同教师同一天 | 预约教师A的9:00时段 → 再预约教师A的10:00时段 | 第二次被拒绝 |
| 时间冲突 | 预约教师A的9:00-10:00 → 预约教师B的9:30-10:00 | 第二次被拒绝 |
| 无冲突（边界） | 预约教师A的9:00-9:15 → 预约教师B的9:15-9:30 | 两次都成功 |
| 跨天预约 | 预约教师A今天9:00 → 预约教师A明天9:00 | 两次都成功 |

### API 测试命令

```bash
# 测试冲突检测
curl -X PUT https://your-function-url/api/sessions/book \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "...",
    "parentPhone": "13800138000",
    "studentName": "测试学生",
    "bookedBy": "测试学生的家长"
  }'

# 预期响应（有冲突）：
# HTTP 409
# {"success": false, "message": "您今天已经预约了该教师"}

# 预期响应（无冲突）：
# HTTP 200
# {"success": true, "message": "预约成功"}
```

## 更新记录

**2025-02-09**
- ✅ 添加后端冲突检测（scf_index.js）
- ✅ 添加前端冲突检测（parent_dashboard.html）
- ✅ 支持双集合冲突检查（sessions + bookings）
- ✅ 返回 HTTP 409 状态码表示冲突

## 注意事项

1. **环境变量**：确保云函数配置了正确的 MongoDB 连接字符串
2. **API 地址**：前端需要配置正确的后端 API 地址
3. **CORS 配置**：云函数已设置 CORS 允许所有来源（生产环境建议限制）
4. **历史数据**：系统会同时检查 `sessions` 和 `bookings` 两个集合的预约记录
