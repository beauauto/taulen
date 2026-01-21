'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormWizard } from '@/components/urla/FormWizard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { urlaApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

function NewApplicationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const [step, setStep] = useState<'start' | 'form'>('start')
  const [loanType, setLoanType] = useState('Conventional')
  const [loanPurpose, setLoanPurpose] = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [applicationId, setApplicationId] = useState<string>()
  const [error, setError] = useState('')

  useEffect(() => {
    // Pre-fill loan purpose from URL parameter
    const purpose = searchParams.get('purpose')
    if (purpose === 'purchase') {
      setLoanPurpose('Purchase')
    } else if (purpose === 'refinance') {
      setLoanPurpose('Refinance')
    } else if (purpose === 'home_equity') {
      setLoanPurpose('Home Equity')
    }
    
    // Store the stage (if provided) for later use
    // Stage values: 'looking', 'offer', 'need_loan'
    const stage = searchParams.get('stage')
    if (stage) {
      // Could store in localStorage or state for later use
      // This helps us understand where the applicant is in the process
    }
    
    // Note: We allow viewing the form without authentication
    // Authentication will be required when creating the application
  }, [searchParams])

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!loanType || !loanPurpose || !loanAmount) {
      setError('Please fill in all fields')
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      // For pre-applications, we could store in localStorage/session
      // For now, redirect to sign up
      router.push(`/register?redirect=${encodeURIComponent(`/applications/new?purpose=${searchParams.get('purpose') || ''}`)}`)
      return
    }

    setIsCreating(true)
    try {
      const response = await urlaApi.createApplication({
        loanType: loanType,
        loanPurpose: loanPurpose,
        loanAmount: parseFloat(loanAmount),
      })
      setApplicationId(response.data.id)
      setStep('form')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create application')
    } finally {
      setIsCreating(false)
    }
  }

  if (step === 'start') {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Start New Application</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStart} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Loan Type *</label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select...</option>
                  <option value="Conventional">Conventional</option>
                  <option value="FHA">FHA</option>
                  <option value="VA">VA</option>
                  <option value="USDA">USDA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Loan Purpose *</label>
                <select
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select...</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Refinance">Refinance</option>
                  <option value="Home Equity">Home Equity</option>
                  <option value="Cash-Out Refinance">Cash-Out Refinance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Loan Amount *</label>
                <Input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="500000"
                  required
                  min="0"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Start Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <FormWizard applicationId={applicationId} />
}

export default function NewApplicationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <NewApplicationForm />
    </Suspense>
  )
}
