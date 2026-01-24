import request from './request'

// 获取被取消上课资格的学生
export function getCancelledStudents(params) {
  return request.get('/elec-violations/cancelled', { params })
}

// 获取今日手机迟交名单
export function getTodayPhoneLate() {
  return request.get('/phone-late/today')
}

// 获取停课学生名单
export function getStopClassList(params) {
  return request.get('/stop-class/list', { params })
}

// 获取教学FAD票待累计
export function getTeachingFADTickets(params) {
  return request.get('/teaching-tickets/fad', { params })
}

// 获取教学Reward票待兑换
export function getTeachingRewardTickets(params) {
  return request.get('/teaching-tickets/reward', { params })
}

// 教学Reward票兑换
export function teachingTicketToReward(data) {
  return request.post('/teaching-tickets/reward/exchange', data)
}
