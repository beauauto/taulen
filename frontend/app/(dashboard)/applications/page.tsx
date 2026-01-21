'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { urlaApi } from '@/lib/api'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

// Simple Progress component if not available
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className || ''}`}>
    <div
      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
)

interface Application {
  id: string
  loanType: string
  loanPurpose: string
  loanAmount: number
  status: string
  createdDate: string
  lastUpdatedDate: string
  progressPercentage?: number
  lastUpdatedSection?: string
}

export default function ApplicationsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  const sections: FormSection[] = [
    {
      id: 'applications',
      title: 'My Applications',
      current: true,
    },
  ]

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated && user?.userType === 'applicant') {
      fetchApplications()
    }
  }, [isAuthenticated, isLoading, user, router])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await urlaApi.getMyApplications()
      console.log('getMyApplications response:', response)
      console.log('response.data:', response.data)
      console.log('response.data type:', typeof response.data)
      
      // Handle different response formats
      let apps: Application[] = []
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          apps = response.data
          console.log('Response data is array, length:', apps.length)
        } else if (response.data.applications) {
          apps = response.data.applications
          console.log('Response data has applications property, length:', apps.length)
        } else if (response.data.id) {
          // Single application object
          apps = [response.data]
          console.log('Found single application object')
        } else {
          console.warn('Unexpected response format:', response.data)
        }
      } else {
        console.warn('No data in response:', response)
      }
      
      console.log('Applications found:', apps.length)
      console.log('Applications:', apps)
      
      // Sort by lastUpdatedDate (most recent first)
      apps.sort((a: Application, b: Application) => {
        const dateA = new Date(a.lastUpdatedDate || a.createdDate).getTime()
        const dateB = new Date(b.lastUpdatedDate || b.createdDate).getTime()
        return dateB - dateA
      })
      
      setApplications(apps)
      
      // If applications found, redirect to most recent one
      // Only redirect if we're not already on the applications page (avoid redirect loops)
      if (apps.length > 0 && !window.location.pathname.includes('/applications/')) {
        const mostRecentApp = apps[0]
        console.log('Found applications, redirecting to most recent:', mostRecentApp.id)
        router.push(`/applications/${mostRecentApp.id}`)
      } else if (apps.length === 0) {
        console.log('No applications found for borrower')
      }
    } catch (error: any) {
      console.error('Failed to fetch applications:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartFirstApplication = () => {
    router.push('/getting-started')
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'denied':
        return 'bg-red-100 text-red-800'
      case 'in_review':
        return 'bg-blue-100 text-blue-800'
      case 'submitted':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading || loading) {
    return (
      <Form1003Layout
        sections={sections}
        currentSectionId="applications"
        title="My Applications"
        showNavigation={false}
        showTopMenu={true}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-gray-500 mb-2">Loading applications...</div>
          </div>
        </div>
      </Form1003Layout>
    )
  }

  if (applications.length === 0) {
    // No applications - show form with "Starting Your First Application" button (no top menu)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-2xl w-full px-4">
          <Card className="border-2 border-gray-200">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Your Application Portal
              </CardTitle>
              <p className="text-gray-600">
                You haven&apos;t started any applications yet. Let&apos;s get started with your first mortgage application.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Information message */}
              <div className="bg-[#e6e6e6] rounded-lg p-4 text-left text-sm text-[#334D5C] relative">
                <div className="whitespace-pre-line">
                  Complete your mortgage application step by step. We&apos;ll guide you through the process and help you every step of the way.
                </div>
                <div className="hidden lg:block absolute -left-2 bottom-0 w-0 h-0 border-l-[11px] border-l-transparent border-b-[11px] border-b-[#e6e6e6] border-r-[8px] border-r-[#e6e6e6]"></div>
              </div>

              {/* What you'll need section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">What you&apos;ll need:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Personal information (name, date of birth, SSN)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Employment and income details</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Property information (if purchasing)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Asset and liability information</span>
                  </li>
                </ul>
              </div>

              {/* Start button */}
              <div className="pt-4 flex justify-center">
                <Button
                  onClick={handleStartFirstApplication}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-normal text-base py-4 px-8 h-[55px] rounded transition-colors shadow-sm max-w-md flex items-center justify-center gap-2"
                >
                  <span>Starting Your First Application</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Applications list (with top menu)
  return (
    <Form1003Layout
      sections={sections}
      currentSectionId="applications"
      title="My Applications"
      showNavigation={false}
      showTopMenu={true}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
          </h2>
          <Button
            onClick={() => router.push('/getting-started')}
            variant="outline"
            size="sm"
          >
            New Application
          </Button>
        </div>

        <div className="grid gap-4">
          {applications.map((app) => (
            <Card
              key={app.id}
              className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-indigo-300"
              onClick={() => router.push(`/applications/${app.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {app.loanPurpose || 'Mortgage Application'}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>Application #{app.id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Updated {formatDate(app.lastUpdatedDate || app.createdDate)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                    {app.status || 'Draft'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Loan Amount</p>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {app.loanAmount ? app.loanAmount.toLocaleString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Loan Type</p>
                    <p className="text-sm font-medium">{app.loanType || 'Conventional'}</p>
                  </div>
                </div>

                {app.progressPercentage !== undefined && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-500">Progress</p>
                      <p className="text-sm font-medium text-indigo-600">
                        {app.progressPercentage}% Complete
                      </p>
                    </div>
                    <Progress value={app.progressPercentage} className="h-2" />
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/applications/${app.id}`)
                    }}
                  >
                    Continue Application
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Form1003Layout>
  )
}
