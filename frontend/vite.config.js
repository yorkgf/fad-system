import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  // 部署基础路径，EdgeOne Page 通常部署在根目录
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    // 输出目录
    outDir: 'dist',
    // 生成 source map
    sourcemap: false,
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // chunk 分包策略
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
          'utils': ['axios', 'dayjs']
        }
      }
    },
    // 资源内联限制
    assetsInlineLimit: 4096
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://1300190563-l4w10rylyq.ap-shanghai.tencentscf.com',
        changeOrigin: true
      }
    }
  }
})
