-- Schema for Uniform Residential Loan Application (URLA)

-- 1. Applicants Table
CREATE TABLE "Applicants" (
    "ApplicantID" BIGSERIAL PRIMARY KEY, -- Unique identifier for the applicant
    "LoanApplicationID" BIGINT NOT NULL, -- FK to LoanApplications table
    "IsPrimaryApplicant" BOOLEAN NOT NULL, -- True if primary, False if co-applicant
    "FirstName" VARCHAR(100) NOT NULL,
    "MiddleName" VARCHAR(100),
    "LastName" VARCHAR(100) NOT NULL,
    "Suffix" VARCHAR(20), -- Jr., Sr., III, etc.
    "SSN" VARCHAR(11) UNIQUE, -- Social Security Number (should be encrypted at application/storage layer)
    "DateOfBirth" DATE NOT NULL,
    "YearsSchool" INT, -- Years of schooling completed
    "MaritalStatus" VARCHAR(50), -- e.g., 'Single', 'Married', 'Divorced', 'Separated'
    "DependentsCount" INT, -- Number of dependents
    "DependentsAges" TEXT, -- Comma-separated ages of dependents (e.g., '5,12,18')
    "CitizenshipStatus" VARCHAR(50), -- e.g., 'Citizen', 'Permanent Resident', 'Other'
    "AlienRegistrationNo" VARCHAR(50), -- For non-citizens
    "VeteranStatus" VARCHAR(50), -- e.g., 'Veteran', 'Non-Veteran'
    "MilitaryServiceYears" INT,
    "IsBorrowerDecliningInfo" BOOLEAN NOT NULL DEFAULT FALSE, -- Declining to provide demographic info?
    "Ethnicity" VARCHAR(100),
    "EthnicityOther" VARCHAR(255), -- If ethnicity is 'Other'
    "Race" TEXT, -- Comma-separated races (e.g., 'White,Asian')
    "RaceOther" TEXT, -- If race is 'Other'
    "Gender" VARCHAR(20),
    "CreatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "LastUpdatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Applicants
CREATE INDEX "IDX_Applicants_LoanApplicationID" ON "Applicants" (LoanApplicationID);
CREATE UNIQUE INDEX "IDX_Applicants_SSN" ON "Applicants" (SSN); -- Consider unique constraint for SSN if needed, or partial index for privacy


-- 2. LoanApplications Table
CREATE TABLE "LoanApplications" (
    "LoanApplicationID" BIGSERIAL PRIMARY KEY, -- Unique ID for each loan application
    "ApplicationDate" DATE NOT NULL, -- Date the application was submitted
    "LoanType" VARCHAR(50) NOT NULL, -- e.g., 'FHA', 'VA', 'Conventional', 'USDA'
    "LoanPurpose" VARCHAR(50) NOT NULL, -- e.g., 'Purchase', 'Refinance', 'Construction'
    "PropertyType" VARCHAR(50), -- e.g., 'Single Family', 'Condo', '2-4 Unit'
    "PropertyUsage" VARCHAR(50), -- e.g., 'Primary Residence', 'Investment', 'Second Home'
    "LoanAmountRequested" DECIMAL(18,2) NOT NULL,
    "DownPaymentAmount" DECIMAL(18,2),
    "TermYears" INT, -- e.g., 15, 30
    "InterestRate" DECIMAL(5,3), -- e.g., 4.125
    "AmortizationType" VARCHAR(50), -- e.g., 'Fixed', 'ARM'
    "SubjectPropertyID" BIGINT, -- FK to Properties table (can be NULL initially if property not identified)
    "LenderCaseNumber" VARCHAR(100), -- Internal lender tracking number
    "MERSMIN" VARCHAR(18), -- Mortgage Electronic Registration System MIN
    "ApplicationStatus" VARCHAR(50) NOT NULL, -- e.g., 'Pending', 'Approved', 'Denied', 'Withdrawn'
    "CreatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "LastUpdatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for LoanApplications
CREATE INDEX "IDX_LoanApplications_ApplicationDate" ON "LoanApplications" (ApplicationDate);
CREATE INDEX "IDX_LoanApplications_ApplicationStatus" ON "LoanApplications" (ApplicationStatus);


-- 3. Properties Table
CREATE TABLE "Properties" (
    "PropertyID" BIGSERIAL PRIMARY KEY, -- Unique identifier for the property
    "StreetAddress" VARCHAR(255) NOT NULL,
    "UnitNumber" VARCHAR(50), -- Apartment, Suite, etc.
    "City" VARCHAR(100) NOT NULL,
    "State" VARCHAR(50) NOT NULL,
    "ZipCode" VARCHAR(10) NOT NULL,
    "County" VARCHAR(100),
    "NumberOfUnits" INT NOT NULL DEFAULT 1, -- For multi-unit properties
    "YearBuilt" INT,
    "PurchasePrice" DECIMAL(18,2), -- If purchase loan
    "EstimatedValue" DECIMAL(18,2), -- If refinance or estimated for purchase
    "LegalDescription" TEXT,
    "PropertyOccupancyType" VARCHAR(50), -- e.g., 'Primary', 'Secondary', 'Investment'
    "PropertyAcquiredDate" DATE, -- For refinance
    "OriginalCost" DECIMAL(18,2), -- For refinance
    "ImprovementCost" DECIMAL(18,2), -- For refinance
    "CreatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "LastUpdatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Properties
CREATE INDEX "IDX_Properties_ZipCode" ON "Properties" (ZipCode);


-- 4. Residences Table
CREATE TABLE "Residences" (
    "ResidenceID" BIGSERIAL PRIMARY KEY, -- Unique identifier for a residence record
    "ApplicantID" BIGINT NOT NULL, -- FK to Applicants table
    "StreetAddress" VARCHAR(255) NOT NULL,
    "UnitNumber" VARCHAR(50),
    "City" VARCHAR(100) NOT NULL,
    "State" VARCHAR(50) NOT NULL,
    "ZipCode" VARCHAR(10) NOT NULL,
    "IsCurrentResidence" BOOLEAN NOT NULL, -- True for current, False for previous
    "StartDate" DATE NOT NULL, -- Date residency began
    "EndDate" DATE, -- Date residency ended (NULL if current)
    "HousingType" VARCHAR(50), -- e.g., 'Own', 'Rent', 'Free & Clear', 'Live with Relatives'
    "MonthlyHousingPayment" DECIMAL(18,2),
    "CreatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "LastUpdatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Residences
CREATE INDEX "IDX_Residences_ApplicantID" ON "Residences" (ApplicantID);
CREATE INDEX "IDX_Residences_IsCurrentResidence" ON "Residences" (IsCurrentResidence);


-- 5. Employments Table
CREATE TABLE "Employments" (
    "EmploymentID" BIGSERIAL PRIMARY KEY, -- Unique identifier for an employment record
    "ApplicantID" BIGINT NOT NULL, -- FK to Applicants table
    "EmployerName" VARCHAR(255) NOT NULL,
    "StreetAddress" VARCHAR(255),
    "City" VARCHAR(100),
    "State" VARCHAR(50),
    "ZipCode" VARCHAR(10),
    "PhoneNumber" VARCHAR(20),
    "Position" VARCHAR(100), -- Job title
    "EmploymentType" VARCHAR(50), -- e.g., 'Salaried', 'Hourly', 'Self-Employed'
    "StartDate" DATE NOT NULL, -- Employment start date
    "EndDate" DATE, -- Employment end date (NULL if current)
    "YearsAtEmployer" INT, -- Calculated from dates, or provided
    "MonthlyIncome" DECIMAL(18,2), -- Base monthly income
    "CreatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "LastUpdatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Employments
CREATE INDEX "IDX_Employments_ApplicantID" ON "Employments" (ApplicantID);


-- 6. Incomes Table
CREATE TABLE "Incomes" (
    "IncomeID" BIGSERIAL PRIMARY KEY, -- Unique identifier for an income record
    "ApplicantID" BIGINT NOT NULL, -- FK to Applicants table
    "IncomeType" VARCHAR(100) NOT NULL, -- e.g., 'Base', 'Overtime', 'Bonus', 'Commission', 'Rental', 'Other'
    "MonthlyAmount" DECIMAL(18,2) NOT NULL, -- Gross monthly income for this type
    "Description" TEXT, -- Details for 'Other' income
    "CreatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "LastUpdatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Incomes
CREATE INDEX "IDX_Incomes_ApplicantID" ON "Incomes" (ApplicantID);


-- 7. Assets Table
CREATE TABLE "Assets" (
    "AssetID" BIGSERIAL PRIMARY KEY, -- Unique identifier for an asset record
    "LoanApplicationID" BIGINT NOT NULL, -- FK to LoanApplications table
    "ApplicantID" BIGINT, -- Optional: If asset belongs to specific applicant
    "AssetType" VARCHAR(100) NOT NULL, -- e.g., 'Checking', 'Savings', 'Stocks', 'Bonds', 'Real Estate', 'Other'
    "Description" TEXT, -- Account Name, Bank Name, Property Address
    "CurrentValue" DECIMAL(18,2) NOT NULL, -- Current market value or balance
    "AccountLastFour" VARCHAR(4), -- Last four digits of account number (for security)
    "CreatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "LastUpdatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Assets
CREATE INDEX "IDX_Assets_LoanApplicationID" ON "Assets" (LoanApplicationID);
CREATE INDEX "IDX_Assets_ApplicantID" ON "Assets" (ApplicantID);


-- 8. Liabilities Table
CREATE TABLE "Liabilities" (
    "LiabilityID" BIGSERIAL PRIMARY KEY, -- Unique identifier for a liability record
    "LoanApplicationID" BIGINT NOT NULL, -- FK to LoanApplications table
    "ApplicantID" BIGINT, -- Optional: If liability belongs to specific applicant
    "LiabilityType" VARCHAR(100) NOT NULL, -- e.g., 'Credit Card', 'Student Loan', 'Auto Loan', 'Mortgage', 'Alimony', 'Child Support'
    "CreditorName" VARCHAR(255) NOT NULL, -- Bank or institution
    "AccountOrLoanNumber" VARCHAR(100),
    "MonthlyPayment" DECIMAL(18,2) NOT NULL,
    "OutstandingBalance" DECIMAL(18,2) NOT NULL,
    "IsSecured" BOOLEAN, -- Is the loan secured by an asset?
    "AssetSecuringLiability" TEXT, -- If secured, description of asset
    "RemainingPayments" INT, -- Number of remaining payments
    "CreatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "LastUpdatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Liabilities
CREATE INDEX "IDX_Liabilities_LoanApplicationID" ON "Liabilities" (LoanApplicationID);
CREATE INDEX "IDX_Liabilities_ApplicantID" ON "Liabilities" (ApplicantID);


-- 9. Declarations Table
CREATE TABLE "Declarations" (
    "DeclarationID" BIGSERIAL PRIMARY KEY, -- Unique identifier for a declaration record
    "LoanApplicationID" BIGINT NOT NULL, -- FK to LoanApplications table
    "ApplicantID" BIGINT NOT NULL, -- FK to Applicants table
    "QuestionCode" VARCHAR(50) NOT NULL, -- e.g., 'Q1A' (for specific URLA questions)
    "QuestionText" TEXT NOT NULL, -- The full text of the question
    "Response" BOOLEAN NOT NULL, -- TRUE for Yes, FALSE for No
    "Explanation" TEXT, -- Required if response is 'Yes' for certain questions
    "CreatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "LastUpdatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Declarations
CREATE INDEX "IDX_Declarations_LoanApplicationID" ON "Declarations" (LoanApplicationID);
CREATE INDEX "IDX_Declarations_ApplicantID" ON "Declarations" (ApplicantID);


-- 10. RealEstateOwned Table
CREATE TABLE "RealEstateOwned" (
    "REOID" BIGSERIAL PRIMARY KEY, -- Unique identifier for an REO record
    "LoanApplicationID" BIGINT NOT NULL, -- FK to LoanApplications table
    "ApplicantID" BIGINT NOT NULL, -- FK to Applicants table
    "StreetAddress" VARCHAR(255) NOT NULL,
    "UnitNumber" VARCHAR(50),
    "City" VARCHAR(100) NOT NULL,
    "State" VARCHAR(50) NOT NULL,
    "ZipCode" VARCHAR(10) NOT NULL,
    "PropertyType" VARCHAR(50), -- e.g., 'Single Family', 'Condo', '2-4 Unit'
    "CurrentMarketValue" DECIMAL(18,2) NOT NULL,
    "AmountOfMortgage" DECIMAL(18,2), -- Outstanding balance on existing mortgage
    "MonthlyPayment" DECIMAL(18,2), -- Total monthly mortgage payment
    "RentalIncome" DECIMAL(18,2), -- If rented
    "NetRentalIncome" DECIMAL(18,2),
    "PropertyStatus" VARCHAR(50), -- e.g., 'Rented', 'Primary', 'Investment'
    "CreatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "LastUpdatedDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for RealEstateOwned
CREATE INDEX "IDX_RealEstateOwned_LoanApplicationID" ON "RealEstateOwned" (LoanApplicationID);
CREATE INDEX "IDX_RealEstateOwned_ApplicantID" ON "RealEstateOwned" (ApplicantID);


-- Foreign Key Constraints (Apply these after all tables are created)
ALTER TABLE "Applicants"
ADD CONSTRAINT "FK_Applicants_LoanApplications"
FOREIGN KEY ("LoanApplicationID") REFERENCES "LoanApplications"("LoanApplicationID");

ALTER TABLE "LoanApplications"
ADD CONSTRAINT "FK_LoanApplications_Properties"
FOREIGN KEY ("SubjectPropertyID") REFERENCES "Properties"("PropertyID");

ALTER TABLE "Residences"
ADD CONSTRAINT "FK_Residences_Applicants"
FOREIGN KEY ("ApplicantID") REFERENCES "Applicants"("ApplicantID");

ALTER TABLE "Employments"
ADD CONSTRAINT "FK_Employments_Applicants"
FOREIGN KEY ("ApplicantID") REFERENCES "Applicants"("ApplicantID");

ALTER TABLE "Incomes"
ADD CONSTRAINT "FK_Incomes_Applicants"
FOREIGN KEY ("ApplicantID") REFERENCES "Applicants"("ApplicantID");

ALTER TABLE "Assets"
ADD CONSTRAINT "FK_Assets_LoanApplications"
FOREIGN KEY ("LoanApplicationID") REFERENCES "LoanApplications"("LoanApplicationID");

ALTER TABLE "Assets"
ADD CONSTRAINT "FK_Assets_Applicants"
FOREIGN KEY ("ApplicantID") REFERENCES "Applicants"("ApplicantID");

ALTER TABLE "Liabilities"
ADD CONSTRAINT "FK_Liabilities_LoanApplications"
FOREIGN KEY ("LoanApplicationID") REFERENCES "LoanApplications"("LoanApplicationID");

ALTER TABLE "Liabilities"
ADD CONSTRAINT "FK_Liabilities_Applicants"
FOREIGN KEY ("ApplicantID") REFERENCES "Applicants"("ApplicantID");

ALTER TABLE "Declarations"
ADD CONSTRAINT "FK_Declarations_LoanApplications"
FOREIGN KEY ("LoanApplicationID") REFERENCES "LoanApplications"("LoanApplicationID");

ALTER TABLE "Declarations"
ADD CONSTRAINT "FK_Declarations_Applicants"
FOREIGN KEY ("ApplicantID") REFERENCES "Applicants"("ApplicantID");

ALTER TABLE "RealEstateOwned"
ADD CONSTRAINT "FK_RealEstateOwned_LoanApplications"
FOREIGN KEY ("LoanApplicationID") REFERENCES "LoanApplications"("LoanApplicationID");

ALTER TABLE "RealEstateOwned"
ADD CONSTRAINT "FK_RealEstateOwned_Applicants"
FOREIGN KEY ("ApplicantID") REFERENCES "Applicants"("ApplicantID");