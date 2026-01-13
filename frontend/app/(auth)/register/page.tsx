'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Helper to pre-fill form from URL or localStorage
function usePreFillForm(
  searchParams: URLSearchParams,
  setFirstName: (v: string) => void,
  setLastName: (v: string) => void,
  setEmail: (v: string) => void,
  setPhone: (v: string) => void
) {
  useEffect(() => {
    // Check URL params first
    const urlFirstName = searchParams.get('firstName')
    const urlLastName = searchParams.get('lastName')
    const urlEmail = searchParams.get('email')
    const urlPhone = searchParams.get('phone')
    
    if (urlFirstName) setFirstName(urlFirstName)
    if (urlLastName) setLastName(urlLastName)
    if (urlEmail) setEmail(urlEmail)
    if (urlPhone) setPhone(urlPhone)
    
    // Also check localStorage for pre-application data
    try {
      const preAppData = localStorage.getItem('preApplicationData')
      if (preAppData) {
        const data = JSON.parse(preAppData)
        if (data.firstName && !urlFirstName) setFirstName(data.firstName)
        if (data.lastName && !urlLastName) setLastName(data.lastName)
        if (data.email && !urlEmail) setEmail(data.email)
        if (data.phone && !urlPhone) setPhone(data.phone)
      }
    } catch (e) {
      // Ignore errors
    }
  }, [searchParams, setFirstName, setLastName, setEmail, setPhone])
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyAndRegister, isAuthenticated } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)

  // Pre-fill from URL parameters or localStorage
  usePreFillForm(searchParams, setFirstName, setLastName, setEmail, setPhone)

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    // Validate phone number
    if (!phone || phone.trim() === '') {
      setError('Phone number is required')
      return
    }

    setIsSendingCode(true)
    setError('')

    try {
      const { authApi } = await import('@/lib/api')
      await authApi.sendVerificationCodeForRegister(email, phone)
      setStep('verify')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send verification code')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits')
      return
    }

    setIsLoading(true)

    const result = await verifyAndRegister(
      email,
      password,
      firstName,
      lastName,
      phone,
      verificationCode
    )
    setIsLoading(false)

    if (result.success) {
      // Registration always creates a borrower, so redirect to applicant dashboard
      const redirect = searchParams.get('redirect')
      if (redirect) {
        router.push(redirect)
      } else {
        router.push('/dashboard/applicant')
      }
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Sign up to start your mortgage application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'form' ? (
            <form onSubmit={handleSendVerificationCode} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                  disabled={isSendingCode}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                  disabled={isSendingCode}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isSendingCode}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    // Format phone number as user types
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                    const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
                    setPhone(formatted || value)
                  }}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  required
                  disabled={isSendingCode}
                />
                <p className="text-xs text-gray-500">
                  Required for account security and verification. We'll send a code to this number.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={isSendingCode}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={isSendingCode}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSendingCode}>
                {isSendingCode ? 'Sending code...' : 'Send Verification Code'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <a href="/login" className="text-blue-600 hover:underline">
                  Sign in
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit verification code to your phone number.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {phone}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="verificationCode" className="text-sm font-medium">
                  Verification Code
                </label>
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setVerificationCode(value)
                  }}
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={isLoading}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
                {isLoading ? 'Creating account...' : 'Verify and Create Account'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('form')
                  setVerificationCode('')
                  setError('')
                }}
                disabled={isLoading}
              >
                Back
              </Button>

              <div className="text-center text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  className="text-blue-600 hover:underline"
                  disabled={isSendingCode}
                >
                  {isSendingCode ? 'Sending...' : 'Resend code'}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
