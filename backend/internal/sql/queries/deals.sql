-- name: CreateDeal :one
INSERT INTO deal (
    application_type, total_borrowers, application_date
) VALUES (
    $1, $2, CURRENT_DATE
) RETURNING id, loan_number, universal_loan_identifier, agency_case_identifier,
    application_type, total_borrowers, mismo_reference_model_identifier,
    about_version_identifier, application_date, created_at;

-- name: GetDealByID :one
SELECT id, loan_number, universal_loan_identifier, agency_case_identifier,
    application_type, total_borrowers, mismo_reference_model_identifier,
    about_version_identifier, application_date, created_at
FROM deal
WHERE id = $1 LIMIT 1;

-- name: GetDealByLoanNumber :one
SELECT id, loan_number, universal_loan_identifier, agency_case_identifier,
    application_type, total_borrowers, mismo_reference_model_identifier,
    about_version_identifier, application_date, created_at
FROM deal
WHERE loan_number = $1 LIMIT 1;

-- name: ListDeals :many
SELECT id, loan_number, universal_loan_identifier, application_type,
    total_borrowers, application_date, created_at
FROM deal
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateDeal :one
UPDATE deal
SET 
    loan_number = COALESCE($2, loan_number),
    universal_loan_identifier = COALESCE($3, universal_loan_identifier),
    agency_case_identifier = COALESCE($4, agency_case_identifier),
    application_type = COALESCE($5, application_type),
    total_borrowers = COALESCE($6, total_borrowers)
WHERE id = $1
RETURNING id, loan_number, universal_loan_identifier, agency_case_identifier,
    application_type, total_borrowers, application_date, created_at;
