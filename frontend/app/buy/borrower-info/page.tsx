'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BorrowerInfoPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the first form
    router.replace('/buy/borrower-info-1')
  }, [router])

  return null
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    phone: '',
    phoneType: '',
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

  const handleInputChange = (field: string, value: string | boolean) => {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Legal First Name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Legal Last Name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.confirmEmail.trim()) {
      newErrors.confirmEmail = 'Please confirm your email address'
    } else if (formData.email !== formData.confirmEmail) {
      newErrors.confirmEmail = 'Email addresses do not match'
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    }
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    if (!formData.phoneType) {
      newErrors.phoneType = 'Phone type is required'
    }
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

  const parseAddress = (address: string) => {
    // Parse address format: "Street Address, City, State Zip Code"
    const parts = address.split(',').map(p => p.trim())
    if (parts.length >= 3) {
      const streetAddress = parts[0]
      const city = parts[1]
      const stateZip = parts[2].split(' ')
      const state = stateZip[0]
      const zipCode = stateZip.slice(1).join(' ')
      return { streetAddress, city, state, zipCode }
    }
    // Fallback: try to parse as "Street Address, City State Zip"
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
    // If parsing fails, return address as street and empty for others
    return { streetAddress: address, city: '', state: '', zipCode: '' }
  }

  const handleAddressSave = (addressData: AddressData) => {
    // Format address as "Street, City, State Zip"
    const formattedAddress = `${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zipCode}`
    handleInputChange('currentAddress', formattedAddress)
  }

  const handleAddressFieldClick = () => {
    setIsAddressModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // Get loan data from sessionStorage
      const loanDataStr = sessionStorage.getItem('loanWantedData')
      const loanData = loanDataStr ? JSON.parse(loanDataStr) : {}

      // Parse current address
      const { streetAddress, city, state, zipCode } = parseAddress(formData.currentAddress)

      // Prepare API request
      const requestData = {
        email: formData.email,
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        suffix: formData.suffix || undefined,
        phone: formData.phone.replace(/\D/g, ''), // Remove non-digits
        phoneType: formData.phoneType || undefined,
        maritalStatus: formData.maritalStatus || undefined,
        password: formData.password,
        dateOfBirth: '', // Not collected in this form, can be added later
        address: streetAddress,
        city: city,
        state: state,
        zipCode: zipCode,
        loanPurpose: 'Purchase',
        purchasePrice: loanData.purchasePrice ? parseFloat(loanData.purchasePrice) : undefined,
        downPayment: loanData.downPayment ? parseFloat(loanData.downPayment) : undefined,
        loanAmount: loanData.loanAmount ? parseFloat(loanData.loanAmount) : undefined,
      }

      // Call API to create borrower and application
      const response = await urlaApi.verifyAndCreateBorrower(requestData)

      // Save tokens using auth utils
      if (response.data.accessToken) {
        authUtils.setToken(response.data.accessToken)
        authUtils.setRefreshToken(response.data.refreshToken)
        if (response.data.user) {
          authUtils.setUser(response.data.user)
        }
      }

      // Clear session storage after successful creation
      sessionStorage.removeItem('loanWantedData')

      // Navigate to the co-borrower question page
      if (response.data.application?.id) {
        router.push(`/applications/${response.data.application.id}/co-borrower-question`)
      } else {
        router.push('/applications')
      }
    } catch (error: any) {
      console.error('Error creating application:', error)
      let errorMessage = 'Failed to create application'
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error: Unable to connect to server. Please check if the backend server is running.'
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred'
      }
      
      setErrors({ submit: errorMessage })
    }
  }

  const handleBack = () => {
    router.push('/buy')
  }

  return (
    <>
    <Form1003Layout
      sections={sections}
      currentSectionId="getting-to-know-you"
      title="Getting to Know You"
      onBack={handleBack}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        {/* Message */}
        <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
          <div className="whitespace-pre-line">
            Please provide a few details about yourself.
          </div>
          {/* Speech bubble pointer - hidden on desktop */}
          <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Legal First Name */}
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
              Legal First Name <span className="text-red-500">*</span>
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

          {/* Middle Name */}
          <div>
            <Label htmlFor="middleName" className="text-sm font-medium text-gray-700">
              Middle Name
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

          {/* Legal Last Name */}
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
              Legal Last Name <span className="text-red-500">*</span>
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

          {/* Suffix */}
          <div>
            <Label htmlFor="suffix" className="text-sm font-medium text-gray-700">
              Suffix
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

          {/* Email Address */}
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

          {/* Confirm Email Address */}
          <div>
            <Label htmlFor="confirmEmail" className="text-sm font-medium text-gray-700">
              Confirm Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmEmail"
              name="confirmEmail"
              type="email"
              required
              value={formData.confirmEmail}
              onChange={(e) => handleInputChange('confirmEmail', e.target.value)}
              className={`mt-1 ${errors.confirmEmail ? 'border-red-500' : ''}`}
              autoComplete="email"
            />
            {errors.confirmEmail && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmEmail}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
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

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`mt-1 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Phone Number and Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="(___ ) ___-____"
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

          {/* Marital Status */}
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

          {/* Veteran Toggle */}
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

          {/* Current Address */}
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
                placeholder="Click to enter address"
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

          {/* Same as Mailing Address Toggle */}
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

          {/* Terms of Service Checkbox */}
          <div className="flex items-start space-x-3 py-2">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={formData.acceptTerms}
              onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
              className="mt-1 w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-600"
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

          {/* Consent to Contact Checkbox */}
          <div className="flex items-start space-x-3 py-2">
            <input
              type="checkbox"
              id="consentToContact"
              checked={formData.consentToContact}
              onChange={(e) => handleInputChange('consentToContact', e.target.checked)}
              className="mt-1 w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-600"
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

        {/* Submit Button */}
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
