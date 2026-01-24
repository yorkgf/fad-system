import request from './request'

// 获取Reward记录
export function getRewardRecords(params) {
  return request.get('/reward-records', { params })
}

// 插入Reward
export function insertReward(data) {
  return request.post('/reward-records', data)
}

// 获取未发放的Reward
export function getUndeliveredReward(params) {
  return request.get('/reward-records/undelivered', { params })
}

// 发放Reward通知单
export function deliverReward(id, deliverTeacher) {
  return request.put(`/reward-records/${id}/deliver`, { deliverTeacher })
}
