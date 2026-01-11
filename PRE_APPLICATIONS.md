# Pre-Applications Design Decision

## Recommendation: Use Same `LoanApplications` Table

### Rationale

The `LoanApplications` table already supports pre-applications through:
- **Nullable `ApplicantID`** - Can be NULL when no applicant account exists yet
- **Nullable `UserID`** - Can be NULL when no loan officer is assigned yet
- **`ApplicationStatus`** - Can be used to distinguish pre-applications

### Application Status Values

- `pre_application` - Created before applicant account exists (no ApplicantID, no UserID)
- `draft` - Applicant has account, application in progress (has ApplicantID, UserID may be NULL)
- `submitted` - Application submitted for review (has ApplicantID, has UserID)
- `in_review` - Under review by loan officer
- `approved` - Application approved
- `denied` - Application denied
- `withdrawn` - Application withdrawn

### Workflow

1. **Pre-Application Created** (from home page, no login):
   - `ApplicationStatus` = 'pre_application'
   - `ApplicantID` = NULL
   - `UserID` = NULL
   - Store minimal data (loan type, purpose, amount)
   - May store temporary email/phone for follow-up

2. **Applicant Creates Account**:
   - Update `LoanApplications`:
     - Set `ApplicantID` to new applicant's ID
     - Change `ApplicationStatus` from 'pre_application' to 'draft'

3. **Loan Officer Assigned**:
   - Update `LoanApplications`:
     - Set `UserID` to loan officer's ID
     - ApplicationStatus may remain 'draft' or change to 'submitted'

### Benefits of Same Table

1. **No Data Migration** - Simply update fields when applicant/employee is assigned
2. **Single Source of Truth** - All applications in one place
3. **Simpler Queries** - Filter by status, no need to join multiple tables
4. **Consistent Schema** - Same fields for all application stages
5. **Easier Reporting** - Can track conversion from pre-application to full application

### Alternative: Separate Table (Not Recommended)

If we used a separate `PreApplications` table:
- **Pros**: Clear separation, potentially different fields
- **Cons**: 
  - Need to migrate data when converting
  - More complex code
  - Duplicate schema
  - Harder to track full lifecycle

### Implementation

The current schema already supports this. We just need to:
1. Allow creating applications without authentication (store in session/localStorage initially)
2. When applicant signs up, link the pre-application to their ApplicantID
3. When employee is assigned, set the UserID
4. Use ApplicationStatus to track the stage
