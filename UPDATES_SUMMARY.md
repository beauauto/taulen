# Updates Summary - User Type Separation

## Completed Updates

### 1. Database Schema Changes ✅

**Users Table:**
- Added `UserType` column (VARCHAR(50), NOT NULL, DEFAULT 'employee')
- Removed default 'borrower' role
- All users in `Users` table are now employees only

**LoanApplications Table:**
- Added `ApplicantID` (BIGINT, nullable) - FK to Applicants table (primary applicant)
- Added `UserID` (UUID, nullable) - FK to Users table (employee managing the application)
- Added indexes for both foreign keys
- Added foreign key constraints

### 2. Backend Updates ✅

**UserRepository:**
- Added `UserType` field to `User` struct
- Updated all queries to include `UserType`
- Added role validation in `Create()` method - only allows: `loan_officer`, `underwriter`, `processor`, `admin`
- Rejects `borrower` role (applicants don't have User accounts)

**AuthService:**
- Updated `RegisterRequest` to require `role` field (employee roles only)
- Removed default 'borrower' role assignment
- Updated `UserResponse` to include `UserType` field
- All authentication responses now include `userType: 'employee'`

**URLAApplicationRepository:**
- Updated `CreateApplication()` to accept `userID` (employee) and `applicantID` (nullable)
- Updated queries to include `ApplicantID` and `UserID` fields

**URLAService:**
- Updated to pass employee `userID` when creating applications
- Updated response structures to include new fields

### 3. Frontend Updates ✅

**Registration Form:**
- Added role dropdown with options: Loan Officer, Underwriter, Processor, Admin
- Updated title to "Employee Registration"
- Updated description to clarify this is for employees only

**Type Definitions:**
- Updated `User` interface to remove 'borrower' role
- Added `userType` field to User interface
- Updated `RegisterRequest` to include `role` field

**API Client:**
- Updated `authApi.register()` to include `role` parameter

**useAuth Hook:**
- Updated `register()` function to accept and pass `role` parameter

## Architecture Summary

### User Types

1. **Applicants (Consumers/Borrowers)**
   - Stored in `Applicants` table
   - No authentication accounts
   - Data includes: SSN, DOB, employment, income, assets, liabilities
   - Linked to `LoanApplications` via `LoanApplicationID`

2. **Users (Company Employees)**
   - Stored in `Users` table
   - Have authentication credentials
   - Roles: `loan_officer`, `underwriter`, `processor`, `admin`
   - `UserType` is always `'employee'`
   - Manage and process loan applications

### LoanApplication Relationships

```
LoanApplication
├── ApplicantID → Applicants (primary applicant/consumer)
└── UserID → Users (employee managing the application)
```

### Registration Flow

1. Employee fills out registration form
2. Must select a role: `loan_officer`, `underwriter`, `processor`, or `admin`
3. Backend validates role is an employee role (not `borrower`)
4. User is created with `UserType = 'employee'`
5. Employee can now log in and manage applications

## Pending Items

1. **Applicant Authentication** - Design mechanism for applicants to access their applications
   - Options: Email-based links, temporary tokens, separate applicant portal
   - Applicants don't have User accounts, so need alternative authentication

2. **Frontend Employee vs Applicant Flows** - Update UI to differentiate:
   - Employee dashboard (application management)
   - Applicant portal (form completion) - TBD

3. **Update Existing Users** - Existing users with 'borrower' role need to be updated:
   ```sql
   UPDATE "Users" SET "Role" = 'loan_officer' WHERE "Role" = 'borrower';
   ```

## Testing Checklist

- [ ] Register new employee with valid role
- [ ] Attempt to register with 'borrower' role (should fail)
- [ ] Login as employee
- [ ] Create loan application (should set UserID)
- [ ] Verify ApplicantID can be set after applicant creation
- [ ] Test role-based access control (future)
