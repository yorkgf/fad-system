const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 创建输出目录
const outputDir = path.join(__dirname, 'deploy');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 创建 zip 文件
const output = fs.createWriteStream(path.join(outputDir, 'scf-deploy.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    console.log('✓ 部署包已创建: deploy/scf-deploy.zip');
    console.log(`  文件大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
    console.log('\n请将此文件上传到腾讯云云函数控制台');
});

archive.on('error', (err) => {
    throw err;
});

archive.pipe(output);

// 添加云函数入口文件
archive.file('scf_index.js', { name: 'scf_index.js' });

// 添加 package.json
archive.file('package.json', { name: 'package.json' });

// 添加 node_modules/mongodb（只添加必要的文件）
const mongodbPath = path.join(__dirname, 'node_modules', 'mongodb');

function addDirectory(dir, baseName) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // 递归添加子目录
            addDirectory(filePath, baseName + '/' + file);
        } else if (stat.isFile()) {
            // 添加文件
            archive.file(filePath, { name: 'node_modules/mongodb/' + baseName + '/' + file });
        }
    });
}

if (fs.existsSync(mongodbPath)) {
    addDirectory(mongodbPath, '.');
    console.log('正在打包 mongodb 模块...');
} else {
    console.log('警告: node_modules/mongodb 不存在，请先运行 npm install');
}

archive.finalize();
