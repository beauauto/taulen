'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RefinanceBorrowerInfoPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the first form
    router.replace('/refinance/borrower-info-1')
  }, [router])

  return null
}
