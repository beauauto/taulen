-- name: CreateIncome :one
INSERT INTO incomes (
    applicant_id, income_type, monthly_amount, description
) VALUES (
    $1, $2, $3, $4
) RETURNING income_id, applicant_id, income_type, monthly_amount, created_date;

-- name: GetIncomesByApplicantID :many
SELECT 
    income_id, applicant_id, income_type, monthly_amount, description,
    created_date, last_updated_date
FROM incomes
WHERE applicant_id = $1
ORDER BY income_type;

-- name: UpdateIncome :one
UPDATE incomes
SET 
    income_type = COALESCE($2, income_type),
    monthly_amount = COALESCE($3, monthly_amount),
    description = COALESCE($4, description),
    last_updated_date = CURRENT_TIMESTAMP
WHERE income_id = $1
RETURNING income_id, applicant_id, income_type, monthly_amount, created_date, last_updated_date;

-- name: DeleteIncome :exec
DELETE FROM incomes
WHERE income_id = $1;
