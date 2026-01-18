'use client'

import { ReactNode, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronDown, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface TopMenuProps {
  showNavigation?: boolean
  navItems?: Array<{ href: string; label: string }>
  onBack?: () => void
}

export function TopMenu({ 
  showNavigation = true,
  navItems = [
    { href: '/dashboard', label: 'Home' },
    { href: '/applications', label: 'Tasks' },
    { href: '/documents', label: 'Documents' },
  ],
  onBack,
}: TopMenuProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const homeLink = user ? '/dashboard' : '/'

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0 z-20 h-14 md:h-20">
      <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Back Button (mobile) or Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onBack(e as any)
              }}
              className="md:hidden text-red-600 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="ml-1.5 text-sm">Back</span>
            </Button>
          )}
          <Link href={homeLink} className="flex items-center">
            <h2 className="text-lg md:text-xl font-bold text-indigo-600">Taulen</h2>
          </Link>
        </div>

        {/* Center: Navigation Links (desktop only) */}
        {showNavigation && user && (
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
        )}

        {/* Right: Auth Buttons (not logged in) or User Menu (logged in) */}
        <div className="flex-shrink-0 relative">
          {!user ? (
            // Not logged in - show Sign In and Sign Up buttons
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          ) : (
            // Logged in - show user menu
            <>
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
                    {user.firstName || 'Welcome'}
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
            </>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu (logged in only) */}
      {user && showMobileMenu && (
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
  )
}
