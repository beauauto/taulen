/**
 * Centralized application state management for 1003 form chain
 * Stores and retrieves deal ID, borrower ID, co-borrower ID, and progress indicators
 */

export interface ApplicationState {
  dealId: string | null
  borrowerId: string | null
  coBorrowerId: string | null
  currentFormStep: string | null
  dealProgress: Record<string, boolean> | null
  borrowerProgress: Record<string, boolean> | null
}

const STORAGE_KEYS = {
  DEAL_ID: 'applicationId', // Keep existing key for backward compatibility
  BORROWER_ID: 'borrowerId',
  CO_BORROWER_ID: 'coBorrowerId',
  CURRENT_FORM_STEP: 'currentFormStep',
  DEAL_PROGRESS: 'dealProgress',
  BORROWER_PROGRESS: 'borrowerProgress',
} as const

/**
 * Get the current application state from sessionStorage
 */
export function getApplicationState(): ApplicationState {
  if (typeof window === 'undefined') {
    return {
      dealId: null,
      borrowerId: null,
      coBorrowerId: null,
      currentFormStep: null,
      dealProgress: null,
      borrowerProgress: null,
    }
  }

  const dealId = sessionStorage.getItem(STORAGE_KEYS.DEAL_ID)
  const borrowerId = sessionStorage.getItem(STORAGE_KEYS.BORROWER_ID)
  const coBorrowerId = sessionStorage.getItem(STORAGE_KEYS.CO_BORROWER_ID)
  const currentFormStep = sessionStorage.getItem(STORAGE_KEYS.CURRENT_FORM_STEP)
  
  let dealProgress: Record<string, boolean> | null = null
  try {
    const dealProgressStr = sessionStorage.getItem(STORAGE_KEYS.DEAL_PROGRESS)
    if (dealProgressStr) {
      dealProgress = JSON.parse(dealProgressStr)
    }
  } catch (e) {
    console.error('Failed to parse deal progress:', e)
  }

  let borrowerProgress: Record<string, boolean> | null = null
  try {
    const borrowerProgressStr = sessionStorage.getItem(STORAGE_KEYS.BORROWER_PROGRESS)
    if (borrowerProgressStr) {
      borrowerProgress = JSON.parse(borrowerProgressStr)
    }
  } catch (e) {
    console.error('Failed to parse borrower progress:', e)
  }

  return {
    dealId,
    borrowerId,
    coBorrowerId,
    currentFormStep,
    dealProgress,
    borrowerProgress,
  }
}

/**
 * Set the deal ID (application ID)
 */
export function setDealId(dealId: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEYS.DEAL_ID, dealId)
  }
}

/**
 * Set the borrower ID
 */
export function setBorrowerId(borrowerId: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEYS.BORROWER_ID, borrowerId)
  }
}

/**
 * Set the co-borrower ID
 */
export function setCoBorrowerId(coBorrowerId: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEYS.CO_BORROWER_ID, coBorrowerId)
  }
}

/**
 * Set the current form step
 */
export function setCurrentFormStep(formStep: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_FORM_STEP, formStep)
  }
}

/**
 * Update deal progress
 */
export function updateDealProgress(section: string, completed: boolean): void {
  if (typeof window !== 'undefined') {
    const current = getApplicationState().dealProgress || {}
    current[section] = completed
    sessionStorage.setItem(STORAGE_KEYS.DEAL_PROGRESS, JSON.stringify(current))
  }
}

/**
 * Update borrower progress
 */
export function updateBorrowerProgress(section: string, completed: boolean): void {
  if (typeof window !== 'undefined') {
    const current = getApplicationState().borrowerProgress || {}
    current[section] = completed
    sessionStorage.setItem(STORAGE_KEYS.BORROWER_PROGRESS, JSON.stringify(current))
  }
}

/**
 * Sync application state from API response
 * Call this after API calls that return application data
 */
export function syncApplicationStateFromApi(apiData: any): void {
  if (typeof window === 'undefined') return

  // Sync deal ID (application ID)
  if (apiData?.id) {
    setDealId(apiData.id)
  }

  // Sync borrower ID (check both nested and top-level)
  if (apiData?.borrower?.id) {
    setBorrowerId(apiData.borrower.id)
  } else if (apiData?.borrowerId) {
    setBorrowerId(apiData.borrowerId)
  }

  // Sync co-borrower ID (check both nested and top-level)
  if (apiData?.coBorrower?.id) {
    setCoBorrowerId(apiData.coBorrower.id)
  } else if (apiData?.coBorrowerId) {
    setCoBorrowerId(apiData.coBorrowerId)
  }

  // Sync current form step
  if (apiData?.currentFormStep) {
    setCurrentFormStep(apiData.currentFormStep)
  }

  // Note: Progress indicators would come from separate API calls
  // They can be synced separately via updateDealProgress/updateBorrowerProgress
}

/**
 * Clear all application state
 */
export function clearApplicationState(): void {
  if (typeof window !== 'undefined') {
    Object.values(STORAGE_KEYS).forEach(key => {
      sessionStorage.removeItem(key)
    })
  }
}

/**
 * Get deal ID (backward compatibility - uses applicationId key)
 */
export function getDealId(): string | null {
  return getApplicationState().dealId
}

/**
 * Get borrower ID
 */
export function getBorrowerId(): string | null {
  return getApplicationState().borrowerId
}

/**
 * Get co-borrower ID
 */
export function getCoBorrowerId(): string | null {
  return getApplicationState().coBorrowerId
}

/**
 * Get current form step
 */
export function getCurrentFormStep(): string | null {
  return getApplicationState().currentFormStep
}
