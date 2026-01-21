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

export default function BorrowerEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const appState = useApplicationState()
  
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    ssn: '',
    dateOfBirth: '',
    
    // Contact Information
    email: '',
    homePhone: '',
    mobilePhone: '',
    workPhone: '',
    workPhoneExt: '',
    preferredContactMethod: 'EMAIL',
    
    // Current Address
    currentAddress: '',
    currentAddressStreet: '',
    currentAddressCity: '',
    currentAddressState: '',
    currentAddressZip: '',
    yearsAtCurrentAddress: '',
    monthsAtCurrentAddress: '',
    housingStatus: '',
    
    // Previous Address (if less than 2 years at current)
    hasPreviousAddress: false,
    previousAddress: '',
    previousAddressStreet: '',
    previousAddressCity: '',
    previousAddressState: '',
    previousAddressZip: '',
    yearsAtPreviousAddress: '',
    monthsAtPreviousAddress: '',
    previousHousingStatus: '',
    
    // Citizenship & Residency
    citizenshipType: '',
    alienRegistrationNumber: '',
    
    // Marital Status
    maritalStatus: '',
    
    // Dependents
    dependentCount: '',
    dependentAges: '',
    
    // Military Status
    isVeteran: false,
    
    // Consents
    acceptTerms: false,
    consentToContact: false,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isPreviousAddressModalOpen, setIsPreviousAddressModalOpen] = useState(false)
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
      const applicationIdParam = searchParams?.get('applicationId')
      const applicationId = applicationIdParam || appState.dealId
      
      if (applicationIdParam && !appState.dealId) {
        appState.setDealId(applicationIdParam)
      }
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      
      if (!applicationId || !token) {
        setIsLoading(false)
        return
      }
      
      try {
        const appResponse = await urlaApi.getApplication(applicationId)
        const appData = appResponse.data
        
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
          
          const loadedData = {
            // Personal Information
            firstName: borrower.firstName || '',
            middleName: borrower.middleName || '',
            lastName: borrower.lastName || '',
            suffix: borrower.suffix || '',
            ssn: borrower.ssn || borrower.taxpayerIdentifierValue || '',
            dateOfBirth: borrower.dateOfBirth || borrower.birthDate || '',
            
            // Contact Information
            email: borrower.email || '',
            homePhone: borrower.homePhone ? formatPhoneNumber(borrower.homePhone) : '',
            mobilePhone: borrower.phone && borrower.phoneType === 'MOBILE' ? formatPhoneNumber(borrower.phone) : '',
            workPhone: borrower.workPhone ? formatPhoneNumber(borrower.workPhone) : '',
            workPhoneExt: borrower.workPhoneExt || borrower.workPhoneExtension || '',
            preferredContactMethod: borrower.preferredContactMethod || 'EMAIL',
            
            // Current Address
            currentAddress: borrower.currentAddress || borrower.currentResidence?.fullAddress || '',
            currentAddressStreet: currentAddressParts.street,
            currentAddressCity: currentAddressParts.city,
            currentAddressState: currentAddressParts.state,
            currentAddressZip: currentAddressParts.zip,
            yearsAtCurrentAddress: borrower.yearsAtCurrentAddress || '',
            monthsAtCurrentAddress: borrower.monthsAtCurrentAddress || '',
            housingStatus: borrower.housingStatus || '',
            
            // Previous Address
            hasPreviousAddress: false, // Will be determined based on years/months
            previousAddress: borrower.previousAddress || '',
            previousAddressStreet: '',
            previousAddressCity: '',
            previousAddressState: '',
            previousAddressZip: '',
            yearsAtPreviousAddress: borrower.yearsAtPreviousAddress || '',
            monthsAtPreviousAddress: borrower.monthsAtPreviousAddress || '',
            previousHousingStatus: borrower.previousHousingStatus || '',
            
            // Citizenship & Residency
            citizenshipType: borrower.citizenshipType || borrower.citizenshipResidencyType || '',
            alienRegistrationNumber: borrower.alienRegistrationNumber || '',
            
            // Marital Status
            maritalStatus: borrower.maritalStatus || '',
            
            // Dependents
            dependentCount: borrower.dependentCount?.toString() || '',
            dependentAges: borrower.dependentAges || '',
            
            // Military Status
            isVeteran: borrower.isVeteran || borrower.militaryServiceStatus || false,
            
            // Consents
            acceptTerms: borrower.acceptTerms || borrower.consentToCreditCheck || false,
            consentToContact: borrower.consentToContact || false,
          }
          
          // Determine if previous address should be shown
          const totalMonths = (parseInt(loadedData.yearsAtCurrentAddress || '0') * 12) + parseInt(loadedData.monthsAtCurrentAddress || '0')
          loadedData.hasPreviousAddress = totalMonths < 24
          
          setFormData(loadedData)
          resetInitialData(loadedData)
        }
      } catch (error: any) {
        if (error.response?.status !== 401) {
          console.error('Failed to load borrower data:', error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadExistingData()
  }, [searchParams, appState.dealId])
  
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
    handleInputChange('previousAddress', formattedAddress)
    handleInputChange('previousAddressStreet', addressData.street)
    handleInputChange('previousAddressCity', addressData.city)
    handleInputChange('previousAddressState', addressData.state)
    handleInputChange('previousAddressZip', addressData.zipCode)
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
    if (!formData.mobilePhone.trim() && !formData.homePhone.trim() && !formData.workPhone.trim()) {
      newErrors.mobilePhone = 'At least one phone number is required'
    }
    if (!formData.currentAddress.trim()) {
      newErrors.currentAddress = 'Current Address is required'
    }
    if (formData.hasPreviousAddress && !formData.previousAddress.trim()) {
      newErrors.previousAddress = 'Previous Address is required if you have lived at current address less than 2 years'
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
      if (hasChanges) {
        const { streetAddress, city, state, zipCode } = parseAddress(formData.currentAddress)
        const previousAddressParts = formData.hasPreviousAddress ? parseAddress(formData.previousAddress) : null

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
            
            // Contact Information
            email: formData.email,
            homePhone: formData.homePhone ? parsePhoneNumber(formData.homePhone) : undefined,
            mobilePhone: formData.mobilePhone ? parsePhoneNumber(formData.mobilePhone) : undefined,
            workPhone: formData.workPhone ? parsePhoneNumber(formData.workPhone) : undefined,
            workPhoneExt: formData.workPhoneExt || undefined,
            preferredContactMethod: formData.preferredContactMethod,
            
            // Current Address
            address: streetAddress,
            city: city,
            state: state,
            zipCode: zipCode,
            currentAddress: formData.currentAddress,
            yearsAtCurrentAddress: formData.yearsAtCurrentAddress ? parseInt(formData.yearsAtCurrentAddress) : undefined,
            monthsAtCurrentAddress: formData.monthsAtCurrentAddress ? parseInt(formData.monthsAtCurrentAddress) : undefined,
            housingStatus: formData.housingStatus || undefined,
            
            // Previous Address
            previousAddress: previousAddressParts ? previousAddressParts.streetAddress : undefined,
            previousAddressCity: previousAddressParts ? previousAddressParts.city : undefined,
            previousAddressState: previousAddressParts ? previousAddressParts.state : undefined,
            previousAddressZip: previousAddressParts ? previousAddressParts.zipCode : undefined,
            yearsAtPreviousAddress: formData.yearsAtPreviousAddress ? parseInt(formData.yearsAtPreviousAddress) : undefined,
            monthsAtPreviousAddress: formData.monthsAtPreviousAddress ? parseInt(formData.monthsAtPreviousAddress) : undefined,
            previousHousingStatus: formData.previousHousingStatus || undefined,
            
            // Citizenship & Residency
            citizenshipType: formData.citizenshipType,
            citizenshipResidencyType: formData.citizenshipType,
            alienRegistrationNumber: formData.alienRegistrationNumber || undefined,
            
            // Marital Status
            maritalStatus: formData.maritalStatus,
            
            // Dependents
            dependentCount: formData.dependentCount ? parseInt(formData.dependentCount) : undefined,
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

        const response = await urlaApi.saveApplication(applicationId, saveData)
        
        if (response.data) {
          appState.syncFromApi(response.data)
        }
        
        resetInitialData(formData)
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
    const applicationId = searchParams?.get('applicationId') || appState.dealId
    if (applicationId) {
      router.push(`/application/review?applicationId=${applicationId}`)
    } else {
      router.push('/application/review')
    }
  }

  // Calculate total months at current address to determine if previous address is needed
  const totalMonthsAtCurrent = (parseInt(formData.yearsAtCurrentAddress || '0') * 12) + parseInt(formData.monthsAtCurrentAddress || '0')
  const showPreviousAddress = totalMonthsAtCurrent < 24 || formData.hasPreviousAddress

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mobilePhone" className="text-sm font-medium text-gray-700">
                Mobile Phone
              </Label>
              <PhoneInput
                id="mobilePhone"
                name="mobilePhone"
                value={formData.mobilePhone}
                onChange={(value) => handleInputChange('mobilePhone', value)}
                className={`mt-1 ${errors.mobilePhone ? 'border-red-500' : ''}`}
                required={false}
                showPhoneType={false}
              />
              {errors.mobilePhone && (
                <p className="mt-1 text-sm text-red-500">{errors.mobilePhone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="homePhone" className="text-sm font-medium text-gray-700">
                Home Phone
              </Label>
              <PhoneInput
                id="homePhone"
                name="homePhone"
                value={formData.homePhone}
                onChange={(value) => handleInputChange('homePhone', value)}
                className="mt-1"
                required={false}
                showPhoneType={false}
              />
            </div>

            <div>
              <Label htmlFor="workPhone" className="text-sm font-medium text-gray-700">
                Work Phone
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <PhoneInput
                    id="workPhone"
                    name="workPhone"
                    value={formData.workPhone}
                    onChange={(value) => handleInputChange('workPhone', value)}
                    className="mt-1"
                    required={false}
                    showPhoneType={false}
                  />
                </div>
                <div>
                  <Label htmlFor="workPhoneExt" className="text-sm font-medium text-gray-700">
                    Ext
                  </Label>
                  <Input
                    id="workPhoneExt"
                    name="workPhoneExt"
                    type="text"
                    value={formData.workPhoneExt}
                    onChange={(e) => handleInputChange('workPhoneExt', e.target.value)}
                    className="mt-1"
                    placeholder="Ext"
                  />
                </div>
              </div>
            </div>

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
                <option value="MOBILE">Mobile Phone</option>
                <option value="HOME">Home Phone</option>
                <option value="WORK">Work Phone</option>
              </Select>
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="yearsAtCurrentAddress" className="text-sm font-medium text-gray-700">
                Years at Current Address
              </Label>
              <Input
                id="yearsAtCurrentAddress"
                name="yearsAtCurrentAddress"
                type="number"
                min="0"
                value={formData.yearsAtCurrentAddress}
                onChange={(e) => handleInputChange('yearsAtCurrentAddress', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="monthsAtCurrentAddress" className="text-sm font-medium text-gray-700">
                Months at Current Address
              </Label>
              <Input
                id="monthsAtCurrentAddress"
                name="monthsAtCurrentAddress"
                type="number"
                min="0"
                max="11"
                value={formData.monthsAtCurrentAddress}
                onChange={(e) => handleInputChange('monthsAtCurrentAddress', e.target.value)}
                className="mt-1"
              />
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
        </div>

        {/* Previous Address Section (conditional) */}
        {showPreviousAddress && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Previous Address</h3>
            
            <div>
              <Label htmlFor="previousAddress" className="text-sm font-medium text-gray-700">
                Previous Address {showPreviousAddress && <span className="text-red-500">*</span>}
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  id="previousAddress"
                  name="previousAddress"
                  type="text"
                  required={showPreviousAddress}
                  value={formData.previousAddress}
                  onClick={() => setIsPreviousAddressModalOpen(true)}
                  readOnly
                  className={`flex-1 ${errors.previousAddress ? 'border-red-500' : ''}`}
                  placeholder="Click to enter address"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPreviousAddressModalOpen(true)}
                  className="px-4"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Address
                </Button>
              </div>
              {errors.previousAddress && (
                <p className="mt-1 text-sm text-red-500">{errors.previousAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="yearsAtPreviousAddress" className="text-sm font-medium text-gray-700">
                  Years at Previous Address
                </Label>
                <Input
                  id="yearsAtPreviousAddress"
                  name="yearsAtPreviousAddress"
                  type="number"
                  min="0"
                  value={formData.yearsAtPreviousAddress}
                  onChange={(e) => handleInputChange('yearsAtPreviousAddress', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="monthsAtPreviousAddress" className="text-sm font-medium text-gray-700">
                  Months at Previous Address
                </Label>
                <Input
                  id="monthsAtPreviousAddress"
                  name="monthsAtPreviousAddress"
                  type="number"
                  min="0"
                  max="11"
                  value={formData.monthsAtPreviousAddress}
                  onChange={(e) => handleInputChange('monthsAtPreviousAddress', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="previousHousingStatus" className="text-sm font-medium text-gray-700">
                  Housing Status
                </Label>
                <Select
                  id="previousHousingStatus"
                  value={formData.previousHousingStatus}
                  onValueChange={(value) => handleInputChange('previousHousingStatus', value)}
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
        onClose={() => setIsPreviousAddressModalOpen(false)}
        onSave={handlePreviousAddressSave}
        initialData={{
          street: formData.previousAddressStreet,
          city: formData.previousAddressCity,
          state: formData.previousAddressState,
          zipCode: formData.previousAddressZip,
        }}
      />
    </Form1003Layout>
  )
}
