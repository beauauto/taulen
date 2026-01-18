'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'

export default function CoBorrowerQuestionPage() {
  const router = useRouter()
  const [applicationId, setApplicationId] = useState<string | null>(null)

  useEffect(() => {
    // Get applicationId from URL params first (when redirected from /applications/[id])
    const urlParams = new URLSearchParams(window.location.search)
    const applicationIdFromUrl = urlParams.get('applicationId')
    const applicationIdFromStorage = sessionStorage.getItem('applicationId')
    const appId = applicationIdFromUrl || applicationIdFromStorage
    
    if (appId) {
      setApplicationId(appId)
      // Store in sessionStorage for consistency
      if (applicationIdFromUrl && !applicationIdFromStorage) {
        sessionStorage.setItem('applicationId', appId)
      }
    }
  }, [])

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

  const handleYes = () => {
    const appId = applicationId || sessionStorage.getItem('applicationId')
    if (appId) {
      router.push(`/application/co-borrower-info-1?applicationId=${appId}`)
    } else {
      router.push('/application/co-borrower-info-1')
    }
  }

  const handleNo = async () => {
    // Update form step to review (Getting Started Summary)
    const appId = applicationId || sessionStorage.getItem('applicationId')
    if (appId) {
      try {
        const { urlaApi } = await import('@/lib/api')
        // Update form step without saving any data
        await urlaApi.saveApplication(parseInt(appId, 10), {
          nextFormStep: 'review',
        })
      } catch (error) {
        console.error('Failed to update form step:', error)
        // Continue anyway - navigation will still work
      }
      router.push(`/application/review?applicationId=${appId}`)
    } else {
      router.push('/application/review')
    }
  }

  const handleBack = (e?: React.MouseEvent) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Read fresh values from sessionStorage and URL at the time of click
    const urlParams = new URLSearchParams(window.location.search)
    const applicationIdFromUrl = urlParams.get('applicationId')
    const applicationIdFromStorage = sessionStorage.getItem('applicationId')
    const appId = applicationIdFromUrl || applicationIdFromStorage || applicationId
    
    // Always go back to borrower-info-2 (the previous form in the flow)
    // Don't go back to /applications/[id] because that page will just redirect back here
    let targetUrl: string
    
    if (appId) {
      targetUrl = `/application/borrower-info-2?applicationId=${appId}`
    } else {
      targetUrl = '/application/borrower-info-2'
    }
    
    console.log('CoBorrowerQuestion handleBack: Navigating to', targetUrl)
    
    // Use window.location for a full page navigation to ensure it works
    window.location.href = targetUrl
  }

  return (
    <Form1003Layout
      sections={sections}
      currentSectionId="getting-started"
      title="Getting Started"
      onBack={handleBack}
    >
      <div className="space-y-6">
        {/* Message */}
        <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
          <div className="whitespace-pre-line">
            Are you applying for this loan with another applicant?
          </div>
          <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
        </div>

        {/* Help Link */}
        <div className="text-sm">
          <button
            type="button"
            className="text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
          >
            <span>ℹ️</span>
            <span>What if I'm applying with 3 or more people?</span>
          </button>
        </div>

        {/* Buttons */}
        <div className="pt-4 space-y-3">
          <Button
            type="button"
            onClick={handleYes}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-normal text-base py-4 px-8 h-[55px] rounded transition-colors shadow-sm max-w-md"
          >
            Yes
          </Button>
          <Button
            type="button"
            onClick={handleNo}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-normal text-base py-4 px-8 h-[55px] rounded transition-colors shadow-sm max-w-md"
          >
            No
          </Button>
        </div>
      </div>
    </Form1003Layout>
  )
}
