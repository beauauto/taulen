# Taulen - Digital Mortgage Origination Platform
## Project Plan & Architecture

### Executive Summary
Taulen is a comprehensive digital mortgage origination platform designed to streamline the mortgage application process for borrowers, loan officers, and lenders. The platform will provide end-to-end mortgage origination capabilities similar to Blend.com, with a focus on user experience, compliance, and operational efficiency.

---

## 1. Technology Stack

### Backend
- **Language**: Go (Golang) 1.24+
- **HTTP Framework**: Gin (github.com/gin-gonic/gin)
- **Primary Database**: PostgreSQL with pgx/v5 driver
- **SQL Code Generation**: sqlc (type-safe SQL code generation)
- **Document Store**: MongoDB (unstructured data, documents, logs) - *Future phase*
- **API Framework**: RESTful APIs
- **Authentication**: JWT (golang-jwt/jwt/v5)
- **Configuration Management**: Viper + godotenv
- **Message Queue**: RabbitMQ or Apache Kafka (for async processing) - *Future phase*
- **Caching**: Redis - *Future phase*
- **File Storage**: Local filesystem initially, AWS S3 for production

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18+
- **State Management**: Zustand or Redux Toolkit
- **Styling**: Tailwind CSS + shadcn/ui components
- **Mobile**: React Native (shared components where possible)
- **Form Management**: React Hook Form + Zod validation
- **API Client**: Axios or Fetch with React Query

### Infrastructure & DevOps
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (production)
- **CI/CD**: GitHub Actions or GitLab CI
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Cloud Provider**: AWS/GCP/Azure

---

## 2. System Architecture

### Backend Architecture Pattern (Following tauad/backend)

