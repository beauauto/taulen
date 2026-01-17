import { User } from '@/types/user'

export type { User }

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export const authUtils = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  },

  setToken: (token: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('token', token)
      // Verify it was stored
      const stored = localStorage.getItem('token')
      if (stored !== token) {
        console.error('Token storage verification failed! Expected:', token.substring(0, 20), 'Got:', stored?.substring(0, 20))
      } else {
        console.log('Token stored successfully, length:', token.length)
      }
    } catch (error) {
      console.error('Failed to store token in localStorage:', error)
    }
  },

  removeToken: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('token')
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refreshToken')
  },

  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem('refreshToken', token)
  },

  removeRefreshToken: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('refreshToken')
  },

  getUser: (): User | null => {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  },

  setUser: (user: User): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem('user', JSON.stringify(user))
  },

  removeUser: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('user')
  },

  clearAuth: (): void => {
    authUtils.removeToken()
    authUtils.removeRefreshToken()
    authUtils.removeUser()
  },

  isAuthenticated: (): boolean => {
    return authUtils.getToken() !== null
  },
}
