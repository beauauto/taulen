--
-- TAULEN DATABASE SCHEMA - GOLD STANDARD
--
-- This file represents the canonical database schema for the Taulen application.
-- It is the single source of truth for the database structure.
--
-- IMPORTANT: This file MUST be updated whenever the database schema changes.
-- To update this file:
--   1. Make your schema changes (via migrations or direct SQL)
--   2. Extract the new schema: docker exec taulen-postgres pg_dump -U taulen -d taulen_db --schema-only --no-owner --no-acl > database-schema.sql
--   3. Review the changes
--   4. Commit and push to GitHub
--
-- Last Updated: 2026-01-21 09:52:04
-- Database Version: PostgreSQL 15
--
--
-- PostgreSQL database dump
--

\restrict Dasav5LUdGdRym6UnQt6WSHNwjS4FoyoMZRejnnVbP79mHKQjiR8o0y0uoq6nWF

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pg_uuidv7; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_uuidv7 WITH SCHEMA public;


--
-- Name: EXTENSION pg_uuidv7; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_uuidv7 IS 'pg_uuidv7: create UUIDv7 values in postgres';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: deal_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.deal_status_enum AS ENUM (
    'Draft',
    'Submitted',
    'InReview',
    'Approved',
    'Denied',
    'Withdrawn'
);