The backend follows a clean architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Handlers   │  │  Middleware  │  │    Routes    │  │
│  │  (Gin HTTP)  │  │  (Auth/CORS) │  │  (api/)      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────┐
│                    Business Logic Layer                    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Services (internal/services/)           │ │
│  │  - AuthService, URLAApplicationService, etc.         │ │
│  └──────────────────────┬───────────────────────────────┘ │
└─────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                    Data Access Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Repositories (internal/repositories/)        │  │
│  │  - UserRepository, ApplicationRepository, etc.      │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                    Database Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  sqlc Generated Code (internal/db/)                  │  │
│  │  - Type-safe SQL queries from internal/sql/queries/ │  │
│  │  - Models and query functions                        │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐  │
│  │  PostgreSQL (via pgx/v5)                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key Patterns:**
- **Handlers**: HTTP request/response handling, input validation, error formatting
- **Services**: Business logic, orchestration, validation rules
- **Repositories**: Data access abstraction, wraps sqlc generated code
- **sqlc**: Type-safe SQL code generation from SQL files
- **Database**: PostgreSQL with pgx/v5 driver

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile App  │  │  Admin Panel │      │
│  │  (Next.js)   │  │ (React Native)│  │  (Next.js)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    API Gateway Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         API Gateway (Rate Limiting, Auth)            │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                    Backend Services (Go)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Auth       │  │  Application │  │  Document    │       │
│  │   Service    │  │   Service    │  │  Service     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Compliance  │  │  Credit      │  │  Notification│       │
│  │  Service     │  │  Service    │  │  Service     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────┬──────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │   MongoDB    │  │    Redis     │       │
│  │  (Structured)│  │ (Documents)  │  │   (Cache)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────────────────────────────────────────┘
```

### Microservices Architecture

1. **Authentication Service**: User authentication, authorization, session management
2. **Application Service**: Core loan application management
3. **Document Service**: Document upload, storage, processing, OCR
4. **Compliance Service**: Regulatory checks, validation, reporting
5. **Credit Service**: Credit checks, income verification, risk assessment
6. **Notification Service**: Email, SMS, in-app notifications
7. **Analytics Service**: Reporting, dashboards, metrics

---

## 3. URLA Form 1003 Structure

The Uniform Residential Loan Application (URLA) Form 1003 is the industry-standard mortgage application form. Below is the detailed structure that Phase 1 will implement:

### 3.0.1 Section 1: Borrower Information

**1.1 Personal Information**
- First Name, Middle Name, Last Name, Suffix
- Social Security Number (SSN) - encrypted storage required
- Date of Birth
- Age (calculated)

**1.2 Contact Information**
- Home Phone Number
- Work Phone Number (optional)
- Cell Phone Number
- Email Address
- Preferred Contact Method

**1.3 Current Address**
- Street Address
- City, State, ZIP Code
- Years and Months at Current Address
- Housing Status (Own, Rent, Other)

**1.4 Previous Address** (if less than 2 years at current)
- Street Address
- City, State, ZIP Code
- Years and Months at Previous Address
- Housing Status

**1.5 Citizenship & Residency**
- U.S. Citizen: Yes/No
- Permanent Resident Alien: Yes/No
- Non-Permanent Resident Alien: Yes/No
- If non-citizen: Alien Registration Number

**1.6 Marital Status**
- Married, Unmarried, Separated, Divorced, Widowed

**1.7 Dependents**
- Number of Dependents (excluding co-borrower)
- Ages of Dependents

### 3.0.2 Section 2: Financial Information - Assets

**2.1 Liquid Assets**
- Checking Account(s): Institution, Account Number, Balance
- Savings Account(s): Institution, Account Number, Balance
- Money Market Account(s): Institution, Account Number, Balance

**2.2 Investment Assets**
- Stocks, Bonds, Mutual Funds: Description, Value
- Retirement Accounts (401k, IRA): Institution, Value
- Other Assets: Description, Value

**2.3 Real Estate Assets**
- Property Address
- Property Type
- Market Value
- Mortgage Balance
- Net Equity
- Rental Income (if applicable)

**2.4 Other Assets**
- Life Insurance Cash Value
- Automobiles: Make, Model, Year, Value
- Other Assets: Description, Value

**2.5 Gifts and Grants**
- Gift Source
- Gift Amount
- Gift Letter Required: Yes/No

### 3.0.3 Section 3: Financial Information - Liabilities

**3.1 Real Estate Liabilities**
- Property Address
- Type of Property
- Monthly Payment
- Unpaid Balance
- Status (Current, Past Due)

**3.2 Installment Accounts**
- Creditor Name
- Account Number
- Monthly Payment
- Unpaid Balance
- Months Left to Pay

**3.3 Revolving Accounts**
- Creditor Name
- Account Number
- Monthly Payment
- Unpaid Balance
- Credit Limit

**3.4 Other Liabilities**
- Alimony/Child Support: Monthly Payment, Months Remaining
- Other Debts: Description, Monthly Payment, Unpaid Balance

**3.5 Net Worth Calculation**
- Total Assets (calculated)
- Total Liabilities (calculated)
- Net Worth (calculated)

### 3.0.4 Section 4: Employment Information

**4.1 Current Employment**
- Employer Name
- Employer Address (Street, City, State, ZIP)
- Employer Phone Number
- Position/Title
- Start Date
- Years in Profession
- Employment Status (Employed, Self-Employed, Retired, Other)
- Business Type (if self-employed)
- Monthly Income (Base, Overtime, Bonuses, Commissions, Dividends, Net Rental Income, Other)

**4.2 Previous Employment** (if less than 2 years at current)
- Employer Name
- Employer Address
- Position/Title
- Start Date
- End Date
- Monthly Income

**4.3 Income Details**
- Base Employment Income
- Overtime Income
- Bonuses
- Commissions
- Dividends/Interest
- Net Rental Income
- Other Income (with explanation)
- Total Monthly Income (calculated)

### 3.0.5 Section 5: Loan and Property Information

**5.1 Property Information**
- Property Address (Street, City, State, ZIP)
- Property Type (Single Family, Condo, Townhouse, 2-4 Unit, Other)
- Property Will Be: Primary Residence, Secondary Residence, Investment Property
- Year Built
- Number of Units

**5.2 Loan Information**
- Loan Type: Conventional, FHA, VA, USDA, Other
- Loan Purpose: Purchase, Refinance, Cash-Out Refinance
- Requested Loan Amount
- Interest Rate
- Loan Term (in years)
- Amortization Type: Fixed, Adjustable, Other
- Requested Loan Term (in months)

**5.3 Purchase Information** (if purchase)
- Purchase Price
- Estimated Prepaid Items
- Estimated Closing Costs
- Down Payment
- Down Payment Source

**5.4 Refinance Information** (if refinance)
- Purpose of Refinance
- Current Lender
- Unpaid Principal Balance
- Cash Out Amount (if applicable)

### 3.0.6 Section 6: Declarations

**6.1 Borrower Declarations** (Yes/No questions with explanations if Yes)
- Are there any outstanding judgments against you?
- Have you been declared bankrupt within the past 7 years?
- Have you had property foreclosed upon or given title or deed in lieu thereof in the last 7 years?
- Are you a party to a lawsuit?
- Have you directly or indirectly been obligated on any loan which resulted in foreclosure, transfer of title in lieu of foreclosure, or judgment?
- Are you presently delinquent or in default on any Federal debt or any other loan, mortgage, financial obligation, bond, or loan guarantee?
- Are you obligated to pay alimony, child support, or separate maintenance?
- Is any part of the down payment borrowed?
- Are you a co-maker or endorser on a note?
- Are you a U.S. citizen or permanent resident alien?
- Do you intend to occupy the property as your primary residence?
- Have you had an ownership interest in a property in the last 3 years?
- What type of property was it? (if yes to above)
- What was your use of that property? (if yes to above)

**6.2 Co-Borrower Declarations** (same questions for co-borrower)

### 3.0.7 Section 7: Acknowledgment and Agreement

**7.1 Acknowledgments**
- Borrower acknowledges receipt of required disclosures
- Borrower agrees to terms and conditions
- Borrower certifies information is true and accurate

**7.2 Signatures**
- Primary Borrower Signature (electronic)
- Co-Borrower Signature (electronic)
- Date Signed

### 3.0.8 Section 8: Loan Originator Information (Lender Section)

**8.1 Lender/Organization Information**
- Lender Name
- Lender NMLS ID (Nationwide Mortgage Licensing System ID)
- Lender Address (Street, City, State, ZIP)
- Lender Phone Number
- Lender Email
- Lender License Number
- Lender License State

**8.2 Loan Originator Information**
- Loan Originator Name
- Loan Originator NMLS ID
- Loan Originator License Number
- Loan Originator License State
- Loan Originator Phone Number
- Loan Originator Email
- Loan Originator Address (Street, City, State, ZIP)

**Note**: This section is typically completed by the lender/loan officer, not the borrower. The current `urla-sql-postgres.sql` schema only includes minimal lender tracking fields (`LenderCaseNumber`, `MERSMIN`) and does not include the full Section 8/9 lender information. A `LenderInformation` table should be added as an enhancement.

### 3.0.8 Form Features & Requirements

**Conditional Logic:**
- Show previous address only if less than 2 years at current
- Show previous employment only if less than 2 years at current
- Show purchase-specific fields only if loan purpose is "Purchase"
- Show refinance-specific fields only if loan purpose is "Refinance"
- Show self-employment fields only if employment status is "Self-Employed"
- Show explanation fields for declarations only if answer is "Yes"

**Validation Rules:**
- SSN: Must be 9 digits, format XXX-XX-XXXX
- Dates: Must be valid dates, DOB must be 18+ years
- Phone numbers: Must be valid format
- Email: Must be valid email format
- Monetary values: Must be positive numbers, appropriate decimal places
- Required fields: Cannot be empty
- Calculated fields: Auto-calculate (DTI, Net Worth, Total Income, etc.)

**Data Security:**
- Encrypt SSN, account numbers, and other sensitive PII
- Secure transmission (TLS 1.3)
- Secure storage (encryption at rest)
- Access controls and audit logging

---

## 3. Core Features & Modules

### 3.1 User Management
- **User Roles**: Borrower, Loan Officer, Underwriter, Admin, Lender
- **Authentication**: Multi-factor authentication (MFA)
- **Profile Management**: Personal information, preferences, settings
- **Role-Based Access Control (RBAC)**: Granular permissions

### 3.2 Loan Application Management
- **Application Creation**: Step-by-step wizard
- **Application Status Tracking**: Real-time status updates
- **Save & Resume**: Auto-save functionality
- **Application History**: Complete audit trail
- **Multi-borrower Support**: Co-applicants, co-signers

### 3.3 Document Management
- **Document Upload**: Drag-and-drop, mobile camera capture
- **Document Types**: Income verification, tax returns, bank statements, IDs, etc.
- **OCR Processing**: Automatic data extraction from documents
- **Document Verification**: Automated validation
- **Secure Storage**: Encrypted at rest and in transit
- **Version Control**: Document versioning

### 3.4 Income & Asset Verification
- **Bank Account Linking**: Plaid or similar integration
- **Payroll Verification**: Automated income verification
- **Asset Verification**: Bank statements, investment accounts
- **Tax Document Processing**: W-2, 1099, tax returns

### 3.5 Credit & Risk Assessment
- **Credit Check Integration**: Experian, Equifax, TransUnion APIs
- **Credit Score Display**: Real-time credit score
- **Debt-to-Income (DTI) Calculation**: Automated calculations
- **Risk Scoring**: Internal risk assessment algorithms

### 3.6 Communication & Collaboration
- **In-App Messaging**: Real-time chat between parties
- **Email Notifications**: Automated status updates
- **SMS Notifications**: Critical alerts
- **Activity Feed**: Timeline of application events
- **Comments & Notes**: Internal notes for loan officers

### 3.7 Compliance & Regulatory
- **TRID Compliance**: TILA-RESPA Integrated Disclosures
- **HMDA Reporting**: Home Mortgage Disclosure Act
- **Fair Lending**: Automated compliance checks
- **Document Retention**: Regulatory retention policies
- **Audit Logging**: Complete audit trail

### 3.8 Loan Officer Tools
- **Pipeline Management**: View and manage applications
- **Task Management**: To-do lists, reminders
- **Client Management**: Borrower profiles and history
- **Document Review**: Approve/reject documents
- **Condition Management**: Loan conditions tracking

### 3.9 Underwriting
- **Automated Underwriting System (AUS)**: Integration with DU/LP
- **Manual Underwriting**: Underwriter review tools
- **Condition Tracking**: Outstanding conditions management
- **Decision Engine**: Approve/denial/refer logic

### 3.10 Analytics & Reporting
- **Dashboard**: Key metrics and KPIs
- **Application Analytics**: Conversion rates, time-to-close
- **Loan Officer Performance**: Productivity metrics
- **Compliance Reports**: Regulatory reporting
- **Custom Reports**: Ad-hoc reporting capabilities

---

## 4. Database Schema Design

### PostgreSQL Schema (Core Entities)

#### Users & Authentication
```sql
-- users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- borrower, loan_officer, underwriter, admin
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- user_sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### URLA Form 1003 Schema (Phase 1)

