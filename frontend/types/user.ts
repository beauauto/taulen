export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role?: 'loan_officer' | 'underwriter' | 'processor' | 'admin' // Only for employees
  userType: 'employee' | 'applicant'
}
