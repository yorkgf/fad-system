import request from './request'

// 获取 GHS 教师资料
export function getGHSProfile() {
  return request.get('/schedule/me/ghs-profile')
}

// 获取我的 GHS 资料
export function getMyGHSProfile() {
  return request.get('/schedule/me/ghs-profile')
}

// 更新腾讯会议信息
export function updateMeetingInfo(data) {
  return request.put('/schedule/me/meeting', data)
}

// 更新教师个人信息（年级和科目）
export function updateTeacherProfile(data) {
  return request.put('/schedule/me/profile', data)
}

// 获取可预约教师列表
export function getScheduleTeachers(params) {
  return request.get('/schedule/teachers', { params })
}

// ========== 日程时段 ==========

// 获取日程时段列表
export function getSessions(params) {
  return request.get('/schedule/sessions', { params })
}

// 创建日程时段
export function createSession(data) {
  return request.post('/schedule/sessions', data)
}

// 批量创建日程时段
export function createSessionsBatch(data) {
  return request.post('/schedule/sessions/batch', data)
}

// 更新日程时段
export function updateSession(id, data) {
  return request.put(`/schedule/sessions/${id}`, data)
}

// 删除日程时段
export function deleteSession(id) {
  return request.delete(`/schedule/sessions/${id}`)
}

// ========== 预约 ==========

// 获取预约列表
export function getBookings(params) {
  return request.get('/schedule/bookings', { params })
}

// 创建预约
export function createBooking(data) {
  return request.post('/schedule/bookings', data)
}

// 更新预约
export function updateBooking(id, data) {
  return request.put(`/schedule/bookings/${id}`, data)
}

// ========== 个人相关 ==========

// 获取我的日程（作为教师）
export function getMySessions(params) {
  return request.get('/schedule/my-sessions', { params })
}

// 获取我的预约
export function getMyBookings(params) {
  return request.get('/schedule/my-bookings', { params })
}