--
-- Name: urla_section_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.urla_section_enum AS ENUM (
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


--
-- Name: create_deal_progress(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_deal_progress() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO deal_progress (deal_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$;


--
-- Name: generate_uuid_v7(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_uuid_v7() RETURNS uuid
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Use uuid_generate_v7() from pg_uuidv7 extension
    RETURN uuid_generate_v7();
END;
$$;


--
-- Name: update_progress_percentage(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_progress_percentage() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    borrower_id uuid NOT NULL,
    asset_type character varying(50) NOT NULL,
    financial_institution_name character varying(150),
    account_number character varying(50),
    cash_or_market_value numeric(12,2) NOT NULL,
    CONSTRAINT chk_asset_type CHECK (((asset_type)::text = ANY ((ARRAY['CheckingAccount'::character varying, 'SavingsAccount'::character varying, 'MoneyMarket'::character varying, 'CertificateOfDeposit'::character varying, 'MutualFund'::character varying, 'Stocks'::character varying, 'StockOptions'::character varying, 'Bonds'::character varying, 'RetirementFund'::character varying, 'BridgeLoanProceeds'::character varying, 'IndividualDevelopmentAccount'::character varying, 'TrustAccount'::character varying, 'CashValueOfLifeInsurance'::character varying, 'GiftOfCash'::character varying, 'GiftOfEquity'::character varying, 'Grant'::character varying, 'ProceedsFromRealEstateSale'::character varying, 'ProceedsFromNonRealEstateSale'::character varying, 'SecuredBorrowedFunds'::character varying, 'UnsecuredBorrowedFunds'::character varying, 'Other'::character varying])::text[])))
);


--
-- Name: borrower; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.borrower (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    email_address character varying(80),
    password_hash character varying(255),
    email_verified boolean DEFAULT false,
    email_verification_token character varying(255),
    email_verification_expires_at timestamp with time zone,
    password_reset_token character varying(255),
    password_reset_expires_at timestamp with time zone,
    last_password_change_at timestamp with time zone,
    mfa_enabled boolean DEFAULT false,
    mfa_secret character varying(255),
    mfa_backup_codes text,
    mfa_setup_at timestamp with time zone,
    mfa_verified_at timestamp with time zone,
    last_login_at timestamp with time zone,
    failed_login_attempts integer DEFAULT 0,
    account_locked_until timestamp with time zone,
    first_name character varying(35) NOT NULL,
    middle_name character varying(35),
    last_name character varying(35) NOT NULL,
    suffix character varying(10),
    taxpayer_identifier_type character varying(50),
    taxpayer_identifier_value character varying(15),
    birth_date date,
    citizenship_residency_type character varying(50),
    marital_status character varying(20),
    domestic_relationship_indicator boolean,
    domestic_relationship_type character varying(50),
    domestic_relationship_type_other_description character varying(80),
    domestic_relationship_state_code character(2),
    dependent_count integer,
    dependent_ages text,
    home_phone character varying(15),
    mobile_phone character varying(15),
    work_phone character varying(15),
    work_phone_extension character varying(10),
    military_service_status boolean DEFAULT false,
    consent_to_credit_check boolean DEFAULT false,
    consent_to_contact boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_citizenship CHECK (((citizenship_residency_type)::text = ANY ((ARRAY['USCitizen'::character varying, 'PermanentResidentAlien'::character varying, 'NonPermanentResidentAlien'::character varying])::text[]))),
    CONSTRAINT chk_domestic_rel_type CHECK (((domestic_relationship_type)::text = ANY ((ARRAY['CivilUnion'::character varying, 'DomesticPartnership'::character varying, 'RegisteredReciprocalBeneficiaryRelationship'::character varying, 'Other'::character varying])::text[]))),
    CONSTRAINT chk_marital_status CHECK (((marital_status IS NULL) OR ((marital_status)::text = ANY ((ARRAY['Married'::character varying, 'Separated'::character varying, 'Unmarried'::character varying])::text[])))),
    CONSTRAINT chk_taxpayer_type CHECK (((taxpayer_identifier_type)::text = ANY ((ARRAY['SocialSecurityNumber'::character varying, 'IndividualTaxpayerIdentificationNumber'::character varying])::text[])))
);


--
-- Name: borrower_alternate_name; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.borrower_alternate_name (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    borrower_id uuid NOT NULL,
    first_name character varying(35),
    middle_name character varying(35),
    last_name character varying(35),
    suffix character varying(10)
);


--
-- Name: borrower_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.borrower_progress (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    borrower_id uuid NOT NULL,
    deal_id uuid NOT NULL,
    deal_progress_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: deal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    loan_number character varying(30),
    universal_loan_identifier character varying(50),
    agency_case_identifier character varying(50),
    application_type character varying(20) NOT NULL,
    total_borrowers integer,
    mismo_reference_model_identifier character varying(30) DEFAULT '3.4.032420160128'::character varying,
    about_version_identifier character varying(20) DEFAULT 'DU Spec 1.9.1'::character varying,
    application_date date DEFAULT CURRENT_DATE,
    primary_borrower_id uuid,
    current_form_step character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_application_type CHECK (((application_type)::text = ANY ((ARRAY['IndividualCredit'::character varying, 'JointCredit'::character varying])::text[])))
);


--
-- Name: deal_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal_progress (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    deal_id uuid NOT NULL,
    section_1a_complete boolean DEFAULT false,
    section_1b_complete boolean DEFAULT false,
    section_1c_complete boolean DEFAULT false,
    section_1d_complete boolean DEFAULT false,
    section_1e_complete boolean DEFAULT false,
    section_2a_complete boolean DEFAULT false,
    section_2b_complete boolean DEFAULT false,
    section_2c_complete boolean DEFAULT false,
    section_2d_complete boolean DEFAULT false,
    section_3_complete boolean DEFAULT false,
    section_4_complete boolean DEFAULT false,
    section_5_complete boolean DEFAULT false,
    section_6_complete boolean DEFAULT false,
    section_7_complete boolean DEFAULT false,
    section_8_complete boolean DEFAULT false,
    section_9_complete boolean DEFAULT false,
    lender_l1_complete boolean DEFAULT false,
    lender_l2_complete boolean DEFAULT false,
    lender_l3_complete boolean DEFAULT false,
    lender_l4_complete boolean DEFAULT false,
    continuation_complete boolean DEFAULT false,
    unmarried_addendum_complete boolean DEFAULT false,
    progress_percentage integer DEFAULT 0,
    last_updated_section public.urla_section_enum,
    last_updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    progress_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deal_progress_progress_percentage_check CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100)))
);


--
-- Name: declaration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.declaration (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    borrower_id uuid NOT NULL,
    intent_to_occupy_as_primary boolean,
    homeowner_past_three_years boolean,
    outstanding_judgments boolean,
    delinquent_on_federal_debt boolean,
    party_to_lawsuit boolean,
    bankruptcy_declared boolean,
    foreclosure boolean,
    property_foreclosed boolean,
    borrowed_down_payment boolean,
    co_maker_or_endorser boolean,
    us_citizen boolean,
    permanent_resident_alien boolean,
    title_will_be_held_as_type character varying(50)
);


--
-- Name: demographic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demographic (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    borrower_id uuid NOT NULL,
    hmda_ethnicity_types text[],
    hmda_gender_type character varying(50),
    hmda_race_types text[],
    CONSTRAINT chk_gender CHECK (((hmda_gender_type)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying, 'InformationNotProvidedUnknown'::character varying])::text[])))
);


