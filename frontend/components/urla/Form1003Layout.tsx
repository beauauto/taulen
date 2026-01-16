'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { TopMenu } from '@/components/layout/TopMenu'
import { cn } from '@/lib/utils'

// Active step indicator - filled ring with transparent center (donut shape)
// Smaller circle with thicker ring
const ActiveStepIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer circle - filled ring */}
    <circle cx="8" cy="8" r="7" fill="currentColor" />
    {/* Inner circle - cuts out center to create thicker ring effect */}
    <circle cx="8" cy="8" r="4" fill="#f9fafb" />
  </svg>
)

// Inactive/upcoming step indicator - filled ring with transparent center (donut shape)
// Smaller circle with thick ring, matching active style
const InactiveStepIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer circle - filled ring */}
    <circle cx="8" cy="8" r="7" fill="currentColor" />
    {/* Inner circle - cuts out center to create thick ring effect */}
    <circle cx="8" cy="8" r="4" fill="#f9fafb" />
  </svg>
)

// Completed step indicator - filled circle with checkmark
// Smaller circle
const CompletedStepIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="8" cy="8" r="7" fill="currentColor" />
    <path
      d="M5 8L7 10L11 6"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export interface FormSection {
  id: string
  title: string
  completed?: boolean
  locked?: boolean
  current?: boolean
}

interface Form1003LayoutProps {
  sections: FormSection[]
  currentSectionId: string
  title: string
  onBack?: () => void
  children: ReactNode
  showNavigation?: boolean
}

export function Form1003Layout({
  sections,
  currentSectionId,
  title,
  onBack,
  children,
  showNavigation = true,
}: Form1003LayoutProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Home' },
    { href: '/applications', label: 'Tasks' },
    { href: '/documents', label: 'Documents' },
  ]

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <TopMenu showNavigation={showNavigation} navItems={navItems} onBack={onBack} />

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Section Navigation (desktop only) */}
        {showNavigation && (
        <aside className="hidden md:flex w-64 bg-gray-50 border-r border-gray-200 flex-col flex-shrink-0 overflow-hidden">
          <nav className="flex-1 overflow-y-auto py-4" aria-label="List of sections to complete">
            <ul className="relative px-2">
              {sections.map((section, index) => {
                const isCurrent = section.id === currentSectionId
                const isCompleted = section.completed
                const isLocked = section.locked && !isCompleted && !isCurrent

                return (
                  <li key={section.id} className="relative">
                    <button
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-lg transition-all relative',
                        'group',
                        isCurrent
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : isLocked
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      )}
                      disabled={isLocked}
                      aria-current={isCurrent ? 'page' : undefined}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        {/* Step indicator using SVG icons */}
                        <div className="flex-shrink-0 relative w-4 h-4 flex items-center justify-center">
                          {isCompleted ? (
                            <CompletedStepIcon className="text-green-600" />
                          ) : isCurrent ? (
                            <ActiveStepIcon className="text-indigo-600" />
                          ) : (
                            <InactiveStepIcon className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{section.title}</div>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer with Terms/Privacy links */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <button className="hover:text-gray-700">Terms of Use</button>
              <span>|</span>
              <button className="hover:text-gray-700">Privacy Policy</button>
            </div>
          </div>
        </aside>
      )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Section Header (desktop only - mobile has back button in header) */}
          <div className="hidden md:block bg-white flex-shrink-0 z-10">
            <div className="max-w-2xl md:max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
              <div className="border-b border-gray-200 py-4">
                <div className="flex items-center gap-4 relative">
                  {onBack && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onBack}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  )}
                  <div className="flex-1 flex justify-center">
                    <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                  </div>
                  {/* Spacer to balance the back button */}
                  {onBack && <div className="w-20"></div>}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Section Header */}
          <div className="md:hidden bg-white flex-shrink-0 z-10">
            <div className="px-4 sm:px-6 md:px-8 lg:px-12">
              <div className="border-b border-gray-200 py-3">
                <h1 className="text-lg font-semibold text-gray-900 text-center">{title}</h1>
              </div>
            </div>
          </div>

          {/* Content */}
          <main className="flex-1 overflow-y-auto bg-white min-h-0">
            <div className="max-w-2xl md:max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
