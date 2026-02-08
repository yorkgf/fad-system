// API配置文件
// 部署到云函数后，请修改API_BASE_URL为你的API网关地址

const CONFIG = {
    // 本地开发时使用：http://localhost:3000
    // 部署到云函数后使用：https://your-api-gateway-url
    API_BASE_URL: 'http://localhost:3000'
};

// 获取完整的API URL
function getApiUrl(path) {
    return CONFIG.API_BASE_URL + path;
}