**Primary Schema Reference**: The database schema for URLA Form 1003 is defined in `urla-sql-postgres.sql`. This file contains the complete, production-ready schema that should be used as the source of truth for Phase 1 implementation.

**Core Tables from urla-sql-postgres.sql:**
- `LoanApplications` - Main application container
- `Applicants` - Primary and co-applicant information (includes HMDA demographic data)
- `Properties` - Subject property information
- `Residences` - Current and previous addresses
- `Employments` - Employment history
- `Incomes` - Detailed income breakdown (separate table for income types)
- `Assets` - All asset types
- `Liabilities` - All liability types
- `Declarations` - Declaration questions and responses
- `RealEstateOwned` - Real estate assets owned by applicants

**Schema Enhancements Needed** (to be added as separate migration files):

1. **Contact Information** - May need to add phone/email fields to `Applicants` table if not present
2. **Lender/Loan Originator Information** - **MISSING**: Section 9 of URLA Form 1003 requires lender and loan originator details (see below)
3. **Electronic Signatures** - New table for signature capture
4. **Form State & Auto-Save** - Table for tracking form progress and draft data
5. **Application Status History** - Track status changes over time
6. **Form Audit Log** - Comprehensive audit trail for compliance

See detailed schema enhancements section below.

#### Schema Enhancements for Phase 1

The following tables should be added to support Phase 1 functionality. These complement the existing `urla-sql-postgres.sql` schema:

**1. Contact Information Enhancement**
```sql
-- Add to Applicants table if not present (check existing schema first)
ALTER TABLE Applicants ADD COLUMN IF NOT EXISTS HomePhone VARCHAR(20);
ALTER TABLE Applicants ADD COLUMN IF NOT EXISTS WorkPhone VARCHAR(20);
ALTER TABLE Applicants ADD COLUMN IF NOT EXISTS CellPhone VARCHAR(20);
ALTER TABLE Applicants ADD COLUMN IF NOT EXISTS Email VARCHAR(255);
ALTER TABLE Applicants ADD COLUMN IF NOT EXISTS PreferredContactMethod VARCHAR(50);
```

**2. Lender/Loan Originator Information** (URLA Section 9 - **MISSING FROM CURRENT SCHEMA**)
```sql
-- Lender/Organization Information
CREATE TABLE LenderInformation (
    LenderInfoID BIGSERIAL PRIMARY KEY,
    LoanApplicationID BIGINT NOT NULL UNIQUE REFERENCES LoanApplications(LoanApplicationID),
    -- Lender/Organization Details
    LenderName VARCHAR(255) NOT NULL,
    LenderNMLSID VARCHAR(20), -- Nationwide Mortgage Licensing System ID
    LenderAddressStreet VARCHAR(255),
    LenderAddressCity VARCHAR(100),
    LenderAddressState VARCHAR(2),
    LenderAddressZip VARCHAR(10),
    LenderPhone VARCHAR(20),
    LenderEmail VARCHAR(255),
    LenderLicenseNumber VARCHAR(100),
    LenderLicenseState VARCHAR(2),
    -- Loan Originator Details
    LoanOriginatorName VARCHAR(255),
    LoanOriginatorNMLSID VARCHAR(20),
    LoanOriginatorLicenseNumber VARCHAR(100),
    LoanOriginatorLicenseState VARCHAR(2),
    LoanOriginatorPhone VARCHAR(20),
    LoanOriginatorEmail VARCHAR(255),
    -- Additional Information
    LoanOriginatorAddressStreet VARCHAR(255),
    LoanOriginatorAddressCity VARCHAR(100),
    LoanOriginatorAddressState VARCHAR(2),
    LoanOriginatorAddressZip VARCHAR(10),
    CreatedDate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    LastUpdatedDate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_LenderInformation_LoanApplicationID ON LenderInformation (LoanApplicationID);
CREATE INDEX IDX_LenderInformation_LenderNMLSID ON LenderInformation (LenderNMLSID);
CREATE INDEX IDX_LenderInformation_LoanOriginatorNMLSID ON LenderInformation (LoanOriginatorNMLSID);
```

**3. Electronic Signatures**
```sql
CREATE TABLE ApplicationSignatures (
    SignatureID BIGSERIAL PRIMARY KEY,
    LoanApplicationID BIGINT NOT NULL REFERENCES LoanApplications(LoanApplicationID),
    ApplicantID BIGINT NOT NULL REFERENCES Applicants(ApplicantID),
    SignatureData TEXT NOT NULL, -- Encrypted signature data
    IPAddress VARCHAR(45),
    UserAgent TEXT,
    SignedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_ApplicationSignatures_LoanApplicationID ON ApplicationSignatures (LoanApplicationID);
CREATE INDEX IDX_ApplicationSignatures_ApplicantID ON ApplicationSignatures (ApplicantID);
```

**4. Form State & Auto-Save**
```sql
CREATE TABLE ApplicationFormState (
    StateID BIGSERIAL PRIMARY KEY,
    LoanApplicationID BIGINT NOT NULL UNIQUE REFERENCES LoanApplications(LoanApplicationID),
    CurrentSection VARCHAR(100), -- Current section being worked on
    CompletionPercentage INT DEFAULT 0,
    FormData JSONB, -- Draft form data (for auto-save)
    LastSavedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_ApplicationFormState_LoanApplicationID ON ApplicationFormState (LoanApplicationID);
```

**5. Application Status History**
```sql
CREATE TABLE ApplicationStatusHistory (
    StatusHistoryID BIGSERIAL PRIMARY KEY,
    LoanApplicationID BIGINT NOT NULL REFERENCES LoanApplications(LoanApplicationID),
    PreviousStatus VARCHAR(50),
    NewStatus VARCHAR(50) NOT NULL,
    ChangedBy BIGINT, -- User ID who made the change (if user table exists)
    ChangeReason TEXT,
    ChangedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_ApplicationStatusHistory_LoanApplicationID ON ApplicationStatusHistory (LoanApplicationID);
CREATE INDEX IDX_ApplicationStatusHistory_ChangedAt ON ApplicationStatusHistory (ChangedAt);
```

**6. Form Audit Log** (for compliance)
```sql
CREATE TABLE ApplicationAuditLog (
    AuditLogID BIGSERIAL PRIMARY KEY,
    LoanApplicationID BIGINT NOT NULL REFERENCES LoanApplications(LoanApplicationID),
    ApplicantID BIGINT REFERENCES Applicants(ApplicantID),
    TableName VARCHAR(100) NOT NULL, -- Which table was modified
    RecordID BIGINT NOT NULL, -- ID of the modified record
    FieldName VARCHAR(255),
    OldValue TEXT,
    NewValue TEXT,
    ChangedBy BIGINT, -- User ID (if user table exists)
    ChangedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    IPAddress VARCHAR(45),
    UserAgent TEXT
);

CREATE INDEX IDX_ApplicationAuditLog_LoanApplicationID ON ApplicationAuditLog (LoanApplicationID);
CREATE INDEX IDX_ApplicationAuditLog_ApplicantID ON ApplicationAuditLog (ApplicantID);
CREATE INDEX IDX_ApplicationAuditLog_ChangedAt ON ApplicationAuditLog (ChangedAt);
CREATE INDEX IDX_ApplicationAuditLog_TableName_RecordID ON ApplicationAuditLog (TableName, RecordID);
```

