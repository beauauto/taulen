-- name: CreateLoan :one
INSERT INTO loan (
    deal_id, loan_purpose_type, loan_amount_requested, loan_term_months,
    interest_rate_percentage, property_type, manufactured_home_width_type, title_manner_type
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING id, deal_id, loan_purpose_type, loan_amount_requested, loan_term_months,
    interest_rate_percentage, property_type, manufactured_home_width_type, title_manner_type;

-- name: GetLoanByID :one
SELECT id, deal_id, loan_purpose_type, loan_amount_requested, loan_term_months,
    interest_rate_percentage, property_type, manufactured_home_width_type, title_manner_type
FROM loan
WHERE id = $1 LIMIT 1;

-- name: GetLoanByDealID :one
SELECT id, deal_id, loan_purpose_type, loan_amount_requested, loan_term_months,
    interest_rate_percentage, property_type, manufactured_home_width_type, title_manner_type
FROM loan
WHERE deal_id = $1 LIMIT 1;

-- name: UpdateLoan :one
UPDATE loan
SET 
    loan_purpose_type = COALESCE($2, loan_purpose_type),
    loan_amount_requested = COALESCE($3, loan_amount_requested),
    loan_term_months = COALESCE($4, loan_term_months),
    interest_rate_percentage = COALESCE($5, interest_rate_percentage),
    property_type = COALESCE($6, property_type),
    manufactured_home_width_type = COALESCE($7, manufactured_home_width_type),
    title_manner_type = COALESCE($8, title_manner_type)
WHERE id = $1
RETURNING id, deal_id, loan_purpose_type, loan_amount_requested, loan_term_months,
    interest_rate_percentage, property_type, manufactured_home_width_type, title_manner_type;
