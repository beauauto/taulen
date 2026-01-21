'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { BorrowerBasicInfoForm, BorrowerBasicInfoFormData } from '@/components/urla/BorrowerBasicInfoForm'
import { parsePhoneNumber, formatPhoneNumber } from '@/components/ui/PhoneInput'
import { urlaApi } from '@/lib/api'
import { authUtils } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'
import { useFormChanges } from '@/hooks/useFormChanges'
import { useApplicationState } from '@/hooks/useApplicationState'

export default function BorrowerInfoPage1() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const [formData, setFormData] = useState<BorrowerBasicInfoFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    confirmEmail: '',
    phone: '',
    phoneType: 'MOBILE', // Default to Mobile Phone
    maritalStatus: '',
    isVeteran: false,
    currentAddress: '',
    sameAsMailing: true,
  })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Track form changes to avoid unnecessary saves
  const { hasChanges, resetInitialData } = useFormChanges(formData)
  
  // Application state management
  const appState = useApplicationState()
  
  // Ref for first input field to auto-focus
  const firstNameInputRef = useRef<HTMLInputElement>(null)

  // Always load borrower-info-1 specific fields from database when form is accessed
  // This ensures data is fresh whether accessed via forward or back navigation
  useEffect(() => {
    const loadExistingData = async () => {
      // Get deal ID from URL params or application state
      const applicationIdParam = searchParams?.get('applicationId')
      const applicationId = applicationIdParam || appState.dealId

      // Sync deal ID to state if from URL
      if (applicationIdParam && !appState.dealId) {
        appState.setDealId(applicationIdParam)
      }

      // Only try to load from API if user is authenticated and application exists
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      
      // If no applicationId or no token, show form immediately (new application)
      if (!applicationId || !token) {
        setIsLoading(false)
        return
      }
      
      // Always load borrower-info-1 fields from database
      try {
        const appResponse = await urlaApi.getApplication(applicationId)
        const appData = appResponse.data
        
        // Sync application state from API response
        appState.syncFromApi(appData)
        
        // Load borrower-info-1 specific fields only (firstName, lastName, email, phone, phoneType)
        if (appData?.borrower) {
          const borrowerData = appData.borrower as any
          const loadedData = {
            firstName: borrowerData?.firstName || '',
            middleName: borrowerData?.middleName || '',
            lastName: borrowerData?.lastName || '',
            suffix: borrowerData?.suffix || '',
            email: borrowerData?.email || '',
            confirmEmail: borrowerData?.email || '',
            phone: borrowerData?.phone ? formatPhoneNumber(borrowerData.phone) : '',
            phoneType: borrowerData?.phoneType || 'MOBILE',
            // These fields belong to borrower-info-2, not borrower-info-1
            maritalStatus: '',
            isVeteran: false,
            currentAddress: '',
            sameAsMailing: true,
          }
          setFormData(prev => ({
            ...prev,
            ...loadedData,
          }))
          // Reset initial data after loading
          resetInitialData(loadedData)
        }
      } catch (error: any) {
        // Only log non-401 errors (401 means not authenticated, which is expected for new applications)
        if (error.response?.status !== 401) {
          console.error('Failed to load existing application data:', error)
        }
        // For new applications, continue without loading from API
      } finally {
        setIsLoading(false)
      }
    }

    loadExistingData()
  }, [searchParams, appState.dealId])
  
  // Auto-focus first field when form is loaded
  useEffect(() => {
    if (!isLoading && firstNameInputRef.current) {
      firstNameInputRef.current.focus()
    }
  }, [isLoading])

  const sections: FormSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      current: true,
    },
    {
      id: 'getting-to-know-you',
      title: 'Loan & Property',
      locked: true,
    },
    {
      id: 'assets',
      title: 'Assets',
      locked: true,
    },
    {
      id: 'real-estate',
      title: 'Real Estate',
      locked: true,
    },
    {
      id: 'declarations',
      title: 'Declarations',
      locked: true,
    },
    {
      id: 'demographic-info',
      title: 'Demographic Info',
      locked: true,
    },
    {
      id: 'additional-questions',
      title: 'Additional Questions',
      locked: true,
    },
  ]

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (errors.password) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.password
        return newErrors
      })
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (errors.confirmPassword) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.confirmPassword
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    if (!formData.phoneType.trim()) {
      newErrors.phoneType = 'Phone type is required'
    }
    // Only require password if user is not already authenticated (new registration)
    if (!isAuthenticated) {
      if (!password.trim()) {
        newErrors.password = 'Password is required'
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long'
      }
      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Get deal ID from URL params or application state
      const applicationIdParam = searchParams?.get('applicationId')
      const existingApplicationId = applicationIdParam || appState.dealId

      if (existingApplicationId) {
        // Only save if form data has changed
        if (hasChanges) {
          const saveData = {
            borrower: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              middleName: formData.middleName || undefined,
              suffix: formData.suffix || undefined,
              email: formData.email,
              phone: parsePhoneNumber(formData.phone),
              phoneType: formData.phoneType || 'MOBILE',
            },
            nextFormStep: 'borrower-info-2',
          }

          const response = await urlaApi.saveApplication(existingApplicationId, saveData)
          
          // Sync application state from API response (may include borrower ID)
          if (response.data) {
            appState.syncFromApi(response.data)
          }
          
          // Reset initial data after successful save
          resetInitialData(formData)
        }

        // Update form step in state
        appState.setCurrentFormStep('borrower-info-2')

        // Navigate to borrower-info-2 (even if no changes were made)
        router.push(`/application/borrower-info-2?applicationId=${existingApplicationId}`)
      } else {
        // Create new borrower and application
        // Get loan purpose from sessionStorage (set at /getting-started)
        const loanPurpose = sessionStorage.getItem('loanPurpose') || 'Purchase'
        
        // Get loan data from sessionStorage
        const loanDataStr = sessionStorage.getItem('loanWantedData')
        const loanData = loanDataStr ? JSON.parse(loanDataStr) : {}

        // Prepare API request with basic info to create borrower and application
        const requestData: any = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone.replace(/\D/g, ''),
          password: password,
          loanPurpose: loanPurpose,
          dateOfBirth: '',
          verificationCode: '', // 2FA is disabled for now
          // Optional fields left undefined - will be updated in second form
          middleName: undefined,
          suffix: undefined,
          phoneType: undefined,
          maritalStatus: undefined,
          address: undefined,
          city: undefined,
          state: undefined,
          zipCode: undefined,
        }

        // Add loan purpose-specific fields
        if (loanPurpose === 'Purchase' || loanPurpose === 'purchase') {
          requestData.purchasePrice = loanData.purchasePrice ? parseFloat(loanData.purchasePrice) : undefined
          requestData.downPayment = loanData.downPayment ? parseFloat(loanData.downPayment) : undefined
          requestData.loanAmount = loanData.loanAmount ? parseFloat(loanData.loanAmount) : undefined
        } else if (loanPurpose === 'Refinance' || loanPurpose === 'refinance') {
          requestData.propertyAddress = loanData.propertyAddress
          requestData.outstandingBalance = loanData.outstandingBalance ? parseFloat(loanData.outstandingBalance) : undefined
        }

        // Call API to create borrower and application
        const response = await urlaApi.verifyAndCreateBorrower(requestData)

        // Save tokens using auth utils
        if (response.data.accessToken) {
          authUtils.setToken(response.data.accessToken)
          authUtils.setRefreshToken(response.data.refreshToken)
          if (response.data.user) {
            authUtils.setUser(response.data.user as any)
          }
        }

        // Navigate to the second borrower info form
        if (response.data.application?.id) {
          // Sync application state from API response
          appState.syncFromApi(response.data.application)
          
          // Set borrower ID if available from user data
          if (response.data.user?.id) {
            appState.setBorrowerId(response.data.user.id)
          }
          
          // Update form step
          appState.setCurrentFormStep('borrower-info-2')
          
          // Initialize progress tracking - mark that borrower info has been started
          try {
            await urlaApi.updateProgressSection(
              response.data.application.id,
              'Section1a_PersonalInfo',
              false // Not complete yet, but started
            )
            appState.updateBorrowerProgress('Section1a_PersonalInfo', false)
          } catch (progressError) {
            console.error('Failed to initialize progress:', progressError)
            // Continue anyway - progress will be initialized by the database trigger
          }
          
          // Navigate to borrower-info-2 (marital status, address, military, consents)
          router.push(`/application/borrower-info-2?applicationId=${response.data.application.id}`)
        } else {
          setErrors({ submit: 'Failed to create application' })
        }
      }
    } catch (error: any) {
      console.error('Error saving borrower data:', error)
      let errorMessage = 'Failed to save borrower data'
      
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`
      } else if (error.request) {
        errorMessage = 'Network error: Unable to connect to server. Please check if the backend server is running.'
      } else {
        errorMessage = error.message || 'An unexpected error occurred'
      }
      
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  // No handleBack - borrower-info-1 is the first form in the 1003 chain
  // Back button should not be shown for the first form

  if (isLoading) {
    return (
      <Form1003Layout
        sections={sections}
        currentSectionId="getting-started"
        title="Getting Started"
      >
        <div className="text-center text-gray-500 py-12">Loading...</div>
      </Form1003Layout>
    )
  }

  return (
    <>
      <Form1003Layout
        sections={sections}
        currentSectionId="getting-started"
        title="Getting Started"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
            <div className="whitespace-pre-line">
              Please provide a few details about yourself.
            </div>
            <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
          </div>

          <BorrowerBasicInfoForm
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            showMiddleName={false}
            showSuffix={false}
            showConfirmEmail={false}
            showPhoneType={true}
            showMaritalStatus={false}
            showVeteran={false}
            showAddress={false}
            showSameAsMailing={false}
            phoneRequired={true}
            useLegalLabel={false}
            firstNameInputRef={firstNameInputRef}
          />

          {!isAuthenticated && (
            <>
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`mt-1 ${errors.password ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className={`mt-1 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </>
          )}

          <div className="pt-4 flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-normal text-base py-4 px-8 h-[55px] rounded transition-colors shadow-sm max-w-md disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Continue'}
            </Button>
          </div>
        </form>
      </Form1003Layout>
    </>
  )
}
