-- Schema for Uniform Residential Loan Application (URLA)

-- 0. Users Table (for company employees only, not for applicants/consumers)
-- Applicants are stored in the applicants table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- loan_officer, underwriter, processor, admin (NO 'borrower' role)
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_type VARCHAR(50) NOT NULL DEFAULT 'employee'
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);


-- 1. Applicants Table
CREATE TABLE applicants (
    applicant_id BIGSERIAL PRIMARY KEY, -- Unique identifier for the applicant
    loan_application_id BIGINT, -- FK to loan_applications table (can be NULL initially during signup)
    user_id UUID, -- FK to users table - the employee managing this applicant (set when employee takes over)
    email VARCHAR(255) UNIQUE, -- Email for authentication (required for signup)
    password_hash VARCHAR(255), -- Password hash for authentication (required for signup)
    is_primary_applicant BOOLEAN NOT NULL DEFAULT TRUE, -- True if primary, False if co-applicant
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20), -- Jr., Sr., III, etc.
    ssn VARCHAR(11) UNIQUE, -- Social Security Number (should be encrypted at application/storage layer)
    date_of_birth DATE, -- Can be NULL initially during signup
    years_school INT, -- Years of schooling completed
    marital_status VARCHAR(50), -- e.g., 'Single', 'Married', 'Divorced', 'Separated'
    dependents_count INT, -- Number of dependents
    dependents_ages TEXT, -- Comma-separated ages of dependents (e.g., '5,12,18')
    citizenship_status VARCHAR(50), -- e.g., 'Citizen', 'Permanent Resident', 'Other'
    alien_registration_no VARCHAR(50), -- For non-citizens
    veteran_status VARCHAR(50), -- e.g., 'Veteran', 'Non-Veteran'
    military_service_years INT,
    is_borrower_declining_info BOOLEAN NOT NULL DEFAULT FALSE, -- Declining to provide demographic info?
    ethnicity VARCHAR(100),
    ethnicity_other VARCHAR(255), -- If ethnicity is 'Other'
    race TEXT, -- Comma-separated races (e.g., 'White,Asian')
    race_other TEXT, -- If race is 'Other'
    gender VARCHAR(20),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Applicants
CREATE INDEX idx_applicants_loan_application_id ON applicants (loan_application_id);
CREATE INDEX idx_applicants_user_id ON applicants (user_id);
CREATE INDEX idx_applicants_email ON applicants (email);
CREATE UNIQUE INDEX idx_applicants_ssn ON applicants (ssn); -- Consider unique constraint for SSN if needed, or partial index for privacy


