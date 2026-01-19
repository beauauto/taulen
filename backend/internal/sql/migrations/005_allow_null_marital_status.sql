-- Migration to allow NULL marital_status in borrower table
-- This allows co-borrowers to be created without marital status (set in co-borrower-info-2)

ALTER TABLE borrower 
DROP CONSTRAINT IF EXISTS chk_marital_status;

ALTER TABLE borrower 
ADD CONSTRAINT chk_marital_status 
CHECK (marital_status IS NULL OR marital_status IN ('Married', 'Separated', 'Unmarried'));
