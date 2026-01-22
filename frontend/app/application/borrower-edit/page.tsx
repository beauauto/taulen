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
import { PhoneInput, formatPhoneNumber, parsePhoneNumber } from '@/components/ui/PhoneInput'
import { MapPin } from 'lucide-react'
import { urlaApi } from '@/lib/api'
import { useFormChanges } from '@/hooks/useFormChanges'
import { useApplicationState } from '@/hooks/useApplicationState'

// Helper function to calculate move-in date from years/months duration
function calculateMoveInDateFromDuration(years: string, months: string): string {
  if (!years && !months) return ''
  const totalMonths = (parseInt(years || '0') * 12) + parseInt(months || '0')
  if (totalMonths === 0) return ''
  const today = new Date()
  const moveInDate = new Date(today)
  moveInDate.setMonth(moveInDate.getMonth() - totalMonths)
  return moveInDate.toISOString().split('T')[0]
}

// Helper function to calculate duration in months from move-in date
function calculateDurationFromMoveInDate(moveInDate: string): { years: number; months: number } {
  if (!moveInDate) return { years: 0, months: 0 }
  const moveIn = new Date(moveInDate)
  const today = new Date()
  const diffTime = today.getTime() - moveIn.getTime()
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)) // Average days per month
  return {
    years: Math.floor(diffMonths / 12),
    months: diffMonths % 12
  }
}

