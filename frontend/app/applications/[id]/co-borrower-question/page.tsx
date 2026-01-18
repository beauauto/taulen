'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'

export default function CoBorrowerQuestionPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params?.id as string

  const sections: FormSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      completed: true,
    },
    {
      id: 'getting-to-know-you',
      title: 'Loan & Property',
      completed: true,
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
    if (applicationId) {
      router.push(`/applications/${applicationId}/co-borrower-info`)
    }
  }

  const handleNo = () => {
    if (applicationId) {
      router.push(`/applications/${applicationId}`)
    }
  }

  const handleBack = () => {
    if (applicationId) {
      router.push(`/applications/${applicationId}`)
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
