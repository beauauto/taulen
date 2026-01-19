-- Migration: Convert all primary keys from SERIAL/INTEGER to UUID v7
-- This migration drops all data and recreates the schema with UUID primary keys
-- WARNING: This will delete all existing data

-- Enable UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_uuidv7";

-- Create UUID v7 function using pg_uuidv7 extension
CREATE OR REPLACE FUNCTION generate_uuid_v7()
RETURNS UUID AS $$
BEGIN
    -- Use uuid_generate_v7() from pg_uuidv7 extension
    RETURN uuid_generate_v7();
END;
$$ LANGUAGE plpgsql;

-- Drop all foreign key constraints first
ALTER TABLE IF EXISTS borrower_progress DROP CONSTRAINT IF EXISTS borrower_progress_borrower_id_fkey;
ALTER TABLE IF EXISTS borrower_progress DROP CONSTRAINT IF EXISTS borrower_progress_deal_id_fkey;
ALTER TABLE IF EXISTS borrower_progress DROP CONSTRAINT IF EXISTS borrower_progress_deal_progress_id_fkey;
ALTER TABLE IF EXISTS deal_progress DROP CONSTRAINT IF EXISTS deal_progress_deal_id_fkey;
ALTER TABLE IF EXISTS demographic DROP CONSTRAINT IF EXISTS demographic_borrower_id_fkey;
ALTER TABLE IF EXISTS declaration DROP CONSTRAINT IF EXISTS declaration_borrower_id_fkey;
ALTER TABLE IF EXISTS subject_property DROP CONSTRAINT IF EXISTS subject_property_deal_id_fkey;
ALTER TABLE IF EXISTS loan DROP CONSTRAINT IF EXISTS loan_deal_id_fkey;
ALTER TABLE IF EXISTS monthly_expense DROP CONSTRAINT IF EXISTS monthly_expense_borrower_id_fkey;
ALTER TABLE IF EXISTS liability DROP CONSTRAINT IF EXISTS liability_borrower_id_fkey;
ALTER TABLE IF EXISTS liability DROP CONSTRAINT IF EXISTS liability_owned_property_id_fkey;
ALTER TABLE IF EXISTS owned_property DROP CONSTRAINT IF EXISTS owned_property_borrower_id_fkey;
ALTER TABLE IF EXISTS asset DROP CONSTRAINT IF EXISTS asset_borrower_id_fkey;
ALTER TABLE IF EXISTS other_income DROP CONSTRAINT IF EXISTS other_income_borrower_id_fkey;
ALTER TABLE IF EXISTS employment_income DROP CONSTRAINT IF EXISTS employment_income_employment_id_fkey;
ALTER TABLE IF EXISTS employment DROP CONSTRAINT IF EXISTS employment_borrower_id_fkey;
ALTER TABLE IF EXISTS residence DROP CONSTRAINT IF EXISTS residence_borrower_id_fkey;
ALTER TABLE IF EXISTS borrower_alternate_name DROP CONSTRAINT IF EXISTS borrower_alternate_name_borrower_id_fkey;

-- Drop all tables (this will delete all data)
DROP TABLE IF EXISTS borrower_progress CASCADE;
DROP TABLE IF EXISTS deal_progress CASCADE;
DROP TABLE IF EXISTS demographic CASCADE;
DROP TABLE IF EXISTS declaration CASCADE;
DROP TABLE IF EXISTS subject_property CASCADE;
DROP TABLE IF EXISTS loan CASCADE;
DROP TABLE IF EXISTS monthly_expense CASCADE;
DROP TABLE IF EXISTS liability CASCADE;
DROP TABLE IF EXISTS owned_property CASCADE;
DROP TABLE IF EXISTS asset CASCADE;
DROP TABLE IF EXISTS other_income CASCADE;
DROP TABLE IF EXISTS employment_income CASCADE;
DROP TABLE IF EXISTS employment CASCADE;
DROP TABLE IF EXISTS residence CASCADE;
DROP TABLE IF EXISTS borrower_alternate_name CASCADE;
DROP TABLE IF EXISTS borrower CASCADE;
DROP TABLE IF EXISTS deal CASCADE;
DROP TABLE IF EXISTS party CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Drop the enum type if it exists
DROP TYPE IF EXISTS urla_section_enum CASCADE;

