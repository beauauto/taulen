# 1003 Form Development Guide

This document outlines the principles and patterns that all forms in the 1003 application chain must follow. **Please read this guide before developing any new forms.**

## Table of Contents
1. [Core Principles](#core-principles)
2. [Form Structure](#form-structure)
3. [Data Loading Pattern](#data-loading-pattern)
4. [State Management](#state-management)
5. [Navigation Flow](#navigation-flow)
6. [Form Change Detection](#form-change-detection)
7. [Field Separation](#field-separation)
8. [Auto-Focus](#auto-focus)
9. [Back Button Implementation](#back-button-implementation)
10. [Example Template](#example-template)

---

## Core Principles

### 1. **Database-First Loading**
- **Every form MUST load its specific fields from the database when mounted**, regardless of how it was accessed (forward navigation or back button).
- Forms should never rely solely on sessionStorage or URL parameters for data.
- Always fetch fresh data from the API using `urlaApi.getApplication(applicationId)`.

### 2. **Field Separation**
- **Each form owns specific fields and should NOT process fields from other forms.**
- Fields from earlier forms should not be re-validated or re-processed.
- Forms should only save the fields they are responsible for.

### 3. **State Initialization**
- Application state (dealId, borrowerId, coBorrowerId) is initialized when:
  - A borrower creates an application in `borrower-info-1` (creation flow)
  - A borrower signs in (sign-in flow)
- Before state initialization, the app is stateless and nothing exists in the database.

### 4. **Consistent Navigation**
- Back buttons follow the logical form flow order, NOT browser history.
- Each form (except the first) has a back button that navigates to the previous form in the sequence.

---

## Form Structure

### Required Imports
```typescript
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApplicationState } from '@/hooks/useApplicationState'
import { useFormChanges } from '@/hooks/useFormChanges'
import { urlaApi } from '@/lib/api'
```

### Required Hooks
```typescript
const router = useRouter()
const searchParams = useSearchParams()
const appState = useApplicationState()
const { hasChanges, resetInitialData } = useFormChanges(formData)
```

---

## Data Loading Pattern

### Standard Pattern
Every form MUST implement this data loading pattern:

```typescript
useEffect(() => {
  // Always load [FORM_NAME] specific fields from database when form is accessed
  // This ensures data is fresh whether accessed via forward or back navigation
  const loadExistingData = async () => {
    // Get deal ID from URL params or application state
    const applicationIdParam = searchParams?.get('applicationId')
    const applicationId = applicationIdParam || appState.dealId
    
    // Sync deal ID to state if from URL
    if (applicationIdParam && !appState.dealId) {
      appState.setDealId(applicationIdParam)
    }
    
    // Check if user is authenticated
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    
    // If no applicationId or no token, show form immediately (new application)
    if (!applicationId || !token) {
      setIsLoading(false)
      return
    }
    
    try {
      // Always load from database
      const appResponse = await urlaApi.getApplication(applicationId)
      const appData = appResponse.data
      
      // Sync application state from API response
      appState.syncFromApi(appData)
      
      // Load [FORM_NAME] specific fields only
      if (appData?.borrower || appData?.coBorrower || appData?.loan) {
        const data = appData.borrower || appData.coBorrower || appData.loan || {}
        
        const loadedData = {
          // Only include fields that belong to THIS form
          field1: data?.field1 || '',
          field2: data?.field2 || false,
          // ... other form-specific fields
        }
        
        setFormData(loadedData)
        // Reset initial data after loading
        resetInitialData(loadedData)
      }
    } catch (error: any) {
      // Only log non-401 errors (401 means not authenticated)
      if (error.response?.status !== 401) {
        console.error('Failed to load existing data:', error)
      }
      // Continue without loading from API if error
    } finally {
      setIsLoading(false)
    }
  }

  loadExistingData()
}, [searchParams, appState.dealId]) // CRITICAL: Use appState.dealId, NOT router
```

### Key Points:
- **Dependency array MUST be `[searchParams, appState.dealId]`** - NOT `[router]` or `[searchParams, router]`
- Always call `appState.syncFromApi(appData)` after loading
- Only load fields that belong to THIS form
- Call `resetInitialData(loadedData)` after setting form data

---

## State Management

### Application State Structure
The application state is managed via `useApplicationState()` hook and stored in `sessionStorage`:

- `dealId` (applicationId) - UUID of the deal/application
- `borrowerId` - UUID of the primary borrower
- `coBorrowerId` - UUID of the co-borrower (if exists)
- `currentFormStep` - Current step in the form flow
- `dealProgress` - Progress tracking for deal-level sections
- `borrowerProgress` - Progress tracking for borrower sections
- `coBorrowerProgress` - Progress tracking for co-borrower sections

### Syncing State
After any API call that returns application data:
```typescript
appState.syncFromApi(response.data)
```

This ensures state stays synchronized across the application.

---

## Navigation Flow

### Logical Form Sequence
The 1003 forms follow this logical sequence:

1. `borrower-info-1` - First form (no back button)
2. `borrower-info-2` - Back → `borrower-info-1`
3. `co-borrower-question` - Back → `borrower-info-2`
4. `co-borrower-info-1` - Back → `co-borrower-question`
5. `co-borrower-info-2` - Back → `co-borrower-info-1`
6. `review` - Back → `co-borrower-info-2` (if co-borrower exists) or `borrower-info-2` (if no co-borrower)
7. `getting-to-know-you-intro` - Back → `review`
8. `loan` - Back → `getting-to-know-you-intro`
9. *(More forms to be added)*

### Back Button Implementation
```typescript
const handleBack = () => {
  // Always go back to the previous form in the 1003 flow
  const applicationId = searchParams?.get('applicationId') || appState.dealId
  
  if (applicationId) {
    router.push(`/application/[PREVIOUS_FORM]?applicationId=${applicationId}`)
  } else {
    router.push('/application/[PREVIOUS_FORM]')
  }
}
```

**Important:** Back buttons track the logical form flow order, NOT browser history.

---

## Form Change Detection

### Using `useFormChanges` Hook
```typescript
const { hasChanges, resetInitialData } = useFormChanges(formData)

// In submit handler:
if (hasChanges) {
  // Only save if form data has changed
  await urlaApi.saveApplication(applicationId, saveData)
  resetInitialData(formData) // Reset after successful save
}
```

This prevents unnecessary API calls when navigating back to a form without changes.

---

## Field Separation

### Critical Rule: **Each Form Owns Specific Fields**

Forms should **ONLY** process and save fields that belong to them:

#### `borrower-info-1` Fields:
- firstName, lastName, email, phone, phoneType
- **DO NOT** process: maritalStatus, address, consents, etc.

#### `borrower-info-2` Fields:
- maritalStatus, isVeteran, currentAddress, acceptTerms, consentToContact
- **DO NOT** process: firstName, lastName, email, phone, phoneType

#### `co-borrower-info-1` Fields:
- firstName, lastName, email, phone, phoneType
- **DO NOT** process: maritalStatus, address, etc.

#### `co-borrower-info-2` Fields:
- maritalStatus, isVeteran, liveTogether, currentAddress
- **DO NOT** process: firstName, lastName, email, phone, phoneType

### Backend Lookup Priority
For forms that update existing records (like `co-borrower-info-2`):
1. **First:** Find by deal relationship (via `borrower_progress` table)
2. **Second:** Fall back to email/phone lookup (only if not found by deal)

---

## Auto-Focus

### First Input Field
Every form should auto-focus the first input field when loaded:

```typescript
const firstInputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

useEffect(() => {
  if (!isLoading && firstInputRef.current) {
    firstInputRef.current.focus()
  }
}, [isLoading])
```

### Modal Fields
Modals (like AddressModal) should also auto-focus their first field.

---

## Back Button Implementation

### Standard Pattern
```typescript
const handleBack = () => {
  // Always go back to the previous form in the 1003 flow
  const applicationId = searchParams?.get('applicationId') || appState.dealId
  
  if (applicationId) {
    router.push(`/application/[PREVIOUS_FORM_PATH]?applicationId=${applicationId}`)
  } else {
    router.push('/application/[PREVIOUS_FORM_PATH]')
  }
}

// In JSX:
<Form1003Layout
  sections={sections}
  currentSectionId="..."
  title="..."
  onBack={handleBack} // Only if NOT the first form
>
```

**Note:** The first form (`borrower-info-1`) does NOT have a back button.

---

## Example Template

### Complete Form Template

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Form1003Layout, FormSection } from '@/components/urla/Form1003Layout'
import { useApplicationState } from '@/hooks/useApplicationState'
import { useFormChanges } from '@/hooks/useFormChanges'
import { urlaApi } from '@/lib/api'

export default function YourFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const appState = useApplicationState()
  
  const [formData, setFormData] = useState({
    // Only fields that belong to THIS form
    field1: '',
    field2: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { hasChanges, resetInitialData } = useFormChanges(formData)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Load existing data from database
  useEffect(() => {
    const loadExistingData = async () => {
      const applicationIdParam = searchParams?.get('applicationId')
      const applicationId = applicationIdParam || appState.dealId
      
      if (applicationIdParam && !appState.dealId) {
        appState.setDealId(applicationIdParam)
      }
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      
      if (!applicationId || !token) {
        setIsLoading(false)
        return
      }
      
      try {
        const appResponse = await urlaApi.getApplication(applicationId)
        const appData = appResponse.data
        
        appState.syncFromApi(appData)
        
        // Load form-specific fields only
        if (appData?.borrower || appData?.coBorrower || appData?.loan) {
          const data = appData.borrower || appData.coBorrower || appData.loan || {}
          
          const loadedData = {
            field1: data?.field1 || '',
            field2: data?.field2 || false,
          }
          
          setFormData(loadedData)
          resetInitialData(loadedData)
        }
      } catch (error: any) {
        if (error.response?.status !== 401) {
          console.error('Failed to load existing data:', error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadExistingData()
  }, [searchParams, appState.dealId]) // CRITICAL: Use appState.dealId
  
  // Auto-focus first field
  useEffect(() => {
    if (!isLoading && firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [isLoading])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    // Validation logic
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const applicationId = searchParams?.get('applicationId') || appState.dealId
    
    if (!applicationId) {
      setErrors({ submit: 'Application ID not found. Please start over.' })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Only save if form data has changed
      if (hasChanges) {
        const saveData = {
          // Only include fields that belong to THIS form
          borrower: { // or coBorrower, or loan
            field1: formData.field1,
            field2: formData.field2,
          },
          nextFormStep: 'next-form-step',
        }

        const response = await urlaApi.saveApplication(applicationId, saveData)
        
        if (response.data) {
          appState.syncFromApi(response.data)
        }
        
        resetInitialData(formData)
      }

      // Navigate to next form
      router.push(`/application/next-form?applicationId=${applicationId}`)
    } catch (error: any) {
      console.error('Error saving data:', error)
      let errorMessage = 'Failed to save data'
      
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`
      } else if (error.request) {
        errorMessage = 'Network error: Unable to connect to server.'
      } else {
        errorMessage = error.message || 'An unexpected error occurred'
      }
      
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    const applicationId = searchParams?.get('applicationId') || appState.dealId
    
    if (applicationId) {
      router.push(`/application/previous-form?applicationId=${applicationId}`)
    } else {
      router.push('/application/previous-form')
    }
  }

  const sections: FormSection[] = [
    // Define sections
  ]

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Form1003Layout
      sections={sections}
      currentSectionId="..."
      title="..."
      onBack={handleBack} // Only if NOT the first form
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        {/* Form fields */}
      </form>
    </Form1003Layout>
  )
}
```

---

## Checklist for New Forms

When creating a new form, ensure:

- [ ] Form loads its specific fields from database on mount
- [ ] Uses `useApplicationState()` hook
- [ ] Uses `useFormChanges()` hook for change detection
- [ ] Dependency array is `[searchParams, appState.dealId]` (NOT `[router]`)
- [ ] Calls `appState.syncFromApi(appData)` after loading data
- [ ] Calls `resetInitialData(loadedData)` after setting form data
- [ ] Only processes/saves fields that belong to THIS form
- [ ] Implements back button (if not the first form)
- [ ] Auto-focuses first input field
- [ ] Only saves if `hasChanges` is true
- [ ] Handles errors gracefully
- [ ] Updates `nextFormStep` in save payload
- [ ] Navigates to next form after successful save

---

## Related Files

- **State Management:** `frontend/lib/applicationState.ts`
- **State Hook:** `frontend/hooks/useApplicationState.ts`
- **Form Changes Hook:** `frontend/hooks/useFormChanges.ts`
- **API Client:** `frontend/lib/api.ts`
- **Backend Service:** `backend/internal/services/application_service.go`

---

## Questions?

If you're unsure about which fields belong to which form, or how to implement a specific pattern, refer to existing forms:
- `frontend/app/application/borrower-info-1/page.tsx`
- `frontend/app/application/borrower-info-2/page.tsx`
- `frontend/app/application/co-borrower-info-1/page.tsx`
- `frontend/app/application/co-borrower-info-2/page.tsx`
- `frontend/app/application/loan/page.tsx`

---

---

## Quick Reference

### Most Important Rules

1. **Always load form-specific fields from database** - Use `urlaApi.getApplication(applicationId)` in `useEffect` with dependency `[searchParams, appState.dealId]`
2. **Only process fields that belong to your form** - Don't re-process fields from other forms
3. **Use `appState.syncFromApi()`** - After loading data, sync application state
4. **Use `useFormChanges()` hook** - Only save if `hasChanges` is true
5. **Back buttons follow logical flow** - Not browser history

### File Locations

- **State Management:** `frontend/lib/applicationState.ts`
- **State Hook:** `frontend/hooks/useApplicationState.ts`
- **Form Changes Hook:** `frontend/hooks/useFormChanges.ts`
- **API Client:** `frontend/lib/api.ts`
- **Example Forms:** `frontend/app/application/borrower-info-1/page.tsx`, `borrower-info-2/page.tsx`

---

**Last Updated:** 2024-12-19
**Maintained By:** Development Team
