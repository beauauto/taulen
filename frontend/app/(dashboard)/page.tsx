'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-[#444444] mb-2">Dashboard</h1>
          {user && (
            <p className="text-[#757575] text-lg">
              Welcome back, {user.firstName} {user.lastName}!
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#444444]">My Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#444444]">0</p>
              <Button variant="link" className="p-0 mt-2 text-amber-600 hover:text-amber-700" asChild>
                <Link href="/applications">View all applications →</Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#444444]">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#444444]">0</p>
              <p className="text-sm text-[#757575] mt-2">Applications in progress</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#444444]">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#444444]">0</p>
              <p className="text-sm text-[#757575] mt-2">Submitted applications</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#444444]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" asChild>
                <Link href="/getting-started">Start New Application</Link>
              </Button>
              <Button variant="outline" className="w-full border-gray-300 text-[#444444] hover:bg-gray-50" asChild>
                <Link href="/applications">View Applications</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#444444]">Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#757575] mb-4">
                Begin your mortgage application by clicking &quot;Start New Application&quot; above.
                You can save your progress and return to complete it later.
              </p>
              <Button variant="outline" className="w-full border-gray-300 text-[#444444] hover:bg-gray-50" asChild>
                <Link href="/getting-started">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