#### Implementation Notes

- **Schema Reference**: Always refer to `urla-sql-postgres.sql` as the primary schema source
- **Enhancement Migrations**: Create separate migration files for enhancements
- **Backward Compatibility**: Ensure enhancements don't break existing schema
- **Encryption**: SSN and account numbers should be encrypted at application layer
- **Data Types**: Match existing schema conventions (BIGSERIAL, DECIMAL(18,2), TIMESTAMP WITH TIME ZONE)
- **Foreign Keys**: All enhancement tables properly reference existing tables
- **Indexes**: Add appropriate indexes for performance (following existing schema patterns)

#### Loan Applications (Future Phases)
```sql
-- loan_applications table - Extended application data (post-URLA submission)
CREATE TABLE loan_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    urla_application_id UUID REFERENCES urla_applications(id),
    application_number VARCHAR(50) UNIQUE NOT NULL,
    borrower_id UUID REFERENCES users(id),
    loan_officer_id UUID REFERENCES users(id),
    property_address TEXT,
    property_type VARCHAR(50),
    loan_type VARCHAR(50), -- conventional, FHA, VA, USDA
    loan_amount DECIMAL(15,2),
    interest_rate DECIMAL(5,4),
    loan_term INTEGER, -- in months
    purpose VARCHAR(50), -- purchase, refinance, cash_out
    status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, in_review, approved, denied, closed
    current_step VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP,
    closed_at TIMESTAMP
);

-- co_applicants table
CREATE TABLE co_applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES loan_applications(id),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    relationship VARCHAR(50), -- co_borrower, co_signer
    created_at TIMESTAMP DEFAULT NOW()
);

-- application_status_history table
CREATE TABLE application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES loan_applications(id),
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Documents
```sql
-- documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES loan_applications(id),
    document_type VARCHAR(100) NOT NULL, -- w2, bank_statement, tax_return, id
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
    ocr_data JSONB, -- extracted data from OCR
    uploaded_by UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Income & Assets
```sql
-- income_sources table
CREATE TABLE income_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES loan_applications(id),
    borrower_id UUID REFERENCES users(id),
    income_type VARCHAR(50), -- salary, self_employed, rental, etc.
    employer_name VARCHAR(255),
    monthly_amount DECIMAL(12,2),
    verification_status VARCHAR(50) DEFAULT 'pending',
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- assets table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES loan_applications(id),
    borrower_id UUID REFERENCES users(id),
    asset_type VARCHAR(50), -- checking, savings, investment, real_estate
    institution_name VARCHAR(255),
    account_number VARCHAR(100),
    balance DECIMAL(15,2),
    verification_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Credit & Underwriting
```sql
-- credit_reports table
CREATE TABLE credit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES loan_applications(id),
    borrower_id UUID REFERENCES users(id),
    credit_bureau VARCHAR(50), -- experian, equifax, transunion
    credit_score INTEGER,
    report_data JSONB, -- full credit report data
    pulled_at TIMESTAMP DEFAULT NOW()
);

-- underwriting_decisions table
CREATE TABLE underwriting_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES loan_applications(id),
    decision_type VARCHAR(50), -- automated, manual
    decision VARCHAR(50), -- approve, deny, refer
    aus_system VARCHAR(50), -- DU, LP
    aus_recommendation TEXT,
    underwriter_id UUID REFERENCES users(id),
    decision_date TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- loan_conditions table
CREATE TABLE loan_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES loan_applications(id),
    condition_type VARCHAR(100), -- prior_to_doc, prior_to_funding, prior_to_closing
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'outstanding', -- outstanding, satisfied, waived
    required_by UUID REFERENCES users(id),
    satisfied_by UUID REFERENCES users(id),
    satisfied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Communication
```sql
-- messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES loan_applications(id),
    sender_id UUID REFERENCES users(id),
    recipient_id UUID REFERENCES users(id),
    subject VARCHAR(255),
    body TEXT NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50), -- email, sms, in_app
    title VARCHAR(255),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, read
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### MongoDB Collections (Unstructured Data)

- **application_forms**: Dynamic form data, field-level changes
- **document_metadata**: Extended document information, processing logs
- **audit_logs**: Detailed audit trail of all actions
- **analytics_events**: User behavior tracking, analytics events
- **system_logs**: Application logs, error logs

---

## 5. API Design

### RESTful API Endpoints

#### URLA Form 1003 APIs (Phase 1)
```
# Application Management
POST   /api/v1/urla/applications                    # Create new URLA application
GET    /api/v1/urla/applications                    # List user's URLA applications
GET    /api/v1/urla/applications/{id}               # Get URLA application details
PUT    /api/v1/urla/applications/{id}               # Update URLA application
DELETE /api/v1/urla/applications/{id}               # Delete draft application
POST   /api/v1/urla/applications/{id}/save          # Auto-save form data
POST   /api/v1/urla/applications/{id}/submit        # Submit completed URLA form
GET    /api/v1/urla/applications/{id}/progress      # Get completion progress

# Borrower Information
GET    /api/v1/urla/applications/{id}/borrowers     # Get all borrowers
POST   /api/v1/urla/applications/{id}/borrowers     # Add co-borrower
GET    /api/v1/urla/applications/{id}/borrowers/{borrowerId}  # Get borrower details
PUT    /api/v1/urla/applications/{id}/borrowers/{borrowerId}  # Update borrower info
DELETE /api/v1/urla/applications/{id}/borrowers/{borrowerId}  # Remove co-borrower

# Employment Information
GET    /api/v1/urla/applications/{id}/borrowers/{borrowerId}/employment
POST   /api/v1/urla/applications/{id}/borrowers/{borrowerId}/employment
GET    /api/v1/urla/applications/{id}/borrowers/{borrowerId}/employment/{employmentId}
PUT    /api/v1/urla/applications/{id}/borrowers/{borrowerId}/employment/{employmentId}
DELETE /api/v1/urla/applications/{id}/borrowers/{borrowerId}/employment/{employmentId}

# Assets
GET    /api/v1/urla/applications/{id}/borrowers/{borrowerId}/assets
POST   /api/v1/urla/applications/{id}/borrowers/{borrowerId}/assets
GET    /api/v1/urla/applications/{id}/borrowers/{borrowerId}/assets/{assetId}
PUT    /api/v1/urla/applications/{id}/borrowers/{borrowerId}/assets/{assetId}
DELETE /api/v1/urla/applications/{id}/borrowers/{borrowerId}/assets/{assetId}

# Liabilities
GET    /api/v1/urla/applications/{id}/borrowers/{borrowerId}/liabilities
POST   /api/v1/urla/applications/{id}/borrowers/{borrowerId}/liabilities
GET    /api/v1/urla/applications/{id}/borrowers/{borrowerId}/liabilities/{liabilityId}
PUT    /api/v1/urla/applications/{id}/borrowers/{borrowerId}/liabilities/{liabilityId}
DELETE /api/v1/urla/applications/{id}/borrowers/{borrowerId}/liabilities/{liabilityId}

# Property Information
GET    /api/v1/urla/applications/{id}/property
PUT    /api/v1/urla/applications/{id}/property

