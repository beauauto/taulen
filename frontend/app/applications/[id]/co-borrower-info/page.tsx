'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AddressModal, AddressData } from '@/components/urla/AddressModal'
import { MapPin } from 'lucide-react'

export default function CoBorrowerInfoPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params?.id as string

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    phone: '',
    phoneType: '',
    maritalStatus: '',
    isVeteran: false,
    liveTogether: true,
    currentAddress: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  const sections: FormSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      completed: true,
    },
    {
      id: 'getting-to-know-you',
      title: 'Loan & Property',
      current: true,
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
    if (!formData.phoneType) {
      newErrors.phoneType = 'Phone type is required'
    }
    if (!formData.maritalStatus) {
      newErrors.maritalStatus = 'Co-applicant Marital Status is required'
    }
    if (!formData.liveTogether && !formData.currentAddress.trim()) {
      newErrors.currentAddress = 'Current Address is required when not living together'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // TODO: Save co-borrower information to the application
      // For now, just navigate to the application page
      // In the future, this should call an API to save co-borrower data
      
      if (applicationId) {
        router.push(`/applications/${applicationId}`)
      } else {
        router.push('/applications')
      }
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
    }
  }

  const handleBack = () => {
    if (applicationId) {
      router.push(`/applications/${applicationId}/co-borrower-question`)
    }
  }

  return (
    <>
      <Form1003Layout
        sections={sections}
        currentSectionId="getting-to-know-you"
        title="Loan & Property"
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

          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                Co-applicant First Name <span className="text-red-500">*</span>
              </Label>
              <Input
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
                Co-applicant Middle Name
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Optional</span>
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
                Co-applicant Last Name <span className="text-red-500">*</span>
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
                Co-applicant Suffix
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Optional</span>
              </Label>
              <Input
                id="suffix"
                name="suffix"
                type="text"
                maxLength={4}
                value={formData.suffix}
                onChange={(e) => handleInputChange('suffix', e.target.value)}
                className="mt-1"
                autoComplete="honorific-suffix"
                placeholder="Jr., Sr., III, IV, etc."
              />
              <p className="mt-1 text-xs text-gray-500">
                <strong>Examples:</strong> Jr., Sr., III, IV, etc.
              </p>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Co-applicant Email Address <span className="text-red-500">*</span>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Co-applicant Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phoneType" className="text-sm font-medium text-gray-700">
                  Phone type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.phoneType}
                  onValueChange={(value) => handleInputChange('phoneType', value)}
                  required
                  className={`mt-1 ${errors.phoneType ? 'border-red-500' : ''}`}
                >
                  <option value=""> </option>
                  <option value="HOME">Home</option>
                  <option value="MOBILE">Mobile</option>
                  <option value="WORK">Work</option>
                  <option value="OTHER">Other</option>
                </Select>
                {errors.phoneType && (
                  <p className="mt-1 text-sm text-red-500">{errors.phoneType}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="maritalStatus" className="text-sm font-medium text-gray-700">
                Co-applicant Marital Status <span className="text-red-500">*</span>
              </Label>
              <Select
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

            {!formData.liveTogether && (
              <div>
                <Label htmlFor="currentAddress" className="text-sm font-medium text-gray-700">
                  Current Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="currentAddress"
                    name="currentAddress"
                    type="text"
                    required={!formData.liveTogether}
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
            )}
          </div>

          <div className="pt-4 flex justify-center">
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-normal text-base py-4 px-8 h-[55px] rounded transition-colors shadow-sm max-w-md"
            >
              Continue
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
