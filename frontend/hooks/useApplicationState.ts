/**
 * React hook for managing application state
 * Provides reactive access to deal ID, borrower ID, co-borrower ID, and progress
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getApplicationState,
  setDealId,
  setBorrowerId,
  setCoBorrowerId,
  setCurrentFormStep,
  updateDealProgress,
  updateBorrowerProgress,
  syncApplicationStateFromApi,
  clearApplicationState,
  type ApplicationState,
} from '@/lib/applicationState'

export function useApplicationState() {
  const [state, setState] = useState<ApplicationState>(getApplicationState())

  // Listen for storage changes (e.g., from other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.storageArea === sessionStorage) {
        setState(getApplicationState())
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Refresh state from sessionStorage
  const refresh = useCallback(() => {
    setState(getApplicationState())
  }, [])

  return {
    ...state,
    setDealId: (id: string) => {
      setDealId(id)
      refresh()
    },
    setBorrowerId: (id: string) => {
      setBorrowerId(id)
      refresh()
    },
    setCoBorrowerId: (id: string) => {
      setCoBorrowerId(id)
      refresh()
    },
    setCurrentFormStep: (step: string) => {
      setCurrentFormStep(step)
      refresh()
    },
    updateDealProgress: (section: string, completed: boolean) => {
      updateDealProgress(section, completed)
      refresh()
    },
    updateBorrowerProgress: (section: string, completed: boolean) => {
      updateBorrowerProgress(section, completed)
      refresh()
    },
    syncFromApi: (apiData: any) => {
      syncApplicationStateFromApi(apiData)
      refresh()
    },
    clear: () => {
      clearApplicationState()
      refresh()
    },
    refresh,
  }
}
