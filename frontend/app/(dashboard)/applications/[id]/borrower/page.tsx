'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BorrowerInfoPage, BorrowerInfoData } from '@/components/urla/BorrowerInfoPage'
import { urlaApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

function BorrowerFormPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const applicationId = params?.id ? parseInt(params.id as string, 10) : undefined
  const [initialData, setInitialData] = useState<{
    firstName?: string
    middleName?: string
    lastName?: string
    suffix?: string
    email?: string
    phone?: string
    currentAddress?: string
    maritalStatus?: string
    isMilitary?: boolean
  }>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadBorrowerData = async () => {
      if (!applicationId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // First, try to load from database via API
        console.log('Loading borrower data for application:', applicationId)
        const response = await urlaApi.getApplication(applicationId)
        const application = response.data
        console.log('Application response:', application)
        
        if (application.borrower) {
          console.log('Borrower data from API:', application.borrower)
          console.log('Current address from API:', application.borrower.currentAddress)
          const initialDataToSet = {
            firstName: application.borrower.firstName || '',
            middleName: application.borrower.middleName || '',
            lastName: application.borrower.lastName || '',
            suffix: application.borrower.suffix || '',
            email: application.borrower.email || '',
            phone: application.borrower.phone || '',
            currentAddress: application.borrower.currentAddress || '',
            maritalStatus: application.borrower.maritalStatus || '',
            isMilitary: application.borrower.isMilitary || false,
          }
          console.log('Setting initial data with currentAddress:', initialDataToSet.currentAddress)
          setInitialData(initialDataToSet)
          return
        }

        // Fallback: Try to use user data from auth if available
        if (user && user.userType === 'applicant') {
          console.log('Using user data from auth as fallback:', user)
          setInitialData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: '', // Phone not in user object
          })
          return
        }

        // Fallback: Load pre-application data from sessionStorage if available
        const preAppDataStr = sessionStorage.getItem('preApplicationData')
        if (preAppDataStr) {
          try {
            const preAppData = JSON.parse(preAppDataStr)
            setInitialData({
              firstName: preAppData.firstName || '',
              lastName: preAppData.lastName || '',
              email: preAppData.email || '',
              phone: preAppData.phone || '',
            })
          } catch (error) {
            console.error('Failed to parse pre-application data:', error)
          }
        }
      } catch (error) {
        console.error('Failed to load borrower data:', error)
        
        // Fallback: Try to use user data from auth if available
        if (user && user.userType === 'applicant') {
          console.log('Using user data from auth as fallback after API error:', user)
          setInitialData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: '', // Phone not in user object
          })
        } else {
          // Fallback: Load pre-application data from sessionStorage if API fails
          const preAppDataStr = sessionStorage.getItem('preApplicationData')
          if (preAppDataStr) {
            try {
              const preAppData = JSON.parse(preAppDataStr)
              setInitialData({
                firstName: preAppData.firstName || '',
                lastName: preAppData.lastName || '',
                email: preAppData.email || '',
                phone: preAppData.phone || '',
              })
            } catch (parseError) {
              console.error('Failed to parse pre-application data:', parseError)
            }
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadBorrowerData()
  }, [applicationId, user])

  const handleBorrowerInfoComplete = async (borrowerData: BorrowerInfoData) => {
    if (!applicationId) return

    try {
      // Save borrower info to the application
      await urlaApi.saveApplication(applicationId, {
        borrower: {
          firstName: borrowerData.firstName,
          middleName: borrowerData.middleName,
          lastName: borrowerData.lastName,
          suffix: borrowerData.suffix,
          email: borrowerData.email,
          phone: borrowerData.phone,
          phoneType: borrowerData.phoneType,
          maritalStatus: borrowerData.maritalStatus,
          isMilitary: borrowerData.isMilitary,
          currentAddress: borrowerData.currentAddress,
        },
      })

      // Clear pre-application data from sessionStorage
      sessionStorage.removeItem('preApplicationData')

      // Navigate to the next section or back to application overview
      router.push(`/applications/${applicationId}`)
    } catch (error) {
      console.error('Failed to save borrower information:', error)
      alert('Failed to save your information. Please try again.')
    }
  }

  if (!applicationId || isNaN(applicationId)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Invalid application ID</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading borrower information...</div>
      </div>
    )
  }

  return (
    <BorrowerInfoPage
      applicationId={applicationId}
      initialData={initialData}
      onNext={handleBorrowerInfoComplete}
    />
  )
}

export default function BorrowerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <BorrowerFormPage />
    </Suspense>
  )
}
