import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  // Protected routes
  // Allow /applications/new to be accessed without auth (it handles its own auth check)
  const isNewApplication = request.nextUrl.pathname === '/applications/new'
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  ) || (request.nextUrl.pathname.startsWith('/applications') && !isNewApplication)

  // Auth routes (should redirect to dashboard if already logged in)
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname)

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If accessing auth route with token, redirect based on user type
  // Note: We can't check user type in middleware without decoding JWT
  // So we redirect to a generic dashboard and let the app handle routing
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
