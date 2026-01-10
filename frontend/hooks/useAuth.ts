'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authUtils } from '@/lib/auth'
import { cookieUtils } from '@/lib/cookies'
import { authApi } from '@/lib/api'
import { User } from '@/types/user'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const storedUser = authUtils.getUser()
    const token = authUtils.getToken() || cookieUtils.getCookie('token')
    
    if (storedUser && token) {
      setUser(storedUser)
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
      const { access_token, refresh_token, user: userData } = response.data
      
      // Store in localStorage
      authUtils.setToken(access_token)
      authUtils.setRefreshToken(refresh_token)
      authUtils.setUser(userData)
      
      // Also store in cookies for middleware
      cookieUtils.setCookie('token', access_token, 7)
      cookieUtils.setCookie('refreshToken', refresh_token, 30)
      
      setUser(userData)
      setIsAuthenticated(true)
      
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || 'Login failed',
      }
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      authUtils.clearAuth()
      cookieUtils.deleteCookie('token')
      cookieUtils.deleteCookie('refreshToken')
      setUser(null)
      setIsAuthenticated(false)
      router.push('/login')
    }
  }

  const register = async (email: string, password: string, first_name: string, last_name: string) => {
    try {
      const response = await authApi.register({ email, password, first_name, last_name })
      const { access_token, refresh_token, user: userData } = response.data
      
      // Store in localStorage
      authUtils.setToken(access_token)
      authUtils.setRefreshToken(refresh_token)
      authUtils.setUser(userData)
      
      // Also store in cookies for middleware
      cookieUtils.setCookie('token', access_token, 7)
      cookieUtils.setCookie('refreshToken', refresh_token, 30)
      
      setUser(userData)
      setIsAuthenticated(true)
      
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || 'Registration failed',
      }
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
  }
}
