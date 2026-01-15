'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'

export default function GettingStartedPage() {
  const router = useRouter()

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

  const handlePurchase = () => {
    router.push('/buy')
  }

  const handleRefinance = () => {
    router.push('/refinance')
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
