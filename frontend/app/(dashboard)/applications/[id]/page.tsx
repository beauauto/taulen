'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { FormWizard } from '@/components/urla/FormWizard'
import { Form1003Intro } from '@/components/urla/Form1003Intro'
import { Card, CardContent } from '@/components/ui/card'
import { URLAFormData } from '@/types/urla'

function ApplicationForm() {
  const params = useParams()
  const applicationId = params?.id ? parseInt(params.id as string, 10) : undefined
  const [initialData, setInitialData] = useState<Partial<URLAFormData> | undefined>(undefined)
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    // Load pre-application data from sessionStorage if available
    const preAppDataStr = sessionStorage.getItem('preApplicationData')
    if (preAppDataStr) {
      try {
        const preAppData = JSON.parse(preAppDataStr)
        setInitialData({
          borrower: {
            firstName: preAppData.firstName || '',
            lastName: preAppData.lastName || '',
            email: preAppData.email || '',
            dateOfBirth: preAppData.dateOfBirth || '',
            ssn: '',
            maritalStatus: 'UNMARRIED',
            dependentsCount: 0,
            citizenshipStatus: 'US_CITIZEN',
            // Phone will be in contact info section
          },
          property: {
            // Address info from pre-application
            streetAddress: preAppData.address || '',
            city: preAppData.city || '',
            state: preAppData.state || '',
            zipCode: preAppData.zipCode || '',
            propertyType: 'SINGLE_FAMILY',
            propertyUsage: 'PRIMARY_RESIDENCE',
          },
        })
        // Clear sessionStorage after loading
        sessionStorage.removeItem('preApplicationData')
      } catch (error) {
        console.error('Failed to parse pre-application data:', error)
      }
    }

    // Check if user has already seen intro (stored in sessionStorage)
    const hasSeenIntro = sessionStorage.getItem(`form1003_intro_seen_${applicationId}`)
    if (hasSeenIntro === 'true') {
      setShowIntro(false)
    }
  }, [applicationId])

  const handleStartForm = () => {
    // Mark intro as seen
    if (applicationId) {
      sessionStorage.setItem(`form1003_intro_seen_${applicationId}`, 'true')
    }
    setShowIntro(false)
  }

  if (!applicationId || isNaN(applicationId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Invalid application ID</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show intro page first
  if (showIntro) {
    return <Form1003Intro applicationId={applicationId} onStart={handleStartForm} />
  }

  // Show form wizard after intro
  return (
    <div className="container mx-auto px-4 py-8">
      <FormWizard applicationId={applicationId} initialData={initialData} />
    </div>
  )
}

export default function ApplicationPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <ApplicationForm />
    </Suspense>
  )
}
