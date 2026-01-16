'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AddressModal, AddressData } from '@/components/urla/AddressModal'
import { MapPin } from 'lucide-react'

export default function RefinanceBorrowerInfoPage2() {
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

  const sections: FormSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      completed: true,
    },
    {
      id: 'getting-to-know-you',
      title: 'Getting to Know You',
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

  useEffect(() => {
    // Check if borrower was already created (applicationId exists)
    const applicationId = sessionStorage.getItem('applicationId')
    if (!applicationId) {
      // If no applicationId, redirect back to first form
      router.push('/refinance/borrower-info-1')
      return
    }
  }, [router])

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

    // Get application ID from sessionStorage (set by first form)
    const applicationId = sessionStorage.getItem('applicationId')
    if (!applicationId) {
      setErrors({ submit: 'Application not found. Please start over.' })
      return
    }

    try {
      // Parse address
      const { streetAddress, city, state, zipCode } = parseAddress(formData.currentAddress)

      // Save borrower data (marital status, address, military status, and consents) to database
      const { urlaApi } = await import('@/lib/api')
      await urlaApi.saveApplication(parseInt(applicationId), {
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
      })

      // Clear session storage
      sessionStorage.removeItem('refinanceData')
      sessionStorage.removeItem('borrowerInfo1Data')

      // Navigate to the co-borrower question page
      router.push(`/applications/${applicationId}/co-borrower-question`)
    } catch (error: any) {
      console.error('Failed to save borrower information:', error)
      setErrors({ 
        submit: error.response?.data?.error || error.message || 'Failed to save information. Please try again.' 
      })
    }
  }

  const handleBack = () => {
    router.push('/refinance/borrower-info-1')
  }

  return (
    <Form1003Layout
      sections={sections}
      currentSectionId="getting-to-know-you"
      title="Getting to Know You"
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
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-normal text-base py-4 px-8 h-[55px] rounded transition-colors shadow-sm max-w-md"
          >
            Continue
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
