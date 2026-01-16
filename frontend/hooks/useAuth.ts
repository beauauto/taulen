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

  const sendLoginVerificationCode = async (email: string) => {
    try {
      await authApi.sendLoginVerificationCode(email)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || 'Failed to send verification code',
      }
    }
  }

  const login = async (email: string, password: string, verificationCode?: string) => {
    try {
      console.log('Attempting login for:', email)
      const response = await authApi.login(email, password, verificationCode)
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
      
      // Redirect based on user type and role
      // Sign up only creates borrowers, so registration always goes to applicant dashboard
      // Sign in bifurcates: borrowers → borrower form page, employees → role-based dashboard
      let redirectPath = '/dashboard'
      
      if (userData.userType === 'applicant') {
        // Borrowers should be redirected to their most recent application where they left off
        try {
          const { urlaApi } = await import('@/lib/api')
          console.log('Fetching applications for borrower...')
          console.log('User ID from token:', userData.id)
          console.log('Token available:', !!authUtils.getToken())
          
          // Ensure token is available in localStorage before making API call
          const token = authUtils.getToken()
          if (!token) {
            console.error('Token not available after login, cannot fetch applications')
            redirectPath = '/applications'
            throw new Error('Token not available')
          }
          
          // Small delay to ensure token is available in localStorage
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Verify token is still available
          const tokenCheck = authUtils.getToken()
          console.log('Token check before API call:', !!tokenCheck)
          
          const appsResponse = await urlaApi.getMyApplications()
          console.log('Full applications response:', JSON.stringify(appsResponse, null, 2))
          console.log('Response status:', appsResponse.status)
          console.log('Response data:', appsResponse.data)
          console.log('Response data type:', typeof appsResponse.data)
          
          // Handle different response formats
          let applications: any[] = []
          if (appsResponse && appsResponse.data) {
            if (Array.isArray(appsResponse.data)) {
              applications = appsResponse.data
              console.log('Response data is array, length:', applications.length)
            } else if (appsResponse.data.applications) {
              applications = appsResponse.data.applications
              console.log('Response data has applications property, length:', applications.length)
            } else if (typeof appsResponse.data === 'object') {
              // Try to extract applications from any object structure
              console.warn('Unexpected response format, attempting to extract applications:', appsResponse.data)
              // Check if it's a single application object
              if (appsResponse.data.id) {
                applications = [appsResponse.data]
                console.log('Found single application object')
              }
            } else {
              console.warn('Unexpected response format:', appsResponse.data)
            }
          } else {
            console.warn('No data in response, full response:', appsResponse)
          }
          
          console.log('Applications found:', applications.length)
          console.log('Applications:', applications)
          
          if (applications.length > 0) {
            // Sort by lastUpdatedDate (most recent first) and get the first one
            applications.sort((a: any, b: any) => {
              const dateA = new Date(a.lastUpdatedDate || a.createdDate || 0).getTime()
              const dateB = new Date(b.lastUpdatedDate || b.createdDate || 0).getTime()
              return dateB - dateA
            })
            const mostRecentApp = applications[0]
            console.log('Most recent application ID:', mostRecentApp.id)
            console.log('Most recent application:', mostRecentApp)
            
            // Get application progress to determine where they left off
            try {
              const progressResponse = await urlaApi.getApplicationProgress(mostRecentApp.id)
              const progress = progressResponse.data
              
              // Determine redirect path based on progress
              // If progress is very low (0-5%), they likely haven't completed borrower info
              // Otherwise, redirect to main application form which will show the next incomplete section
              const progressPercentage = progress.progressPercentage || 0
              const nextIncompleteSection = progress.nextIncompleteSection
              
              console.log('Application progress:', { progressPercentage, nextIncompleteSection })
              
              // Always redirect to the application page - it will handle showing the correct section
              redirectPath = `/applications/${mostRecentApp.id}`
              console.log('Redirecting to application:', redirectPath)
            } catch (progressError) {
              console.error('Failed to get progress, redirecting to application:', progressError)
              // Fallback to main application page
              redirectPath = `/applications/${mostRecentApp.id}`
              console.log('Redirecting to application (fallback):', redirectPath)
            }
          } else {
            // No applications yet - redirect to applications page
            // The applications page will show the option to start a new application
            // This prevents accidentally creating a new application on login
            console.log('No applications found, redirecting to applications page')
            redirectPath = '/applications'
          }
        } catch (error: any) {
          console.error('Failed to fetch applications:', error)
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config,
          })
          
          // If API call fails, redirect to applications page
          // The applications page will attempt to fetch applications and handle the case appropriately
          // This is better than redirecting to /getting-started which would start a new application
          console.log('Redirecting to applications page to load applications')
          redirectPath = '/applications'
        }
      } else if (userData.userType === 'employee') {
        // Employees are routed based on their role
        // Backend uses PascalCase: LoanOfficer, Underwriter, Processor, Admin
        const role = userData.role?.toLowerCase() || ''
        
        // Normalize role to lowercase for comparison (handles both PascalCase and snake_case)
        if (role === 'underwriter') {
          redirectPath = '/dashboard/underwriter'
        } else if (role === 'loanofficer' || role === 'loan_officer') {
          // Loan officers (brokers) use the employee dashboard
          redirectPath = '/dashboard/employee'
        } else if (role === 'processor') {
          redirectPath = '/dashboard/processor'
        } else if (role === 'admin') {
          redirectPath = '/dashboard/admin'
        } else {
          // Default employee dashboard for any other role (including LoanOfficer)
          redirectPath = '/dashboard/employee'
        }
      }
      
      console.log('Redirecting to:', redirectPath, 'for user type:', userData.userType, 'role:', userData.role)
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

  const register = async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    try {
      const response = await authApi.register({ email, password, firstName, lastName, phone })
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

  const verifyAndRegister = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
    verificationCode: string
  ) => {
    try {
      const response = await authApi.verifyAndRegister({
        email,
        password,
        firstName,
        lastName,
        phone,
        verificationCode,
      })
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
    verifyAndRegister,
    sendLoginVerificationCode,
  }
}
