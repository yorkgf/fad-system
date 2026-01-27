# EdgeOne Page 部署指南

## 项目结构

```
frontend/
├── dist/              # 构建输出目录（上传此目录）
├── public/            # 静态资源
│   └── logo.png       # Logo图片
├── src/               # 源代码
├── index.html         # HTML模板
├── vite.config.js     # Vite配置
├── package.json       # 依赖配置
├── .env.development   # 开发环境变量
└── .env.production    # 生产环境变量
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 构建生产版本

```bash
# 构建
npm run build

# 构建产物在 dist/ 目录
```

## 部署到 EdgeOne Page

### 方法一：通过 EdgeOne 控制台

1. 登录腾讯云 EdgeOne 控制台
2. 创建新的静态网站托管
3. 选择「上传文件夹」或「上传ZIP」
4. 上传 `dist/` 目录的全部内容

### 方法二：通过 CLI（推荐）

```bash
# 安装 EdgeOne CLI（如果已安装可跳过）
npm install -g @tencent-cloud/edgeone-cli

# 登录
edgeone login

# 部署
edgeone deploy --site-id YOUR_SITE_ID --dir dist
```

### 方法三：通过 GitHub 集成

1. 在 EdgeOne 控制台绑定 GitHub 仓库
2. 配置构建命令：`npm run build`
3. 配置输出目录：`dist`
4. 每次推送到主分支自动部署

## 环境变量

| 变量名 | 开发环境 | 生产环境 |
|--------|----------|----------|
| VITE_API_BASE_URL | /api (代理) | https://1300190563-l4w10rylyq.ap-shanghai.tencentscf.com |

## 路由配置

本项目使用 Vue Router 的 History 模式，EdgeOne Page 默认支持 SPA，无需额外配置。

## 性能优化

已启用：
- 代码分割（Vue、Element Plus、工具库分离）
- Terser 压缩（移除 console、debugger）
- 资源内联（<4KB 资源 base64 编码）
- Gzip/Brotli 压缩（EdgeOne 自动处理）

## 常见问题

### 1. 部署后 404 错误
确保 EdgeOne Page 的回退路由配置为 `index.html`

### 2. API 请求失败
检查 `.env.production` 中的 `VITE_API_BASE_URL` 是否正确

### 3. 白屏问题
打开浏览器控制台查看错误，可能是：
- 构建文件未完整上传
- 环境变量未正确配置
