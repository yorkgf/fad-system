import request from './request'

// 获取竞赛事件列表
export function getCompetitionEvents(params) {
  return request.get('/competition/events', { params })
}

// 创建竞赛事件
export function createCompetitionEvent(data) {
  return request.post('/competition/events', data)
}

// 更新竞赛事件
export function updateCompetitionEvent(id, data) {
  return request.put(`/competition/events/${id}`, data)
}

// 删除竞赛事件
export function deleteCompetitionEvent(id) {
  return request.delete(`/competition/events/${id}`)
}
