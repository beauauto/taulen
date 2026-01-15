'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle, ArrowRight, Home, User, Briefcase, DollarSign, FileText } from 'lucide-react'

interface Form1003IntroProps {
  applicationId: number
  onStart: () => void | Promise<void>
  showPurchaseOrRefi?: boolean // If true, will navigate to PurchaseOrRefi instead of form
}

// Define the main sections/tasks for the 1003 form
const FORM_TASKS = [
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Name, date of birth, contact details',
    icon: User,
    estimatedTime: '5 min',
  },
  {
    id: 'property-info',
    title: 'Property Information',
    description: 'Property address and details',
    icon: Home,
    estimatedTime: '3 min',
  },
  {
    id: 'employment',
    title: 'Employment History',
    description: 'Current and previous employment',
    icon: Briefcase,
    estimatedTime: '10 min',
  },
  {
    id: 'income',
    title: 'Income & Assets',
    description: 'Income sources and assets',
    icon: DollarSign,
    estimatedTime: '8 min',
  },
  {
    id: 'declarations',
    title: 'Declarations',
    description: 'Legal declarations and acknowledgments',
    icon: FileText,
    estimatedTime: '5 min',
  },
]

export function Form1003Intro({ applicationId, onStart }: Form1003IntroProps) {
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = async () => {
    setIsStarting(true)
    try {
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300))
      await onStart()
    } catch (error) {
      console.error('Error starting application:', error)
      setIsStarting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 rounded-full mb-4 sm:mb-6">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Let's Complete Your Application
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            We'll guide you through the process step by step. Most people complete this in about 30 minutes.
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-xl border-0 mb-6 sm:mb-8">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl">What You'll Need</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              We'll ask you about these topics:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {FORM_TASKS.map((task, index) => {
                const Icon = task.icon
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                            {task.title}
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600">
                            {task.description}
                          </p>
                        </div>
                        <span className="flex-shrink-0 text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap ml-2">
                          {task.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Helpful Tips */}
        <Card className="shadow-lg border-0 mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              💡 Helpful Tips
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>You can save your progress and come back anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>Have your documents ready (pay stubs, tax returns, bank statements)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>Answer questions honestly - we're here to help you get approved</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>All information is secure and encrypted</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <Button
            onClick={handleStart}
            disabled={isStarting}
            size="lg"
            className="w-full sm:w-auto min-w-[200px] text-base sm:text-lg px-8 py-6 sm:py-7 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            {isStarting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Starting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </Button>
          {applicationId > 0 && (
            <p className="text-xs sm:text-sm text-gray-500 text-center">
              Application #{applicationId}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