# Loan Information
GET    /api/v1/urla/applications/{id}/loan
PUT    /api/v1/urla/applications/{id}/loan

# Declarations
GET    /api/v1/urla/applications/{id}/declarations
PUT    /api/v1/urla/applications/{id}/declarations
GET    /api/v1/urla/applications/{id}/borrowers/{borrowerId}/declarations
PUT    /api/v1/urla/applications/{id}/borrowers/{borrowerId}/declarations

# Lender/Loan Originator Information (Section 8/9)
GET    /api/v1/urla/applications/{id}/lender
PUT    /api/v1/urla/applications/{id}/lender

# Signatures
POST   /api/v1/urla/applications/{id}/signatures
GET    /api/v1/urla/applications/{id}/signatures

# Calculations
GET    /api/v1/urla/applications/{id}/calculations/dti          # Debt-to-Income ratio
GET    /api/v1/urla/applications/{id}/calculations/net-worth    # Net worth
GET    /api/v1/urla/applications/{id}/calculations/total-income # Total monthly income
```

#### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/mfa/enable
POST   /api/v1/auth/mfa/verify
```

#### Applications
```
GET    /api/v1/applications
POST   /api/v1/applications
GET    /api/v1/applications/{id}
PUT    /api/v1/applications/{id}
DELETE /api/v1/applications/{id}
GET    /api/v1/applications/{id}/status
PUT    /api/v1/applications/{id}/status
GET    /api/v1/applications/{id}/history
POST   /api/v1/applications/{id}/submit
```

#### Documents
```
GET    /api/v1/applications/{id}/documents
POST   /api/v1/applications/{id}/documents
GET    /api/v1/documents/{id}
DELETE /api/v1/documents/{id}
POST   /api/v1/documents/{id}/verify
GET    /api/v1/documents/{id}/download
```

#### Income & Assets
```
GET    /api/v1/applications/{id}/income
POST   /api/v1/applications/{id}/income
PUT    /api/v1/applications/{id}/income/{incomeId}
DELETE /api/v1/applications/{id}/income/{incomeId}
GET    /api/v1/applications/{id}/assets
POST   /api/v1/applications/{id}/assets
```

#### Credit
```
POST   /api/v1/applications/{id}/credit/pull
GET    /api/v1/applications/{id}/credit
GET    /api/v1/applications/{id}/credit/report
```

#### Underwriting
```
GET    /api/v1/applications/{id}/underwriting
POST   /api/v1/applications/{id}/underwriting/decision
GET    /api/v1/applications/{id}/conditions
POST   /api/v1/applications/{id}/conditions
PUT    /api/v1/conditions/{id}
```

#### Communication
```
GET    /api/v1/applications/{id}/messages
POST   /api/v1/applications/{id}/messages
GET    /api/v1/notifications
PUT    /api/v1/notifications/{id}/read
```

#### Users
```
GET    /api/v1/users/me
PUT    /api/v1/users/me
GET    /api/v1/users/{id}
GET    /api/v1/loan-officers
```

---

## 6. Frontend Architecture

### Next.js App Structure
```
/app
  /(auth)
    /login
    /register
    /forgot-password
  /(dashboard)
    /dashboard
    /applications
      /[id]
        /overview
        /documents
        /income
        /credit
        /underwriting
    /documents
    /messages
    /settings
  /api (API routes for server-side operations)
/components
  /ui (shadcn/ui components)
  /forms
  /layout
/lib
  /api (API client)
  /hooks
  /utils
  /validations
/types
/public
```

### Key Frontend Features
- **Server-Side Rendering (SSR)**: For SEO and initial load performance
- **Static Site Generation (SSG)**: For public pages
- **Incremental Static Regeneration (ISR)**: For dynamic content
- **Client-Side Routing**: Smooth navigation
- **Form Validation**: Real-time validation with Zod
- **File Upload**: Drag-and-drop with progress indicators
- **Real-time Updates**: WebSocket or Server-Sent Events
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance

---

## 7. Security & Compliance

### Security Measures
- **Encryption**: TLS 1.3 for data in transit, AES-256 for data at rest
- **Authentication**: JWT with short expiration, refresh tokens
- **Authorization**: RBAC with fine-grained permissions
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Content Security Policy (CSP)
- **CSRF Protection**: CSRF tokens
- **Rate Limiting**: API rate limiting
- **Secrets Management**: Environment variables, secret management service
- **Security Headers**: HSTS, X-Frame-Options, etc.

### Compliance Requirements
- **SOC 2 Type II**: Security and availability controls
- **PCI DSS**: If handling payment data
- **GDPR/CCPA**: Data privacy compliance
- **TRID**: TILA-RESPA Integrated Disclosures
- **HMDA**: Home Mortgage Disclosure Act reporting
- **Fair Lending**: Equal credit opportunity compliance
- **Data Retention**: Regulatory retention policies
- **Audit Logging**: Comprehensive audit trails

---

## 8. Development Phases

### Phase 1: URLA Form 1003 Implementation (Weeks 1-10)

**Objective**: Build a complete, production-ready online implementation of the Uniform Residential Loan Application (URLA) Form 1003, the industry-standard mortgage application form.

#### Week 1-2: Project Setup & Form Analysis

**1.1 Project Infrastructure Setup**
- [ ] Initialize Go backend project structure (following tauad/backend pattern)
- [ ] Initialize Next.js frontend project
- [ ] Create `docker-compose.yml` for local development:
  - PostgreSQL 15 (port 5432)
  - MongoDB 7 (port 27017)
  - Named volumes for data persistence
  - Health checks for both services
- [ ] Create backend `.env.example` with configuration template
- [ ] Create frontend `.env.local.example` with configuration template
- [ ] Set up Makefile for backend (sqlc commands, build, run)
- [ ] Configure development environment and tooling
- [ ] Set up Git repository and branching strategy
- [ ] Configure CI/CD pipeline (GitHub Actions/GitLab CI)
- [ ] Set up code quality tools (linters, formatters)
- [ ] Document local development setup process

**1.2 URLA Form 1003 Analysis & Design**
- [ ] Review latest URLA Form 1003 specification and structure
- [ ] Document all form sections and fields:
  - Section 1: Borrower Information (Personal, Contact, Citizenship)
  - Section 2: Financial Information (Assets, Liabilities)
  - Section 3: Employment Information (Current & Previous Employment)
  - Section 4: Loan and Property Information
  - Section 5: Declarations
  - Section 6: Acknowledgment and Agreement
  - Section 7/8: Loan Originator Information (Lender Section) - **Note: Missing from current schema**
- [ ] Map conditional logic and field dependencies
- [ ] Design multi-borrower/co-applicant flow
- [ ] Create UX wireframes and user flow diagrams
- [ ] Design responsive layouts for desktop, tablet, and mobile

#### Week 3-4: Database Schema & Backend Foundation

**1.3 Database Schema Review & Enhancements**
- [ ] Review existing `urla-sql-postgres.sql` schema file (primary source of truth)
- [ ] Map existing schema tables to URLA Form 1003 sections:
  - `LoanApplications` → Main application container
  - `Applicants` → Borrower and co-applicant information (Section 1)
  - `Residences` → Current and previous addresses (Section 1)
  - `Employments` → Employment history (Section 4)
  - `Incomes` → Income breakdown (Section 4)
  - `Assets` → Financial assets (Section 2)
  - `RealEstateOwned` → Real estate assets (Section 2)
  - `Liabilities` → Financial liabilities (Section 3)
  - `Properties` → Subject property (Section 5)
  - `Declarations` → Declaration questions (Section 6)
