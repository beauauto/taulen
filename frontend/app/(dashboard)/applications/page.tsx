'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ApplicationsPage() {
  // TODO: Fetch applications from API
  const applications: any[] = []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Applications</h1>
        <Button asChild>
          <Link href="/applications/new">New Application</Link>
        </Button>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t started any applications yet.</p>
            <Button asChild>
              <Link href="/applications/new">Start Your First Application</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <CardTitle>{app.loanType} - {app.loanPurpose}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Loan Amount: ${app.loanAmount?.toLocaleString()}</p>
                <p>Status: {app.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
