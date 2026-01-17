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
    // Check if we have an application ID in session storage
    const storedAppId = sessionStorage.getItem('applicationId')
    if (storedAppId) {
      setApplicationId(parseInt(storedAppId, 10))
    }
  }, [])

  const handleEditTransaction = () => {
    router.push('/buy/review?edit=transaction')
  }

  const handleEditBorrower = () => {
    router.push('/buy/review?edit=borrower')
  }

  const handleContinue = () => {
    router.push('/buy/borrower-info-2')
  }

  const handleSaveLoanDetails = () => {
    // Return to summary (remove edit query param)
    router.push('/buy/review')
  }

  const handleSaveBorrower = () => {
    // Return to summary (remove edit query param)
    router.push('/buy/review')
  }

  const handleCancel = () => {
    // Return to summary (remove edit query param)
    router.push('/buy/review')
  }

  // Show edit forms based on query parameter
  if (editMode === 'transaction') {
    return (
      <LoanDetailsEditForm
      applicationId={applicationId}
      onSave={handleSaveLoanDetails}
      onCancel={handleCancel}
      loanType="Purchase"
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

  // Show summary by default
  return (
    <GettingStartedSummary
      applicationId={applicationId}
      onEditTransaction={handleEditTransaction}
      onEditBorrower={handleEditBorrower}
      onContinue={handleContinue}
    />
  )
}
