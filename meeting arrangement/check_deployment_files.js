#!/usr/bin/env node
/**
 * 部署文件检查脚本
 * 用于验证 pages 和 CFunction 文件夹是否完整
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    log(colors.green, '✓', `${description} (${size} KB)`);
    return true;
  } else {
    log(colors.red, '✗', `${description} [缺失]`);
    return false;
  }
}

function checkDir(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    const files = fs.readdirSync(dirPath);
    log(colors.green, '✓', `${description} (${files.length} 个文件)`);
    return true;
  } else {
    log(colors.red, '✗', `${description} [不存在]`);
    return false;
  }
}

console.log('\n' + colors.blue + '='.repeat(50));
console.log('  家长预约系统 - 部署文件检查');
console.log('='.repeat(50) + colors.reset + '\n');

// 检查 pages 文件夹（前端）
log(colors.blue, '→', '检查前端文件 (pages 文件夹)');
console.log(colors.yellow + '─'.repeat(40) + colors.reset);

let pagesOk = true;
pagesOk &= checkFile('pages/index.html', '家长登录页面');
pagesOk &= checkFile('pages/parent_dashboard.html', '家长预约仪表盘');
pagesOk &= checkFile('pages/logo.png', 'Logo 图片');

console.log();

// 检查 CFunction 文件夹（后端）
log(colors.blue, '→', '检查后端文件 (CFunction 文件夹)');
console.log(colors.yellow + '─'.repeat(40) + colors.reset);

let backendOk = true;
backendOk &= checkFile('CFunction/scf_index.js', '云函数入口文件');
backendOk &= checkFile('CFunction/package.json', '依赖配置文件');
backendOk &= checkFile('CFunction/scf_bootstrap', '启动脚本');
backendOk &= checkDir('CFunction/node_modules', '依赖包目录');

console.log();

// 部署就绪检查
log(colors.blue, '→', '部署就绪状态');
console.log(colors.yellow + '─'.repeat(40) + colors.reset);

if (pagesOk && backendOk) {
  log(colors.green, '✓', '前端文件: 已准备好部署到 EdgeOne Pages');
  log(colors.green, '✓', '后端文件: 已准备好部署到云函数 SCF');
  console.log('\n' + colors.green + '→ 所有文件就绪，可以开始部署！' + colors.reset + '\n');
  process.exit(0);
} else {
  if (!pagesOk) {
    log(colors.red, '✗', '前端文件不完整，请检查 pages 文件夹');
  }
  if (!backendOk) {
    log(colors.red, '✗', '后端文件不完整，请检查 CFunction 文件夹');
    log(colors.yellow, '提示: 在 CFunction 目录运行 npm install 安装依赖');
  }
  console.log('\n' + colors.red + '→ 文件不完整，请补充缺失文件后再部署' + colors.reset + '\n');
  process.exit(1);
}
