import request from './request'

// 获取FAD记录列表
export function getFADRecords(params) {
  return request.get('/fad-records', { params })
}

// 获取未执行的FAD
export function getUnexecutedFAD(params) {
  return request.get('/fad-records/unexecuted', { params })
}

// 获取未发放的FAD
export function getUndeliveredFAD(params) {
  return request.get('/fad-records/undelivered', { params })
}

// FAD统计
export function getFADStats(params) {
  return request.get('/fad-records/stats', { params })
}

// 执行FAD
export function executeFAD(id) {
  return request.put(`/fad-records/${id}/execute`)
}

// 发放FAD通知单
export function deliverFAD(id, deliverTeacher) {
  return request.put(`/fad-records/${id}/deliver`, { deliverTeacher })
}

// 学生会FAD记录
export function getStudentUnionFAD(params) {
  return request.get('/fad-records/student-union', { params })
}
