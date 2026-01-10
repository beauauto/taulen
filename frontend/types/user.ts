export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'borrower' | 'loan_officer' | 'underwriter' | 'admin'
}
