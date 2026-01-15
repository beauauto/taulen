# Legacy Code Review - Unused Code to Remove

This document identifies legacy code that is no longer used after implementing the new getting-started flow.

## Summary

The new flow is: `/` → `/getting-started` → `/buy` or `/refinance` → `/buy/borrower-info` or `/refinance/borrower-info` → API creates borrower & application

## Frontend Legacy Code

### 1. **PreApplicationWizard Component** ❌ UNUSED
- **File**: `frontend/components/urla/PreApplicationWizard.tsx`
- **Status**: Not imported or used anywhere
- **Reason**: Replaced by the new `/getting-started` → `/buy` → `/buy/borrower-info` flow
- **Action**: DELETE

### 2. **Deprecated API Method** ⚠️ DEPRECATED
- **File**: `frontend/lib/api.ts`
- **Method**: `createBorrowerAndDealFromPreApplication`
- **Status**: Marked as deprecated, replaced by `verifyAndCreateBorrower`
- **Action**: REMOVE (backend already deprecated)

### 3. **Old preApplicationData sessionStorage References** ⚠️ PARTIALLY UNUSED
- **Files**:
  - `frontend/app/(dashboard)/applications/[id]/page.tsx` (lines 17-48)
  - `frontend/app/(dashboard)/applications/[id]/borrower/page.tsx` (lines 73-146)
  - `frontend/app/(auth)/register/page.tsx` (line 32)
- **Status**: Still referenced but new flow doesn't use this pattern
- **Action**: REVIEW - May be used for existing applications, but new flow uses different data storage

### 4. **applications/new Page** ⚠️ POTENTIALLY UNUSED
- **File**: `frontend/app/(dashboard)/applications/new/page.tsx`
- **Status**: Still linked from dashboards, but new borrower flow goes through `/getting-started`
- **Usage**: 
  - Linked from employee/applicant dashboards
  - May still be used for employees creating applications manually
- **Action**: REVIEW - Keep if needed for employee workflow, otherwise redirect to `/getting-started`

### 5. **PurchaseOrRefiPage Component** ⚠️ POTENTIALLY UNUSED
- **File**: `frontend/components/urla/PurchaseOrRefiPage.tsx`
- **Status**: Used in `frontend/app/dashboard/applicant/page.tsx`
- **Reason**: May be legacy if new flow replaces this
- **Action**: REVIEW - Check if applicant dashboard still needs this or if it should use new flow

## Backend Legacy Code

### 1. **Deprecated Service Method** ❌ DEPRECATED
- **File**: `backend/internal/services/urla_service.go`
- **Method**: `CreateBorrowerAndDealFromPreApplication` (line 843)
- **Request Type**: `CreateBorrowerAndDealFromPreApplicationRequest` (line 504)
- **Status**: Marked as deprecated, replaced by `VerifyAndCreateBorrower`
- **Action**: REMOVE after confirming frontend doesn't use it

### 2. **Deprecated Handler** ❌ DEPRECATED
- **File**: `backend/internal/handlers/urla.go`
- **Method**: `CreateBorrowerAndDealFromPreApplication` (line 246)
- **Status**: Marked as deprecated
- **Action**: REMOVE

### 3. **Deprecated Route** ❌ DEPRECATED
- **File**: `backend/api/routes.go`
- **Route**: `POST /urla/pre-application/complete` (line 83)
- **Status**: Marked as deprecated
- **Action**: REMOVE

## Recommended Actions

### Immediate Removal (Safe)
1. ✅ Delete `frontend/components/urla/PreApplicationWizard.tsx`
2. ✅ Remove `createBorrowerAndDealFromPreApplication` from `frontend/lib/api.ts`
3. ✅ Remove `CreateBorrowerAndDealFromPreApplication` service method from backend
4. ✅ Remove `CreateBorrowerAndDealFromPreApplication` handler from backend
5. ✅ Remove deprecated route from `backend/api/routes.go`

### Review Before Removal
1. ⚠️ Review `applications/new` page - determine if employees need it
2. ⚠️ Review `PurchaseOrRefiPage` - check if applicant dashboard still uses it
3. ⚠️ Review `preApplicationData` sessionStorage usage - may be needed for existing applications

### Cleanup Opportunities
1. 🧹 Remove unused imports related to PreApplicationWizard
2. 🧹 Clean up sessionStorage references that are no longer needed
3. 🧹 Update dashboard links to point to `/getting-started` instead of `/applications/new` if appropriate

## Notes

- The new flow creates borrowers and applications directly via `verifyAndCreateBorrower` API
- Old flow used pre-application wizard → separate borrower creation
- New flow: Home → Getting Started → Loan/Refi Info → Borrower Info → API creates everything
- Old flow: Various entry points → PreApplicationWizard → Manual application creation
