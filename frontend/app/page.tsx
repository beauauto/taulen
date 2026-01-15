'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()

  const handleContinue = () => {
    // Navigate to the getting started page
    router.push('/getting-started')
  }

  const steps = [
    {
      title: "Tell us what you're looking for",
      description: "Complete your profile so we can see what you may be able to afford.",
    },
    {
      title: "Get personalized rates",
      description: "We'll help you compare loan options you might qualify for.",
    },
    {
      title: "Upload documents for approval",
      description: "If you're approved, we'll support you through closing.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#F3F3F3] flex flex-col">
      {/* Top Menu Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-bold text-gray-800 cursor-pointer">Taulen</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Two Pane Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Pane */}
        <div className="w-full lg:w-[40%] xl:w-[35%] lg:fixed lg:left-0 lg:top-16 lg:h-[calc(100vh-4rem)] bg-gray-50 flex flex-col">
          <div className="flex-1 flex flex-col p-4 lg:pt-8 lg:pr-[10%] lg:pb-8 lg:pl-[10%]">
            {/* Text Container */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="w-full lg:w-[90%]">
                {/* Title and Subtitle */}
                <div>
                  <h1 className="text-[28px] lg:text-[34px] xl:text-[38px] leading-tight text-[#666666] font-serif mb-3 lg:mb-4">
                    We'll help you every step of the way
                  </h1>
                  <h2 className="text-sm lg:text-base xl:text-lg leading-relaxed text-[#666666]">
                    From applying to closing, we'll help you reach your goal.
                  </h2>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 lg:pt-6">
              <div className="flex flex-col space-y-2 text-xs text-[#404040]">
                <div className="flex flex-wrap items-center gap-x-2.5">
                  <Link href="/terms" className="underline hover:text-[#1a1a1a]">
                    Terms of Use
                  </Link>
                  <span className="text-base">|</span>
                  <Link href="/privacy" className="underline hover:text-[#1a1a1a]">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane */}
        <div className="w-full lg:w-[60%] xl:w-[65%] lg:fixed lg:right-0 lg:top-16 lg:h-[calc(100vh-4rem)] bg-white overflow-auto">
          <div className="h-[25vh] lg:h-[calc(25vh-120px)]"></div>
          <div className="p-4 lg:p-0 lg:pr-[5%] lg:pb-[5%] lg:pl-[5%] lg:mt-[120px] lg:min-h-[calc(75vh-49px)]">
            <div className="max-w-[550px] mx-auto">
              {/* Step Indicator */}
              <div className="mb-6 lg:mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs lg:text-sm font-semibold text-amber-600 uppercase tracking-wide">
                      Step 1 of 3
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((num) => (
                        <div
                          key={num}
                          className={`rounded-full ${
                            num === 1
                              ? 'w-3 h-3 bg-amber-600 border-2 border-amber-600'
                              : 'w-2.5 h-2.5 bg-gray-300 border-2 border-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Steps Timeline */}
              <div className="mb-8">
                <h2 className="text-[10px] lg:text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-4 lg:mb-6 pl-1">
                  Your Mortgage Journey
                </h2>
                <div className="border-l-2 border-[#E0E0E0] pl-8 lg:pl-10 xl:pl-14">
                  {steps.map((step, index) => {
                    const isCurrent = index === 0
                    const isCompleted = false // No steps completed yet
                    const isUpcoming = index > 0
                    
                    return (
                      <div
                        key={index}
                        className={`relative pb-8 lg:pb-11 ${
                          index === steps.length - 1 ? '' : ''
                        }`}
                      >
                        {/* Timeline Circle */}
                        <div
                          className={`absolute -left-[21px] lg:-left-[25px] xl:-left-[29px] top-0 w-6 h-6 rounded-full border-2 ${
                            isCurrent
                              ? 'bg-amber-600 border-amber-600 shadow-lg'
                              : isCompleted
                              ? 'bg-green-500 border-green-500'
                              : 'bg-white border-[#E0E0E0]'
                          }`}
                        >
                          {isCurrent && (
                            <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                              1
                            </div>
                          )}
                          {isCompleted && (
                            <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                              ✓
                            </div>
                          )}
                          {isUpcoming && (
                            <div className="absolute inset-0 flex items-center justify-center text-[#E0E0E0] text-xs font-semibold">
                              {index + 1}
                            </div>
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="pt-0.5">
                          <div className="flex items-start">
                            <div className="flex-1">
                              {isCurrent && (
                                <div className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded mb-2">
                                  Current Step
                                </div>
                              )}
                              <h3
                                className={`text-lg lg:text-2xl font-bold ${
                                  isCurrent
                                    ? 'text-[#444444]'
                                    : isCompleted
                                    ? 'text-[#444444]'
                                    : 'text-[#999999]'
                                } mb-2`}
                              >
                                {step.title}
                              </h3>
                              <p className={`text-sm leading-relaxed mt-1.5 ${
                                isCurrent
                                  ? 'text-[#757575]'
                                  : isCompleted
                                  ? 'text-[#757575]'
                                  : 'text-[#B0B0B0]'
                              }`}>
                                {step.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Continue Button */}
              <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
                <div className="flex justify-center lg:justify-start">
                  <div className="w-full max-w-[190px]">
                    <Button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-base py-3.5 px-4 rounded transition-colors shadow-sm"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
