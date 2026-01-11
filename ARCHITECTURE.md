# Taulen Architecture - User Types

## User Type Separation

The platform distinguishes between two types of users:

### 1. **Applicants** (Consumers/Borrowers)
- Stored in the `Applicants` table
- These are consumers applying for loans
- They do NOT have accounts in the `Users` table
- Data includes: SSN, DOB, demographic info, employment, income, assets, liabilities
- Can be primary applicant or co-applicant
- Linked to `LoanApplications` via `LoanApplicationID`

### 2. **Users** (Company Employees)
- Stored in the `Users` table
- These are employees of the mortgage originator company
- Roles: `loan_officer`, `underwriter`, `processor`, `admin`
- Have authentication credentials (email, password)
- Manage and process loan applications
- Linked to `LoanApplications` via `UserID` (the employee managing the application)

## Database Schema

### LoanApplications Table
```sql
CREATE TABLE "LoanApplications" (
    "LoanApplicationID" BIGSERIAL PRIMARY KEY,
    "ApplicantID" BIGINT,        -- FK to Applicants (primary applicant, can be NULL initially)
    "UserID" UUID,                -- FK to Users (employee managing this application)
    ...
);
```

### Applicants Table
```sql
CREATE TABLE "Applicants" (
    "ApplicantID" BIGSERIAL PRIMARY KEY,
    "LoanApplicationID" BIGINT NOT NULL,  -- FK to LoanApplications
    "UserID" UUID,                       -- FK to Users (employee managing this applicant)
    "IsPrimaryApplicant" BOOLEAN NOT NULL,
    ...
);
```

### Relationship Flow
1. **Employee (User)** creates a new `LoanApplication` → sets `UserID`, `ApplicantID` = NULL
2. **Primary Applicant** is created in `Applicants` table → linked via `LoanApplicationID` and `UserID` (employee)
3. **Update** `LoanApplication` → set `ApplicantID` to the primary applicant's ID
4. **Co-applicants** can be added to `Applicants` table with same `LoanApplicationID` and `UserID`

### Key Points
- `Applicants` table: Consumer/borrower data (loan application form data)
- `Users` table: Employee authentication and authorization only
- `LoanApplications.UserID`: Which employee is managing the application
- `LoanApplications.ApplicantID`: The primary applicant (consumer)
- Circular dependency is handled: `ApplicantID` is nullable, set after applicant creation

## Authentication Flow

### For Employees
- Register/Login via `/auth/register` and `/auth/login`
- JWT tokens for session management
- Access to dashboard, application management, etc.

### For Applicants (Future)
- Applicants do NOT authenticate via the Users table
- May use email-based authentication or separate mechanism
- Access limited to their own application data
- TBD: How applicants will access and complete their applications

## API Endpoints

### Employee Endpoints (Protected)
- `POST /api/v1/urla/applications` - Create new application (sets UserID)
- `GET /api/v1/urla/applications/:id` - Get application details
- `PUT /api/v1/urla/applications/:id/status` - Update application status

### Applicant Endpoints (TBD)
- Need to design how applicants access their applications
- May require separate authentication mechanism
- May use email links, temporary tokens, or separate applicant portal
