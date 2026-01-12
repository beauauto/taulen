-- name: CreateUser :one
INSERT INTO "user" (
    email_address, password_hash, first_name, last_name, user_role, user_type
) VALUES (
    $1, $2, $3, $4, $5, 'employee'
) RETURNING id, email_address, password_hash, email_verified, email_verification_token,
    email_verification_expires_at, password_reset_token, password_reset_expires_at,
    last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at,
    mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
    first_name, last_name, phone, user_role, user_type, status, created_at, updated_at;

-- name: GetUserByID :one
SELECT id, email_address, password_hash, email_verified, email_verification_token,
    email_verification_expires_at, password_reset_token, password_reset_expires_at,
    last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at,
    mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
    first_name, last_name, phone, user_role, user_type, status, created_at, updated_at
FROM "user"
WHERE id = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT id, email_address, password_hash, email_verified, email_verification_token,
    email_verification_expires_at, password_reset_token, password_reset_expires_at,
    last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at,
    mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
    first_name, last_name, phone, user_role, user_type, status, created_at, updated_at
FROM "user"
WHERE LOWER(email_address) = LOWER($1) LIMIT 1;

-- name: UpdateUser :one
UPDATE "user"
SET 
    first_name = COALESCE($2, first_name),
    last_name = COALESCE($3, last_name),
    phone = COALESCE($4, phone),
    user_role = COALESCE($5, user_role),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id, email_address, first_name, last_name, phone, user_role, user_type, status, created_at, updated_at;

-- name: UpdateUserPassword :exec
UPDATE "user"
SET password_hash = $2, last_password_change_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE id = $1;

-- name: UpdateUserStatus :exec
UPDATE "user"
SET status = $2, updated_at = CURRENT_TIMESTAMP
WHERE id = $1;

-- name: ListUsers :many
SELECT id, email_address, first_name, last_name, phone, user_role, user_type, status, created_at, updated_at
FROM "user"
WHERE ($1::text IS NULL OR user_role = $1)
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
