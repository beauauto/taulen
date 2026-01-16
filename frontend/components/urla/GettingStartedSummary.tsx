'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { Card, CardContent } from '@/components/ui/card'
import { urlaApi } from '@/lib/api'
import { Edit2, Home, User } from 'lucide-react'

interface GettingStartedSummaryProps {
  applicationId?: number
  onEditTransaction?: () => void
  onEditBorrower?: () => void
  onContinue?: () => void
}

export function GettingStartedSummary({
  applicationId,
  onEditTransaction,
  onEditBorrower,
  onContinue,
}: GettingStartedSummaryProps) {
  const router = useRouter()
  const [transactionType, setTransactionType] = useState<string>('')
  const [borrowerName, setBorrowerName] = useState<string>('')
  const [borrowerEmail, setBorrowerEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    const loadSummaryData = async () => {
      try {
        // Determine transaction type from current path
        const currentPath = window.location.pathname
        if (currentPath.includes('/buy')) {
          setTransactionType('Purchase')
        } else if (currentPath.includes('/refinance')) {
          setTransactionType('Refinance')
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
          return storedAppId ? parseInt(storedAppId, 10) : null
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
  }, [applicationId])

  const handleEditTransaction = () => {
    if (onEditTransaction) {
      onEditTransaction()
    } else {
      // Default: go back to getting-started
      router.push('/getting-started')
    }
  }

  const handleEditBorrower = () => {
    if (onEditBorrower) {
      onEditBorrower()
    } else {
      // Default: go to borrower-info-1
      const currentPath = window.location.pathname
      if (currentPath.includes('/buy')) {
        router.push('/buy/borrower-info-1')
      } else if (currentPath.includes('/refinance')) {
        router.push('/refinance/borrower-info-1')
      }
    }
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    } else {
      // Default: proceed to borrower-info-1
      const currentPath = window.location.pathname
      if (currentPath.includes('/buy')) {
        router.push('/buy/borrower-info-1')
      } else if (currentPath.includes('/refinance')) {
        router.push('/refinance/borrower-info-1')
      }
    }
  }

  const handleBack = () => {
    const currentPath = window.location.pathname
    if (currentPath.includes('/buy')) {
      router.push('/buy')
    } else if (currentPath.includes('/refinance')) {
      router.push('/refinance')
    } else {
      router.push('/getting-started')
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
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                    <Home className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                      Type of Transaction
                    </h3>
                    <div className="text-base text-gray-700">
                      {transactionType || 'Not specified'}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditTransaction}
                  className="ml-4 text-amber-600 border-amber-600 hover:bg-amber-50"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
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
