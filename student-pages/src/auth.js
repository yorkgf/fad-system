import axios from 'axios'

const AUTH_KEY = 'student-pages-auth'
const EXPIRY_DAYS = 30
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export function isAuthenticated() {
  const stored = localStorage.getItem(AUTH_KEY)
  if (!stored) return false

  try {
    const { timestamp } = JSON.parse(stored)
    const elapsed = Date.now() - timestamp
    const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000
    return elapsed < expiryMs
  } catch {
    localStorage.removeItem(AUTH_KEY)
    return false
  }
}

export async function authenticate(code) {
  const res = await axios.post(`${API_BASE}/verify-student-access`, { code })
  if (res.data?.success) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ timestamp: Date.now() }))
    return true
  }
  return false
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY)
}
