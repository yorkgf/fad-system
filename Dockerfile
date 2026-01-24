# 使用 Node.js 16 官方镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制后端代码
COPY backend/package*.json ./backend/
COPY backend/src ./backend/src

# 安装依赖
WORKDIR /app/backend
RUN npm install --production

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["node", "src/index.js"]
