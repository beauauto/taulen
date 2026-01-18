-- Add current_form_step field to deal table to track where user left off
ALTER TABLE deal ADD COLUMN IF NOT EXISTS current_form_step VARCHAR(255);

-- Add comment
COMMENT ON COLUMN deal.current_form_step IS 'Tracks the current form step in the application flow (e.g., borrower-info-1, borrower-info-2, co-borrower-question, etc.)';
