export interface URLAApplication {
  id: number
  loanType: string
  loanPurpose: string
  loanAmount: number
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'denied'
  createdDate?: string
  lastUpdatedDate?: string
}

export interface BorrowerInfo {
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  ssn: string
  dateOfBirth: string
  maritalStatus: string
  dependentsCount: number
  citizenshipStatus: string
  email?: string
  phone?: string
}

export interface PropertyInfo {
  streetAddress: string
  unitNumber?: string
  city: string
  state: string
  zipCode: string
  propertyType: string
  propertyUsage: string
  yearBuilt?: number
  purchasePrice?: number
}

export interface EmploymentInfo {
  employerName: string
  position: string
  employmentType: string
  startDate: string
  endDate?: string
  monthlyIncome: number
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
}

export interface IncomeInfo {
  baseIncome: number
  overtime?: number
  bonuses?: number
  commissions?: number
  otherIncome?: number
  otherIncomeDescription?: string
}

export interface AssetInfo {
  assetType: string
  description: string
  currentValue: number
  accountLastFour?: string
}

export interface LiabilityInfo {
  liabilityType: string
  creditorName: string
  monthlyPayment: number
  outstandingBalance: number
  remainingPayments?: number
}

export interface URLAFormData {
  applicationId?: number
  borrower: BorrowerInfo
  property?: PropertyInfo
  employment?: EmploymentInfo[]
  income?: IncomeInfo
  assets?: AssetInfo[]
  liabilities?: LiabilityInfo[]
  currentSection?: string
  completionPercentage?: number
}
