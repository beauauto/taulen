'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()

  const handleOptionClick = (purpose: string) => {
    // For pre-applications, we can create without authentication
    // Store in session/localStorage and link to account later
    router.push(`/applications/new?purpose=${purpose}`)
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

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Your Mortgage Journey Starts Here
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started with your mortgage application. Choose the option that best fits your needs.
          </p>
        </div>

        {/* Main Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card 
            className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-indigo-500"
            onClick={() => router.push('/buy')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Buy a Home</CardTitle>
              <CardDescription className="text-base">
                Purchase your dream home with a new mortgage
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Get pre-approved and find your perfect home with competitive rates and flexible terms.
              </p>
              <Button className="w-full" size="lg">Get Started</Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-indigo-500"
            onClick={() => handleOptionClick('refinance')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Refinance</CardTitle>
              <CardDescription className="text-base">
                Lower your rate or change your loan terms
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Reduce your monthly payments or adjust your loan terms with a refinance.
              </p>
              <Button className="w-full" size="lg">Get Started</Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-indigo-500"
            onClick={() => handleOptionClick('home_equity')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Home Equity</CardTitle>
              <CardDescription className="text-base">
                Tap into your home's equity
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Access cash from your home's equity for renovations, debt consolidation, or other needs.
              </p>
              <Button className="w-full" size="lg">Get Started</Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Already started an application?
          </p>
          <Link href="/login">
            <Button variant="outline" size="lg">Sign In to Continue</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