--
-- Name: employment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employment (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    borrower_id uuid NOT NULL,
    employment_status character varying(20) NOT NULL,
    employer_name character varying(150),
    employer_phone character varying(15),
    employer_address_line_text character varying(100),
    employer_city character varying(35),
    employer_state_code character(2),
    employer_postal_code character varying(10),
    position_title character varying(100),
    start_date date,
    end_date date,
    years_in_line_of_work_years integer,
    years_in_line_of_work_months integer,
    self_employed_indicator boolean DEFAULT false,
    ownership_share_percentage numeric(5,2),
    employed_by_family_or_party_indicator boolean DEFAULT false,
    CONSTRAINT chk_emp_status CHECK (((employment_status)::text = ANY ((ARRAY['Current'::character varying, 'Previous'::character varying])::text[])))
);


--
-- Name: employment_income; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employment_income (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    employment_id uuid NOT NULL,
    income_type character varying(50) NOT NULL,
    monthly_amount numeric(12,2) NOT NULL,
    CONSTRAINT chk_emp_income_type CHECK (((income_type)::text = ANY ((ARRAY['Base'::character varying, 'Overtime'::character varying, 'Bonus'::character varying, 'Commission'::character varying, 'MilitaryEntitlements'::character varying, 'Other'::character varying])::text[])))
);


--
-- Name: liability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.liability (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    borrower_id uuid NOT NULL,
    owned_property_id uuid,
    liability_type character varying(50) NOT NULL,
    account_company_name character varying(150),
    account_number character varying(50),
    unpaid_balance numeric(12,2),
    monthly_payment numeric(12,2),
    to_be_paid_off_before_closing boolean DEFAULT false,
    CONSTRAINT chk_liability_type CHECK (((liability_type)::text = ANY ((ARRAY['Revolving'::character varying, 'Installment'::character varying, 'MortgageLoan'::character varying, 'HELOC'::character varying, 'Open30DayChargeAccount'::character varying, 'LeasePayment'::character varying, 'Other'::character varying])::text[])))
);


--
-- Name: loan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    deal_id uuid NOT NULL,
    loan_purpose_type character varying(30),
    loan_amount_requested numeric(12,2),
    loan_term_months integer,
    interest_rate_percentage numeric(6,3),
    property_type character varying(50),
    manufactured_home_width_type character varying(20),
    title_manner_type character varying(50),
    purchase_price numeric(12,2),
    down_payment numeric(12,2),
    property_address character varying(255),
    outstanding_balance numeric(12,2),
    CONSTRAINT chk_loan_purpose CHECK (((loan_purpose_type)::text = ANY ((ARRAY['Purchase'::character varying, 'Refinance'::character varying, 'Construction'::character varying, 'Other'::character varying])::text[]))),
    CONSTRAINT chk_manufactured_width CHECK (((manufactured_home_width_type)::text = ANY ((ARRAY['SingleWide'::character varying, 'MultiWide'::character varying])::text[]))),
    CONSTRAINT chk_property_type CHECK (((property_type)::text = ANY ((ARRAY['SingleFamily'::character varying, 'Condo'::character varying, 'Cooperative'::character varying, 'PUD'::character varying, 'ManufacturedHome'::character varying, 'Multifamily'::character varying])::text[])))
);