- [ ] Verify all required URLA Form 1003 fields are covered in existing schema
- [ ] Identify any gaps or missing fields:
  - Contact information in Applicants table
  - **Lender/Loan Originator Information (Section 8/9) - Currently missing from schema**
- [ ] Design and create enhancement tables for Phase 1 features:
  - `ApplicationSignatures` - Electronic signature capture
  - `ApplicationFormState` - Form progress and auto-save data
  - `ApplicationStatusHistory` - Status change tracking
  - `ApplicationAuditLog` - Comprehensive audit trail
- [ ] Create database migration scripts for enhancements
- [ ] Set up database connection pooling and transaction management
- [ ] Design MongoDB collections for form state and audit (if needed):
  - `urla_form_state`: Field-level changes, draft data
  - `urla_audit_log`: Complete audit trail of form changes

**1.4 Backend API Foundation**
- [ ] Initialize Go module and set up project structure following tauad/backend pattern
- [ ] Set up Gin HTTP server with routing (`api/routes.go`)
- [ ] Configure Viper + godotenv for configuration management (`internal/config/`)
- [ ] Set up PostgreSQL connection using pgx/v5 (`internal/database/connection.go`)
- [ ] Configure sqlc for type-safe SQL code generation (`sqlc.yaml`)
- [ ] Create SQL query files in `internal/sql/queries/` for sqlc
- [ ] Set up database schema file (`internal/sql/schema.sql`) based on `urla-sql-postgres.sql`
- [ ] Implement middleware (CORS, auth, logger) in `internal/middleware/`
- [ ] Implement JWT authentication utilities (`internal/utils/jwt.go`)
- [ ] Create repository pattern structure (`internal/repositories/`)
- [ ] Create service layer structure (`internal/services/`)
- [ ] Create handler layer structure (`internal/handlers/`)
- [ ] Set up Makefile with sqlc commands
- [ ] Create API response structures and error handling

#### Week 5-7: Backend API Implementation

**1.5 URLA Application API Implementation**

**SQL Queries (for sqlc):**
- [ ] Create `internal/sql/queries/applications.sql` with queries for:
  - Create application
  - Get application by ID
  - List applications by user
  - Update application
  - Delete application
  - Get application progress
- [ ] Run `sqlc generate` to generate type-safe Go code

**Repository Layer:**
- [ ] Create `internal/repositories/application_repository.go`
- [ ] Implement methods using sqlc generated code
- [ ] Handle database transactions

**Service Layer:**
- [ ] Create `internal/services/urla_service.go`
- [ ] Implement business logic for application management
- [ ] Implement auto-save functionality
- [ ] Implement form validation
- [ ] Implement progress calculation

**Handler Layer:**
- [ ] Create `internal/handlers/urla.go`
- [ ] Implement HTTP handlers:
  - `POST /api/v1/urla/applications` - Create new application
  - `GET /api/v1/urla/applications` - List user's applications
  - `GET /api/v1/urla/applications/{id}` - Get application details
  - `PUT /api/v1/urla/applications/{id}` - Update application
  - `DELETE /api/v1/urla/applications/{id}` - Delete draft application
  - `POST /api/v1/urla/applications/{id}/save` - Auto-save form data
  - `POST /api/v1/urla/applications/{id}/submit` - Submit completed form
  - `GET /api/v1/urla/applications/{id}/progress` - Get completion progress
- [ ] Add input validation and error handling

**1.6 URLA Section-Specific APIs**
- [ ] Borrower Information APIs:
  - `GET/PUT /api/v1/urla/applications/{id}/borrowers`
  - `POST /api/v1/urla/applications/{id}/borrowers` - Add co-borrower
  - `GET/PUT /api/v1/urla/applications/{id}/borrowers/{borrowerId}`
- [ ] Employment Information APIs:
  - `GET/POST/PUT /api/v1/urla/applications/{id}/borrowers/{borrowerId}/employment`
- [ ] Assets APIs:
  - `GET/POST/PUT /api/v1/urla/applications/{id}/borrowers/{borrowerId}/assets`
- [ ] Liabilities APIs:
  - `GET/POST/PUT /api/v1/urla/applications/{id}/borrowers/{borrowerId}/liabilities`
- [ ] Property Information APIs:
  - `GET/PUT /api/v1/urla/applications/{id}/property`
- [ ] Loan Information APIs:
  - `GET/PUT /api/v1/urla/applications/{id}/loan`
- [ ] Declarations APIs:
  - `GET/PUT /api/v1/urla/applications/{id}/declarations`

**1.7 Data Validation & Business Logic**
- [ ] Implement server-side validation for all URLA fields
- [ ] Create validation rules based on URLA specifications:
  - SSN format validation
  - Date validations
  - Income calculations
  - DTI (Debt-to-Income) calculations
  - Asset/liability balance validations
- [ ] Implement conditional field logic (show/hide based on answers)
- [ ] Create form completeness checker
- [ ] Implement data encryption for sensitive fields (SSN, account numbers)

#### Week 8-9: Frontend Implementation

**1.8 Frontend Project Setup**
- [ ] Initialize Next.js 14+ project with App Router
- [ ] Set up Tailwind CSS and shadcn/ui component library
- [ ] Configure React Hook Form and Zod validation
- [ ] Set up API client (Axios/React Query)
- [ ] Create TypeScript types for URLA form data
- [ ] Set up state management (Zustand/Redux)
- [ ] Configure form auto-save functionality

**1.9 URLA Form Components**
- [ ] Create reusable form field components:
  - Text input, number input, date picker
  - Select dropdown, radio buttons, checkboxes
  - Address input component
  - Phone number input with formatting
  - SSN input with masking
- [ ] Build section navigation component (progress indicator)
- [ ] Create form step/wizard component
- [ ] Implement save/resume functionality UI
- [ ] Build validation error display components

**1.10 URLA Form Sections Implementation**
- [ ] **Section 1: Borrower Information**
  - Personal information form (name, DOB, SSN)
  - Contact information form
  - Address history form
  - Citizenship status form
  - Co-borrower addition flow
- [ ] **Section 2: Financial Information**
  - Assets form (checking, savings, investments, real estate)
  - Liabilities form (credit cards, loans, mortgages)
  - Dynamic add/remove for multiple entries
- [ ] **Section 3: Employment Information**
  - Current employment form
  - Previous employment form (if applicable)
  - Self-employment form (conditional)
  - Income details and calculations
- [ ] **Section 4: Loan and Property Information**
  - Property address and details
  - Property type and use
  - Loan type and purpose selection
  - Loan amount and terms
- [ ] **Section 5: Declarations**
  - All required declaration questions
  - Conditional explanations based on answers
- [ ] **Section 6: Acknowledgment and Agreement**
  - Terms and conditions display
  - Electronic signature capture
  - Submission confirmation
- [ ] **Section 7/8: Loan Originator Information** (Lender Section)
  - Lender/Organization information form
  - Loan Originator information form
  - NMLS ID validation
  - License information capture

**1.11 Form Features**
- [ ] Implement multi-step wizard navigation
- [ ] Add progress indicator showing completion percentage
- [ ] Implement auto-save with debouncing
- [ ] Add form validation with real-time feedback
- [ ] Create conditional field display logic
- [ ] Implement field-level help text and tooltips
- [ ] Add "Save and Continue Later" functionality
- [ ] Create responsive design for mobile/tablet
- [ ] Implement accessibility features (ARIA labels, keyboard navigation)

