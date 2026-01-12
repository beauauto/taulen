-- name: CreateMonthlyExpense :one
INSERT INTO monthly_expense (
    borrower_id, expense_type, other_description, monthly_amount
) VALUES (
    $1, $2, $3, $4
) RETURNING id, borrower_id, expense_type, other_description, monthly_amount;

-- name: GetMonthlyExpensesByBorrowerID :many
SELECT 
    id, borrower_id, expense_type, other_description, monthly_amount
FROM monthly_expense
WHERE borrower_id = $1
ORDER BY expense_type;

-- name: UpdateMonthlyExpense :one
UPDATE monthly_expense
SET 
    expense_type = COALESCE($2, expense_type),
    other_description = COALESCE($3, other_description),
    monthly_amount = COALESCE($4, monthly_amount)
WHERE id = $1
RETURNING id, borrower_id, expense_type, other_description, monthly_amount;

-- name: DeleteMonthlyExpense :exec
DELETE FROM monthly_expense
WHERE id = $1;
