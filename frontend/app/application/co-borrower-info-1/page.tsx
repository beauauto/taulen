'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { Select } from '@/components/ui/select'
import { BorrowerBasicInfoForm, BorrowerBasicInfoFormData } from '@/components/urla/BorrowerBasicInfoForm'
import { parsePhoneNumber, formatPhoneNumber } from '@/components/ui/PhoneInput'
import { urlaApi } from '@/lib/api'
import { useFormChanges } from '@/hooks/useFormChanges'
import { useApplicationState } from '@/hooks/useApplicationState'

export default function CoBorrowerInfoPage1() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Track form changes to avoid unnecessary saves
  const { hasChanges, resetInitialData } = useFormChanges(formData)
  
  // Application state management
  const appState = useApplicationState()
  
  // Ref for first input field to auto-focus
  const firstNameInputRef = useRef<HTMLInputElement>(null)

  // Always load co-borrower-info-1 specific fields from database when form is accessed
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
      
      // If no applicationId or no token, show form immediately (new co-borrower)
      if (!applicationId || !token) {
        setIsLoading(false)
        return
      }
      
      // Always load co-borrower-info-1 fields from database
      try {
        const appResponse = await urlaApi.getApplication(applicationId)
        const appData = appResponse.data
        
        // Sync application state from API response
        appState.syncFromApi(appData)
        
        // Load co-borrower-info-1 specific fields only (firstName, lastName, email, phone, phoneType)
        if (appData?.coBorrower || appData?.coBorrowerId) {
          const coBorrowerData = appData.coBorrower as any
          const loadedData = {
            firstName: coBorrowerData?.firstName || '',
            middleName: '',
            lastName: coBorrowerData?.lastName || '',
            suffix: '',
            email: coBorrowerData?.email || '',
            confirmEmail: coBorrowerData?.email || '',
            phone: coBorrowerData?.phone ? formatPhoneNumber(coBorrowerData.phone) : '',
            phoneType: coBorrowerData?.phoneType || 'MOBILE',
            // These fields belong to co-borrower-info-2, not co-borrower-info-1
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
        // Only log non-401 errors (401 means not authenticated)
        if (error.response?.status !== 401) {
          console.error('Failed to load existing co-borrower data:', error)
        }
        // Continue without loading from API if error
      } finally {
        setIsLoading(false)
      }
    }

    loadExistingData()
  }, [searchParams?.get('applicationId'), appState.dealId])
  
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Co-applicant First Name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Co-applicant Last Name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Co-applicant Email Address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    if (!formData.phoneType.trim()) {
      newErrors.phoneType = 'Phone type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const applicationId = searchParams?.get('applicationId') || appState.dealId
    
    if (!applicationId) {
      setErrors({ submit: 'Application ID not found. Please start over.' })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Only save if form data has changed
      if (hasChanges) {
        // Save basic co-borrower information (will be updated in second form)
        const saveData = {
          coBorrower: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: parsePhoneNumber(formData.phone),
            phoneType: formData.phoneType || 'MOBILE',
          },
          nextFormStep: 'co-borrower-info-2',
        }

        const response = await urlaApi.saveApplication(applicationId, saveData)
        
        // Sync application state from API response (may include co-borrower ID)
        if (response.data) {
          appState.syncFromApi(response.data)
        }
        
        // Update form step in state
        appState.setCurrentFormStep('co-borrower-info-2')
        
        // Reset initial data after successful save
        resetInitialData(formData)
      }

      // Navigate to co-borrower-info-2 (even if no changes were made)
      router.push(`/application/co-borrower-info-2?applicationId=${applicationId}`)
    } catch (error: any) {
      console.error('Error saving co-borrower basic information:', error)
      let errorMessage = 'Failed to save co-borrower information'
      
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

  const handleBack = () => {
    // Go back to co-borrower-question
    const applicationId = searchParams?.get('applicationId') || appState.dealId || sessionStorage.getItem('applicationId')
    console.log('CoBorrowerInfo1: Back button clicked, applicationId:', applicationId)
    if (applicationId) {
      router.push(`/application/co-borrower-question?applicationId=${applicationId}`)
    } else {
      router.push('/application/co-borrower-question')
    }
  }

  if (isLoading) {
    return (
      <Form1003Layout
        sections={sections}
        currentSectionId="getting-started"
        title="Getting Started"
        onBack={handleBack}
      >
        <div className="text-center text-gray-500 py-12">Loading...</div>
      </Form1003Layout>
    )
  }

  return (
    <Form1003Layout
      sections={sections}
      currentSectionId="getting-started"
      title="Getting Started"
      onBack={handleBack}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
          <div className="whitespace-pre-line">
            Please provide a few details about your co-applicant.
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

        <div className="pt-4 flex justify-center">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-normal text-base py-4 px-8 h-[55px] rounded transition-colors shadow-sm max-w-md disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </Form1003Layout>
  )
}