#### Week 10: Integration, Testing & Deployment

**1.12 Integration & Testing**
- [ ] Integrate frontend with backend APIs
- [ ] End-to-end testing of complete form flow
- [ ] Test multi-borrower scenarios
- [ ] Test form auto-save and resume functionality
- [ ] Test form validation (client and server-side)
- [ ] Test conditional field logic
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Accessibility testing (WCAG 2.1 AA)
- [ ] Performance testing (form load time, save time)
- [ ] Security testing (XSS, CSRF, input validation)

**1.13 Documentation & Deployment**
- [ ] Write API documentation (OpenAPI/Swagger)
- [ ] Create user guide for form completion
- [ ] Document form field mappings and validations
- [ ] Set up staging environment
- [ ] Deploy to staging
- [ ] Conduct user acceptance testing (UAT)
- [ ] Fix bugs and issues from testing
- [ ] Prepare for production deployment

**Phase 1 Deliverables:**
- ✅ Complete online URLA Form 1003 implementation
- ✅ Backend API for form data management
- ✅ Database schema for URLA data
- ✅ Responsive web interface
- ✅ Form validation and business logic
- ✅ Auto-save and resume functionality
- ✅ Multi-borrower support
- ✅ Documentation and deployment to staging

### Phase 2: Core Application Features (Weeks 5-12)
- [ ] User management and profiles
- [ ] Loan application creation and management
- [ ] Document upload and storage
- [ ] Basic application status tracking
- [ ] Frontend application wizard
- [ ] Basic dashboard

### Phase 3: Verification & Credit (Weeks 13-20)
- [ ] Income verification integration
- [ ] Asset verification
- [ ] Credit check integration
- [ ] Bank account linking (Plaid)
- [ ] Document OCR and processing
- [ ] DTI and loan calculations

### Phase 4: Underwriting & Decision (Weeks 21-28)
- [ ] AUS integration (DU/LP)
- [ ] Underwriting workflow
- [ ] Condition management
- [ ] Decision engine
- [ ] Loan officer tools
- [ ] Underwriter dashboard

### Phase 5: Communication & Collaboration (Weeks 29-32)
- [ ] In-app messaging
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Activity feed
- [ ] Comments and notes

### Phase 6: Compliance & Reporting (Weeks 33-36)
- [ ] TRID compliance automation
- [ ] HMDA reporting
- [ ] Audit logging
- [ ] Compliance dashboards
- [ ] Regulatory reports

### Phase 7: Mobile App (Weeks 37-44)
- [ ] React Native setup
- [ ] Shared component library
- [ ] Mobile authentication
- [ ] Mobile application flow
- [ ] Document capture (camera)
- [ ] Push notifications

### Phase 8: Analytics & Optimization (Weeks 45-48)
- [ ] Analytics dashboard
- [ ] Performance monitoring
- [ ] User behavior tracking
- [ ] A/B testing framework
- [ ] Performance optimization

### Phase 9: Testing & QA (Ongoing)
- [ ] Unit tests (backend and frontend)
- [ ] Integration tests
- [ ] E2E tests (Playwright/Cypress)
- [ ] Security testing
- [ ] Performance testing
- [ ] User acceptance testing

### Phase 10: Deployment & Launch (Weeks 49-52)
- [ ] Production environment setup
- [ ] Load testing
- [ ] Security audit
- [ ] Compliance certification
- [ ] Beta testing
- [ ] Production launch
- [ ] Monitoring and alerting

---

## 9. Third-Party Integrations

### Required Integrations
- **Credit Bureaus**: Experian, Equifax, TransUnion APIs
- **AUS Systems**: Fannie Mae Desktop Underwriter (DU), Freddie Mac Loan Product Advisor (LP)
- **Bank Verification**: Plaid, Yodlee, or similar
- **Income Verification**: The Work Number, Truework, or similar
- **Document Processing**: Adobe Sign, DocuSign for e-signatures
- **Email Service**: SendGrid, AWS SES
- **SMS Service**: Twilio, AWS SNS
- **Identity Verification**: Jumio, Onfido
- **Property Valuation**: CoreLogic, Black Knight
- **Flood Certification**: FEMA, CoreLogic
- **Title Services**: Integration with title companies

---

## 10. DevOps & Infrastructure

### Service Topology

#### Development Environment (Local)

**Service Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Local Machine                            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Backend Server (Go)                                │  │
│  │  - Runs locally: go run cmd/server/main.go          │  │
│  │  - Port: 8080                                        │  │
│  │  - Hot reload: Air or similar                        │  │
│  └───────────────┬──────────────────────────────────────┘  │
│                  │                                          │
│  ┌───────────────┴──────────────────────────────────────┐  │
│  │  Frontend Server (Next.js)                           │  │
│  │  - Runs locally: npm run dev                         │  │
│  │  - Port: 3000                                        │  │
│  │  - Hot reload: Next.js built-in                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                  │                    │
                  │                    │
┌─────────────────┴────────────────────┴─────────────────────┐
│              Docker Compose Services                         │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐      │
│  │  PostgreSQL 15        │  │  MongoDB             │      │
│  │  - Container:          │  │  - Container:        │      │
│  │    taulen-postgres     │  │    taulen-mongodb    │      │
│  │  - Port: 5432          │  │  - Port: 27017       │      │
│  │  - Volume:             │  │  - Volume:           │      │
│  │    postgres_data       │  │    mongodb_data      │      │
│  └──────────────────────┘  └──────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Connection Details:**

1. **PostgreSQL** (Docker Container)
   - Host: `localhost` (from host machine)
   - Port: `5432` (mapped from container)
   - Database: `taulen_db`
   - User: `taulen`
   - Password: `taulen_dev_password`
   - SSL Mode: `disable` (development)

2. **MongoDB** (Docker Container)
   - Host: `localhost` (from host machine)
   - Port: `27017` (mapped from container)
   - Database: `taulen_mongo`
   - Authentication: Disabled for local dev (or use simple auth)

3. **Backend Server** (Local Process)
   - Runs: `go run cmd/server/main.go`
   - Port: `8080`
   - Connects to: PostgreSQL (localhost:5432) and MongoDB (localhost:27017)

