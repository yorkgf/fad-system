import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import 'element-plus/dist/index.css'
import { i18n, currentLocale } from './i18n/index.js'
import router from './router.js'
import App from './App.vue'

const app = createApp(App)

app.use(i18n)
app.use(router)
app.use(ElementPlus, {
  locale: currentLocale === 'en' ? en : zhCn
})

app.mount('#app')
