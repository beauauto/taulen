'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { Switch } from '@/components/ui/switch'

export default function LoanWantedPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    purchasePrice: '',
    downPayment: '',
    loanAmount: '',
    isApplyingForOtherLoans: false,
    isDownPaymentPartGift: false,
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

    if (!formData.purchasePrice.trim()) {
      newErrors.purchasePrice = 'Purchase Price is required'
    } else if (parseFloat(parseCurrency(formData.purchasePrice)) <= 0) {
      newErrors.purchasePrice = 'Purchase Price must be greater than 0'
    }

    if (!formData.downPayment.trim()) {
      newErrors.downPayment = 'Down Payment is required'
    } else if (parseFloat(parseCurrency(formData.downPayment)) <= 0) {
      newErrors.downPayment = 'Down Payment must be greater than 0'
    }

    if (!formData.loanAmount.trim()) {
      newErrors.loanAmount = 'Loan Amount is required'
    } else if (parseFloat(parseCurrency(formData.loanAmount)) <= 0) {
      newErrors.loanAmount = 'Loan Amount must be greater than 0'
    }

    // Validate that loan amount + down payment ≈ purchase price (with some tolerance)
    const purchasePriceNum = parseFloat(parseCurrency(formData.purchasePrice))
    const downPaymentNum = parseFloat(parseCurrency(formData.downPayment))
    const loanAmountNum = parseFloat(parseCurrency(formData.loanAmount))
    const difference = Math.abs(purchasePriceNum - (downPaymentNum + loanAmountNum))
    
    if (difference > 100) { // Allow $100 tolerance
      newErrors.loanAmount = 'Loan Amount and Down Payment should equal Purchase Price'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Store loan information in sessionStorage for later use
    const loanData = {
      purchasePrice: parseCurrency(formData.purchasePrice),
      downPayment: parseCurrency(formData.downPayment),
      loanAmount: parseCurrency(formData.loanAmount),
      isApplyingForOtherLoans: formData.isApplyingForOtherLoans,
      isDownPaymentPartGift: formData.isDownPaymentPartGift,
    }
    sessionStorage.setItem('loanWantedData', JSON.stringify(loanData))

    // Navigate to borrower information form (first form)
    router.push('/buy/borrower-info-1')
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
              Tell us about the loan you would like to obtain.
            </div>
            {/* Speech bubble pointer - hidden on desktop */}
            <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
          </div>
          <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
            <div className="whitespace-pre-line">
              If you don't know the exact amount, an estimate is fine.
            </div>
            {/* Speech bubble pointer - hidden on desktop */}
            <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Purchase Price */}
          <div>
            <Label htmlFor="purchasePrice" className="text-sm font-medium text-gray-700">
              Purchase Price <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </div>
              <Input
                id="purchasePrice"
                name="purchasePrice"
                type="text"
                required
                value={formData.purchasePrice}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value)
                  handleInputChange('purchasePrice', formatted)
                }}
                className={`pl-8 ${errors.purchasePrice ? 'border-red-500' : ''}`}
                placeholder="0"
                inputMode="decimal"
              />
            </div>
            {errors.purchasePrice && (
              <p className="mt-1 text-sm text-red-500">{errors.purchasePrice}</p>
            )}
          </div>

          {/* Down Payment */}
          <div>
            <Label htmlFor="downPayment" className="text-sm font-medium text-gray-700">
              Down Payment <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </div>
              <Input
                id="downPayment"
                name="downPayment"
                type="text"
                required
                value={formData.downPayment}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value)
                  handleInputChange('downPayment', formatted)
                }}
                className={`pl-8 ${errors.downPayment ? 'border-red-500' : ''}`}
                placeholder="0"
                inputMode="decimal"
              />
            </div>
            {errors.downPayment && (
              <p className="mt-1 text-sm text-red-500">{errors.downPayment}</p>
            )}
          </div>

          {/* Loan Amount */}
          <div>
            <Label htmlFor="loanAmount" className="text-sm font-medium text-gray-700">
              Loan Amount <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </div>
              <Input
                id="loanAmount"
                name="loanAmount"
                type="text"
                required
                value={formData.loanAmount}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value)
                  handleInputChange('loanAmount', formatted)
                }}
                className={`pl-8 ${errors.loanAmount ? 'border-red-500' : ''}`}
                placeholder="0"
                inputMode="decimal"
              />
            </div>
            {errors.loanAmount && (
              <p className="mt-1 text-sm text-red-500">{errors.loanAmount}</p>
            )}
          </div>

          {/* Other Loans Toggle */}
          <div className="flex items-center space-x-3 py-2">
            <Switch
              id="isApplyingForOtherLoans"
              checked={formData.isApplyingForOtherLoans}
              onCheckedChange={(checked) => handleInputChange('isApplyingForOtherLoans', checked)}
            />
            <Label htmlFor="isApplyingForOtherLoans" className="text-sm font-medium text-gray-700 cursor-pointer">
              Are you applying for or seeking other new mortgage loans on the property you are buying or refinancing?
            </Label>
          </div>

          {/* Gift Down Payment Toggle */}
          <div className="flex items-center space-x-3 py-2">
            <Switch
              id="isDownPaymentPartGift"
              checked={formData.isDownPaymentPartGift}
              onCheckedChange={(checked) => handleInputChange('isDownPaymentPartGift', checked)}
            />
            <Label htmlFor="isDownPaymentPartGift" className="text-sm font-medium text-gray-700 cursor-pointer">
              Is any part of the down payment a gift?
            </Label>
          </div>

          {/* Help Links */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              type="button"
              className="text-amber-600 hover:text-amber-700 hover:underline text-sm font-medium flex items-center gap-1"
            >
              <span>ℹ️</span>
              <span>How much can I afford?</span>
            </button>
            <button
              type="button"
              className="text-amber-600 hover:text-amber-700 hover:underline text-sm font-medium flex items-center gap-1"
            >
              <span>ℹ️</span>
              <span>What is considered a gift?</span>
            </button>
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
