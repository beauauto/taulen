-- Migration to add military service status and consent fields to borrower table

-- Add military service status
ALTER TABLE borrower 
ADD COLUMN IF NOT EXISTS military_service_status BOOLEAN DEFAULT FALSE;

-- Add consent to credit check
ALTER TABLE borrower 
ADD COLUMN IF NOT EXISTS consent_to_credit_check BOOLEAN DEFAULT FALSE;

-- Add consent to contact
ALTER TABLE borrower 
ADD COLUMN IF NOT EXISTS consent_to_contact BOOLEAN DEFAULT FALSE;

-- Add index for military service status (useful for filtering)
CREATE INDEX IF NOT EXISTS idx_borrower_military_service ON borrower(military_service_status);
