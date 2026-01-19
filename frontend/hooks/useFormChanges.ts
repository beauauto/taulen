import { useState, useEffect, useRef } from 'react'

/**
 * Hook to track form changes and determine if form data has been modified
 * @param formData - Current form data object
 * @returns Object with hasChanges boolean and initialData reference
 */
export function useFormChanges<T extends Record<string, any>>(formData: T) {
  const [hasChanges, setHasChanges] = useState(false)
  const initialDataRef = useRef<T | null>(null)
  const isInitializedRef = useRef(false)

  // Initialize with current form data on first render
  useEffect(() => {
    if (!isInitializedRef.current) {
      initialDataRef.current = JSON.parse(JSON.stringify(formData))
      isInitializedRef.current = true
      setHasChanges(false)
    }
  }, [])

  // Compare current form data with initial data
  useEffect(() => {
    if (!isInitializedRef.current || !initialDataRef.current) {
      return
    }

    const hasFormChanged = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current)
    setHasChanges(hasFormChanged)
  }, [formData])

  // Reset initial data (useful when form data is loaded from API)
  const resetInitialData = (newInitialData: T) => {
    initialDataRef.current = JSON.parse(JSON.stringify(newInitialData))
    isInitializedRef.current = true
    setHasChanges(false)
  }

  return {
    hasChanges,
    resetInitialData,
    initialData: initialDataRef.current,
  }
}