-- Recreate user table with UUID primary key
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    email_address VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(35),
    last_name VARCHAR(35),
    phone VARCHAR(20),
    user_role VARCHAR(30),
    user_type VARCHAR(50) NOT NULL DEFAULT 'employee',
    status VARCHAR(50) DEFAULT 'active',
    nmlsr_identifier VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    last_password_change_at TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    mfa_backup_codes TEXT,
    mfa_setup_at TIMESTAMP WITH TIME ZONE,
    mfa_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email_verification_token ON "user"(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX idx_user_password_reset_token ON "user"(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- Recreate party table with UUID primary key
CREATE TABLE party (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    party_role_type VARCHAR(50) NOT NULL
        CONSTRAINT chk_party_role CHECK (party_role_type IN (
            'LoanOriginationCompany', 'NotePayTo', 'SubmittingParty', 'HousingCounselingAgency'
        )),
    full_legal_name VARCHAR(150),
    taxpayer_identifier_value VARCHAR(15)
);

-- Recreate borrower table with UUID primary key (must be created before deal)
CREATE TABLE borrower (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    email_address VARCHAR(80) UNIQUE,
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    last_password_change_at TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    mfa_backup_codes TEXT,
    mfa_setup_at TIMESTAMP WITH TIME ZONE,
    mfa_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    first_name VARCHAR(35) NOT NULL,
    middle_name VARCHAR(35),
    last_name VARCHAR(35) NOT NULL,
    suffix VARCHAR(10),
    taxpayer_identifier_type VARCHAR(50)
        CONSTRAINT chk_taxpayer_type CHECK (taxpayer_identifier_type IN (
            'SocialSecurityNumber', 'IndividualTaxpayerIdentificationNumber'
        )),
    taxpayer_identifier_value VARCHAR(15),
    birth_date DATE,
    citizenship_residency_type VARCHAR(50)
        CONSTRAINT chk_citizenship CHECK (citizenship_residency_type IN (
            'USCitizen', 'PermanentResidentAlien', 'NonPermanentResidentAlien'
        )),
    marital_status VARCHAR(20)
        CONSTRAINT chk_marital_status CHECK (marital_status IS NULL OR marital_status IN ('Married', 'Separated', 'Unmarried')),
    domestic_relationship_indicator BOOLEAN,
    domestic_relationship_type VARCHAR(50)
        CONSTRAINT chk_domestic_rel_type CHECK (domestic_relationship_type IN (
            'CivilUnion', 'DomesticPartnership', 'RegisteredReciprocalBeneficiaryRelationship', 'Other'
        )),
    domestic_relationship_type_other_description VARCHAR(80),
    domestic_relationship_state_code CHAR(2),
    dependent_count INTEGER,
    dependent_ages TEXT,
    home_phone VARCHAR(15),
    mobile_phone VARCHAR(15),
    work_phone VARCHAR(15),
    work_phone_extension VARCHAR(10),
    military_service_status BOOLEAN DEFAULT FALSE,
    consent_to_credit_check BOOLEAN DEFAULT FALSE,
    consent_to_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_borrower_email ON borrower(email_address) WHERE email_address IS NOT NULL;
CREATE INDEX idx_borrower_email_verification_token ON borrower(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX idx_borrower_password_reset_token ON borrower(password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX idx_borrower_military_service ON borrower(military_service_status);

-- Recreate deal table with UUID primary key (after borrower is created)
CREATE TABLE deal (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    loan_number VARCHAR(30),
    universal_loan_identifier VARCHAR(50),
    agency_case_identifier VARCHAR(50),
    application_type VARCHAR(20) NOT NULL
        CONSTRAINT chk_application_type CHECK (application_type IN ('IndividualCredit', 'JointCredit')),
    total_borrowers INTEGER,
    mismo_reference_model_identifier VARCHAR(30) DEFAULT '3.4.032420160128',
    about_version_identifier VARCHAR(20) DEFAULT 'DU Spec 1.9.1',
    application_date DATE DEFAULT CURRENT_DATE,
    primary_borrower_id UUID REFERENCES borrower(id) ON DELETE SET NULL,
    current_form_step VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deal_loan_number ON deal(loan_number);
CREATE INDEX idx_deal_universal_loan_identifier ON deal(universal_loan_identifier);
CREATE INDEX idx_deal_primary_borrower_id ON deal(primary_borrower_id);

-- Recreate borrower_alternate_name table
CREATE TABLE borrower_alternate_name (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    borrower_id UUID NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    first_name VARCHAR(35),
    middle_name VARCHAR(35),
    last_name VARCHAR(35),
    suffix VARCHAR(10)
);

-- Recreate residence table
CREATE TABLE residence (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    borrower_id UUID NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
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

-- Recreate employment table
CREATE TABLE employment (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    borrower_id UUID NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    employment_status VARCHAR(20) NOT NULL
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
    ownership_share_percentage NUMERIC(5,2),
    employed_by_family_or_party_indicator BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_employment_borrower_id ON employment(borrower_id);

-- Recreate employment_income table
CREATE TABLE employment_income (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    employment_id UUID NOT NULL REFERENCES employment(id) ON DELETE CASCADE,
    income_type VARCHAR(50) NOT NULL
        CONSTRAINT chk_emp_income_type CHECK (income_type IN (
            'Base', 'Overtime', 'Bonus', 'Commission', 'MilitaryEntitlements', 'Other'
        )),
    monthly_amount NUMERIC(12,2) NOT NULL
);

-- Recreate other_income table
CREATE TABLE other_income (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    borrower_id UUID NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
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

-- Recreate asset table
CREATE TABLE asset (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    borrower_id UUID NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
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

-- Recreate owned_property table
CREATE TABLE owned_property (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    borrower_id UUID NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
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

-- Recreate liability table
CREATE TABLE liability (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    borrower_id UUID NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    owned_property_id UUID REFERENCES owned_property(id),
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

-- Recreate monthly_expense table
CREATE TABLE monthly_expense (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    borrower_id UUID NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    expense_type VARCHAR(50) NOT NULL
        CONSTRAINT chk_expense_type CHECK (expense_type IN (
            'Alimony', 'ChildSupport', 'SeparateMaintenance',
            'JobRelatedExpenses', 'Other'
        )),
    other_description VARCHAR(100),
    monthly_amount NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_monthly_expense_borrower_id ON monthly_expense(borrower_id);

-- Recreate loan table
CREATE TABLE loan (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    deal_id UUID UNIQUE NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
    loan_purpose_type VARCHAR(30)
        CONSTRAINT chk_loan_purpose CHECK (loan_purpose_type IN ('Purchase', 'Refinance', 'Construction', 'Other')),
    loan_amount_requested NUMERIC(12,2),
    loan_term_months INTEGER,
    interest_rate_percentage NUMERIC(6,3),
    property_type VARCHAR(50)
        CONSTRAINT chk_property_type CHECK (property_type IN (
            'SingleFamily', 'Condo', 'Cooperative', 'PUD', 'ManufacturedHome', 'Multifamily'
        )),
    manufactured_home_width_type VARCHAR(20)
        CONSTRAINT chk_manufactured_width CHECK (manufactured_home_width_type IN ('SingleWide', 'MultiWide')),
    title_manner_type VARCHAR(50),
    purchase_price NUMERIC(12,2),
    down_payment NUMERIC(12,2),
    property_address VARCHAR(255),
    outstanding_balance NUMERIC(12,2)
);

-- Recreate subject_property table
CREATE TABLE subject_property (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    deal_id UUID UNIQUE NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
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

-- Recreate declaration table
CREATE TABLE declaration (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    borrower_id UUID UNIQUE NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
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
    title_will_be_held_as_type VARCHAR(50)
);

-- Recreate demographic table
CREATE TABLE demographic (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    borrower_id UUID UNIQUE NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    hmda_ethnicity_types TEXT[],
    hmda_gender_type VARCHAR(50)
        CONSTRAINT chk_gender CHECK (hmda_gender_type IN (
            'Male', 'Female', 'InformationNotProvidedUnknown'
        )),
    hmda_race_types TEXT[]
);

-- Recreate urla_section_enum
CREATE TYPE urla_section_enum AS ENUM (
    'Section1a_PersonalInfo',
    'Section1b_CurrentEmployment',
    'Section1c_AdditionalEmployment',
    'Section1d_PreviousEmployment',
    'Section1e_OtherIncome',
    'Section2a_Assets',
    'Section2b_OtherAssetsCredits',
    'Section2c_Liabilities',
    'Section2d_Expenses',
    'Section3_RealEstateOwned',
    'Section4_LoanPropertyInfo',
    'Section5_Declarations',
    'Section6_Acknowledgments',
    'Section7_MilitaryService',
    'Section8_Demographics',
    'Section9_OriginatorInfo',
    'Lender_L1_PropertyLoanInfo',
    'Lender_L2_TitleInfo',
    'Lender_L3_MortgageLoanInfo',
    'Lender_L4_Qualification',
    'ContinuationSheet',
    'UnmarriedAddendum'
);

-- Recreate deal_progress table
CREATE TABLE deal_progress (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    deal_id UUID UNIQUE NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
    section_1a_complete BOOLEAN DEFAULT FALSE,
    section_1b_complete BOOLEAN DEFAULT FALSE,
    section_1c_complete BOOLEAN DEFAULT FALSE,
    section_1d_complete BOOLEAN DEFAULT FALSE,
    section_1e_complete BOOLEAN DEFAULT FALSE,
    section_2a_complete BOOLEAN DEFAULT FALSE,
    section_2b_complete BOOLEAN DEFAULT FALSE,
    section_2c_complete BOOLEAN DEFAULT FALSE,
    section_2d_complete BOOLEAN DEFAULT FALSE,
    section_3_complete BOOLEAN DEFAULT FALSE,
    section_4_complete BOOLEAN DEFAULT FALSE,
    section_5_complete BOOLEAN DEFAULT FALSE,
    section_6_complete BOOLEAN DEFAULT FALSE,
    section_7_complete BOOLEAN DEFAULT FALSE,
    section_8_complete BOOLEAN DEFAULT FALSE,
    section_9_complete BOOLEAN DEFAULT FALSE,
    lender_l1_complete BOOLEAN DEFAULT FALSE,
    lender_l2_complete BOOLEAN DEFAULT FALSE,
    lender_l3_complete BOOLEAN DEFAULT FALSE,
    lender_l4_complete BOOLEAN DEFAULT FALSE,
    continuation_complete BOOLEAN DEFAULT FALSE,
    unmarried_addendum_complete BOOLEAN DEFAULT FALSE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    last_updated_section urla_section_enum,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deal_progress_deal_id ON deal_progress(deal_id);

-- Recreate trigger function for progress percentage
CREATE OR REPLACE FUNCTION update_progress_percentage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.progress_percentage = (
        (CASE WHEN NEW.section_1a_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_1b_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_1c_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_1d_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_1e_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_2a_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_2b_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_2c_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_2d_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_3_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_4_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_5_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_6_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_7_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_8_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.section_9_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.lender_l1_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.lender_l2_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.lender_l3_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.lender_l4_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.continuation_complete THEN 1 ELSE 0 END +
         CASE WHEN NEW.unmarried_addendum_complete THEN 1 ELSE 0 END)::FLOAT / 22 * 100
    );
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_progress
BEFORE UPDATE ON deal_progress
FOR EACH ROW EXECUTE FUNCTION update_progress_percentage();

-- Recreate trigger function for auto-creating deal_progress
CREATE OR REPLACE FUNCTION create_deal_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO deal_progress (deal_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_deal_progress
AFTER INSERT ON deal
FOR EACH ROW EXECUTE FUNCTION create_deal_progress();

-- Recreate borrower_progress table
CREATE TABLE borrower_progress (
    id UUID PRIMARY KEY DEFAULT generate_uuid_v7(),
    borrower_id UUID NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
    deal_progress_id UUID REFERENCES deal_progress(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(borrower_id, deal_id)
);

CREATE INDEX idx_borrower_progress_borrower_id ON borrower_progress(borrower_id);
CREATE INDEX idx_borrower_progress_deal_id ON borrower_progress(deal_id);
