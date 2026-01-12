-- name: CreateBorrower :one
INSERT INTO borrower (
    email_address, password_hash, first_name, last_name
) VALUES (
    $1, $2, $3, $4
) RETURNING id, email_address, password_hash, email_verified, email_verification_token,
    email_verification_expires_at, password_reset_token, password_reset_expires_at,
    last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at,
    mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
    first_name, middle_name, last_name, suffix, taxpayer_identifier_type,
    taxpayer_identifier_value, birth_date, citizenship_residency_type, marital_status,
    dependent_count, dependent_ages, home_phone, mobile_phone, work_phone,
    work_phone_extension, created_at, updated_at;

-- name: GetBorrowerByID :one
SELECT id, email_address, password_hash, email_verified, email_verification_token,
    email_verification_expires_at, password_reset_token, password_reset_expires_at,
    last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at,
    mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
    first_name, middle_name, last_name, suffix, taxpayer_identifier_type,
    taxpayer_identifier_value, birth_date, citizenship_residency_type, marital_status,
    dependent_count, dependent_ages, home_phone, mobile_phone, work_phone,
    work_phone_extension, created_at, updated_at
FROM borrower
WHERE id = $1 LIMIT 1;

-- name: GetBorrowerByEmail :one
SELECT id, email_address, password_hash, email_verified, email_verification_token,
    email_verification_expires_at, password_reset_token, password_reset_expires_at,
    last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at,
    mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
    first_name, middle_name, last_name, suffix, taxpayer_identifier_type,
    taxpayer_identifier_value, birth_date, citizenship_residency_type, marital_status,
    dependent_count, dependent_ages, home_phone, mobile_phone, work_phone,
    work_phone_extension, created_at, updated_at
FROM borrower
WHERE LOWER(email_address) = LOWER($1) AND email_address IS NOT NULL LIMIT 1;

-- name: UpdateBorrower :one
UPDATE borrower
SET 
    first_name = COALESCE($2, first_name),
    middle_name = COALESCE($3, middle_name),
    last_name = COALESCE($4, last_name),
    suffix = COALESCE($5, suffix),
    taxpayer_identifier_type = COALESCE($6, taxpayer_identifier_type),
    taxpayer_identifier_value = COALESCE($7, taxpayer_identifier_value),
    birth_date = COALESCE($8, birth_date),
    citizenship_residency_type = COALESCE($9, citizenship_residency_type),
    marital_status = COALESCE($10, marital_status),
    dependent_count = COALESCE($11, dependent_count),
    dependent_ages = COALESCE($12, dependent_ages),
    home_phone = COALESCE($13, home_phone),
    mobile_phone = COALESCE($14, mobile_phone),
    work_phone = COALESCE($15, work_phone),
    work_phone_extension = COALESCE($16, work_phone_extension),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id, email_address, first_name, middle_name, last_name, suffix,
    taxpayer_identifier_type, taxpayer_identifier_value, birth_date,
    citizenship_residency_type, marital_status, dependent_count, dependent_ages,
    home_phone, mobile_phone, work_phone, work_phone_extension, created_at, updated_at;