-- 2. LoanApplications Table
CREATE TABLE loan_applications (
    loan_application_id BIGSERIAL PRIMARY KEY, -- Unique ID for each loan application
    applicant_id BIGINT, -- FK to applicants table - the primary applicant/consumer
    user_id UUID, -- FK to users table - the employee managing this application
    application_date DATE NOT NULL, -- Date the application was submitted
    loan_type VARCHAR(50) NOT NULL, -- e.g., 'FHA', 'VA', 'Conventional', 'USDA'
    loan_purpose VARCHAR(50) NOT NULL, -- e.g., 'Purchase', 'Refinance', 'Construction'
    property_type VARCHAR(50), -- e.g., 'Single Family', 'Condo', '2-4 Unit'
    property_usage VARCHAR(50), -- e.g., 'Primary Residence', 'Investment', 'Second Home'
    loan_amount_requested DECIMAL(18,2) NOT NULL,
    down_payment_amount DECIMAL(18,2),
    term_years INT, -- e.g., 15, 30
    interest_rate DECIMAL(5,3), -- e.g., 4.125
    amortization_type VARCHAR(50), -- e.g., 'Fixed', 'ARM'
    subject_property_id BIGINT, -- FK to properties table (can be NULL initially if property not identified)
    lender_case_number VARCHAR(100), -- Internal lender tracking number
    mersmin VARCHAR(18), -- Mortgage Electronic Registration System MIN
    application_status VARCHAR(50) NOT NULL, -- e.g., 'Pending', 'Approved', 'Denied', 'Withdrawn'
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for LoanApplications
CREATE INDEX idx_loan_applications_application_date ON loan_applications (application_date);
CREATE INDEX idx_loan_applications_application_status ON loan_applications (application_status);
CREATE INDEX idx_loan_applications_applicant_id ON loan_applications (applicant_id);
CREATE INDEX idx_loan_applications_user_id ON loan_applications (user_id);


-- 3. Properties Table
CREATE TABLE properties (
    property_id BIGSERIAL PRIMARY KEY, -- Unique identifier for the property
    street_address VARCHAR(255) NOT NULL,
    unit_number VARCHAR(50), -- Apartment, Suite, etc.
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    county VARCHAR(100),
    number_of_units INT NOT NULL DEFAULT 1, -- For multi-unit properties
    year_built INT,
    purchase_price DECIMAL(18,2), -- If purchase loan
    estimated_value DECIMAL(18,2), -- If refinance or estimated for purchase
    legal_description TEXT,
    property_occupancy_type VARCHAR(50), -- e.g., 'Primary', 'Secondary', 'Investment'
    property_acquired_date DATE, -- For refinance
    original_cost DECIMAL(18,2), -- For refinance
    improvement_cost DECIMAL(18,2), -- For refinance
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Properties
CREATE INDEX idx_properties_zip_code ON properties (zip_code);


-- 4. Residences Table
CREATE TABLE residences (
    residence_id BIGSERIAL PRIMARY KEY, -- Unique identifier for a residence record
    applicant_id BIGINT NOT NULL, -- FK to applicants table
    street_address VARCHAR(255) NOT NULL,
    unit_number VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    is_current_residence BOOLEAN NOT NULL, -- True for current, False for previous
    start_date DATE NOT NULL, -- Date residency began
    end_date DATE, -- Date residency ended (NULL if current)
    housing_type VARCHAR(50), -- e.g., 'Own', 'Rent', 'Free & Clear', 'Live with Relatives'
    monthly_housing_payment DECIMAL(18,2),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Residences
CREATE INDEX idx_residences_applicant_id ON residences (applicant_id);
CREATE INDEX idx_residences_is_current_residence ON residences (is_current_residence);


-- 5. Employments Table
CREATE TABLE employments (
    employment_id BIGSERIAL PRIMARY KEY, -- Unique identifier for an employment record
    applicant_id BIGINT NOT NULL, -- FK to applicants table
    employer_name VARCHAR(255) NOT NULL,
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    phone_number VARCHAR(20),
    position VARCHAR(100), -- Job title
    employment_type VARCHAR(50), -- e.g., 'Salaried', 'Hourly', 'Self-Employed'
    start_date DATE NOT NULL, -- Employment start date
    end_date DATE, -- Employment end date (NULL if current)
    years_at_employer INT, -- Calculated from dates, or provided
    monthly_income DECIMAL(18,2), -- Base monthly income
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Employments
CREATE INDEX idx_employments_applicant_id ON employments (applicant_id);


-- 6. Incomes Table
CREATE TABLE incomes (
    income_id BIGSERIAL PRIMARY KEY, -- Unique identifier for an income record
    applicant_id BIGINT NOT NULL, -- FK to applicants table
    income_type VARCHAR(100) NOT NULL, -- e.g., 'Base', 'Overtime', 'Bonus', 'Commission', 'Rental', 'Other'
    monthly_amount DECIMAL(18,2) NOT NULL, -- Gross monthly income for this type
    description TEXT, -- Details for 'Other' income
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Incomes
CREATE INDEX idx_incomes_applicant_id ON incomes (applicant_id);


-- 7. Assets Table
CREATE TABLE assets (
    asset_id BIGSERIAL PRIMARY KEY, -- Unique identifier for an asset record
    loan_application_id BIGINT NOT NULL, -- FK to loan_applications table
    applicant_id BIGINT, -- Optional: If asset belongs to specific applicant
    asset_type VARCHAR(100) NOT NULL, -- e.g., 'Checking', 'Savings', 'Stocks', 'Bonds', 'Real Estate', 'Other'
    description TEXT, -- Account Name, Bank Name, Property Address
    current_value DECIMAL(18,2) NOT NULL, -- Current market value or balance
    account_last_four VARCHAR(4), -- Last four digits of account number (for security)
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Assets
CREATE INDEX idx_assets_loan_application_id ON assets (loan_application_id);
CREATE INDEX idx_assets_applicant_id ON assets (applicant_id);


-- 8. Liabilities Table
CREATE TABLE liabilities (
    liability_id BIGSERIAL PRIMARY KEY, -- Unique identifier for a liability record
    loan_application_id BIGINT NOT NULL, -- FK to loan_applications table
    applicant_id BIGINT, -- Optional: If liability belongs to specific applicant
    liability_type VARCHAR(100) NOT NULL, -- e.g., 'Credit Card', 'Student Loan', 'Auto Loan', 'Mortgage', 'Alimony', 'Child Support'
    creditor_name VARCHAR(255) NOT NULL, -- Bank or institution
    account_or_loan_number VARCHAR(100),
    monthly_payment DECIMAL(18,2) NOT NULL,
    outstanding_balance DECIMAL(18,2) NOT NULL,
    is_secured BOOLEAN, -- Is the loan secured by an asset?
    asset_securing_liability TEXT, -- If secured, description of asset
    remaining_payments INT, -- Number of remaining payments
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Liabilities
CREATE INDEX idx_liabilities_loan_application_id ON liabilities (loan_application_id);
CREATE INDEX idx_liabilities_applicant_id ON liabilities (applicant_id);


-- 9. Declarations Table
CREATE TABLE declarations (
    declaration_id BIGSERIAL PRIMARY KEY, -- Unique identifier for a declaration record
    loan_application_id BIGINT NOT NULL, -- FK to loan_applications table
    applicant_id BIGINT NOT NULL, -- FK to applicants table
    question_code VARCHAR(50) NOT NULL, -- e.g., 'Q1A' (for specific URLA questions)
    question_text TEXT NOT NULL, -- The full text of the question
    response BOOLEAN NOT NULL, -- TRUE for Yes, FALSE for No
    explanation TEXT, -- Required if response is 'Yes' for certain questions
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Declarations
CREATE INDEX idx_declarations_loan_application_id ON declarations (loan_application_id);
CREATE INDEX idx_declarations_applicant_id ON declarations (applicant_id);


-- 10. RealEstateOwned Table
CREATE TABLE real_estate_owned (
    reo_id BIGSERIAL PRIMARY KEY, -- Unique identifier for an REO record
    loan_application_id BIGINT NOT NULL, -- FK to loan_applications table
    applicant_id BIGINT NOT NULL, -- FK to applicants table
    street_address VARCHAR(255) NOT NULL,
    unit_number VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    property_type VARCHAR(50), -- e.g., 'Single Family', 'Condo', '2-4 Unit'
    current_market_value DECIMAL(18,2) NOT NULL,
    amount_of_mortgage DECIMAL(18,2), -- Outstanding balance on existing mortgage
    monthly_payment DECIMAL(18,2), -- Total monthly mortgage payment
    rental_income DECIMAL(18,2), -- If rented
    net_rental_income DECIMAL(18,2),
    property_status VARCHAR(50), -- e.g., 'Rented', 'Primary', 'Investment'
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for RealEstateOwned
CREATE INDEX idx_real_estate_owned_loan_application_id ON real_estate_owned (loan_application_id);
CREATE INDEX idx_real_estate_owned_applicant_id ON real_estate_owned (applicant_id);


-- Foreign Key Constraints (Apply these after all tables are created)
ALTER TABLE applicants
ADD CONSTRAINT fk_applicants_loan_applications
FOREIGN KEY (loan_application_id) REFERENCES loan_applications(loan_application_id);

ALTER TABLE applicants
ADD CONSTRAINT fk_applicants_users
FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE loan_applications
ADD CONSTRAINT fk_loan_applications_properties
FOREIGN KEY (subject_property_id) REFERENCES properties(property_id);

ALTER TABLE loan_applications
ADD CONSTRAINT fk_loan_applications_applicants
FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id);

ALTER TABLE loan_applications
ADD CONSTRAINT fk_loan_applications_users
FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE residences
ADD CONSTRAINT fk_residences_applicants
FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id);

ALTER TABLE employments
ADD CONSTRAINT fk_employments_applicants
FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id);

ALTER TABLE incomes
ADD CONSTRAINT fk_incomes_applicants
FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id);

ALTER TABLE assets
ADD CONSTRAINT fk_assets_loan_applications
FOREIGN KEY (loan_application_id) REFERENCES loan_applications(loan_application_id);

ALTER TABLE assets
ADD CONSTRAINT fk_assets_applicants
FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id);

ALTER TABLE liabilities
ADD CONSTRAINT fk_liabilities_loan_applications
FOREIGN KEY (loan_application_id) REFERENCES loan_applications(loan_application_id);

ALTER TABLE liabilities
ADD CONSTRAINT fk_liabilities_applicants
FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id);

ALTER TABLE declarations
ADD CONSTRAINT fk_declarations_loan_applications
FOREIGN KEY (loan_application_id) REFERENCES loan_applications(loan_application_id);

ALTER TABLE declarations
ADD CONSTRAINT fk_declarations_applicants
FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id);

ALTER TABLE real_estate_owned
ADD CONSTRAINT fk_real_estate_owned_loan_applications
FOREIGN KEY (loan_application_id) REFERENCES loan_applications(loan_application_id);

ALTER TABLE real_estate_owned
ADD CONSTRAINT fk_real_estate_owned_applicants
FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id);
