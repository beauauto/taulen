'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { AddressModal, AddressData } from '@/components/urla/AddressModal'
import { MapPin } from 'lucide-react'
import { authUtils } from '@/lib/auth'
import { cookieUtils } from '@/lib/cookies'
import { useFormChanges } from '@/hooks/useFormChanges'

export default function BorrowerInfoPage2() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    maritalStatus: '',
    isVeteran: false,
    currentAddress: '',
    sameAsMailing: true,
    acceptTerms: false,
    consentToContact: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Track form changes to avoid unnecessary saves
  const { hasChanges, resetInitialData } = useFormChanges(formData)
  
  // Ref for first input field to auto-focus
  const maritalStatusSelectRef = useRef<HTMLSelectElement>(null)

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

  useEffect(() => {
    // Check if borrower was already created (applicationId exists)
    // Try to get from URL params first (when redirected from /applications/[id])
    const urlParams = new URLSearchParams(window.location.search)
    const applicationIdFromUrl = urlParams.get('applicationId')
    const applicationIdFromStorage = sessionStorage.getItem('applicationId')
    const applicationId = applicationIdFromUrl || applicationIdFromStorage
    
    if (!applicationId) {
      // If no applicationId, redirect back to first form
      router.push('/application/borrower-info-1')
      return
    }

    // Store in sessionStorage for consistency
    if (applicationIdFromUrl && !applicationIdFromStorage) {
      sessionStorage.setItem('applicationId', applicationId)
    }

    // Verify token exists - borrower should be authenticated by this point
    // Try multiple methods to get the token
    let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token && typeof window !== 'undefined') {
      // Try authUtils
      token = authUtils.getToken()
    }
    if (!token && typeof window !== 'undefined') {
      // Try cookie
      token = cookieUtils.getCookie('token')
    }
    
    if (!token) {
      console.warn('No authentication token found. Borrower should be authenticated by this point.')
      console.warn('This may cause issues when saving data. Token should have been set during login.')
      console.warn('localStorage.getItem("token"):', typeof window !== 'undefined' ? localStorage.getItem('token') : 'N/A')
      console.warn('localStorage keys:', typeof window !== 'undefined' ? Object.keys(localStorage) : 'N/A')
      // Don't return - still try to load data, it might work if the API doesn't require auth
    } else {
      console.log('Authentication token found, length:', token.length)
      console.log('Token preview:', token.substring(0, 20) + '...')
    }

    // Load existing application data
    // The borrower should be authenticated by this point (created in borrower-info-1)
    const loadExistingData = async () => {
      // Wait a bit to ensure token is available if it was just set
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Re-check token before making API call
      let currentToken = localStorage.getItem('token')
      if (!currentToken) {
        currentToken = authUtils.getToken()
      }
      if (!currentToken) {
        currentToken = cookieUtils.getCookie('token')
      }
      
      if (!currentToken) {
        console.error('Token not available for API call')
        console.error('Cannot load application data without authentication')
        return
      }
      
      try {
        const { urlaApi } = await import('@/lib/api')
        console.log('Loading application data for ID:', applicationId)
        console.log('Token available for API call:', !!currentToken, 'length:', currentToken.length)
        const appResponse = await urlaApi.getApplication(applicationId)
        const appData = appResponse.data
        console.log('Application data loaded:', JSON.stringify(appData, null, 2))
        
        if (appData?.borrower) {
          const borrowerData = appData.borrower as any
          console.log('Borrower data:', JSON.stringify(borrowerData, null, 2))
          console.log('Marital status:', borrowerData?.maritalStatus, 'type:', typeof borrowerData?.maritalStatus, 'value:', JSON.stringify(borrowerData?.maritalStatus))
          console.log('Military status - isVeteran:', borrowerData?.isVeteran, 'militaryServiceStatus:', borrowerData?.militaryServiceStatus)
          console.log('Consent to credit check - consentToCreditCheck:', borrowerData?.consentToCreditCheck, 'acceptTerms:', borrowerData?.acceptTerms)
          console.log('Consent to contact:', borrowerData?.consentToContact)
          
          // Convert boolean values properly - handle both true/false and null/undefined
          // The backend now always includes these fields (defaults to false if NULL)
          // Handle both boolean true and string 'true' values, and check multiple field names
          const rawIsVeteran = borrowerData?.isVeteran ?? borrowerData?.militaryServiceStatus
          const rawAcceptTerms = borrowerData?.acceptTerms ?? borrowerData?.consentToCreditCheck
          const rawConsentToContact = borrowerData?.consentToContact
          
          // Convert to boolean - handle true, 'true', 1, '1', 't', etc.
          const isVeteran = rawIsVeteran === true || 
                           rawIsVeteran === 'true' || 
                           rawIsVeteran === 1 || 
                           rawIsVeteran === '1' ||
                           rawIsVeteran === 't' ||
                           rawIsVeteran === 'T' ||
                           false
          
          const acceptTerms = rawAcceptTerms === true || 
                             rawAcceptTerms === 'true' || 
                             rawAcceptTerms === 1 || 
                             rawAcceptTerms === '1' ||
                             rawAcceptTerms === 't' ||
                             rawAcceptTerms === 'T' ||
                             false
          
          const consentToContact = rawConsentToContact === true || 
                                  rawConsentToContact === 'true' || 
                                  rawConsentToContact === 1 || 
                                  rawConsentToContact === '1' ||
                                  rawConsentToContact === 't' ||
                                  rawConsentToContact === 'T' ||
                                  false
          
          console.log('Processed boolean values:', {
            isVeteran,
            acceptTerms,
            consentToContact,
            rawIsVeteran: borrowerData?.isVeteran,
            rawMilitaryServiceStatus: borrowerData?.militaryServiceStatus,
            rawConsentToCreditCheck: borrowerData?.consentToCreditCheck,
            rawAcceptTerms: borrowerData?.acceptTerms,
            rawConsentToContact: borrowerData?.consentToContact,
            allBorrowerDataKeys: Object.keys(borrowerData || {}),
          })
          
          // Ensure marital status is set correctly - trim whitespace and handle case
          let maritalStatus = borrowerData?.maritalStatus || ''
          if (maritalStatus) {
            maritalStatus = maritalStatus.trim().toUpperCase()
            // Map common variations to expected values
            if (maritalStatus === 'MARRIED' || maritalStatus === 'M') {
              maritalStatus = 'MARRIED'
            } else if (maritalStatus === 'SEPARATED' || maritalStatus === 'S') {
              maritalStatus = 'SEPARATED'
            } else if (maritalStatus === 'UNMARRIED' || maritalStatus === 'U' || maritalStatus === 'SINGLE') {
              maritalStatus = 'UNMARRIED'
            }
          }
          
          const updatedFormData = {
            maritalStatus: maritalStatus,
            isVeteran: isVeteran,
            currentAddress: borrowerData?.currentResidence?.fullAddress || borrowerData?.currentAddress || '',
            sameAsMailing: true, // Keep default
            acceptTerms: acceptTerms,
            consentToContact: consentToContact,
          }
          // Reset initial data after loading
          resetInitialData(updatedFormData)
          
          console.log('Setting form data:', updatedFormData)
          console.log('Marital status processing:', {
            raw: borrowerData?.maritalStatus,
            processed: maritalStatus,
            formDataMaritalStatus: updatedFormData.maritalStatus,
            matchesMARRIED: updatedFormData.maritalStatus === 'MARRIED',
            matchesSEPARATED: updatedFormData.maritalStatus === 'SEPARATED',
            matchesUNMARRIED: updatedFormData.maritalStatus === 'UNMARRIED',
          })
          
          // Set form data
          setFormData(updatedFormData)
        } else {
          console.warn('No borrower data found in application response')
          console.warn('Application data structure:', appData)
        }
      } catch (error: any) {
        // Log error but don't block the form - user can still fill it out
        console.error('Failed to load existing application data:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
        })
        // If 401, the API interceptor won't redirect (we're on an application flow page)
        // The form will just start empty, which is fine
      }
    }

    // Always try to load data if we have an applicationId
    // The API call will fail gracefully if there's no token
    loadExistingData()
  }, [router])

  // Debug: Log when formData.maritalStatus changes
  useEffect(() => {
    console.log('FormData maritalStatus changed:', formData.maritalStatus, 'type:', typeof formData.maritalStatus)
  }, [formData.maritalStatus])
  
  // Auto-focus first field when form is ready
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (maritalStatusSelectRef.current) {
        maritalStatusSelectRef.current.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, []) // Run once on mount

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

  const parseAddress = (address: string) => {
    const parts = address.split(',').map(p => p.trim())
    if (parts.length >= 3) {
      const streetAddress = parts[0]
      const city = parts[1]
      const stateZip = parts[2].split(' ')
      const state = stateZip[0]
      const zipCode = stateZip.slice(1).join(' ')
      return { streetAddress, city, state, zipCode }
    }
    if (parts.length === 2) {
      const streetAddress = parts[0]
      const cityStateZip = parts[1].split(' ')
      if (cityStateZip.length >= 3) {
        const city = cityStateZip.slice(0, -2).join(' ')
        const state = cityStateZip[cityStateZip.length - 2]
        const zipCode = cityStateZip[cityStateZip.length - 1]
        return { streetAddress, city, state, zipCode }
      }
    }
    return { streetAddress: address, city: '', state: '', zipCode: '' }
  }

  const handleAddressSave = (addressData: AddressData) => {
    const formattedAddress = `${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zipCode}`
    handleInputChange('currentAddress', formattedAddress)
    setIsAddressModalOpen(false)
  }

  const handleAddressFieldClick = () => {
    setIsAddressModalOpen(true)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.maritalStatus) {
      newErrors.maritalStatus = 'Marital Status is required'
    }
    if (!formData.currentAddress.trim()) {
      newErrors.currentAddress = 'Current Address is required'
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the Terms of Service'
    }
    if (!formData.consentToContact) {
      newErrors.consentToContact = 'You must consent to contact'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (isSubmitting) {
      return // Prevent double submission
    }

    // Get application ID from sessionStorage (set by first form)
    const applicationId = sessionStorage.getItem('applicationId')
    if (!applicationId) {
      setErrors({ submit: 'Application not found. Please start over.' })
      return
    }

    setIsSubmitting(true)
    setErrors({}) // Clear previous errors

    try {
      // Check if token exists before making API call
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        setErrors({ submit: 'You must be logged in to save your information. Please refresh the page and try again.' })
        setIsSubmitting(false)
        return
      }

      // Only save if form data has changed
      if (hasChanges) {
        // Parse address
        const { streetAddress, city, state, zipCode } = parseAddress(formData.currentAddress)

        // Save borrower data (marital status, address, military status, and consents) to database
        const { urlaApi } = await import('@/lib/api')
        
        const saveData = {
          borrower: {
            maritalStatus: formData.maritalStatus,
            currentAddress: formData.currentAddress,
            // Include address components for backend parsing
            address: streetAddress,
            city: city,
            state: state,
            zipCode: zipCode,
            // Military service status and consents
            isVeteran: formData.isVeteran,
            acceptTerms: formData.acceptTerms,
            consentToContact: formData.consentToContact,
          },
          nextFormStep: 'co-borrower-question', // Set next form step to co-borrower question
        }

        console.log('Saving borrower data:', saveData)
        console.log('Token exists:', !!token)
        console.log('Application ID:', applicationId)
        
        // Save borrower data first - this must succeed before proceeding
        const saveResponse = await urlaApi.saveApplication(applicationId, saveData)
        console.log('Borrower data saved successfully:', saveResponse)
        
        // Reset initial data after successful save
        resetInitialData(formData)
      }

      // Update progress - mark Section1a_PersonalInfo as complete
      // This section includes personal info, marital status, address, military status, and consents
      try {
        const progressResponse = await urlaApi.updateProgressSection(
          applicationId,
          'Section1a_PersonalInfo',
          true // Mark as complete
        )
        console.log('Progress updated successfully:', progressResponse)
      } catch (progressError: any) {
        console.error('Failed to update progress:', progressError)
        // Log the error but don't block navigation - data is saved
        console.error('Progress error details:', {
          message: progressError.message,
          response: progressError.response?.data,
          status: progressError.response?.status,
        })
        // Continue anyway - data is saved, progress update is secondary
      }

      // Clear session storage
      sessionStorage.removeItem('loanWantedData')
      sessionStorage.removeItem('borrowerInfo1Data')

      // Navigate to co-borrower question after successful save
      router.push(`/application/co-borrower-question?applicationId=${applicationId}`)
    } catch (error: any) {
      console.error('Failed to save borrower information:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      })
      
      let errorMessage = 'Failed to save information. Please try again.'
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      `Server error: ${error.response.status} ${error.response.statusText || ''}`
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error: Unable to connect to server. Please check if the backend server is running.'
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage
      }
      
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    // Always go back to the previous form in the 1003 flow: borrower-info-1
    const urlParams = new URLSearchParams(window.location.search)
    const applicationIdFromUrl = urlParams.get('applicationId')
    const applicationIdFromStorage = sessionStorage.getItem('applicationId')
    const appId = applicationIdFromUrl || applicationIdFromStorage
    
    if (appId) {
      router.push(`/application/borrower-info-1?applicationId=${appId}`)
    } else {
      router.push('/application/borrower-info-1')
    }
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
            Please provide additional information and review the consent agreements.
          </div>
          <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="maritalStatus" className="text-sm font-medium text-gray-700">
              Marital Status <span className="text-red-500">*</span>
            </Label>
            <Select
              ref={maritalStatusSelectRef}
              value={formData.maritalStatus}
              onValueChange={(value) => handleInputChange('maritalStatus', value)}
              required
              className={`mt-1 ${errors.maritalStatus ? 'border-red-500' : ''}`}
            >
              <option value="">- Select an option -</option>
              <option value="MARRIED">Married</option>
              <option value="SEPARATED">Separated</option>
              <option value="UNMARRIED">Unmarried</option>
            </Select>
            {errors.maritalStatus && (
              <p className="mt-1 text-sm text-red-500">{errors.maritalStatus}</p>
            )}
          </div>

          <div className="flex items-center space-x-3 py-2">
            <Switch
              id="isVeteran"
              checked={formData.isVeteran}
              onCheckedChange={(checked) => handleInputChange('isVeteran', checked)}
            />
            <Label htmlFor="isVeteran" className="text-sm font-medium text-gray-700 cursor-pointer">
              Are you currently an active military personnel, a veteran, or a surviving spouse?
            </Label>
          </div>

          <div>
            <Label htmlFor="currentAddress" className="text-sm font-medium text-gray-700">
              Current Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Input
                id="currentAddress"
                name="currentAddress"
                type="text"
                required
                value={formData.currentAddress}
                onClick={handleAddressFieldClick}
                readOnly
                className={`${errors.currentAddress ? 'border-red-500' : ''} cursor-pointer pr-10`}
                autoComplete="street-address"
              />
              <button
                type="button"
                onClick={handleAddressFieldClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                aria-label="Edit address"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>
            {errors.currentAddress && (
              <p className="mt-1 text-sm text-red-500">{errors.currentAddress}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Click the field or icon to enter your address
            </p>
          </div>

          <div className="flex items-center space-x-3 py-2">
            <Switch
              id="sameAsMailing"
              checked={formData.sameAsMailing}
              onCheckedChange={(checked) => handleInputChange('sameAsMailing', checked)}
            />
            <Label htmlFor="sameAsMailing" className="text-sm font-medium text-gray-700 cursor-pointer">
              Same as mailing address
            </Label>
          </div>

          <div className="flex items-start space-x-3 py-2">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={formData.acceptTerms}
              onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
              className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-600 flex-shrink-0"
              required
            />
            <Label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer">
              I confirm that I have read and agree to the{' '}
              <button type="button" className="text-amber-600 hover:underline">Terms Of Use</button>
              {' '}(including consent to electronically access your financial information for the purposes of this transaction),{' '}
              <button type="button" className="text-amber-600 hover:underline">Privacy Policy</button>
              ,{' '}
              <button type="button" className="text-amber-600 hover:underline">Consent to Use Electronic Signatures and Records</button>
              , and authorize you to obtain my credit information according to the{' '}
              <button type="button" className="text-amber-600 hover:underline">Credit Consent</button>.
            </Label>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-red-500">{errors.acceptTerms}</p>
          )}

          <div className="flex items-start space-x-3 py-2">
            <input
              type="checkbox"
              id="consentToContact"
              checked={formData.consentToContact}
              onChange={(e) => handleInputChange('consentToContact', e.target.checked)}
              className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-600 flex-shrink-0"
              required
            />
            <Label htmlFor="consentToContact" className="text-sm text-gray-700 cursor-pointer">
              I confirm that I have read and agree to the{' '}
              <button type="button" className="text-amber-600 hover:underline">Consent to Contact</button>.
            </Label>
          </div>
          {errors.consentToContact && (
            <p className="text-sm text-red-500">{errors.consentToContact}</p>
          )}
        </div>

              <div className="pt-4 flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-normal text-base py-4 px-8 h-[55px] rounded transition-colors shadow-sm max-w-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Continue'}
                </Button>
              </div>
      </form>
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleAddressSave}
        initialAddress={formData.currentAddress}
      />
    </Form1003Layout>
  )
}
