'use client'

import { ReactNode, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Circle, ChevronDown, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

// Active step indicator - filled outer ring, inner circle as ring only
const ActiveStepIcon = ({ className }: { className?: string }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
    <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
)

// Inactive step indicator - outline circles only
const InactiveStepIcon = ({ className }: { className?: string }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" fill="none" />
    <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="0.8" fill="none" />
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
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Home' },
    { href: '/applications', label: 'Tasks' },
    { href: '/documents', label: 'Documents' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Menu Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20 h-14 md:h-20">
        <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Back Button (mobile) or Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="md:hidden text-red-600 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="ml-1.5 text-sm">Back</span>
              </Button>
            )}
            <Link href="/dashboard" className="flex items-center">
              <h2 className="text-lg md:text-xl font-bold text-indigo-600">Taulen</h2>
            </Link>
          </div>

          {/* Center: Navigation Links (desktop only) */}
          <nav className="hidden md:flex items-center space-x-1 flex-1 justify-center">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === '/applications' && pathname?.includes('/applications'))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'text-indigo-700 bg-indigo-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right: Menu Button (mobile) or User Menu (desktop) */}
          <div className="flex-shrink-0 relative">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Menu"
              aria-haspopup="true"
              aria-expanded={showMobileMenu}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop User Menu */}
            <div className="hidden md:block">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="User menu"
                aria-haspopup="true"
                aria-expanded={showUserMenu}
              >
                <span className="text-sm font-medium">
                  {user ? `${user.firstName || 'Welcome'}` : 'Welcome'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                    <div className="py-1">
                      {user && (
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          logout()
                          setShowUserMenu(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {showMobileMenu && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-lg z-50 md:hidden transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Menu</h3>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <ChevronDown className="w-5 h-5 rotate-180" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <nav className="py-4">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href || 
                        (item.href === '/applications' && pathname?.includes('/applications'))
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowMobileMenu(false)}
                          className={cn(
                            'block px-4 py-3 text-base transition-colors',
                            isActive
                              ? 'text-indigo-700 bg-indigo-50 font-semibold'
                              : 'text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>
                  {showNavigation && (
                    <div className="border-t border-gray-200 py-4">
                      <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Sections
                      </div>
                      <nav className="px-2">
                        {sections.map((section) => {
                          const isCurrent = section.id === currentSectionId
                          const isCompleted = section.completed
                          const isLocked = section.locked && !isCompleted && !isCurrent
                          return (
                            <button
                              key={section.id}
                              disabled={isLocked}
                              className={cn(
                                'w-full text-left px-4 py-3 rounded-lg transition-all mb-1',
                                isCurrent
                                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                  : isLocked
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-gray-50'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : isCurrent ? (
                                  <ActiveStepIcon className="text-indigo-700" />
                                ) : (
                                  <InactiveStepIcon className="text-gray-400" />
                                )}
                                <span className="text-sm">{section.title}</span>
                              </div>
                            </button>
                          )
                        })}
                      </nav>
                    </div>
                  )}
                  {user && (
                    <div className="border-t border-gray-200 p-4">
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          logout()
                          setShowMobileMenu(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Section Navigation (desktop only) */}
        {showNavigation && (
        <aside className="hidden md:flex w-64 bg-gray-50 border-r border-gray-200 flex-col flex-shrink-0">
          <nav className="flex-1 overflow-y-auto py-4" aria-label="List of sections to complete">
            <ul className="space-y-1 px-2">
              {sections.map((section, index) => {
                const isCurrent = section.id === currentSectionId
                const isCompleted = section.completed
                const isLocked = section.locked && !isCompleted && !isCurrent

                return (
                  <li key={section.id}>
                    <button
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        isCurrent
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                          : isLocked
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      disabled={isLocked}
                      aria-current={isCurrent ? 'page' : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : isCurrent ? (
                            <ActiveStepIcon className="text-indigo-700" />
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
          <div className="hidden md:block bg-white sticky top-20 z-10">
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
          <div className="md:hidden bg-white sticky top-14 z-10">
            <div className="px-4 sm:px-6 md:px-8 lg:px-12">
              <div className="border-b border-gray-200 py-3">
                <h1 className="text-lg font-semibold text-gray-900 text-center">{title}</h1>
              </div>
            </div>
          </div>

          {/* Content */}
          <main className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-2xl md:max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
