'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { urlaApi } from '@/lib/api'

export default function GettingStartedPage() {
  const router = useRouter()

  // Check if an application already exists and redirect if it does
  useEffect(() => {
    const checkExistingApplication = async () => {
      const applicationId = sessionStorage.getItem('applicationId')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      
      // If we have an applicationId and token, redirect to the appropriate form
      if (applicationId && token) {
        try {
          const appResponse = await urlaApi.getApplication(parseInt(applicationId, 10))
          const appData = appResponse.data
          
          // Load loanPurpose from database and store it
          if (appData?.loanPurpose) {
            sessionStorage.setItem('loanPurpose', appData.loanPurpose)
          }
          
          // Redirect to the current form step or borrower-info-1 if no step set
          const currentFormStep = appData?.currentFormStep as string | undefined
          if (currentFormStep) {
            if (currentFormStep.startsWith('borrower-info-1')) {
              router.replace(`/application/borrower-info-1?applicationId=${applicationId}`)
            } else if (currentFormStep.startsWith('borrower-info-2')) {
              router.replace(`/application/borrower-info-2?applicationId=${applicationId}`)
            } else if (currentFormStep.startsWith('co-borrower-question')) {
              router.replace(`/application/co-borrower-question?applicationId=${applicationId}`)
            } else if (currentFormStep.startsWith('co-borrower-info-1')) {
              router.replace(`/application/co-borrower-info-1?applicationId=${applicationId}`)
            } else if (currentFormStep.startsWith('co-borrower-info-2')) {
              router.replace(`/application/co-borrower-info-2?applicationId=${applicationId}`)
            } else if (currentFormStep.startsWith('co-borrower-info')) {
              // Fallback for old form step name
              router.replace(`/application/co-borrower-info-1?applicationId=${applicationId}`)
            } else if (currentFormStep.startsWith('review')) {
              router.replace(`/application/review?applicationId=${applicationId}`)
            } else if (currentFormStep.startsWith('getting-to-know-you-intro')) {
              router.replace(`/application/getting-to-know-you-intro?applicationId=${applicationId}`)
            } else if (currentFormStep.startsWith('loan')) {
              router.replace(`/application/loan?applicationId=${applicationId}`)
            } else {
              router.replace(`/application/borrower-info-1?applicationId=${applicationId}`)
            }
          } else {
            router.replace(`/application/borrower-info-1?applicationId=${applicationId}`)
          }
        } catch (error: any) {
          // If 401 or application not found, allow user to proceed (new application)
          if (error.response?.status === 401 || error.response?.status === 404) {
            // Clear invalid applicationId
            sessionStorage.removeItem('applicationId')
            return
          }
          console.error('Error checking existing application:', error)
        }
      }
    }
    
    checkExistingApplication()
  }, [router])

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

  const handlePurchase = () => {
    // Store the choice in sessionStorage for later use
    sessionStorage.setItem('loanPurpose', 'Purchase')
    router.push('/application/borrower-info-1')
  }

  const handleRefinance = () => {
    // Store the choice in sessionStorage for later use
    sessionStorage.setItem('loanPurpose', 'Refinance')
    router.push('/application/borrower-info-1')
  }

  const handleBack = () => {
    router.push('/')
  }

  return (
    <Form1003Layout
      sections={sections}
      currentSectionId="getting-started"
      title="Getting Started"
      onBack={handleBack}
    >
      <div className="space-y-4 md:space-y-6">
        {/* Message/Question */}
        <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
          <div className="whitespace-pre-line">
            Are you purchasing a new property or refinancing your mortgage?
          </div>
          {/* Speech bubble pointer - hidden on desktop (min-width: 1024px) */}
          <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 md:space-y-3 max-w-md mx-auto">
          <Button
            onClick={handlePurchase}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-normal text-base py-4 px-8 h-[55px] rounded transition-colors max-w-full shadow-sm"
          >
            Purchasing a New Property
          </Button>
          <Button
            onClick={handleRefinance}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-normal text-base py-4 px-8 h-[55px] rounded transition-colors max-w-full shadow-sm"
          >
            Refinancing My Mortgage
          </Button>
        </div>
      </div>
    </Form1003Layout>
  )
}
