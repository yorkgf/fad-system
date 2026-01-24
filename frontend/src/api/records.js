import request from './request'

// 插入记录（统一入口）
export function insertRecord(data) {
  return request.post('/records', data)
}

// 查询记录
export function queryRecords(params) {
  return request.get('/records', { params })
}

// 获取我的记录
export function getMyRecords(params) {
  return request.get('/records/my', { params })
}

// 检查是否可撤回
export function checkWithdrawable(collection, id) {
  return request.get(`/records/${collection}/${id}/withdrawable`)
}

// 撤回记录
export function withdrawRecord(collection, id, reason) {
  return request.post(`/records/${collection}/${id}/withdraw`, { reason })
}
