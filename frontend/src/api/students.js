import request from './request'

// 获取学生列表
export function getStudents(params) {
  return request.get('/students', { params })
}

// 获取学生详情
export function getStudent(id) {
  return request.get(`/students/${id}`)
}

// 获取班级列表
export function getClasses() {
  return request.get('/classes')
}

// 获取班主任邮箱
export function getHomeTeacher(className) {
  return request.get(`/classes/${encodeURIComponent(className)}/home-teacher`)
}

// 获取当前用户作为班主任的班级信息
export function getMyClassAsHomeTeacher() {
  return request.get('/classes/my-home-class')
}
