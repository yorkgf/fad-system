@echo off
chcp 65001 >nul
setlocal

echo.
echo ==================================================
echo   家长预约系统 - 部署文件检查
echo ==================================================
echo.

echo → 检查前端文件 (pages 文件夹)
echo ─────────────────────────────────────────
if exist "pages\index.html" (
    echo [√] 家长登录页面
) else (
    echo [×] 家长登录页面 [缺失]
)

if exist "pages\parent_dashboard.html" (
    echo [√] 家长预约仪表盘
) else (
    echo [×] 家长预约仪表盘 [缺失]
)

if exist "pages\logo.png" (
    echo [√] Logo 图片
) else (
    echo [×] Logo 图片 [缺失]
)

echo.
echo → 检查后端文件 (CFunction 文件夹)
echo ─────────────────────────────────────────
if exist "CFunction\scf_index.js" (
    echo [√] 云函数入口文件
) else (
    echo [×] 云函数入口文件 [缺失]
)

if exist "CFunction\package.json" (
    echo [√] 依赖配置文件
) else (
    echo [×] 依赖配置文件 [缺失]
)

if exist "CFunction\scf_bootstrap" (
    echo [√] 启动脚本
) else (
    echo [×] 启动脚本 [缺失]
)

if exist "CFunction\node_modules" (
    echo [√] 依赖包目录
) else (
    echo [×] 依赖包目录 [缺失] - 请在 CFunction 目录运行 npm install
)

echo.
echo → 部署就绪状态
echo ─────────────────────────────────────────
if exist "pages\index.html" if exist "pages\parent_dashboard.html" if exist "pages\logo.png" if exist "CFunction\scf_index.js" if exist "CFunction\package.json" if exist "CFunction\scf_bootstrap" if exist "CFunction\node_modules" (
    echo [√] 前端文件: 已准备好部署到 EdgeOne Pages
    echo [√] 后端文件: 已准备好部署到云函数 SCF
    echo.
    echo → 所有文件就绪，可以开始部署！
    echo.
) else (
    echo [×] 部署文件不完整，请检查上述缺失文件
    echo.
)

pause
