'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { Card, CardContent } from '@/components/ui/card'
import { urlaApi } from '@/lib/api'
import { Edit2, Home, User } from 'lucide-react'

interface GettingStartedSummaryProps {
  applicationId?: string
  onEditBorrower?: () => void
  onContinue?: () => void
  onBack?: () => void
}

export function GettingStartedSummary({
  applicationId,
  onEditBorrower,
  onContinue,
  onBack,
}: GettingStartedSummaryProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [transactionType, setTransactionType] = useState<string>('')
  const [borrowerName, setBorrowerName] = useState<string>('')
  const [borrowerEmail, setBorrowerEmail] = useState<string>('')
  const [coBorrowerName, setCoBorrowerName] = useState<string>('')
  const [coBorrowerEmail, setCoBorrowerEmail] = useState<string>('')
  const [hasCoBorrower, setHasCoBorrower] = useState<boolean>(false)
  const [loanDetails, setLoanDetails] = useState<{
    purchasePrice?: string
    downPayment?: string
    loanAmount?: string
    propertyAddress?: string
    outstandingBalance?: string
  }>({})
  const [loading, setLoading] = useState(true)

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

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    return parseInt(digits, 10).toLocaleString('en-US')
  }

  useEffect(() => {
    const loadSummaryData = async () => {
      try {
        // Determine transaction type from loanPurpose in sessionStorage
        const loanPurpose = sessionStorage.getItem('loanPurpose') || 'Purchase'
        if (loanPurpose === 'Refinance' || loanPurpose === 'refinance') {
          setTransactionType('Refinance')
          
          // Load refinance details from sessionStorage
          const refinanceDataStr = sessionStorage.getItem('refinanceData')
          if (refinanceDataStr) {
            try {
              const refinanceData = JSON.parse(refinanceDataStr)
              setLoanDetails({
                propertyAddress: refinanceData.propertyAddress,
                outstandingBalance: refinanceData.outstandingBalance ? formatCurrency(refinanceData.outstandingBalance) : undefined,
              })
            } catch (e) {
              // Ignore parse errors
            }
          }
          // Also check loanWantedData (unified storage)
          const loanDataStr = sessionStorage.getItem('loanWantedData')
          if (loanDataStr && !refinanceDataStr) {
            try {
              const loanData = JSON.parse(loanDataStr)
              if (loanData.propertyAddress || loanData.outstandingBalance) {
                setLoanDetails({
                  propertyAddress: loanData.propertyAddress,
                  outstandingBalance: loanData.outstandingBalance ? formatCurrency(loanData.outstandingBalance) : undefined,
                })
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        } else {
          setTransactionType('Purchase')
          
          // Load purchase loan details from sessionStorage
          const loanDataStr = sessionStorage.getItem('loanWantedData')
          if (loanDataStr) {
            try {
              const loanData = JSON.parse(loanDataStr)
              setLoanDetails({
                purchasePrice: loanData.purchasePrice ? formatCurrency(loanData.purchasePrice) : undefined,
                downPayment: loanData.downPayment ? formatCurrency(loanData.downPayment) : undefined,
                loanAmount: loanData.loanAmount ? formatCurrency(loanData.loanAmount) : undefined,
              })
            } catch (e) {
              // Ignore parse errors
            }
          }
        }

        // First, try to load from sessionStorage (for new applications)
        const borrowerDataStr = sessionStorage.getItem('borrowerData')
        if (borrowerDataStr) {
          try {
            const borrowerData = JSON.parse(borrowerDataStr)
            if (borrowerData.firstName && borrowerData.lastName) {
              setBorrowerName(`${borrowerData.firstName} ${borrowerData.lastName}`)
            }
            if (borrowerData.email) {
              setBorrowerEmail(borrowerData.email)
            }
          } catch (e) {
            // Ignore parse errors
          }
        }

        // If we have an applicationId and user is authenticated, try to load from API
        // This will override sessionStorage data if available
        const appIdToLoad = applicationId || (() => {
          const storedAppId = sessionStorage.getItem('applicationId')
          return storedAppId
        })()

        if (appIdToLoad) {
          try {
            // Check if user is authenticated before making API call
            const token = localStorage.getItem('token')
            if (token) {
              const appResponse = await urlaApi.getApplication(appIdToLoad)
              const appData = appResponse.data

              if (appData) {
                // Set transaction type from loan purpose (override path-based detection)
                if (appData.loanPurpose) {
                  setTransactionType(appData.loanPurpose)
                }

                // Set loan details from application
                if (appData.loanAmount) {
                  setLoanDetails(prev => ({
                    ...prev,
                    loanAmount: formatCurrency(appData.loanAmount.toString()),
                  }))
                }
                // Add more loan detail fields as needed

                // Set borrower info (override sessionStorage data)
                if (appData.borrower) {
                  const borrower = appData.borrower as any
                  if (borrower.firstName && borrower.lastName) {
                    setBorrowerName(`${borrower.firstName} ${borrower.lastName}`)
                  }
                  if (borrower.email) {
                    setBorrowerEmail(borrower.email)
                  }
                }

                // Set co-borrower info if available
                if (appData.coBorrower) {
                  const coBorrower = appData.coBorrower as any
                  setHasCoBorrower(true)
                  const nameParts: string[] = []
                  if (coBorrower.firstName) nameParts.push(coBorrower.firstName)
                  if (coBorrower.middleName) nameParts.push(coBorrower.middleName)
                  if (coBorrower.lastName) nameParts.push(coBorrower.lastName)
                  if (coBorrower.suffix) nameParts.push(coBorrower.suffix)
                  if (nameParts.length > 0) {
                    setCoBorrowerName(nameParts.join(' '))
                  }
                  if (coBorrower.email) {
                    setCoBorrowerEmail(coBorrower.email)
                  }
                } else {
                  setHasCoBorrower(false)
                }
              }
            }
          } catch (error: any) {
            // Silently handle errors - we already have data from sessionStorage
            // Only log non-401 errors
            if (error.response?.status !== 401) {
              console.error('Failed to load application data:', error)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load summary data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSummaryData()
  }, [applicationId, pathname]) // Reload when pathname changes (e.g., returning from edit)

  const handleEditBorrower = () => {
    if (onEditBorrower) {
      onEditBorrower()
    } else {
      // Navigate to comprehensive borrower edit page with all URLA 1003 Section 1 fields
      const appId = applicationId || sessionStorage.getItem('applicationId')
      const url = appId ? `/application/borrower-edit?applicationId=${appId}` : '/application/borrower-edit'
      router.push(url)
    }
  }

  const handleEditCoBorrower = () => {
    // Navigate to comprehensive co-borrower edit page with all URLA 1003 Section 1 fields
    const appId = applicationId || sessionStorage.getItem('applicationId')
    const url = appId ? `/application/co-borrower-edit?applicationId=${appId}` : '/application/co-borrower-edit'
    router.push(url)
  }

  const handleContinue = async () => {
    if (onContinue) {
      onContinue()
    } else {
      // Default: proceed to Loan & Property Intro (getting-to-know-you-intro)
      const currentPath = window.location.pathname
      const appId = applicationId || sessionStorage.getItem('applicationId')
      
      // Update form step to getting-to-know-you-intro
      if (appId) {
        try {
          const { urlaApi } = await import('@/lib/api')
          await urlaApi.saveApplication(
            appId,
            {
              nextFormStep: 'getting-to-know-you-intro',
            }
          )
        } catch (error) {
          console.error('Failed to update form step:', error)
          // Continue anyway - navigation will still work
        }
      }
      
      // Use unified route
      const url = appId ? `/application/getting-to-know-you-intro?applicationId=${appId}` : '/application/getting-to-know-you-intro'
      router.push(url)
    }
  }

  const handleBack = async () => {
    // Use provided onBack handler if available, otherwise use default logic
    if (onBack) {
      onBack()
      return
    }
    
    // Default: Go back to the last completed form in the 1003 flow
    // Check if co-borrower exists to determine which form to go back to
    const appId = applicationId || sessionStorage.getItem('applicationId')
    
    if (appId) {
      try {
        const appResponse = await urlaApi.getApplication(appId)
        const appData = appResponse.data
        
        // If co-borrower exists, go back to co-borrower-info-2
        // Otherwise, go back to borrower-info-2
        if (appData?.coBorrower) {
          router.push(`/application/co-borrower-info-2?applicationId=${appId}`)
        } else {
          router.push(`/application/borrower-info-2?applicationId=${appId}`)
        }
      } catch (error) {
        // If we can't load application data, default to borrower-info-2
        console.error('Failed to load application data for back navigation:', error)
        router.push(`/application/borrower-info-2?applicationId=${appId}`)
      }
    } else {
      // No application ID, go back to borrower-info-2 as default
      router.push('/application/borrower-info-2')
    }
  }

  if (loading) {
    return (
      <Form1003Layout
        sections={sections}
        currentSectionId="getting-started"
        title="Getting Started"
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
      title="Getting Started"
      onBack={handleBack}
    >
      <div className="space-y-4 md:space-y-6">
        {/* Message */}
        <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
          <div className="whitespace-pre-line">
            Review and confirm your information.
          </div>
          <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
        </div>

        {/* Summary Items */}
        <div className="space-y-4">
          {/* Type of Transaction */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                  <Home className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                    Type of Transaction
                  </h3>
                  <div className="space-y-1">
                    <div className="text-base text-gray-700">
                      {transactionType || 'Not specified'}
                    </div>
                    {transactionType === 'Purchase' && (
                      <>
                        {loanDetails.purchasePrice && (
                          <div className="text-sm text-gray-600">
                            Purchase Price: ${loanDetails.purchasePrice}
                          </div>
                        )}
                        {loanDetails.downPayment && (
                          <div className="text-sm text-gray-600">
                            Down Payment: ${loanDetails.downPayment}
                          </div>
                        )}
                        {loanDetails.loanAmount && (
                          <div className="text-sm text-gray-600">
                            Loan Amount: ${loanDetails.loanAmount}
                          </div>
                        )}
                      </>
                    )}
                    {transactionType === 'Refinance' && (
                      <>
                        {loanDetails.propertyAddress && (
                          <div className="text-sm text-gray-600">
                            Property: {loanDetails.propertyAddress}
                          </div>
                        )}
                        {loanDetails.outstandingBalance && (
                          <div className="text-sm text-gray-600">
                            Outstanding Balance: ${loanDetails.outstandingBalance}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Borrower */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                      Borrower
                    </h3>
                    <div className="space-y-1">
                      {borrowerName ? (
                        <div className="text-base text-gray-700">{borrowerName}</div>
                      ) : (
                        <div className="text-base text-gray-500 italic">Not provided</div>
                      )}
                      {borrowerEmail && (
                        <div className="text-sm text-gray-600">{borrowerEmail}</div>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditBorrower}
                  className="ml-4 text-amber-600 border-amber-600 hover:bg-amber-50"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Co-Borrower */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                      Co-Borrower
                    </h3>
                    <div className="space-y-1">
                      {hasCoBorrower ? (
                        <>
                          {coBorrowerName ? (
                            <div className="text-base text-gray-700">{coBorrowerName}</div>
                          ) : (
                            <div className="text-base text-gray-500 italic">Not provided</div>
                          )}
                          {coBorrowerEmail && (
                            <div className="text-sm text-gray-600">{coBorrowerEmail}</div>
                          )}
                        </>
                      ) : (
                        <div className="text-base text-gray-500 italic">None</div>
                      )}
                    </div>
                  </div>
                </div>
                {hasCoBorrower && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditCoBorrower}
                    className="ml-4 text-amber-600 border-amber-600 hover:bg-amber-50"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Button */}
        <div className="pt-4 flex justify-center">
          <Button
            onClick={handleContinue}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-normal text-base py-4 px-8 h-[55px] rounded transition-colors shadow-sm max-w-md"
          >
            Continue
          </Button>
        </div>
      </div>
    </Form1003Layout>
  )
}
