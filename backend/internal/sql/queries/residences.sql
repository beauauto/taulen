-- name: CreateResidence :one
INSERT INTO residence (
    borrower_id, residency_type, residency_basis_type, address_line_text, city_name,
    state_code, postal_code, country_code, unit_number, duration_years, duration_months, monthly_rent_amount
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
) RETURNING id, borrower_id, residency_type, residency_basis_type, address_line_text, city_name;

-- name: GetResidencesByBorrowerID :many
SELECT 
    id, borrower_id, residency_type, residency_basis_type, address_line_text, city_name,
    state_code, postal_code, country_code, unit_number, duration_years, duration_months, monthly_rent_amount
FROM residence
WHERE borrower_id = $1
ORDER BY 
    CASE residency_type 
        WHEN 'BorrowerCurrentResidence' THEN 1 
        WHEN 'BorrowerMailingAddress' THEN 2 
        ELSE 3 
    END;

-- name: UpdateResidence :one
UPDATE residence
SET 
    residency_type = COALESCE($2, residency_type),
    residency_basis_type = COALESCE($3, residency_basis_type),
    address_line_text = COALESCE($4, address_line_text),
    city_name = COALESCE($5, city_name),
    state_code = COALESCE($6, state_code),
    postal_code = COALESCE($7, postal_code),
    country_code = COALESCE($8, country_code),
    unit_number = COALESCE($9, unit_number),
    duration_years = COALESCE($10, duration_years),
    duration_months = COALESCE($11, duration_months),
    monthly_rent_amount = COALESCE($12, monthly_rent_amount)
WHERE id = $1
RETURNING id, borrower_id, residency_type, residency_basis_type, address_line_text, city_name;

-- name: DeleteResidence :exec
DELETE FROM residence
WHERE id = $1;
