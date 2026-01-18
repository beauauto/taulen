'use client'

import { GettingStartedSummary } from '@/components/urla/GettingStartedSummary'
import { LoanDetailsEditForm } from '@/components/urla/LoanDetailsEditForm'
import { BorrowerEditForm } from '@/components/urla/BorrowerEditForm'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function BuyReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [applicationId, setApplicationId] = useState<number | undefined>(undefined)
  const editMode = searchParams?.get('edit') // 'transaction' or 'borrower'

  useEffect(() => {
    // Check if we have an application ID in session storage or URL params
    const searchParams = new URLSearchParams(window.location.search)
    const appIdFromUrl = searchParams.get('applicationId')
    const storedAppId = sessionStorage.getItem('applicationId')
    const appId = appIdFromUrl || storedAppId
    
    if (appId) {
      const id = parseInt(appId, 10)
      setApplicationId(id)
      // Store in sessionStorage if from URL
      if (appIdFromUrl && !storedAppId) {
        sessionStorage.setItem('applicationId', appId)
      }
    }
  }, [])

  const handleEditTransaction = () => {
    router.push('/application/review?edit=transaction')
  }

  const handleEditBorrower = () => {
    router.push('/application/review?edit=borrower')
  }

  const handleContinue = async () => {
    // Navigate to Loan & Property Intro (getting-to-know-you-intro)
    const appId = applicationId || sessionStorage.getItem('applicationId')
    
    // Update form step to getting-to-know-you-intro
    if (appId) {
      try {
        const { urlaApi } = await import('@/lib/api')
        await urlaApi.saveApplication(
          typeof appId === 'number' ? appId : parseInt(appId, 10),
          {
            nextFormStep: 'getting-to-know-you-intro',
          }
        )
      } catch (error) {
        console.error('Failed to update form step:', error)
        // Continue anyway - navigation will still work
      }
    }
    
    const url = appId ? `/application/getting-to-know-you-intro?applicationId=${appId}` : '/application/getting-to-know-you-intro'
    router.push(url)
  }

  const handleSaveLoanDetails = () => {
    // Return to summary (remove edit query param)
    router.push('/application/review')
  }

  const handleSaveBorrower = () => {
    // Return to summary (remove edit query param)
    router.push('/application/review')
  }

  const handleCancel = () => {
    // Return to summary (remove edit query param)
    router.push('/application/review')
  }

  // Show edit forms based on query parameter
  if (editMode === 'transaction') {
    // Get loan purpose from sessionStorage or application data
    const loanPurpose = sessionStorage.getItem('loanPurpose') || 'Purchase'
    const loanType = loanPurpose === 'Refinance' ? 'Refinance' : 'Purchase'
    
    return (
      <LoanDetailsEditForm
      applicationId={applicationId}
      onSave={handleSaveLoanDetails}
      onCancel={handleCancel}
      loanType={loanType}
    />
    )
  }

  if (editMode === 'borrower') {
    return (
      <BorrowerEditForm
        applicationId={applicationId}
        onSave={handleSaveBorrower}
        onCancel={handleCancel}
      />
    )
  }

  const handleBack = async () => {
    // Go back to the last completed form in the 1003 flow
    // Check if co-borrower exists to determine which form to go back to
    const appId = applicationId || sessionStorage.getItem('applicationId')
    
    if (appId) {
      try {
        const { urlaApi } = await import('@/lib/api')
        const appResponse = await urlaApi.getApplication(
          typeof appId === 'number' ? appId : parseInt(appId, 10)
        )
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

  // Show summary by default
  return (
    <GettingStartedSummary
      applicationId={applicationId}
      onEditTransaction={handleEditTransaction}
      onEditBorrower={handleEditBorrower}
      onContinue={handleContinue}
      onBack={handleBack}
    />
  )
}
