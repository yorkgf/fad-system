import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN.json'
import enUS from './en.json'

const LOCALE_KEY = 'competition-calendar-locale'

export const currentLocale = localStorage.getItem(LOCALE_KEY) || 'zh-CN'

export const i18n = createI18n({
  legacy: false,
  locale: currentLocale,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en': enUS
  }
})
