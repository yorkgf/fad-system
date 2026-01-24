import request from './request'

// 登录
export function login(data) {
  return request.post('/auth/login', data)
}

// 重置密码
export function resetPassword(email) {
  return request.post('/auth/reset-password', { email })
}

// 修改密码
export function changePassword(data) {
  return request.put('/auth/change-password', data)
}

// 获取当前用户信息
export function getCurrentUser() {
  return request.get('/teachers/me')
}

// 获取当前用户可用的记录类型
export function getRecordTypes() {
  return request.get('/teachers/me/record-types')
}
