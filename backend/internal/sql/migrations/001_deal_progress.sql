-- Enum for URLA sections (for progress tracking)
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

-- New table for deal-level progress tracking
CREATE TABLE deal_progress (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER UNIQUE NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
    
    -- Completion flags per section (BOOLEAN DEFAULT FALSE)
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
    
    -- Overall progress (0-100%, auto-computed)
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    
    -- Resumption helpers
    last_updated_section urla_section_enum,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Notes/log for partial saves or issues
    progress_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookup
CREATE INDEX idx_deal_progress_deal_id ON deal_progress(deal_id);

-- Trigger to auto-update progress percentage (simple average of completed flags)
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

-- Trigger to auto-create deal_progress when a deal is created
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

-- Optional: Per-borrower progress override for joint apps (if needed)
CREATE TABLE borrower_progress (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES borrower(id) ON DELETE CASCADE,
    deal_id INTEGER NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
    deal_progress_id INTEGER REFERENCES deal_progress(id),
    -- Add borrower-specific flags if joint apps need granular tracking
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(borrower_id, deal_id)
);

CREATE INDEX idx_borrower_progress_borrower_id ON borrower_progress(borrower_id);
CREATE INDEX idx_borrower_progress_deal_id ON borrower_progress(deal_id);
