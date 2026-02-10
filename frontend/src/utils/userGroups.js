/**
 * 用户组枚举常量
 * 统一管理用户组，避免硬编码
 * 与后端 userGroups.js 保持一致
 */

// 用户组枚举
export const UserGroup = {
  SYSTEM: 'S',      // 系统管理员
  ADMIN_A: 'A',     // 管理员 A
  ADMIN_B: 'B',     // 管理员 B
  TEACHER: 'T',     // 教师
  FACULTY: 'F',     // 教职员工(有限权限)
  CLEANING: 'C'     // 清洁人员(无日程权限)
}

// 完整权限组 (可访问所有功能)
export const FULL_ACCESS_GROUPS = [UserGroup.SYSTEM, UserGroup.ADMIN_A, UserGroup.ADMIN_B, UserGroup.TEACHER]

// 有限权限组 (只能录入特定类型记录)
export const LIMITED_ACCESS_GROUPS = [UserGroup.FACULTY]

// 最小权限组 (清洁人员)
export const MINIMAL_ACCESS_GROUPS = [UserGroup.CLEANING]

// 日程访问权限组 (排除清洁人员)
export const SCHEDULE_ACCESS_GROUPS = [
  UserGroup.SYSTEM,
  UserGroup.ADMIN_A,
  UserGroup.ADMIN_B,
  UserGroup.TEACHER,
  UserGroup.FACULTY
]

// FAD执行权限组
export const FAD_EXECUTION_GROUPS = [
  UserGroup.SYSTEM,
  UserGroup.TEACHER,
  UserGroup.ADMIN_B,
  UserGroup.ADMIN_A
]

// 管理员权限组 (可查看统计数据、管理停课等)
export const ADMIN_GROUPS = [UserGroup.SYSTEM, UserGroup.ADMIN_A]

// 检查是否有完整访问权限
export function hasFullAccess(userGroup) {
  return FULL_ACCESS_GROUPS.includes(userGroup)
}

// 检查是否有日程访问权限
export function hasScheduleAccess(userGroup) {
  return SCHEDULE_ACCESS_GROUPS.includes(userGroup)
}

// 检查是否是管理员
export function isAdmin(userGroup) {
  return ADMIN_GROUPS.includes(userGroup)
}

// 检查是否有FAD执行权限
export function hasFADExecutionAccess(userGroup) {
  return FAD_EXECUTION_GROUPS.includes(userGroup)
}

// LocalStorage 键常量
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USERNAME: 'username',
  USER_GROUP: 'userGroup'
}
