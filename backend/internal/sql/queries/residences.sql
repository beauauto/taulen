-- name: CreateResidence :one
INSERT INTO residences (
    applicant_id, street_address, unit_number, city, state, zip_code,
    is_current_residence, start_date, end_date, housing_type, monthly_housing_payment
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
) RETURNING residence_id, applicant_id, is_current_residence, start_date, created_date;

-- name: GetResidencesByApplicantID :many
SELECT 
    residence_id, applicant_id, street_address, unit_number, city, state, zip_code,
    is_current_residence, start_date, end_date, housing_type, monthly_housing_payment,
    created_date, last_updated_date
FROM residences
WHERE applicant_id = $1
ORDER BY is_current_residence DESC, start_date DESC;

-- name: UpdateResidence :one
UPDATE residences
SET 
    street_address = COALESCE($2, street_address),
    unit_number = COALESCE($3, unit_number),
    city = COALESCE($4, city),
    state = COALESCE($5, state),
    zip_code = COALESCE($6, zip_code),
    is_current_residence = COALESCE($7, is_current_residence),
    start_date = COALESCE($8, start_date),
    end_date = COALESCE($9, end_date),
    housing_type = COALESCE($10, housing_type),
    monthly_housing_payment = COALESCE($11, monthly_housing_payment),
    last_updated_date = CURRENT_TIMESTAMP
WHERE residence_id = $1
RETURNING residence_id, applicant_id, is_current_residence, start_date, created_date, last_updated_date;

-- name: DeleteResidence :exec
DELETE FROM residences
WHERE residence_id = $1;
