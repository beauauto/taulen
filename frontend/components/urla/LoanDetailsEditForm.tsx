'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { urlaApi } from '@/lib/api'

interface LoanDetailsEditFormProps {
  applicationId?: string
  onSave: () => void
  onCancel: () => void
  loanType: 'Purchase' | 'Refinance'
}

export function LoanDetailsEditForm({
  applicationId,
  onSave,
  onCancel,
  loanType,
}: LoanDetailsEditFormProps) {
  const [formData, setFormData] = useState({
    loanPurpose: loanType,
    purchasePrice: '',
    downPayment: '',
    loanAmount: '',
    propertyAddress: '',
    outstandingBalance: '',
    isApplyingForOtherLoans: false,
    isDownPaymentPartGift: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
    const loadData = async () => {
      try {
        // Load from sessionStorage first
        if (loanType === 'Purchase') {
          const loanDataStr = sessionStorage.getItem('loanWantedData')
          if (loanDataStr) {
            const loanData = JSON.parse(loanDataStr)
            setFormData(prev => ({
              ...prev,
              purchasePrice: formatCurrency(loanData.purchasePrice || ''),
              downPayment: formatCurrency(loanData.downPayment || ''),
              loanAmount: formatCurrency(loanData.loanAmount || ''),
              isApplyingForOtherLoans: loanData.isApplyingForOtherLoans || false,
              isDownPaymentPartGift: loanData.isDownPaymentPartGift || false,
            }))
          }
        } else {
          const refinanceDataStr = sessionStorage.getItem('refinanceData')
          if (refinanceDataStr) {
            const refinanceData = JSON.parse(refinanceDataStr)
            setFormData(prev => ({
              ...prev,
              propertyAddress: refinanceData.propertyAddress || '',
              outstandingBalance: formatCurrency(refinanceData.outstandingBalance || ''),
            }))
          }
        }

        // If authenticated and have applicationId, load from API
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (applicationId && token) {
          try {
            const appResponse = await urlaApi.getApplication(applicationId)
            const appData = appResponse.data

            if (appData) {
              if (appData.loanPurpose) {
                setFormData(prev => ({ ...prev, loanPurpose: appData.loanPurpose }))
              }
              if (appData.loanAmount) {
                setFormData(prev => ({ ...prev, loanAmount: formatCurrency(appData.loanAmount.toString()) }))
              }
              // Add more fields as needed from appData
            }
          } catch (error: any) {
            if (error.response?.status !== 401) {
              console.error('Failed to load application data:', error)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load loan data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [applicationId, loanType])

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    return parseInt(digits, 10).toLocaleString('en-US')
  }

  const parseCurrency = (value: string) => {
    return value.replace(/\D/g, '')
  }

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (loanType === 'Purchase') {
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

      // Validate that loan amount + down payment ≈ purchase price
      const purchasePriceNum = parseFloat(parseCurrency(formData.purchasePrice))
      const downPaymentNum = parseFloat(parseCurrency(formData.downPayment))
      const loanAmountNum = parseFloat(parseCurrency(formData.loanAmount))
      const difference = Math.abs(purchasePriceNum - (downPaymentNum + loanAmountNum))
      
      if (difference > 100) {
        newErrors.loanAmount = 'Loan Amount and Down Payment should equal Purchase Price'
      }
    } else {
      if (!formData.propertyAddress.trim()) {
        newErrors.propertyAddress = 'Property Address is required'
      }

      if (!formData.outstandingBalance.trim()) {
        newErrors.outstandingBalance = 'Outstanding Balance is required'
      } else if (parseFloat(parseCurrency(formData.outstandingBalance)) <= 0) {
        newErrors.outstandingBalance = 'Outstanding Balance must be greater than 0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Save to sessionStorage
      if (loanType === 'Purchase') {
        const loanData = {
          purchasePrice: parseCurrency(formData.purchasePrice),
          downPayment: parseCurrency(formData.downPayment),
          loanAmount: parseCurrency(formData.loanAmount),
          isApplyingForOtherLoans: formData.isApplyingForOtherLoans,
          isDownPaymentPartGift: formData.isDownPaymentPartGift,
        }
        sessionStorage.setItem('loanWantedData', JSON.stringify(loanData))
      } else {
        const refinanceData = {
          propertyAddress: formData.propertyAddress,
          outstandingBalance: parseCurrency(formData.outstandingBalance),
          loanPurpose: 'Refinance',
        }
        sessionStorage.setItem('refinanceData', JSON.stringify(refinanceData))
      }

      // If authenticated and have applicationId, save to API
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (applicationId && token) {
        try {
          await urlaApi.saveApplication(applicationId, {
            loanPurpose: formData.loanPurpose,
            loanAmount: loanType === 'Purchase' 
              ? parseFloat(parseCurrency(formData.loanAmount))
              : parseFloat(parseCurrency(formData.outstandingBalance)),
            // Add more fields as needed
          })
        } catch (error: any) {
          if (error.response?.status !== 401) {
            console.error('Failed to update application:', error)
          }
        }
      }

      onSave()
    } catch (error) {
      console.error('Failed to save loan details:', error)
      setErrors({ submit: 'Failed to save loan details. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Form1003Layout
        sections={sections}
        currentSectionId="getting-started"
        title="Edit Loan Details"
        onBack={onCancel}
      >
        <div className="text-center text-gray-500 py-12">Loading...</div>
      </Form1003Layout>
    )
  }

  return (
    <Form1003Layout
      sections={sections}
      currentSectionId="getting-started"
      title="Edit Loan Details"
      onBack={onCancel}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
          <div className="whitespace-pre-line">
            {loanType === 'Purchase' 
              ? 'Update the loan details for your purchase.'
              : 'Update the loan details for your refinance.'}
          </div>
          <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
        </div>

        <div className="space-y-4">
          {loanType === 'Purchase' ? (
            <>
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
            </>
          ) : (
            <>
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
                  placeholder="Enter property address"
                />
                {errors.propertyAddress && (
                  <p className="mt-1 text-sm text-red-500">{errors.propertyAddress}</p>
                )}
              </div>

              {/* Outstanding Balance */}
              <div>
                <Label htmlFor="outstandingBalance" className="text-sm font-medium text-gray-700">
                  Outstanding Balance <span className="text-red-500">*</span>
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
            </>
          )}
        </div>

        <div className="pt-4 flex justify-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-8"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form1003Layout>
  )
}
