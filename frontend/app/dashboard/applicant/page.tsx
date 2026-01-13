'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { urlaApi } from '@/lib/api'
import { FormWizard } from '@/components/urla/FormWizard'

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
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Applications List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Applications</h2>
          <Button asChild size="sm" className="w-full">
            <Link href="/buy">New Application</Link>
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {applications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="mb-4">No applications yet</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/buy">Start Application</Link>
              </Button>
            </div>
          ) : (
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
          )}
        </div>
        
        {/* Dashboard Section (empty for now) */}
        <div className="p-4 border-t border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Dashboard</h2>
          <p className="text-sm text-gray-500">Coming soon</p>
        </div>
      </div>

      {/* Main Panel - Application Form */}
      <div className="flex-1 overflow-y-auto">
        {selectedApplicationId ? (
          <div className="p-6">
            <FormWizard applicationId={selectedApplicationId} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-4">Select an application to continue</p>
              {applications.length === 0 && (
                <Button asChild>
                  <Link href="/buy">Start New Application</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
