'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Info, MapPin } from 'lucide-react'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { AddressModal, AddressData } from '@/components/urla/AddressModal'

interface BorrowerInfoPageProps {
  applicationId: number
  initialData?: {
    firstName?: string
    middleName?: string
    lastName?: string
    suffix?: string
    email?: string
    phone?: string
    currentAddress?: string
    maritalStatus?: string
    isMilitary?: boolean
  }
  onNext: (data: BorrowerInfoData) => void
  onBack?: () => void
}

export interface BorrowerInfoData {
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  email: string
  confirmEmail: string
  phone: string
  phoneType: 'HOME' | 'MOBILE' | 'WORK' | 'OTHER'
  maritalStatus: 'MARRIED' | 'SEPARATED' | 'UNMARRIED'
  isMilitary: boolean
  currentAddress: string
  sameAsMailing: boolean
  acceptTerms: boolean
  acceptContact: boolean
}

export function BorrowerInfoPage({ applicationId, initialData, onNext, onBack }: BorrowerInfoPageProps) {
  const [formData, setFormData] = useState<BorrowerInfoData>({
    firstName: initialData?.firstName || '',
    middleName: initialData?.middleName || '',
    lastName: initialData?.lastName || '',
    suffix: initialData?.suffix || '',
    email: initialData?.email || '',
    confirmEmail: initialData?.email || '',
    phone: initialData?.phone || '',
    phoneType: 'MOBILE',
    maritalStatus: (initialData?.maritalStatus as BorrowerInfoData['maritalStatus']) || 'UNMARRIED',
    isMilitary: initialData?.isMilitary || false,
    currentAddress: initialData?.currentAddress || '',
    sameAsMailing: true,
    acceptTerms: false,
    acceptContact: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  // Update form data when initialData changes (e.g., after API loads)
  useEffect(() => {
    if (initialData) {
      console.log('BorrowerInfoPage: initialData changed:', initialData)
      console.log('BorrowerInfoPage: currentAddress in initialData:', initialData.currentAddress)
      setFormData(prev => {
        const updated = {
          ...prev,
          firstName: initialData.firstName || prev.firstName,
          middleName: initialData.middleName || prev.middleName,
          lastName: initialData.lastName || prev.lastName,
          suffix: initialData.suffix || prev.suffix,
          email: initialData.email || prev.email,
          confirmEmail: initialData.email || prev.confirmEmail,
          phone: initialData.phone || prev.phone,
          currentAddress: initialData.currentAddress || prev.currentAddress,
          maritalStatus: (initialData.maritalStatus as BorrowerInfoData['maritalStatus']) || prev.maritalStatus,
          isMilitary: initialData.isMilitary !== undefined ? initialData.isMilitary : prev.isMilitary,
        }
        console.log('BorrowerInfoPage: Updated formData.currentAddress:', updated.currentAddress)
        return updated
      })
    }
  }, [initialData])

  const handleInputChange = (field: keyof BorrowerInfoData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleAddressSave = (addressData: AddressData) => {
    // Format address as "Street, City, State Zip"
    const formattedAddress = `${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zipCode}`
    handleInputChange('currentAddress', formattedAddress)
  }

  const handleAddressFieldClick = () => {
    setIsAddressModalOpen(true)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Legal first name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Legal last name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.confirmEmail.trim()) {
      newErrors.confirmEmail = 'Please confirm your email address'
    } else if (formData.email !== formData.confirmEmail) {
      newErrors.confirmEmail = 'Email addresses do not match'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else {
      // Remove non-digits and check length
      const digitsOnly = formData.phone.replace(/\D/g, '')
      if (digitsOnly.length < 10) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }
    if (!formData.currentAddress.trim()) {
      newErrors.currentAddress = 'Current address is required'
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the Terms of Use and Privacy Policy'
    }
    if (!formData.acceptContact) {
      newErrors.acceptContact = 'You must accept the Consent to Contact'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePhoneChange = (value: string) => {
    // Format phone number as user types: (XXX) XXX-XXXX
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
    let formatted = digitsOnly
    
    if (digitsOnly.length > 6) {
      formatted = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`
    } else if (digitsOnly.length > 3) {
      formatted = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`
    } else if (digitsOnly.length > 0) {
      formatted = `(${digitsOnly}`
    }
    
    handleInputChange('phone', formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      onNext(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Define sections for the layout
  const sections: FormSection[] = [
    { id: 'getting-started', title: 'Getting Started', current: true },
    { id: 'getting-to-know-you', title: 'Getting to Know You', locked: true },
    { id: 'assets', title: 'Assets', locked: true },
    { id: 'real-estate', title: 'Real Estate', locked: true },
    { id: 'declarations', title: 'Declarations', locked: true },
    { id: 'demographic-info', title: 'Demographic Info', locked: true },
    { id: 'additional-questions', title: 'Additional Questions', locked: true },
  ]

  return (
    <>
      <Form1003Layout
        sections={sections}
        currentSectionId="getting-started"
        title="Getting Started"
        onBack={onBack}
        showNavigation={true}
      >
      {/* Message */}
      <div className="mb-6">
        <p className="text-base sm:text-lg text-gray-700">
          Please provide a few details about yourself.
        </p>
      </div>

      {/* Form Card */}
      <Card className="shadow-lg border-0">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Legal First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                    required
                    className={errors.firstName ? 'border-red-500' : ''}
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                    <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <Input
                    id="middleName"
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    placeholder="Michael"
                    autoComplete="additional-name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Legal Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                    required
                    className={errors.lastName ? 'border-red-500' : ''}
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="suffix" className="block text-sm font-medium text-gray-700 mb-2">
                    Suffix
                    <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <Input
                    id="suffix"
                    type="text"
                    value={formData.suffix}
                    onChange={(e) => handleInputChange('suffix', e.target.value)}
                    placeholder="Jr., Sr., III, IV"
                    maxLength={4}
                    autoComplete="honorific-suffix"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Examples: Jr., Sr., III, IV, etc.
                  </p>
                </div>
              </div>

              {/* Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="you@example.com"
                    required
                    className={errors.email ? 'border-red-500' : ''}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    value={formData.confirmEmail}
                    onChange={(e) => handleInputChange('confirmEmail', e.target.value)}
                    placeholder="you@example.com"
                    required
                    className={errors.confirmEmail ? 'border-red-500' : ''}
                    autoComplete="email"
                  />
                  {errors.confirmEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmEmail}</p>
                  )}
                </div>
              </div>

              {/* Phone Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                    className={errors.phone ? 'border-red-500' : ''}
                    autoComplete="tel"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phoneType" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="phoneType"
                    value={formData.phoneType}
                    onChange={(e) => handleInputChange('phoneType', e.target.value as BorrowerInfoData['phoneType'])}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select...</option>
                    <option value="HOME">Home</option>
                    <option value="MOBILE">Mobile</option>
                    <option value="WORK">Work</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Marital Status */}
              <div>
                <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  Marital Status <span className="text-red-500">*</span>
                  <button
                    type="button"
                    className="ml-2 text-indigo-600 hover:text-indigo-700"
                    title="Learn more about Marital Status"
                  >
                    <Info className="w-4 h-4 inline" />
                  </button>
                </label>
                <select
                  id="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={(e) => handleInputChange('maritalStatus', e.target.value as BorrowerInfoData['maritalStatus'])}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">- Select an option -</option>
                  <option value="MARRIED">Married</option>
                  <option value="SEPARATED">Separated</option>
                  <option value="UNMARRIED">Unmarried</option>
                </select>
              </div>

              {/* Military Question */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isMilitary"
                  checked={formData.isMilitary}
                  onChange={(e) => handleInputChange('isMilitary', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isMilitary" className="text-sm text-gray-700 cursor-pointer">
                  Are you currently an active military personnel, a veteran, or a surviving spouse?
                </label>
              </div>

              {/* Current Address */}
              <div>
                <label htmlFor="currentAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="currentAddress"
                    type="text"
                    value={formData.currentAddress}
                    onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                    onClick={handleAddressFieldClick}
                    placeholder="Click to enter address"
                    required
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
                  <p className="mt-1 text-sm text-red-600">{errors.currentAddress}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Click the field or icon to enter your address
                </p>
              </div>

              {/* Same as Mailing Address */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="sameAsMailing"
                  checked={formData.sameAsMailing}
                  onChange={(e) => handleInputChange('sameAsMailing', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="sameAsMailing" className="text-sm text-gray-700 cursor-pointer">
                  Same as mailing address
                </label>
              </div>

              {/* Terms and Consents */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    required
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer">
                    I confirm that I have read and agree to the{' '}
                    <a href="#" className="text-indigo-600 hover:underline">Terms Of Use</a>
                    {' '}(including consent to electronically access your financial information for the purposes of this transaction),{' '}
                    <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>,{' '}
                    <a href="#" className="text-indigo-600 hover:underline">Consent to Use Electronic Signatures and Records</a>, and authorize you to obtain my credit information according to the{' '}
                    <a href="#" className="text-indigo-600 hover:underline">Credit Consent</a>.
                    <span className="text-red-500"> *</span>
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-600 ml-7">{errors.acceptTerms}</p>
                )}

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptContact"
                    checked={formData.acceptContact}
                    onChange={(e) => handleInputChange('acceptContact', e.target.checked)}
                    required
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="acceptContact" className="text-sm text-gray-700 cursor-pointer">
                    I confirm that I have read and agree to the{' '}
                    <a href="#" className="text-indigo-600 hover:underline">Consent to Contact</a>.
                    <span className="text-red-500"> *</span>
                  </label>
                </div>
                {errors.acceptContact && (
                  <p className="text-sm text-red-600 ml-7">{errors.acceptContact}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white max-w-md"
                  size="lg"
                >
                  {isSubmitting ? 'Processing...' : 'Continue'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Form1003Layout>
      {/* Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleAddressSave}
        initialAddress={formData.currentAddress}
      />
    </>
  )
}