--
-- Name: monthly_expense; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_expense (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    borrower_id uuid NOT NULL,
    expense_type character varying(50) NOT NULL,
    other_description character varying(100),
    monthly_amount numeric(12,2) NOT NULL,
    CONSTRAINT chk_expense_type CHECK (((expense_type)::text = ANY ((ARRAY['Alimony'::character varying, 'ChildSupport'::character varying, 'SeparateMaintenance'::character varying, 'JobRelatedExpenses'::character varying, 'Other'::character varying])::text[])))
);


--
-- Name: other_income; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.other_income (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    borrower_id uuid NOT NULL,
    income_source_type character varying(50) NOT NULL,
    other_description character varying(100),
    monthly_amount numeric(12,2) NOT NULL,
    CONSTRAINT chk_other_income_type CHECK (((income_source_type)::text = ANY ((ARRAY['Alimony'::character varying, 'AutomobileAllowance'::character varying, 'BoarderIncome'::character varying, 'CapitalGains'::character varying, 'ChildSupport'::character varying, 'Disability'::character varying, 'FosterCare'::character varying, 'HousingOrParsonage'::character varying, 'InterestAndDividends'::character varying, 'MortgageCreditCertificate'::character varying, 'MortgageDifferentialPayments'::character varying, 'NotesReceivable'::character varying, 'PublicAssistance'::character varying, 'Retirement'::character varying, 'RoyaltyPayments'::character varying, 'SeparateMaintenance'::character varying, 'SocialSecurity'::character varying, 'Trust'::character varying, 'UnemploymentBenefits'::character varying, 'VACompensation'::character varying, 'Other'::character varying])::text[])))
);


--
-- Name: owned_property; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owned_property (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    borrower_id uuid NOT NULL,
    property_usage_type character varying(30),
    property_status character varying(20),
    address_line_text character varying(100),
    city_name character varying(35),
    state_code character(2),
    postal_code character varying(10),
    estimated_market_value numeric(12,2),
    unpaid_balance numeric(12,2),
    monthly_payment numeric(12,2),
    gross_monthly_rental_income numeric(12,2),
    net_monthly_rental_income numeric(12,2),
    CONSTRAINT chk_reo_status CHECK (((property_status)::text = ANY ((ARRAY['Retained'::character varying, 'Sold'::character varying, 'PendingSale'::character varying])::text[]))),
    CONSTRAINT chk_reo_usage CHECK (((property_usage_type)::text = ANY ((ARRAY['PrimaryResidence'::character varying, 'SecondHome'::character varying, 'Investment'::character varying])::text[])))
);


--
-- Name: party; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.party (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    party_role_type character varying(50) NOT NULL,
    full_legal_name character varying(150),
    taxpayer_identifier_value character varying(15),
    CONSTRAINT chk_party_role CHECK (((party_role_type)::text = ANY ((ARRAY['LoanOriginationCompany'::character varying, 'NotePayTo'::character varying, 'SubmittingParty'::character varying, 'HousingCounselingAgency'::character varying])::text[])))
);


