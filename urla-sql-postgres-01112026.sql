/*
  Revised Fannie Mae Desktop Underwriter (DU) v1.9.1 / URLA 2019 PostgreSQL Schema
  Centralized Borrower Design – Aligned with DU Spec v1.9.1 and MISMO v3.4

  Key Changes from Previous Draft:
  - Addresses removed from borrower → fully handled in residence table with DU residency types
  - Added alternate names, unmarried addendum, dependents ages, enhanced contact info
  - Employment: added employer address/phone, position, years in line, ownership, family member flag
  - Employment income: separate breakdown table (base, overtime, bonus, etc.) for accuracy
  - Other income: expanded enum to full DU-supported list
  - Assets: added account number, institution name, expanded types
  - Liabilities split: liability (debts/credit) vs monthly_expense (alimony, child support, job expenses)
  - Declarations: expanded to cover most Section 5 questions
  - Added loan table for loan purpose, amount, term, property details, title manner, etc.
  - Subject property: expanded with property type, manufactured details, etc.
  - Deal: added application type (individual/joint)
  - All enums/constraints aligned with DU Enumerations sheet where practical
  - Indexes added on FKs and common query fields
*/

-- ==========================================
-- 1. CORE TRANSACTION & PARTIES
-- ==========================================
-- Internal business individuals (LOs, Underwriters)
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    email_address VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- For authentication
    first_name VARCHAR(35),
    last_name VARCHAR(35),
    phone VARCHAR(20),
    user_role VARCHAR(30), -- e.g., 'LoanOfficer', 'Processor', 'Underwriter', 'Admin'
    user_type VARCHAR(50) NOT NULL DEFAULT 'employee',
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
    mfa_enabled BOOLEAN DEFAULT FALSE,
    nmlsr_identifier VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deal (
    id SERIAL PRIMARY KEY,
    loan_number VARCHAR(30),
    universal_loan_identifier VARCHAR(50),  -- New: ULI
    agency_case_identifier VARCHAR(50),
    application_type VARCHAR(20) NOT NULL  -- Individual vs Joint credit
        CONSTRAINT chk_application_type CHECK (application_type IN ('IndividualCredit', 'JointCredit')),
    total_borrowers INTEGER,
    mismo_reference_model_identifier VARCHAR(30) DEFAULT '3.4.032420160128',
    about_version_identifier VARCHAR(20) DEFAULT 'DU Spec 1.9.1',
    application_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deal_loan_number ON deal(loan_number);
CREATE INDEX idx_deal_universal_loan_identifier ON deal(universal_loan_identifier);

-- External entities (lenders, counseling agencies, etc.)
CREATE TABLE party (
    id SERIAL PRIMARY KEY,
    party_role_type VARCHAR(50) NOT NULL
        CONSTRAINT chk_party_role CHECK (party_role_type IN (
            'LoanOriginationCompany', 'NotePayTo', 'SubmittingParty', 'HousingCounselingAgency'
        )),
    full_legal_name VARCHAR(150),
    taxpayer_identifier_value VARCHAR(15)  -- EIN
);

-- ==========================================
-- 2. BORROWER & PERSONAL INFO (Section 1a)
-- ==========================================

CREATE TABLE borrower (
    id SERIAL PRIMARY KEY,
    
    -- Authentication (for applicant signup/login)
    email_address VARCHAR(80) UNIQUE,  -- Email for authentication
    password_hash VARCHAR(255),  -- Password hash for authentication
    
    -- Name
    first_name VARCHAR(35) NOT NULL,
    middle_name VARCHAR(35),
    last_name VARCHAR(35) NOT NULL,
    suffix VARCHAR(10),
    
    -- ID & Demographics
    taxpayer_identifier_type VARCHAR(50)
        CONSTRAINT chk_taxpayer_type CHECK (taxpayer_identifier_type IN (
            'SocialSecurityNumber', 'IndividualTaxpayerIdentificationNumber'
        )),
    taxpayer_identifier_value VARCHAR(15),  -- SSN/ITIN
    birth_date DATE,
    
    citizenship_residency_type VARCHAR(50)
        CONSTRAINT chk_citizenship CHECK (citizenship_residency_type IN (
            'USCitizen', 'PermanentResidentAlien', 'NonPermanentResidentAlien'
        )),
    
    marital_status VARCHAR(20)
        CONSTRAINT chk_marital_status CHECK (marital_status IN ('Married', 'Separated', 'Unmarried')),
    
    -- Unmarried Addendum (UA fields)
    domestic_relationship_indicator BOOLEAN,
    domestic_relationship_type VARCHAR(50)
        CONSTRAINT chk_domestic_rel_type CHECK (domestic_relationship_type IN (
            'CivilUnion', 'DomesticPartnership', 'RegisteredReciprocalBeneficiaryRelationship', 'Other'
        )),
    domestic_relationship_type_other_description VARCHAR(80),
    domestic_relationship_state_code CHAR(2),
    
    -- Dependents
    dependent_count INTEGER,
    dependent_ages TEXT,  -- Comma-separated ages (e.g., '5,8,12')
    
    -- Contact
    home_phone VARCHAR(15),
    mobile_phone VARCHAR(15),
    work_phone VARCHAR(15),
    work_phone_extension VARCHAR(10)
);

CREATE INDEX idx_borrower_email ON borrower(email_address) WHERE email_address IS NOT NULL;

-- Alternate names (aka/maiden names)
CREATE TABLE borrower_alternate_name (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    first_name VARCHAR(35),
    middle_name VARCHAR(35),
    last_name VARCHAR(35),
    suffix VARCHAR(10)
);

-- Addresses / Residences (Current, Former, Mailing)
CREATE TABLE residence (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    residency_type VARCHAR(50) NOT NULL
        CONSTRAINT chk_residency_type CHECK (residency_type IN (
            'BorrowerCurrentResidence', 'BorrowerFormerResidence', 'BorrowerMailingAddress'
        )),
    residency_basis_type VARCHAR(30)
        CONSTRAINT chk_residency_basis CHECK (residency_basis_type IN ('Own', 'Rent', 'LivingRentFree')),
    
    address_line_text VARCHAR(100),
    city_name VARCHAR(35),
    state_code CHAR(2),
    postal_code VARCHAR(10),
    country_code CHAR(2) DEFAULT 'US',
    unit_number VARCHAR(20),
    
    duration_years INTEGER,
    duration_months INTEGER,
    monthly_rent_amount NUMERIC(12,2)
);

CREATE INDEX idx_residence_borrower_id ON residence(borrower_id);

-- ==========================================
-- 3. EMPLOYMENT & INCOME (Sections 1b–1e)
-- ==========================================

CREATE TABLE employment (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    employment_status VARCHAR(20) NOT NULL  -- Current vs Previous
        CONSTRAINT chk_emp_status CHECK (employment_status IN ('Current', 'Previous')),
    
    employer_name VARCHAR(150),
    employer_phone VARCHAR(15),
    
    employer_address_line_text VARCHAR(100),
    employer_city VARCHAR(35),
    employer_state_code CHAR(2),
    employer_postal_code VARCHAR(10),
    
    position_title VARCHAR(100),
    start_date DATE,
    end_date DATE,
    years_in_line_of_work_years INTEGER,
    years_in_line_of_work_months INTEGER,
    
    self_employed_indicator BOOLEAN DEFAULT FALSE,
    ownership_share_percentage NUMERIC(5,2),  -- NULL if <25%
    employed_by_family_or_party_indicator BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_employment_borrower_id ON employment(borrower_id);

-- Income breakdown per employment (base, overtime, etc.)
CREATE TABLE employment_income (
    id SERIAL PRIMARY KEY,
    employment_id INTEGER NOT NULL REFERENCES employment(id) ON DELETE CASCADE,
    income_type VARCHAR(50) NOT NULL
        CONSTRAINT chk_emp_income_type CHECK (income_type IN (
            'Base', 'Overtime', 'Bonus', 'Commission', 'MilitaryEntitlements', 'Other'
        )),
    monthly_amount NUMERIC(12,2) NOT NULL
);

-- Other income sources (not tied to employment)
CREATE TABLE other_income (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    income_source_type VARCHAR(50) NOT NULL
        CONSTRAINT chk_other_income_type CHECK (income_source_type IN (
            'Alimony', 'AutomobileAllowance', 'BoarderIncome', 'CapitalGains',
            'ChildSupport', 'Disability', 'FosterCare', 'HousingOrParsonage',
            'InterestAndDividends', 'MortgageCreditCertificate', 'MortgageDifferentialPayments',
            'NotesReceivable', 'PublicAssistance', 'Retirement', 'RoyaltyPayments',
            'SeparateMaintenance', 'SocialSecurity', 'Trust', 'UnemploymentBenefits',
            'VACompensation', 'Other'
        )),
    other_description VARCHAR(100),
    monthly_amount NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_other_income_borrower_id ON other_income(borrower_id);

-- ==========================================
-- 4. ASSETS & LIABILITIES (Section 2)
-- ==========================================

CREATE TABLE asset (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL
        CONSTRAINT chk_asset_type CHECK (asset_type IN (
            'CheckingAccount', 'SavingsAccount', 'MoneyMarket', 'CertificateOfDeposit',
            'MutualFund', 'Stocks', 'StockOptions', 'Bonds', 'RetirementFund',
            'BridgeLoanProceeds', 'IndividualDevelopmentAccount', 'TrustAccount',
            'CashValueOfLifeInsurance', 'GiftOfCash', 'GiftOfEquity', 'Grant',
            'ProceedsFromRealEstateSale', 'ProceedsFromNonRealEstateSale',
            'SecuredBorrowedFunds', 'UnsecuredBorrowedFunds', 'Other'
        )),
    financial_institution_name VARCHAR(150),
    account_number VARCHAR(50),
    cash_or_market_value NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_asset_borrower_id ON asset(borrower_id);

-- Real Estate Owned (REO)
CREATE TABLE owned_property (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    property_usage_type VARCHAR(30)
        CONSTRAINT chk_reo_usage CHECK (property_usage_type IN ('PrimaryResidence', 'SecondHome', 'Investment')),
    property_status VARCHAR(20)
        CONSTRAINT chk_reo_status CHECK (property_status IN ('Retained', 'Sold', 'PendingSale')),
    
    address_line_text VARCHAR(100),
    city_name VARCHAR(35),
    state_code CHAR(2),
    postal_code VARCHAR(10),
    
    estimated_market_value NUMERIC(12,2),
    unpaid_balance NUMERIC(12,2),
    monthly_payment NUMERIC(12,2),
    gross_monthly_rental_income NUMERIC(12,2),
    net_monthly_rental_income NUMERIC(12,2)
);

CREATE INDEX idx_owned_property_borrower_id ON owned_property(borrower_id);

-- Credit liabilities / debts (Section 2c)
CREATE TABLE liability (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    owned_property_id INTEGER REFERENCES owned_property(id),  -- If mortgage
    liability_type VARCHAR(50) NOT NULL
        CONSTRAINT chk_liability_type CHECK (liability_type IN (
            'Revolving', 'Installment', 'MortgageLoan', 'HELOC',
            'Open30DayChargeAccount', 'LeasePayment', 'Other'
        )),
    account_company_name VARCHAR(150),
    account_number VARCHAR(50),
    unpaid_balance NUMERIC(12,2),
    monthly_payment NUMERIC(12,2),
    to_be_paid_off_before_closing BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_liability_borrower_id ON liability(borrower_id);

-- Other monthly expenses (alimony, child support, job-related – Section 2d)
CREATE TABLE monthly_expense (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    expense_type VARCHAR(50) NOT NULL
        CONSTRAINT chk_expense_type CHECK (expense_type IN (
            'Alimony', 'ChildSupport', 'SeparateMaintenance',
            'JobRelatedExpenses', 'Other'
        )),
    other_description VARCHAR(100),
    monthly_amount NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_monthly_expense_borrower_id ON monthly_expense(borrower_id);

-- ==========================================
-- 5. SUBJECT PROPERTY & LOAN DETAILS (Sections 3–4)
-- ==========================================

CREATE TABLE loan (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER UNIQUE NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
    loan_purpose_type VARCHAR(30)
        CONSTRAINT chk_loan_purpose CHECK (loan_purpose_type IN ('Purchase', 'Refinance', 'Construction', 'Other')),
    loan_amount_requested NUMERIC(12,2),
    loan_term_months INTEGER,
    interest_rate_percentage NUMERIC(6,3),
    property_type VARCHAR(50)  -- SingleFamily, Condo, PUD, ManufacturedHome, etc.
        CONSTRAINT chk_property_type CHECK (property_type IN (
            'SingleFamily', 'Condo', 'Cooperative', 'PUD', 'ManufacturedHome', 'Multifamily'
        )),
    manufactured_home_width_type VARCHAR(20)
        CONSTRAINT chk_manufactured_width CHECK (manufactured_home_width_type IN ('SingleWide', 'MultiWide')),
    title_manner_type VARCHAR(50)  -- Sole, Joint, etc.
);

CREATE TABLE subject_property (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER UNIQUE NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
    address_line_text VARCHAR(100),
    city_name VARCHAR(35),
    state_code CHAR(2),
    postal_code VARCHAR(10),
    unit_number VARCHAR(20),
    property_usage_type VARCHAR(30)
        CONSTRAINT chk_prop_usage CHECK (property_usage_type IN ('PrimaryResidence', 'SecondHome', 'Investment')),
    estimated_value NUMERIC(12,2),
    projected_monthly_rental_income NUMERIC(12,2)
);

-- ==========================================
-- 6. DECLARATIONS & DEMOGRAPHICS (Sections 5 & Demographic Addendum)
-- ==========================================

CREATE TABLE declaration (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER UNIQUE NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    intent_to_occupy_as_primary BOOLEAN,
    homeowner_past_three_years BOOLEAN,
    outstanding_judgments BOOLEAN,
    delinquent_on_federal_debt BOOLEAN,
    party_to_lawsuit BOOLEAN,
    bankruptcy_declared BOOLEAN,
    foreclosure BOOLEAN,
    property_foreclosed BOOLEAN,
    borrowed_down_payment BOOLEAN,
    co_maker_or_endorser BOOLEAN,
    us_citizen BOOLEAN,
    permanent_resident_alien BOOLEAN,
    title_will_be_held_as_type VARCHAR(50)  -- Add enum if needed
);

-- Demographics – HMDA (multi-select allowed for race/ethnicity)
CREATE TABLE demographic (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER UNIQUE NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    hmda_ethnicity_types TEXT[],  -- e.g., {'HispanicOrLatino', 'NotHispanicOrLatino'}
    hmda_gender_type VARCHAR(50)
        CONSTRAINT chk_gender CHECK (hmda_gender_type IN (
            'Male', 'Female', 'InformationNotProvidedUnknown'
        )),
    hmda_race_types TEXT[]  -- e.g., {'White', 'Asian', 'BlackOrAfricanAmerican'}
);