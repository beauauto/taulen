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
      console.log('Attempting login for:', email)
      const response = await authApi.login(email, password)
      console.log('Login response:', response)
      
      // Check if response.data exists
      if (!response.data) {
        console.error('No data in response:', response)
        return {
          success: false,
          error: 'Invalid response from server',
        }
      }
      
      const { accessToken, refreshToken, user: userData } = response.data
      
      if (!accessToken || !userData) {
        console.error('Missing accessToken or userData:', { accessToken: !!accessToken, userData: !!userData })
        return {
          success: false,
          error: 'Invalid response from server',
        }
      }
      
      console.log('Login successful, storing tokens and user data')
      
      // Store in localStorage
      authUtils.setToken(accessToken)
      authUtils.setRefreshToken(refreshToken)
      authUtils.setUser(userData)
      
      // Also store in cookies for middleware (must be set before redirect)
      cookieUtils.setCookie('token', accessToken, 7)
      cookieUtils.setCookie('refreshToken', refreshToken, 30)
      
      // Verify cookie was set
      const cookieCheck = cookieUtils.getCookie('token')
      console.log('Cookie set check:', cookieCheck ? 'Success' : 'Failed')
      
      setUser(userData)
      setIsAuthenticated(true)
      
      // Small delay to ensure cookies are set before redirect
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Redirect based on user type
      const redirectPath = userData.userType === 'employee' 
        ? '/dashboard/employee' 
        : userData.userType === 'applicant'
        ? '/dashboard/applicant'
        : '/dashboard'
      
      console.log('Redirecting to:', redirectPath)
      router.push(redirectPath)
      
      return { success: true }
    } catch (error: any) {
      console.error('Login error:', error)
      console.error('Error response:', error.response)
      
      // Extract error message from response
      let errorMessage = 'Login failed'
      
      if (error.response) {
        // Server responded with an error
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      error.response.statusText || 
                      'Login failed'
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to server. Please check your connection.'
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred'
      }
      
      return {
        success: false,
        error: errorMessage,
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

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await authApi.register({ email, password, firstName, lastName })
      const { accessToken, refreshToken, user: userData } = response.data
      
      // Store in localStorage
      authUtils.setToken(accessToken)
      authUtils.setRefreshToken(refreshToken)
      authUtils.setUser(userData)
      
      // Also store in cookies for middleware
      cookieUtils.setCookie('token', accessToken, 7)
      cookieUtils.setCookie('refreshToken', refreshToken, 30)
      
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
