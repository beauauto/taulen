'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'

export default function GettingToKnowYouIntroPage() {
  const router = useRouter()

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

  const handleContinue = async () => {
    // Navigate to loan form (unified - will show purchase or refinance based on loanPurpose)
    const appId = sessionStorage.getItem('applicationId')
    
    // Update form step to loan
    if (appId) {
      try {
        const { urlaApi } = await import('@/lib/api')
        await urlaApi.saveApplication(appId, {
          nextFormStep: 'loan',
        })
      } catch (error) {
        console.error('Failed to update form step:', error)
        // Continue anyway - navigation will still work
      }
    }
    
    const url = appId ? `/application/loan?applicationId=${appId}` : '/application/loan'
    router.push(url)
  }

  const handleBack = () => {
    // Go back to the previous form in the 1003 flow: Getting Started Summary (review)
    const urlParams = new URLSearchParams(window.location.search)
    const appIdFromUrl = urlParams.get('applicationId')
    const appIdFromStorage = sessionStorage.getItem('applicationId')
    const appId = appIdFromUrl || appIdFromStorage
    
    if (appId) {
      router.push(`/application/review?applicationId=${appId}`)
    } else {
      router.push('/application/review')
    }
  }

  return (
    <Form1003Layout
      sections={sections}
      currentSectionId="getting-to-know-you"
      title="Loan & Property"
      onBack={handleBack}
    >
      <div className="space-y-6">
        {/* Main Message */}
        <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
          <div className="whitespace-pre-line">
            Tell us more about what you're looking for.
          </div>
          <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
        </div>

        {/* Information Message */}
        <div className="bg-[#e6e6e6] rounded-lg p-3 md:p-4 text-left text-sm md:text-base text-[#334D5C] relative mb-2.5 md:mb-4 max-w-full inline-block">
          <div className="whitespace-pre-line">
            We'll cover the type of property that you are looking for and the financing that you want.
          </div>
          <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
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
