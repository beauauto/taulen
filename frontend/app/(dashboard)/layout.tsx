'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Hide sidebar for borrower page (replicates borrower-htmlonly.html layout)
  const isBorrowerPage = pathname?.includes('/applications/') && pathname?.includes('/borrower')
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/applications', label: 'Applications' },
  ]

  // For borrower page, render without sidebar (full screen)
  if (isBorrowerPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="p-4">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Taulen</h2>
            </div>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'block px-4 py-2 rounded transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
            
            <div className="mt-8 pt-8 border-t">
              {user && (
                <div className="px-4 py-2 mb-4">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="w-full"
              >
                Logout
              </Button>
            </div>
          </nav>
        </aside>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
