'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Form1003Layout } from '@/components/urla/Form1003Layout'
import { Card, CardContent } from '@/components/ui/card'

function ApplicationForm() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params?.id ? parseInt(params.id as string, 10) : undefined
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

        const borrowerData = appData.borrower as any
        const loanPurpose = appData.loanPurpose || ''
        const isPurchase = loanPurpose.toLowerCase() === 'purchase'
        const isRefinance = loanPurpose.toLowerCase() === 'refinance'

        // Determine which step in the original chain to redirect to
        let nextStep = ''

        // Check if borrower basic info exists (from borrower-info-1)
        const hasBasicBorrowerInfo = borrowerData?.firstName && borrowerData?.lastName && borrowerData?.email

        // Check if borrower extended info exists (from borrower-info-2)
        const hasExtendedBorrowerInfo = borrowerData?.maritalStatus && borrowerData?.currentAddress

        if (!hasBasicBorrowerInfo) {
          // Need to complete borrower-info-1
          // Store applicationId in sessionStorage and pass as query param
          sessionStorage.setItem('applicationId', applicationId.toString())
          nextStep = isPurchase 
            ? `/buy/borrower-info-1?applicationId=${applicationId}` 
            : `/refinance/borrower-info-1?applicationId=${applicationId}`
        } else if (!hasExtendedBorrowerInfo) {
          // Need to complete borrower-info-2
          // Store applicationId in sessionStorage and pass as query param
          sessionStorage.setItem('applicationId', applicationId.toString())
          nextStep = isPurchase 
            ? `/buy/borrower-info-2?applicationId=${applicationId}` 
            : `/refinance/borrower-info-2?applicationId=${applicationId}`
        } else {
          // Check if co-borrower question has been answered
          // For now, assume we need to ask about co-borrower
          // You can add more logic here to check if co-borrower info exists
          nextStep = `/applications/${applicationId}/co-borrower-question`
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
