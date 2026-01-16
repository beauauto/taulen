'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BorrowerBasicInfoForm, BorrowerBasicInfoFormData } from '@/components/urla/BorrowerBasicInfoForm'
import { TopMenu } from '@/components/layout/TopMenu'


function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyAndRegister, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState<BorrowerBasicInfoFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    confirmEmail: '',
    phone: '',
    phoneType: '',
    maritalStatus: '',
    isVeteran: false,
    currentAddress: '',
    sameAsMailing: true,
  })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Pre-fill from URL parameters or localStorage
  useEffect(() => {
    const urlFirstName = searchParams.get('firstName')
    const urlLastName = searchParams.get('lastName')
    const urlEmail = searchParams.get('email')
    const urlPhone = searchParams.get('phone')
    
    if (urlFirstName) setFormData(prev => ({ ...prev, firstName: urlFirstName }))
    if (urlLastName) setFormData(prev => ({ ...prev, lastName: urlLastName }))
    if (urlEmail) setFormData(prev => ({ ...prev, email: urlEmail }))
    if (urlPhone) setFormData(prev => ({ ...prev, phone: urlPhone }))
    
    // Also check localStorage for pre-application data
    try {
      const preAppData = localStorage.getItem('preApplicationData')
      if (preAppData) {
        const data = JSON.parse(preAppData)
        if (data.firstName && !urlFirstName) setFormData(prev => ({ ...prev, firstName: data.firstName }))
        if (data.lastName && !urlLastName) setFormData(prev => ({ ...prev, lastName: data.lastName }))
        if (data.email && !urlEmail) setFormData(prev => ({ ...prev, email: data.email }))
        if (data.phone && !urlPhone) setFormData(prev => ({ ...prev, phone: data.phone }))
      }
    } catch (e) {
      // Ignore errors
    }
  }, [searchParams])

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrors({})

    // Validate required fields
    const newErrors: Record<string, string> = {}
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    // 2FA is disabled - register without verification code
    const result = await verifyAndRegister(
      formData.email,
      password,
      formData.firstName,
      formData.lastName,
      formData.phone.replace(/\D/g, '') || '', // Phone is optional, remove formatting
      '' // No verification code needed
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopMenu showNavigation={false} />
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-900">Create an Account</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Sign up to start your mortgage application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <BorrowerBasicInfoForm
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              showMiddleName={false}
              showSuffix={false}
              showConfirmEmail={false}
              showPhoneType={false}
              showMaritalStatus={false}
              showVeteran={false}
              showAddress={false}
              showSameAsMailing={false}
              phoneRequired={false}
              useLegalLabel={false}
            />

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
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
                disabled={isLoading}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
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
                disabled={isLoading}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-normal text-base py-4 px-8 h-[55px] rounded transition-colors shadow-sm" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-indigo-600 hover:text-indigo-700 hover:underline">
                Sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
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
