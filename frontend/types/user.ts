export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  // Role can be: LoanOfficer, Underwriter, Processor, Admin (from backend)
  // or loan_officer, underwriter, processor, admin (normalized)
  role?: string // Only for employees - backend uses PascalCase, we normalize to lowercase
  userType: 'employee' | 'applicant'
  // Optional authentication fields (for future MFA/security features)
  emailVerified?: boolean
  mfaEnabled?: boolean
  lastLoginAt?: string
}
