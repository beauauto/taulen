'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { AddressModal, AddressData } from '@/components/urla/AddressModal'
import { MapPin } from 'lucide-react'
import { urlaApi } from '@/lib/api'
import { useFormChanges } from '@/hooks/useFormChanges'
import { useApplicationState } from '@/hooks/useApplicationState'

export default function CoBorrowerInfoPage2() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    maritalStatus: '',
    isVeteran: false,
    liveTogether: true,
    currentAddress: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Track form changes to avoid unnecessary saves
  const { hasChanges, resetInitialData } = useFormChanges(formData)
  
  // Application state management
  const appState = useApplicationState()
  
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
      // Always load co-borrower-info-2 specific fields from database when form is accessed
      // This ensures data is fresh whether accessed via forward or back navigation
      const loadExistingData = async () => {
        const applicationIdParam = searchParams?.get('applicationId')
        const applicationId = applicationIdParam || appState.dealId
        
        if (!applicationId) {
          // If no applicationId, redirect back to first form
          router.push('/application/co-borrower-info-1')
          return
        }

        // Sync deal ID to state if from URL
        if (applicationIdParam && !appState.dealId) {
          appState.setDealId(applicationIdParam)
        }

        // Try to load existing co-borrower data
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) {
          return // Can't load data without token
        }

        try {
          // Always load from database to get fresh data
          const appResponse = await urlaApi.getApplication(applicationId)
          const appData = appResponse.data
          
          // Sync application state from API response
          appState.syncFromApi(appData)
          
          // Load co-borrower-info-2 specific fields only
          if (appData?.coBorrower || appData?.coBorrowerId) {
          const coBorrowerData = appData.coBorrower as any
          
          // Normalize marital status
          let maritalStatus = coBorrowerData?.maritalStatus || ''
          if (maritalStatus) {
            const upperStatus = maritalStatus.toUpperCase()
            if (upperStatus === 'MARRIED' || upperStatus === 'M') {
              maritalStatus = 'MARRIED'
            } else if (upperStatus === 'SEPARATED' || upperStatus === 'S') {
              maritalStatus = 'SEPARATED'
            } else if (upperStatus === 'UNMARRIED' || upperStatus === 'U' || upperStatus === 'SINGLE') {
              maritalStatus = 'UNMARRIED'
            }
          }
          
          // Process boolean values
          const isVeteran = coBorrowerData?.isVeteran === true || 
                           coBorrowerData?.isVeteran === 'true' || 
                           coBorrowerData?.isVeteran === 1 || 
                           coBorrowerData?.isVeteran === '1' ||
                           coBorrowerData?.isVeteran === 't' ||
                           coBorrowerData?.isVeteran === 'T'
          
          const liveTogether = coBorrowerData?.liveTogether !== undefined 
            ? (coBorrowerData.liveTogether === true || 
               coBorrowerData.liveTogether === 'true' || 
               coBorrowerData.liveTogether === 1 || 
               coBorrowerData.liveTogether === '1')
            : true
          
          const loadedData = {
            maritalStatus: maritalStatus,
            isVeteran: isVeteran,
            liveTogether: liveTogether,
            currentAddress: coBorrowerData?.currentAddress || coBorrowerData?.currentResidence?.fullAddress || '',
          }
          setFormData(loadedData)
          // Reset initial data after loading
          resetInitialData(loadedData)
        }
      } catch (error: any) {
        console.error('Failed to load existing co-borrower data:', error)
      }
    }

    // Always load co-borrower-info-2 fields from database when form is accessed
    // This ensures data is fresh whether accessed via forward or back navigation
    loadExistingData()
  }, [searchParams?.get('applicationId'), appState.dealId])
  
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
    if (!address || !address.trim()) {
      return { streetAddress: '', city: '', state: '', zipCode: '' }
    }
    
    // Backend format: "street, city, state, zipCode" (4 comma-separated parts)
    // OR: "street, city, state zipCode" (3 parts where last is "state zipCode")
    const parts = address.split(',').map(p => p.trim())
    
    // Format: "street, city, state, zipCode" (4 parts - backend joins with ", ")
    if (parts.length >= 4) {
      const streetAddress = parts[0]
      const city = parts[1]
      const state = parts[2]
      const zipCode = parts.slice(3).join(' ') // In case zip has spaces
      return {
        streetAddress: streetAddress.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode.trim()
      }
    }
    
    // Format: "street, city, state zipCode" (3 parts - last part is "state zipCode")
    if (parts.length === 3) {
      const streetAddress = parts[0]
      const city = parts[1]
      const stateZip = parts[2].trim()
      
      // Try to split state and zip code
      // Pattern: "State 12345" or "State  12345" (one or more spaces)
      const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i)
      
      if (stateZipMatch) {
        return {
          streetAddress: streetAddress.trim(),
          city: city.trim(),
          state: stateZipMatch[1].toUpperCase(),
          zipCode: stateZipMatch[2]
        }
      }
      
      // Fallback: split by whitespace, assume first is state, rest is zip
      const stateZipParts = stateZip.split(/\s+/).filter(p => p.trim())
      if (stateZipParts.length >= 2) {
        const state = stateZipParts[0].toUpperCase()
        const zipCode = stateZipParts.slice(1).join(' ')
        return {
          streetAddress: streetAddress.trim(),
          city: city.trim(),
          state: state,
          zipCode: zipCode.trim()
        }
      }
    }
    
    // Format: "street, city state zipCode" (2 parts)
    if (parts.length === 2) {
      const streetAddress = parts[0]
      const cityStateZip = parts[1].trim()
      
      // Try to match "City State ZipCode" pattern
      const cityStateZipMatch = cityStateZip.match(/^(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i)
      
      if (cityStateZipMatch) {
        return {
          streetAddress: streetAddress.trim(),
          city: cityStateZipMatch[1].trim(),
          state: cityStateZipMatch[2].toUpperCase(),
          zipCode: cityStateZipMatch[3]
        }
      }
      
      // Fallback: split by spaces, assume last 2 are state and zip
      const cityStateZipParts = cityStateZip.split(/\s+/).filter(p => p.trim())
      if (cityStateZipParts.length >= 3) {
        const city = cityStateZipParts.slice(0, -2).join(' ')
        const state = cityStateZipParts[cityStateZipParts.length - 2].toUpperCase()
        const zipCode = cityStateZipParts[cityStateZipParts.length - 1]
        return {
          streetAddress: streetAddress.trim(),
          city: city.trim(),
          state: state,
          zipCode: zipCode.trim()
        }
      }
    }
    
    // If we can't parse it, return empty components
    console.warn('CoBorrowerInfo2: Could not parse address:', address, 'parts:', parts)
    return { streetAddress: address.trim(), city: '', state: '', zipCode: '' }
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
      newErrors.maritalStatus = 'Co-applicant Marital Status is required'
    }
    if (!formData.currentAddress.trim()) {
      newErrors.currentAddress = 'Current Address is required'
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
      // Always parse and validate address before saving
      // Parse address - ensure we have all components
      const { streetAddress, city, state, zipCode } = parseAddress(formData.currentAddress)
      
      console.log('CoBorrowerInfo2: Parsing address:', formData.currentAddress)
      console.log('CoBorrowerInfo2: Parsed components:', { streetAddress, city, state, zipCode })
      
      // Validate parsed address components - all are required
      if (!streetAddress?.trim() || !city?.trim() || !state?.trim() || !zipCode?.trim()) {
        console.error('CoBorrowerInfo2: Address parsing failed:', { streetAddress, city, state, zipCode })
        console.error('CoBorrowerInfo2: Original address string:', formData.currentAddress)
        setErrors({ 
          currentAddress: 'Address format is invalid. Please click the address field to edit it and ensure all fields (street, city, state, zip) are filled.',
          submit: 'Please fix the address before continuing.'
        })
        setIsSubmitting(false)
        // Open address modal to help user fix it
        setIsAddressModalOpen(true)
        return
      }
      
      // Only save if form data has changed (but always validate address above)
      if (hasChanges) {

        // Save co-borrower additional information
        // Note: Do NOT include email/phone - the co-borrower ID should be found via the deal
        // The co-borrower was created in co-borrower-info-1 and linked to the deal via borrower_progress
        const saveData = {
          coBorrower: {
            maritalStatus: formData.maritalStatus,
            isVeteran: formData.isVeteran,
            liveTogether: formData.liveTogether,
            address: streetAddress.trim(),
            city: city.trim(),
            state: state.trim(),
            zipCode: zipCode.trim(),
          },
          nextFormStep: 'review', // Set next form step to Getting Started Summary
        }
        
        console.log('CoBorrowerInfo2: Saving data:', saveData)

        const response = await urlaApi.saveApplication(applicationId, saveData)
        
        // Sync application state from API response
        if (response.data) {
          appState.syncFromApi(response.data)
        }
        
        // Update form step in state
        appState.setCurrentFormStep('review')
        
        // Reset initial data after successful save
        resetInitialData(formData)
      }

      // Navigate to Getting Started Summary page (even if no changes were made)
      router.push(`/application/review?applicationId=${applicationId}`)
    } catch (error: any) {
      console.error('Error saving co-borrower information:', error)
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
    // Go back to co-borrower-info-1
    const applicationId = searchParams?.get('applicationId') || appState.dealId || sessionStorage.getItem('applicationId')
    console.log('CoBorrowerInfo2: Back button clicked, applicationId:', applicationId)
    if (applicationId) {
      router.push(`/application/co-borrower-info-1?applicationId=${applicationId}`)
    } else {
      router.push('/application/co-borrower-info-1')
    }
  }

  return (
    <>
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
              Please provide additional information about your co-applicant.
            </div>
            <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="maritalStatus" className="text-sm font-medium text-gray-700">
                Co-applicant Marital Status <span className="text-red-500">*</span>
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
                Is this person currently an active military personnel, a veteran, or a surviving spouse?
              </Label>
            </div>

            <div className="flex items-center space-x-3 py-2">
              <Switch
                id="liveTogether"
                checked={formData.liveTogether}
                onCheckedChange={(checked) => handleInputChange('liveTogether', checked)}
              />
              <Label htmlFor="liveTogether" className="text-sm font-medium text-gray-700 cursor-pointer">
                Do you live with this person?
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
                Click the field or icon to enter the address
              </p>
            </div>
          </div>

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
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleAddressSave}
        initialAddress={formData.currentAddress}
      />
    </>
  )
}
