import { createI18n } from 'vue-i18n'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'

import zhCN from './locales/zh-CN.json'
import enUS from './locales/en.json'

const LOCALE_KEY = 'fad-locale'

function getStoredLocale() {
  return localStorage.getItem(LOCALE_KEY) || 'zh-CN'
}

export const i18n = createI18n({
  legacy: false,
  locale: getStoredLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en': enUS
  }
})

export const elementLocales = {
  'zh-CN': zhCn,
  'en': en
}

export function setLocale(locale) {
  i18n.global.locale.value = locale
  localStorage.setItem(LOCALE_KEY, locale)
  document.querySelector('html').setAttribute('lang', locale === 'zh-CN' ? 'zh' : 'en')
}

export function getLocale() {
  return i18n.global.locale.value
}

export function getElementLocale() {
  return elementLocales[getLocale()]
}
