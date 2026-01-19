import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Try multiple ways to get the token
    let token = localStorage.getItem('token')
    
    // If not found, try authUtils
    if (!token && typeof window !== 'undefined') {
      try {
        const { authUtils } = require('@/lib/auth')
        token = authUtils.getToken()
      } catch (e) {
        // Ignore if authUtils not available
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('API Request:', config.method?.toUpperCase(), config.url, 'with Authorization header (token length:', token.length, ')')
    } else {
      console.warn('API Request:', config.method?.toUpperCase(), config.url, 'without token')
      console.warn('localStorage.getItem("token"):', localStorage.getItem('token'))
      console.warn('localStorage keys:', Object.keys(localStorage))
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on auth endpoints (login/register) - let them handle their own errors
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                            error.config?.url?.includes('/auth/register')
      
      if (!isAuthEndpoint && typeof window !== 'undefined') {
        // Check if we're on a page that can work without authentication
        // These are pages in the application flow that should allow unauthenticated users
        const currentPath = window.location.pathname
        const isApplicationFlowPage = currentPath.includes('/application/') ||
                                      currentPath.includes('/getting-started') ||
                                      currentPath.includes('/applications/')
        
        // Only redirect to login if we're NOT on an application flow page
        // Application flow pages should handle 401 errors gracefully
        if (!isApplicationFlowPage) {
          // Handle unauthorized for protected endpoints - clear token and redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          // Delete cookies
          document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;'
          document.cookie = 'refreshToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;'
          window.location.href = '/login'
        }
        // For application flow pages, just reject the promise - let the component handle it
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

// API functions
export const authApi = {
  sendLoginVerificationCode: (email: string) =>
    apiClient.post('/auth/login/send-verification', { email }),
  login: (email: string, password: string, verificationCode?: string) =>
    apiClient.post('/auth/login', { email, password, verificationCode }),
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone: string }) =>
    apiClient.post('/auth/register', data),
  sendVerificationCodeForRegister: (email: string, phone?: string) =>
    apiClient.post('/auth/register/send-verification', { email, phone }),
  verifyAndRegister: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone: string
    verificationCode: string
  }) => apiClient.post('/auth/register/verify', data),
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
}

export const urlaApi = {
  createApplication: (data: { loanType: string; loanPurpose: string; loanAmount: number }) =>
    apiClient.post('/urla/applications', data),
  getMyApplications: () => apiClient.get('/urla/applications'),
  getApplication: (id: string) => apiClient.get(`/urla/applications/${id}`),
  updateApplicationStatus: (id: string, status: string) =>
    apiClient.put(`/urla/applications/${id}/status`, { status }),
  saveApplication: (id: string, data: any) =>
    apiClient.post(`/urla/applications/${id}/save`, data),
  getApplicationProgress: (id: string) =>
    apiClient.get(`/urla/applications/${id}/progress`),
  updateProgressSection: (id: string, section: string, complete: boolean) =>
    apiClient.patch(`/urla/applications/${id}/progress/section`, { section, complete }),
  updateProgressNotes: (id: string, notes: string) =>
    apiClient.patch(`/urla/applications/${id}/progress/notes`, { notes }),
  sendVerificationCode: (data: {
    email: string
    phone: string
    verificationMethod?: 'email' | 'sms' // Optional - backend will auto-select phone when both are available
  }) => apiClient.post('/urla/pre-application/send-verification', data),
  verifyAndCreateBorrower: (data: {
    email: string
    firstName: string
    middleName?: string
    lastName: string
    suffix?: string
    phone: string
    phoneType?: string
    maritalStatus?: string
    password: string
    dateOfBirth: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    loanPurpose: string
    verificationCode?: string // Optional when 2FA is disabled
    // Purchase-specific fields
    purchasePrice?: number
    downPayment?: number
    loanAmount?: number
    // Refinance-specific fields
    propertyAddress?: string
    outstandingBalance?: number
    // Legacy field
    estimatedPrice?: number
  }) => apiClient.post<{
    application: {
      id: string
      loanType: string
      loanPurpose: string
      loanAmount: number
      status: string
    }
    accessToken: string
    refreshToken: string
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      userType: string
    }
    preApplicationData?: {
      firstName: string
      lastName: string
      email: string
      phone: string
      dateOfBirth: string
      address: string
      city: string
      state: string
      zipCode: string
    }
  }>('/urla/pre-application/verify-and-create', data),
}
