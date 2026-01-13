'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { PreApplicationWizard, PreApplicationData } from '@/components/urla/PreApplicationWizard'

export default function BuyHomePage() {
  const router = useRouter()
  const [selectedStage, setSelectedStage] = useState<string | null>(null)

  const handleSelection = (stage: string) => {
    setSelectedStage(stage)
  }

  const handleWizardComplete = async (data: PreApplicationData) => {
    // Validate required fields
    if (!data.email || !data.firstName || !data.lastName || !data.phone || !data.dateOfBirth) {
      alert('Please fill in all required fields')
      return
    }

    if (!data.password || data.password.length < 8) {
      alert('Password must be at least 8 characters long')
      return
    }

    if (!data.verificationMethod) {
      alert('Please select a verification method')
      return
    }

    if (!data.verificationCode || data.verificationCode.length !== 6) {
      alert('Please enter a valid 6-digit verification code')
      return
    }

    if (!data.creditCheckConsent) {
      alert('Please consent to the credit check to continue')
      return
    }

    try {
      // Import urlaApi and authUtils dynamically to avoid circular dependencies
      const { urlaApi } = await import('@/lib/api')
      const { authUtils } = await import('@/lib/auth')
      const { cookieUtils } = await import('@/lib/cookies')
      
      // Verify code and create borrower account with deal
      const response = await urlaApi.verifyAndCreateBorrower({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        password: data.password,
        dateOfBirth: data.dateOfBirth,
        address: data.currentAddress,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        estimatedPrice: data.estimatedPrice || 0,
        downPayment: data.downPayment || 0,
        loanPurpose: 'Purchase', // Default to Purchase for buy page
        verificationCode: data.verificationCode,
      })

      const { application, accessToken, refreshToken, user, preApplicationData } = response.data
      
      // Store tokens and user data for seamless authentication
      if (accessToken) {
        authUtils.setToken(accessToken)
        cookieUtils.setCookie('token', accessToken, 7) // 7 days
      }
      if (refreshToken) {
        authUtils.setRefreshToken(refreshToken)
        cookieUtils.setCookie('refreshToken', refreshToken, 30) // 30 days
      }
      if (user) {
        authUtils.setUser(user)
      }
      
      // Store pre-application data in sessionStorage for form pre-population
      if (preApplicationData) {
        sessionStorage.setItem('preApplicationData', JSON.stringify(preApplicationData))
      }
      
      // Small delay to ensure cookies are set and auth state is updated before redirect
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Use window.location.href to trigger a full page reload
      // This ensures useAuth hook picks up the new tokens and user data
      window.location.href = `/applications/${application.id}`
    } catch (error: any) {
      console.error('Failed to create application:', error)
      alert(error.response?.data?.error || 'Failed to create application. Please try again.')
    }
  }

  const handleWizardCancel = () => {
    setSelectedStage(null)
  }

  // Show wizard if stage is selected
  if (selectedStage) {
    return (
      <PreApplicationWizard
        stage={selectedStage}
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-bold text-indigo-600 cursor-pointer">Taulen</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Buy a Home
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let's get started! Where are you in your home buying journey?
          </p>
        </div>

        {/* Stage Selection Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-indigo-500"
            onClick={() => handleSelection('looking')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <CardTitle className="text-xl">Looking for a House</CardTitle>
              <CardDescription className="text-sm">
                Just starting to explore
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6 text-sm">
                Get pre-approved to understand your budget and strengthen your offer when you find the right home.
              </p>
              <Button className="w-full" size="lg">Get Pre-Approved</Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-indigo-500"
            onClick={() => handleSelection('offer')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-xl">Ready to Make an Offer</CardTitle>
              <CardDescription className="text-sm">
                Found your dream home
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6 text-sm">
                Fast-track your application to secure financing quickly and make a competitive offer.
              </p>
              <Button className="w-full" size="lg">Apply Now</Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-indigo-500"
            onClick={() => handleSelection('need_loan')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-xl">Need a Loan Now</CardTitle>
              <CardDescription className="text-sm">
                Urgent financing needed
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6 text-sm">
                Start your application immediately to get the financing you need as quickly as possible.
              </p>
              <Button className="w-full" size="lg">Start Application</Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Already have an account?
          </p>
          <Link href="/login">
            <Button variant="outline" size="lg">Sign In to Continue</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
