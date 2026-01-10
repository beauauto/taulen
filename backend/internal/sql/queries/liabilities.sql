-- name: CreateLiability :one
INSERT INTO liabilities (
    loan_application_id, applicant_id, liability_type, creditor_name,
    account_or_loan_number, monthly_payment, outstanding_balance,
    is_secured, asset_securing_liability, remaining_payments
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING liability_id, loan_application_id, applicant_id, liability_type, creditor_name, monthly_payment, created_date;

-- name: GetLiabilitiesByApplicationID :many
SELECT 
    liability_id, loan_application_id, applicant_id, liability_type, creditor_name,
    account_or_loan_number, monthly_payment, outstanding_balance,
    is_secured, asset_securing_liability, remaining_payments,
    created_date, last_updated_date
FROM liabilities
WHERE loan_application_id = $1
ORDER BY liability_type, created_date;

-- name: UpdateLiability :one
UPDATE liabilities
SET 
    liability_type = COALESCE($2, liability_type),
    creditor_name = COALESCE($3, creditor_name),
    account_or_loan_number = COALESCE($4, account_or_loan_number),
    monthly_payment = COALESCE($5, monthly_payment),
    outstanding_balance = COALESCE($6, outstanding_balance),
    is_secured = COALESCE($7, is_secured),
    asset_securing_liability = COALESCE($8, asset_securing_liability),
    remaining_payments = COALESCE($9, remaining_payments),
    last_updated_date = CURRENT_TIMESTAMP
WHERE liability_id = $1
RETURNING liability_id, loan_application_id, applicant_id, liability_type, creditor_name, monthly_payment, created_date, last_updated_date;

-- name: DeleteLiability :exec
DELETE FROM liabilities
WHERE liability_id = $1;
