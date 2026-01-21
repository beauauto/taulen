-- name: CreateEmployment :one
INSERT INTO employment (
    borrower_id, employment_status, employer_name, employer_phone,
    employer_address_line_text, employer_city, employer_state_code, employer_postal_code,
    position_title, start_date, end_date, years_in_line_of_work_years, years_in_line_of_work_months,
    self_employed_indicator, ownership_share_percentage, employed_by_family_or_party_indicator
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
) RETURNING id, borrower_id, employment_status, employer_name, position_title, start_date;

-- name: GetEmploymentsByBorrowerID :many
SELECT 
    id, borrower_id, employment_status, employer_name, employer_phone,
    employer_address_line_text, employer_city, employer_state_code, employer_postal_code,
    position_title, start_date, end_date, years_in_line_of_work_years, years_in_line_of_work_months,
    self_employed_indicator, ownership_share_percentage, employed_by_family_or_party_indicator
FROM employment
WHERE borrower_id = $1
ORDER BY start_date DESC;

-- name: UpdateEmployment :one
UPDATE employment
SET 
    employment_status = COALESCE($2, employment_status),
    employer_name = COALESCE($3, employer_name),
    employer_phone = COALESCE($4, employer_phone),
    employer_address_line_text = COALESCE($5, employer_address_line_text),
    employer_city = COALESCE($6, employer_city),
    employer_state_code = COALESCE($7, employer_state_code),
    employer_postal_code = COALESCE($8, employer_postal_code),
    position_title = COALESCE($9, position_title),
    start_date = COALESCE($10, start_date),
    end_date = COALESCE($11, end_date),
    years_in_line_of_work_years = COALESCE($12, years_in_line_of_work_years),
    years_in_line_of_work_months = COALESCE($13, years_in_line_of_work_months),
    self_employed_indicator = COALESCE($14, self_employed_indicator),
    ownership_share_percentage = COALESCE($15, ownership_share_percentage),
    employed_by_family_or_party_indicator = COALESCE($16, employed_by_family_or_party_indicator)
WHERE id = $1
RETURNING id, borrower_id, employment_status, employer_name, position_title, start_date;

-- name: DeleteEmployment :exec
DELETE FROM employment
WHERE id = $1;
