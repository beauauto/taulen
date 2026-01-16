'use client'

import { GettingStartedSummary } from '@/components/urla/GettingStartedSummary'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function BuyReviewPage() {
  const router = useRouter()
  const [applicationId, setApplicationId] = useState<number | undefined>(undefined)

  useEffect(() => {
    // Check if we have an application ID in session storage
    const storedAppId = sessionStorage.getItem('applicationId')
    if (storedAppId) {
      setApplicationId(parseInt(storedAppId, 10))
    }
  }, [])

  const handleEditTransaction = () => {
    router.push('/getting-started')
  }

  const handleEditBorrower = () => {
    router.push('/buy/borrower-info-1')
  }

  const handleContinue = () => {
    router.push('/buy/borrower-info-2')
  }

  return (
    <GettingStartedSummary
      applicationId={applicationId}
      onEditTransaction={handleEditTransaction}
      onEditBorrower={handleEditBorrower}
      onContinue={handleContinue}
    />
  )
}
