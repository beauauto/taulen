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

  const handleWizardComplete = (data: PreApplicationData) => {
    // Store the pre-application data
    // For now, we'll redirect to sign up/register with the data
    // In the future, we could create a pre-application in the database
    const queryParams = new URLSearchParams({
      purpose: 'purchase',
      stage: data.stage,
      ...(data.location && { location: data.location }),
      ...(data.estimatedPrice && { price: String(data.estimatedPrice) }),
      ...(data.downPayment && { downPayment: String(data.downPayment) }),
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.email && { email: data.email }),
      ...(data.phone && { phone: data.phone }),
    })
    
    // Store detailed data in localStorage for later use
    localStorage.setItem('preApplicationData', JSON.stringify(data))
    
    // Redirect to registration with pre-filled data
    router.push(`/register?redirect=${encodeURIComponent(`/applications/new?${queryParams.toString()}`)}`)
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
