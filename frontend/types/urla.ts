export interface URLAApplication {
  id: number
  loan_type: string
  loan_purpose: string
  loan_amount: number
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'denied'
  created_date?: string
  last_updated_date?: string
}

export interface BorrowerInfo {
  first_name: string
  middle_name?: string
  last_name: string
  suffix?: string
  ssn: string
  date_of_birth: string
  marital_status: string
  dependents_count: number
  citizenship_status: string
  email?: string
  phone?: string
}

export interface PropertyInfo {
  street_address: string
  unit_number?: string
  city: string
  state: string
  zip_code: string
  property_type: string
  property_usage: string
  year_built?: number
  purchase_price?: number
}

export interface EmploymentInfo {
  employer_name: string
  position: string
  employment_type: string
  start_date: string
  end_date?: string
  monthly_income: number
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
}

export interface IncomeInfo {
  base_income: number
  overtime?: number
  bonuses?: number
  commissions?: number
  other_income?: number
  other_income_description?: string
}

export interface AssetInfo {
  asset_type: string
  description: string
  current_value: number
  account_last_four?: string
}

export interface LiabilityInfo {
  liability_type: string
  creditor_name: string
  monthly_payment: number
  outstanding_balance: number
  remaining_payments?: number
}

export interface URLAFormData {
  application_id?: number
  borrower: BorrowerInfo
  property?: PropertyInfo
  employment?: EmploymentInfo[]
  income?: IncomeInfo
  assets?: AssetInfo[]
  liabilities?: LiabilityInfo[]
  current_section?: string
  completion_percentage?: number
}
