'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { urlaApi } from '@/lib/api'
import { FormWizard } from '@/components/urla/FormWizard'
import { Form1003Intro } from '@/components/urla/Form1003Intro'
import { PurchaseOrRefiPage } from '@/components/urla/PurchaseOrRefiPage'
import { BorrowerInfoPage, BorrowerInfoData } from '@/components/urla/BorrowerInfoPage'

interface Application {
  id: number
  loanType: string
  loanPurpose: string
  loanAmount: number
  status: string
  createdDate: string
  lastUpdatedDate: string
  progressPercentage?: number
  lastUpdatedSection?: string
}

export default function ApplicantDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewApplicationIntro, setShowNewApplicationIntro] = useState(false)
  const [showPurchaseOrRefi, setShowPurchaseOrRefi] = useState(false)
  const [showBorrowerInfo, setShowBorrowerInfo] = useState(false)
  const [isNavCollapsed, setIsNavCollapsed] = useState(false)
  const [selectedLoanPurpose, setSelectedLoanPurpose] = useState<'Purchase' | 'Refinance' | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (!isLoading && user && user.userType !== 'applicant') {
      router.push('/dashboard/employee')
      return
    }

    if (isAuthenticated && user?.userType === 'applicant') {
      fetchApplications()
    }
  }, [isAuthenticated, isLoading, user, router])

  const fetchApplications = async () => {
    try {
      const response = await urlaApi.getMyApplications()
      const apps = response.data.applications || []
      // Sort by lastUpdatedDate (most recent first)
      apps.sort((a: Application, b: Application) => {
        const dateA = new Date(a.lastUpdatedDate || a.createdDate).getTime()
        const dateB = new Date(b.lastUpdatedDate || b.createdDate).getTime()
        return dateB - dateA
      })
      setApplications(apps)
      
      // Auto-select first application if available
      if (apps.length > 0 && !selectedApplicationId) {
        setSelectedApplicationId(apps[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationSelect = (appId: number) => {
    setSelectedApplicationId(appId)
    setShowNewApplicationIntro(false)
    setShowPurchaseOrRefi(false)
    setIsNavCollapsed(false) // Expand nav when selecting existing application
  }

  const handleStartNewApplication = async () => {
    // Create a new application
    try {
      // Collapse navigation first
      setIsNavCollapsed(true)
      
      const response = await urlaApi.createApplication({
        loanType: 'Conventional',
        loanPurpose: 'Purchase', // Temporary, will be updated by user selection
        loanAmount: 1, // Minimum required by backend (will be updated later with actual amount)
      })
      const newAppId = response.data.id
      
      // Set state before fetching to ensure UI updates correctly
      setSelectedApplicationId(newAppId)
      setShowPurchaseOrRefi(true)
      
      // Fetch updated applications list (this will update the list but won't affect the current view)
      await fetchApplications()
    } catch (error: any) {
      console.error('Failed to create application:', error)
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          'Failed to create application. Please try again.'
      alert(errorMessage)
      // Reset state on error
      setIsNavCollapsed(false)
      setShowPurchaseOrRefi(false)
    }
  }

  const handlePurchaseOrRefiSelect = async (loanPurpose: 'Purchase' | 'Refinance') => {
    if (!selectedApplicationId) return
    
    try {
      // Save the loan purpose to the application
      await urlaApi.saveApplication(selectedApplicationId, {
        loanPurpose: loanPurpose,
      })
      
      // Store loan purpose and show borrower info page
      setSelectedLoanPurpose(loanPurpose)
      setShowPurchaseOrRefi(false)
      setShowBorrowerInfo(true)
      // Keep nav collapsed for questionnaire flow
    } catch (error) {
      console.error('Failed to update application:', error)
      alert('Failed to save your selection. Please try again.')
    }
  }

  const handleBorrowerInfoComplete = async (borrowerData: BorrowerInfoData) => {
    if (!selectedApplicationId || !selectedLoanPurpose) return

    try {
      // Create borrower account and application using verifyAndCreateBorrower
      // This will create the account and link it to the application
      const { authUtils } = await import('@/lib/auth')
      const { cookieUtils } = await import('@/lib/cookies')
      
      // Generate a temporary password (user will set it later or we can prompt for it)
      // For now, we'll create the account without password and let them set it later
      // Actually, let's use verifyAndCreateBorrower but we need a password
      // For the questionnaire flow, we'll create account without password first
      // and save borrower info to application
      
      // Save borrower info to the application first
      await urlaApi.saveApplication(selectedApplicationId, {
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
        loanPurpose: selectedLoanPurpose,
      })

      // TODO: Create borrower account if doesn't exist
      // For now, we'll just save the info and continue
      // The account creation can happen when they set a password later

      // Fetch updated applications list to refresh the UI
      await fetchApplications()

      // Hide borrower info page and show form wizard
      setShowBorrowerInfo(false)
      // Keep nav collapsed for questionnaire flow
    } catch (error) {
      console.error('Failed to save borrower information:', error)
      alert('Failed to save your information. Please try again.')
    }
  }

  const handleBackFromPurchaseOrRefi = () => {
    setShowPurchaseOrRefi(false)
    setShowBorrowerInfo(false)
    setIsNavCollapsed(false)
    setSelectedApplicationId(null)
    setSelectedLoanPurpose(null)
  }

  const handleIntroComplete = () => {
    setShowNewApplicationIntro(false)
    // The form wizard will be shown automatically since selectedApplicationId is set
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // If we're showing PurchaseOrRefi, show it in full screen with nav collapsed
  // Check this FIRST before checking applications list to ensure nav is hidden
  if (showPurchaseOrRefi && selectedApplicationId) {
    return (
      <div className="min-h-screen">
        <PurchaseOrRefiPage
          applicationId={selectedApplicationId}
          onSelect={handlePurchaseOrRefiSelect}
          onBack={handleBackFromPurchaseOrRefi}
        />
      </div>
    )
  }

  // If we're showing BorrowerInfo, show it in full screen with nav collapsed
  if (showBorrowerInfo && selectedApplicationId) {
    return (
      <div className="min-h-screen">
        <BorrowerInfoPage
          applicationId={selectedApplicationId}
          onNext={handleBorrowerInfoComplete}
          onBack={() => {
            setShowBorrowerInfo(false)
            setShowPurchaseOrRefi(true)
          }}
        />
      </div>
    )
  }

  // If borrower has no applications and no selected application, show intro page only
  if (applications.length === 0 && !selectedApplicationId) {
    // Create a temporary application ID for the intro (will create actual application when they click "Get Started")
    return (
      <div className="min-h-screen">
        <Form1003Intro 
          applicationId={0} 
          onStart={handleStartNewApplication}
        />
      </div>
    )
  }

  // If borrower has applications, show dashboard with applications list on left and form on right
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Applications List (collapsed when showing questionnaire) */}
      {!isNavCollapsed && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-2">My Applications</h2>
          <Button 
            onClick={handleStartNewApplication}
            size="sm" 
            className="w-full"
          >
            New Application
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {applications.map((app) => (
              <Card
                key={app.id}
                className={`mb-2 cursor-pointer transition-all ${
                  selectedApplicationId === app.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'hover:border-gray-300'
                }`}
                onClick={() => handleApplicationSelect(app.id)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">
                        {app.loanPurpose || 'Application'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        #{app.id}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      app.status === 'Denied' ? 'bg-red-100 text-red-800' :
                      app.status === 'InReview' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {app.status || 'Draft'}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Progress</span>
                      <span className="text-xs font-medium">
                        {app.progressPercentage ?? 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${app.progressPercentage ?? 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-2">
                    Updated {new Date(app.lastUpdatedDate || app.createdDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        </div>
      )}

      {/* Right Panel - Application Form, Intro, or PurchaseOrRefi */}
      <div className={`flex-1 overflow-y-auto ${isNavCollapsed ? 'w-full' : ''}`}>
        {showNewApplicationIntro && selectedApplicationId ? (
          <Form1003Intro 
            applicationId={selectedApplicationId} 
            onStart={handleIntroComplete}
          />
        ) : selectedApplicationId ? (
          <div className="p-6">
            <FormWizard applicationId={selectedApplicationId} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-4">Select an application to continue</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
