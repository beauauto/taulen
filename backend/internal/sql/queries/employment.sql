-- name: CreateEmployment :one
INSERT INTO employments (
    applicant_id, employer_name, street_address, city, state, zip_code,
    phone_number, position, employment_type, start_date, end_date,
    years_at_employer, monthly_income
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
) RETURNING employment_id, applicant_id, employer_name, position, start_date, created_date;

-- name: GetEmploymentsByApplicantID :many
SELECT 
    employment_id, applicant_id, employer_name, street_address, city, state, zip_code,
    phone_number, position, employment_type, start_date, end_date,
    years_at_employer, monthly_income, created_date, last_updated_date
FROM employments
WHERE applicant_id = $1
ORDER BY start_date DESC;

-- name: UpdateEmployment :one
UPDATE employments
SET 
    employer_name = COALESCE($2, employer_name),
    street_address = COALESCE($3, street_address),
    city = COALESCE($4, city),
    state = COALESCE($5, state),
    zip_code = COALESCE($6, zip_code),
    phone_number = COALESCE($7, phone_number),
    position = COALESCE($8, position),
    employment_type = COALESCE($9, employment_type),
    start_date = COALESCE($10, start_date),
    end_date = COALESCE($11, end_date),
    years_at_employer = COALESCE($12, years_at_employer),
    monthly_income = COALESCE($13, monthly_income),
    last_updated_date = CURRENT_TIMESTAMP
WHERE employment_id = $1
RETURNING employment_id, applicant_id, employer_name, position, start_date, created_date, last_updated_date;

-- name: DeleteEmployment :exec
DELETE FROM employments
WHERE employment_id = $1;
