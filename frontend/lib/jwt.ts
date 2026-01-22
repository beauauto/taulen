/**
 * JWT token utilities for checking expiration and decoding tokens
 */

export interface JWTPayload {
  userId?: string
  email?: string
  exp?: number
  iat?: number
  nbf?: number
  iss?: string
  sub?: string
}

/**
 * Decode JWT token without verification (client-side only)
 * Returns null if token is invalid or cannot be decoded
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode base64url encoded payload
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as JWTPayload
  } catch (error) {
    console.error('Failed to decode JWT token:', error)
    return null
  }
}

/**
 * Check if a JWT token is expired
 * Returns true if token is expired or invalid
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) {
    return true
  }

  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return true
  }

  // exp is in seconds since epoch, convert to milliseconds
  const expirationTime = payload.exp * 1000
  const currentTime = Date.now()

  // Add 30 second buffer to account for clock skew and network delay
  return currentTime >= expirationTime - 30000
}

/**
 * Get token expiration time in milliseconds
 * Returns null if token is invalid or has no expiration
 */
export function getTokenExpiration(token: string | null): number | null {
  if (!token) {
    return null
  }

  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return null
  }

  return payload.exp * 1000
}

/**
 * Get time until token expires in milliseconds
 * Returns negative number if already expired
 */
export function getTimeUntilExpiration(token: string | null): number | null {
  const expiration = getTokenExpiration(token)
  if (expiration === null) {
    return null
  }

  return expiration - Date.now()
}
