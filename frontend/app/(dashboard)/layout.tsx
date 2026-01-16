'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TopMenu } from '@/components/layout/TopMenu'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/applications', label: 'Applications' },
  ]

  // Hide left sidebar for applications and dashboard pages
  const isApplicationsPage = pathname === '/applications' || pathname?.startsWith('/applications/')
  const isDashboardPage = pathname === '/dashboard'
  const hideSidebar = isApplicationsPage || isDashboardPage

  // For application pages, Form1003Layout handles its own layout, so just pass through
  if (isApplicationsPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopMenu showNavigation={true} navItems={navItems} />
      <div className="flex flex-1 min-h-0">
        {!hideSidebar && (
          <aside className="w-64 bg-white shadow-sm min-h-screen">
            <nav className="p-4">
              <div className="mb-6">
                <Link href={user ? "/dashboard" : "/"}>
                  <h2 className="text-xl font-bold cursor-pointer hover:text-indigo-600 transition-colors">Taulen</h2>
                </Link>
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
        )}
        <main className={cn("flex-1", hideSidebar ? "" : "p-8")}>
          {children}
        </main>
      </div>
    </div>
  )
}
