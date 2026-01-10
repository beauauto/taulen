-- name: CreateLoanApplication :one
INSERT INTO loanapplications (
    application_date, loan_type, loan_purpose, property_type, property_usage,
    loan_amount_requested, down_payment_amount, term_years, interest_rate,
    amortization_type, application_status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
) RETURNING loan_application_id, application_date, loan_type, loan_purpose, application_status, created_date, last_updated_date;

-- name: GetLoanApplicationByID :one
SELECT 
    loan_application_id, application_date, loan_type, loan_purpose, property_type,
    property_usage, loan_amount_requested, down_payment_amount, term_years,
    interest_rate, amortization_type, subject_property_id, lender_case_number,
    mersmin, application_status, created_date, last_updated_date
FROM loanapplications
WHERE loan_application_id = $1 LIMIT 1;

-- name: ListLoanApplications :many
SELECT 
    loan_application_id, application_date, loan_type, loan_purpose, 
    loan_amount_requested, application_status, created_date, last_updated_date
FROM loanapplications
WHERE ($1::text IS NULL OR application_status = $1)
ORDER BY created_date DESC
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
    last_updated_date = NOW()
WHERE loan_application_id = $1
RETURNING loan_application_id, application_date, loan_type, loan_purpose, application_status, created_date, last_updated_date;

-- name: DeleteLoanApplication :exec
DELETE FROM loanapplications
WHERE loan_application_id = $1;
