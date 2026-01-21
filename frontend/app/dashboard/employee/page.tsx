'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { urlaApi } from '@/lib/api'

interface Application {
  id: string
  loanType: string
  loanPurpose: string
  loanAmount: number
  status: string
  createdDate: string
  lastUpdatedDate: string
}

export default function EmployeeDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (!isLoading && user && user.userType !== 'employee') {
      router.push('/applications')
      return
    }

    if (isAuthenticated && user?.userType === 'employee') {
      fetchApplications()
    }
  }, [isAuthenticated, isLoading, user, router])

  const fetchApplications = async () => {
    try {
      const response = await urlaApi.getMyApplications()
      setApplications(response.data.applications || [])
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.firstName} {user?.lastName}
          </p>
        </div>
        <Button asChild>
          <Link href="/applications/new">New Application</Link>
        </Button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Applications Under Management</h2>
        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">You don't have any applications assigned yet.</p>
              <Button asChild>
                <Link href="/applications/new">Create New Application</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {app.loanType} - {app.loanPurpose}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Application #{app.id}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      app.status === 'approved' ? 'bg-green-100 text-green-800' :
                      app.status === 'denied' ? 'bg-red-100 text-red-800' :
                      app.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Loan Amount</p>
                      <p className="text-lg font-semibold">
                        ${app.loanAmount?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="text-sm">
                        {new Date(app.createdDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/applications/${app.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
