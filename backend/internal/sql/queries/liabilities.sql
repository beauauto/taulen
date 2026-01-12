-- name: CreateLiability :one
INSERT INTO liability (
    borrower_id, owned_property_id, liability_type, account_company_name,
    account_number, unpaid_balance, monthly_payment, to_be_paid_off_before_closing
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING id, borrower_id, owned_property_id, liability_type, account_company_name, monthly_payment;

-- name: GetLiabilitiesByBorrowerID :many
SELECT 
    id, borrower_id, owned_property_id, liability_type, account_company_name,
    account_number, unpaid_balance, monthly_payment, to_be_paid_off_before_closing
FROM liability
WHERE borrower_id = $1
ORDER BY liability_type;

-- name: UpdateLiability :one
UPDATE liability
SET 
    owned_property_id = COALESCE($2, owned_property_id),
    liability_type = COALESCE($3, liability_type),
    account_company_name = COALESCE($4, account_company_name),
    account_number = COALESCE($5, account_number),
    unpaid_balance = COALESCE($6, unpaid_balance),
    monthly_payment = COALESCE($7, monthly_payment),
    to_be_paid_off_before_closing = COALESCE($8, to_be_paid_off_before_closing)
WHERE id = $1
RETURNING id, borrower_id, owned_property_id, liability_type, account_company_name, monthly_payment;

-- name: DeleteLiability :exec
DELETE FROM liability
WHERE id = $1;
