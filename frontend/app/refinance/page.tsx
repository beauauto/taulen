'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'

export default function RefinancePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    propertyAddress: '',
    outstandingBalance: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sections: FormSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      current: true,
    },
    {
      id: 'getting-to-know-you',
      title: 'Getting to Know You',
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

  const handleInputChange = (field: string, value: string) => {
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

  const formatCurrency = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    // Format as currency (add commas)
    return parseInt(digits, 10).toLocaleString('en-US')
  }

  const parseCurrency = (value: string) => {
    return value.replace(/\D/g, '')
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.propertyAddress.trim()) {
      newErrors.propertyAddress = 'Property Address is required'
    }

    if (!formData.outstandingBalance.trim()) {
      newErrors.outstandingBalance = 'Outstanding Balance is required'
    } else if (parseFloat(parseCurrency(formData.outstandingBalance)) <= 0) {
      newErrors.outstandingBalance = 'Outstanding Balance must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Store refinance information in sessionStorage for later use
    const refinanceData = {
      propertyAddress: formData.propertyAddress,
      outstandingBalance: parseCurrency(formData.outstandingBalance),
      loanPurpose: 'Refinance',
    }
    sessionStorage.setItem('refinanceData', JSON.stringify(refinanceData))

    // Navigate to borrower information form
    router.push('/refinance/borrower-info-1')
  }

  const handleBack = () => {
    router.push('/getting-started')
  }

  return (
    <Form1003Layout
      sections={sections}
      currentSectionId="getting-started"
      title="Getting Started"
      onBack={handleBack}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Messages */}
        <div className="space-y-2.5 md:space-y-3">
          <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
            <div className="whitespace-pre-line">
              Tell us about the property you are refinancing.
            </div>
            {/* Speech bubble pointer - hidden on desktop */}
            <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
          </div>
          <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
            <div className="whitespace-pre-line">
              Estimates are fine if you don't have exact amounts.
            </div>
            {/* Speech bubble pointer - hidden on desktop */}
            <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Property Address */}
          <div>
            <Label htmlFor="propertyAddress" className="text-sm font-medium text-gray-700">
              Property Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="propertyAddress"
              name="propertyAddress"
              type="text"
              required
              value={formData.propertyAddress}
              onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
              className={`mt-1 ${errors.propertyAddress ? 'border-red-500' : ''}`}
              autoComplete="street-address"
            />
            {errors.propertyAddress && (
              <p className="mt-1 text-sm text-red-500">{errors.propertyAddress}</p>
            )}
          </div>

          {/* Outstanding Balance */}
          <div>
            <Label htmlFor="outstandingBalance" className="text-sm font-medium text-gray-700">
              Outstanding Balance of Current Mortgage <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </div>
              <Input
                id="outstandingBalance"
                name="outstandingBalance"
                type="text"
                required
                value={formData.outstandingBalance}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value)
                  handleInputChange('outstandingBalance', formatted)
                }}
                className={`pl-8 ${errors.outstandingBalance ? 'border-red-500' : ''}`}
                placeholder="0"
                inputMode="decimal"
              />
            </div>
            {errors.outstandingBalance && (
              <p className="mt-1 text-sm text-red-500">{errors.outstandingBalance}</p>
            )}
          </div>
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
  )
}