4. **Frontend Server** (Local Process)
   - Runs: `npm run dev`
   - Port: `3000`
   - Connects to: Backend API (http://localhost:8080/api/v1)

**Docker Compose Configuration:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: taulen-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: taulen
      POSTGRES_PASSWORD: taulen_dev_password
      POSTGRES_DB: taulen_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./urla-sql-postgres.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taulen"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongodb:
    image: mongo:7
    container_name: taulen-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: taulen_mongo
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
  mongodb_data:
    driver: local
```

### Development Environment Setup

**Prerequisites:**
- Go 1.24+
- Node.js 20+
- Docker and Docker Compose

**Startup Sequence:**
1. Start databases: `docker-compose up -d`
2. Apply PostgreSQL schema: `docker exec -i taulen-postgres psql -U taulen -d taulen_db < urla-sql-postgres.sql`
3. Generate sqlc code: `cd backend && make sqlc-generate`
4. Start backend: `cd backend && go run cmd/server/main.go`
5. Start frontend: `cd frontend && npm run dev`

**Environment Variables:**

Backend (`.env`):
```bash
TAULEN_SERVER_HOST=0.0.0.0
TAULEN_SERVER_PORT=8080
TAULEN_SERVER_ENVIRONMENT=dev

TAULEN_DATABASE_HOST=localhost
TAULEN_DATABASE_PORT=5432
TAULEN_DATABASE_USER=taulen
TAULEN_DATABASE_PASSWORD=taulen_dev_password
TAULEN_DATABASE_DBNAME=taulen_db
TAULEN_DATABASE_SSLMODE=disable

TAULEN_MONGODB_HOST=localhost
TAULEN_MONGODB_PORT=27017
TAULEN_MONGODB_DATABASE=taulen_mongo
TAULEN_MONGODB_USERNAME=
TAULEN_MONGODB_PASSWORD=

TAULEN_JWT_SECRET=change-me-in-production
TAULEN_JWT_ACCESS_TOKEN_EXPIRY=15m
TAULEN_JWT_REFRESH_TOKEN_EXPIRY=7d

TAULEN_CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Hot Reload:**
- Backend: Use Air or similar tool for hot reload during development
- Frontend: Next.js built-in hot reload
- Database: Schema changes require manual migration or schema re-application

### Staging Environment
- **Backend**: Containerized (Docker) on Kubernetes or Docker Swarm
- **Frontend**: Containerized (Docker) on Kubernetes or Docker Swarm
- **PostgreSQL**: Managed service (AWS RDS, GCP Cloud SQL, or Azure Database)
- **MongoDB**: Managed service (MongoDB Atlas, AWS DocumentDB, or containerized)
- **Redis**: Managed service or containerized (for caching)
- Automated deployments via CI/CD
- Integration testing environment
- Performance testing setup

### Production Environment

**Service Topology:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Production Infrastructure                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Load Balancer / API Gateway                         │  │
│  │  - Routes traffic to backend instances               │  │
│  │  - SSL termination                                   │  │
│  └───────────────┬──────────────────────────────────────┘  │
│                  │                                          │
│  ┌───────────────┴──────────────────────────────────────┐  │
│  │  Backend Services (Containerized)                   │  │
│  │  - Multiple instances (auto-scaling)                │  │
│  │  - Kubernetes pods or Docker containers             │  │
│  │  - Health checks and auto-restart                   │  │
│  └───────────────┬──────────────────────────────────────┘  │
│                  │                                          │
│  ┌───────────────┴──────────────────────────────────────┐  │
│  │  Frontend (Containerized / CDN)                      │  │
│  │  - Next.js static export or SSR                      │  │
│  │  - CDN for static assets                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │  PostgreSQL          │  │  MongoDB             │       │
│  │  (Managed Service)   │  │  (Managed Service)   │       │
│  │  - AWS RDS / GCP SQL  │  │  - MongoDB Atlas     │       │
│  │  - Multi-AZ           │  │  - Replica Set       │       │
│  │  - Automated backups  │  │  - Automated backups  │       │
│  └──────────────────────┘  └──────────────────────┘       │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │  Redis (Cache)       │  │  Object Storage      │       │
│  │  - Managed service    │  │  - AWS S3 / GCS     │       │
│  │  - High availability  │  │  - Document storage  │       │
│  └──────────────────────┘  └──────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**Production Requirements:**
- High availability setup (multi-AZ)
- Auto-scaling (horizontal pod autoscaling)
- Multi-region deployment (optional, for global reach)
- Disaster recovery plan
- Automated backup and restore procedures
- Monitoring and alerting
- SSL/TLS encryption
- Network security (VPC, security groups)

### Monitoring & Observability
- Application performance monitoring (APM)
- Error tracking (Sentry)
- Log aggregation and analysis
- Metrics dashboards
- Alerting system
- Uptime monitoring

---

## 11. Success Metrics

### Technical Metrics
- API response time < 200ms (p95)
- Application uptime > 99.9%
- Error rate < 0.1%
- Page load time < 2 seconds

### Business Metrics
- Application completion rate
- Time to close
- Loan officer productivity
- Customer satisfaction (NPS)
- Application volume
- Conversion rate

---

## 12. Risk Mitigation

### Technical Risks
- **Scalability**: Design for growth from day one
- **Data Security**: Implement security best practices
- **Third-party Dependencies**: Have fallback options
- **Performance**: Regular performance testing

### Compliance Risks
- **Regulatory Changes**: Stay updated with regulations
- **Audit Requirements**: Comprehensive audit logging
- **Data Privacy**: GDPR/CCPA compliance

### Business Risks
- **Market Competition**: Focus on user experience
- **Customer Adoption**: User research and testing
- **Integration Challenges**: Early integration testing

---

## 13. Next Steps

1. **Review and Approve Plan**: Stakeholder review of this plan
2. **Set Up Development Environment**: Initialize repositories, CI/CD
3. **Create Detailed Technical Specifications**: For each module
4. **Assemble Development Team**: Backend, frontend, DevOps, QA
5. **Begin Phase 1**: Start with foundation work
6. **Regular Reviews**: Weekly sprint reviews and planning

---

## 14. Project Structure

### Recommended Repository Structure (Following tauad/backend pattern)
```
taulen/
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go          # Application entry point
│   ├── api/
│   │   └── routes.go            # Route setup and configuration
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go        # Configuration management (Viper)
│   │   ├── database/
│   │   │   ├── connection.go   # Database connection setup
│   │   │   └── migrations/      # Database migration files
│   │   ├── db/                  # sqlc generated code (DO NOT EDIT)
│   │   │   ├── models.go
│   │   │   └── query.sql.go
│   │   ├── sql/
│   │   │   ├── schema.sql       # Database schema
│   │   │   └── queries/         # SQL query files for sqlc
│   │   │       ├── applicants.sql
│   │   │       ├── applications.sql
│   │   │       ├── employment.sql
│   │   │       └── ...
│   │   ├── handlers/            # HTTP handlers (Gin)
│   │   │   ├── auth.go
│   │   │   ├── urla.go
│   │   │   └── ...
│   │   ├── services/            # Business logic layer
│   │   │   ├── auth_service.go
│   │   │   ├── urla_service.go
│   │   │   └── ...
│   │   ├── repositories/        # Data access layer
│   │   │   ├── user_repository.go
│   │   │   ├── application_repository.go
│   │   │   └── ...
│   │   ├── middleware/          # HTTP middleware
│   │   │   ├── auth.go
│   │   │   ├── cors.go
│   │   │   └── logger.go
│   │   └── utils/               # Utility functions
│   │       ├── jwt.go
│   │       ├── password.go
│   │       └── validator.go
│   ├── pkg/                     # Shared packages (if needed)
│   ├── scripts/                 # Utility scripts
│   │   ├── setup-db.sh
│   │   └── migrate-schema.sql
│   ├── storage/                 # File storage (uploads, etc.)
│   ├── go.mod
│   ├── go.sum
│   ├── sqlc.yaml                # sqlc configuration
│   ├── Makefile                 # Build and development commands
│   └── Dockerfile
├── frontend/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utilities and helpers
│   ├── types/            # TypeScript types
│   └── public/           # Static assets
├── mobile/               # React Native app
├── shared/               # Shared code between web and mobile
├── infrastructure/       # Infrastructure as code
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

---

This plan provides a comprehensive roadmap for building the Taulen mortgage origination platform. The phased approach allows for iterative development and early value delivery while building toward a complete, production-ready system.
