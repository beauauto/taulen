'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Home, RefreshCw } from 'lucide-react'

interface PurchaseOrRefiPageProps {
  applicationId: number
  onSelect: (loanPurpose: 'Purchase' | 'Refinance') => void
  onBack?: () => void
}

export function PurchaseOrRefiPage({ applicationId, onSelect, onBack }: PurchaseOrRefiPageProps) {
  const [selected, setSelected] = useState<'Purchase' | 'Refinance' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelect = async (loanPurpose: 'Purchase' | 'Refinance') => {
    setSelected(loanPurpose)
    setIsSubmitting(true)
    
    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))
    
    onSelect(loanPurpose)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Getting Started
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Question Card */}
        <Card className="shadow-lg border-0 mb-6">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
                Are you purchasing a new property or refinancing your mortgage?
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Select the option that best describes your situation
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4">
              {/* Purchase Option */}
              <button
                onClick={() => handleSelect('Purchase')}
                disabled={isSubmitting}
                className={`w-full p-6 sm:p-8 rounded-lg border-2 transition-all text-left ${
                  selected === 'Purchase'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center ${
                    selected === 'Purchase' ? 'bg-indigo-600' : 'bg-gray-100'
                  }`}>
                    <Home className={`w-6 h-6 sm:w-7 sm:h-7 ${
                      selected === 'Purchase' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      Purchasing a New Property
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      I'm buying a new home or investment property
                    </p>
                  </div>
                  {selected === 'Purchase' && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>

              {/* Refinance Option */}
              <button
                onClick={() => handleSelect('Refinance')}
                disabled={isSubmitting}
                className={`w-full p-6 sm:p-8 rounded-lg border-2 transition-all text-left ${
                  selected === 'Refinance'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center ${
                    selected === 'Refinance' ? 'bg-indigo-600' : 'bg-gray-100'
                  }`}>
                    <RefreshCw className={`w-6 h-6 sm:w-7 sm:h-7 ${
                      selected === 'Refinance' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      Refinancing My Mortgage
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      I want to refinance my existing mortgage
                    </p>
                  </div>
                  {selected === 'Refinance' && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            </div>

            {isSubmitting && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-indigo-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  <span className="text-sm font-medium">Processing...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team for assistance
          </p>
        </div>
      </div>
    </div>
  )
}
