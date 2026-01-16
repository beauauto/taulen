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
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)

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

    // Check application progress to determine if intro should be shown
    const checkProgress = async () => {
      if (!applicationId) {
        setIsLoadingProgress(false)
        return
      }

      try {
        const { urlaApi } = await import('@/lib/api')
        const progressResponse = await urlaApi.getApplicationProgress(applicationId)
        const progress = progressResponse.data
        const progressPercentage = progress.progressPercentage || 0

        // If user has made progress (> 0%), skip intro and go straight to form
        // Also check if they've seen intro before
        const hasSeenIntro = sessionStorage.getItem(`form1003_intro_seen_${applicationId}`)
        if (progressPercentage > 0 || hasSeenIntro === 'true') {
          setShowIntro(false)
        }
      } catch (error) {
        console.error('Failed to load progress:', error)
        // On error, check sessionStorage fallback
        const hasSeenIntro = sessionStorage.getItem(`form1003_intro_seen_${applicationId}`)
        if (hasSeenIntro === 'true') {
          setShowIntro(false)
        }
      } finally {
        setIsLoadingProgress(false)
      }
    }

    checkProgress()
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

  // Show loading state while checking progress
  if (isLoadingProgress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    )
  }

  // Show intro page first (only if no progress and hasn't been seen)
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
