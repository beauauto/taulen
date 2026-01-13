'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface PreApplicationData {
  stage: string
  location?: string
  estimatedPrice?: number
  downPayment?: number
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  dateOfBirth?: string
  currentAddress?: string
  city?: string
  state?: string
  zipCode?: string
  password?: string
  verificationMethod?: 'email' | 'sms'
  verificationCode?: string
  creditCheckConsent?: boolean
}

interface PreApplicationWizardProps {
  stage: string
  onComplete: (data: PreApplicationData) => void
  onCancel?: () => void
}

export function PreApplicationWizard({ stage, onComplete, onCancel }: PreApplicationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<PreApplicationData>({ stage })

  const steps = [
    {
      id: 'location',
      title: 'Where are you looking?',
      description: 'Enter the city or area where you want to buy a home',
      fields: [
        {
          field: 'location' as keyof PreApplicationData,
          label: 'Location',
          type: 'text',
          placeholder: 'e.g., San Francisco, CA',
          required: true,
        },
      ],
    },
    {
      id: 'price',
      title: 'Home Price & Down Payment',
      description: 'Tell us about your budget and down payment',
      fields: [
        {
          field: 'estimatedPrice' as keyof PreApplicationData,
          label: 'Estimated Home Price',
          type: 'number',
          placeholder: '500000',
          required: true,
        },
        {
          field: 'downPayment' as keyof PreApplicationData,
          label: 'Down Payment',
          type: 'number',
          placeholder: '100000',
          required: true,
          showPercentage: true,
        },
      ],
    },
    {
      id: 'name',
      title: 'Your Name & Address',
      description: 'We need your name and current address',
      fields: [
        {
          field: 'firstName' as keyof PreApplicationData,
          label: 'First Name',
          type: 'text',
          placeholder: 'John',
          required: true,
        },
        {
          field: 'lastName' as keyof PreApplicationData,
          label: 'Last Name',
          type: 'text',
          placeholder: 'Doe',
          required: true,
        },
        {
          field: 'currentAddress' as keyof PreApplicationData,
          label: 'Street Address',
          type: 'text',
          placeholder: '123 Main St',
          required: true,
        },
        {
          field: 'city' as keyof PreApplicationData,
          label: 'City',
          type: 'text',
          placeholder: 'San Francisco',
          required: true,
        },
        {
          field: 'state' as keyof PreApplicationData,
          label: 'State',
          type: 'text',
          placeholder: 'CA',
          required: true,
        },
        {
          field: 'zipCode' as keyof PreApplicationData,
          label: 'ZIP Code',
          type: 'text',
          placeholder: '94102',
          required: true,
        },
      ],
    },
    {
      id: 'contact',
      title: 'Contact & Personal Information',
      description: 'We\'ll use this to contact you and process your application',
      fields: [
        {
          field: 'email' as keyof PreApplicationData,
          label: 'Email Address',
          type: 'email',
          placeholder: 'you@example.com',
          required: true,
        },
        {
          field: 'phone' as keyof PreApplicationData,
          label: 'Phone Number',
          type: 'tel',
          placeholder: '(555) 123-4567',
          required: true,
        },
        {
          field: 'dateOfBirth' as keyof PreApplicationData,
          label: 'Date of Birth',
          type: 'date',
          placeholder: '',
          required: true,
        },
      ],
    },
    {
      id: 'account',
      title: 'Create Account',
      description: 'Choose a password for your account. We will send a verification code to your phone.',
      fields: [
        {
          field: 'password' as keyof PreApplicationData,
          label: 'Password',
          type: 'password',
          placeholder: 'Enter a secure password',
          required: true,
        },
      ],
    },
    {
      id: 'verification',
      title: 'Verify Your Identity',
      description: 'Enter the verification code sent to your email or phone',
      fields: [
        {
          field: 'verificationCode' as keyof PreApplicationData,
          label: 'Verification Code',
          type: 'text',
          placeholder: 'Enter 6-digit code',
          required: true,
        },
      ],
    },
    {
      id: 'creditConsent',
      title: 'Credit Check Consent',
      description: 'We need your consent to run a credit check as part of the pre-approval process',
      fields: [
        {
          field: 'creditCheckConsent' as keyof PreApplicationData,
          label: 'I consent to the credit check',
          type: 'checkbox',
          placeholder: '',
          required: true,
        },
      ],
    },
  ]

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = async () => {
    // If moving from account step to verification step, send verification code
    // Automatically use phone (SMS) if both email and phone are available, otherwise use available method
    if (currentStepData.id === 'account' && currentStep < steps.length - 1) {
      if (!formData.email || !formData.phone) {
        alert('Please fill in all required fields')
        return
      }
      
      try {
        const { urlaApi } = await import('@/lib/api')
        // Don't send verificationMethod - backend will auto-select phone (SMS) when both are available
        await urlaApi.sendVerificationCode({
          email: formData.email,
          phone: formData.phone,
          // verificationMethod is optional - backend will prefer phone when both are available
        })
        setCurrentStep(currentStep + 1)
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to send verification code')
      }
      return
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Last step - complete the form
      onComplete(formData)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else if (onCancel) {
      onCancel()
    }
  }

  const handleInputChange = (field: keyof PreApplicationData, value: string | number | boolean) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }
  
  // Calculate down payment percentage
  const calculateDownPaymentPercentage = (): number | null => {
    const price = formData.estimatedPrice || 0
    const downPayment = formData.downPayment || 0
    if (price > 0) {
      return Math.round((downPayment / price) * 100)
    }
    return null
  }
  
  // Handle down payment percentage change
  const handleDownPaymentPercentageChange = (percentage: number) => {
    const price = formData.estimatedPrice || 0
    if (price > 0) {
      const downPayment = Math.round((percentage / 100) * price)
      setFormData({
        ...formData,
        downPayment,
      })
    }
  }

  const getCurrentValue = (field: keyof PreApplicationData, type: string) => {
    const value = formData[field]
    if (value === undefined || value === null) return ''
    if (type === 'date' && typeof value === 'string') {
      return value
    }
    return String(value)
  }

  const isStepValid = () => {
    // Special validation for account step
    if (currentStepData.id === 'account') {
      const hasPassword = formData.password && formData.password.length >= 8
      return hasPassword
    }
    
    // Special validation for verification step
    if (currentStepData.id === 'verification') {
      return formData.verificationCode && formData.verificationCode.length === 6
    }
    
    return currentStepData.fields.every((fieldDef) => {
      const value = formData[fieldDef.field]
      if (fieldDef.type === 'checkbox') {
        return value === true
      }
      if (fieldDef.type === 'radio') {
        return value !== undefined && value !== null
      }
      return value !== undefined && value !== null && String(value).trim() !== ''
    })
  }

  const canProceed = isStepValid()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Progress Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl mb-2">{currentStepData.title}</CardTitle>
            {currentStepData.description && (
              <CardDescription className="text-base">
                {currentStepData.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStepData.id === 'creditConsent' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-4">
                    By checking this box, you consent to:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                    <li>Allow us to run a credit check</li>
                    <li>Use your information to process your pre-approval</li>
                    <li>Contact you regarding your application</li>
                  </ul>
                </div>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.creditCheckConsent === true}
                    onChange={(e) => handleInputChange('creditCheckConsent', e.target.checked)}
                    className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    I consent to the credit check and agree to the terms above
                  </span>
                </label>
              </div>
            ) : currentStepData.id === 'account' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter a secure password (min. 8 characters)"
                    className="text-base py-3"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters long
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Two-Factor Authentication</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      We'll send a verification code to your phone number: <strong>{formData.phone || 'your phone'}</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Phone verification is required for account security. If you don't receive the code, please check your phone number.
                    </p>
                  </div>
                </div>
              </div>
            ) : currentStepData.id === 'verification' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    We've sent a 6-digit verification code to:
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {formData.phone || 'your phone'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Please enter the code below to verify your identity.
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                    Verification Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="verificationCode"
                    type="text"
                    value={formData.verificationCode || ''}
                    onChange={(e) => {
                      // Only allow digits, max 6 characters
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      handleInputChange('verificationCode', value)
                    }}
                    placeholder="000000"
                    className="text-base py-3 text-center text-2xl tracking-widest"
                    required
                    autoFocus
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Didn't receive the code? <button type="button" className="text-indigo-600 hover:underline">Resend</button>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {currentStepData.fields.map((fieldDef, index) => {
                  const showPercentage = (fieldDef as any).showPercentage && fieldDef.field === 'downPayment'
                  const percentage = showPercentage ? calculateDownPaymentPercentage() : null
                  
                  // Special layout for down payment with percentage
                  if (showPercentage) {
                    return (
                      <div key={fieldDef.field} className="space-y-2">
                        <label htmlFor={fieldDef.field} className="block text-sm font-medium text-gray-700">
                          {fieldDef.label}
                          {fieldDef.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Input
                              id={fieldDef.field}
                              type={fieldDef.type}
                              value={getCurrentValue(fieldDef.field, fieldDef.type)}
                              onChange={(e) => {
                                handleInputChange(fieldDef.field, parseFloat(e.target.value) || 0)
                              }}
                              placeholder={fieldDef.placeholder}
                              className="text-base py-3"
                              required={fieldDef.required}
                              autoFocus={index === 0}
                            />
                            <p className="text-sm text-gray-500">
                              Amount
                            </p>
                          </div>
                          <div className="space-y-1">
                            <div className="relative">
                              <Input
                                type="number"
                                value={percentage !== null ? percentage : ''}
                                onChange={(e) => {
                                  const pct = parseInt(e.target.value) || 0
                                  if (pct >= 0 && pct <= 100) {
                                    handleDownPaymentPercentageChange(pct)
                                  }
                                }}
                                placeholder="%"
                                className="text-base py-3 pr-8"
                                min="0"
                                max="100"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Percentage
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  // Regular field layout
                  return (
                    <div key={fieldDef.field} className="space-y-2">
                      <label htmlFor={fieldDef.field} className="block text-sm font-medium text-gray-700">
                        {fieldDef.label}
                        {fieldDef.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <Input
                        id={fieldDef.field}
                        type={fieldDef.type}
                        value={getCurrentValue(fieldDef.field, fieldDef.type)}
                        onChange={(e) => {
                          if (fieldDef.type === 'number') {
                            handleInputChange(fieldDef.field, parseFloat(e.target.value) || 0)
                          } else {
                            handleInputChange(fieldDef.field, e.target.value)
                          }
                        }}
                        placeholder={fieldDef.placeholder}
                        className="text-base py-3"
                        required={fieldDef.required}
                        autoFocus={index === 0}
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                {currentStep === 0 ? 'Cancel' : 'Back'}
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className="flex-1"
              >
                {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
