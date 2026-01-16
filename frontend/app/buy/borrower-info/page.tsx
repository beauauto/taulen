'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BorrowerInfoPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the first form
    router.replace('/buy/borrower-info-1')
  }, [router])

  return null
}