export default function BorrowerEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const appState = useApplicationState()
  
  const [formData, setFormData] = useState({
    // Personal Information (from borrower-info-1)
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    phone: '', // Primary phone (from borrower-info-1)
    phoneType: 'MOBILE', // Phone type (from borrower-info-1)
    ssn: '',
    dateOfBirth: '',
    
    // Contact Information (additional phone - optional)
    hasAdditionalPhone: false,
    additionalPhone: '',
    additionalPhoneType: '',
    workPhoneExt: '', // Only for work phone extension
    preferredContactMethod: 'EMAIL',
    
    // Current Address
    currentAddress: '',
    currentAddressStreet: '',
    currentAddressCity: '',
    currentAddressState: '',
    currentAddressZip: '',
    moveInDateCurrent: '', // Move-in date for current address
    housingStatus: '',
    sameAsMailing: true, // From borrower-info-2
    
    // Previous Addresses (array to support multiple addresses until 2 years is covered)
    previousAddresses: [] as Array<{
      address: string
      addressStreet: string
      addressCity: string
      addressState: string
      addressZip: string
      moveInDate: string
      moveOutDate: string
      housingStatus: string
    }>,
    
    // Citizenship & Residency
    citizenshipType: '',
    alienRegistrationNumber: '',
    
    // Marital Status (from borrower-info-2)
    maritalStatus: '',
    
    // Dependents
    dependentCount: '',
    dependentAges: '',
    
    // Military Status (from borrower-info-2)
    isVeteran: false,
    
    // Consents (from borrower-info-2)
    acceptTerms: false,
    consentToContact: false,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isPreviousAddressModalOpen, setIsPreviousAddressModalOpen] = useState(false)
  const [editingPreviousAddressIndex, setEditingPreviousAddressIndex] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const { hasChanges, resetInitialData } = useFormChanges(formData)
  const firstNameInputRef = useRef<HTMLInputElement>(null)

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

  // Load existing borrower data from database
  useEffect(() => {
    const loadExistingData = async () => {
      setIsLoading(true)
      const applicationIdParam = searchParams?.get('applicationId')
      const applicationIdFromState = appState.dealId || sessionStorage.getItem('applicationId')
      const applicationId = applicationIdParam || applicationIdFromState
      
      console.log('BorrowerEdit: Loading data for applicationId:', applicationId)
      console.log('BorrowerEdit: applicationIdParam:', applicationIdParam)
      console.log('BorrowerEdit: appState.dealId:', appState.dealId)
      
      if (applicationIdParam && !appState.dealId) {
        appState.setDealId(applicationIdParam)
        sessionStorage.setItem('applicationId', applicationIdParam)
      }
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      
      if (!applicationId || !token) {
        console.warn('BorrowerEdit: Missing applicationId or token', { applicationId, hasToken: !!token })
        setIsLoading(false)
        return
      }
      
      try {
        console.log('BorrowerEdit: Fetching application data from API...')
        const appResponse = await urlaApi.getApplication(applicationId)
        const appData = appResponse.data
        
        console.log('BorrowerEdit: Application data received:', appData)
        
        appState.syncFromApi(appData)
        
        if (appData?.borrower) {
          const borrower = appData.borrower as any
          
          // Parse current address
          let currentAddressParts = { street: '', city: '', state: '', zip: '' }
          if (borrower.currentAddress || borrower.currentResidence?.fullAddress) {
            const addr = borrower.currentAddress || borrower.currentResidence?.fullAddress || ''
            const parts = addr.split(',').map((p: string) => p.trim())
            if (parts.length >= 3) {
              currentAddressParts.street = parts[0]
              currentAddressParts.city = parts[1]
              const stateZip = parts[2].split(' ')
              currentAddressParts.state = stateZip[0] || ''
              currentAddressParts.zip = stateZip.slice(1).join(' ') || ''
            }
          }
          
          // Determine primary phone and phoneType (from borrower-info-1)
          let primaryPhone = ''
          let primaryPhoneType = 'MOBILE'
          if (borrower.phone) {
            primaryPhone = formatPhoneNumber(borrower.phone)
            primaryPhoneType = borrower.phoneType || 'MOBILE'
          } else if (borrower.mobilePhone) {
            primaryPhone = formatPhoneNumber(borrower.mobilePhone)
            primaryPhoneType = 'MOBILE'
          } else if (borrower.homePhone) {
            primaryPhone = formatPhoneNumber(borrower.homePhone)
            primaryPhoneType = 'HOME'
          } else if (borrower.workPhone) {
            primaryPhone = formatPhoneNumber(borrower.workPhone)
            primaryPhoneType = 'WORK'
          }
          
          // Contact Information (additional phone - determine if exists)
          // Check if there's an additional phone beyond the primary one
          let additionalPhone = ''
          let additionalPhoneType = ''
          let hasAdditionalPhone = false
          
          // Determine which phone fields are populated
          const phones = {
            MOBILE: borrower.mobilePhone ? formatPhoneNumber(borrower.mobilePhone) : '',
            HOME: borrower.homePhone ? formatPhoneNumber(borrower.homePhone) : '',
            WORK: borrower.workPhone ? formatPhoneNumber(borrower.workPhone) : '',
          }
          
          // Find the additional phone (one that's not the primary phone type)
          if (primaryPhoneType === 'MOBILE' && phones.HOME) {
            additionalPhone = phones.HOME
            additionalPhoneType = 'HOME'
            hasAdditionalPhone = true
          } else if (primaryPhoneType === 'MOBILE' && phones.WORK) {
            additionalPhone = phones.WORK
            additionalPhoneType = 'WORK'
            hasAdditionalPhone = true
          } else if (primaryPhoneType === 'HOME' && phones.MOBILE) {
            additionalPhone = phones.MOBILE
            additionalPhoneType = 'MOBILE'
            hasAdditionalPhone = true
          } else if (primaryPhoneType === 'HOME' && phones.WORK) {
            additionalPhone = phones.WORK
            additionalPhoneType = 'WORK'
            hasAdditionalPhone = true
          } else if (primaryPhoneType === 'WORK' && phones.MOBILE) {
            additionalPhone = phones.MOBILE
            additionalPhoneType = 'MOBILE'
            hasAdditionalPhone = true
          } else if (primaryPhoneType === 'WORK' && phones.HOME) {
            additionalPhone = phones.HOME
            additionalPhoneType = 'HOME'
            hasAdditionalPhone = true
          }
          
          // If primary phone is not set but we have phones, use the first available
          if (!primaryPhone && phones.MOBILE) {
            primaryPhone = phones.MOBILE
            primaryPhoneType = 'MOBILE'
            // Check for additional
            if (phones.HOME) {
              additionalPhone = phones.HOME
              additionalPhoneType = 'HOME'
              hasAdditionalPhone = true
            } else if (phones.WORK) {
              additionalPhone = phones.WORK
              additionalPhoneType = 'WORK'
              hasAdditionalPhone = true
            }
          } else if (!primaryPhone && phones.HOME) {
            primaryPhone = phones.HOME
            primaryPhoneType = 'HOME'
            if (phones.WORK) {
              additionalPhone = phones.WORK
              additionalPhoneType = 'WORK'
              hasAdditionalPhone = true
            }
          } else if (!primaryPhone && phones.WORK) {
            primaryPhone = phones.WORK
            primaryPhoneType = 'WORK'
          }
          
          const loadedData = {
            // Personal Information (from borrower-info-1)
            firstName: borrower.firstName || '',
            middleName: borrower.middleName || '',
            lastName: borrower.lastName || '',
            suffix: borrower.suffix || '',
            email: borrower.email || '',
            phone: primaryPhone, // Primary phone from borrower-info-1
            phoneType: primaryPhoneType, // Phone type from borrower-info-1
            ssn: borrower.ssn || borrower.taxpayerIdentifierValue || '',
            dateOfBirth: borrower.dateOfBirth || borrower.birthDate || '',
            
            // Contact Information (additional phone)
            preferredContactMethod: borrower.preferredContactMethod || 'EMAIL',
            hasAdditionalPhone: hasAdditionalPhone,
            additionalPhone: additionalPhone,
            additionalPhoneType: additionalPhoneType,
            workPhoneExt: (hasAdditionalPhone && additionalPhoneType === 'WORK') ? (borrower.workPhoneExt || borrower.workPhoneExtension || '') : '',
            
            // Current Address
            currentAddress: borrower.currentAddress || borrower.currentResidence?.fullAddress || '',
            currentAddressStreet: currentAddressParts.street,
            currentAddressCity: currentAddressParts.city,
            currentAddressState: currentAddressParts.state,
            currentAddressZip: currentAddressParts.zip,
            // Calculate move-in date from years/months (if available)
            moveInDateCurrent: calculateMoveInDateFromDuration(
              borrower.yearsAtCurrentAddress || '',
              borrower.monthsAtCurrentAddress || ''
            ),
            housingStatus: borrower.housingStatus || '',
            sameAsMailing: borrower.sameAsMailing !== undefined ? borrower.sameAsMailing : true, // From borrower-info-2
            
            // Previous Addresses - convert from years/months to move-in dates
            // For now, support single previous address (can be extended to array later)
            previousAddresses: borrower.previousAddress ? [{
              address: borrower.previousAddress || '',
              addressStreet: borrower.previousAddressStreet || '',
              addressCity: borrower.previousAddressCity || '',
              addressState: borrower.previousAddressState || '',
              addressZip: borrower.previousAddressZip || '',
              moveInDate: calculateMoveInDateFromDuration(
                borrower.yearsAtPreviousAddress || '',
                borrower.monthsAtPreviousAddress || ''
              ),
              moveOutDate: calculateMoveInDateFromDuration(
                borrower.yearsAtCurrentAddress || '',
                borrower.monthsAtCurrentAddress || ''
              ) || '', // Move-out date should be the current move-in date
              housingStatus: borrower.previousHousingStatus || '',
            }] : [],
            
            // Citizenship & Residency
            citizenshipType: borrower.citizenshipType || borrower.citizenshipResidencyType || '',
            alienRegistrationNumber: borrower.alienRegistrationNumber || '',
            
            // Marital Status (from borrower-info-2)
            maritalStatus: borrower.maritalStatus || '',
            
            // Dependents
            dependentCount: borrower.dependentCount?.toString() || '',
            dependentAges: borrower.dependentAges || '',
            
            // Military Status (from borrower-info-2)
            isVeteran: borrower.isVeteran || borrower.militaryServiceStatus || false,
            
            // Consents (from borrower-info-2)
            acceptTerms: borrower.acceptTerms || borrower.consentToCreditCheck || false,
            consentToContact: borrower.consentToContact || false,
          }
          
          // Previous addresses will be shown dynamically based on moveInDateCurrent
          
          console.log('BorrowerEdit: Setting form data:', loadedData)
          setFormData(loadedData)
          resetInitialData(loadedData)
        } else {
          console.warn('BorrowerEdit: No borrower data found in application')
        }
      } catch (error: any) {
        console.error('BorrowerEdit: Failed to load borrower data:', error)
        if (error.response?.status !== 401) {
          console.error('BorrowerEdit: Error details:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadExistingData()
  }, [searchParams?.get('applicationId'), appState.dealId])
  
  // Auto-focus first field
  useEffect(() => {
    if (!isLoading && firstNameInputRef.current) {
      firstNameInputRef.current.focus()
    }
  }, [isLoading])

  const handleInputChange = (field: string, value: string | boolean | number) => {
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
    return { streetAddress: address, city: '', state: '', zipCode: '' }
  }

  const handleCurrentAddressSave = (addressData: AddressData) => {
    const formattedAddress = `${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zipCode}`
    handleInputChange('currentAddress', formattedAddress)
    handleInputChange('currentAddressStreet', addressData.street)
    handleInputChange('currentAddressCity', addressData.city)
    handleInputChange('currentAddressState', addressData.state)
    handleInputChange('currentAddressZip', addressData.zipCode)
    setIsAddressModalOpen(false)
  }

  const handlePreviousAddressSave = (addressData: AddressData) => {
    const formattedAddress = `${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zipCode}`
    if (editingPreviousAddressIndex !== null) {
      // Update the specific previous address in the array
      const updated = [...formData.previousAddresses]
      updated[editingPreviousAddressIndex] = {
        ...updated[editingPreviousAddressIndex],
        address: formattedAddress,
        addressStreet: addressData.street,
        addressCity: addressData.city,
        addressState: addressData.state,
        addressZip: addressData.zipCode,
      }
      handleInputChange('previousAddresses', updated)
      setEditingPreviousAddressIndex(null)
    }
    setIsPreviousAddressModalOpen(false)
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
    // Validate primary phone (from borrower-info-1) - required
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    if (!formData.phoneType.trim()) {
      newErrors.phoneType = 'Phone type is required'
    }
    // Validate additional phone if hasAdditionalPhone is true
    if (formData.hasAdditionalPhone) {
      if (!formData.additionalPhone.trim()) {
        newErrors.additionalPhone = 'Additional phone number is required'
      }
      if (!formData.additionalPhoneType.trim()) {
        newErrors.additionalPhoneType = 'Additional phone type is required'
      }
      // Ensure additional phone type is different from primary
      if (formData.additionalPhoneType === formData.phoneType) {
        newErrors.additionalPhoneType = 'Additional phone type must be different from primary phone type'
      }
    }
    if (!formData.currentAddress.trim()) {
      newErrors.currentAddress = 'Current Address is required'
    }
    // Validate move-in date for current address
    if (!formData.moveInDateCurrent.trim()) {
      newErrors.moveInDateCurrent = 'Move-in date is required'
    }
    
    // Validate previous addresses if needed (less than 2 years at current address)
    const currentDuration = calculateDurationFromMoveInDate(formData.moveInDateCurrent)
    const totalMonthsAtCurrent = (currentDuration.years * 12) + currentDuration.months
    const needsPreviousAddresses = totalMonthsAtCurrent < 24
    
    if (needsPreviousAddresses) {
      // Calculate total months covered by previous addresses
      let totalPreviousMonths = 0
      formData.previousAddresses.forEach((prev, index) => {
        if (!prev.address.trim()) {
          newErrors[`previousAddress_${index}`] = 'Previous address is required'
        }
        if (!prev.moveInDate) {
          newErrors[`previousMoveInDate_${index}`] = 'Move-in date is required'
        }
        if (!prev.moveOutDate) {
          newErrors[`previousMoveOutDate_${index}`] = 'Move-out date is required'
        }
        
        // Validate date order
        if (prev.moveInDate && prev.moveOutDate && new Date(prev.moveInDate) >= new Date(prev.moveOutDate)) {
          newErrors[`previousMoveOutDate_${index}`] = 'Move-out date must be after move-in date'
        }
        
        // Calculate duration for this previous address
        if (prev.moveInDate && prev.moveOutDate) {
          const moveIn = new Date(prev.moveInDate)
          const moveOut = new Date(prev.moveOutDate)
          const diffMonths = Math.floor((moveOut.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
          totalPreviousMonths += diffMonths
        }
      })
      
      // Check if we need more previous addresses
      const remainingMonths = 24 - totalMonthsAtCurrent - totalPreviousMonths
      if (remainingMonths > 0 && formData.previousAddresses.length === 0) {
        newErrors.previousAddress = 'Previous address is required if you have lived at current address less than 2 years'
      }
    }
    if (!formData.maritalStatus) {
      newErrors.maritalStatus = 'Marital Status is required'
    }
    if (!formData.citizenshipType) {
      newErrors.citizenshipType = 'Citizenship Status is required'
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
      // Always save if form is submitted (not just when hasChanges is true)
      // This ensures all data including previous addresses are saved
      if (true) { // Changed from hasChanges to always save
        const { streetAddress, city, state, zipCode } = parseAddress(formData.currentAddress)

        const saveData = {
          borrower: {
            // Personal Information
            firstName: formData.firstName,
            middleName: formData.middleName || undefined,
            lastName: formData.lastName,
            suffix: formData.suffix || undefined,
            ssn: formData.ssn || undefined,
            taxpayerIdentifierValue: formData.ssn || undefined,
            dateOfBirth: formData.dateOfBirth || undefined,
            
            // Contact Information (from borrower-info-1)
            email: formData.email,
            phone: formData.phone ? parsePhoneNumber(formData.phone) : undefined,
            phoneType: formData.phoneType || 'MOBILE',
            // Additional phone (if provided)
            homePhone: formData.hasAdditionalPhone && formData.additionalPhoneType === 'HOME' ? parsePhoneNumber(formData.additionalPhone) : undefined,
            mobilePhone: formData.hasAdditionalPhone && formData.additionalPhoneType === 'MOBILE' ? parsePhoneNumber(formData.additionalPhone) : undefined,
            workPhone: formData.hasAdditionalPhone && formData.additionalPhoneType === 'WORK' ? parsePhoneNumber(formData.additionalPhone) : undefined,
            workPhoneExt: formData.hasAdditionalPhone && formData.additionalPhoneType === 'WORK' ? (formData.workPhoneExt || undefined) : undefined,
            preferredContactMethod: formData.preferredContactMethod,
            
            // Current Address
            address: streetAddress,
            city: city,
            state: state,
            zipCode: zipCode,
            currentAddress: formData.currentAddress,
            // Convert move-in date to years/months for backend
            yearsAtCurrentAddress: (() => {
              const duration = calculateDurationFromMoveInDate(formData.moveInDateCurrent)
              return duration.years > 0 ? duration.years : undefined
            })(),
            monthsAtCurrentAddress: (() => {
              const duration = calculateDurationFromMoveInDate(formData.moveInDateCurrent)
              return duration.months > 0 ? duration.months : undefined
            })(),
            housingStatus: formData.housingStatus || undefined,
            sameAsMailing: formData.sameAsMailing, // From borrower-info-2
            
            // Previous Addresses - convert move-in dates to years/months for backend
            // For now, send the first previous address (backend may need to be updated to support array)
            previousAddress: formData.previousAddresses.length > 0 ? formData.previousAddresses[0].addressStreet : undefined,
            previousAddressCity: formData.previousAddresses.length > 0 ? formData.previousAddresses[0].addressCity : undefined,
            previousAddressState: formData.previousAddresses.length > 0 ? formData.previousAddresses[0].addressState : undefined,
            previousAddressZip: formData.previousAddresses.length > 0 ? formData.previousAddresses[0].addressZip : undefined,
            yearsAtPreviousAddress: formData.previousAddresses.length > 0 ? (() => {
              const prev = formData.previousAddresses[0]
              if (prev.moveInDate && prev.moveOutDate) {
                const moveIn = new Date(prev.moveInDate)
                const moveOut = new Date(prev.moveOutDate)
                const diffMonths = Math.floor((moveOut.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
                const years = Math.floor(diffMonths / 12)
                return years > 0 ? years : undefined
              }
              return undefined
            })() : undefined,
            monthsAtPreviousAddress: formData.previousAddresses.length > 0 ? (() => {
              const prev = formData.previousAddresses[0]
              if (prev.moveInDate && prev.moveOutDate) {
                const moveIn = new Date(prev.moveInDate)
                const moveOut = new Date(prev.moveOutDate)
                const diffMonths = Math.floor((moveOut.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
                const months = diffMonths % 12
                return months > 0 ? months : undefined
              }
              return undefined
            })() : undefined,
            previousHousingStatus: formData.previousAddresses.length > 0 ? formData.previousAddresses[0].housingStatus || undefined : undefined,
            
            // Citizenship & Residency
            citizenshipType: formData.citizenshipType,
            citizenshipResidencyType: formData.citizenshipType,
            alienRegistrationNumber: formData.alienRegistrationNumber || undefined,
            
            // Marital Status
            maritalStatus: formData.maritalStatus,
            
            // Dependents
            dependentCount: formData.dependentCount || undefined, // Send as string, backend will parse
            dependentAges: formData.dependentAges || undefined,
            
            // Military Status
            isVeteran: formData.isVeteran,
            militaryServiceStatus: formData.isVeteran,
            
            // Consents
            acceptTerms: formData.acceptTerms,
            consentToCreditCheck: formData.acceptTerms,
            consentToContact: formData.consentToContact,
          },
        }

        console.log('BorrowerEdit: Saving application data:', { applicationId, saveData })
        const response = await urlaApi.saveApplication(applicationId, saveData)
        console.log('BorrowerEdit: Save response:', response)
        
        if (response.data) {
          appState.syncFromApi(response.data)
        }
        
        resetInitialData(formData)
        console.log('BorrowerEdit: Save completed successfully')
      } else {
        console.log('BorrowerEdit: Skipping save (hasChanges check)')
      }

      // Navigate back to review page
      router.push(`/application/review?applicationId=${applicationId}`)
    } catch (error: any) {
      console.error('Error saving borrower information:', error)
      let errorMessage = 'Failed to save borrower information'
      
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`
      } else if (error.request) {
        errorMessage = 'Network error: Unable to connect to server.'
      } else {
        errorMessage = error.message || 'An unexpected error occurred'
      }
      
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    const applicationId = searchParams?.get('applicationId') || appState.dealId || sessionStorage.getItem('applicationId')
    console.log('BorrowerEdit: Back button clicked, applicationId:', applicationId)
    // Go back to GettingStartedSummary (review page)
    if (applicationId) {
      router.push(`/application/review?applicationId=${applicationId}`)
    } else {
      // Fallback: try to get from sessionStorage
      const storedAppId = sessionStorage.getItem('applicationId')
      if (storedAppId) {
        router.push(`/application/review?applicationId=${storedAppId}`)
      } else {
        router.push('/application/review')
      }
    }
  }

  // Calculate total months at current address to determine if previous address is needed
  const currentDuration = calculateDurationFromMoveInDate(formData.moveInDateCurrent)
  const totalMonthsAtCurrent = (currentDuration.years * 12) + currentDuration.months
  const needsPreviousAddresses = totalMonthsAtCurrent < 24
  
  // Calculate how many months we need to cover with previous addresses
  const remainingMonths = Math.max(0, 24 - totalMonthsAtCurrent)
  
  // Calculate total months covered by existing previous addresses
  let totalPreviousMonths = 0
  formData.previousAddresses.forEach((prev) => {
    if (prev.moveInDate && prev.moveOutDate) {
      const moveIn = new Date(prev.moveInDate)
      const moveOut = new Date(prev.moveOutDate)
      const diffMonths = Math.floor((moveOut.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
      totalPreviousMonths += diffMonths
    }
  })
  
  // Determine if we need more previous addresses
  const stillNeedsMore = remainingMonths > totalPreviousMonths
  const showPreviousAddresses = needsPreviousAddresses && (formData.previousAddresses.length > 0 || stillNeedsMore)

  if (isLoading) {
    return (
      <Form1003Layout
        sections={sections}
        currentSectionId="getting-started"
        title="Edit Borrower Information"
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
      title="Edit Borrower Information"
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
            Update your complete borrower information. All fields marked with * are required.
          </div>
          <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
        </div>

        {/* Personal Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={firstNameInputRef}
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`mt-1 ${errors.firstName ? 'border-red-500' : ''}`}
                autoComplete="given-name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="middleName" className="text-sm font-medium text-gray-700">
                Middle Name
              </Label>
              <Input
                id="middleName"
                name="middleName"
                type="text"
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
                className="mt-1"
                autoComplete="additional-name"
              />
            </div>

            <div>
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`mt-1 ${errors.lastName ? 'border-red-500' : ''}`}
                autoComplete="family-name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="suffix" className="text-sm font-medium text-gray-700">
                Suffix
              </Label>
              <Select
                id="suffix"
                value={formData.suffix}
                onValueChange={(value) => handleInputChange('suffix', value)}
                className="mt-1"
              >
                <option value="">None</option>
                <option value="Jr">Jr</option>
                <option value="Sr">Sr</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="ssn" className="text-sm font-medium text-gray-700">
                Social Security Number
              </Label>
              <Input
                id="ssn"
                name="ssn"
                type="text"
                value={formData.ssn}
                onChange={(e) => handleInputChange('ssn', e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="mt-1"
                placeholder="XXX-XX-XXXX"
                maxLength={9}
              />
            </div>

            <div>
              <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                Date of Birth
              </Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
          
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Primary Phone (from borrower-info-1) */}
          <div>
            <PhoneInput
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
              onPhoneTypeChange={(value) => handleInputChange('phoneType', value)}
              phoneType={formData.phoneType}
              label="Phone number"
              required={true}
              error={errors.phone}
              showPhoneType={true}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
            {errors.phoneType && (
              <p className="mt-1 text-sm text-red-500">{errors.phoneType}</p>
            )}
          </div>

          {/* Additional Phone Question */}
          <div className="flex items-center space-x-3 py-2">
            <Switch
              id="hasAdditionalPhone"
              checked={formData.hasAdditionalPhone}
              onCheckedChange={(checked) => {
                handleInputChange('hasAdditionalPhone', checked)
                if (!checked) {
                  // Clear additional phone when unchecked
                  handleInputChange('additionalPhone', '')
                  handleInputChange('additionalPhoneType', '')
                  handleInputChange('workPhoneExt', '')
                }
              }}
            />
            <Label htmlFor="hasAdditionalPhone" className="text-sm font-medium text-gray-700 cursor-pointer">
              Do you want to add another phone number?
            </Label>
          </div>

          {/* Additional Phone Input (shown if hasAdditionalPhone is true) */}
          {formData.hasAdditionalPhone && (
            <div className="space-y-4 pl-4 border-l-2 border-gray-200">
              <div>
                <PhoneInput
                  id="additionalPhone"
                  name="additionalPhone"
                  value={formData.additionalPhone}
                  onChange={(value) => handleInputChange('additionalPhone', value)}
                  onPhoneTypeChange={(value) => handleInputChange('additionalPhoneType', value)}
                  phoneType={formData.additionalPhoneType}
                  label="Additional Phone Number"
                  required={formData.hasAdditionalPhone}
                  error={errors.additionalPhone}
                  showPhoneType={true}
                  // Filter out the primary phone type from options
                  excludePhoneTypes={[formData.phoneType]}
                />
                {errors.additionalPhone && (
                  <p className="mt-1 text-sm text-red-500">{errors.additionalPhone}</p>
                )}
                {errors.additionalPhoneType && (
                  <p className="mt-1 text-sm text-red-500">{errors.additionalPhoneType}</p>
                )}
              </div>

              {/* Work Phone Extension (only shown if additional phone type is WORK) */}
              {formData.additionalPhoneType === 'WORK' && (
                <div>
                  <Label htmlFor="workPhoneExt" className="text-sm font-medium text-gray-700">
                    Extension
                  </Label>
                  <Input
                    id="workPhoneExt"
                    name="workPhoneExt"
                    type="text"
                    value={formData.workPhoneExt}
                    onChange={(e) => handleInputChange('workPhoneExt', e.target.value)}
                    className="mt-1"
                    placeholder="Ext"
                    maxLength={10}
                  />
                </div>
              )}
            </div>
          )}

          {/* Preferred Contact Method */}
          <div>
            <Label htmlFor="preferredContactMethod" className="text-sm font-medium text-gray-700">
              Preferred Contact Method
            </Label>
            <Select
              id="preferredContactMethod"
              value={formData.preferredContactMethod}
              onValueChange={(value) => handleInputChange('preferredContactMethod', value)}
              className="mt-1"
            >
              <option value="EMAIL">Email</option>
              {formData.phone && formData.phoneType === 'MOBILE' && <option value="MOBILE">Mobile Phone</option>}
              {formData.phone && formData.phoneType === 'HOME' && <option value="HOME">Home Phone</option>}
              {formData.phone && formData.phoneType === 'WORK' && <option value="WORK">Work Phone</option>}
              {formData.hasAdditionalPhone && formData.additionalPhoneType === 'MOBILE' && <option value="MOBILE">Mobile Phone</option>}
              {formData.hasAdditionalPhone && formData.additionalPhoneType === 'HOME' && <option value="HOME">Home Phone</option>}
              {formData.hasAdditionalPhone && formData.additionalPhoneType === 'WORK' && <option value="WORK">Work Phone</option>}
            </Select>
          </div>
        </div>

        {/* Current Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Current Address</h3>
          
          <div>
            <Label htmlFor="currentAddress" className="text-sm font-medium text-gray-700">
              Current Address <span className="text-red-500">*</span>
            </Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                id="currentAddress"
                name="currentAddress"
                type="text"
                required
                value={formData.currentAddress}
                onClick={() => setIsAddressModalOpen(true)}
                readOnly
                className={`flex-1 ${errors.currentAddress ? 'border-red-500' : ''}`}
                placeholder="Click to enter address"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressModalOpen(true)}
                className="px-4"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Address
              </Button>
            </div>
            {errors.currentAddress && (
              <p className="mt-1 text-sm text-red-500">{errors.currentAddress}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="moveInDateCurrent" className="text-sm font-medium text-gray-700">
                Move-in Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="moveInDateCurrent"
                name="moveInDateCurrent"
                type="date"
                required
                value={formData.moveInDateCurrent}
                onChange={(e) => {
                  handleInputChange('moveInDateCurrent', e.target.value)
                  // Auto-calculate move-out date for previous addresses when current move-in date changes
                  if (formData.previousAddresses.length > 0) {
                    const updatedAddresses = formData.previousAddresses.map((prev, index) => {
                      if (index === 0 && !prev.moveOutDate) {
                        return { ...prev, moveOutDate: e.target.value }
                      }
                      return prev
                    })
                    handleInputChange('previousAddresses', updatedAddresses)
                  }
                }}
                className={`mt-1 ${errors.moveInDateCurrent ? 'border-red-500' : ''}`}
                max={new Date().toISOString().split('T')[0]} // Cannot be in the future
              />
              {errors.moveInDateCurrent && (
                <p className="mt-1 text-sm text-red-500">{errors.moveInDateCurrent}</p>
              )}
              {formData.moveInDateCurrent && (
                <p className="mt-1 text-xs text-gray-500">
                  {(() => {
                    const duration = calculateDurationFromMoveInDate(formData.moveInDateCurrent)
                    return `Duration: ${duration.years} year${duration.years !== 1 ? 's' : ''}, ${duration.months} month${duration.months !== 1 ? 's' : ''}`
                  })()}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="housingStatus" className="text-sm font-medium text-gray-700">
                Housing Status
              </Label>
              <Select
                id="housingStatus"
                value={formData.housingStatus}
                onValueChange={(value) => handleInputChange('housingStatus', value)}
                className="mt-1"
              >
                <option value="">Select</option>
                <option value="Own">Own</option>
                <option value="Rent">Rent</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>

          {/* Same as Mailing Address (from borrower-info-2) */}
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
        </div>

        {/* Previous Addresses Section (conditional - shown until 2 years is covered) */}
        {showPreviousAddresses && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Previous Address{formData.previousAddresses.length !== 1 ? 'es' : ''}
              {stillNeedsMore && <span className="text-red-500 ml-2">*</span>}
            </h3>
            
            {formData.previousAddresses.map((prev, index) => {
              const prevDuration = prev.moveInDate && prev.moveOutDate 
                ? calculateDurationFromMoveInDate(prev.moveInDate)
                : { years: 0, months: 0 }
              const prevMonths = (prevDuration.years * 12) + prevDuration.months
              
              return (
                <div key={index} className="space-y-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium text-gray-800">Previous Address {index + 1}</h4>
                    {formData.previousAddresses.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updated = formData.previousAddresses.filter((_, i) => i !== index)
                          handleInputChange('previousAddresses', updated)
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Address <span className="text-red-500">*</span>
                    </Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        type="text"
                        required
                        value={prev.address}
                        onClick={() => {
                          setIsPreviousAddressModalOpen(true)
                          setEditingPreviousAddressIndex(index)
                        }}
                        readOnly
                        className={`flex-1 ${errors[`previousAddress_${index}`] ? 'border-red-500' : ''}`}
                        placeholder="Click to enter address"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsPreviousAddressModalOpen(true)
                          setEditingPreviousAddressIndex(index)
                        }}
                        className="px-4"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Address
                      </Button>
                    </div>
                    {errors[`previousAddress_${index}`] && (
                      <p className="mt-1 text-sm text-red-500">{errors[`previousAddress_${index}`]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Move-in Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        required
                        value={prev.moveInDate}
                        onChange={(e) => {
                          const updated = [...formData.previousAddresses]
                          updated[index] = { ...updated[index], moveInDate: e.target.value }
                          handleInputChange('previousAddresses', updated)
                        }}
                        className={`mt-1 ${errors[`previousMoveInDate_${index}`] ? 'border-red-500' : ''}`}
                        max={prev.moveOutDate || formData.moveInDateCurrent || new Date().toISOString().split('T')[0]}
                      />
                      {errors[`previousMoveInDate_${index}`] && (
                        <p className="mt-1 text-sm text-red-500">{errors[`previousMoveInDate_${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Move-out Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        required
                        value={prev.moveOutDate}
                        onChange={(e) => {
                          const updated = [...formData.previousAddresses]
                          updated[index] = { ...updated[index], moveOutDate: e.target.value }
                          handleInputChange('previousAddresses', updated)
                        }}
                        className={`mt-1 ${errors[`previousMoveOutDate_${index}`] ? 'border-red-500' : ''}`}
                        min={prev.moveInDate}
                        max={formData.moveInDateCurrent || new Date().toISOString().split('T')[0]}
                      />
                      {errors[`previousMoveOutDate_${index}`] && (
                        <p className="mt-1 text-sm text-red-500">{errors[`previousMoveOutDate_${index}`]}</p>
                      )}
                      {prev.moveInDate && prev.moveOutDate && (
                        <p className="mt-1 text-xs text-gray-500">
                          Duration: {prevDuration.years} year{prevDuration.years !== 1 ? 's' : ''}, {prevDuration.months} month{prevDuration.months !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Housing Status
                      </Label>
                      <Select
                        value={prev.housingStatus}
                        onValueChange={(value) => {
                          const updated = [...formData.previousAddresses]
                          updated[index] = { ...updated[index], housingStatus: value }
                          handleInputChange('previousAddresses', updated)
                        }}
                        className="mt-1"
                      >
                        <option value="">Select</option>
                        <option value="Own">Own</option>
                        <option value="Rent">Rent</option>
                        <option value="Other">Other</option>
                      </Select>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {stillNeedsMore && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Additional address required:</strong> You need to provide {remainingMonths - totalPreviousMonths} more month{remainingMonths - totalPreviousMonths !== 1 ? 's' : ''} of address history to cover the 2-year requirement.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newAddress = {
                      address: '',
                      addressStreet: '',
                      addressCity: '',
                      addressState: '',
                      addressZip: '',
                      moveInDate: '',
                      moveOutDate: formData.previousAddresses.length > 0 
                        ? formData.previousAddresses[formData.previousAddresses.length - 1].moveInDate 
                        : formData.moveInDateCurrent || '',
                      housingStatus: '',
                    }
                    handleInputChange('previousAddresses', [...formData.previousAddresses, newAddress])
                  }}
                  className="mt-2"
                >
                  Add Another Previous Address
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Citizenship & Residency Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Citizenship & Residency</h3>
          
          <div>
            <Label htmlFor="citizenshipType" className="text-sm font-medium text-gray-700">
              Citizenship Status <span className="text-red-500">*</span>
            </Label>
            <Select
              id="citizenshipType"
              value={formData.citizenshipType}
              onValueChange={(value) => handleInputChange('citizenshipType', value)}
              required
              className={`mt-1 ${errors.citizenshipType ? 'border-red-500' : ''}`}
            >
              <option value="">Select</option>
              <option value="USCitizen">U.S. Citizen</option>
              <option value="PermanentResidentAlien">Permanent Resident Alien</option>
              <option value="NonPermanentResidentAlien">Non-Permanent Resident Alien</option>
            </Select>
            {errors.citizenshipType && (
              <p className="mt-1 text-sm text-red-500">{errors.citizenshipType}</p>
            )}
          </div>

          {(formData.citizenshipType === 'PermanentResidentAlien' || formData.citizenshipType === 'NonPermanentResidentAlien') && (
            <div>
              <Label htmlFor="alienRegistrationNumber" className="text-sm font-medium text-gray-700">
                Alien Registration Number
              </Label>
              <Input
                id="alienRegistrationNumber"
                name="alienRegistrationNumber"
                type="text"
                value={formData.alienRegistrationNumber}
                onChange={(e) => handleInputChange('alienRegistrationNumber', e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>

        {/* Marital Status Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Marital Status</h3>
          
          <div>
            <Label htmlFor="maritalStatus" className="text-sm font-medium text-gray-700">
              Marital Status <span className="text-red-500">*</span>
            </Label>
            <Select
              id="maritalStatus"
              value={formData.maritalStatus}
              onValueChange={(value) => handleInputChange('maritalStatus', value)}
              required
              className={`mt-1 ${errors.maritalStatus ? 'border-red-500' : ''}`}
            >
              <option value="">Select</option>
              <option value="Married">Married</option>
              <option value="Separated">Separated</option>
              <option value="Unmarried">Unmarried</option>
            </Select>
            {errors.maritalStatus && (
              <p className="mt-1 text-sm text-red-500">{errors.maritalStatus}</p>
            )}
          </div>
        </div>

        {/* Dependents Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Dependents</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dependentCount" className="text-sm font-medium text-gray-700">
                Number of Dependents (excluding co-borrower)
              </Label>
              <Input
                id="dependentCount"
                name="dependentCount"
                type="number"
                min="0"
                value={formData.dependentCount}
                onChange={(e) => handleInputChange('dependentCount', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="dependentAges" className="text-sm font-medium text-gray-700">
                Ages of Dependents (comma-separated)
              </Label>
              <Input
                id="dependentAges"
                name="dependentAges"
                type="text"
                value={formData.dependentAges}
                onChange={(e) => handleInputChange('dependentAges', e.target.value)}
                className="mt-1"
                placeholder="e.g., 5, 8, 12"
              />
            </div>
          </div>
        </div>

        {/* Military Status Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Military Status</h3>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isVeteran"
              checked={formData.isVeteran}
              onCheckedChange={(checked) => handleInputChange('isVeteran', checked)}
            />
            <Label htmlFor="isVeteran" className="text-sm font-medium text-gray-700">
              Are you a veteran or active duty military member?
            </Label>
          </div>
        </div>

        {/* Consents Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Consents</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => handleInputChange('acceptTerms', checked)}
              />
              <Label htmlFor="acceptTerms" className="text-sm font-medium text-gray-700">
                I accept the Terms of Service and consent to credit check <span className="text-red-500">*</span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="consentToContact"
                checked={formData.consentToContact}
                onCheckedChange={(checked) => handleInputChange('consentToContact', checked)}
              />
              <Label htmlFor="consentToContact" className="text-sm font-medium text-gray-700">
                I consent to be contacted regarding my loan application <span className="text-red-500">*</span>
              </Label>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 flex justify-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="px-8"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Address Modals */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleCurrentAddressSave}
        initialData={{
          street: formData.currentAddressStreet,
          city: formData.currentAddressCity,
          state: formData.currentAddressState,
          zipCode: formData.currentAddressZip,
        }}
      />

      <AddressModal
        isOpen={isPreviousAddressModalOpen}
        onClose={() => {
          setIsPreviousAddressModalOpen(false)
          setEditingPreviousAddressIndex(null)
        }}
        onSave={handlePreviousAddressSave}
        initialData={{
          street: editingPreviousAddressIndex !== null && formData.previousAddresses[editingPreviousAddressIndex]
            ? formData.previousAddresses[editingPreviousAddressIndex].addressStreet
            : formData.previousAddressStreet,
          city: editingPreviousAddressIndex !== null && formData.previousAddresses[editingPreviousAddressIndex]
            ? formData.previousAddresses[editingPreviousAddressIndex].addressCity
            : formData.previousAddressCity,
          state: editingPreviousAddressIndex !== null && formData.previousAddresses[editingPreviousAddressIndex]
            ? formData.previousAddresses[editingPreviousAddressIndex].addressState
            : formData.previousAddressState,
          zipCode: editingPreviousAddressIndex !== null && formData.previousAddresses[editingPreviousAddressIndex]
            ? formData.previousAddresses[editingPreviousAddressIndex].addressZip
            : formData.previousAddressZip,
        }}
      />
    </Form1003Layout>
  )
}
