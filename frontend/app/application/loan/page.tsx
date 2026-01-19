'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { Switch } from '@/components/ui/switch'
import { urlaApi } from '@/lib/api'

export default function LoanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loanPurpose, setLoanPurpose] = useState<string>('Purchase')
  const [isLoading, setIsLoading] = useState(true)
  const [purchaseFormData, setPurchaseFormData] = useState({
    purchasePrice: '',
    downPayment: '',
    loanAmount: '',
    isApplyingForOtherLoans: false,
    isDownPaymentPartGift: false,
  })
  const [refinanceFormData, setRefinanceFormData] = useState({
    propertyAddress: '',
    outstandingBalance: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadLoanData = async () => {
      // Check for applicationId in URL params or sessionStorage
      const applicationIdParam = searchParams?.get('applicationId')
      const applicationIdFromStorage = sessionStorage.getItem('applicationId')
      const applicationId = applicationIdParam || applicationIdFromStorage
      
      // Check if user is authenticated
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      
      if (applicationId && token) {
        try {
          // Load application data from database
          const appResponse = await urlaApi.getApplication(applicationId)
          const appData = appResponse.data
          
          // If application exists, load loanPurpose from database
          if (appData?.loanPurpose) {
            setLoanPurpose(appData.loanPurpose)
            sessionStorage.setItem('loanPurpose', appData.loanPurpose)
            
            // Load existing loan data if available
            if (appData.loanAmount) {
              if (appData.loanPurpose === 'Refinance' || appData.loanPurpose === 'refinance') {
                // Load refinance data from sessionStorage or API
                const refinanceDataStr = sessionStorage.getItem('refinanceData')
                if (refinanceDataStr) {
                  try {
                    const refinanceData = JSON.parse(refinanceDataStr)
                    setRefinanceFormData({
                      propertyAddress: refinanceData.propertyAddress || '',
                      outstandingBalance: refinanceData.outstandingBalance ? 
                        parseInt(refinanceData.outstandingBalance, 10).toLocaleString('en-US') : '',
                    })
                  } catch (e) {
                    console.error('Failed to parse refinance data:', e)
                  }
                }
              } else {
                // Load purchase data from sessionStorage
                const loanDataStr = sessionStorage.getItem('loanWantedData')
                if (loanDataStr) {
                  try {
                    const loanData = JSON.parse(loanDataStr)
                    setPurchaseFormData(prev => ({
                      ...prev,
                      purchasePrice: loanData.purchasePrice ? 
                        parseInt(loanData.purchasePrice, 10).toLocaleString('en-US') : '',
                      downPayment: loanData.downPayment ? 
                        parseInt(loanData.downPayment, 10).toLocaleString('en-US') : '',
                      loanAmount: loanData.loanAmount ? 
                        parseInt(loanData.loanAmount, 10).toLocaleString('en-US') : '',
                      isApplyingForOtherLoans: loanData.isApplyingForOtherLoans || false,
                      isDownPaymentPartGift: loanData.isDownPaymentPartGift || false,
                    }))
                  } catch (e) {
                    console.error('Failed to parse loan data:', e)
                  }
                }
              }
            }
          } else {
            // No application yet, get loan purpose from sessionStorage
            const purpose = sessionStorage.getItem('loanPurpose') || 'Purchase'
            setLoanPurpose(purpose)
          }
        } catch (error: any) {
          // If 401 or application not found, allow user to proceed (new application)
          if (error.response?.status === 401 || error.response?.status === 404) {
            const purpose = sessionStorage.getItem('loanPurpose') || 'Purchase'
            setLoanPurpose(purpose)
          } else {
            console.error('Error loading application data:', error)
          }
        }
      } else {
        // No applicationId, get loan purpose from sessionStorage
        const purpose = sessionStorage.getItem('loanPurpose') || 'Purchase'
        setLoanPurpose(purpose)
      }
      
      setIsLoading(false)
    }
    
    loadLoanData()
  }, [searchParams])

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

  const handlePurchaseInputChange = (field: string, value: string | boolean) => {
    setPurchaseFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleRefinanceInputChange = (field: string, value: string) => {
    setRefinanceFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    return parseInt(digits, 10).toLocaleString('en-US')
  }

  const parseCurrency = (value: string) => {
    return value.replace(/\D/g, '')
  }

  const validatePurchaseForm = () => {
    const newErrors: Record<string, string> = {}

    if (!purchaseFormData.purchasePrice.trim()) {
      newErrors.purchasePrice = 'Purchase Price is required'
    } else if (parseFloat(parseCurrency(purchaseFormData.purchasePrice)) <= 0) {
      newErrors.purchasePrice = 'Purchase Price must be greater than 0'
    }

    if (!purchaseFormData.downPayment.trim()) {
      newErrors.downPayment = 'Down Payment is required'
    } else if (parseFloat(parseCurrency(purchaseFormData.downPayment)) <= 0) {
      newErrors.downPayment = 'Down Payment must be greater than 0'
    }

    if (!purchaseFormData.loanAmount.trim()) {
      newErrors.loanAmount = 'Loan Amount is required'
    } else if (parseFloat(parseCurrency(purchaseFormData.loanAmount)) <= 0) {
      newErrors.loanAmount = 'Loan Amount must be greater than 0'
    }

    // Validate that loan amount + down payment ≈ purchase price (with some tolerance)
    const purchasePriceNum = parseFloat(parseCurrency(purchaseFormData.purchasePrice))
    const downPaymentNum = parseFloat(parseCurrency(purchaseFormData.downPayment))
    const loanAmountNum = parseFloat(parseCurrency(purchaseFormData.loanAmount))
    const difference = Math.abs(purchasePriceNum - (downPaymentNum + loanAmountNum))
    
    if (difference > 100) { // Allow $100 tolerance
      newErrors.loanAmount = 'Loan Amount and Down Payment should equal Purchase Price'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateRefinanceForm = () => {
    const newErrors: Record<string, string> = {}

    if (!refinanceFormData.propertyAddress.trim()) {
      newErrors.propertyAddress = 'Property Address is required'
    }

    if (!refinanceFormData.outstandingBalance.trim()) {
      newErrors.outstandingBalance = 'Outstanding Balance is required'
    } else if (parseFloat(parseCurrency(refinanceFormData.outstandingBalance)) <= 0) {
      newErrors.outstandingBalance = 'Outstanding Balance must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isValid = loanPurpose === 'Refinance' 
      ? validateRefinanceForm() 
      : validatePurchaseForm()

    if (!isValid) {
      return
    }

    // Prepare loan data for saving
    let loanDataToSave: any = {}
    
    if (loanPurpose === 'Refinance') {
      // Store refinance information in sessionStorage
      const refinanceData = {
        propertyAddress: refinanceFormData.propertyAddress,
        outstandingBalance: parseCurrency(refinanceFormData.outstandingBalance),
        loanPurpose: 'Refinance',
      }
      sessionStorage.setItem('refinanceData', JSON.stringify(refinanceData))
      sessionStorage.setItem('loanWantedData', JSON.stringify(refinanceData))
      
      // Prepare loan data for API
      loanDataToSave = {
        loanAmount: parseFloat(parseCurrency(refinanceFormData.outstandingBalance)),
        propertyAddress: refinanceFormData.propertyAddress,
        outstandingBalance: parseFloat(parseCurrency(refinanceFormData.outstandingBalance)),
      }
    } else {
      // Store purchase loan information in sessionStorage
      const loanData = {
        purchasePrice: parseCurrency(purchaseFormData.purchasePrice),
        downPayment: parseCurrency(purchaseFormData.downPayment),
        loanAmount: parseCurrency(purchaseFormData.loanAmount),
        isApplyingForOtherLoans: purchaseFormData.isApplyingForOtherLoans,
        isDownPaymentPartGift: purchaseFormData.isDownPaymentPartGift,
      }
      sessionStorage.setItem('loanWantedData', JSON.stringify(loanData))
      
      // Prepare loan data for API
      loanDataToSave = {
        loanAmount: parseFloat(parseCurrency(purchaseFormData.loanAmount)),
        purchasePrice: parseFloat(parseCurrency(purchaseFormData.purchasePrice)),
        downPayment: parseFloat(parseCurrency(purchaseFormData.downPayment)),
        isApplyingForOtherLoans: purchaseFormData.isApplyingForOtherLoans,
        isDownPaymentPartGift: purchaseFormData.isDownPaymentPartGift,
      }
    }

    // Save loan data to database if application exists
    if (applicationId) {
      try {
        await urlaApi.saveApplication(applicationId, {
          loan: loanDataToSave,
          nextFormStep: 'loan-completed',
        })
        console.log('Loan data saved successfully')
      } catch (error) {
        console.error('Failed to save loan data:', error)
        // Still allow user to continue even if save fails
      }
      // Don't navigate - user requested to not link to next form yet
      // The form step is updated, so user can continue later
    }
  }

  const handleBack = () => {
    const appId = searchParams?.get('applicationId') || sessionStorage.getItem('applicationId')
    if (appId) {
      router.push(`/application/getting-to-know-you-intro?applicationId=${appId}`)
    } else {
      router.push('/getting-started')
    }
  }

  const isPurchase = loanPurpose === 'Purchase' || loanPurpose === 'purchase'

  return (
    <Form1003Layout
      sections={sections}
      currentSectionId="getting-to-know-you"
      title="Loan & Property"
      onBack={handleBack}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Messages */}
        <div className="space-y-2.5 md:space-y-3">
          <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
            <div className="whitespace-pre-line">
              {isPurchase 
                ? 'Tell us about the loan you would like to obtain.'
                : 'Tell us about the property you are refinancing.'}
            </div>
            <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
          </div>
          <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
            <div className="whitespace-pre-line">
              {isPurchase 
                ? 'If you don\'t know the exact amount, an estimate is fine.'
                : 'Estimates are fine if you don\'t have exact amounts.'}
            </div>
            <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {isPurchase ? (
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
                    value={purchaseFormData.purchasePrice}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      handlePurchaseInputChange('purchasePrice', formatted)
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
                    value={purchaseFormData.downPayment}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      handlePurchaseInputChange('downPayment', formatted)
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
                    value={purchaseFormData.loanAmount}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      handlePurchaseInputChange('loanAmount', formatted)
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
                  checked={purchaseFormData.isApplyingForOtherLoans}
                  onCheckedChange={(checked) => handlePurchaseInputChange('isApplyingForOtherLoans', checked)}
                />
                <Label htmlFor="isApplyingForOtherLoans" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Are you applying for or seeking other new mortgage loans on the property you are buying or refinancing?
                </Label>
              </div>

              {/* Gift Down Payment Toggle */}
              <div className="flex items-center space-x-3 py-2">
                <Switch
                  id="isDownPaymentPartGift"
                  checked={purchaseFormData.isDownPaymentPartGift}
                  onCheckedChange={(checked) => handlePurchaseInputChange('isDownPaymentPartGift', checked)}
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
                  value={refinanceFormData.propertyAddress}
                  onChange={(e) => handleRefinanceInputChange('propertyAddress', e.target.value)}
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
                    value={refinanceFormData.outstandingBalance}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value)
                      handleRefinanceInputChange('outstandingBalance', formatted)
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
