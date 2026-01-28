import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getCurrentUser, getRecordTypes } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')
  const userGroup = ref(localStorage.getItem('userGroup') || '')
  const recordTypes = ref([])

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userGroup.value === 'S')
  const isCleaner = computed(() => userGroup.value === 'C') // C组：清洁阿姨，只能录入寝室相关记录
  const isFaculty = computed(() => userGroup.value === 'F') // F组：教师，只能录入Teaching Ticket

  async function login(email, password) {
    const res = await loginApi({ email, password })
    token.value = res.token
    username.value = res.name
    userGroup.value = res.group

    localStorage.setItem('token', res.token)
    localStorage.setItem('username', res.name)
    localStorage.setItem('userGroup', res.group)

    await fetchRecordTypes()
    return res
  }

  async function fetchUserInfo() {
    const res = await getCurrentUser()
    username.value = res.name
    userGroup.value = res.group
    localStorage.setItem('username', res.name)
    localStorage.setItem('userGroup', res.group)
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

    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userGroup')
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
