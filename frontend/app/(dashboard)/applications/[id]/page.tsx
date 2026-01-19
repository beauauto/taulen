'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Form1003Layout } from '@/components/urla/Form1003Layout'
import { Card, CardContent } from '@/components/ui/card'

function ApplicationForm() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params?.id ? (params.id as string) : undefined
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Determine the next step in the original flow chain and redirect
    const determineNextStep = async () => {
      if (!applicationId || isNaN(applicationId)) {
        setIsLoading(false)
        return
      }

      try {
        // Verify token is available before making API call
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) {
          console.error('No token available for API call in /applications/[id]')
          console.error('localStorage keys:', typeof window !== 'undefined' ? Object.keys(localStorage) : 'N/A')
          setIsLoading(false)
          return
        }
        
        const { urlaApi } = await import('@/lib/api')
        
        // Load application data from database
        console.log('Loading application data for redirect, ID:', applicationId, 'token available:', !!token)
        const appResponse = await urlaApi.getApplication(applicationId)
        const appData = appResponse.data
        
        if (!appData) {
          setIsLoading(false)
          return
        }

        // Store loan purpose in sessionStorage for unified forms
        const loanPurpose = appData.loanPurpose || ''
        if (loanPurpose) {
          sessionStorage.setItem('loanPurpose', loanPurpose)
        }

        // Use currentFormStep from the database if available
        let nextStep = ''
        const currentFormStep = appData.currentFormStep as string | undefined

        if (currentFormStep) {
          // Use the stored form step to determine where to redirect
          sessionStorage.setItem('applicationId', applicationId.toString())
          sessionStorage.setItem('cameFromApplications', 'true')
          
          // Map form step to unified URL path (no need to check purchase vs refinance)
          if (currentFormStep.startsWith('borrower-info-1')) {
            nextStep = `/application/borrower-info-1?applicationId=${applicationId}`
          } else if (currentFormStep.startsWith('borrower-info-2')) {
            nextStep = `/application/borrower-info-2?applicationId=${applicationId}`
          } else if (currentFormStep.startsWith('co-borrower-question')) {
            nextStep = `/application/co-borrower-question?applicationId=${applicationId}`
          } else if (currentFormStep.startsWith('co-borrower-info-1')) {
            nextStep = `/application/co-borrower-info-1?applicationId=${applicationId}`
          } else if (currentFormStep.startsWith('co-borrower-info-2')) {
            nextStep = `/application/co-borrower-info-2?applicationId=${applicationId}`
          } else if (currentFormStep.startsWith('co-borrower-info')) {
            // Fallback for old form step name
            nextStep = `/application/co-borrower-info-1?applicationId=${applicationId}`
          } else if (currentFormStep.startsWith('review')) {
            nextStep = `/application/review?applicationId=${applicationId}`
          } else if (currentFormStep.startsWith('getting-to-know-you-intro')) {
            nextStep = `/application/getting-to-know-you-intro?applicationId=${applicationId}`
          } else if (currentFormStep.startsWith('loan')) {
            nextStep = `/application/loan?applicationId=${applicationId}`
          } else {
            // Fallback: use the form step as-is (assuming it's a full path)
            nextStep = `/application/${currentFormStep}?applicationId=${applicationId}`
          }
        } else {
          // Fallback: if no currentFormStep, use the old logic
          const borrowerData = appData.borrower as any
          const hasBasicBorrowerInfo = borrowerData?.firstName && borrowerData?.lastName && borrowerData?.email
          const hasExtendedBorrowerInfo = borrowerData?.maritalStatus && borrowerData?.currentAddress
          const hasCoBorrower = !!appData.coBorrower

          sessionStorage.setItem('applicationId', applicationId.toString())
          if (!hasBasicBorrowerInfo) {
            nextStep = `/application/borrower-info-1?applicationId=${applicationId}`
          } else if (!hasExtendedBorrowerInfo) {
            nextStep = `/application/borrower-info-2?applicationId=${applicationId}`
          } else if (!hasCoBorrower) {
            sessionStorage.setItem('cameFromApplications', 'true')
            nextStep = `/application/co-borrower-question?applicationId=${applicationId}`
          } else {
            sessionStorage.setItem('cameFromApplications', 'true')
            nextStep = `/application/getting-to-know-you-intro?applicationId=${applicationId}`
          }
        }

        if (nextStep) {
          router.replace(nextStep)
        } else {
          // If all steps are complete, stay on this page or redirect to a completion page
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to load application data:', error)
        setIsLoading(false)
      }
    }

    determineNextStep()
  }, [applicationId, router])

  if (!applicationId || isNaN(applicationId)) {
    return (
      <Form1003Layout
        sections={[]}
        currentSectionId=""
        title="Error"
        showNavigation={false}
        showTopMenu={true}
      >
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Invalid application ID</p>
          </CardContent>
        </Card>
      </Form1003Layout>
    )
  }

  // Show loading state while determining next step
  if (isLoading) {
    return (
      <Form1003Layout
        sections={[]}
        currentSectionId=""
        title="Loading Application"
        showNavigation={false}
        showTopMenu={true}
      >
        <div className="text-center text-gray-500 py-12">Loading...</div>
      </Form1003Layout>
    )
  }

  // This should rarely be reached as we redirect, but show a message just in case
  return (
    <Form1003Layout
      sections={[]}
      currentSectionId=""
      title="Application"
      showNavigation={false}
      showTopMenu={true}
    >
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600">Redirecting to continue your application...</p>
        </CardContent>
      </Card>
    </Form1003Layout>
  )
}

export default function ApplicationPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <ApplicationForm />
    </Suspense>
  )
}
