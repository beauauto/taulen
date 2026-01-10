-- name: CreateLoanApplication :one
INSERT INTO loanapplications (
    application_date, loan_type, loan_purpose, property_type, property_usage,
    loan_amount_requested, down_payment_amount, term_years, interest_rate,
    amortization_type, application_status
) VALUES (
    CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft'
) RETURNING loan_application_id, application_date, loan_type, loan_purpose, application_status, created_date, last_updated_date;

-- name: GetLoanApplicationByID :one
SELECT 
    loan_application_id, application_date, loan_type, loan_purpose, property_type,
    property_usage, loan_amount_requested, down_payment_amount, term_years,
    interest_rate, amortization_type, subject_property_id, lender_case_number,
    mersmin, application_status, created_date, last_updated_date
FROM loanapplications
WHERE loan_application_id = $1 LIMIT 1;

-- name: ListLoanApplicationsByUser :many
-- Note: This assumes we'll add a user_id field or link through applicants
SELECT 
    la.loan_application_id, la.application_date, la.loan_type, la.loan_purpose, 
    la.loan_amount_requested, la.application_status, la.created_date, la.last_updated_date
FROM loanapplications la
INNER JOIN applicants a ON a.loan_application_id = la.loan_application_id
WHERE a.applicant_id = $1 AND a.is_primary_applicant = true
ORDER BY la.created_date DESC
LIMIT $2 OFFSET $3;

-- name: UpdateLoanApplication :one
UPDATE loanapplications
SET 
    loan_type = COALESCE($2, loan_type),
    loan_purpose = COALESCE($3, loan_purpose),
    property_type = COALESCE($4, property_type),
    property_usage = COALESCE($5, property_usage),
    loan_amount_requested = COALESCE($6, loan_amount_requested),
    down_payment_amount = COALESCE($7, down_payment_amount),
    term_years = COALESCE($8, term_years),
    interest_rate = COALESCE($9, interest_rate),
    amortization_type = COALESCE($10, amortization_type),
    application_status = COALESCE($11, application_status),
    last_updated_date = CURRENT_TIMESTAMP
WHERE loan_application_id = $1
RETURNING loan_application_id, application_date, loan_type, loan_purpose, application_status, created_date, last_updated_date;

-- name: DeleteLoanApplication :exec
DELETE FROM loanapplications
WHERE loan_application_id = $1;
