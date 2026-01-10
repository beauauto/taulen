-- name: CreateApplicant :one
INSERT INTO applicants (
    loan_application_id, is_primary_applicant, first_name, last_name, middle_name,
    suffix, ssn, date_of_birth, years_school, marital_status, dependents_count,
    dependents_ages, citizenship_status, alien_registration_no, veteran_status,
    military_service_years, is_borrower_declining_info, ethnicity, ethnicity_other,
    race, race_other, gender
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
) RETURNING applicant_id, loan_application_id, is_primary_applicant, first_name, last_name, created_date;

-- name: GetApplicantByID :one
SELECT 
    applicant_id, loan_application_id, is_primary_applicant, first_name, middle_name,
    last_name, suffix, ssn, date_of_birth, years_school, marital_status,
    dependents_count, dependents_ages, citizenship_status, alien_registration_no,
    veteran_status, military_service_years, is_borrower_declining_info,
    ethnicity, ethnicity_other, race, race_other, gender, created_date, last_updated_date
FROM applicants
WHERE applicant_id = $1 LIMIT 1;

-- name: GetApplicantsByApplicationID :many
SELECT 
    applicant_id, loan_application_id, is_primary_applicant, first_name, middle_name,
    last_name, suffix, date_of_birth, marital_status, citizenship_status,
    created_date, last_updated_date
FROM applicants
WHERE loan_application_id = $1
ORDER BY is_primary_applicant DESC, created_date;

-- name: UpdateApplicant :one
UPDATE applicants
SET 
    first_name = COALESCE($2, first_name),
    middle_name = COALESCE($3, middle_name),
    last_name = COALESCE($4, last_name),
    suffix = COALESCE($5, suffix),
    ssn = COALESCE($6, ssn),
    date_of_birth = COALESCE($7, date_of_birth),
    years_school = COALESCE($8, years_school),
    marital_status = COALESCE($9, marital_status),
    dependents_count = COALESCE($10, dependents_count),
    dependents_ages = COALESCE($11, dependents_ages),
    citizenship_status = COALESCE($12, citizenship_status),
    alien_registration_no = COALESCE($13, alien_registration_no),
    veteran_status = COALESCE($14, veteran_status),
    military_service_years = COALESCE($15, military_service_years),
    is_borrower_declining_info = COALESCE($16, is_borrower_declining_info),
    ethnicity = COALESCE($17, ethnicity),
    ethnicity_other = COALESCE($18, ethnicity_other),
    race = COALESCE($19, race),
    race_other = COALESCE($20, race_other),
    gender = COALESCE($21, gender),
    last_updated_date = CURRENT_TIMESTAMP
WHERE applicant_id = $1
RETURNING applicant_id, loan_application_id, is_primary_applicant, first_name, last_name, created_date, last_updated_date;
