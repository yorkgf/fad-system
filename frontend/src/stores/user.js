import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getCurrentUser, getRecordTypes } from '@/api/auth'
import { UserGroup, STORAGE_KEYS } from '@/utils/userGroups'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(STORAGE_KEYS.TOKEN) || '')
  const username = ref(localStorage.getItem(STORAGE_KEYS.USERNAME) || '')
  const userGroup = ref(localStorage.getItem(STORAGE_KEYS.USER_GROUP) || '')
  const recordTypes = ref([])

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userGroup.value === UserGroup.SYSTEM)
  const isCleaner = computed(() => userGroup.value === UserGroup.CLEANING) // C组：清洁阿姨，只能录入寝室相关记录
  const isFaculty = computed(() => userGroup.value === UserGroup.FACULTY) // F组：教师，只能录入Teaching Ticket

  async function login(email, password) {
    const res = await loginApi({ email, password })
    token.value = res.token
    username.value = res.name
    userGroup.value = res.group

    localStorage.setItem(STORAGE_KEYS.TOKEN, res.token)
    localStorage.setItem(STORAGE_KEYS.USERNAME, res.name)
    localStorage.setItem(STORAGE_KEYS.USER_GROUP, res.group)

    await fetchRecordTypes()
    return res
  }

  async function fetchUserInfo() {
    const res = await getCurrentUser()
    username.value = res.name
    userGroup.value = res.group
    localStorage.setItem(STORAGE_KEYS.USERNAME, res.name)
    localStorage.setItem(STORAGE_KEYS.USER_GROUP, res.group)
  }

  async function fetchRecordTypes() {
    const res = await getRecordTypes()
    recordTypes.value = res.data || res
  }

  function logout() {
    token.value = ''
    username.value = ''
    userGroup.value = ''
    recordTypes.value = []

    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USERNAME)
    localStorage.removeItem(STORAGE_KEYS.USER_GROUP)
  }

  return {
    token,
    username,
    userGroup,
    recordTypes,
    isLoggedIn,
    isAdmin,
    isCleaner,
    isFaculty,
    login,
    logout,
    fetchUserInfo,
    fetchRecordTypes
  }
})