--
-- Name: residence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.residence (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    borrower_id uuid NOT NULL,
    residency_type character varying(50) NOT NULL,
    residency_basis_type character varying(30),
    address_line_text character varying(100),
    city_name character varying(35),
    state_code character(2),
    postal_code character varying(10),
    country_code character(2) DEFAULT 'US'::bpchar,
    unit_number character varying(20),
    duration_years integer,
    duration_months integer,
    monthly_rent_amount numeric(12,2),
    CONSTRAINT chk_residency_basis CHECK (((residency_basis_type)::text = ANY ((ARRAY['Own'::character varying, 'Rent'::character varying, 'LivingRentFree'::character varying])::text[]))),
    CONSTRAINT chk_residency_type CHECK (((residency_type)::text = ANY ((ARRAY['BorrowerCurrentResidence'::character varying, 'BorrowerFormerResidence'::character varying, 'BorrowerMailingAddress'::character varying])::text[])))
);


--
-- Name: subject_property; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subject_property (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    deal_id uuid NOT NULL,
    address_line_text character varying(100),
    city_name character varying(35),
    state_code character(2),
    postal_code character varying(10),
    unit_number character varying(20),
    property_usage_type character varying(30),
    estimated_value numeric(12,2),
    projected_monthly_rental_income numeric(12,2),
    CONSTRAINT chk_prop_usage CHECK (((property_usage_type)::text = ANY ((ARRAY['PrimaryResidence'::character varying, 'SecondHome'::character varying, 'Investment'::character varying])::text[])))
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id uuid DEFAULT public.generate_uuid_v7() NOT NULL,
    email_address character varying(80) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(35),
    last_name character varying(35),
    phone character varying(20),
    user_role character varying(30),
    user_type character varying(50) DEFAULT 'employee'::character varying NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying,
    nmlsr_identifier character varying(20),
    is_active boolean DEFAULT true,
    email_verified boolean DEFAULT false,
    email_verification_token character varying(255),
    email_verification_expires_at timestamp with time zone,
    password_reset_token character varying(255),
    password_reset_expires_at timestamp with time zone,
    last_password_change_at timestamp with time zone,
    mfa_enabled boolean DEFAULT false,
    mfa_secret character varying(255),
    mfa_backup_codes text,
    mfa_setup_at timestamp with time zone,
    mfa_verified_at timestamp with time zone,
    last_login_at timestamp with time zone,
    failed_login_attempts integer DEFAULT 0,
    account_locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: asset asset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_pkey PRIMARY KEY (id);


--
-- Name: borrower_alternate_name borrower_alternate_name_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.borrower_alternate_name
    ADD CONSTRAINT borrower_alternate_name_pkey PRIMARY KEY (id);


--
-- Name: borrower borrower_email_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.borrower
    ADD CONSTRAINT borrower_email_address_key UNIQUE (email_address);


--
-- Name: borrower borrower_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.borrower
    ADD CONSTRAINT borrower_pkey PRIMARY KEY (id);


--
-- Name: borrower_progress borrower_progress_borrower_id_deal_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.borrower_progress
    ADD CONSTRAINT borrower_progress_borrower_id_deal_id_key UNIQUE (borrower_id, deal_id);


--
-- Name: borrower_progress borrower_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.borrower_progress
    ADD CONSTRAINT borrower_progress_pkey PRIMARY KEY (id);


--
-- Name: deal deal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal
    ADD CONSTRAINT deal_pkey PRIMARY KEY (id);


--
-- Name: deal_progress deal_progress_deal_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_progress
    ADD CONSTRAINT deal_progress_deal_id_key UNIQUE (deal_id);


--
-- Name: deal_progress deal_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_progress
    ADD CONSTRAINT deal_progress_pkey PRIMARY KEY (id);


--
-- Name: declaration declaration_borrower_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declaration
    ADD CONSTRAINT declaration_borrower_id_key UNIQUE (borrower_id);


--
-- Name: declaration declaration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declaration
    ADD CONSTRAINT declaration_pkey PRIMARY KEY (id);


--
-- Name: demographic demographic_borrower_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demographic
    ADD CONSTRAINT demographic_borrower_id_key UNIQUE (borrower_id);


--
-- Name: demographic demographic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demographic
    ADD CONSTRAINT demographic_pkey PRIMARY KEY (id);


--
-- Name: employment_income employment_income_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employment_income
    ADD CONSTRAINT employment_income_pkey PRIMARY KEY (id);


--
-- Name: employment employment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employment
    ADD CONSTRAINT employment_pkey PRIMARY KEY (id);


--
-- Name: liability liability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liability
    ADD CONSTRAINT liability_pkey PRIMARY KEY (id);


--
-- Name: loan loan_deal_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_deal_id_key UNIQUE (deal_id);


--
-- Name: loan loan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_pkey PRIMARY KEY (id);


--
-- Name: monthly_expense monthly_expense_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_expense
    ADD CONSTRAINT monthly_expense_pkey PRIMARY KEY (id);


--
-- Name: other_income other_income_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.other_income
    ADD CONSTRAINT other_income_pkey PRIMARY KEY (id);


--
-- Name: owned_property owned_property_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owned_property
    ADD CONSTRAINT owned_property_pkey PRIMARY KEY (id);


--
-- Name: party party_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.party
    ADD CONSTRAINT party_pkey PRIMARY KEY (id);


--
-- Name: residence residence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.residence
    ADD CONSTRAINT residence_pkey PRIMARY KEY (id);


--
-- Name: subject_property subject_property_deal_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject_property
    ADD CONSTRAINT subject_property_deal_id_key UNIQUE (deal_id);


--
-- Name: subject_property subject_property_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject_property
    ADD CONSTRAINT subject_property_pkey PRIMARY KEY (id);


--
-- Name: user user_email_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_address_key UNIQUE (email_address);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: idx_asset_borrower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_borrower_id ON public.asset USING btree (borrower_id);


--
-- Name: idx_borrower_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_borrower_email ON public.borrower USING btree (email_address) WHERE (email_address IS NOT NULL);


--
-- Name: idx_borrower_email_verification_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_borrower_email_verification_token ON public.borrower USING btree (email_verification_token) WHERE (email_verification_token IS NOT NULL);


--
-- Name: idx_borrower_military_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_borrower_military_service ON public.borrower USING btree (military_service_status);


--
-- Name: idx_borrower_password_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_borrower_password_reset_token ON public.borrower USING btree (password_reset_token) WHERE (password_reset_token IS NOT NULL);


--
-- Name: idx_borrower_progress_borrower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_borrower_progress_borrower_id ON public.borrower_progress USING btree (borrower_id);


--
-- Name: idx_borrower_progress_deal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_borrower_progress_deal_id ON public.borrower_progress USING btree (deal_id);


--
-- Name: idx_deal_loan_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_loan_number ON public.deal USING btree (loan_number);


--
-- Name: idx_deal_primary_borrower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_primary_borrower_id ON public.deal USING btree (primary_borrower_id);


--
-- Name: idx_deal_progress_deal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_progress_deal_id ON public.deal_progress USING btree (deal_id);


--
-- Name: idx_deal_universal_loan_identifier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_universal_loan_identifier ON public.deal USING btree (universal_loan_identifier);


--
-- Name: idx_employment_borrower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employment_borrower_id ON public.employment USING btree (borrower_id);


--
-- Name: idx_liability_borrower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_liability_borrower_id ON public.liability USING btree (borrower_id);


--
-- Name: idx_monthly_expense_borrower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monthly_expense_borrower_id ON public.monthly_expense USING btree (borrower_id);


--
-- Name: idx_other_income_borrower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_other_income_borrower_id ON public.other_income USING btree (borrower_id);


--
-- Name: idx_owned_property_borrower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owned_property_borrower_id ON public.owned_property USING btree (borrower_id);


--
-- Name: idx_residence_borrower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_residence_borrower_id ON public.residence USING btree (borrower_id);


--
-- Name: idx_user_email_verification_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_email_verification_token ON public."user" USING btree (email_verification_token) WHERE (email_verification_token IS NOT NULL);


--
-- Name: idx_user_password_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_password_reset_token ON public."user" USING btree (password_reset_token) WHERE (password_reset_token IS NOT NULL);


--
-- Name: deal trg_create_deal_progress; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_create_deal_progress AFTER INSERT ON public.deal FOR EACH ROW EXECUTE FUNCTION public.create_deal_progress();


--
-- Name: deal_progress trg_update_progress; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_progress BEFORE UPDATE ON public.deal_progress FOR EACH ROW EXECUTE FUNCTION public.update_progress_percentage();


--
-- Name: asset asset_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.borrower(id) ON DELETE CASCADE;


--
-- Name: borrower_alternate_name borrower_alternate_name_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.borrower_alternate_name
    ADD CONSTRAINT borrower_alternate_name_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.borrower(id) ON DELETE CASCADE;


--
-- Name: borrower_progress borrower_progress_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.borrower_progress
    ADD CONSTRAINT borrower_progress_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.borrower(id) ON DELETE CASCADE;


--
-- Name: borrower_progress borrower_progress_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.borrower_progress
    ADD CONSTRAINT borrower_progress_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deal(id) ON DELETE CASCADE;


--
-- Name: borrower_progress borrower_progress_deal_progress_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.borrower_progress
    ADD CONSTRAINT borrower_progress_deal_progress_id_fkey FOREIGN KEY (deal_progress_id) REFERENCES public.deal_progress(id);


--
-- Name: deal deal_primary_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal
    ADD CONSTRAINT deal_primary_borrower_id_fkey FOREIGN KEY (primary_borrower_id) REFERENCES public.borrower(id) ON DELETE SET NULL;


--
-- Name: deal_progress deal_progress_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_progress
    ADD CONSTRAINT deal_progress_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deal(id) ON DELETE CASCADE;


--
-- Name: declaration declaration_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declaration
    ADD CONSTRAINT declaration_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.borrower(id) ON DELETE CASCADE;


--
-- Name: demographic demographic_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demographic
    ADD CONSTRAINT demographic_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.borrower(id) ON DELETE CASCADE;


--
-- Name: employment employment_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employment
    ADD CONSTRAINT employment_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.borrower(id) ON DELETE CASCADE;


--
-- Name: employment_income employment_income_employment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employment_income
    ADD CONSTRAINT employment_income_employment_id_fkey FOREIGN KEY (employment_id) REFERENCES public.employment(id) ON DELETE CASCADE;


--
-- Name: liability liability_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liability
    ADD CONSTRAINT liability_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.borrower(id) ON DELETE CASCADE;


--
-- Name: liability liability_owned_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liability
    ADD CONSTRAINT liability_owned_property_id_fkey FOREIGN KEY (owned_property_id) REFERENCES public.owned_property(id);


--
-- Name: loan loan_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan
    ADD CONSTRAINT loan_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deal(id) ON DELETE CASCADE;


--
-- Name: monthly_expense monthly_expense_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_expense
    ADD CONSTRAINT monthly_expense_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.borrower(id) ON DELETE CASCADE;


--
-- Name: other_income other_income_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.other_income
    ADD CONSTRAINT other_income_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.borrower(id) ON DELETE CASCADE;


--
-- Name: owned_property owned_property_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owned_property
    ADD CONSTRAINT owned_property_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.borrower(id) ON DELETE CASCADE;


--
-- Name: residence residence_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.residence
    ADD CONSTRAINT residence_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.borrower(id) ON DELETE CASCADE;


--
-- Name: subject_property subject_property_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject_property
    ADD CONSTRAINT subject_property_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deal(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Dasav5LUdGdRym6UnQt6WSHNwjS4FoyoMZRejnnVbP79mHKQjiR8o0y0uoq6nWF

