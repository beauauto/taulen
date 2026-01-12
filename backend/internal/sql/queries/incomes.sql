-- name: CreateOtherIncome :one
INSERT INTO other_income (
    borrower_id, income_source_type, other_description, monthly_amount
) VALUES (
    $1, $2, $3, $4
) RETURNING id, borrower_id, income_source_type, other_description, monthly_amount;

-- name: GetOtherIncomesByBorrowerID :many
SELECT 
    id, borrower_id, income_source_type, other_description, monthly_amount
FROM other_income
WHERE borrower_id = $1
ORDER BY income_source_type;

-- name: UpdateOtherIncome :one
UPDATE other_income
SET 
    income_source_type = COALESCE($2, income_source_type),
    other_description = COALESCE($3, other_description),
    monthly_amount = COALESCE($4, monthly_amount)
WHERE id = $1
RETURNING id, borrower_id, income_source_type, other_description, monthly_amount;

-- name: DeleteOtherIncome :exec
DELETE FROM other_income
WHERE id = $1;

-- name: CreateEmploymentIncome :one
INSERT INTO employment_income (
    employment_id, income_type, monthly_amount
) VALUES (
    $1, $2, $3
) RETURNING id, employment_id, income_type, monthly_amount;

-- name: GetEmploymentIncomesByEmploymentID :many
SELECT 
    id, employment_id, income_type, monthly_amount
FROM employment_income
WHERE employment_id = $1
ORDER BY income_type;

-- name: UpdateEmploymentIncome :one
UPDATE employment_income
SET 
    income_type = COALESCE($2, income_type),
    monthly_amount = COALESCE($3, monthly_amount)
WHERE id = $1
RETURNING id, employment_id, income_type, monthly_amount;

-- name: DeleteEmploymentIncome :exec
DELETE FROM employment_income
WHERE id = $1;
