import request from './request'

// 获取可兑换Reward的寝室表扬
export function getRewardablePraise(params) {
  return request.get('/room-praise/rewardable', { params })
}

// 寝室表扬兑换Reward
export function praiseToReward(data) {
  return request.post('/room-praise/to-reward', data)
}

// 获取可清扫的寝室批评
export function getCleanableWarnings(params) {
  return request.get('/room-warning/cleanable', { params })
}

// 确认清扫
export function confirmClean(data) {
  return request.post('/room-warning/clean', data)
}

// 获取最佳寝室排名
export function getBestDorm(params) {
  return request.get('/room-praise/best-dorm', { params })
}
